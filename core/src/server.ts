import http from "http";
import app from "./app";
import ENV from "./config/environment.config";
import { initSocket } from "./utils/socket.util";
import { runWorker } from "./utils/worker.util";

const server = http.createServer(app);

server.listen(ENV.port, () => {
  console.log(`Server running on port ${ENV.port}`);
});

initSocket(server);

runWorker().catch((error) => {
  console.error("Worker failed to start:", error);
});
