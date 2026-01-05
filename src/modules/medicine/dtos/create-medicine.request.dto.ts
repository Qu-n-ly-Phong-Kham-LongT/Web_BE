import Joi from "joi";

export interface CreateMedicineRequestDto {
  medicineCode: string;
  medicineName: string;
  activeIngredient?: string;
  registrationNo?: string;
  isInsuranceCovered?: boolean;
  medicineCodeBhyt?: string;
  insurancePrice?: number;
  baseUnit?: string;
  totalQuantity?: number;
  sellPrice?: number;
  note?: string;
  supplier?: string;
  sideEffects?: string;
  isActive?: boolean;
}

export const CreateMedicineRequestSchema = Joi.object<CreateMedicineRequestDto>({
  medicineCode: Joi.string().required().messages({
    "string.empty": "Mã thuốc không được để trống",
    "any.required": "Mã thuốc là bắt buộc",
  }),
  medicineName: Joi.string().required().messages({
    "string.empty": "Tên thuốc không được để trống",
    "any.required": "Tên thuốc là bắt buộc",
  }),
  activeIngredient: Joi.string().optional().messages({
    "string.empty": "Hoạt chất không được để trống",
  }),
  registrationNo: Joi.string().optional(),
  isInsuranceCovered: Joi.boolean().optional(),
  medicineCodeBhyt: Joi.string().optional(),
  insurancePrice: Joi.number().min(0).optional().messages({
    "number.min": "Giá BHYT phải lớn hơn hoặc bằng 0",
  }),
  baseUnit: Joi.string().optional(),
  totalQuantity: Joi.number().integer().min(0).optional().messages({
    "number.min": "Số lượng phải lớn hơn hoặc bằng 0",
    "number.integer": "Số lượng phải là số nguyên",
  }),
  sellPrice: Joi.number().min(0).optional().messages({
    "number.min": "Giá bán phải lớn hơn hoặc bằng 0",
  }),
  note: Joi.string().optional(),
  supplier: Joi.string().optional(),
  sideEffects: Joi.string().optional(),
  isActive: Joi.boolean().optional(),
}).required();

