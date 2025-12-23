import json
import time
import threading
import re
from kafka import KafkaConsumer, KafkaProducer, errors
from judge import SafetyChecker
from Ready import PROBLEM_TEMPLATES
import io
import sys

# ----------------------------------------------------------------------
# Kafka setup (shared for all consumers)
# ----------------------------------------------------------------------
consumer = None
producer = None
checker = SafetyChecker()


def clean_user_code(code, language):
    """Remove struct definitions from user code"""
    if language == "c":
        # Remove struct ListNode definition
        lines = code.split('\n')
        cleaned_lines = []
        in_struct = False

        for line in lines:
            stripped = line.strip()
            if stripped.startswith('struct ListNode {'):
                in_struct = True
                continue
            elif in_struct and stripped == '};':
                in_struct = False
                continue
            elif not in_struct:
                cleaned_lines.append(line)

        return '\n'.join(cleaned_lines)
    return code


while not consumer:
    try:
        consumer = KafkaConsumer(
            'programiz_submission',
            bootstrap_servers='192.168.2.140:29092',
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
            bootstrap_servers='192.168.2.140:29092',
            value_serializer=lambda v: json.dumps(v).encode('utf-8')
        )
        print("Connected to Kafka broker (producer).")
    except errors.NoBrokersAvailable:
        print("Kafka producer not available. Retrying in 5s...")
        time.sleep(5)

print("WorkerBee running... Waiting for jobs.")

# ----------------------------------------------------------------------
# Safe built-ins whitelist
# ----------------------------------------------------------------------
safe_builtins = {
    "print": print,
    "len": len,
    "range": range,
    "str": str,
    "int": int,
    "float": float,
    "bool": bool,
}

# ----------------------------------------------------------------------
# PRINT-SUPPRESSION
# ----------------------------------------------------------------------


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

# ----------------------------------------------------------------------
# PARSE AND FORMAT TEST VARIABLES (WORKS FOR ALL 14 PROBLEMS)
# ----------------------------------------------------------------------


