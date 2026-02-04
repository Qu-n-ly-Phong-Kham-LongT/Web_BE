import { UserService } from "../services/user.service";
import { Response } from "express";
import { successResponse } from "../../../utils/response.util";
import {
  ChangeUserPasswordDto,
  CreateUserRequestDto,
  ForceUpdatePasswordDto,
  UpdateUserRequestDto,
} from "../dtos/user.request.dto";
import { AuthenticatedRequest } from "../../../middlewares/auth.middleware";

export class UserController {
  private userService = new UserService();

  public createUser = async (
    req: AuthenticatedRequest<{}, {}, CreateUserRequestDto>,
    res: Response,
  ) => {
    const clinicId = req.payload?.clinicId ?? "";
    let createData = req.body;
    createData.clinicId = clinicId;
    const result = await this.userService.createUser(createData);
    return successResponse(res, 201, result, "Tạo người dùng thành công");
  };

  public getUserById = async (
    req: AuthenticatedRequest<{ id: string }, {}, {}>,
    res: Response,
  ) => {
    const clinicId = req.payload?.clinicId ?? undefined;
    const result = await this.userService.getUserById(req.params.id, clinicId);
    return successResponse(
      res,
      200,
      result,
      "Lấy thông tin người dùng thành công",
    );
  };

  public updateUser = async (
    req: AuthenticatedRequest<{ id: string }, {}, UpdateUserRequestDto>,
    res: Response,
  ) => {
    const { id } = req.params;
    const updateData = req.body;
    const clinicId = req.payload?.clinicId ?? undefined;
    await this.userService.updateUser(id, updateData, clinicId);
    return successResponse(res, 200, null, "Cập nhật thành công");
  };

  public changePassword = async (
    req: AuthenticatedRequest<{}, {}, ChangeUserPasswordDto>,
    res: Response,
  ) => {
    const userId = req.payload?.userId;
    if (!userId) {
      return successResponse(
        res,
        401,
        null,
        "Unauthorized: Người dùng chưa đăng nhập",
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
      "Lấy thông tin người dùng thành công",
    );
  };

  public getUserEnum = async (req: AuthenticatedRequest, res: Response) => {
    const result = await this.userService.getUserRoleEnum();
    return successResponse(
      res,
      200,
      result,
      "Lấy danh sách vai trò thành công",
    );
  };

  public getUserStatus = async (req: AuthenticatedRequest, res: Response) => {
    const result = await this.userService.getUserStatus();
    return successResponse(
      res,
      200,
      result,
      "Lấy danh sách trạng thái thành công",
    );
  };

  public getUsers = async (req: AuthenticatedRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const size = parseInt(req.query.size as string) || 10;
    const search = req.query.search as string | undefined;
    const role = req.query.role as string | undefined;
    const status = req.query.status as string | undefined;
    const clinicId = req.payload?.clinicId as string | undefined;

    const result = await this.userService.getUsers(
      page,
      size,
      search,
      role,
      clinicId,
      status,
    );
    return successResponse(
      res,
      200,
      result.users,
      "Lấy ds người dùng thành công",
      result.pagination,
    );
  };

  public updateUserPassword = async (
    req: AuthenticatedRequest<{ id: string }, {}, ForceUpdatePasswordDto>,
    res: Response,
  ) => {
    const clinicId = req.payload?.clinicId ?? undefined;
    const { newPassword } = req.body;
    await this.userService.forceUpdatePassword(req.params.id, newPassword, clinicId);
    return successResponse(res, 200, null, "Cập nhật mật khẩu cho người dùng thành công")
  };
}
