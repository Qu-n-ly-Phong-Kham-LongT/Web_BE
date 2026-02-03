import Joi from "joi";

export interface ServiceResultItemDto {
  configId: string;
  indicatorName?: string;
  valueString?: string | null;
  valueNumber?: number | null;
  unit?: string | null;
  images?: unknown;
  executedAt?: string | null;
}

export interface ServiceResultDetailDto {
  detailId?: string;
  itemId?: string;
  results: ServiceResultItemDto[];
}

export interface CreateServiceResultBulkRequestDto {
  requestId: string;
  details: ServiceResultDetailDto[];
}

export const serviceResultItemSchema = Joi.object({
  configId: Joi.string().required(),
  indicatorName: Joi.string().allow("", null),
  valueString: Joi.string().allow("", null),
  valueNumber: Joi.number().allow(null),
  unit: Joi.string().allow("", null).optional(),
  images: Joi.any().optional(),
  executedAt: Joi.string().allow("", null),
});

export const createServiceResultBulkSchema = Joi.object({
  requestId: Joi.string().required(),
  details: Joi.array()
    .items(
      Joi.object({
        detailId: Joi.string().optional(),
        itemId: Joi.string().optional(),
        results: Joi.array().items(serviceResultItemSchema).min(1).required(),
      }).or("detailId", "itemId")
    )
    .min(1)
    .required(),
});
