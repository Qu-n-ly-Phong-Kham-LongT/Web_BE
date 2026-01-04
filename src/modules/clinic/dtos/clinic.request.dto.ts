import Joi from "joi";

export interface ClinicRequestDto {
  clinicName: string;
  address: string;
  phone: string;
  email: string;
}

export const ClinicRequestSchema = Joi.object({
  clinicName: Joi.string().trim().max(255).required().messages({
    "string.empty": "Tên phòng khám không được để trống",
    "any.required": "Tên phòng khám là trường bắt buộc",
    "string.max": "Tên phòng khám không được vượt quá 255 ký tự",
  }),

  address: Joi.string().trim().max(255).allow(null, "").messages({
    "string.max": "Địa chỉ không được vượt quá 255 ký tự",
  }),

  phone: Joi.string()
    .trim()
    .pattern(/^0[0-9]{9,10}$/)
    .allow(null, "")
    .messages({
      "string.pattern.base": "Số điện thoại không đúng định dạng (10-11 số)",
    }),

  email: Joi.string().trim().email().max(150).required().messages({
    "string.empty": "Email không được để trống",
    "string.email": "Email không đúng định dạng",
    "string.max": "Email không được vượt quá 150 ký tự",
  }),
});
