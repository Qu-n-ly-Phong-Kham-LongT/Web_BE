import Joi from "joi";

export interface PatientRelativeResponseDto {
  relativeID: string;
  patientID: string;
  fullName: string;
  phone: string;
  relationship?: string | null;
  identityCard?: string | null;
  address?: string | null;
}

export const PatientRelativeResponseSchema = Joi.object<PatientRelativeResponseDto>({
  relativeID: Joi.string().uuid().required().description("Relative ID"),
  patientID: Joi.string().uuid().required().description("Patient ID"),
  fullName: Joi.string().required().description("Họ và tên"),
  phone: Joi.string().required().description("Số điện thoại"),
  relationship: Joi.string().optional().description("Mối quan hệ"),
  identityCard: Joi.string().optional().description("CMND/CCCD"),
  address: Joi.string().optional().description("Địa chỉ"),
}).required();

