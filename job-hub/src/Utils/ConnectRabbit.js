
import amqplib from "amqplib";

const RABBIT_URL = "amqp://guest:guest@localhost:5672";
const QUEUE_NAME = "logQueue";

let RabbitChannel;

const ConnectRabbit = async () => {
  if (RabbitChannel) return RabbitChannel;

  const conn = await amqplib.connect(RABBIT_URL);
  RabbitChannel = await conn.createChannel();
  await RabbitChannel.assertQueue(QUEUE_NAME, { durable: true });

  conn.on("close", () => {
    console.log("RabbitMQ connection closed");
    RabbitChannel = null;
  });

  conn.on("error", (err) => console.error("RabbitMQ error:", err));

  console.log("RabbitMQ connected and queue asserted");

  return RabbitChannel;
};

const getRabbit = async () => {
  if (RabbitChannel) return RabbitChannel
  return ConnectRabbit()
}


export { ConnectRabbit, getRabbit }

