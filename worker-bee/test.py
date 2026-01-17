
import json
import time
import threading
import pika
from judge import SafetyChecker
from wrapper import SIMPLE_WRAPPER_TEMPLATE, LINKEDLIST_WRAPPER_TEMPLATE

checker = SafetyChecker()


# ------------------------ RabbitMQ Setup ------------------------ #
def get_rabbitmq_connection():
    """
    Creates a new RabbitMQ connection and channel (thread-safe per consumer)
    """
    parameters = pika.ConnectionParameters(host='localhost')
    connection = pika.BlockingConnection(parameters)
    channel = connection.channel()

    # Declare exchange
    channel.exchange_declare(exchange='code_exchange', exchange_type='topic', durable=True)

    # Declare queues
    queues = {
        'programmiz_queue': 'programiz_submission',
        'all_test_queue': 'all_cases_submission',
        'print_test_queue': 'print_test_submission',
        'blocked_exec': 'blocked_execution'
    }

    for queue_name, routing_key in queues.items():
        channel.queue_declare(queue=queue_name, durable=True)
        channel.queue_bind(queue=queue_name, exchange='code_exchange', routing_key=routing_key)

    return connection, channel


def publish_message(channel, routing_key, message):
    """Publish a message to RabbitMQ"""
    channel.basic_publish(
        exchange='code_exchange',
        routing_key=routing_key,
        body=json.dumps(message),
        properties=pika.BasicProperties(delivery_mode=2)  # persistent
    )


# ------------------------ Utility Functions ------------------------ #
safe_builtins = {
    "print": print,
    "len": len,
    "range": range,
    "str": str,
    "int": int,
    "float": float,
    "bool": bool,
}


def remove_user_prints(code, language):
    """Comment out user-level print statements for the given language."""
    lines = code.split('\n')
    cleaned = []

    for line in lines:
        stripped = line.strip()
        if language == "python" and stripped.startswith('print('):
            cleaned.append(' # ' + line + ' # Suppressed for test case')
        elif language == "javascript" and 'console.log(' in stripped:
            cleaned.append(' // ' + line + ' // Suppressed for test case')
        elif language == "go" and 'fmt.Println(' in stripped:
            cleaned.append(' // ' + line + ' // Suppressed for test case')
        elif language == "java" and 'System.out.print' in stripped:
            cleaned.append(' // ' + line + ' // Suppressed for test case')
        elif language == "c" and 'printf(' in stripped:
            cleaned.append(' // ' + line + ' // Suppressed for test case')
        else:
            cleaned.append(line)

    return '\n'.join(cleaned)


def parse_test_input(input_str, language):
    """Parse test case input safely."""
    if not input_str:
        return {}

    test_vars = {}
    try:
        parts = []
        current = ""
        brackets = 0
        for char in input_str:
            if char == '[':
                brackets += 1
            elif char == ']':
                brackets -= 1
            elif char == ',' and brackets == 0:
                parts.append(current.strip())
                current = ""
                continue
            current += char
        if current.strip():
            parts.append(current.strip())

        for part in parts:
            if '=' in part:
                k, v = part.split('=', 1)
                test_vars[k.strip()] = v.strip()
    except Exception as e:
        print(f"Error parsing test input: {e}")
        return {}

    return test_vars


def format_test_variables(test_vars, language):
    """Convert test variables to language-specific format."""
    lines = []
    for key, value in test_vars.items():
        if language == "python":
            lines.append(f"{key} = {value}")
        elif language == "javascript":
            lines.append(f"const {key} = {value};")
        elif language == "java":
            if value.startswith('[') and value.endswith(']'):
                lines.append(f"int[] {key} = {value.replace('[', '{').replace(']', '}')};")
            else:
                lines.append(f"var {key} = {value};")
        elif language == "go":
            if value.startswith('[') and value.endswith(']'):
                inner = value[1:-1]
                lines.append(f"{key} := []int{{{inner}}}")
            else:
                lines.append(f"{key} := {value}")
        elif language == "c":
            lines.append(f"// {key} = {value}")
    return '\n'.join(lines)


