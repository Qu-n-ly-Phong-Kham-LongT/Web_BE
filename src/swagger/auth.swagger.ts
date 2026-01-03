import { joiToSwagger } from "../utils/joi-swagger.util";
import { LoginResponseSchema } from "../modules/auth/dtos/login.response.dto";

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
};

export default AuthSwagger;
