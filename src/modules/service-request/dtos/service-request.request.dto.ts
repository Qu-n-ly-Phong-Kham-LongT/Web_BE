import Joi from "joi";
import { ICD10_REGEX } from "../../icd-10/dtos/icd-10.dto";
import { MedicalDiagnosisDto } from "../../medical-record/dtos/medical-record.request.dto";

export interface SelectedConfigsDto {
  configId: string;
  selectedValues?: string[];
}

export interface CreateServiceRequestDetailDto {
  itemId: string;
  selectedConfigs?: SelectedConfigsDto[];
  note?: string;
}

export interface CreateServiceRequestDto {
  recordId: string;
  orderingDoctorId?: string;
  diagnoses?: MedicalDiagnosisDto;
  isPatientRequested?: boolean;
  receiveResultAtClinic?: boolean;
  isFollowUp: boolean;
  note?: string | null;
  details: CreateServiceRequestDetailDto[];
}

const DiagnosisItemSchema = Joi.object({
  code: Joi.string().uppercase().pattern(ICD10_REGEX).required().messages({
    "string.pattern.base":
      "Mã bệnh không đúng định dạng ICD-10 (VD: K29, A33.11)",
    "any.required": "Mã bệnh là bắt buộc",
  }),
  description: Joi.string().required().messages({
    "any.required": "Tên bệnh là bắt buộc",
  }),
  note: Joi.string().allow(null, "").optional(),
});

const DiagnosisSchema = Joi.object({
  main: DiagnosisItemSchema.required().messages({
    "any.required": "Phải có chẩn đoán chính",
  }),
  secondary: Joi.array().items(DiagnosisItemSchema).default([]).optional(),
});

const selectedConfigSchema = Joi.object({
  configId: Joi.string().required(),
  selectedValues: Joi.array().items(Joi.string()).optional(),
});

const createServiceRequestDetailSchema = Joi.object({
  itemId: Joi.string().required(),
  selectedConfigs: Joi.array().items(selectedConfigSchema).allow(null, ""),
  note: Joi.string().allow("", null),
});

export const createServiceRequestSchema = Joi.object({
  recordId: Joi.string().required(),
  orderingDoctorId: Joi.string().optional(),
  diagnoses: DiagnosisSchema.optional(),
  isPatientRequested: Joi.boolean().optional().default(false),
  receiveResultAtClinic: Joi.boolean().optional().default(false),
  isForFollowUp: Joi.boolean().optional().default(false),
  note: Joi.string().allow("", null),
  details: Joi.array()
    .items(createServiceRequestDetailSchema)
    .min(1)
    .required()
    .messages({
      "array.min": "Phải có ít nhất 1 dịch vụ cho phiếu chỉ định",
    }),
});
