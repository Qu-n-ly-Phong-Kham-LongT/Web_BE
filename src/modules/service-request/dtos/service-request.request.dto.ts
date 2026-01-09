import Joi from "joi";

export interface SelectedConfigsDto {
  configId: string;
  selectedValues: string[];
}

export interface CreateServiceRequestDetailDto {
  itemId: string;
  selectedConfigs: SelectedConfigsDto[];
  note?: string;
}

export interface CreateServiceRequestDto {
  recordId: string;
  orderingDoctorId?: string;
  note?: string | null;
  details: CreateServiceRequestDetailDto[];
}

const selectedConfigSchema = Joi.object({
  configId: Joi.string().required(),
  selectedValues: Joi.array().items(Joi.string()).min(1).required(),
});

const createServiceRequestDetailSchema = Joi.object({
  itemId: Joi.string().required(),
  selectedConfigs: Joi.array().items(selectedConfigSchema).required(),
  note: Joi.string().allow("", null),
});

export const createServiceRequestSchema = Joi.object({
  recordId: Joi.string().required(),
  orderingDoctorId: Joi.string().optional(),
  note: Joi.string().allow("", null),

  details: Joi.array()
    .items(createServiceRequestDetailSchema)
    .min(1)
    .required()
    .messages({
      "array.min": "Bạn phải chọn ít nhất một dịch vụ để tạo phiếu chỉ định.",
    }),
});
