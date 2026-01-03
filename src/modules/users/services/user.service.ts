import bcrypt from "bcrypt";
import { UserRepository } from "../repositories/user.repository";
import { CreateUserRequestDto } from "../dtos/create-user.request.dto";
import { CreateUserResponseDto } from "../dtos/create-user.response.dto";
import { BaseError } from "../../../utils/base-error.util";
import { UserRoleEnum } from "@prisma/client";

export class UserService {
  private userRepository = new UserRepository();

  public async createUser(
    createData: CreateUserRequestDto
  ): Promise<CreateUserResponseDto> {
    const checkExisting = await this.userRepository.findUserByUsername(
      createData.username
    );
    if (checkExisting) {
      throw new BaseError(409, "Tên đăng nhập đã tồn tại trong hệ thống.");
    }

    const hashedPassword = await bcrypt.hash(createData.password, 10);
    const rolesAssigned = createData.roles || [UserRoleEnum.Doctor];

    const newUser = await this.userRepository.createUser(
      {
        ...createData,
        password: hashedPassword,
      },
      rolesAssigned
    );

    if (!newUser) {
      throw new BaseError(500, "Tạo người dùng thất bại.");
    }

    const response: CreateUserResponseDto = {
      id: newUser.UserID,
      username: newUser.Username,
      fullname: newUser.FullName,
      email: newUser.Email ?? null,
      clinicId: newUser.clinicId,
      status: newUser.Status as unknown as number,
      createdAt: newUser.CreatedAt,
      roles: newUser.roles.map((ur: any) => ur.role.RoleName),
    };

    return response;
  }

  public async getUserById(id: string): Promise<CreateUserResponseDto | null> {
    const user = await this.userRepository.findUserById(id);
    if (!user) {
      return null;
    }

    const response: CreateUserResponseDto = {
      id: user.UserID,
      username: user.Username,
      fullname: user.FullName,
      email: user.Email ?? null,
      clinicId: user.clinicId,
      status: user.Status as unknown as number,
      createdAt: user.CreatedAt,
      roles: user.roles.map((ur: any) => ur.role.RoleName),
    };

    return response;
  }
}
