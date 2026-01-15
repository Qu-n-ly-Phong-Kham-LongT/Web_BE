import Joi from "joi";

export interface UpdatePatientRequestDto {
  fullName?: string;
  gender?: "Male" | "Female" | "Other";
  dob?: string; // ISO date string
  patientCategory?: "BHYT" | "DichVu" | "UuTien";
  phone?: string;
  email?: string;
  identityCard?: string;
  insuranceNumber?: string;
  occupation?: string;
  address?: string;
}

export const UpdatePatientRequestSchema = Joi.object<UpdatePatientRequestDto>({
  fullName: Joi.string().optional().messages({
    "string.empty": "Họ tên không được để trống",
  }),
  gender: Joi.string().valid("Male", "Female", "Other").optional().messages({
    "any.only": "Giới tính phải là Nam, Nữ hoặc Khác",
  }),
  dob: Joi.string().isoDate().optional().messages({
    "string.isoDate": "Ngày sinh không đúng định dạng ISO",
  }),
  patientCategory: Joi.string().valid("BHYT", "DichVu", "UuTien").optional().messages({
    "any.only": "Loại bệnh nhân phải là BHYT, DichVu hoặc UuTien",
  }),
  phone: Joi.string()
    .pattern(/^0[1-9][0-9]{8}$/)
    .optional()
    .messages({
      "string.pattern.base": "Số điện thoại không hợp lệ. Phải bắt đầu bằng 0 và có 10 chữ số",
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

