import json
import time
import threading
import re
from kafka import KafkaConsumer, KafkaProducer, errors
from judge import SafetyChecker
from wrapper import SIMPLE_WRAPPER_TEMPLATE, LINKEDLIST_WRAPPER_TEMPLATE
import io
import sys

# Kafka setup (shared for all consumers)
consumer = None
producer = None
checker = SafetyChecker()

while not consumer:
    try:
        # job_requests direcly executes raw user code no test cases
        consumer = KafkaConsumer(
            'programiz_submission',
            bootstrap_servers='192.168.18.26:29092',
            group_id='worker-bee',
            auto_offset_reset='earliest'
        )
        print("Connected to Kafka broker (consumer - job_requests).")
    except errors.NoBrokersAvailable:
        print("Kafka broker not available. Retrying in 5s...")
        time.sleep(5)

while not producer:
    try:
        producer = KafkaProducer(
            bootstrap_servers='192.168.18.26:29092',
            value_serializer=lambda v: json.dumps(v).encode('utf-8')
        )
        print("Connected to Kafka broker (producer).")
    except errors.NoBrokersAvailable:
        print("Kafka producer not available. Retrying in 5s...")
        time.sleep(5)

print("WorkerBee running... Waiting for jobs.")

# Safe built-ins whitelist
safe_builtins = {
    "print": print,
    "len": len,
    "range": range,
    "str": str,
    "int": int,
    "float": float,
    "bool": bool,
}

# PRINT-SUPPRESSION


def remove_user_prints(code, language):
    """Comment out user-level print statements for the given language."""
    if language == "python":
        lines = code.split('\n')
        cleaned = []
        for line in lines:
            stripped = line.strip()
            if stripped.startswith('print(') and not stripped.startswith('#'):
                cleaned.append(' # ' + line.strip() +
                               ' # Suppressed for test case')
            else:
                cleaned.append(line)
        return '\n'.join(cleaned)
    elif language == "javascript":
        lines = code.split('\n')
        cleaned = []
        for line in lines:
            stripped = line.strip()
            if 'console.log(' in stripped and not stripped.startswith('//'):
                cleaned.append(' // ' + line.strip() +
                               ' // Suppressed for test case')
            else:
                cleaned.append(line)
        return '\n'.join(cleaned)
    elif language == "go":
        lines = code.split('\n')
        cleaned = []
        for line in lines:
            stripped = line.strip()
            if 'fmt.Println(' in stripped and not stripped.startswith('//'):
                cleaned.append(' // ' + line.strip() +
                               ' // Suppressed for test case')
            else:
                cleaned.append(line)
        return '\n'.join(cleaned)
    elif language == "java":
        lines = code.split('\n')
        cleaned = []
        for line in lines:
            stripped = line.strip()
            if 'System.out.print' in stripped and not stripped.startswith('//'):
                cleaned.append(' // ' + line.strip() +
                               ' // Suppressed for test case')
            else:
                cleaned.append(line)
        return '\n'.join(cleaned)
    elif language == "c":
        lines = code.split('\n')
        cleaned = []
        for line in lines:
            stripped = line.strip()
            if 'printf(' in stripped and not stripped.startswith('//'):
                cleaned.append(' // ' + line.strip() +
                               ' // Suppressed for test case')
            else:
                cleaned.append(line)
        return '\n'.join(cleaned)
    return code


def parse_test_input(input_str, language):
    """Parse test case input safely."""
    if not input_str:
        return {}

    test_vars = {}

    try:
        # Split by commas, but handle arrays properly
        parts = []
        current_part = ""
        bracket_count = 0

        for char in input_str:
            if char == '[':
                bracket_count += 1
            elif char == ']':
                bracket_count -= 1
            elif char == ',' and bracket_count == 0:
                parts.append(current_part.strip())
                current_part = ""
                continue

            current_part += char

        if current_part.strip():
            parts.append(current_part.strip())

        # Parsing each part
        for part in parts:
            if '=' in part:
                key, value = part.split('=', 1)
                test_vars[key.strip()] = value.strip()

    except Exception as e:
        print(f"Error parsing test input: {e}")
        return {}

    return test_vars


