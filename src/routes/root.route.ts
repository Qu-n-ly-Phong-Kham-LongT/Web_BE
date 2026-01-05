import { Router } from "express";
import authRouter from "../modules/auth/routes/auth.route";
import userRouter from "../modules/users/routes/user.route";
import patientRouter from "../modules/patient/routes/patient.route";
import clinicRouter from "../modules/clinic/routes/clinic.route";
import fileRouter from "../modules/file/routes/file.route";
import icd10Router from "../modules/icd-10/routes/icd-10.route";
import medicalRecordRouter from "../modules/medical-record/routes/medical-record.route";
import clinicalExaminationRouter from "../modules/clinical-examination/routes/clinical-examination.route";
import medicineRouter from "../modules/medicine/routes/medicine.route";

const rootRouter = Router();

rootRouter.use("/auth", authRouter);
rootRouter.use("/users", userRouter);
rootRouter.use("/patients", patientRouter);
rootRouter.use("/clinics", clinicRouter);
rootRouter.use("/files", fileRouter);
rootRouter.use("/icd10", icd10Router);
rootRouter.use("/medical-records", medicalRecordRouter);
rootRouter.use("/medical-records", clinicalExaminationRouter);
rootRouter.use("/medicines", medicineRouter);

export default rootRouter;

