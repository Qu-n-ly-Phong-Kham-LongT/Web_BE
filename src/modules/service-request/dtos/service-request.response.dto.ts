import Joi from "joi";

export interface ServiceRequestDetailResponseDto {
  requestDetailId: string;
  itemId: string | null;
  itemCode: string | null;
  itemName: string | null;
  selectedOptions: any;
}

export interface ServiceRequestResponseDto {
  requestId: string;
  requestCode: string | null;
  recordId: string | null;
  orderingDoctorId: string | null;
  note: string | null;
  createdAt: string | null;
  details: ServiceRequestDetailResponseDto[];
}

export const ServiceRequestDetailResponseSchema = Joi.object({
  requestDetailId: Joi.string().required(),
  itemId: Joi.string().allow(null),
  itemCode: Joi.string().allow(null),
  itemName: Joi.string().allow(null),
  selectedOptions: Joi.any(),
});

export const ServiceRequestResponseSchema = Joi.object({
  requestId: Joi.string().required(),
  requestCode: Joi.string().allow(null),
  recordId: Joi.string().allow(null),
  orderingDoctorId: Joi.string().allow(null),
  note: Joi.string().allow(null),
  createdAt: Joi.string().allow(null),
  details: Joi.array().items(ServiceRequestDetailResponseSchema).required(),
});
