import { Router } from "express";
import { SharedController } from "../controllers/shared.controller";
import { authenticate } from "../../../middlewares/auth.middleware";
import { auditLogsMiddleware } from "../../../middlewares/audit-logs.middleware";

const sharedRouter = Router();
const controller = new SharedController();

sharedRouter.get(
  "/:id/full",
  authenticate,
  auditLogsMiddleware("VIEW_MEDICAL_RECORD_FULL", "MedicalRecord"),
  controller.getFullMedicalRecord
);
sharedRouter.get(
  "/:id/print",
  authenticate,
  auditLogsMiddleware("PRINT_MEDICAL_RECORD", "MedicalRecord"),
  controller.printMedicalRecordPdf
);
sharedRouter.get(
  "/:id/file",
  authenticate,
  auditLogsMiddleware("GET_MEDICAL_RECORD_FILE", "MedicalRecord"),
  controller.getOrPrintMedicalRecordPdf,
);

export default sharedRouter;
