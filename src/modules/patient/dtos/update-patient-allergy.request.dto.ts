import Joi from "joi";

export interface UpdatePatientAllergyRequestDto {
  reaction?: string;
  note?: string;
}

export const UpdatePatientAllergyRequestSchema = Joi.object<UpdatePatientAllergyRequestDto>({
  reaction: Joi.string().optional().messages({
    "string.empty": "Phản ứng dị ứng không được để trống",
  }),
  note: Joi.string().optional(),
}).required();

