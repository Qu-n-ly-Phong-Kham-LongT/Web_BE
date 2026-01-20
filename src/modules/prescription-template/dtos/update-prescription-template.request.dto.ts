import Joi from "joi";

export interface UpdatePrescriptionTemplateDetailDto {
  templateDetailId?: string; // Optional - có nghĩa là update, không có nghĩa là create mới
  medicineId: string;
  defaultFrequency?: number;
  defaultQuantityPerTime?: number;
  defaultRoute?: string;
  defaultTiming?: string;
}

export interface UpdatePrescriptionTemplateRequestDto {
  templateName?: string;
  description?: string;
  daysToTake?: number;
  details?: UpdatePrescriptionTemplateDetailDto[];
}

export const UpdatePrescriptionTemplateDetailSchema = Joi.object<UpdatePrescriptionTemplateDetailDto>({
  templateDetailId: Joi.string().uuid().optional().messages({
    "string.guid": "Template Detail ID phải là UUID hợp lệ",
  }),
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
}).required();

export const UpdatePrescriptionTemplateRequestSchema = Joi.object<UpdatePrescriptionTemplateRequestDto>({
  templateName: Joi.string().optional().messages({
    "string.empty": "Tên mẫu đơn thuốc không được để trống",
  }),
  description: Joi.string().optional(),
  daysToTake: Joi.number().integer().min(1).optional().messages({
    "number.min": "Days to take must be greater than 0",
    "number.integer": "Days to take must be an integer",
  }),
  details: Joi.array().items(UpdatePrescriptionTemplateDetailSchema).min(1).optional().messages({
    "array.min": "Phải có ít nhất một thuốc trong mẫu đơn",
  }),
}).required();





