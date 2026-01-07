import { InputType } from "@prisma/client";
import Joi from "joi";

export interface CreateServiceItemConfigDto {
  configCode: string;
  displayName: string;
  inputType: InputType;
  unit?: string;
  refRange?: string;
  metaData?: Record<string, any>;
  sortOrder?: number;
}

export interface CreateServiceItemRequestDto {
  itemCode: string;
  name: string;

  categoryId: string;
  typeId: string;
  unit?: string;
  specimen?: string;
  prepNote?: string;
  isActive?: boolean;

  configs?: CreateServiceItemConfigDto[];
}

const createServiceConfigSchema = Joi.object({
  configCode: Joi.string().trim().min(2).max(50).required().messages({
    "string.min": "Mã chỉ số phải có ít nhất {#limit} ký tự",
    "string.max": "Mã chỉ số không được vượt quá {#limit} ký tự",
    "any.required": "Mã chỉ số (configCode) là bắt buộc",
  }),

  displayName: Joi.string().trim().min(2).max(200).required().messages({
    "string.min": "Tên hiển thị phải có ít nhất {#limit} ký tự",
    "string.max": "Tên hiển thị quá dài (tối đa {#limit} ký tự)",
    "any.required": "Tên hiển thị (displayName) là bắt buộc",
  }),

  inputType: Joi.string()
    .valid(...Object.values(InputType))
    .default(InputType.Text),

  unit: Joi.string().trim().max(50).allow(null, "").optional().messages({
    "string.max": "Đơn vị tính không được vượt quá {#limit} ký tự",
  }),

  refRange: Joi.string().trim().max(255).allow(null, "").optional().messages({
    "string.max": "Khoảng tham chiếu không được vượt quá {#limit} ký tự",
  }),

  metaData: Joi.object().when("inputType", {
    is: "Select",
    then: Joi.object({
      options: Joi.array().min(1).required(), 
      allowMultiple: Joi.boolean(),
      uiStyle: Joi.string(),
    })
      .unknown(true)
      .required(),

    otherwise: Joi.object().unknown(true).allow(null).optional(),
  }),
});

export const createServiceItemSchema = Joi.object({
  itemCode: Joi.string().trim().min(3).max(50).required().messages({
    "string.min": "Mã dịch vụ phải có ít nhất {#limit} ký tự",
    "string.max": "Mã dịch vụ tối đa {#limit} ký tự",
    "any.required": "Mã dịch vụ là bắt buộc",
    "string.empty": "Mã dịch vụ không được để trống",
  }),

  name: Joi.string().trim().min(5).max(255).required().messages({
    "string.min": "Tên dịch vụ quá ngắn (tối thiểu {#limit} ký tự)",
    "string.max": "Tên dịch vụ quá dài (tối đa {#limit} ký tự)",
    "any.required": "Tên dịch vụ là bắt buộc",
  }),

  categoryId: Joi.string().uuid().allow(null).optional(),
  typeId: Joi.string().uuid().required().messages({
    "any.required": "Loại dịch vụ (Type) là bắt buộc",
  }),

  unit: Joi.string().trim().max(50).allow(null, "").optional(),

  specimen: Joi.string().trim().max(100).allow(null, "").optional().messages({
    "string.max": "Mẫu bệnh phẩm không được quá {#limit} ký tự",
  }),

  prepNote: Joi.string().trim().max(1000).allow(null, "").optional().messages({
    "string.max": "Ghi chú dặn dò không được quá {#limit} ký tự",
  }),

  isActive: Joi.boolean().default(true),

  configs: Joi.array().items(createServiceConfigSchema).optional(),
}).options({ abortEarly: false, stripUnknown: true });
