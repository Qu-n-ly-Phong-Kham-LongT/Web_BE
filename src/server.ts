import app from './app';
import config from './config/config';
import { prisma } from "./config/database";

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});