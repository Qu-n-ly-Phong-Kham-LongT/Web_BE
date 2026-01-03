  import bcrypt from "bcrypt";
  import { BaseError } from "../../../utils/base-error.util";
  import { IJwtPayload, jwtUtils } from "../../../utils/jwt.util";
  import { LoginResponseDto } from "../dtos/login.response.dto";
  import { UserResponseDto } from "../dtos/user.response.dto";
  import { AuthRepository } from "../repositories/auth.repository";
  import { USER_STATUS } from "../../users/constants/user-role.constant";
  import { RefreshResponseDto } from "../dtos/refresh.response.dto";

  export class AuthService {
    private authRepository = new AuthRepository();

    public async loginUser(
      username: string,
      password: string
    ): Promise<LoginResponseDto> {
      const user = await this.authRepository.findUserByUsername(username);
      if (!user) {
        throw new BaseError(401, "Tài khoản hoặc mật khẩu không đúng.");
      }

      if (user.Status === USER_STATUS.INACTIVE) {
        throw new BaseError(403, "Tài khoản đã bị vô hiệu hóa.");
      }

      const isPasswordMatch = await bcrypt.compare(password, user.Password);
      if (!isPasswordMatch) {
        throw new BaseError(401, "Tài khoản hoặc mật khẩu không đúng.");
      }

      const payload: IJwtPayload = {
        userId: user.UserID,
        roles: (user.roles || [])
          .map((ur: any) => ur.role?.RoleName)
          .filter((r: string | undefined): r is string => Boolean(r)),
        clinicId: user.clinicId,
      };

      const accessToken = jwtUtils.generateAccessToken(payload);
      const refreshToken = jwtUtils.generateRefreshToken(payload);

      const decodedRefresh = jwtUtils.decodeToken(refreshToken);
      const expSeconds = decodedRefresh?.exp;
      if (!expSeconds) {
        throw new BaseError(500, "Refresh token tạo thất bại");
      }

      await this.authRepository.createRefreshToken(
        user.UserID,
        refreshToken,
        new Date(expSeconds * 1000)
      );

      const loginResponse: LoginResponseDto = {
        accessToken,
        refreshToken,
      };
      return loginResponse;
    }

    public async logoutUser(refreshToken: string): Promise<void> {
      const tokenRecord = await this.authRepository.findRefreshToken(refreshToken);
      if (!tokenRecord || tokenRecord.IsRevoked) {
        return;
      }
      await this.authRepository.revokeRefreshToken(refreshToken);
    }

    public async getUserById(id: string): Promise<UserResponseDto | null> {
      let user = await this.authRepository.findUserById(id);
      if (!user) {
        return null;
      }
      let userDto: UserResponseDto = {
        id: user.UserID,
        fullName: user.FullName,
        createdAt: user.CreatedAt,
      };
      return userDto;
    }

    public async refreshToken(refreshToken: string): Promise<RefreshResponseDto> {
      const decoded = await jwtUtils.verifyRefreshToken(refreshToken);

      const tokenRecord = await this.authRepository.findRefreshToken(refreshToken);
      if (!tokenRecord || tokenRecord.IsRevoked || tokenRecord.ExpiresAt < new Date()) {
        throw new BaseError(401, "Refresh token không hợp lệ.");
      }

      const user = await this.authRepository.findUserById(decoded.userId);
      if (!user) {
        throw new BaseError(401, "Refresh token không hợp lệ.");
      }

      if (user.Status === USER_STATUS.INACTIVE) {
        throw new BaseError(403, "Tài khoản đã bị vô hiệu hóa.");
      }

      const payload: IJwtPayload = {
        userId: user.UserID,
        roles: (user.roles || [])
          .map((ur: any) => ur.role?.RoleName)
          .filter((r: string | undefined): r is string => Boolean(r)),
        clinicId: user.clinicId,
      };

      const newAccessToken = jwtUtils.generateAccessToken(payload);
      const newRefreshToken = jwtUtils.generateRefreshToken(payload);

      const newDecoded = jwtUtils.decodeToken(newRefreshToken);
      const newExpSeconds = newDecoded?.exp;
      if (!newExpSeconds) {
        throw new BaseError(500, "Refresh token generate failed");
      }

      await this.authRepository.revokeRefreshToken(refreshToken);
      await this.authRepository.createRefreshToken(
        user.UserID,
        newRefreshToken,
        new Date(newExpSeconds * 1000)
      );
      
      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    }
  }
