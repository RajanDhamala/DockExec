import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import cors from "cors";
import UserRouter from "./src/Routes/UserRoute.js"
import { producer,consumer,initkafka } from "./src/Utils/KafkaProvider.js";

dotenv.config();
const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost",
  credentials: true
}));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

initkafka().catch(()=>process.exit(1))

app.get("/", (req, res) => {
  res.send("Server is up and running");
});

app.use((err, req, res, next) => {
  res.status(500).json({ error: "Internal Server Error" });
});

app.use("/users",UserRouter)

export default app;

if (process.env.NODE_ENV !== "test") {
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => {
    console.log(`Express server running on port ${PORT}`);
  });
}
