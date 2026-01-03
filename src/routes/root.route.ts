import { Router } from "express";
import authRouter from "../modules/auth/routes/auth.route";
import patientRouter from "../modules/patient/routes/patient.route";

const rootRouter = Router();

rootRouter.use("/auth", authRouter);
rootRouter.use("/patients", patientRouter);

export default rootRouter;

