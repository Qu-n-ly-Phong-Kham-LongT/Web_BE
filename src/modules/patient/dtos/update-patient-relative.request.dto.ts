import Joi from "joi";

export interface UpdatePatientRelativeRequestDto {
  fullName?: string;
  phone?: string;
  relationship?: string;
  identityCard?: string;
  address?: string;
}

export const UpdatePatientRelativeRequestSchema = Joi.object<UpdatePatientRelativeRequestDto>({
  fullName: Joi.string().optional().messages({
    "string.empty": "Họ tên không được để trống",
  }),
  phone: Joi.string()
    .pattern(/^0[1-9][0-9]{8}$/)
    .optional()
    .messages({
      "string.pattern.base": "Số điện thoại không hợp lệ. Phải bắt đầu bằng 0 và có 10 chữ số",
    }),
  relationship: Joi.string().optional(),
  identityCard: Joi.string().optional(),
  address: Joi.string().optional(),
}).required();

