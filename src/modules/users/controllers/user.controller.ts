import { UserService } from "../services/user.service";
import { Request, Response, NextFunction } from "express";
import { successResponse } from "../../../utils/response.util";
import {
  ChangeUserPasswordDto,
  CreateUserRequestDto,
  UpdateUserRequestDto,
} from "../dtos/user.request.dto";
import { AuthenticatedRequest } from "../../../middlewares/auth.middleware";

export class UserController {
  private userService = new UserService();

  public createUser = async (
    req: Request<{}, {}, CreateUserRequestDto>,
    res: Response,
    next: NextFunction
  ) => {
    const createData = req.body;
    const result = await this.userService.createUser(createData);
    return successResponse(res, 201, result, "Tạo người dùng thành công");
  };

  public getUserById = async (
    req: Request<{ id: string }, {}, {}>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const result = await this.userService.getUserById(req.params.id);
      return successResponse(
        res,
        200,
        result,
        "Lấy thông tin người dùng thành công"
      );
    } catch (err) {
      next(err);
    }
  };

  public updateUser = async (
    req: Request<{ id: string }, {}, UpdateUserRequestDto>,
    res: Response
  ) => {
    const { id } = req.params;
    const updateData = req.body;
    await this.userService.updateUser(id, updateData);
    return successResponse(res, 200, null, "Cập nhật người dùng thành công");
  };

  public changePassword = async (
    req: AuthenticatedRequest<{}, {}, ChangeUserPasswordDto>,
    res: Response
  ) => {
    const userId = req.payload?.userId;
    if (!userId) {
      return successResponse(
        res,
        401,
        null,
        "Unauthorized: Người dùng chưa đăng nhập"
      );
    }

    const { oldPassword, newPassword } = req.body;
    await this.userService.changePassword(userId, oldPassword, newPassword);
    return successResponse(res, 200, null, "Đổi mật khẩu thành công");
  };

  public getMyProfile = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.payload?.userId ?? "";

    const result = await this.userService.getUserById(userId);
    if (!result) {
      return successResponse(res, 404, null, "Người dùng không tồn tại");
    }

    return successResponse(
      res,
      200,
      result,
      "Lấy thông tin người dùng thành công"
    );
  };

  public getUserEnum = async (req: AuthenticatedRequest, res: Response) => {
    const result = await this.userService.getUserRoleEnum();
    return successResponse(
      res,
      200,
      result,
      "Lấy danh sách vai trò thành công"
    );
  };
}
