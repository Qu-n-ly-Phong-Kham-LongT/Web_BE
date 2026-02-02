import { InputType } from "@prisma/client";
import Joi from "joi";

export interface CreateServiceItemConfigDto {
  configCode: string;
  displayName: string;
  inputType: InputType;
  unit?: string;
  refRange?: string;
  metaData?: {
    uiStyle: string;
    allowMultiple: boolean;
    options: {
      label: string;
      value: string;
      surcharge: number;
    }[];
    [key: string]: any;
  };
  sortOrder?: number;
}

export interface CreateServiceItemRequestDto {
  itemCode: string;
  name: string;
  categoryId?: string;
  typeId: string;
  basePrice: number;
  unit?: string;
  specimen?: string;
  prepNote?: string;
  isActive?: boolean;
  configs?: CreateServiceItemConfigDto[];
}

export interface UpdateServiceItemDto {
  isActive: boolean;
}

export const updateServiceItemSchema = Joi.object<UpdateServiceItemDto>({
  isActive: Joi.boolean().required(),
}).options({ abortEarly: false, stripUnknown: true });

const createServiceConfigSchema = Joi.object({
  configCode: Joi.string().trim().min(2).max(50).required(),
  displayName: Joi.string().trim().min(2).max(200).required(),
  inputType: Joi.string()
    .valid(...Object.values(InputType))
    .default(InputType.Text),
  unit: Joi.string().trim().max(50).allow(null, "").optional(),
  refRange: Joi.string().trim().max(255).allow(null, "").optional(),

  metaData: Joi.object({
    uiStyle: Joi.string().optional(),
    allowMultiple: Joi.boolean().optional(),
    options: Joi.array()
      .items(
        Joi.object({
          label: Joi.string().required(),
          value: Joi.string().required(),
          surcharge: Joi.number().min(0).default(0),
        }),
      )
      .optional(),
  })
    .unknown(true)
    .allow(null)
    .optional(),
});

export const createServiceItemSchema = Joi.object({
  itemCode: Joi.string().trim().min(3).max(50).required(),
  name: Joi.string().trim().min(5).max(255).required(),

  basePrice: Joi.number().min(0).required().messages({
    "number.min": "Giá dịch vụ không được nhỏ hơn 0",
    "any.required": "Giá cơ bản là bắt buộc",
  }),

  categoryId: Joi.string().uuid().allow(null).optional(),
  typeId: Joi.string().uuid().required(),
  unit: Joi.string().trim().max(50).allow(null, "").optional(),
  specimen: Joi.string().trim().max(100).allow(null, "").optional(),
  prepNote: Joi.string().trim().max(1000).allow(null, "").optional(),
  isActive: Joi.boolean().default(true),

  configs: Joi.array().items(createServiceConfigSchema).optional(),
}).options({ abortEarly: false, stripUnknown: true });
