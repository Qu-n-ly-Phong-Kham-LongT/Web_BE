import Joi from "joi";

export interface CreatePatientRequestDto {
  fullName: string;
  gender?: "Male" | "Female" | "Other";
  dob: string; // ISO date string
  patientCategory?: "BHYT" | "DichVu" | "UuTien";
  phone: string;
  email?: string;
  identityCard?: string;
  insuranceNumber?: string;
  occupation?: string;
  address?: string;
}

export const CreatePatientRequestSchema = Joi.object<CreatePatientRequestDto>({
  fullName: Joi.string().required().messages({
    "string.empty": "Họ tên không được để trống",
    "any.required": "Họ tên là bắt buộc",
  }),
  gender: Joi.string().valid("Male", "Female", "Other").optional().messages({
    "any.only": "Giới tính phải là Nam, Nữ hoặc Khác",
  }),
  dob: Joi.string().isoDate().required().messages({
    "string.isoDate": "Ngày sinh không đúng định dạng ISO",
    "any.required": "Ngày sinh là bắt buộc",
  }),
  patientCategory: Joi.string().valid("BHYT", "DichVu", "UuTien").optional().messages({
    "any.only": "Loại bệnh nhân phải là BHYT, DichVu hoặc UuTien",
  }),
  phone: Joi.string()
    .pattern(/^0[1-9][0-9]{8}$/)
    .required()
    .messages({
      "string.pattern.base": "Số điện thoại không hợp lệ. Phải bắt đầu bằng 0 và có 10 chữ số",
      "string.empty": "Số điện thoại không được để trống",
      "any.required": "Số điện thoại là bắt buộc",
    }),
  email: Joi.string().email().optional().messages({
    "string.email": "Email không hợp lệ",
  }),
  identityCard: Joi.string().optional(),
  insuranceNumber: Joi.string()
    .pattern(/^[0-9]{15}$/)
    .optional()
    .messages({
      "string.pattern.base": "Mã BHYT phải là 15 chữ số",
    }),
  occupation: Joi.string().optional(),
  address: Joi.string().optional(),
}).required();

