import Joi from "joi";
import { AuditLogResponseSchema } from "./audit-log.response.dto";

export interface AuditLogListResponseDto {
  logs: any[];
  pagination: {
    currentPage: number;
    size: number;
    totalItems: number;
    totalPages: number;
  } | null;
}

export const AuditLogListResponseSchema = Joi.object<AuditLogListResponseDto>({
  logs: Joi.array().items(AuditLogResponseSchema).description("Danh sách audit log"),
  pagination: Joi.object({
    currentPage: Joi.number().description("Trang hiện tại"),
    size: Joi.number().description("Số lượng mỗi trang"),
    totalItems: Joi.number().description("Tổng số bản ghi"),
    totalPages: Joi.number().description("Tổng số trang"),
  })
    .allow(null)
    .description("Thông tin phân trang"),
}).required();
