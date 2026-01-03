import Joi from "joi";

export interface PatientResponseDto {
  patientID: string;
  patientCode: string;
  fullName: string;
  gender: "Male" | "Female" | "Other" | null;
  dob: string;
  patientCategory: "BHYT" | "DichVu" | "UuTien" | null;
  phone: string;
  email: string | null;
  identityCard: string | null;
  insuranceNumber: string | null;
  occupation: string | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
}

export const PatientResponseSchema = Joi.object<PatientResponseDto>({
  patientID: Joi.string().uuid().description("Patient ID"),
  patientCode: Joi.string().required().description("Mã bệnh nhân"),
  fullName: Joi.string().required().description("Họ và tên"),
  gender: Joi.string().valid("Male", "Female", "Other").allow(null).description("Giới tính"),
  dob: Joi.string().required().description("Ngày sinh"),
  patientCategory: Joi.string().valid("BHYT", "DichVu", "UuTien").allow(null).description("Đối tượng"),
  phone: Joi.string().required().description("Số điện thoại"),
  email: Joi.string().email().allow(null).description("Email"),
  identityCard: Joi.string().allow(null).description("CMND/CCCD"),
  insuranceNumber: Joi.string().allow(null).description("Số thẻ BHYT"),
  occupation: Joi.string().allow(null).description("Nghề nghiệp"),
  address: Joi.string().allow(null).description("Địa chỉ"),
  createdAt: Joi.string().required().description("Thời gian tạo"),
  updatedAt: Joi.string().required().description("Thời gian cập nhật"),
}).required();


