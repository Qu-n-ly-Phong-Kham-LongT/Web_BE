import bcrypt from "bcrypt";
import { Prisma, UserRoleEnum, UserStatus } from "@prisma/client";
import { UserRepository } from "../repositories/user.repository";
import {
  CreateUserRequestDto,
  UpdateUserRequestDto,
} from "../dtos/user.request.dto";
import {
  UserResponseDto,
  UserRoleEnumResponseDto,
} from "../dtos/user.response.dto";
import { BaseError } from "../../../utils/base-error.util";
import { ClinicService } from "../../clinic/services/clinic.service";
import { createPagination } from "../../../utils/pagination.util";

export class UserService {
  private userRepository = new UserRepository();
  private clinicService = new ClinicService();

  public async createUser(
    createData: CreateUserRequestDto
  ): Promise<UserResponseDto> {
    const checkExisting = await this.userRepository.findUserByUsername(
      createData.username
    );
    if (checkExisting) {
      throw new BaseError(409, "Tài khoản đăng nhập đã tồn tại.");
    }

    const duplicatedEmail = await this.userRepository.findUserByEmail(
      createData.email
    );
    if (duplicatedEmail) {
      throw new BaseError(409, "Email này đã được sử dụng.");
    }

    if (!createData.clinicId) {
      throw new BaseError(403, "Forbidden")
    }
    await this.clinicService.getClinicById(createData.clinicId);

    const hashedPassword = await bcrypt.hash(createData.password, 10);
    const rolesAssigned = createData.roles || [UserRoleEnum.Doctor];
    if (
      rolesAssigned.some(
        (role) => !Object.values(UserRoleEnum).includes(role as UserRoleEnum)
      )
    ) {
      throw new BaseError(400, "Role không hợp lệ");
    }

    const newUser = await this.userRepository.createUser(
      {
        username: createData.username,
        password: hashedPassword,
        fullName: createData.fullname,
        email: createData.email,
        clinicId: createData.clinicId,
        status: UserStatus.Active,
      },
      rolesAssigned
    );

    if (!newUser) {
      throw new BaseError(500, "Tạo người dùng mới thất bại.");
    }

    return {
      id: newUser.userId,
      username: newUser.username,
      fullname: newUser.fullName,
      email: newUser.email ?? null,
      clinicId: newUser.clinicId,
      clinicCode: newUser.clinic?.clinicCode ?? null,
      status: newUser.status as unknown as number,
      createdAt: newUser.createdAt,
      roles: newUser.roles.map((ur: any) => ur.role.roleName),
    };
  }

  public async getUserById(
    id: string,
    clinicId?: string
  ): Promise<UserResponseDto> {
    const user = await this.userRepository.findUserById(id, clinicId);
    if (!user) {
      throw new BaseError(404, "Người dùng không tồn tại");
    }

    return {
      id: user.userId,
      username: user.username,
      fullname: user.fullName,
      email: user.email ?? null,
      clinicId: user.clinicId,
      clinicCode: user.clinic?.clinicCode ?? null,
      status: user.status as unknown as number,
      createdAt: user.createdAt,
      roles: user.roles.map((ur: any) => ur.role.roleName),
    };
  }

  public async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await this.userRepository.findUserById(userId);
    if (!user) {
      throw new BaseError(404, "Không tìm thấy người dùng.");
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      throw new BaseError(400, "Role không hợp lệ");
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await this.userRepository.updateUser(userId, {
      password: hashedNewPassword,
    });
  }

  public async updateUser(
    id: string,
    updateData: UpdateUserRequestDto,
    clinicId?: string
  ): Promise<void> {
    const existingUser = await this.userRepository.findUserById(id, clinicId);
    if (!existingUser) {
      throw new BaseError(404, "Không tìm thấy người dùng");
    }

    if (clinicId && existingUser.clinicId !== clinicId) {
      throw new BaseError(403, "Không có quyền truy cập người dùng phòng khám khác");
    }

    const statusToUpdate = updateData.status as UserStatus | undefined;

    if (updateData.clinicId && clinicId && updateData.clinicId !== clinicId) {
      throw new BaseError(403, "Không có quyền thay đổi người dùng phòng khám khác");
    }

    if (updateData.clinicId) {
      await this.clinicService.getClinicById(updateData.clinicId);
    }

    const updatePayload: Prisma.UserUncheckedUpdateInput = {
      fullName: updateData.fullname ?? existingUser.fullName,
      email:
        updateData.email !== undefined ? updateData.email : existingUser.email,
      clinicId: updateData.clinicId ?? existingUser.clinicId,
      status: statusToUpdate ?? existingUser.status,
    };

    if (
      updateData.roles &&
      updateData.roles.some(
        (role) => !Object.values(UserRoleEnum).includes(role as UserRoleEnum)
      )
    ) {
      throw new BaseError(400, "Role không hợp lệ");
    }

    if (updateData.roles !== undefined) {
      updatePayload.roles = {
        deleteMany: {},
        create: updateData.roles.map((role) => ({
          role: { connect: { roleName: role } },
        })),
      };
    }

    await this.userRepository.updateUser(id, updatePayload);
  }

  public async getUserRoleEnum(): Promise<UserRoleEnumResponseDto> {
    return { roles: Object.values(UserRoleEnum) };
  }

  public async getUsers(
    page = 1,
    size = 10,
    search?: string,
    role?: string,
    clinicId?: string
  ) {
    if (role && !Object.values(UserRoleEnum).includes(role as UserRoleEnum)) {
      throw new BaseError(400, "Role không hợp lệ");
    }

    const normalizedRole = role as UserRoleEnum | undefined;

    const { users, totalItems } = await this.userRepository.getAllUser(
      page,
      size,
      search,
      normalizedRole,
      clinicId
    );
    return {
      users: users.map((u) => ({
        id: u.userId,
        username: u.username,
        fullname: u.fullName,
        email: u.email ?? null,
        clinicId: u.clinicId,
        clinicCode: u.clinic?.clinicCode ?? null,
        status: u.status as unknown as number,
        createdAt: u.createdAt,
        roles: u.roles.map((ur: any) => ur.role.roleName),
      })),
      pagination: createPagination(page, size, totalItems),
    };
  }
}