# ------------------------ Wrapper Generators ------------------------ #
def generate_simple_wrapper(user_code, function_name, parameters, test_case, language, suppress_prints):
    template = SIMPLE_WRAPPER_TEMPLATE.get(language, "")
    if not template:
        return user_code

    test_vars = parse_test_input(test_case.get("input", ""), language)
    test_variables_str = format_test_variables(test_vars, language)
    function_call = f"{function_name}({', '.join(parameters)})"
    cleaned_code = remove_user_prints(user_code, language) if suppress_prints else user_code

    wrapper = template.replace("{{USER_CODE}}", cleaned_code)
    wrapper = wrapper.replace("{{TEST_VARIABLES}}", test_variables_str)
    wrapper = wrapper.replace("{{FUNCTION_CALL}}", function_call)
    if language == "c":
        c_function_call = f"printf(\"%d\\n\", {function_call});"
        wrapper = wrapper.replace("{{FUNCTION_CALL_C}}", c_function_call)
    return wrapper


def generate_linkedlist_wrapper(user_code, function_name, parameters, test_case, language, suppress_prints):
    template = LINKEDLIST_WRAPPER_TEMPLATE.get(language, "")
    if not template:
        return user_code

    test_vars = parse_test_input(test_case.get("input", ""), language)
    cleaned_code = remove_user_prints(user_code, language) if suppress_prints else user_code

    conversion_code = ""
    if language == "python":
        for key, value in test_vars.items():
            conversion_code += f"{key} = array_to_list({value})\n"

    function_call = f"{function_name}({', '.join(parameters)})"
    wrapper = template.replace("{{USER_CODE}}", cleaned_code)
    wrapper = wrapper.replace("{{LINKEDLIST_CONVERSIONS}}", conversion_code)
    wrapper = wrapper.replace("{{FUNCTION_CALL}}", function_call)
    return wrapper


def generate_wrapper(user_code, job_data, test_case, language, function_name, parameters, wrapper_type, suppress_prints=False):
    if wrapper_type == "simple":
        return generate_simple_wrapper(user_code, function_name, parameters, test_case, language, suppress_prints)
    elif wrapper_type == "custom":
        if function_name in ["addTwoNumbers", "reverseList", "mergeTwoLists"]:
            return generate_linkedlist_wrapper(user_code, function_name, parameters, test_case, language, suppress_prints)
        else:
            return user_code
    else:
        return user_code


# ------------------------ Consumers ------------------------ #
def programiz_consumer(_):
    connection, channel = get_rabbitmq_connection()

    def callback(ch, method, properties, body):
        job = json.loads(body)
        code = job.get('code')
        language = job.get('language', 'python')
        job_id = job.get('id', 'unknown')
        socketId = job.get('socketId')
        userId = job.get('userId')
        type=job.get("type")
        createdAt=job.get("createdAt")
        print("created tiem stamps did u get?:",createdAt) 
        print("the type of job iz:",type)
        print("i got the programiz_execution data")



        is_safe = checker.check(code, language)
        if is_safe:
            publish_message(ch, 'programiz_execution', {
                "jobId": job_id,
                "language": language,
                "userId": userId,
                "code": code,
                "socketId": socketId,
                "type":type,
                "createdAt":createdAt,
            })
            print("published the programmiz code for exe")
        else:
            publish_message(ch, 'blocked_execution', {
                "jobId": job_id,
                "socketId": socketId,
                "reason": checker.reason(),
                "language": language,
                "code": code,
                "userId": userId,
                "status": "unsafe",
                "type":type,
                "createdAt":createdAt,
            })
        ch.basic_ack(delivery_tag=method.delivery_tag)

    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(queue='programmiz_queue', on_message_callback=callback)
    channel.start_consuming()


