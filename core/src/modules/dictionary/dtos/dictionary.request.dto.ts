import Joi from "joi";

export interface DictionaryRequestDto {
  key: string;
  value: string | null;
}

export const DictionaryRequestSchema = Joi.object({
  key: Joi.string().required().messages({
    "string.empty": "Từ khoá không được để trống",
  }),
  value: Joi.string().allow(null).required().messages({
    "string.empty": "Ý nghĩa không được để trống",
  }),
}).options({ abortEarly: false });

export const DictionaryUpdateSchema = Joi.object({
  key: Joi.string().optional().messages({
    "string.empty": "Từ khoá không được để trống",
  }),
  value: Joi.string().allow(null).required().messages({
    "string.empty": "Ý nghĩa không được để trống",
  }),
}).options({ abortEarly: false });
