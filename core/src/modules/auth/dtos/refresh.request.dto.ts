import Joi from "joi";

export interface RefreshRequestDto {
  refreshToken: string;
}

export const RefreshRequestSchema = Joi.object<RefreshRequestDto>({
  refreshToken: Joi.string().required().messages({
    "any.required": "Refresh token là bắt buộc",
  }),
}).required();
