// test-socket.js
const { io } = require("socket.io-client");

const jobId = "b0a480cb-bbe7-40ed-aa48-4fa1b1c614dd";
const socket = io("http://localhost:3000", { transports: ["websocket"] });

socket.on("connect", () => {
  console.log("connected");
  socket.emit("subscribe", { jobId });
});

socket.on("print.done", (data: unknown) => {
  console.log("DONE", data);
});

socket.on("print.failed", (data: unknown) => {
  console.log("FAILED", data);
});
