import { Router } from "express";
import { authenticate, authorize } from "../../../middlewares/auth.middleware";
import { validateBody } from "../../../middlewares/validate";
import { upsertDiagnosisPrescriptionSchema } from "../dtos/prescription.request.dto";
import { PrescriptionController } from "../controllers/prescription.controller";
import { UserRoleEnum } from "@prisma/client";

const prescriptionRouter = Router();
const prescriptionController = new PrescriptionController();

prescriptionRouter.put(
  "/",
  authenticate,
  validateBody(upsertDiagnosisPrescriptionSchema),
  prescriptionController.upsertPrescriptionDiagnosis,
);

prescriptionRouter.get(
  "/statuses",
  authenticate,
  prescriptionController.getPrescriptionStatus,
);

prescriptionRouter.get(
  "/patient/:patientId",
  authenticate,
  prescriptionController.getPrescriptionsByPatientId,
);

prescriptionRouter.get(
  "/:id/print",
  authenticate,
  prescriptionController.printPrescriptionPdf,
);

prescriptionRouter.put(
  "/:id/status/draft",
  authenticate,
  authorize([UserRoleEnum.Doctor]),
  prescriptionController.updateStatusToDraft,
);

export default prescriptionRouter;
