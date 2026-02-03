import { Router } from "express";
import { MedicalRecordController } from "../controllers/medical-record.controller";
import { authenticate, authorize } from "../../../middlewares/auth.middleware";
import { validateBody } from "../../../middlewares/validate";
import { BasicMedicalRecordCreateBodySchema } from "../dtos/medical-record.request.dto";
import { UserRoleEnum } from "@prisma/client";
import { auditLogsMiddleware } from "../../../middlewares/audit-logs.middleware";

const medicalRecordRouter = Router();
const medicalRecordController = new MedicalRecordController();

medicalRecordRouter.post(
  "/",
  authenticate,
  auditLogsMiddleware("CREATE_MEDICAL_RECORD", "MedicalRecord"),
  authorize([UserRoleEnum.Doctor, UserRoleEnum.Admin]),
  validateBody(BasicMedicalRecordCreateBodySchema),
  medicalRecordController.createMedicalRecord
);

medicalRecordRouter.get(
  "/patient/:patientId",
  authenticate,
  authorize([UserRoleEnum.Doctor, UserRoleEnum.Admin]),
  medicalRecordController.getMedicalRecordsByPatientId
);

export default medicalRecordRouter;
