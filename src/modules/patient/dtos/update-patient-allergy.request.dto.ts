import Joi from "joi";

export interface UpdatePatientAllergyRequestDto {
  drug?: string;
  reaction?: string;
}

export const UpdatePatientAllergyRequestSchema = Joi.object<UpdatePatientAllergyRequestDto>({
  drug: Joi.string().trim().min(1).optional().messages({
    "string.empty": "Thuốc dị ứng không được bỏ trống",
  }),
  reaction: Joi.string().trim().min(1).optional().messages({
    "string.empty": "Phản ứng dị ứng không được để trống",
  }),
}).required();
