import { Prisma, User, UserRoleEnum } from "@prisma/client";
import { prisma } from "../../../config/database.config";

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
      where: { username: username },
    });
  }

  public async createUser(
    createData: Prisma.UserUncheckedCreateInput,
    roles: UserRoleEnum[]
  ): Promise<UserWithRoles> {
    return await prisma.user.create({
      data: {
        username: createData.username,
        password: createData.password,
        fullName: createData.fullName,
        email: createData.email ?? null,
        clinicId: createData.clinicId,
        status: createData.status,
        roles: {
          create: roles.map((role) => ({
            role: { connect: { roleName: role } },
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

  public async updateUser(
    id: string,
    updateData: Prisma.UserUncheckedUpdateInput
  ): Promise<User> {
    return await prisma.user.update({
      where: { userId: id },
      data: updateData,
    });
  }

  public async findUserById(id: string) {
    return await prisma.user.findUnique({
      where: { userId: id },
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
}
