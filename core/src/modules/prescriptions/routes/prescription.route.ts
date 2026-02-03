import { Router } from "express";
import { authenticate, authorize } from "../../../middlewares/auth.middleware";
import { validateBody } from "../../../middlewares/validate";
import { upsertDiagnosisPrescriptionSchema } from "../dtos/prescription.request.dto";
import { PrescriptionController } from "../controllers/prescription.controller";
import { UserRoleEnum } from "@prisma/client";
import { auditLogsMiddleware } from "../../../middlewares/audit-logs.middleware";

const prescriptionRouter = Router();
const prescriptionController = new PrescriptionController();

prescriptionRouter.put(
  "/",
  authenticate,
  auditLogsMiddleware("UPSERT_PRESCRIPTION", "Prescription"),
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
  "/patients-by-date",
  authenticate,
  prescriptionController.getPatientsWithPrescriptionsByDate,
);

prescriptionRouter.get(
  "/:id/print",
  authenticate,
  auditLogsMiddleware("PRINT_PRESCRIPTION", "Prescription"),
  prescriptionController.printPrescriptionPdf,
);

prescriptionRouter.put(
  "/:id/status/draft",
  authenticate,
  auditLogsMiddleware("UPDATE_PRESCRIPTION_STATUS", "Prescription"),
  authorize([UserRoleEnum.Doctor]),
  prescriptionController.updateStatusToDraft,
);

prescriptionRouter.put(
  "/:id/dispense",
  authenticate,
  auditLogsMiddleware("DISPENSE_PRESCRIPTION", "Prescription"),
  prescriptionController.dispensePrescription,
);

export default prescriptionRouter;
