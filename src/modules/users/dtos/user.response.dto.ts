import { UserRoleEnum } from "@prisma/client";
import joi from "joi";

export interface UserResponseDto {
    id: string;
    username: string;
    fullname: string;
    email: string;
    clinicId: string | null;
    clinicCode: string | null;
    status: number;
    createdAt: Date;
    roles: UserRoleEnum[]; 
}
export const UserResponseSchema = joi.object<UserResponseDto>({
    id: joi.string().description("User ID"),
    username: joi.string().description("Username"),
    fullname: joi.string().description("Full name"),
    email: joi.string().email().required().description("Email"),
    clinicId: joi.string().description("Clinic ID"),
    status: joi.number().description("Status"),
    createdAt: joi.date().description("Thời gian tạo"),
    roles: joi.array().items(joi.string().valid(...Object.values(UserRoleEnum))).description("Roles gán cho user"),
}).required();

export interface UserRoleEnumResponseDto {
    roles: string[];
}

export const UserRoleEnumResponseSchema = joi.object<UserRoleEnumResponseDto>({
    roles: joi.array().items(joi.string()).required().description("Danh sách role")
}).required()