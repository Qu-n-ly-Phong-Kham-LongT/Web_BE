import Joi from "joi";

export interface CreatePatientAllergyItemDto {
  drug: string;
  reaction?: string;
}

export interface CreatePatientAllergyRequestDto {
  allergies: CreatePatientAllergyItemDto[];
}

export const CreatePatientAllergyItemSchema = Joi.object<CreatePatientAllergyItemDto>({
  drug: Joi.string().trim().min(1).required().messages({
    "string.empty": "Thuốc dị ứng là bắt buộc",
    "any.required": "Thuốc dị ứng là bắt buộc"
  }),
  reaction: Joi.string().trim().allow("", null).optional(),
});

export const CreatePatientAllergyRequestSchema = Joi.object<CreatePatientAllergyRequestDto>({
  allergies: Joi.array().items(CreatePatientAllergyItemSchema).min(1).required().messages({
    "array.min": "Cần ít nhất 1 thuốc dị ứng",
    "any.required": "Danh sách thuốc dị ứng là bắt buộc",
  }),
}).required();
