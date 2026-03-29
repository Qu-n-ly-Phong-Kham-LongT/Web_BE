import { Session } from "@prisma/client";
import Joi from "joi";

export interface FollowUpDto {
  appointmentDate?: string | Date | null;
  session: Session;
  reason?: string | null;
}

export interface GetFollowUpsQueryDto {
  startDate: Date;
  endDate: Date;
  page: number;
  limit: number;
}

export const getFollowUpsQuerySchema = Joi.object<GetFollowUpsQueryDto>({
  startDate: Joi.date().iso().required().messages({
    "date.base": "startDate phải là ngày hợp lệ",
    "date.format": "startDate phải theo định dạng ISO (YYYY-MM-DD)",
    "any.required": "startDate là bắt buộc",
  }),
  endDate: Joi.date().iso().min(Joi.ref("startDate")).required().messages({
    "date.base": "endDate phải là ngày hợp lệ",
    "date.format": "endDate phải theo định dạng ISO (YYYY-MM-DD)",
    "date.min": "endDate phải lớn hơn hoặc bằng startDate",
    "any.required": "endDate là bắt buộc",
  }),
  page: Joi.number().integer().min(1).default(1).messages({
    "number.base": "page phải là số",
    "number.min": "page phải lớn hơn hoặc bằng 1",
  }),
  limit: Joi.number().integer().min(1).max(100).default(10).messages({
    "number.base": "limit phải là số",
    "number.min": "limit phải lớn hơn hoặc bằng 1",
    "number.max": "limit không được lớn hơn 100",
  }),
});

export const getFollowUpsSchema = getFollowUpsQuerySchema;
