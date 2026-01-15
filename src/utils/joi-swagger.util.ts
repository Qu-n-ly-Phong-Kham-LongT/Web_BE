import j2s from "joi-to-swagger";
import type Joi from "joi";

export const joiToSwagger = (schema: Joi.Schema) => {
  const { swagger } = j2s(schema);
  return swagger;
};
