import { prisma } from "../../../config/database.config";

export class AuthRepository {
  public async findUserByEmail(email: string) {
    return await prisma.user.findUnique({
      where: { Email: email },
    });
  }

  public async createUser(email: string, password: string) {
    return await prisma.user.create({
      data: {
        Email: email,
        Password: password,
      },
    });
  }

  public async findUserById(id: string) {
    return await prisma.user.findUnique({
      where: { UserID: id },
    });
  }
}
