import { Router } from "express";
import { PatientController } from "../controllers/patient.controller";
import { validateBody } from "../../../middlewares/validate";
import { CreatePatientRequestSchema } from "../dtos/create-patient.request.dto";
import { UpdatePatientRequestSchema } from "../dtos/update-patient.request.dto";
import { UpdatePatientRelativeRequestSchema } from "../dtos/update-patient-relative.request.dto";
import { CreatePatientAllergyRequestSchema } from "../dtos/create-patient-allergy.request.dto";
import { UpdatePatientAllergyRequestSchema } from "../dtos/update-patient-allergy.request.dto";
import { authenticate } from "../../../middlewares/auth.middleware";

const patientRouter = Router();

const patientController = new PatientController();

patientRouter.post(
    "/",
    authenticate,
    validateBody(CreatePatientRequestSchema),
    patientController.createPatient
);

patientRouter.get(
    "/",
    authenticate,
    patientController.getPatients
);

patientRouter.get(
    "/enums",
    authenticate,
    patientController.getPatientEnums
);

patientRouter.get(
    "/daily-queue",
    authenticate,
    patientController.getDailyQueue
);

patientRouter.get(
    "/:id",
    authenticate,
    patientController.getPatientById
);

patientRouter.put(
    "/:id",
    authenticate,
    validateBody(UpdatePatientRequestSchema),
    patientController.updatePatient
);


// Patient Relative routes
patientRouter.get(
    "/:patientId/relatives",
    authenticate,
    patientController.getRelativesByPatientId
);

patientRouter.get(
    "/relatives/:relativeId",
    authenticate,
    patientController.getRelativeById
);

patientRouter.put(
    "/relatives/:relativeId",
    authenticate,
    validateBody(UpdatePatientRelativeRequestSchema),
    patientController.updateRelative
);


// Patient Allergy routes
patientRouter.post(
    "/:patientId/allergies",
    authenticate,
    validateBody(CreatePatientAllergyRequestSchema),
    patientController.createAllergies
);

patientRouter.get(
    "/:patientId/allergies",
    authenticate,
    patientController.getAllergiesByPatientId
);

patientRouter.get(
    "/allergies/:allergyId",
    authenticate,
    patientController.getAllergyById
);

patientRouter.put(
    "/allergies/:allergyId",
    authenticate,
    validateBody(UpdatePatientAllergyRequestSchema),
    patientController.updateAllergy
);

patientRouter.delete(
    "/allergies/:allergyId",
    authenticate,
    patientController.deleteAllergy
);

export default patientRouter;

