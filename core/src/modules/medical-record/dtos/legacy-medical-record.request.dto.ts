import Joi from "joi";
import { PregnancyStatus, Session } from "@prisma/client";
import {
  DiagnosisSchema,
  MedicalDiagnosisDto,
} from "./medical-record.request.dto";
import { AllergyItemSchema, AllergyItemDto } from "../../clinical-examination/dtos/clinical-examination.request.dto";
import { PrescriptionItemDto } from "../../prescriptions/dtos/prescription.request.dto";

export interface LegacyClinicalExaminationDto {
  reasonForVisit?: string;
  medicalHistory?: string;
  pastMedicalHistory?: string;
  clinicalExamination?: string;
  heartRate?: number;
  bloodPressure?: string;
  temperature?: number;
  weight?: number;
  height?: number;
  bmi?: number;
  pregnancyStatus?: PregnancyStatus;
  pregnancyWeeks?: number;
  isBreastfeeding?: boolean;
  hasHealthInsurance?: boolean;
  hasPoorAppetite?: boolean;
  hasWeightLoss?: boolean;
  clinicalNotes?: string;
  allergies?: AllergyItemDto[];
  examinedAt: Date | string;
  updatedAt: Date | string;
}

export interface LegacyServiceResultDto {
  configId: string;
  indicatorName?: string;
  valueString?: string | null;
  valueNumber?: number | null;
  unit?: string | null;
  executedAt?: Date | string | null;
  updatedAt: Date | string;
}

export interface LegacyServiceRequestDetailDto {
  itemId: string;
  selectedConfigs?: {
    configId: string;
    selectedValues?: string[];
  }[];
  note?: string;
  results?: LegacyServiceResultDto[];
}

