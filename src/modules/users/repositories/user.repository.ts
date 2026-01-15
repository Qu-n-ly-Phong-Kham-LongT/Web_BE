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

  public async findUserByEmail(email: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: {
        email: email,
      },
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

  public async findUserById(
    id: string,
    clinicId?: string,
    tx?: Prisma.TransactionClient
  ) {
    const client = tx ?? prisma;
    return await client.user.findFirst({
      where: {
        userId: id,
        ...(clinicId ? { clinicId } : {}),
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

  public async getAllUser(
    page: number = 1,
    size: number = 10,
    search?: string,
    role?: UserRoleEnum,
    clinicId?: string
  ): Promise<{ users: UserWithRoles[]; totalItems: number }> {
    const skip = (page - 1) * size;
    const where: Prisma.UserWhereInput = {
      ...(clinicId ? { clinicId } : {}),
      ...(role
        ? { roles: { some: { role: { roleName: role } } } }
        : {}),
      ...(search
        ? {
            OR: [
              { username: { contains: search, mode: "insensitive" as const } },
              { fullName: { contains: search, mode: "insensitive" as const } },
              { email: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };
    const [users, totalItems] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: size,
        include: {
          clinic: true,
          roles: { include: { role: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, totalItems };
  }
}
