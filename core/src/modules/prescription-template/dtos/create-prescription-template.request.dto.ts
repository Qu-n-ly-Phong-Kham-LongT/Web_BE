import Joi from "joi";

export interface CreatePrescriptionTemplateDetailDto {
  medicineId: string;
  defaultFrequency?: number;
  defaultQuantityPerTime?: number;
  defaultRoute?: string;
  defaultTiming?: string;
}

export interface CreatePrescriptionTemplateRequestDto {
  templateName: string;
  description?: string;
  daysToTake?: number;
  details: CreatePrescriptionTemplateDetailDto[];
}

export const CreatePrescriptionTemplateDetailSchema =
  Joi.object<CreatePrescriptionTemplateDetailDto>({
    medicineId: Joi.string().uuid().required().messages({
      "string.empty": "Medicine ID không được để trống",
      "any.required": "Medicine ID là bắt buộc",
    }),
    defaultFrequency: Joi.number().integer().min(1).optional().messages({
      "number.min": "Số lần dùng mặc định phải lớn hơn 0",
      "number.integer": "Số lần dùng mặc định phải là số nguyên",
    }),
    defaultQuantityPerTime: Joi.number().min(0).optional().messages({
      "number.min": "Liều lượng mỗi lần dùng phải lớn hơn hoặc bằng 0",
    }),
    defaultRoute: Joi.string().optional(),
    defaultTiming: Joi.string().optional(),
  })

export const CreatePrescriptionTemplateRequestSchema =
  Joi.object<CreatePrescriptionTemplateRequestDto>({
    templateName: Joi.string().required().messages({
      "string.empty": "Tên mẫu đơn thuốc không được để trống",
      "any.required": "Tên mẫu đơn thuốc là bắt buộc",
    }),
    description: Joi.string().optional(),
    daysToTake: Joi.number().integer().min(1).optional().messages({
      "number.min": "Ngày dùng phải lớn hơn 0",
      "number.integer": "Ngày dùng phải là số nguyên dương",
    }),
    details: Joi.array()
      .items(CreatePrescriptionTemplateDetailSchema)
      .min(0)
      .required()
      .messages({
        "any.required": "Chi tiết mẫu toa là bắt buộc",
      }),
  })
