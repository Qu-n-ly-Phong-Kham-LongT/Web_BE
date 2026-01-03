import jwt from "jsonwebtoken";
import { jwtConfigs } from "../config/jwt.config";

export interface IJwtPayload {
  userId: string;
  roles?: string[];
  clinicId: string;
  exp?: number;
}

export class jwtUtils {
  public static generateAccessToken(payload: IJwtPayload): string {
    return jwt.sign(payload, jwtConfigs.accessTokenSecret, {
      expiresIn:
        jwtConfigs.accessTokenExpiresIn as jwt.SignOptions["expiresIn"],
    });
  }

  public static generateRefreshToken(payload: IJwtPayload): string {
    return jwt.sign(payload, jwtConfigs.refreshTokenSecret, {
      expiresIn:
        jwtConfigs.refreshTokenExpiresIn as jwt.SignOptions["expiresIn"],
    });
  }

  public static verifyAccessToken(token: string): IJwtPayload {
    return jwt.verify(token, jwtConfigs.accessTokenSecret) as IJwtPayload;
  }

  public static verifyRefreshToken(token: string): IJwtPayload {
    return jwt.verify(token, jwtConfigs.refreshTokenSecret) as IJwtPayload;
  }

  public static decodeToken(token: string): IJwtPayload {
    return jwt.decode(token) as IJwtPayload;
  }
}
