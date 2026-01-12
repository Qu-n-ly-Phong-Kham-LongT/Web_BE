import Joi from "joi";
import { PregnancyStatus } from "@prisma/client";

export interface AllergyItemDto {
  drug: string;
  reaction?: string;
}

export interface ClinicalExaminationRequestDto {
  recordId: string;
  examinedBy?: string;
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
  hasPoorAppetite?: boolean;
  hasWeightLoss?: boolean;
  clinicalNotes?: string;

  allergies?: AllergyItemDto[];
}

export const AllergyItemSchema = Joi.object<AllergyItemDto>({
  drug: Joi.string().trim().min(1).required().messages({
    "any.required": "Thuốc dị ứng là bắt buộc",
    "string.empty": "Thuốc dị ứng không được để trống",
  }),
  reaction: Joi.string().trim().allow(null, "").optional(),
});

export const ClinicalExaminationRequestSchema = Joi.object<ClinicalExaminationRequestDto>({
  recordId: Joi.string().uuid().messages({
    "string.guid": "recordId phải là UUID hợp lệ",
  }),
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
  hasPoorAppetite: Joi.boolean().allow(null).default(false).optional(),
  hasWeightLoss: Joi.boolean().allow(null).default(false).optional(),
  clinicalNotes: Joi.string().allow(null, "").optional(),

  allergies: Joi.array().items(AllergyItemSchema).optional(),
}).options({ abortEarly: false });
