import Joi from "joi";
import { ServiceTemplateResponseSchema } from "./service-template.response.dto";

export interface ServiceTemplateListResponseDto {
  templates: any[];
  pagination: {
    currentPage: number;
    size: number;
    totalItems: number;
    totalPages: number;
  } | null;
}

export const ServiceTemplateListResponseSchema = Joi.object<ServiceTemplateListResponseDto>({
  templates: Joi.array().items(ServiceTemplateResponseSchema).description("Danh sách mẫu dịch vụ"),
  pagination: Joi.object({
    currentPage: Joi.number().description("Trang hiện tại"),
    size: Joi.number().description("Số lượng mỗi trang"),
    totalItems: Joi.number().description("Tổng số bản ghi"),
    totalPages: Joi.number().description("Tổng số trang"),
  }).allow(null).description("Thông tin phân trang"),
}).required();

