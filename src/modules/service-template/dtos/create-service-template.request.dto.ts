import Joi from "joi";

export interface CreateServiceTemplateDetailDto {
  itemId: string;
  note?: string;
}

export interface CreateServiceTemplateRequestDto {
  templateName: string;
  description?: string;
  isActive?: boolean;
  details: CreateServiceTemplateDetailDto[];
}

export const CreateServiceTemplateDetailSchema = Joi.object<CreateServiceTemplateDetailDto>({
  itemId: Joi.string().uuid().required().messages({
    "string.empty": "Service Item ID không được để trống",
    "any.required": "Service Item ID là bắt buộc",
  }),
  note: Joi.string().optional(),
}).required();

export const CreateServiceTemplateRequestSchema = Joi.object<CreateServiceTemplateRequestDto>({
  templateName: Joi.string().required().messages({
    "string.empty": "Tên mẫu dịch vụ không được để trống",
    "any.required": "Tên mẫu dịch vụ là bắt buộc",
  }),
  description: Joi.string().optional(),
  isActive: Joi.boolean().optional(),
  details: Joi.array().items(CreateServiceTemplateDetailSchema).min(1).required().messages({
    "array.min": "Phải có ít nhất một dịch vụ trong mẫu",
    "any.required": "Chi tiết mẫu dịch vụ là bắt buộc",
  }),
}).required();

