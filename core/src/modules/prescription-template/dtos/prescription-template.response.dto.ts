import Joi from "joi";

export interface PrescriptionTemplateDetailResponseDto {
  templateDetailId: string;
  medicineId: string;
  medicineName: string | null;
  sellPrice: number | null; 
  baseUnit: string | null;
  defaultFrequency: number | null;
  defaultQuantityPerTime: number | null;
  defaultRoute: string | null;
  defaultTiming: string | null;
}

export interface PrescriptionTemplateResponseDto {
  templateId: string;
  templateName: string;
  description: string | null;
  daysToTake: number | null;
  createdBy: string | null;
  creatorName: string | null;
  details: PrescriptionTemplateDetailResponseDto[];
}

const PrescriptionTemplateDetailResponseSchema = Joi.object<PrescriptionTemplateDetailResponseDto>({
  templateDetailId: Joi.string().uuid().description("Template Detail ID"),
  medicineId: Joi.string().uuid().description("Medicine ID"),
  medicineName: Joi.string().allow(null).description("Tên thuốc"),
  baseUnit: Joi.string().allow(null).description("Đơn vị cơ bản"),
  sellPrice: Joi.string().allow(null).description("Giá bán của thuốc"),
  defaultFrequency: Joi.number().allow(null).description("Số lần dùng mặc định"),
  defaultQuantityPerTime: Joi.number().allow(null).description("Liều lượng mỗi lần dùng mặc định"),
  defaultRoute: Joi.string().allow(null).description("Phương thức dùng mặc định"),
  defaultTiming: Joi.string().allow(null).description("Thời gian dùng mặc định"),
}).required();

export const PrescriptionTemplateResponseSchema = Joi.object<PrescriptionTemplateResponseDto>({
  templateId: Joi.string().uuid().description("Template ID"),
  templateName: Joi.string().description("Template name"),
  description: Joi.string().allow(null).description("Description"),
  daysToTake: Joi.number().integer().allow(null).description("Days to take"),
  createdBy: Joi.string().uuid().allow(null).description("Created by"),
  creatorName: Joi.string().allow(null).description("Creator name"),
  details: Joi.array().items(PrescriptionTemplateDetailResponseSchema).description("Template details"),
}).required();





