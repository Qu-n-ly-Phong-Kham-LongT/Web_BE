import { Router } from "express";
import { PatientController } from "../controllers/patient.controller";
import { validateBody } from "../../../middlewares/validate";
import { CreatePatientRequestSchema } from "../dtos/create-patient.request.dto";
import { UpdatePatientRequestSchema } from "../dtos/update-patient.request.dto";
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

export default patientRouter;

