import Joi from "joi";
import { SelectedConfigsDto } from "../../service-request/dtos/service-request.request.dto";

export interface CreateServiceTemplateDetailDto {
  itemId: string;
  selectedConfigs: SelectedConfigsDto[];
  note?: string | null;
}

export interface CreateServiceTemplateRequestDto {
  templateName: string;
  description?: string;
  isActive?: boolean;
  details: CreateServiceTemplateDetailDto[];
}

const selectedConfigSchema = Joi.object({
  configId: Joi.string().required(),
  selectedValues: Joi.array().items(Joi.string()).min(1).required(),
});

export const CreateServiceTemplateDetailSchema =
  Joi.object<CreateServiceTemplateDetailDto>({
    itemId: Joi.string().uuid().required().messages({
      "string.empty": "Service Item ID không được để trống",
      "any.required": "Service Item ID là bắt buộc",
    }),
    selectedConfigs: Joi.array()
      .items(selectedConfigSchema)
      .min(1)
      .required()
      .messages({
        "array.min": "Phải chọn ít nhất một cấu hình cho dịch vụ",
        "any.required": "Cấu hình dịch vụ là bắt buộc",
      }),
    note: Joi.string().allow("", null).optional(),
  })

export const CreateServiceTemplateRequestSchema =
  Joi.object<CreateServiceTemplateRequestDto>({
    templateName: Joi.string().required().messages({
      "string.empty": "Tên mẫu dịch vụ không được để trống",
      "any.required": "Tên mẫu dịch vụ là bắt buộc",
    }),
    description: Joi.string().allow("", null).optional(),
    isActive: Joi.boolean().optional(),
    details: Joi.array()
      .items(CreateServiceTemplateDetailSchema)
      .min(0)
      .required(),
  });
