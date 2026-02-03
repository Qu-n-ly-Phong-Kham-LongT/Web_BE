import { joiToSwagger } from "../utils/joi-swagger.util";
import {
  DictionaryRequestSchema,
  DictionaryUpdateSchema,
} from "../modules/dictionary/dtos/dictionary.request.dto";
import { DictionaryResponseSchema } from "../modules/dictionary/dtos/dictionary.response.dto";
import {
  DictionaryBulkInsertSchema,
  DictionaryBulkDeleteSchema,
} from "../modules/dictionary/dtos/dictionary.bulk.dto";

const paginationSchema = {
  type: "object",
  properties: {
    currentPage: { type: "number" },
    size: { type: "number" },
    totalItems: { type: "number" },
    totalPages: { type: "number" },
  },
};

const DictionarySwagger = {
  "/api/dictionaries": {
    get: {
      tags: ["Dictionary"],
      summary: "Danh sách từ khoá (phân trang)",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "page", in: "query", schema: { type: "number" } },
        { name: "size", in: "query", schema: { type: "number" } },
        { name: "search", in: "query", schema: { type: "string" } },
        {
          name: "sortBy",
          in: "query",
          schema: { type: "string", enum: ["key", "value"] },
        },
        {
          name: "sort",
          in: "query",
          schema: { type: "string", enum: ["asc", "desc"] },
        },
      ],
      responses: {
        200: {
          description: "OK",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  data: {
                    type: "array",
                    items: joiToSwagger(DictionaryResponseSchema),
                  },
                  pagination: paginationSchema,
                },
              },
            },
          },
        },
      },
    },
    post: {
      tags: ["Dictionary"],
      summary: "Tạo từ khoá",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: joiToSwagger(DictionaryUpdateSchema),
          },
        },
      },
      responses: {
        201: {
          description: "Tạo thành công",
          content: {
            "application/json": {
              schema: joiToSwagger(DictionaryResponseSchema),
            },
          },
        },
      },
    },
  },
  "/api/dictionaries/bulk": {
    post: {
      tags: ["Dictionary"],
      summary: "Insert bulk từ khoá",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: joiToSwagger(DictionaryBulkInsertSchema),
          },
        },
      },
      responses: {
        201: { description: "Insert bulk thành công" },
      },
    },
    delete: {
      tags: ["Dictionary"],
      summary: "Delete bulk từ khoá",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: joiToSwagger(DictionaryBulkDeleteSchema),
          },
        },
      },
      responses: {
        200: { description: "Delete bulk thành công" },
      },
    },
  },
  "/api/dictionaries/{key}": {
    get: {
      tags: ["Dictionary"],
      summary: "Lấy từ khoá theo key",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "key",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        200: {
          description: "Thành công",
          content: {
            "application/json": {
              schema: joiToSwagger(DictionaryResponseSchema),
            },
          },
        },
      },
    },
    put: {
      tags: ["Dictionary"],
      summary: "Cập nhật từ khoá",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "key",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: joiToSwagger(DictionaryRequestSchema),
          },
        },
      },
      responses: {
        200: {
          description: "Cập nhật thành công",
          content: {
            "application/json": {
              schema: joiToSwagger(DictionaryResponseSchema),
            },
          },
        },
      },
    },
    delete: {
      tags: ["Dictionary"],
      summary: "Xoá từ khoá",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "key",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        200: { description: "Xoá thành công" },
      },
    },
  },
};

export default DictionarySwagger;