def parse_and_format_test_variables(test_input, language):
    """Parse test input and format for specific language - works for all 14 problems"""
    if not test_input:
        return ""

    try:
        # Split by comma but handle arrays and strings properly
        parts = []
        current_part = ""
        bracket_count = 0
        quote_count = 0
        in_string = False

        i = 0
        while i < len(test_input):
            char = test_input[i]

            if char == '"' and (i == 0 or test_input[i-1] != '\\'):
                in_string = not in_string
            elif char == '[' and not in_string:
                bracket_count += 1
            elif char == ']' and not in_string:
                bracket_count -= 1
            elif char == ',' and bracket_count == 0 and not in_string:
                parts.append(current_part.strip())
                current_part = ""
                i += 1
                continue

            current_part += char
            i += 1

        if current_part.strip():
            parts.append(current_part.strip())

        # Parse each variable assignment
        formatted_vars = []
        for part in parts:
            if '=' in part:
                key, value = part.split('=', 1)
                key = key.strip()
                value = value.strip()

                # Format for specific language
                if language == "python":
                    formatted_vars.append(f"{key} = {value}")

                elif language == "javascript":
                    formatted_vars.append(f"const {key} = {value};")

                elif language == "java":
                    # Handle different data types for Java
                    if value.startswith('[') and value.endswith(']'):
                        # Array handling
                        java_array = value.replace('[', '{').replace(']', '}')
                        if key in ['nums', 'nums1', 'nums2', 'l1', 'l2', 'head']:
                            formatted_vars.append(
                                f"int[] {key} = {java_array};")
                        elif key in ['s'] and value.startswith("['") and value.endswith("']"):
                            # Character array like ['h','e','l','l','o']
                            char_array = java_array.replace(
                                "'", "'").replace("'", "'")
                            formatted_vars.append(
                                f"char[] {key} = {char_array};")
                        else:
                            formatted_vars.append(
                                f"int[] {key} = {java_array};")
                    elif value.startswith('"') and value.endswith('"'):
                        # String
                        formatted_vars.append(f"String {key} = {value};")
                    elif value.replace('.', '').replace('-', '').isdigit():
                        # Number
                        if '.' in value:
                            formatted_vars.append(f"double {key} = {value};")
                        else:
                            formatted_vars.append(f"int {key} = {value};")
                    else:
                        formatted_vars.append(f"var {key} = {value};")

                elif language == "go":
                    # Handle different data types for Go
                    if value.startswith('[') and value.endswith(']'):
                        # Array handling
                        inner_content = value[1:-1]  # Remove brackets
                        if value.startswith("['") and value.endswith("']"):
                            # Character array/byte slice
                            go_array = f"[]byte{{{inner_content}}}"
                        else:
                            # Integer array
                            go_array = f"[]int{{{inner_content}}}"
                        formatted_vars.append(f"{key} := {go_array}")
                    elif value.startswith('"') and value.endswith('"'):
                        # String
                        formatted_vars.append(f"{key} := {value}")
                    else:
                        # Number or other
                        formatted_vars.append(f"{key} := {value}")

                elif language == "c":
                    # Handle different data types for C
                    if value.startswith('[') and value.endswith(']'):
                        # Array handling
                        c_array = value.replace('[', '{').replace(']', '}')
                        array_elements = value[1:-
                                               1].split(',') if value != '[]' else []
                        array_size = len(array_elements) if array_elements != [
                            ''] else 0

                        # Use correct parameter names for C functions
                        if key == 'nums':
                            formatted_vars.append(f"int {key}[] = {c_array};")
                            formatted_vars.append(
                                f"int numsSize = {array_size};")
                        elif key == 'nums1':
                            formatted_vars.append(f"int {key}[] = {c_array};")
                            formatted_vars.append(
                                f"int nums1Size = {array_size};")
                        elif key == 'nums2':
                            formatted_vars.append(f"int {key}[] = {c_array};")
                            formatted_vars.append(
                                f"int nums2Size = {array_size};")
                        elif key in ['l1', 'l2', 'head']:
                            formatted_vars.append(f"int {key}[] = {c_array};")
                            formatted_vars.append(
                                f"int {key}_size = {array_size};")
                        elif key == 's' and value.startswith("['") and value.endswith("']"):
                            # Character array like ['h','e','l','l','o']
                            formatted_vars.append(f"char {key}[] = {c_array};")
                            formatted_vars.append(
                                f"int {key}_size = {array_size};")
                        else:
                            # Default integer array
                            formatted_vars.append(f"int {key}[] = {c_array};")
                            formatted_vars.append(
                                f"int {key}_size = {array_size};")
                    elif value.startswith('"') and value.endswith('"'):
                        # String
                        formatted_vars.append(f"char* {key} = {value};")
                    elif value.replace('.', '').replace('-', '').isdigit():
                        # Number
                        if '.' in value:
                            formatted_vars.append(f"double {key} = {value};")
                        else:
                            formatted_vars.append(f"int {key} = {value};")
                    else:
                        formatted_vars.append(f"int {key} = {value};")

        result = '\n'.join(formatted_vars)
        print(f"Parsed test variables for {language}: {result}")
        return result

    except Exception as e:
        print(f"Error parsing test variables: {e}")
        return f"// Error parsing test input: {test_input}"
    """Parse test input and format for specific language - works for all 14 problems"""
    if not test_input:
        return ""

    try:
        # Split by comma but handle arrays and strings properly
        parts = []
        current_part = ""
        bracket_count = 0
        quote_count = 0
        in_string = False

        i = 0
        while i < len(test_input):
            char = test_input[i]

            if char == '"' and (i == 0 or test_input[i-1] != '\\'):
                in_string = not in_string
            elif char == '[' and not in_string:
                bracket_count += 1
            elif char == ']' and not in_string:
                bracket_count -= 1
            elif char == ',' and bracket_count == 0 and not in_string:
                parts.append(current_part.strip())
                current_part = ""
                i += 1
                continue

            current_part += char
            i += 1

        if current_part.strip():
            parts.append(current_part.strip())

        # Parse each variable assignment
        formatted_vars = []
        for part in parts:
            if '=' in part:
                key, value = part.split('=', 1)
                key = key.strip()
                value = value.strip()

                # Format for specific language
                if language == "python":
                    formatted_vars.append(f"{key} = {value}")

                elif language == "javascript":
                    formatted_vars.append(f"const {key} = {value};")

                elif language == "java":
                    # Handle different data types for Java
                    if value.startswith('[') and value.endswith(']'):
                        # Array handling
                        java_array = value.replace('[', '{').replace(']', '}')
                        if key in ['nums', 'nums1', 'nums2', 'l1', 'l2', 'head']:
                            formatted_vars.append(
                                f"int[] {key} = {java_array};")
                        elif key in ['s'] and value.startswith("['") and value.endswith("']"):
                            # Character array like ['h','e','l','l','o']
                            char_array = java_array.replace(
                                "'", "'").replace("'", "'")
                            formatted_vars.append(
                                f"char[] {key} = {char_array};")
                        else:
                            formatted_vars.append(
                                f"int[] {key} = {java_array};")
                    elif value.startswith('"') and value.endswith('"'):
                        # String
                        formatted_vars.append(f"String {key} = {value};")
                    elif value.replace('.', '').replace('-', '').isdigit():
                        # Number
                        if '.' in value:
                            formatted_vars.append(f"double {key} = {value};")
                        else:
                            formatted_vars.append(f"int {key} = {value};")
                    else:
                        formatted_vars.append(f"var {key} = {value};")

                elif language == "go":
                    # Handle different data types for Go
                    if value.startswith('[') and value.endswith(']'):
                        # Array handling
                        inner_content = value[1:-1]  # Remove brackets
                        if value.startswith("['") and value.endswith("']"):
                            # Character array/byte slice
                            go_array = f"[]byte{{{inner_content}}}"
                        else:
                            # Integer array
                            go_array = f"[]int{{{inner_content}}}"
                        formatted_vars.append(f"{key} := {go_array}")
                    elif value.startswith('"') and value.endswith('"'):
                        # String
                        formatted_vars.append(f"{key} := {value}")
                    else:
                        # Number or other
                        formatted_vars.append(f"{key} := {value}")

                elif language == "c":
                    # Handle different data types for C
                    if value.startswith('[') and value.endswith(']'):
                        # Array handling
                        c_array = value.replace('[', '{').replace(']', '}')
                        array_elements = value[1:-
                                               1].split(',') if value != '[]' else []
                        array_size = len(array_elements) if array_elements != [
                            ''] else 0

                        if value.startswith("['") and value.endswith("']"):
                            # Character array
                            formatted_vars.append(f"char {key}[] = {c_array};")
                            formatted_vars.append(
                                f"int {key}_size = {array_size};")
                        else:
                            # Integer array
                            formatted_vars.append(f"int {key}[] = {c_array};")
                            formatted_vars.append(
                                f"int {key}_size = {array_size};")
                    elif value.startswith('"') and value.endswith('"'):
                        # String
                        formatted_vars.append(f"char* {key} = {value};")
                    elif value.replace('.', '').replace('-', '').isdigit():
                        # Number
                        if '.' in value:
                            formatted_vars.append(f"double {key} = {value};")
                        else:
                            formatted_vars.append(f"int {key} = {value};")
                    else:
                        formatted_vars.append(f"int {key} = {value};")

        result = '\n'.join(formatted_vars)
        print(f"Parsed test variables for {language}: {result}")
        return result

    except Exception as e:
        print(f"Error parsing test variables: {e}")
        return f"// Error parsing test input: {test_input}"

