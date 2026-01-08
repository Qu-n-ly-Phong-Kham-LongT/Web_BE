import Joi from "joi";

export interface UpdateServiceTemplateDetailDto {
  templateDetailId?: string; // Optional - có nghĩa là update, không có nghĩa là create mới
  itemId: string;
  note?: string;
}

export interface UpdateServiceTemplateRequestDto {
  templateName?: string;
  description?: string;
  isActive?: boolean;
  details?: UpdateServiceTemplateDetailDto[];
}

export const UpdateServiceTemplateDetailSchema = Joi.object<UpdateServiceTemplateDetailDto>({
  templateDetailId: Joi.string().uuid().optional().messages({
    "string.guid": "Template Detail ID phải là UUID hợp lệ",
  }),
  itemId: Joi.string().uuid().required().messages({
    "string.empty": "Service Item ID không được để trống",
    "any.required": "Service Item ID là bắt buộc",
  }),
  note: Joi.string().optional(),
}).required();

export const UpdateServiceTemplateRequestSchema = Joi.object<UpdateServiceTemplateRequestDto>({
  templateName: Joi.string().optional().messages({
    "string.empty": "Tên mẫu dịch vụ không được để trống",
  }),
  description: Joi.string().optional(),
  isActive: Joi.boolean().optional(),
  details: Joi.array().items(UpdateServiceTemplateDetailSchema).min(1).optional().messages({
    "array.min": "Phải có ít nhất một dịch vụ trong mẫu",
  }),
}).required();

