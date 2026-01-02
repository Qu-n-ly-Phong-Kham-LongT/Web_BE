import express, { Request, Response } from "express";
import { errorHandler } from "./middlewares/error-handler";
import { prisma } from "./config/database.config";
import rootRouter from "./routes/root.route";

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

app.use("/api", rootRouter);

app.use(errorHandler);


export default app;
