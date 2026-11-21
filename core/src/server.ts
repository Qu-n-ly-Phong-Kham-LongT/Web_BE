import http from "http";
import app from "./app";
import ENV from "./config/environment.config";
import { initSocket } from "./utils/socket.util";
import { runWorker } from "./utils/worker.util";
import type { PrintWorkerHandle } from "./utils/print-worker.util";

const SHUTDOWN_GRACE_MS = 8000;

const server = http.createServer(app);

server.listen(ENV.port, () => {
  console.log(`Server running on port ${ENV.port}`);
});

initSocket(server);

let worker: PrintWorkerHandle | null = null;
try {
  worker = runWorker();
} catch (error) {
  console.error("Worker failed to start:", error);
}

const shutdown = (signal: string) => {
  console.log(`Received ${signal}, stopping print worker and HTTP server`);
  setTimeout(() => process.exit(0), SHUTDOWN_GRACE_MS).unref();
  Promise.resolve(worker?.stop())
    .catch((error) => console.error("Worker stop failed:", error))
    .finally(() => server.close(() => process.exit(0)));
};

process.once("SIGTERM", () => shutdown("SIGTERM"));
process.once("SIGINT", () => shutdown("SIGINT"));
