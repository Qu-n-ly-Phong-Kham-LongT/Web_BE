import Joi from "joi";
import {
  CreatePatientRelativeRequestDto,
  CreatePatientRelativeRequestSchema,
} from "./create-patient-relative.request.dto";

export interface CreatePatientRequestDto {
  fullName?: string;
  gender?: "Male" | "Female" | "Other";
  dob?: string;
  patientCategory?: "BHYT" | "DichVu" | "UuTien";
  phone?: string;
  email?: string;
  identityCard?: string;
  insuranceNumber?: string;
  occupation?: string;
  address?: string;
  relatives?: Array<CreatePatientRelativeRequestDto | null> | null;
}

export const CreatePatientRequestSchema = Joi.object<CreatePatientRequestDto>({
  fullName: Joi.string().optional().allow(null, "").messages({
    "string.empty": "Họ tên không được để trống",
  }),
  gender: Joi.string()
    .valid("Male", "Female", "Other")
    .optional()
    .allow(null)
    .messages({
      "any.only": "Giới tính phải là Male, Female hoặc Other",
    }),
  dob: Joi.string().isoDate().optional().allow(null, "").messages({
    "string.isoDate": "Ngày sinh không đúng định dạng ISO",
  }),
  patientCategory: Joi.string()
    .valid("BHYT", "DichVu", "UuTien")
    .optional()
    .allow(null)
    .messages({
      "any.only": "Loại bệnh nhân phải là BHYT, DichVu hoặc UuTien",
    }),
  phone: Joi.string()
    .pattern(/^0[1-9][0-9]{8}$/)
    .optional()
    .allow(null, "")
    .messages({
      "string.pattern.base":
        "Số điện thoại không hợp lệ. Phải bắt đầu bằng 0 và có 10 chữ số",
    }),
  email: Joi.string().email().optional().allow(null, "").messages({
    "string.email": "Email không hợp lệ",
  }),
  identityCard: Joi.string().optional().allow(null, ""),
  insuranceNumber: Joi.string()
    .pattern(/^[0-9]{15}$/)
    .optional()
    .allow(null, "")
    .messages({
      "string.pattern.base": "Mã BHYT phải là 15 chữ số",
    }),
  occupation: Joi.string().optional().allow(null, ""),
  address: Joi.string().optional().allow(null, ""),
  relatives: Joi.array()
    .items(Joi.alternatives().try(CreatePatientRelativeRequestSchema, Joi.valid(null)))
    .optional()
    .allow(null),
}).required();
