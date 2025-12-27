import { create } from "zustand";
import { persist } from "zustand/middleware";
import { io } from "socket.io-client";
import { v4 as uuidv4 } from "uuid";

const useSocketStore = create(
  persist(
    (set, get) => ({
      socket: null,
      isConnected: false,
      clientId: null,

      initSocket: async (url = "http://localhost:8000", maxRetries = 10) => {
        let { clientId } = get();

        if (!clientId) {
          clientId = uuidv4();
          set({ clientId });
          console.log(" Generated new clientId:", clientId);
        }

        if (get().socket) return get().socket;

        let retries = 0;
        const connectSocket = () =>
          new Promise((resolve, reject) => {
            const socket = io(url, {
              autoConnect: true,
              reconnection: false,
              auth: { clientId },
            });

            socket.on("connect", () => {
              console.log(" Socket connected:", socket.id);
              set({ socket, isConnected: true });
              resolve(socket);
            });

            socket.on("disconnect", () => {
              console.log(" Socket disconnected");
              set({ isConnected: false });
            });

            socket.on("connect_error", (err) => {
              console.log(`️ Connection error: ${err.message}`);
              socket.close();
              reject(err);
            });
          });

        while (retries <= maxRetries) {
          try {
            return await connectSocket();
          } catch (err) {
            retries++;
            console.log(`Retrying... (${retries}/${maxRetries})`);
            if (retries > maxRetries) {
              console.log(" Max retries reached. Could not connect.");
              return null;
            }
            await new Promise((res) => setTimeout(res, 1000));
          }
        }
      },
    }),
    {
      name: "socket-store",
      partialize: (state) => ({ clientId: state.clientId }),
    }
  )
);

export default useSocketStore;

