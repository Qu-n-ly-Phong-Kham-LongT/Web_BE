import rateLimit from "express-rate-limit";
import ENV from "../config/environment.config";
import { errorResponse } from "../utils/response.util";

export const apiLimiter = rateLimit({
  windowMs: ENV.rateLimitWindowMs,
  max: ENV.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    return errorResponse(
      res,
      { message: "Too many requests, please try again later." },
      429
    );
  },
});
