import bcrypt from "bcrypt";
import { Prisma, UserRoleEnum, UserStatus } from "@prisma/client";
import { UserRepository } from "../repositories/user.repository";
import { CreateUserRequestDto, UpdateUserRequestDto } from "../dtos/user.request.dto";
import { UserResponseDto } from "../dtos/user.response.dto";
import { BaseError } from "../../../utils/base-error.util";
import { ClinicService } from "../../clinic/services/clinic.service";

export class UserService {
  private userRepository = new UserRepository();
  private clinicService = new ClinicService();

  public async createUser(createData: CreateUserRequestDto): Promise<UserResponseDto> {
    const checkExisting = await this.userRepository.findUserByUsername(createData.username);
    if (checkExisting) {
      throw new BaseError(409, "Tài khoản đăng nhập đã tồn tại.");
    }
    await this.clinicService.getClinicById(createData.clinicId);

    const hashedPassword = await bcrypt.hash(createData.password, 10);
    const rolesAssigned = createData.roles || [UserRoleEnum.Doctor];

    const newUser = await this.userRepository.createUser(
      {
        username: createData.username,
        password: hashedPassword,
        fullName: createData.fullname,
        email: createData.email ?? null,
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

  public async getUserById(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findUserById(id);
    if (!user) {
      throw new BaseError(404, "Người dùng không tồn tại")
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

  public async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findUserById(userId);
    if (!user) {
      throw new BaseError(404, "Không tìm thấy người dùng.");
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      throw new BaseError(400, "Mật khẩu cũ không đúng.");
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await this.userRepository.updateUser(userId, { password: hashedNewPassword });
  }

  public async updateUser(id: string, updateData: UpdateUserRequestDto): Promise<void> {
    const existingUser = await this.userRepository.findUserById(id);
    if (!existingUser) {
      throw new BaseError(404, "Không tìm thấy người dùng.");
    }

    const statusToUpdate = updateData.status as UserStatus | undefined;

    if (updateData.clinicId) {
      await this.clinicService.getClinicById(updateData.clinicId);
    }

    const updatePayload: Prisma.UserUncheckedUpdateInput = {
      fullName: updateData.fullname ?? existingUser.fullName,
      email: updateData.email !== undefined ? updateData.email : existingUser.email,
      clinicId: updateData.clinicId ?? existingUser.clinicId,
      status: statusToUpdate ?? existingUser.status,
    };

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
}