export interface LegacyServiceRequestDto {
  requestId: string;
  orderingDoctorId?: string;
  diagnoses?: MedicalDiagnosisDto;
  isPatientRequested?: boolean;
  receiveResultAtClinic?: boolean;
  isForFollowUp?: boolean;
  followUpDate?: string | Date | null;
  followUpSession?: Session | null;
  isPrinted?: boolean;
  note?: string | null;
  details: LegacyServiceRequestDetailDto[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface LegacyPrescriptionDto {
  prescriptionItems: PrescriptionItemDto[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface LegacyMedicalRecordImportRequestDto {
  recordId: string;
  patientId: string;
  consultationFee?: number;
  evidenceBasedDiagnosis?: boolean;
  diagnoses?: MedicalDiagnosisDto;
  doctorAdvice?: string;
  treatmentNote?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  clinicalExamination?: LegacyClinicalExaminationDto;
  serviceRequests?: LegacyServiceRequestDto[];
  prescription?: LegacyPrescriptionDto;
  followUp?: {
    appointmentDate?: Date | string | null;
    session: Session;
    reason?: string | null;
  };
}

const dateRequired = Joi.date().required();
const prescriptionItemSchema = Joi.object({
  medicineId: Joi.string().uuid().required(),
  frequencyPerDay: Joi.number().integer().min(1).required(),
  quantityPerTime: Joi.number().min(0).required(),
  quantity: Joi.number().min(1).required(),
  unit: Joi.string().required(),
  administrationRoute: Joi.string().allow("", null),
  timing: Joi.string().required(),
  daysToTake: Joi.number().integer().min(1).required(),
  note: Joi.string().allow("", null),
  isInsuranceCovered: Joi.boolean().default(false),
}).unknown(true);

const legacyServiceResultSchema = Joi.object({
  configId: Joi.string().required(),
  indicatorName: Joi.string().allow("", null),
  valueString: Joi.string().allow("", null),
  valueNumber: Joi.number().allow(null),
  unit: Joi.string().allow("", null),
  executedAt: Joi.date().allow(null).optional(),
  updatedAt: dateRequired,
});

const legacyServiceRequestDetailSchema = Joi.object({
  itemId: Joi.string().required(),
  selectedConfigs: Joi.array()
    .items(
      Joi.object({
        configId: Joi.string().required(),
        selectedValues: Joi.array().items(Joi.string()).optional(),
      })
    )
    .optional(),
  note: Joi.string().allow("", null).optional(),
  results: Joi.array().items(legacyServiceResultSchema).optional(),
});

const legacyServiceRequestSchema = Joi.object({
  requestId: Joi.string().uuid().required(),
  orderingDoctorId: Joi.string().optional(),
  diagnoses: DiagnosisSchema.optional(),
  isPatientRequested: Joi.boolean().optional(),
  receiveResultAtClinic: Joi.boolean().optional(),
  isForFollowUp: Joi.boolean().optional(),
  followUpDate: Joi.date().allow(null, "").optional(),
  followUpSession: Joi.string()
    .valid(...Object.values(Session))
    .allow(null, "")
    .optional(),
  isPrinted: Joi.boolean().optional(),
  note: Joi.string().allow("", null).optional(),
  details: Joi.array().items(legacyServiceRequestDetailSchema).min(1).required(),
  createdAt: dateRequired,
  updatedAt: dateRequired,
});

const legacyClinicalExaminationSchema = Joi.object({
  reasonForVisit: Joi.string().allow(null, "").optional(),
  medicalHistory: Joi.string().allow(null, "").optional(),
  pastMedicalHistory: Joi.string().allow(null, "").optional(),
  clinicalExamination: Joi.string().allow(null, "").optional(),
  heartRate: Joi.number().min(0).allow(null).optional(),
  bloodPressure: Joi.string().allow(null, "").optional(),
  temperature: Joi.number().allow(null).optional(),
  weight: Joi.number().min(0).allow(null).optional(),
  height: Joi.number().min(0).allow(null).optional(),
  bmi: Joi.number().min(0).allow(null).optional(),
  pregnancyStatus: Joi.string()
    .valid(...Object.values(PregnancyStatus))
    .optional(),
  pregnancyWeeks: Joi.number().integer().min(0).allow(null).optional(),
  hasPoorAppetite: Joi.boolean().allow(null).optional(),
  hasWeightLoss: Joi.boolean().allow(null).optional(),
  isBreastfeeding: Joi.boolean().allow(null).optional(),
  hasHealthInsurance: Joi.boolean().allow(null).optional(),
  clinicalNotes: Joi.string().allow(null, "").optional(),
  allergies: Joi.array().items(AllergyItemSchema).optional(),
  examinedAt: dateRequired,
  updatedAt: dateRequired,
});

const legacyPrescriptionSchema = Joi.object({
  prescriptionItems: Joi.array().items(prescriptionItemSchema).required(),
  createdAt: dateRequired,
  updatedAt: dateRequired,
});

const followUpSchema = Joi.object({
  appointmentDate: Joi.date().allow(null, "").optional(),
  session: Joi.string()
    .valid(...Object.values(Session))
    .required(),
  reason: Joi.string().allow("", null).optional(),
});

export const legacyMedicalRecordImportSchema = Joi.object<LegacyMedicalRecordImportRequestDto>({
  recordId: Joi.string().uuid().required(),
  patientId: Joi.string().required(),
  consultationFee: Joi.number().min(0).optional(),
  evidenceBasedDiagnosis: Joi.boolean().optional(),
  diagnoses: DiagnosisSchema.optional(),
  doctorAdvice: Joi.string().allow("", null).optional(),
  treatmentNote: Joi.string().allow("", null).optional(),
  createdAt: dateRequired,
  updatedAt: dateRequired,
  clinicalExamination: legacyClinicalExaminationSchema.optional(),
  serviceRequests: Joi.array().items(legacyServiceRequestSchema).optional(),
  prescription: legacyPrescriptionSchema.optional(),
  followUp: followUpSchema.optional(),
}).options({ abortEarly: false });
