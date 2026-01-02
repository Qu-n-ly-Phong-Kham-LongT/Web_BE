// src/modules/auth/dtos/login.request.dto.ts
import Joi from "joi";

export interface RegisterRequestDto {
  email: string;
  password: string;
};

export const RegisterRequestSchema = Joi.object<RegisterRequestDto>({
  email: Joi.string().email().required().messages({
    "string.email": "Email không hợp lệ",
    "any.required": "Email là bắt buộc",
  }),
  password: Joi.string().min(6).required().messages({
    "string.min": "Mật khẩu tối thiểu 6 ký tự",
    "any.required": "Mật khẩu là bắt buộc",
  }),
}).required();
