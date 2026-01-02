import type { RequestHandler } from "express";
import type Joi from "joi";
import { BaseError } from "../utils/base-error.util";

export const validateBody =
  (schema: Joi.ObjectSchema): RequestHandler =>
  (req, _res, next) => {
    const { value, error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      throw new BaseError(400, "Validation failed", {
        details: error.details.map((d) => ({
          field: d.path.join("."),
          message: d.message,
          type: d.type,
        })),
      });
    }

    req.body = value;
    next();
  };
