import { AuthService } from "../services/auth.service";
import { Request, Response } from "express";
import { successResponse } from "../../../utils/response.util";
import { UserResponseDto } from "../dtos/user.response.dto";
import { LoginRequestDto } from "../dtos/login.request.dto";
import { LoginResponseDto } from "../dtos/login.response.dto";
import { RefreshRequestDto } from "../dtos/refresh.request.dto";
import { RefreshResponseDto } from "../dtos/refresh.response.dto";

export class AuthController {
  private authService = new AuthService();

  public login = async (
    req: Request<{}, {}, LoginRequestDto>,
    res: Response<LoginResponseDto>
  ) => {
    const { username, password } = req.body;
    const result = await this.authService.loginUser(username, password);
    return successResponse(res, 200, result, "Đăng nhập thành công");
  };

  public refresh = async (
    req: Request<{}, {}, RefreshRequestDto>,
    res: Response<RefreshResponseDto>
  ) => {
    const { refreshToken } = req.body;
    const result = await this.authService.refreshToken(refreshToken);
    return successResponse(res, 200, result, "Làm mới token thành công");
  };

  public logout = async (
    req: Request<{}, {}, RefreshRequestDto>,
    res: Response<void>
  ) => {
    const { refreshToken } = req.body;
    await this.authService.logoutUser(refreshToken);
    return successResponse(res, 200, {}, "Đăng xuất thành công");
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
