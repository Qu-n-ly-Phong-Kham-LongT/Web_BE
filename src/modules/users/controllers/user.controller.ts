import { UserService } from "../services/user.service";
import { Request, Response, NextFunction } from "express";
import { successResponse } from "../../../utils/response.util";
import { CreateUserRequestDto } from "../dtos/create-user.request.dto";

export class UserController {
  private userService = new UserService();

  public createUser = async (
    req: Request<{}, {}, CreateUserRequestDto>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const createData = req.body;
      const result = await this.userService.createUser(createData);
      return successResponse(res, 201, result, "Tạo người dùng thành công");
    } catch (err) {
      next(err);
    }
  };

  public getUserById = async (
    req: Request<{ id: string }, {}, {}>,
    res: Response,
    next: NextFunction
  ) => {
    try {
        const result = await this.userService.getUserById(req.params.id);
        if (!result) {
            return successResponse(res, 404, null, "Người dùng không tồn tại");
        }
        return successResponse(res, 200, result, "Lấy thông tin người dùng thành công");
    } catch (err) {
      next(err);
    }
  };
}
