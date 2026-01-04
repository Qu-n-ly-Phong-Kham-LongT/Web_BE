import { prisma } from "../../../config/database.config";

export class AuthRepository {
  public async findUserByUsername(username: string) {
    return await prisma.user.findUnique({
      where: { username },
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

  public async createRefreshToken(userId: string, token: string, expiresAt: Date) {
    return await prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });
  }

  public async findRefreshToken(token: string) {
    return await prisma.refreshToken.findUnique({
      where: { token },
    });
  }

  public async revokeRefreshToken(token: string) {
    return await prisma.refreshToken.update({
      where: { token },
      data: { isRevoked: true },
    });
  }

  public async revokeAllTokensForUser(userId: string) {
    return await prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
  }
}
