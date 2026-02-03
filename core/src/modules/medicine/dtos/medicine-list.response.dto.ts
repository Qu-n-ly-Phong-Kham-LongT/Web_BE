import Joi from "joi";
import { MedicineResponseSchema } from "./medicine.response.dto";

export interface MedicineListResponseDto {
  medicines: any[];
  pagination: {
    currentPage: number;
    size: number;
    totalItems: number;
    totalPages: number;
  } | null;
}

export const MedicineListResponseSchema = Joi.object<MedicineListResponseDto>({
  medicines: Joi.array().items(MedicineResponseSchema).description("Danh sách thuốc"),
  pagination: Joi.object({
    currentPage: Joi.number().description("Trang hiện tại"),
    size: Joi.number().description("Số lượng mỗi trang"),
    totalItems: Joi.number().description("Tổng số bản ghi"),
    totalPages: Joi.number().description("Tổng số trang"),
  }).allow(null).description("Thông tin phân trang"),
}).required();

