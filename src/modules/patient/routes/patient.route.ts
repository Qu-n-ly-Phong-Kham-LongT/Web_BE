import { Router } from "express";
import { PatientController } from "../controllers/patient.controller";
import { validateBody } from "../../../middlewares/validate";
import { CreatePatientRequestSchema } from "../dtos/create-patient.request.dto";
import { UpdatePatientRequestSchema } from "../dtos/update-patient.request.dto";
import { CreatePatientRelativeRequestSchema } from "../dtos/create-patient-relative.request.dto";
import { UpdatePatientRelativeRequestSchema } from "../dtos/update-patient-relative.request.dto";
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

patientRouter.get(
    "/enums",
    authenticate,
    patientController.getPatientEnums
);

// Patient Relative routes - must come before /:id to avoid route conflicts
patientRouter.post(
    "/:patientId/relatives",
    authenticate,
    validateBody(CreatePatientRelativeRequestSchema),
    patientController.createRelative
);

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

export default patientRouter;

