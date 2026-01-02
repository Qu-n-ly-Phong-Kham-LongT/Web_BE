import Joi from "joi";

export interface RegisterResponseDto {
  id: string;
  email: string | null;
  createdAt: Date | null;
}

export const RegisterResponseSchema = Joi.object<RegisterResponseDto>({
  id: Joi.string().description("User id"),
  email: Joi.string().email().description("User email"),
  createdAt: Joi.string().description("Created time (ISO)"),
}).required();