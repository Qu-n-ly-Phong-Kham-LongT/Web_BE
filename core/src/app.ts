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
import { corsMiddleware } from "./middlewares/cors.middleware";
import { apiLimiter } from "./middlewares/rate-limit.middleware";
import { parseDate } from "./utils/parseDate.util";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

const checkDatabase = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
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

const ALLOWED_CORS_ORIGIN = ENV.cors;

app.use(corsMiddleware(ALLOWED_CORS_ORIGIN));

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
  swaggerUi.setup(swaggerDocument),
);

// app.use("/api", apiLimiter, rootRouter);
app.use("/api", rootRouter);

app.use(errorHandler);
app.set("trust proxy", true);

export default app;
