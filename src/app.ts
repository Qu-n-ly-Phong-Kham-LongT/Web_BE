import express, { Request, Response } from "express";
import { errorHandler } from "./middlewares/errorHandler";
import { prisma } from "./config/database.config";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const checkDatabase = async () => {
  try {
    await await prisma.$connect();
    console.log("Database connected successfully");
  } catch (err: any) {
    console.error("Database connection failed");
    console.error(err);
    process.exit(1); // dừng app nếu DB lỗi
  }
}

checkDatabase();

app.get("/health", (req: Request, res: Response) => {
  res.status(200).send("OK");
});
2
app.use(errorHandler);

export default app;
