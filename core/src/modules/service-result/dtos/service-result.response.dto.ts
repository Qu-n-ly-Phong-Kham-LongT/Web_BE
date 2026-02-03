import Joi from "joi";

export interface ServiceResultResponseDto {
  resultId: string;
  detailId: string | null;
  requestId: string | null;
  itemId: string | null;
  configId: string | null;
  indicatorName: string | null;
  valueString: string | null;
  valueNumber: number | null;
  unit: string | null;
  executedAt: string | null;
}

export const ServiceResultResponseSchema = Joi.object({
  resultId: Joi.string().required(),
  detailId: Joi.string().allow(null),
  requestId: Joi.string().allow(null),
  itemId: Joi.string().allow(null),
  configId: Joi.string().allow(null),
  indicatorName: Joi.string().allow(null),
  valueString: Joi.string().allow(null),
  valueNumber: Joi.number().allow(null),
  unit: Joi.string().allow(null),
  images: Joi.any(),
  executedAt: Joi.string().allow(null),
});