# ----------------------------------------------------------------------
# WRAPPER GENERATION USING HARDCODED TEMPLATES
# ----------------------------------------------------------------------


def generate_wrapper(user_code, job_data, test_case, language, suppress_prints=False):
    """Generate wrapper using hardcoded templates from Ready.py"""

    # Extract function name from job data or problem data
    function_name = job_data.get("function_name", "")
    if not function_name:
        # Try to get from problem data
        problem = job_data.get("problem", {})
        function_name = problem.get("function_name", "")

    if not function_name:
        print("No function_name found in job data")
        return user_code

    # Get template for this function and language
    template = PROBLEM_TEMPLATES.get(function_name, {}).get(language, "")
    if not template:
        print(f"No template found for {function_name} in {language}")
        return user_code

       # 🚀 ADD THIS: Clean struct definitions from user code FIRST
    cleaned_code = clean_user_code(user_code, language)

    # Clean user code if prints should be suppressed
    if suppress_prints:
        cleaned_code = remove_user_prints(cleaned_code, language)

    # Replace user code in template
    wrapper = template.replace("{{USER_CODE}}", cleaned_code)

    # Parse test case input to format variables
    test_input = test_case.get("input", "") if test_case else ""
    test_variables = parse_and_format_test_variables(test_input, language)

    # Replace test variables
    wrapper = wrapper.replace("{{TEST_VARIABLES}}", test_variables)

    print(f"Generated wrapper for {function_name} in {language}")
    return wrapper


def publish_blocked_result(job_id, socket_id, reason, language, code, topic="blocked_exec"):
    result_data = {
        "id": job_id,
        "jobId": job_id,
        "status": "unsafe",
        "reason": reason,
        "output": None,
        "language": language,
        "code": code,
        "socketId": socket_id
    }
    try:
        producer.send(topic, result_data)
        producer.flush()
        print(f"Blocked job {job_id} published to {topic}. Reason: {reason}")
    except Exception as e:
        print(f"Failed to publish blocked job who are u {job_id}: {e}")

