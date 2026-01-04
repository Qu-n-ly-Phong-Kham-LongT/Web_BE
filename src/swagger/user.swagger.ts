import { joiToSwagger } from "../utils/joi-swagger.util";
import { CreateUserRequestSchema, UpdateUserRequestSchema } from "../modules/users/dtos/user.request.dto";
import { UserResponseSchema } from "../modules/users/dtos/user.response.dto";

const UserSwagger = {
  "/api/users": {
    post: {
      summary: "Tạo tài khoản người dùng mới (Admin)",
      tags: ["Users"],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: joiToSwagger(CreateUserRequestSchema),
          },
        },
      },
      security: [{ bearerAuth: [] }],
      responses: {
        201: {
          description: "Tạo user thành công",
          content: {
            "application/json": {
              schema: joiToSwagger(UserResponseSchema),
            },
          },
        },
        400: { description: "Validation error" },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden" },
      },
    },
  },

  "/api/users/{id}": {
    get: {
      summary: "Lấy thông tin người dùng theo ID",
      tags: ["Users"],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "ID cần lấy thông tin",
        },
      ],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Lấy thông tin thành công",
          content: {
            "application/json": {
              schema: joiToSwagger(UserResponseSchema),
            },
          },
        },
        404: { description: "Người dùng không tồn tại" },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden" },
      },
    },

    put: {
      summary: "Cập nhật thông tin và roles người dùng (Admin)",
      tags: ["Users"],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "ID cần cập nhật",
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: joiToSwagger(UpdateUserRequestSchema),
          },
        },
      },
      responses: {
        200: { description: "Cập nhật thành công" },
        400: { description: "Validation error" },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden" },
      },
    },
  },

  "/api/users/me": {
    get: {
      summary: "Lấy thông tin hồ sơ người dùng hiện tại",
      tags: ["Users"],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Lấy thông tin thành công",
          content: {
            "application/json": {
              schema: joiToSwagger(UserResponseSchema),
            },
          },
        },
        404: { description: "Người dùng không tồn tại" },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden" },
      },
    },
  },

  "/api/users/change-password": {
    put: {
      summary: "Đổi mật khẩu người dùng",
      tags: ["Users"],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                oldPassword: { type: "string" },
                newPassword: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Đổi mật khẩu thành công" },
        400: { description: "Mật khẩu cũ không đúng" },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden" },
      },
    },
  },
};

export default UserSwagger;
