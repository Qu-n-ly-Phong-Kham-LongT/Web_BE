import { prisma } from "../../../config/database.config";

export class AuthRepository {
  public async findUserByUsername(username: string) {
    return await prisma.user.findUnique({
      where: { Username: username },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
        clinic: true,
      },
    });
  }

  public async createUser(
    username: string,
    password: string,
    clinicId: string,
    fullName?: string,
    email?: string | null) 
    {
    return await prisma.user.create({
      data: {
        Username: username,
        Password: password,
        FullName: fullName ?? username,
        Email: email ?? null,
        clinicId: clinicId,
      },
      include: {
        clinic: true,
      },
    });
  }

  public async findUserById(id: string) {
    return await prisma.user.findUnique({
      where: { UserID: id },
      include: {
        clinic: true,
        roles: {
          include: {
            role: true,
          }
        }
      }
    });
  }

  public async createRefreshToken(userId: string, token: string, expiresAt: Date) {
    return await prisma.refreshToken.create({
      data: {
        Token: token,
        UserID: userId,
        ExpiresAt: expiresAt,
      },
    });
  }

  public async findRefreshToken(token: string) {
    return await prisma.refreshToken.findUnique({
      where: { Token: token },
    });
  }

  public async revokeRefreshToken(token: string) {
    return await prisma.refreshToken.update({
      where: { Token: token },
      data: { IsRevoked: true },
    });
  }

  public async revokeAllTokensForUser(userId: string) {
    return await prisma.refreshToken.updateMany({
      where: { UserID: userId, IsRevoked: false },
      data: { IsRevoked: true },
    });
  }
}
