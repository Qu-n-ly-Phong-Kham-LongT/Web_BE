import Joi from "joi";
import { LoginResponseDto } from "./login.response.dto";

export interface RefreshResponseDto extends LoginResponseDto {}

export const RefreshResponseSchema = Joi.object<RefreshResponseDto>({
  accessToken: Joi.string().description("Access token"),
  refreshToken: Joi.string().description("Refresh token"),
}).required();
