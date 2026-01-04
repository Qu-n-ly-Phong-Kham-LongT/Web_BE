import { UserRoleEnum } from "@prisma/client";
import joi from "joi";

export interface UserResponseDto {
    id: string;
    username: string;
    fullname: string;
    email: string | null;
    clinicId: string | null;
    status: number;
    createdAt: Date;
    roles: UserRoleEnum[]; 
}
export const UserResponseSchema = joi.object<UserResponseDto>({
    id: joi.string().description("User ID"),
    username: joi.string().description("Username of the user"),
    fullname: joi.string().description("Full name of the user"),
    email: joi.string().email().allow(null).description("Email of the user"),
    clinicId: joi.string().description("Clinic ID associated with the user"),
    status: joi.number().description("Status of the user"),
    createdAt: joi.date().description("Creation date of the user"),
    roles: joi.array().items(joi.string().valid(...Object.values(UserRoleEnum))).description("Roles assigned to the user"),
}).required();