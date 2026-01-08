import Joi from "joi";

export interface ServiceItemConfigResponseDto {
  configId: string;
  configCode: string | null;
  displayName: string | null;
  inputType: string | null;
  unit: string | null;
  metaData: any;
  refRange: string | null;
}

export interface ServiceTemplateDetailResponseDto {
  templateDetailId: string;
  itemId: string;
  itemName: string | null;
  itemCode: string | null;
  unit: string | null;
  note: string | null;
  configs: ServiceItemConfigResponseDto[];
}

export interface ServiceTemplateResponseDto {
  templateId: string;
  templateName: string;
  description: string | null;
  isActive: boolean | null;
  details: ServiceTemplateDetailResponseDto[];
}

const ServiceItemConfigResponseSchema = Joi.object<ServiceItemConfigResponseDto>({
  configId: Joi.string().uuid().description("Config ID"),
  configCode: Joi.string().allow(null).description("Mã config"),
  displayName: Joi.string().allow(null).description("Tên hiển thị"),
  inputType: Joi.string().allow(null).description("Loại input"),
  unit: Joi.string().allow(null).description("Đơn vị"),
  metaData: Joi.any().allow(null).description("Metadata"),
  refRange: Joi.string().allow(null).description("Khoảng tham chiếu"),
}).required();

const ServiceTemplateDetailResponseSchema = Joi.object<ServiceTemplateDetailResponseDto>({
  templateDetailId: Joi.string().uuid().description("Template Detail ID"),
  itemId: Joi.string().uuid().description("Service Item ID"),
  itemName: Joi.string().allow(null).description("Tên dịch vụ"),
  itemCode: Joi.string().allow(null).description("Mã dịch vụ"),
  unit: Joi.string().allow(null).description("Đơn vị"),
  note: Joi.string().allow(null).description("Ghi chú"),
  configs: Joi.array().items(ServiceItemConfigResponseSchema).description("Danh sách config của dịch vụ"),
}).required();

export const ServiceTemplateResponseSchema = Joi.object<ServiceTemplateResponseDto>({
  templateId: Joi.string().uuid().description("Template ID"),
  templateName: Joi.string().description("Tên mẫu dịch vụ"),
  description: Joi.string().allow(null).description("Mô tả"),
  isActive: Joi.boolean().allow(null).description("Trạng thái hoạt động"),
  details: Joi.array().items(ServiceTemplateDetailResponseSchema).description("Chi tiết mẫu dịch vụ"),
}).required();

