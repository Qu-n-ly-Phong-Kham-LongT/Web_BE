import Joi from "joi";

export interface ServiceTemplateDetailResponseDto {
  templateDetailId: string;
  itemId: string;
  itemName: string | null;
  itemCode: string | null;
  unit: string | null;
  note: string | null;
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
  itemId: Joi.string().uuid().description("Service Item ID"),
  itemName: Joi.string().allow(null).description("Tên dịch vụ"),
  itemCode: Joi.string().allow(null).description("Mã dịch vụ"),
  unit: Joi.string().allow(null).description("Đơn vị"),
  note: Joi.string().allow(null).description("Ghi chú"),
}).required();

export const ServiceTemplateResponseSchema = Joi.object<ServiceTemplateResponseDto>({
  templateId: Joi.string().uuid().description("Template ID"),
  templateName: Joi.string().description("Tên mẫu dịch vụ"),
  description: Joi.string().allow(null).description("Mô tả"),
  isActive: Joi.boolean().allow(null).description("Trạng thái hoạt động"),
  details: Joi.array().items(ServiceTemplateDetailResponseSchema).description("Chi tiết mẫu dịch vụ"),
}).required();