def format_test_variables(test_vars, language):
    """Convert test variables to language-specific format."""
    if not test_vars:
        return ""

    lines = []
    for key, value in test_vars.items():
        if language == "python":
            lines.append(f"{key} = {value}")
        elif language == "javascript":
            lines.append(f"const {key} = {value};")
        elif language == "java":
            if value.startswith('[') and value.endswith(']'):
                java_array = value.replace('[', '{').replace(']', '}')
                lines.append(f"int[] {key} = {java_array};")
            else:
                lines.append(f"var {key} = {value};")
        elif language == "go":
            if value.startswith('[') and value.endswith(']'):
                # FIX: Properly converting [5,2,3,1] to []int{5,2,3,1}
                inner_content = value[1:-1]  # Removing [ and ]
                go_array = f"[]int{{{inner_content}}}"  # Adding []int{ and }
                lines.append(f"{key} := {go_array}")
            else:
                lines.append(f"{key} := {value}")
        elif language == "c":
            lines.append(f"// {key} = {value}")

    return '\n'.join(lines)


def generate_simple_wrapper(user_code, function_name, parameters, test_case, language, suppress_prints):
    """Generate wrapper using SIMPLE_WRAPPER_TEMPLATE."""
    template = SIMPLE_WRAPPER_TEMPLATE.get(language, "")
    if not template:
        print(f"No simple template for language: {language}")
        return user_code

    # Parsing test case input
    test_vars = parse_test_input(test_case.get("input", ""), language)
    test_variables_str = format_test_variables(test_vars, language)

    # Generating function call
    function_call = f"{function_name}({', '.join(parameters)})"

    # Cleaning user code if suppressing prints
    cleaned_code = remove_user_prints(
        user_code, language) if suppress_prints else user_code

    # Replacing template placeholders
    wrapper = template.replace("{{USER_CODE}}", cleaned_code)
    wrapper = wrapper.replace("{{TEST_VARIABLES}}", test_variables_str)
    wrapper = wrapper.replace("{{FUNCTION_CALL}}", function_call)

    # Handling C language special case
    if language == "c":
        # Simplified C output
        c_function_call = f"printf(\"%d\\n\", {function_call});"
        wrapper = wrapper.replace("{{FUNCTION_CALL_C}}", c_function_call)

    return wrapper


def generate_linkedlist_wrapper(user_code, function_name, parameters, test_case, language, suppress_prints):
    """Generate wrapper for LinkedList problems."""
    # Checking if we have linkedlist templates
    if 'LINKEDLIST_WRAPPER_TEMPLATE' not in globals():
        print(f"LinkedList wrapper not implemented yet for {function_name}")
        return user_code

    template = LINKEDLIST_WRAPPER_TEMPLATE.get(language, "")
    if not template:
        print(f"No linkedlist template for language: {language}")
        return user_code

    # Parsing linkedlist input (e.g., "l1 = [2,4,3], l2 = [5,6,4]")
    test_vars = parse_test_input(test_case.get("input", ""), language)

    # Cleaning user code if suppressing prints
    cleaned_code = remove_user_prints(
        user_code, language) if suppress_prints else user_code

    # Generating linkedlist conversion code
    conversion_code = ""
    for key, value in test_vars.items():
        if language == "python":
            conversion_code += f"{key} = array_to_list({value})\n"

    # Generating function call
    function_call = f"{function_name}({', '.join(parameters)})"

    # Replacing template placeholders
    wrapper = template.replace("{{USER_CODE}}", cleaned_code)
    wrapper = wrapper.replace("{{LINKEDLIST_CONVERSIONS}}", conversion_code)
    wrapper = wrapper.replace("{{FUNCTION_CALL}}", function_call)

    return wrapper


