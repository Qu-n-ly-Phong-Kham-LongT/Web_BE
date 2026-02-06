import { UserRoleEnum } from "@prisma/client";
import Joi, { CustomHelpers } from "joi";

export interface CreateUserRequestDto {
  username: string;
  password: string;
  fullname: string;
  email: string;
  clinicId?: string;
  roles: UserRoleEnum[];
}

export interface ChangeUserPasswordDto {
  oldPassword: string;
  newPassword: string;
}

export interface UpdateUserRequestDto {
  fullname?: string;
  email?: string;
  clinicId?: string;
  status?: string;
  roles?: UserRoleEnum[];
}

export interface ForceUpdatePasswordDto {
  newPassword: string;
}

export const ForceUpdatePasswordSchema = Joi.object<ForceUpdatePasswordDto>({
  newPassword: Joi.string().min(6).max(100).required(),
}).options({ abortEarly: false, stripUnknown: true });

const roleEnumValues = Object.values(UserRoleEnum);
const normalizeRole = (value: string, helpers: CustomHelpers) => {
  const match = roleEnumValues.find(
    (r) => r.toLowerCase() === String(value).toLowerCase(),
  );
  if (!match) {
    return helpers.error("any.only", { valids: roleEnumValues });
  }
  return match;
};

const parseRolesArray = (value: unknown, helpers: CustomHelpers) => {
  if (value === undefined) return value;

  let raw: string[];
  if (typeof value === "string") {
    raw = value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  } else if (Array.isArray(value)) {
    raw = value as string[];
  } else {
    return helpers.error("any.invalid");
  }

  const normalized = raw.map((r) => normalizeRole(r, helpers));
  return normalized;
};

export const UpdateUserRequestSchema = Joi.object<UpdateUserRequestDto>({
  fullname: Joi.string().messages({
    "string.empty": "Fullname không được để trống",
  }),
  email: Joi.string().email().allow(null, "").messages({
    "string.email": "Email không hợp lệ",
  }),
  status: Joi.string().valid("Active", "Inactive").messages({
    "any.only": "Status phải là Active hoặc Inactive",
  }),
  roles: Joi.custom(parseRolesArray, "parse roles").messages({
    "any.only": "Roles chứa giá trị không hợp lệ",
    "any.invalid": "Roles phải là mảng hoặc chuỗi (phân tách bởi dấu phẩy)",
  }),
});

export const ChangeUserPasswordSchema = Joi.object<ChangeUserPasswordDto>({
  oldPassword: Joi.string().required().messages({
    "string.empty": "Mật khẩu cũ không được để trống",
  }),

  newPassword: Joi.string().required().min(6).messages({
    "any.required": "Mật khẩu mới là bắt buộc",
    "string.empty": "Mật khẩu mới không được để trống",
    "string.min": "Mật khẩu mới phải có ít nhất 6 ký tự",
  }),
});

export const CreateUserRequestSchema = Joi.object<CreateUserRequestDto>({
  username: Joi.string().alphanum().required().min(5).messages({
    "any.required": "Username là bắt buộc",
    "string.empty": "Username không được để trống",
    "string.alphanum": "Username chỉ chứa chữ và số",
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

  email: Joi.string().email().required().messages({
    "any.required": "Email là bắt buộc",
    "string.empty": "Email không được để trống",
    "string.email": "Email không hợp lệ",
  }),

  roles: Joi.custom(parseRolesArray, "parse roles").messages({
    "any.only": "Roles chứa giá trị không hợp lệ",
    "any.invalid": "Roles phải là mảng hoặc chuỗi (phân tách bởi dấu phẩy)",
  }),
});
