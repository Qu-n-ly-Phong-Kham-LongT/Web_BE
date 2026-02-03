import { Request, Response, NextFunction } from "express";
import { BaseError } from "../utils/base-error.util";
import { errorResponse } from "../utils/response.util";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("ERROR:", err);

  if (err instanceof BaseError) {
    return errorResponse(res, err, err.statusCode);
  }

  return errorResponse(
    res,
    { message: "Internal Server Error", details: err },
    500
  );
};
