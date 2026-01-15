import Joi from "joi";
import { PrescriptionTemplateResponseSchema } from "./prescription-template.response.dto";

export interface PrescriptionTemplateListResponseDto {
  templates: any[];
  pagination: {
    currentPage: number;
    size: number;
    totalItems: number;
    totalPages: number;
  } | null;
}

export const PrescriptionTemplateListResponseSchema = Joi.object<PrescriptionTemplateListResponseDto>({
  templates: Joi.array().items(PrescriptionTemplateResponseSchema).description("Danh sách mẫu đơn thuốc"),
  pagination: Joi.object({
    currentPage: Joi.number().description("Trang hiện tại"),
    size: Joi.number().description("Số lượng mỗi trang"),
    totalItems: Joi.number().description("Tổng số bản ghi"),
    totalPages: Joi.number().description("Tổng số trang"),
  }).allow(null).description("Thông tin phân trang"),
}).required();


