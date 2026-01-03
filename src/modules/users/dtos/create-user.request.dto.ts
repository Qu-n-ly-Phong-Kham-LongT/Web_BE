import { UserRoleEnum } from "@prisma/client";
import Joi from "joi";

export interface CreateUserRequestDto {
  username: string;
  password: string;
  fullname: string;
  email?: string | null;
  clinicId: string;
  roles: UserRoleEnum[];
}

export const CreateUserRequestSchema = Joi.object<CreateUserRequestDto>({
  username: Joi.string().alphanum().required().min(5).messages({
    "any.required": "Username là bắt buộc",
    "string.empty": "Username không được để trống",
    "string.alphanum": "Username chỉ được chứa chữ cái và số",
    "string.min": "Username phải có ít nhất 5 ký tự",
  }),

  password: Joi.string().required().min(6).messages({
    "any.required": "Password là bắt buộc",
    "string.empty": "Password không được để trống",
    "string.min": "Password phải có ít nhất 6 ký tự",
  }),

  fullname: Joi.string().required().messages({
    "any.required": "Fullname là bắt buộc",
    "string.empty": "Fullname không được để trống",
  }),

  email: Joi.string().email().allow(null, "").messages({
    "string.email": "Email không hợp lệ",
  }),

  clinicId: Joi.string().required().messages({
    "any.required": "ClinicId là bắt buộc",
    "string.empty": "ClinicId không được để trống",
  }),

    roles: Joi.array().items(Joi.string().valid(...Object.values(UserRoleEnum))).messages({
    "array.includes": "Roles chứa giá trị không hợp lệ",
  }),
});
