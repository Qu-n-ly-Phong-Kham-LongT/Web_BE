import { Router } from "express";
import authRouter from "../modules/auth/routes/auth.route";
import userRouter from "../modules/users/routes/user.route";
import patientRouter from "../modules/patient/routes/patient.route";
import fileRouter from "../modules/file/routes/file.route";

const rootRouter = Router();

rootRouter.use("/auth", authRouter);
rootRouter.use("/users", userRouter);
rootRouter.use("/patients", patientRouter);
rootRouter.use("/files", fileRouter);

export default rootRouter;

