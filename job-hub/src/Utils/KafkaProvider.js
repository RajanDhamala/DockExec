import { Kafka } from "kafkajs";

const kafka = new Kafka({
    clientId: 'my-app',
    brokers: ['192.168.18.26:29092']
})

const producer = kafka.producer()
const consumer = kafka.consumer({ groupId: "dock-exec" })

const initkafka = async () => {
    try {
        await producer.connect();
        await consumer.connect()
        console.log("conncetion with the broker established");
    } catch (err) {
        console.log("failed to connect with broker");
        throw err
    }
}
export {
    initkafka,
    producer,
    consumer,
    kafka
}