# ----------------------------------------------------------------------
# Consumer: job_requests (safety check only) - UNCHANGED AS REQUESTED
# ----------------------------------------------------------------------


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

        print("Received job for safety check:", job_id)

        is_safe = checker.check(code, language)
        reason = checker.reason()

        if is_safe:
            print(f"Job {job_id} is SAFE. Reason: {reason}")
            result_data = {
                "jobId": job_id,
                "status": "safe",
                "reason": reason,
                "output": None,
                "language": language,
                "code": code,
                "socketId": socketId
            }
            producer.send("programiz_execution", result_data)
            producer.flush()
        else:
            print(f"Job {job_id} is BLOCKED. Reason: {reason}")
            publish_blocked_result(job_id, socketId, reason, language, code)

# ----------------------------------------------------------------------
# Consumer: test_code (runner-bee - for test cases with print suppression)
# ----------------------------------------------------------------------


def consume_alltest_cases():
    run_consumer = None
    while not run_consumer:
        try:
            run_consumer = KafkaConsumer(
                'all_test_submission',
                bootstrap_servers='192.168.2.140:29092',
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
        except Exception as e:
            print("Invalid message on test_code:", e)
            continue

        code = job.get("code")
        language = job.get("language", "python")
        job_id = job.get("id", "unknown")
        problem = job.get("problem", {})
        testCases = problem.get("testCases", [])
        socket_id = job.get("socketId")
        userId = job.get("userId")
        problemId = job.get("problemId")
        print(f"Received test_code job {job_id} ({language}) with {
              len(testCases)} test cases")
        print("problemid:", problemId)
        # ---- safety check -------------------------------------------------
        is_safe = checker.check(code, language)
        reason = checker.reason()

        if not is_safe:
            print(f"Test case job {job_id} BLOCKED. Reason: {reason}")
            publish_blocked_result(job_id, socket_id, reason, language, code)
            continue

        # ---- generate wrapper for each test case (suppress prints) -------
        for i, tc in enumerate(testCases):
            wrapped = generate_wrapper(
                code, job, tc, language, suppress_prints=True)

            test_case_job = {
                "jobId": job_id,
                "testCaseId": f"{job_id}_test_{i+1}",
                "testCaseNumber": i + 1,
                "totalTestCases": len(testCases),
                "language": language,
                "input": tc.get("input"),
                "expected": tc.get("expected"),
                "wrappedCode": wrapped,
                "originalCode": code,
                "problem": problem,
                "status": "ready_for_execution",
                "socketId": socket_id,
                "userId": userId,
                "problemId": problemId
            }

            try:
                producer.send("all_test_execution", test_case_job)
                producer.flush()
                print(f"Published test case {
                      i+1} -> {test_case_job['testCaseId']}")
            except Exception as e:
                print(f"Failed to publish test case {i+1}: {e}")

        print(f"Finished job {job_id} – {
              len(testCases)} test cases dispatched")

# ----------------------------------------------------------------------
# Consumer: Runs_code (direct execution - prints allowed)
# ----------------------------------------------------------------------


def consume_printone_case():
    run_consumer = None
    while not run_consumer:
        try:
            run_consumer = KafkaConsumer(
                'print_test_submission',
                bootstrap_servers='192.168.2.140:29092',
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
        problem = job.get("problem")
        test_case = job.get("testCase", {})
        socket_id = job.get("socketId")

        print(f"Received direct run_code job {job_id} ({language})")

        # ---- safety -------------------------------------------------------
        is_safe = checker.check(code, language)
        reason = checker.reason()

        if not is_safe:
            print(f"Direct run job {job_id} BLOCKED. Reason: {reason}")
            publish_blocked_result(job_id, socket_id, reason, language, code)
            continue

        # ---- generate wrapper (preserve prints) ---------------------------
        wrapped = generate_wrapper(
            code, job, test_case, language, suppress_prints=False)

        structured_job = {
            "jobId": job_id,
            "socketId": socket_id,
            "code": wrapped,
            "language": language
        }

        producer.send("print_test_execution", structured_job)
        producer.flush()
        print("Direct run job forwarded to executor.")


# ----------------------------------------------------------------------
# Start all consumers in parallel
# ----------------------------------------------------------------------
threading.Thread(target=consume_programmiz_requests, daemon=True).start()
threading.Thread(target=consume_alltest_cases, daemon=True).start()
threading.Thread(target=consume_printone_case, daemon=True).start()

# Keep the main thread alive
while True:
    time.sleep(60)
