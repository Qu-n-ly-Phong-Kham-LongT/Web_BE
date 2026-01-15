import Joi from "joi";

export interface PatientAllergyItemDto {
  drug: string | null;
  reaction: string | null;
}

export interface PatientAllergyResponseDto {
  allergyID: string;
  patientID: string;
  data: PatientAllergyItemDto[];
}

export const PatientAllergyItemSchema = Joi.object<PatientAllergyItemDto>({
  drug: Joi.string().allow(null).optional().description("Drug"),
  reaction: Joi.string().allow(null).optional().description("Reaction"),
}).required();

export const PatientAllergyResponseSchema = Joi.object<PatientAllergyResponseDto>({
  allergyID: Joi.string().uuid().required().description("Allergy ID"),
  patientID: Joi.string().uuid().required().description("Patient ID"),
  data: Joi.array().items(PatientAllergyItemSchema).required().description("Allergy items"),
}).required();
