import Joi from "joi";
import { PatientResponseSchema } from "./patient.response.dto";

export interface PatientListResponseDto {
  patients: any[];
  pagination: {
    currentPage: number;
    size: number;
    totalItems: number;
    totalPages: number;
  } | null;
}

export const PatientListResponseSchema = Joi.object<PatientListResponseDto>({
  patients: Joi.array().items(PatientResponseSchema).description("Danh sách bệnh nhân"),
  pagination: Joi.object({
    currentPage: Joi.number().description("Trang hiện tại"),
    size: Joi.number().description("Số lượng mỗi trang"),
    totalItems: Joi.number().description("Tổng số bản ghi"),
    totalPages: Joi.number().description("Tổng số trang"),
  }).allow(null).description("Thông tin phân trang"),
}).required();


