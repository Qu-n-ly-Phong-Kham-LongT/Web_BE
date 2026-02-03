export class BaseError extends Error {
    public readonly statusCode: number;
    public readonly details?: any;

    constructor(statusCode: number, message: string, details?: any) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;

        Error.captureStackTrace(this, this.constructor);
    }
}
