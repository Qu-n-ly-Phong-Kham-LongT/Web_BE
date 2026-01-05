import Joi from "joi";

export interface CreatePatientAllergyItemDto {
  reaction?: string;
  note?: string;
}

export interface CreatePatientAllergyRequestDto {
  allergies: CreatePatientAllergyItemDto[];
}

export const CreatePatientAllergyItemSchema = Joi.object<CreatePatientAllergyItemDto>({
  reaction: Joi.string().optional().messages({
    "string.empty": "Phản ứng dị ứng không được để trống",
  }),
  note: Joi.string().optional(),
});

export const CreatePatientAllergyRequestSchema = Joi.object<CreatePatientAllergyRequestDto>({
  allergies: Joi.array().items(CreatePatientAllergyItemSchema).min(1).required().messages({
    "array.min": "Danh sách dị ứng không được để trống",
    "any.required": "Danh sách dị ứng là bắt buộc",
  }),
}).required();

