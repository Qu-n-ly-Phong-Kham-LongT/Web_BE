import Joi from "joi";

export interface UserResponseDto {
  id: string;
  fullName: string | null;
  createdAt: Date | null;
}

export const UserResponseSchema = Joi.object<UserResponseDto>({
  id: Joi.string().description("User id"),
  fullName: Joi.string().description("User full name"),
  createdAt: Joi.string().description("Created time (ISO)"),
}).required();