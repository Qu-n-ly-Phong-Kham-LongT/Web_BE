import Joi from "joi";
import { Session } from "@prisma/client";

export interface ClinicSessionResponseDto {
  sessionType: Session;
  startTime: string;
  endTime: string;
}

export interface ClinicResponseDto {
  clinicId: string;
  clinicName: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  clinicCode: string | null;
  sessions: ClinicSessionResponseDto[];
}

export const ClinicResponseSchema = Joi.object<ClinicResponseDto>({
  clinicId: Joi.string().uuid(),
  clinicName: Joi.string().allow(null),
  address: Joi.string().allow(null),
  phone: Joi.string().allow(null),
  email: Joi.string().email().allow(null),
  clinicCode: Joi.string().allow(null),
  sessions: Joi.array().items(
    Joi.object({
      sessionType: Joi.string(),
      startTime: Joi.string(),
      endTime: Joi.string(),
    })
  ),
}).required();

export interface ClinicListResponseDto {
  clinics: ClinicResponseDto[];
  pagination: {
    currentPage: number;
    size: number;
    totalItems: number;
    totalPages: number;
  };
}

export const ClinicListResponseSchema = Joi.object<ClinicListResponseDto>({
  clinics: Joi.array().items(ClinicResponseSchema).description("Danh sách phòng khám"),
  pagination: Joi.object({
    currentPage: Joi.number().description("Trang hiện tại"),
    size: Joi.number().description("Số bản ghi mỗi trang"),
    totalItems: Joi.number().description("Tổng số bản ghi"),
    totalPages: Joi.number().description("Tổng số trang"),
  }).required(),
}).required();
