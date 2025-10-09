import json
from kafka import KafkaConsumer, KafkaProducer

# Kafka setup
consumer = KafkaConsumer(
    'job_requests',
    bootstrap_servers='localhost:29092', 
    group_id='worker-bee',
    auto_offset_reset='earliest'
)

producer = KafkaProducer(
    bootstrap_servers='localhost:29092',  
    value_serializer=lambda v: json.dumps(v).encode('utf-8')
)
print("WorkerBee Kafka test running... Waiting for jobs.")

# Consume messages and just print them
for message in consumer:
    job = json.loads(message.value.decode())
    print("Received job:", job)

    # Dummy response
    producer.send('job_results', {
        'jobId': job.get('jobId', 'test'),
        'output': "Docker execution skipped",
        'status': 'skipped'
    })
