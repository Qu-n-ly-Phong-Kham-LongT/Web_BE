import Joi from "joi";

export interface LoginRequestDto {
  username: string;
  password: string;
}

export const LoginRequestSchema = Joi.object<LoginRequestDto>({
  username: Joi.string().required().messages({
    "any.required": "Username là bắt buộc",
    "string.empty": "Username không được để trống",
  }),
  password: Joi.string().required().messages({
    "any.required": "Mật khẩu là bắt buộc",
    "string.empty": "Mật khẩu không được để trống",
  }),
}).required();
