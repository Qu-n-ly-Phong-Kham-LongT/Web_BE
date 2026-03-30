import Joi from "joi";
import { Session } from "@prisma/client";
import {
  MedicalDiagnosisDto,
  DiagnosisSchema,
} from "../../medical-record/dtos/medical-record.request.dto";

export interface ServiceRequestDetailResponseDto {
  requestDetailId: string;
  itemId: string | null;
  itemCode: string | null;
  itemName: string | null;
  selectedOptions: any;
}

export interface ServiceRequestResultResponseDto {
  resultId: string;
  detailId: string | null;
  requestId: string | null;
  itemId: string | null;
  configId: string | null;
  indicatorName: string | null;
  valueString: string | null;
  valueNumber: number | null;
  unit: string | null;
  refRange: string | null;
  executedAt: string | null;
  updatedAt: string | null;
}

export interface ServiceRequestSelectedConfigResponseDto {
  configId: string;
  configCode: string | null;
  displayName: string | null;
  unit: string | null;
  refRange: string | null;
  selectedValues: string[];
  totalSurcharge: number | null;
}

export interface ServiceRequestDetailFullResponseDto extends ServiceRequestDetailResponseDto {
  selectedConfigs: ServiceRequestSelectedConfigResponseDto[];
  results: ServiceRequestResultResponseDto[];
}

export interface ServiceRequestResponseDto {
  requestId: string;
  requestCode: string | null;
  recordId: string | null;
  orderingDoctorId: string | null;
  diagnoses: MedicalDiagnosisDto | null;
  isPatientRequested: boolean | null;
  receiveResultAtClinic: boolean | null;
  isForFollowUp: boolean | null;
  isFollowUpTransferred: boolean | null;
  followUpDate: string | null;
  followUpSession: Session | null;
  note: string | null;
  diagnosisNote: string | null;
  isPrinted: boolean | null;
  createdAt: string | null;
  updatedAt: string | null;
  details: ServiceRequestDetailResponseDto[];
}

export interface ServiceRequestFullResponseDto extends Omit<
  ServiceRequestResponseDto,
  "details"
> {
  recordCode: string | null;
  patientId: string | null;
  details: ServiceRequestDetailFullResponseDto[];
}

export const ServiceRequestDetailResponseSchema = Joi.object({
  requestDetailId: Joi.string().required(),
  itemId: Joi.string().allow(null),
  itemCode: Joi.string().allow(null),
  itemName: Joi.string().allow(null),
  selectedOptions: Joi.any(),
});

export const ServiceRequestResultResponseSchema = Joi.object({
  resultId: Joi.string().required(),
  detailId: Joi.string().allow(null),
  requestId: Joi.string().allow(null),
  itemId: Joi.string().allow(null),
  configId: Joi.string().allow(null),
  indicatorName: Joi.string().allow(null),
  valueString: Joi.string().allow(null),
  valueNumber: Joi.number().allow(null),
  unit: Joi.string().allow(null),
  refRange: Joi.string().allow(null),
  executedAt: Joi.string().allow(null),
});

export const ServiceRequestDetailFullResponseSchema =
  ServiceRequestDetailResponseSchema.keys({
    selectedConfigs: Joi.array()
      .items(
        Joi.object({
          configId: Joi.string().required(),
          configCode: Joi.string().allow(null),
          displayName: Joi.string().allow(null),
          unit: Joi.string().allow(null),
          refRange: Joi.string().allow(null),
          selectedValues: Joi.array().items(Joi.string()).required(),
          totalSurcharge: Joi.number().allow(null),
        }),
      )
      .required(),
    results: Joi.array().items(ServiceRequestResultResponseSchema).required(),
  });

export const ServiceRequestResponseSchema = Joi.object({
  requestId: Joi.string().required(),
  requestCode: Joi.string().allow(null),
  recordId: Joi.string().allow(null),
  orderingDoctorId: Joi.string().allow(null),
  diagnoses: DiagnosisSchema.allow(null),
  isPatientRequested: Joi.boolean().allow(null),
  receiveResultAtClinic: Joi.boolean().allow(null),
  isForFollowUp: Joi.boolean().allow(null),
  isFollowUpTransferred: Joi.boolean().allow(null),
  followUpDate: Joi.string().allow(null),
  followUpSession: Joi.string().allow(null),
  note: Joi.string().allow(null),
  diagnosisNote: Joi.string().allow(null),
  isPrinted: Joi.boolean().allow(null),
  createdAt: Joi.string().allow(null),
  details: Joi.array().items(ServiceRequestDetailResponseSchema).required(),
});

export const ServiceRequestFullResponseSchema = Joi.object({
  requestId: Joi.string().required(),
  requestCode: Joi.string().allow(null),
  recordId: Joi.string().allow(null),
  recordCode: Joi.string().allow(null),
  orderingDoctorId: Joi.string().allow(null),
  diagnoses: DiagnosisSchema.allow(null),
  isPatientRequested: Joi.boolean().allow(null),
  receiveResultAtClinic: Joi.boolean().allow(null),
  isForFollowUp: Joi.boolean().allow(null),
  isFollowUpTransferred: Joi.boolean().allow(null),
  followUpDate: Joi.string().allow(null),
  followUpSession: Joi.string().allow(null),
  note: Joi.string().allow(null),
  diagnosisNote: Joi.string().allow(null),
  isPrinted: Joi.boolean().allow(null),
  createdAt: Joi.string().allow(null),
  updatedAt: Joi.string().allow(null),
  patientId: Joi.string().allow(null),
  details: Joi.array().items(ServiceRequestDetailFullResponseSchema).required(),
});
