import ENV from "../config/environment.config";
import AuthSwagger from "./auth.swagger";
import UserSwagger from "./user.swagger";
import PatientSwagger from "./patient.swagger";
import FileSwagger from "./file.swagger";
import ClinicSwagger from "./clinic.swagger";
import PatientRelativeSwagger from "./patient-relative.swagger";
import PatientAllergySwagger from "./patient-allergy.swagger";
import Icd10Swagger from "./icd10.swagger";
import MedicalRecordSwagger from "./medical-record.swagger";
import ClinicalExaminationSwagger from "./clinical-examination.swagger";

const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: `${ENV.appName} API Documentation`,
    version: "1.0.0",
  },
  paths: {
    ...AuthSwagger,
    ...UserSwagger,
    ...PatientSwagger,
    ...PatientRelativeSwagger,
    ...PatientAllergySwagger,
    ...FileSwagger,
    ...ClinicSwagger,
    ...Icd10Swagger,
    ...MedicalRecordSwagger,
    ...ClinicalExaminationSwagger,
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
};

export default swaggerDocument;
