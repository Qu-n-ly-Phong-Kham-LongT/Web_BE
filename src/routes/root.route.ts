import { Router } from "express";
import authRouter from "../modules/auth/routes/auth.route";
import userRouter from "../modules/users/routes/user.route";
import patientRouter from "../modules/patient/routes/patient.route";
import clinicRouter from "../modules/clinic/routes/clinic.route";
import fileRouter from "../modules/file/routes/file.route";
import icd10Router from "../modules/icd-10/routes/icd-10.route";

const rootRouter = Router();

rootRouter.use("/auth", authRouter);
rootRouter.use("/users", userRouter);
rootRouter.use("/patients", patientRouter);
rootRouter.use("/clinics", clinicRouter);
rootRouter.use("/files", fileRouter);
rootRouter.use("/icd10", icd10Router);

export default rootRouter;

