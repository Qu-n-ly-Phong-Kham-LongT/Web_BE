import { Request, Response, NextFunction } from "express";
import { jwtUtils } from "../utils/jwt.util";
import { BaseError } from "../utils/base-error.util";
import { IJwtPayload } from "../utils/jwt.util";

export interface AuthenticatedRequest<P = {}, ResBody = any, ReqBody = any, ReqQuery = any>  extends Request<P, ResBody, ReqBody, ReqQuery> {
    payload?: IJwtPayload;
}

export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new BaseError(401, "Unauthorized: Token không được cung cấp");
    }

    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwtUtils.verifyAccessToken(token);
        req.payload = decoded;
        next();
    } catch (err) {
        throw new BaseError(403, "Forbidden: Token không hợp lệ hoặc đã hết hạn");
    }
}

export const authorize = (requiredRoles: string[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        const userRoles = req.payload?.roles || [];
        const hasRole = requiredRoles.some(role => userRoles.includes(role));
        if (!hasRole) {
            throw new BaseError(403, "Forbidden: Bạn không có quyền để thực hiện chức năng này");
        }
        next();
    }
}
