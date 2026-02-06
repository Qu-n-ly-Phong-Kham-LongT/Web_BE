import { UserRoleEnum, UserStatus } from "@prisma/client";
import { joiToSwagger } from "../utils/joi-swagger.util";
import {
  CreateUserRequestSchema,
  UpdateUserRequestSchema,
} from "../modules/users/dtos/user.request.dto";
import {
  UserResponseSchema,
  UserRoleEnumResponseSchema,
  UserStatusResponseSchema,
} from "../modules/users/dtos/user.response.dto";

const paginationSchema = {
  type: "object",
  properties: {
    currentPage: { type: "integer" },
    size: { type: "integer" },
    totalItems: { type: "integer" },
    totalPages: { type: "integer" },
  },
};

const UserSwagger = {
  "/api/users": {
    get: {
      summary: "Lấy ds người dùng (Admin)",
      tags: ["Users"],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "page",
          in: "query",
          required: false,
          schema: { type: "integer", default: 1 },
        },
        {
          name: "size",
          in: "query",
          required: false,
          schema: { type: "integer", default: 10 },
        },
        {
          name: "search",
          in: "query",
          required: false,
          schema: { type: "string" },
        },
        {
          name: "role",
          in: "query",
          required: false,
          schema: { type: "string", enum: Object.values(UserRoleEnum) },
        },
        {
          name: "status",
          in: "query",
          required: false,
          schema: { type: "string", enum: Object.values(UserStatus) },
        },
      ],
      responses: {
        200: {
          description: "Lấy ds người dùng thành công",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean" },
                  message: { type: "string" },
                  data: {
                    type: "array",
                    items: joiToSwagger(UserResponseSchema),
                  },
                  pagination: paginationSchema,
                },
              },
            },
          },
        },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden" },
      },
    },
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

  "/api/users/{id}/force-password": {
    put: {
      summary: "Admin đổi password người dùng",
      tags: ["Users"],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: { newPassword: { type: "string" } },
              required: ["newPassword"],
            },
          },
        },
      },
      responses: {
        200: { description: "Cập nhật mật khẩu người dùng thành công" },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden" },
        404: { description: "Không tìm thấy người dùng" },
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

  "/api/users/roles": {
    get: {
      summary: "Danh sách role",
      tags: ["Users"],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Lấy danh sách roles thành công",
          content: {
            "application/json": {
              schema: joiToSwagger(UserRoleEnumResponseSchema),
            },
          },
        },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden" },
      },
    },
  },

  "/api/users/status": {
    get: {
      summary: "Danh sách status",
      tags: ["Users"],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Lấy danh sách status thành công",
          content: {
            "application/json": {
              schema: joiToSwagger(UserStatusResponseSchema),
            },
          },
        },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden" },
      },
    },
  },
};

export default UserSwagger;
