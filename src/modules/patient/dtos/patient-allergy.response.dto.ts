import Joi from "joi";

export interface PatientAllergyResponseDto {
  allergyID: string;
  patientID: string;
  drug: string | null;
  reaction: string | null;
}

export const PatientAllergyResponseSchema = Joi.object<PatientAllergyResponseDto>({
  allergyID: Joi.string().uuid().required().description("Allergy ID"),
  patientID: Joi.string().uuid().required().description("Patient ID"),
  drug: Joi.string().allow(null).optional().description("Thuốc/thành phần dị ứng"),
  reaction: Joi.string().allow(null).optional().description("Phản ứng dị ứng"),
}).required();
