import Joi from "joi";

export interface CreatePatientRelativeRequestDto {
  fullName: string;
  phone: string;
  relationship?: string;
  identityCard?: string;
  address?: string;
}

export const CreatePatientRelativeRequestSchema = Joi.object<CreatePatientRelativeRequestDto>({
  fullName: Joi.string().required().messages({
    "string.empty": "Họ tên không được để trống",
    "any.required": "Họ tên là bắt buộc",
  }),
  phone: Joi.string()
    .pattern(/^0[1-9][0-9]{8}$/)
    .required()
    .messages({
      "string.pattern.base": "Số điện thoại không hợp lệ. Phải bắt đầu bằng 0 và có 10 chữ số",
      "any.required": "Số điện thoại là bắt buộc",
    }),
  relationship: Joi.string().optional(),
  identityCard: Joi.string().optional(),
  address: Joi.string().optional(),
}).required();

