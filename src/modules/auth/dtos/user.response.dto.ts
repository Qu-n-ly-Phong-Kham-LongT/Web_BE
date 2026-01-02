import Joi from "joi";

export interface UserResponseDto {
  id: string;
  email: string | null;
  createdAt: Date | null;
}

export const UserResponseSchema = Joi.object<UserResponseDto>({
  id: Joi.string().description("User id"),
  email: Joi.string().email().description("User email"),
  createdAt: Joi.string().description("Created time (ISO)"),
}).required();