import ENV from "../config/environment.config";
import AuthSwagger from "./auth.swagger";
import UserSwagger from "./user.swagger";
import PatientSwagger from "./patient.swagger";
import FileSwagger from "./file.swagger";
import ClinicSwagger from "./clinic.swagger";
import PatientAllergySwagger from "./patient-allergy.swagger";
import Icd10Swagger from "./icd10.swagger";
import MedicalRecordSwagger from "./medical-record.swagger";
import ClinicalExaminationSwagger from "./clinical-examination.swagger";
import MedicineSwagger from "./medicine.swagger";
import PrescriptionSwagger from "./prescription.swagger";
import ServiceNodeSwagger from "./service-node.swagger";
import PrescriptionTemplateSwagger from "./prescription-template.swagger";
import ServiceItemSwagger from "./service-item.swagger";
import ServiceTemplateSwagger from "./service-template.swagger";
import ServiceRequestSwagger from "./service-request.swagger";
import ServiceResultSwagger from "./service-result.swagger";
import SharedSwagger from "./shared.swagger";
import { joiToSwagger } from "../utils/joi-swagger.util";
import { PatientResponseSchema } from "../modules/patient/dtos/patient.response.dto";
import { ServiceRequestFullResponseSchema } from "../modules/service-request/dtos/service-request.response.dto";
import { ClinicalExaminationResponseSchema } from "../modules/clinical-examination/dtos/clinical-examination.response.dto";
import { DiagnosisSchema } from "../modules/medical-record/dtos/medical-record.request.dto";

const FullMedicalRecordSchema = {
  type: "object",
  properties: {
    patient: {
      ...joiToSwagger(PatientResponseSchema),
      nullable: true,
    },
    clinicalExamination: {
      ...joiToSwagger(ClinicalExaminationResponseSchema),
      nullable: true,
    },
    medicalRecord: {
      type: "object",
      properties: {
        recordId: { type: "string", format: "uuid" },
        recordCode: { type: "string" },
        patientId: { type: "string", format: "uuid" },
        doctorId: { type: "string", format: "uuid" },
        clinicId: { type: "string", format: "uuid" },
        evidenceBasedDiagnosis: { type: "boolean", nullable: true },
        diagnoses: { ...joiToSwagger(DiagnosisSchema), nullable: true },
        doctorAdvice: { type: "string", nullable: true },
        treatmentNote: { type: "string", nullable: true },
        consultationFee: { type: "number" },
        createdAt: { type: "string", format: "date-time" },
        updatedAt: { type: "string", format: "date-time" },
      },
    },
    serviceRequest: {
      type: "array",
      items: joiToSwagger(ServiceRequestFullResponseSchema),
    },
    prescription: {
      type: "object",
      nullable: true,
      properties: {
        prescriptionId: { type: "string", format: "uuid" },
        pdfPath: { type: "string", nullable: true },
        fileName: { type: "string", nullable: true },
        note: { type: "string", nullable: true },
        totalPrice: { type: "number" },
        status: { type: "string" },
        createdAt: { type: "string", format: "date-time" },
        updateAt: { type: "string", format: "date-time" },
        details: {
          type: "array",
          items: {
            type: "object",
            properties: {
              medicineId: { type: "string", format: "uuid" },
              frequencyPerDay: { type: "number" },
              quantityPerTime: { type: "number" },
              quantity: { type: "number" },
              unit: { type: "string" },
              administrationRoute: { type: "string", nullable: true },
              timing: { type: "string" },
              daysToTake: { type: "number" },
              note: { type: "string", nullable: true },
              isInsuranceCovered: { type: "boolean" },
            },
          },
        },
      },
    },
    followUp: {
      type: "object",
      nullable: true,
      properties: {
        appointmentDate: { type: "string", format: "date", nullable: true },
        session: { type: "string", nullable: true },
        reason: { type: "string", nullable: true },
      },
    },
  },
};

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
    ...PatientAllergySwagger,
    ...FileSwagger,
    ...ClinicSwagger,
    ...Icd10Swagger,
    ...MedicalRecordSwagger,
    ...ClinicalExaminationSwagger,
    ...MedicineSwagger,
    ...PrescriptionSwagger,
    ...ServiceNodeSwagger,
    ...PrescriptionTemplateSwagger,
    ...ServiceItemSwagger,
    ...ServiceTemplateSwagger,
    ...ServiceRequestSwagger,
    ...ServiceResultSwagger,
    ...SharedSwagger,
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      FullMedicalRecordDto: FullMedicalRecordSchema,
    },
  },
};

export default swaggerDocument;
