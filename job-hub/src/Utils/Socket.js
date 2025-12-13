import {getIO } from "./SocketProvider.js";

const setupSocketHandlers = async () => {
  const io = await getIO(); 

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);
    const clientId = socket.handshake.auth.clientId;
    console.log("client connceted id is",clientId)

    socket.on("disconnect", (reason) => {
      console.log(`User disconnected: ${socket.id}, reason: ${reason}`);
    });
  });
};

export default setupSocketHandlers;
