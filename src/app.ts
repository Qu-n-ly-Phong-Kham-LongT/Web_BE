import express, { Request, Response } from "express";
import basicAuth from "express-basic-auth";
import swaggerUi from "swagger-ui-express";
import ENV from "./config/environment.config";
import { prisma } from "./config/database.config";
import { errorHandler } from "./middlewares/error-handler";
import rootRouter from "./routes/root.route";
import swaggerDocument from "./swagger/index";
import { BaseError } from "./utils/base-error.util";
import { runSeeds } from "./seed";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const checkDatabase = async () => {
  try {
    await prisma.$connect();
    console.log("Database connected successfully");
  } catch (err: any) {
    const dbError =
      err instanceof BaseError
        ? err
        : new BaseError(500, "Database connection failed", err);
    console.error(dbError);
    process.exit(1); // stop app if DB fails
  }
};

(async () => {
  await checkDatabase();
  await runSeeds();
})();

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).send("OK");
});

app.use(
  "/api-docs",
  basicAuth({
    users: { [ENV.swaggerUsername]: ENV.swaggerPassword },
    challenge: true,
  }),
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument)
);

app.use("/api", rootRouter);

app.use(errorHandler);

export default app;
