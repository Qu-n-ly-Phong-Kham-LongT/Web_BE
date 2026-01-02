import { AuthService } from "../services/auth.service";
import { Request, Response } from "express";
import { successResponse } from "../../../utils/response.util";

export class AuthController {
  private authService = new AuthService();

  public register = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    let result = await this.authService.registerUser(email, password);
    return successResponse(res, 201, result, "User registered successfully");
  };
}
