import Joi from "joi";
import { SelectedConfigsDto } from "../../service-request/dtos/service-request.request.dto";
import {
  ServiceItemResponseDto,
  ServiceItemResponseSchema,
} from "../../service-item/dtos/service-item.response.dto";

export interface ServiceTemplateDetailResponseDto {
  templateDetailId: string;
  note: string | null;
  configSelections: SelectedConfigsDto[] | null;
  serviceItem: ServiceItemResponseDto | null;
}

export interface ServiceTemplateResponseDto {
  templateId: string;
  templateName: string;
  description: string | null;
  isActive: boolean | null;
  details: ServiceTemplateDetailResponseDto[];
}

const ServiceTemplateDetailResponseSchema = Joi.object<ServiceTemplateDetailResponseDto>({
  templateDetailId: Joi.string().uuid().description("Template Detail ID"),
  note: Joi.string().allow(null).description("Ghi chú"),
  configSelections: Joi.array()
    .items(
      Joi.object({
        configId: Joi.string().required(),
        selectedValues: Joi.array().items(Joi.string()).min(1).required(),
      })
    )
    .allow(null),
  serviceItem: ServiceItemResponseSchema.allow(null),
}).required();

export const ServiceTemplateResponseSchema = Joi.object<ServiceTemplateResponseDto>({
  templateId: Joi.string().uuid().description("Template ID"),
  templateName: Joi.string().description("Tên mẫu dịch vụ"),
  description: Joi.string().allow(null).description("Mô tả"),
  isActive: Joi.boolean().allow(null).description("Trạng thái hoạt động"),
  details: Joi.array()
    .items(ServiceTemplateDetailResponseSchema)
    .description("Chi tiết mẫu dịch vụ"),
}).required();
