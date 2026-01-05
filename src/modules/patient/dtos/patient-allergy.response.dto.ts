import Joi from "joi";

export interface PatientAllergyResponseDto {
  allergyID: string;
  patientID: string;
  reaction: string | null;
  note: string | null;
}

export const PatientAllergyResponseSchema = Joi.object<PatientAllergyResponseDto>({
  allergyID: Joi.string().uuid().required().description("Allergy ID"),
  patientID: Joi.string().uuid().required().description("Patient ID"),
  reaction: Joi.string().optional().description("Phản ứng dị ứng"),
  note: Joi.string().optional().description("Ghi chú"),
}).required();

