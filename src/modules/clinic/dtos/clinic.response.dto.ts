import Joi from "joi";

export interface ClinicResponseDto {
  clinicId: string;
  clinicName: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  clinicCode: string | null;
}

export const ClinicResponseSchema = Joi.object<ClinicResponseDto>({
  clinicId: Joi.string().uuid(),
  clinicName: Joi.string().allow(null),
  address: Joi.string().allow(null),
  phone: Joi.string().allow(null),
  email: Joi.string().email().allow(null),
  clinicCode: Joi.string().allow(null),
}).required();
