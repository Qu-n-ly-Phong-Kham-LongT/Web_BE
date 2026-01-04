import { Router } from "express";
import authRouter from "../modules/auth/routes/auth.route";
import userRouter from "../modules/users/routes/user.route";
import patientRouter from "../modules/patient/routes/patient.route";
import clinicRouter from "../modules/clinic/routes/clinic.route";

const rootRouter = Router();

rootRouter.use("/auth", authRouter);
rootRouter.use("/users", userRouter);
rootRouter.use("/patients", patientRouter);
rootRouter.use("/clinics", clinicRouter);

export default rootRouter;

