import Joi from "joi";

export interface LoginResponseDto {
  accessToken: string;
  refreshToken: string;
}

export const LoginResponseSchema = Joi.object<LoginResponseDto>({
  accessToken: Joi.string().description("Access token"),
  refreshToken: Joi.string().description("Refresh token"),
}).required();

