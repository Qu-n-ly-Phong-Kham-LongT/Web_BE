import { Router } from "express";
import { authenticate } from "../../../middlewares/auth.middleware";
import { validateBody } from "../../../middlewares/validate";
import { upsertDiagnosisPrescriptionSchema } from "../dtos/prescription.request.dto";
import { PrescriptionController } from "../controllers/prescription.controller";

const prescriptionRouter = Router();
const prescriptionController = new PrescriptionController();

prescriptionRouter.put(
  "/",
  authenticate,
  validateBody(upsertDiagnosisPrescriptionSchema),
  prescriptionController.upsertPrescriptionDiagnosis
);

prescriptionRouter.get("/:id/print",
  authenticate,
  prescriptionController.printPrescriptionPdf
)

export default prescriptionRouter;
