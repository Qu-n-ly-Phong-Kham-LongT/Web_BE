import Joi from "joi";

export interface DictionaryBulkInsertDto {
  items: { key: string; value: string | null }[];
}

export interface DictionaryBulkDeleteDto {
  keys: string[];
}

export const DictionaryBulkInsertSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        key: Joi.string().required(),
        value: Joi.string().allow(null).required(),
      }),
    )
    .min(1)
    .required(),
}).options({ abortEarly: false });

export const DictionaryBulkDeleteSchema = Joi.object({
  keys: Joi.array().items(Joi.string().required()).min(1).required(),
}).options({ abortEarly: false });
