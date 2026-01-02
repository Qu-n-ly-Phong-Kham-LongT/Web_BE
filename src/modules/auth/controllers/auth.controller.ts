import { AuthService } from "../services/auth.service";
import { Request, Response } from "express";
import { successResponse } from "../../../utils/response.util";
import { RegisterRequestDto } from "../dtos/register.request.dto";
import { RegisterResponseDto } from "../dtos/register.response.dto";
import { UserResponseDto } from "../dtos/user.response.dto";

export class AuthController {
  private authService = new AuthService();

  public register = async (
    req: Request<{}, {}, RegisterRequestDto>,
    res: Response<RegisterResponseDto>
  ) => {
    const { email, password } = req.body;
    let result: RegisterResponseDto = await this.authService.registerUser(email, password);
    return successResponse(res, 201, result, "User registered successfully");
  };

  public getUserById = async (
    req: Request,
    res: Response
  ) => {
    const { id } = req.params;
    let result: UserResponseDto | null = await this.authService.getUserById(id);
    return successResponse(
      res,
      200,
      result,
      "Get user by ID not implemented yet"
    );
  };
}
