import { joiToSwagger } from "../utils/joi-swagger.util";
import {
  Icd10ListResponseSchema,
  Icd10RequestSchema,
  Icd10ResponseSchema,
} from "../modules/icd-10/dtos/icd-10.dto";

const Icd10Swagger = {
  "/api/icd10": {
    post: {
      tags: ["ICD-10"],
      summary: "Tạo mã ICD-10",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: joiToSwagger(Icd10RequestSchema),
          },
        },
      },
      responses: {
        201: {
          description: "Tạo ICD-10 thành công",
          content: {
            "application/json": {
              schema: joiToSwagger(Icd10ResponseSchema),
            },
          },
        },
        400: { description: "Validation error" },
        401: { description: "Unauthorized" },
        409: { description: "Mã ICD-10 đã tồn tại" },
      },
    },
    get: {
      tags: ["ICD-10"],
      summary: "Lấy danh sách ICD-10",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "page",
          in: "query",
          schema: { type: "integer", default: 1 },
          required: false,
          description: "Số trang",
        },
        {
          name: "size",
          in: "query",
          schema: { type: "integer", default: 10 },
          required: false,
          description: "Số bản ghi mỗi trang",
        },
        {
          name: "search",
          in: "query",
          schema: { type: "string" },
          required: false,
          description: "Tìm theo mã hoặc mô tả",
        },
      ],
      responses: {
        200: {
          description: "Lấy danh sách ICD-10 thành công",
          content: {
            "application/json": {
              schema: joiToSwagger(Icd10ListResponseSchema),
            },
          },
        },
        401: { description: "Unauthorized" },
      },
    },
  },
  "/api/icd10/{code}": {
    put: {
      tags: ["ICD-10"],
      summary: "Cập nhật ICD-10",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "code",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "Mã ICD-10 cần cập nhật",
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: joiToSwagger(Icd10RequestSchema),
          },
        },
      },
      responses: {
        200: {
          description: "Cập nhật ICD-10 thành công",
          content: {
            "application/json": {
              schema: joiToSwagger(Icd10ResponseSchema),
            },
          },
        },
        400: { description: "Validation error" },
        401: { description: "Unauthorized" },
        404: { description: "Không tìm thấy ICD-10" },
        409: { description: "Mã ICD-10 đã tồn tại" },
      },
    },

    delete: {
      tags: ["ICD-10"],
      summary: "Xoá mã ICD-10",
      description: "Chỉ dành cho Admin",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "code",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "Mã ICD-10 cần xoá",
        },
      ],
      responses: {
        200: {
          description: "Xoá ICD-10 thành công",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "Xoá ICD-10 thành công" },
                },
              },
            },
          },
        },
        401: { description: "Chưa đăng nhập" },
        403: { description: "Không có quyền" },
        404: { description: "Không tìm thấy mã ICD-10 để xoá" },
      },
    },
  },
};

export default Icd10Swagger;
