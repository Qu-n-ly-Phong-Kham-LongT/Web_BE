import Joi from "joi";

export interface PrescriptionTemplateDetailResponseDto {
  templateDetailId: string;
  medicineId: string;
  medicineName: string | null;
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
  createdBy: string | null;
  creatorName: string | null;
  details: PrescriptionTemplateDetailResponseDto[];
}

const PrescriptionTemplateDetailResponseSchema = Joi.object<PrescriptionTemplateDetailResponseDto>({
  templateDetailId: Joi.string().uuid().description("Template Detail ID"),
  medicineId: Joi.string().uuid().description("Medicine ID"),
  medicineName: Joi.string().allow(null).description("Tên thuốc"),
  baseUnit: Joi.string().allow(null).description("Đơn vị cơ bản"),
  defaultFrequency: Joi.number().allow(null).description("Số lần dùng mặc định"),
  defaultQuantityPerTime: Joi.number().allow(null).description("Liều lượng mỗi lần dùng mặc định"),
  defaultRoute: Joi.string().allow(null).description("Phương thức dùng mặc định"),
  defaultTiming: Joi.string().allow(null).description("Thời gian dùng mặc định"),
}).required();

export const PrescriptionTemplateResponseSchema = Joi.object<PrescriptionTemplateResponseDto>({
  templateId: Joi.string().uuid().description("Template ID"),
  templateName: Joi.string().description("Tên mẫu đơn thuốc"),
  description: Joi.string().allow(null).description("Mô tả"),
  createdBy: Joi.string().uuid().allow(null).description("Người tạo"),
  creatorName: Joi.string().allow(null).description("Tên người tạo"),
  details: Joi.array().items(PrescriptionTemplateDetailResponseSchema).description("Chi tiết mẫu đơn"),
}).required();

