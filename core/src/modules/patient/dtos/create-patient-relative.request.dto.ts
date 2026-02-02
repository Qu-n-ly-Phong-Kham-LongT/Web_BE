import Joi from "joi";

export interface CreatePatientRelativeRequestDto {
  fullName?: string | null;
  phone?: string | null;
  relationship?: string | null;
  identityCard?: string | null;
  address?: string | null;
}

export const CreatePatientRelativeRequestSchema = Joi.object<CreatePatientRelativeRequestDto>({
  fullName: Joi.string().optional().allow(null, ""),
  phone: Joi.string()
    .pattern(/^0[1-9][0-9]{8}$/)
    .optional()
    .allow(null, "")
    .messages({
      "string.pattern.base": "Số điện thoại không hợp lệ. Phải bắt đầu bằng 0 và có 10 chữ số",
    }),
  relationship: Joi.string().optional().allow(null, ""),
  identityCard: Joi.string().optional().allow(null, ""),
  address: Joi.string().optional().allow(null, ""),
});