def generate_wrapper(user_code, job_data, test_case, language, function_name, parameters, wrapper_type, suppress_prints=False):
    """Main wrapper generation function."""

    print(f"Generating wrapper: {function_name}, type: {
          wrapper_type}, language: {language}")

    if wrapper_type == "simple":
        return generate_simple_wrapper(user_code, function_name, parameters, test_case, language, suppress_prints)
    elif wrapper_type == "custom":
        # Checking if it's a linkedlist problem
        if function_name in ["addTwoNumbers", "reverseList", "mergeTwoLists"]:
            return generate_linkedlist_wrapper(user_code, function_name, parameters, test_case, language, suppress_prints)
        else:
            # Other custom types (Stack/Queue, etc.)
            print(f"Custom wrapper for {function_name} not implemented yet")
            return user_code
    else:
        print(f"Unknown wrapper type: {wrapper_type}")
        return user_code

# LEGACY FUNCTIONS (keeping for compatibility)


def format_for_language(key, value, language):
    """Legacy function - now handled by format_test_variables."""
    return ""


def wrap_user_code(code, language, template, test_case, suppress_prints=False):
    """Legacy wrapper function - replaced by generate_wrapper."""
    return code


def publish_blocked_result(result_data, topic="blocked_exec"):
    """
    result_data: dict containing all necessary fields like
                 jobId, socketId, reason, language, code, userId, etc.
    """
    try:
        producer.send(topic, result_data)
        producer.flush()
        print(f"Blocked job {result_data.get('jobId')} published to {
              topic}. Reason: {result_data.get('reason')}")
    except Exception as e:
        print(f"Failed to publish blocked job {result_data.get('jobId')}: {e}")


# Consumer: job_requests (safety check only)
def consume_programmiz_requests():
    for message in consumer:
        try:
            job = json.loads(message.value.decode())
        except Exception:
            print("Invalid message format on job_requests, skipping.")
            continue

        code = job.get('code')
        language = job.get('language', 'python')
        job_id = job.get('id', 'unknown')
        socketId = job.get("socketId")
        userId = job.get("userId")
        print("Received job for safety check:", job_id)

        is_safe = checker.check(code, language)
        reason = checker.reason()

        if is_safe:
            print(f"Job {job_id} is SAFE. Reason: {reason}")
            result_data = {
                "jobId": job_id,
                "language": language,
                "userId": userId,
                "code": code,
                "socketId": socketId
            }
            producer.send("programiz_execution", result_data)
            producer.flush()
        else:
            print(f"Job {job_id} is BLOCKED. Reason: {reason}")
            blocked_job = {
                "jobId": job_id,
                "socketId": socketId,
                "reason": reason,
                "language": language,
                "code": code,
                "userId": userId,
                "status": "unsafe"
            }
            publish_blocked_result(blocked_job)


