import Joi from "joi";

export interface PatientEnumResponseDto {
  gender: string[];
  patientCategory: string[];
}

export const PatientEnumResponseSchema = Joi.object<PatientEnumResponseDto>({
  gender: Joi.array().items(Joi.string()).required().description("Danh sách giới tính"),
  patientCategory: Joi.array().items(Joi.string()).required().description("Danh sách đối tượng bệnh nhân"),
}).required();

