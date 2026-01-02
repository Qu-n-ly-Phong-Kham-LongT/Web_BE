import { BaseError } from "../../../utils/base-error.util";
import { RegisterResponseDto } from "../dtos/register.response.dto";
import { UserResponseDto } from "../dtos/user.response.dto";
import { AuthRepository } from "../repositories/auth.repository";

export class AuthService {
  private authRepository = new AuthRepository();

  public async registerUser(
    email: string,
    password: string
  ): Promise<RegisterResponseDto> {
    let existingUser = await this.authRepository.findUserByEmail(email);
    if (existingUser) {
      throw new BaseError(400, "User with this email already exists.");
    }
    let result = await this.authRepository.createUser(email, password);

    let newUser: RegisterResponseDto = {
      id: result.UserID,
      email: result.Email,
      createdAt: result.CreatedAt,
    };

    return newUser;
  }

  public async getUserById(id: string): Promise<UserResponseDto | null> {
    let user = await this.authRepository.findUserById(id);
    if (!user) {
      return null;
    }
    let userDto: UserResponseDto = {
      id: user.UserID,
      email: user.Email,
      createdAt: user.CreatedAt,
    };
    return userDto; 
  }
}