# Consumer: test_code (creates per-test-case jobs with wrappers)
def consume_alltest_cases():
    run_consumer = None
    while not run_consumer:
        try:
            run_consumer = KafkaConsumer(
                'all_cases_submission',
                bootstrap_servers='192.168.18.26 :29092',
                group_id='runner-bee',
                auto_offset_reset='earliest'
            )
            print("Connected to Kafka broker (consumer - test_code).")
        except errors.NoBrokersAvailable:
            print("Kafka broker unavailable for test_code. Retrying in 5s...")
            time.sleep(5)

    for message in run_consumer:
        try:
            job = json.loads(message.value.decode())
            print("whole job data:", job)
        except Exception as e:
            print("Invalid message on test_code:", e)
            continue

        code = job.get("code")
        language = job.get("language", "python")
        job_id = job.get("id", "unknown")
        testCases = job.get("testCase", [])  # Getting from problem object
        socket_id = job.get("socketId")
        user_id = job.get("userId")
        problem_id = job.get("problemId")
        function_name = job.get("function_name")
        parameters = job.get("parameters")
        wrapper_type = job.get("wrapper_type")

        print(
            f"Received test_code job {job_id} ({language}) with {
                len(testCases)} test cases"
        )

        # -- safety check -------------------------------------------------
        is_safe = checker.check(code, language)
        reason = checker.reason()

        if not is_safe:
            print(f"Test case job {job_id} BLOCKED. Reason: {reason}")
            blocked_result = {
                "jobId": job_id,
                "socketId": socket_id,
                "problemId": problem_id,
                "userId": user_id,
                "language": language,
                "code": code,
                "reason": reason,
                "status": "unsafe",
            }
            publish_blocked_result(blocked_result)
            continue

        # generating wrapper for each test case
        for i, tc in enumerate(testCases):
            wrapped = generate_wrapper(
                code, job, tc, language, function_name, parameters, wrapper_type, suppress_prints=True
            )

            test_case_job = {
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
                "orginalCode": code if i == 0 else ""
            }
            print(tc.get('expected'))

            try:
                producer.send("all_test_execution", test_case_job)
                producer.flush()
                print("sending each test case", test_case_job.testCaseNumber)
            except Exception as e:
                print(f"Failed to publish test case {i+1}: {e}")

        print(
            f"Finished job {job_id} – {len(testCases)} test cases dispatched"
        )


# Consumer: Runs_code (direct execution with prints allowed)
def consume_printone_case():
    run_consumer = None
    while not run_consumer:
        try:
            run_consumer = KafkaConsumer(
                'print_test_submission',
                bootstrap_servers='192.168.18.26:29092',
                group_id='runner-bee',
                auto_offset_reset='earliest'
            )
            print("Connected to Kafka broker (consumer - Runs_code).")
        except errors.NoBrokersAvailable:
            print("Kafka broker unavailable for Runs_code. Retrying in 5s...")
            time.sleep(5)

    for message in run_consumer:
        try:
            job = json.loads(message.value.decode())
        except Exception as e:
            print("Invalid message on Runs_code:", e)
            continue

        code = job.get("code")
        language = job.get("language")
        job_id = job.get("id")
        test_case = job.get("testCase", {})
        socket_id = job.get("socketId")
        user_id = job.get("userId")
        function_name = job.get("function_name")
        parameters = job.get("parameters")
        wrapper_type = job.get("wrapper_type")
        problem_id = job.get("problemId")
        print("problem id is", problem_id)
        print(f"Received direct run_code job {job_id} ({language})")

        # -- safety -------------------------------------------------------
        is_safe = checker.check(code, language)
        reason = checker.reason()

        if not is_safe:
            print(f"Direct run job {job_id} BLOCKED. Reason: {reason}")
            blocked_result = {
                "jobId": job_id,
                "socketId": socket_id,
                "userId": user_id,
                "language": language,
                "code": code,
                "reason": reason,
                "status": "unsafe",
            }
            publish_blocked_result(blocked_result)
            continue

        # -- generating wrapper (preserve prints) ---------------------------
        wrapped = generate_wrapper(
            code, job, test_case, language,  function_name, parameters, wrapper_type, suppress_prints=False)

        structured_job = {
            "jobId": job_id,
            "socketId": socket_id,
            "code": wrapped,
            "language": language,
            "userId": user_id,
            "problemId": problem_id
        }
        print("problem is sent:", problem_id)
        print("language iz:", language)
        producer.send("print_test_execution", structured_job)
        producer.flush()
        print("print + only one test case allowed", structured_job)


# Starting all consumers in parallel
threading.Thread(target=consume_programmiz_requests, daemon=True).start()
threading.Thread(target=consume_alltest_cases, daemon=True).start()
threading.Thread(target=consume_printone_case, daemon=True).start()


# Keep the main thread alive
while True:
    time.sleep(60)
