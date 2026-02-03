import Joi from "joi"

export interface DictionaryResponseDto {
    key: string;
    value: string | null;
}

export const DictionaryResponseSchema = Joi.object({
  key: Joi.string().required(),
  value: Joi.string().allow(null),
});