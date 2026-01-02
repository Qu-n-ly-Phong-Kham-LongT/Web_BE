import { prisma } from "../../../config/database.config";

export class AuthRepository {
  public async findUserByEmail(email: string) {
    return await prisma.user.findUnique({
      where: { Email: email },
    });
  }

  public async createUser(data: { email: string; password: string }) {
    return await prisma.user.create({
      data: {
        Email: data.email,
        Password: data.password,
      },
    });
  }
}
