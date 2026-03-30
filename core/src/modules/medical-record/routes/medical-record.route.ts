import { Router } from "express";
import { MedicalRecordController } from "../controllers/medical-record.controller";
import { authenticate, authorize } from "../../../middlewares/auth.middleware";
import { validateBody } from "../../../middlewares/validate";
import {
  BasicMedicalRecordCreateBodySchema,
  BasicMedicalRecordWithDateBodySchema,
} from "../dtos/medical-record.request.dto";
import { legacyMedicalRecordImportSchema } from "../dtos/legacy-medical-record.request.dto";
import { UserRoleEnum } from "@prisma/client";

const medicalRecordRouter = Router();
const medicalRecordController = new MedicalRecordController();

medicalRecordRouter.post(
  "/",
  authenticate,
  authorize([UserRoleEnum.Doctor, UserRoleEnum.Admin]),
  validateBody(BasicMedicalRecordCreateBodySchema),
  medicalRecordController.createMedicalRecord,
);

medicalRecordRouter.post(
  "/import-legacy",
  authenticate,
  authorize([UserRoleEnum.Doctor, UserRoleEnum.Admin]),
  validateBody(legacyMedicalRecordImportSchema),
  medicalRecordController.importLegacyMedicalRecord,
);

medicalRecordRouter.post(
  "/old",
  authenticate,
  validateBody(BasicMedicalRecordWithDateBodySchema),
  medicalRecordController.createMedicalRecordWithDate,
);

medicalRecordRouter.get(
  "/patient/:patientId",
  authenticate,
  authorize([UserRoleEnum.Doctor, UserRoleEnum.Admin]),
  medicalRecordController.getMedicalRecordsByPatientId,
);

medicalRecordRouter.delete(
  "/:id",
  authenticate,
  authorize([UserRoleEnum.Admin]),
  medicalRecordController.deleteMedicalRecord,
);
export default medicalRecordRouter;
