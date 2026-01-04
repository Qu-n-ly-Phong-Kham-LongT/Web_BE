import { joiToSwagger } from "../utils/joi-swagger.util";
import { LoginResponseSchema } from "../modules/auth/dtos/login.response.dto";
import { RefreshRequestSchema } from "../modules/auth/dtos/refresh.request.dto";
import { RefreshResponseSchema } from "../modules/auth/dtos/refresh.response.dto";

const AuthSwagger = {
  "/api/auth/login": {
    post: {
      tags: ["Auth"],
      summary: "Đăng nhập người dùng",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                username: { type: "string" },
                password: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Login successful",
          content: {
            "application/json": {
              schema: joiToSwagger(LoginResponseSchema),
            },
          },
        },
      },
    },
  },

  "/api/auth/logout": {
    post: {
      tags: ["Auth"],
      summary: "Đăng xuất người dùng",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                refreshToken: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Logout successful" },
      },
    },
  },

  "/api/auth/refresh": {
    post: {
      tags: ["Auth"],
      summary: "Làm mới access/refresh token",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: joiToSwagger(RefreshRequestSchema),
          },
        },
      },
      responses: {
        200: {
          description: "Refresh successful",
          content: {
            "application/json": {
              schema: joiToSwagger(RefreshResponseSchema),
            },
          },
        },
      },
    },
  },
};

export default AuthSwagger;
