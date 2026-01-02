import { Router } from "express";
import authRouter from "../modules/auth/routes/auth.route";

const rootRouter = Router();

rootRouter.use("/auth", authRouter);

export default rootRouter;

