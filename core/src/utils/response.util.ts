import { Response } from "express";

export const successResponse = (
    res: Response,
    statusCode: number = 200,
    data: any = {},
    message: string = "Success",
    pagination: any = null
) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
        pagination,
    });
};

export const errorResponse = (
    res: Response,
    error: { message?: string; details?: any },
    statusCode: number = 500
) => {
    return res.status(statusCode).json({
        success: false,
        message: error.message || "Internal Server Error",
        errors: error.details || null,
    });
};
