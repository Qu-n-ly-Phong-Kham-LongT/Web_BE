import http from "http";
import { Server as SocketIOServer } from "socket.io";
import ENV from "../config/environment.config";

type SubscribePayload = {
  jobId?: string;
};

let io: SocketIOServer | null = null;

export function initSocket(server: http.Server): SocketIOServer {
  if (io) return io;

  io = new SocketIOServer(server, {
    cors: {
      origin: ENV.cors,
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    socket.on("subscribe", (payload: SubscribePayload) => {
      const jobId = typeof payload?.jobId === "string" ? payload.jobId.trim() : "";
      if (!jobId) {
        socket.emit("error", { message: "Không nhận được JobId để subcribe" });
        return;
      }
      socket.join(jobId);
      socket.emit("subscribed", { jobId });
    });

    socket.on("unsubscribe", (payload: SubscribePayload) => {
      const jobId = typeof payload?.jobId === "string" ? payload.jobId.trim() : "";
      if (!jobId) return;
      socket.leave(jobId);
    });
  });

  return io;
}

export function emitToJob(jobId: string, event: string, data: unknown): void {
  if (!io) return;
  io.to(jobId).emit(event, data);
}
