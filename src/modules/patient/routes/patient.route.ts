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
    validateBody(CreatePatientRequestSchema),
    patientController.createPatient
);

patientRouter.get(
    "/",
    patientController.getPatients
);

patientRouter.get(
    "/:id",
    patientController.getPatientById
);

patientRouter.put(
    "/:id",
    validateBody(UpdatePatientRequestSchema),
    patientController.updatePatient
);

patientRouter.delete(
    "/:id",
    patientController.deletePatient
);

export default patientRouter;

