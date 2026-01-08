
import amqplib from "amqplib";

const RABBIT_URL = "amqp://guest:guest@localhost:5672";

let RabbitChannel = null;
let RabbitConnection = null;

const connectRabbit = async () => {
  if (RabbitChannel) return RabbitChannel;

  try {
    RabbitConnection = await amqplib.connect(RABBIT_URL);
    RabbitChannel = await RabbitConnection.createChannel();

    console.log("RabbitMQ connected");

    RabbitConnection.on("close", () => {
      console.warn("RabbitMQ connection closed");
      RabbitChannel = null;
      RabbitConnection = null;
    });

    RabbitConnection.on("error", (err) => {
      console.error("RabbitMQ error:", err);
    });

    return RabbitChannel;
  } catch (err) {
    console.error("Failed to connect to RabbitMQ:", err);
    await new Promise((res) => setTimeout(res, 5000)); // retry delay
    return connectRabbit();
  }
};

const getRabbit = async () => {
  if (RabbitChannel) return RabbitChannel;
  return connectRabbit();
};

// Optional: export raw connection too if needed
export { connectRabbit, getRabbit, RabbitChannel, RabbitConnection };

