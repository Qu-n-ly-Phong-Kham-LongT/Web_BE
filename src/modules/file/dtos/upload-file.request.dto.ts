import Joi from "joi";
import { FileType } from "@prisma/client";

export interface UploadFileRequestDto {
  type: FileType;
  size: number;
  relativePath: string;
  mimeType: string;
  medicalRecordId?: string;
  prescriptionId?: string;
  serviceRequestId?: string;
  serviceResultId?: string;
}

export const uploadFileSchema = Joi.object<UploadFileRequestDto>({
  type: Joi.string()
    .valid(...Object.values(FileType))
    .required(),

  size: Joi.number().required(),
  relativePath: Joi.string().required(),
  mimeType: Joi.string().required(),
  medicalRecordId: Joi.string().optional(),
  prescriptionId: Joi.string().optional(),
  serviceRequestId: Joi.string().optional(),
  serviceResultId: Joi.string().optional(),
}).xor(
  "medicalRecordId",
  "prescriptionId",
  "serviceRequestId",
  "serviceResultId"
);
