import { joiToSwagger } from "../utils/joi-swagger.util";
import { CreateUserRequestSchema } from "../modules/users/dtos/create-user.request.dto";
import { CreateUserResponseSchema } from "../modules/users/dtos/create-user.response.dto";

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
              schema: joiToSwagger(CreateUserResponseSchema),
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
            schema: {
            type: "string",
            },
            description: "ID của người dùng cần lấy thông tin",
        },
        ],
        security: [{ bearerAuth: [] }],
        responses: {
        200: {
            description: "Lấy thông tin người dùng thành công",
            content: {
            "application/json": {
                schema: joiToSwagger(CreateUserResponseSchema),
            },
            },
        },
        404: { description: "Người dùng không tồn tại" },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden" },
        },
    },
    },
};

export default UserSwagger;
