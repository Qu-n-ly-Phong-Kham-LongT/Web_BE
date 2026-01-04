import Joi from "joi";

export interface DeleteFileRequestDto {
  relativePath: string;
}

export const DeleteFileRequestSchema = Joi.object<DeleteFileRequestDto>({
  relativePath: Joi.string()
    .trim()
    .pattern(/^\/uploads\/.+/)
    .required(),
});
