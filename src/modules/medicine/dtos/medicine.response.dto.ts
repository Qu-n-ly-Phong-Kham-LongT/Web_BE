import Joi from "joi";

export interface MedicineResponseDto {
  medicineID: string;
  medicineCode: string;
  medicineName: string;
  activeIngredient: string | null;
  registrationNo: string | null;
  isInsuranceCovered: boolean | null;
  medicineCodeBhyt: string | null;
  insurancePrice: number | 0;
  baseUnit: string | null;
  totalQuantity: number | 0;
  sellPrice: number | 0;
  note: string | null;
  supplier: string | null;
  sideEffects: string | null;
  isActive: boolean | null;
  createdAt: string;
}

export const MedicineResponseSchema = Joi.object<MedicineResponseDto>({
  medicineID: Joi.string().uuid().description("Medicine ID"),
  medicineCode: Joi.string().description("Mã thuốc"),
  medicineName: Joi.string().description("Tên thuốc"),
  activeIngredient: Joi.string().allow(null).description("Hoạt chất"),
  registrationNo: Joi.string().allow(null).description("Số đăng ký"),
  isInsuranceCovered: Joi.boolean().allow(null).description("Được BHYT chi trả"),
  medicineCodeBhyt: Joi.string().allow(null).description("Mã thuốc BHYT"),
  insurancePrice: Joi.number().description("Giá BHYT"),
  baseUnit: Joi.string().allow(null).description("Đơn vị cơ bản"),
  totalQuantity: Joi.number().description("Tổng số lượng"),
  sellPrice: Joi.number().description("Giá bán"),
  note: Joi.string().allow(null).description("Ghi chú"),
  supplier: Joi.string().allow(null).description("Nhà cung cấp"),
  sideEffects: Joi.string().allow(null).description("Tác dụng phụ"),
  isActive: Joi.boolean().allow(null).description("Trạng thái hoạt động"),
  createdAt: Joi.string().required().description("Thời gian tạo"),
}).required();

