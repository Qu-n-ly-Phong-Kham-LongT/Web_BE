import Joi from "joi";

export interface ResultFileDto {
  size: number;
  relativePath: string;
  mimeType: string;
  serviceRequestId: string;
}

export const uploadFileSchema = Joi.object<ResultFileDto>({
  size: Joi.number().required(),
  relativePath: Joi.string().required(),
  mimeType: Joi.string().required(),
  serviceRequestId: Joi.string().required()
});
