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
import prescriptionTemplateRouter from "../modules/prescription-template/routes/prescription-template.route";
import serviceNodeRouter from "../modules/service-node/routes/service-node.route";
import serviceItemRouter from "../modules/service-item/routes/service-item.routes";
import serviceTemplateRouter from "../modules/service-template/routes/service-template.route";
import serviceRequestRouter from "../modules/service-request/routes/service-request.route";

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
rootRouter.use("/prescription-templates", prescriptionTemplateRouter);
rootRouter.use("/service-nodes", serviceNodeRouter);
rootRouter.use("/service-items", serviceItemRouter);
rootRouter.use("/service-templates", serviceTemplateRouter);
rootRouter.use("/service-requests", serviceRequestRouter);

export default rootRouter;

