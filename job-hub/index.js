import app from "./app.js";
import dotenv from "dotenv";
import http from "http";
import { initSocket } from "./src/Utils/SocketProvider.js";
import setupSocketHandlers from "./src/Utils/Socket.js";
import ConnectDb from "./src/Utils/ConnectDb.js";

dotenv.config({ quiet: true });

const PORT = process.env.PORT || 8000;

const server = http.createServer(app);

const io = initSocket(server);
setupSocketHandlers()

await ConnectDb();

// Start server
server.listen(PORT, () => {
  console.log(` Server is running on port ${PORT}`);
});
