import { BaseError } from "../../../utils/base-error.util";
import { AuthRepository } from "../repositories/auth.repository";

export class AuthService {
  private authRepository = new AuthRepository();

  public async registerUser(email: string, password: string) {
    let existingUser = await this.authRepository.findUserByEmail(email);
    if (existingUser) {
      throw new BaseError(400, "User with this email already exists.");
    }
    return await this.authRepository.createUser({ email, password });
  }
}
