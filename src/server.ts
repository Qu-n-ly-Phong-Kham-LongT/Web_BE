import app from "./app";
import ENV from "./config/environment.config";

app.listen(ENV.port, () => {
  console.log(`Server running on port ${ENV.port}`);
});

const start = new Date();
start.setHours(0, 0, 0, 0);
const end = new Date();
end.setHours(23, 59, 59, 999);

console.log(start);
console.log(end);
