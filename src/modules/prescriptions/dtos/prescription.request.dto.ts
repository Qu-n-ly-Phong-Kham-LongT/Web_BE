import { MedicalDiagnosisDto } from "../../medical-record/dtos/medical-record.request.dto";
import { Session } from "@prisma/client";
import Joi from "joi";

export interface PrescriptionItemDto {
  medicineId: string;
  frequencyPerDay: number;
  quantityPerTime: number;
  quantity: string;
  unit: string;
  administrationRoute?: string;
  timing: string;
  daysToTake: number;
  note?: string | null;
  isInsuranceCovered: boolean;
}

export interface FollowUpDto {
  appointmentDate?: Date;
  session: Session;
  reason?: string | null;
}

export interface UpsertDianosisPrescriptionDto {
  recordId: string;
  evidenceBasedDiagnosis?: boolean;
  diagnoses?: MedicalDiagnosisDto;
  doctorAdvice?: string;
  treatmentNote?: string;
  prescriptionItems?: PrescriptionItemDto[];
  followUp?: FollowUpDto;
}

const prescriptionItemSchema = Joi.object({
  medicineId: Joi.string().uuid().required().messages({
    "string.uuid": "ID thuốc không đúng định dạng",
    "any.required": "Vui lòng chọn thuốc",
  }),
  frequencyPerDay: Joi.number().integer().min(1).required().messages({
    "number.base": "Lần/ngày phải là số",
    "number.min": "Lần/ngày ít nhất là 1",
  }),
  quantityPerTime: Joi.number().min(0).required().messages({
    "number.base": "Số lượng mỗi lần phải là số",
  }),
  quantity: Joi.number().min(1).required().messages({
    "number.base": "Tổng số lượng phải là số",
    "number.min": "Tổng số lượng phải lớn hơn 0",
  }),
  unit: Joi.string().required().messages({
    "any.required": "Đơn vị tính không được để trống",
  }),
  administrationRoute: Joi.string().allow("", null),
  timing: Joi.string().required().messages({
    "any.required": "Vui lòng nhập cách dùng (ví dụ: Sau ăn)",
  }),
  daysToTake: Joi.number().integer().min(1).required().messages({
    "number.min": "Số ngày uống ít nhất là 1",
  }),
  note: Joi.string().allow("", null),
  isInsuranceCovered: Joi.boolean().default(false),
});

const followUpSchema = Joi.object({
  appointmentDate: Joi.date().iso().allow(null).messages({
    "date.format": "Ngày hẹn không đúng định dạng",
  }),
  session: Joi.string()
    .valid(...Object.values(Session))
    .required()
    .messages({
      "any.only": "Buổi hẹn không hợp lệ (Morning/Afternoon/Evening)",
    }),
  reason: Joi.string().allow("", null),
});

export const upsertDiagnosisPrescriptionSchema = Joi.object({
  recordId: Joi.string().uuid().required().messages({
    "string.uuid": "ID bệnh án không hợp lệ",
    "any.required": "Thiếu ID bệnh án",
  }),
  evidenceBasedDiagnosis: Joi.boolean().default(false),

  diagnoses: Joi.object().allow(null),

  doctorAdvice: Joi.string().allow("", null),
  treatmentNote: Joi.string().allow("", null),
  prescriptionItems: Joi.array()
    .items(prescriptionItemSchema)
    .unique("medicineId")
    .messages({
      "array.unique": "Một loại thuốc không được kê hai lần trong một toa",
    }),

  followUp: followUpSchema.optional(),
});
