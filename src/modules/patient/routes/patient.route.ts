import { Router } from "express";
import { PatientController } from "../controllers/patient.controller";
import { validateBody } from "../../../middlewares/validate";
import { CreatePatientRequestSchema } from "../dtos/create-patient.request.dto";
import { UpdatePatientRequestSchema } from "../dtos/update-patient.request.dto";
import { UpdatePatientRelativeRequestSchema } from "../dtos/update-patient-relative.request.dto";
import { CreatePatientAllergyRequestSchema } from "../dtos/create-patient-allergy.request.dto";
import { UpdatePatientAllergyRequestSchema } from "../dtos/update-patient-allergy.request.dto";
import { authenticate } from "../../../middlewares/auth.middleware";
import { auditLogsMiddleware } from "../../../middlewares/audit-logs.middleware";

const patientRouter = Router();

const patientController = new PatientController();

patientRouter.post(
  "/",
  authenticate,
  auditLogsMiddleware("CREATE_PATIENT", "Patient"),
  validateBody(CreatePatientRequestSchema),
  patientController.createPatient,
);

patientRouter.get("/", authenticate, patientController.getPatients);

patientRouter.get("/enums", authenticate, patientController.getPatientEnums);

patientRouter.get("/queue", authenticate, patientController.getDailyQueue);

patientRouter.get("/:id", authenticate, patientController.getPatientById);

patientRouter.put(
  "/:id",
  authenticate,
  auditLogsMiddleware("UPDATE_PATIENT", "Patient"),
  validateBody(UpdatePatientRequestSchema),
  patientController.updatePatient,
);

// Patient Relative routes
patientRouter.get(
  "/:patientId/relatives",
  authenticate,
  patientController.getRelativesByPatientId,
);

patientRouter.get(
  "/relatives/:relativeId",
  authenticate,
  patientController.getRelativeById,
);

patientRouter.put(
  "/relatives/:relativeId",
  authenticate,
  auditLogsMiddleware("UPDATE_PATIENT_RELATIVE", "PatientRelative"),
  validateBody(UpdatePatientRelativeRequestSchema),
  patientController.updateRelative,
);

// Patient Allergy routes
patientRouter.post(
  "/:patientId/allergies",
  authenticate,
  auditLogsMiddleware("CREATE_PATIENT_ALLERGY", "PatientAllergy"),
  validateBody(CreatePatientAllergyRequestSchema),
  patientController.createAllergies,
);

patientRouter.get(
  "/:patientId/allergies",
  authenticate,
  patientController.getAllergiesByPatientId,
);

patientRouter.get(
  "/allergies/:allergyId",
  authenticate,
  patientController.getAllergyById,
);

patientRouter.put(
  "/allergies/:allergyId",
  authenticate,
  auditLogsMiddleware("UPDATE_PATIENT_ALLERGY", "PatientAllergy"),
  validateBody(UpdatePatientAllergyRequestSchema),
  patientController.updateAllergy,
);

patientRouter.delete(
  "/allergies/:allergyId",
  authenticate,
  auditLogsMiddleware("DELETE_PATIENT_ALLERGY", "PatientAllergy"),
  patientController.deleteAllergy,
);

export default patientRouter;
