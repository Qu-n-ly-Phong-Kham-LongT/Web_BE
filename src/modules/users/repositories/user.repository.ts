import { Prisma, User, UserRoleEnum } from "@prisma/client";
import { prisma } from "../../../config/database.config";
import { UserEntity } from "../entities/user.entity";

export type CreateUserRepo = Omit<UserEntity, "id" | "createdAt" | "updatedAt">;
export type UpdateUserRepo = Partial<CreateUserRepo>;
export type UserWithRoles = Prisma.UserGetPayload<{
  include: {
    clinic: true;
    roles: {
      include: {
        role: true;
      };
    };
  };
}>;

export class UserRepository {
  public async findUserByUsername(username: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { Username: username },
    });
  }

  public async createUser(
    createData: CreateUserRepo,
    roles: UserRoleEnum[]
  ): Promise<UserWithRoles> {
    return await prisma.user.create({
      data: {
        Username: createData.username,
        Password: createData.password,
        FullName: createData.fullname,
        Email: createData.email ?? null,
        clinicId: createData.clinicId,
        roles: {
          create: roles.map((role) => ({
            role: { connect: { RoleName: role } },
          })),
        },
      },
      include: {
        clinic: true,
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  //   public async updateUser(
  //     id: string,
  //     updateData: UpdateUserRepo
  //   ): Promise<User> {
  //     return await prisma.user.update({
  //       where: { UserID: id },
  //       data: updateData,
  //     });
  //   }
}
