import Joi from "joi";
import { SelectedConfigsDto } from "../../service-request/dtos/service-request.request.dto";

export interface UpdateServiceTemplateDetailDto {
  templateDetailId?: string; // Optional - có nghĩa là update, không có nghĩa là create mới
  itemId: string;
  selectedConfigs?: SelectedConfigsDto[] | null;
  note?: string | null;
}

export interface UpdateServiceTemplateRequestDto {
  templateName?: string;
  description?: string;
  isActive?: boolean;
  details?: UpdateServiceTemplateDetailDto[];
}

const selectedConfigSchema = Joi.object({
  configId: Joi.string().required(),
  selectedValues: Joi.array().items(Joi.string()).min(1).required(),
});

export const UpdateServiceTemplateDetailSchema = Joi.object<UpdateServiceTemplateDetailDto>({
  templateDetailId: Joi.string().uuid().optional().messages({
    "string.guid": "Template Detail ID phải là UUID hợp lệ",
  }),
  itemId: Joi.string().uuid().required().messages({
    "string.empty": "Service Item ID không được để trống",
    "any.required": "Service Item ID là bắt buộc",
  }),
  selectedConfigs: Joi.array().items(selectedConfigSchema).min(1).optional().allow(null).messages({
    "array.min": "Phải chọn ít nhất một cấu hình cho dịch vụ",
  }),
  note: Joi.string().allow("", null).optional(),
})

export const UpdateServiceTemplateRequestSchema = Joi.object<UpdateServiceTemplateRequestDto>({
  templateName: Joi.string().optional().messages({
    "string.empty": "Tên mẫu dịch vụ không được để trống",
  }),
  description: Joi.string().optional(),
  isActive: Joi.boolean().optional(),
  details: Joi.array().items(UpdateServiceTemplateDetailSchema).min(0).required()
})

