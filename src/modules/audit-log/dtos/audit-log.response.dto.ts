import Joi from "joi";

export interface AuditLogResponseDto {
  logId: string;
  clinicId: string | null;
  username: string | null;
  role: string | null;
  action: string;
  entityName: string;
  entityId: string | null;
  requestMethod: string;
  requestUrl: string;
  remoteAddress: string | null;
  requestBody: any;
  responseBody: any;
  statusCode: number | null;
  errorMessage: string | null;
  durationMs: number | null;
  createdAt: Date;
}

export const AuditLogResponseSchema = Joi.object<AuditLogResponseDto>({
  logId: Joi.string().required(),
  clinicId: Joi.string().allow(null),
  username: Joi.string().allow(null),
  role: Joi.string().allow(null),
  action: Joi.string().required(),
  entityName: Joi.string().required(),
  entityId: Joi.string().allow(null),
  requestMethod: Joi.string().required(),
  requestUrl: Joi.string().required(),
  remoteAddress: Joi.string().allow(null),
  requestBody: Joi.any().allow(null),
  responseBody: Joi.any().allow(null),
  statusCode: Joi.number().allow(null),
  errorMessage: Joi.string().allow(null),
  durationMs: Joi.number().allow(null),
  createdAt: Joi.date().required(),
}).required();