def all_test_consumer(_):
    connection, channel = get_rabbitmq_connection()

    def callback(ch, method, properties, body):
        try:
            job = json.loads(body)
            print("this is for the whole testCases")
        except Exception as e:
            print("Invalid message on all_test_queue:", e)
            ch.basic_ack(delivery_tag=method.delivery_tag)
            return
        
        code = job.get("code")
        language = job.get("language", "python")
        job_id = job.get("id", "unknown")
        testCases = job.get("testCase", [])
        socket_id = job.get("socketId")
        user_id = job.get("userId")
        problem_id = job.get("problemId")
        function_name = job.get("function_name")
        parameters = job.get("parameters")
        wrapper_type = job.get("wrapper_type")
        type=job.get("type")
        createdAt=job.get("createdAt")


        is_safe = checker.check(code, language)
        if not is_safe:
            publish_message(channel, "blocked_execution", {
                "jobId": job_id,
                "socketId": socket_id,
                "problemId": problem_id,
                "userId": user_id,
                "language": language,
                "code": code,
                "reason": checker.reason(),
                "status": "unsafe",
                "type":type,
                "createdAt":createdAt
            })
            ch.basic_ack(delivery_tag=method.delivery_tag)
            return

        for i, tc in enumerate(testCases):
            wrapped = generate_wrapper(code, job, tc, language, function_name, parameters, wrapper_type, suppress_prints=True)
            publish_message(channel, "all_test_execution", {
                "jobId": job_id,
                "testCaseId": f"{job_id}_test_{i+1}",
                "testCaseNumber": i + 1,
                "totalTestCases": len(testCases),
                "language": language,
                "input": tc.get("input"),
                "expected": tc.get("expected"),
                "wrappedCode": wrapped,
                "socketId": socket_id,
                "userId": user_id,
                "problemId": problem_id,
                "orginalCode": code if i == 0 else "",
                "type":type,
                "createdAt":createdAt
            })
            print("wrapper genrated and sent",i)

        ch.basic_ack(delivery_tag=method.delivery_tag)

    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(queue="all_test_queue", on_message_callback=callback)
    channel.start_consuming()


def print_test_consumer(_):
    connection, channel = get_rabbitmq_connection()

    def callback(ch, method, properties, body):
        try:
            job = json.loads(body)
        except Exception as e:
            print("Invalid message on print_test_queue:", e)
            ch.basic_ack(delivery_tag=method.delivery_tag)
            return

        code = job.get("code")
        language = job.get("language", "python")
        job_id = job.get("id")
        test_case = job.get("testCase", {})
        socket_id = job.get("socketId")
        user_id = job.get("userId")
        function_name = job.get("function_name")
        parameters = job.get("parameters")
        wrapper_type = job.get("wrapper_type")
        type=job.get("type")
        problem_id = job.get("problemId")
        createdAt=job.get("createdAt")

        print("this is for the single conusmer btw")

        is_safe = checker.check(code, language)
        if not is_safe:
            publish_message(channel, "blocked_execution", {
                "jobId": job_id,
                "socketId": socket_id,
                "userId": user_id,
                "language": language,
                "code": code,
                "reason": checker.reason(),
                "status": "unsafe",
                "type":type,
                "createdAt":createdAt
            })
            ch.basic_ack(delivery_tag=method.delivery_tag)
            return

        wrapped = generate_wrapper(code, job, test_case, language, function_name, parameters, wrapper_type, suppress_prints=False)
        publish_message(channel, "print_test_execution", {
            "jobId": job_id,
            "socketId": socket_id,
            "wrappedCode": wrapped,
            "language": language,
            "userId": user_id,
            "problemId": problem_id,
            "type":type,
            "createdAt":createdAt
        })
        print("createdat emited:",createdAt)

        ch.basic_ack(delivery_tag=method.delivery_tag)

    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(queue="print_test_queue", on_message_callback=callback)
    channel.start_consuming()


# ------------------------ Start Consumers ------------------------ #
threading.Thread(target=lambda: programiz_consumer(None), daemon=True).start()
threading.Thread(target=lambda: all_test_consumer(None), daemon=True).start()
threading.Thread(target=lambda: print_test_consumer(None), daemon=True).start()

print("RabbitMQ WorkerBee running...")

# Keep main thread alive
while True:
    time.sleep(60)
