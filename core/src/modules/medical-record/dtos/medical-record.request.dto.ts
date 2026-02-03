import Joi from "joi";
import { ICD10_REGEX } from "../../icd-10/dtos/icd-10.dto";

export interface DiagnosisItemDto {
  code: string;
  description: string;
  note?: string;
}

export interface MedicalDiagnosisDto {
  main: DiagnosisItemDto;
  secondary?: DiagnosisItemDto[];
}

export interface RecordRequestDto {
  patientId: string;
  doctorId: string;
  clinicId: string;
  evidenceBasedDiagnosis?: boolean;
  diagnoses?: MedicalDiagnosisDto;
  doctorAdvice?: string;
  treatmentNote?: string;
  consultationFee: number;
}

export interface BasicMedicalRecordRequestDto {
  patientId?: string | "";
  doctorId?: string | "";
  clinicId?: string | null;
  consultationFee?: number;
}

export interface BasicMedicalRecordCreateBodyDto {
  patientId: string;
  consultationFee?: number;
}

export const DiagnosisItemSchema = Joi.object({
  code: Joi.string()
    .uppercase()
    .pattern(ICD10_REGEX)
    .required()
    .messages({
      "string.pattern.base": "Mã bệnh không đúng định dạng ICD-10 (VD: K29, A33.11)",
      "any.required": "Mã bệnh là bắt buộc",
    }),

  description: Joi.string().required().messages({
    "any.required": "Tên bệnh là bắt buộc",
  }),
  note: Joi.string().allow(null, "").optional(),
});

export const DiagnosisSchema = Joi.object({
  main: DiagnosisItemSchema.required().messages({
    "any.required": "Phải có chẩn đoán chính",
  }),

  secondary: Joi.array().items(DiagnosisItemSchema).default([]).optional(),
});

const stringRequiredSchema = Joi.string().required();

export const RecordRequestSchema = Joi.object<RecordRequestDto>({
  patientId: stringRequiredSchema.messages({
    "any.required": "Mã bệnh nhân là bắt buộc",
  }),

  doctorId: stringRequiredSchema.messages({
    "any.required": "Mã bác sĩ là bắt buộc",
  }),

  clinicId: stringRequiredSchema.messages({
    "any.required": "Mã phòng khám là bắt buộc",
  }),

  evidenceBasedDiagnosis: Joi.boolean()
    .allow(null)
    .default(false)
    .optional()
    .messages({
      "boolean.base": "Chẩn đoán dựa trên bằng chứng phải là True/False",
    }),

  diagnoses: DiagnosisSchema.optional(),

  doctorAdvice: Joi.string().allow(null, "").optional(),
  treatmentNote: Joi.string().allow(null, "").optional(),
  consultationFee: Joi.number().min(0).default(0),
}).options({ abortEarly: false });

export const BasicMedicalRecordCreateBodySchema = Joi.object<BasicMedicalRecordCreateBodyDto>({
  patientId: stringRequiredSchema.messages({
    "any.required": "Mã bệnh nhân là bắt buộc",
  }),
  consultationFee: Joi.number().min(0).default(0).optional().messages({
    "number.min": "Tiền khám không được âm",
  }),
}).options({ abortEarly: false });
