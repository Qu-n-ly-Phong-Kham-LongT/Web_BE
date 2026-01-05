import { Router } from "express";
import { MedicalRecordController } from "../controllers/medical-record.controller";
import { authenticate, authorize } from "../../../middlewares/auth.middleware";
import { validateBody } from "../../../middlewares/validate";
import { BasicMedicalRecordCreateBodySchema } from "../dtos/medical-record.request.dto";
import { UserRoleEnum } from "@prisma/client";

const medicalRecordRouter = Router();
const medicalRecordController = new MedicalRecordController();

medicalRecordRouter.post(
  "/",
  authenticate,
  authorize([UserRoleEnum.Doctor, UserRoleEnum.Admin]),
  validateBody(BasicMedicalRecordCreateBodySchema),
  medicalRecordController.createMedicalRecord
);

export default medicalRecordRouter;
