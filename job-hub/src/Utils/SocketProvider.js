import { Server } from "socket.io";

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: ["http://localhost:5173","http://192.168.18.26:5173"],
      methods: ["GET", "POST"],
    },
  });
  console.log("socket server ready to rock and roll")
  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};
