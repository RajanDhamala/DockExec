import docker

client = docker.from_env()

def run_code_in_sandbox(job_id, language, code_path):
    image = "python:3.10" if language == "python" else "node:20"
    container = client.containers.run(
        image=image,
        command=f"{language} {code_path}",
        volumes={f"./sandboxes/{job_id}": {'bind': '/sandbox', 'mode': 'rw'}},
        network_mode="bridge",
        detach=True
    )
    result = container.logs(stdout=True, stderr=True)
    container.remove()
    return result.decode()
