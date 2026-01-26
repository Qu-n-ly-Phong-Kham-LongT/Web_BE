import { joiToSwagger } from "../utils/joi-swagger.util";

import { CreateServiceTemplateRequestSchema } from "../modules/service-template/dtos/create-service-template.request.dto";

import { UpdateServiceTemplateRequestSchema } from "../modules/service-template/dtos/update-service-template.request.dto";

import { ServiceTemplateResponseSchema } from "../modules/service-template/dtos/service-template.response.dto";

import { ServiceTemplateListResponseSchema } from "../modules/service-template/dtos/service-template-list.response.dto";

const paginationSchema = {
  type: "object",

  properties: {
    currentPage: { type: "integer" },

    size: { type: "integer" },

    totalItems: { type: "integer" },

    totalPages: { type: "integer" },
  },
};

const ServiceTemplateSwagger = {
  "/api/service-templates": {
    post: {
      tags: ["Service Template"],

      summary: "Tạo mới mẫu dịch vụ",

      description: "Tạo mẫu dịch vụ mới với danh sách dịch vụ",

      requestBody: {
        required: true,

        content: {
          "application/json": {
            schema: joiToSwagger(CreateServiceTemplateRequestSchema),
          },
        },
      },

      security: [{ bearerAuth: [] }],

      responses: {
        201: {
          description: "Tạo mẫu dịch vụ thành công",

          content: {
            "application/json": {
              schema: joiToSwagger(ServiceTemplateResponseSchema),
            },
          },
        },

        400: {
          description: "Lỗi validation hoặc dịch vụ trùng lặp/không tồn tại",
        },
      },
    },

    get: {
      tags: ["Service Template"],

      summary: "Lấy danh sách mẫu dịch vụ",

      description: "Lấy danh sách mẫu dịch vụ có phân trang và tìm kiếm",

      parameters: [
        {
          name: "page",

          in: "query",

          required: false,

          schema: { type: "integer", default: 1 },

          description: "Số trang",
        },

        {
          name: "size",

          in: "query",

          required: false,

          schema: { type: "integer", default: 10 },

          description: "Số lượng mỗi trang",
        },

        {
          name: "search",

          in: "query",

          required: false,

          schema: { type: "string" },

          description: "Tìm kiếm theo tên hoặc mô tả mẫu dịch vụ",
        },

        {
          name: "isActive",

          in: "query",

          required: false,

          schema: { type: "boolean" },

          description: "Lọc theo trạng thái hoạt động (true/false)",
        },

        {
          name: "sort",

          in: "query",

          required: false,

          schema: { type: "string", enum: ["asc", "desc"], default: "asc" },

          description: "Sắp xếp theo tên (asc/desc)",
        },
      ],

      security: [{ bearerAuth: [] }],

      responses: {
        200: {
          description: "Lấy danh sách mẫu dịch vụ thành công",

          content: {
            "application/json": {
              schema: {
                type: "object",

                properties: {
                  success: { type: "boolean", example: true },

                  message: {
                    type: "string",

                    example: "Lấy danh sách mẫu dịch vụ thành công",
                  },

                  data: {
                    type: "array",

                    items: joiToSwagger(ServiceTemplateResponseSchema),
                  },

                  pagination: paginationSchema,
                },
              },
            },
          },
        },
      },
    },
  },

  "/api/service-templates/active-items": {
    get: {
      tags: ["Core Businesses"],
      summary: "Lấy danh sách mẫu dịch vụ (chỉ item hoạt động)",
      description:
        "Lấy danh sách mẫu dịch vụ có phân trang và tìm kiếm. Chỉ trả về các serviceItem đang hoạt động.",
      parameters: [
        {
          name: "page",
          in: "query",
          required: false,
          schema: { type: "integer", default: 1 },
          description: "Số trang",
        },
        {
          name: "size",
          in: "query",
          required: false,
          schema: { type: "integer", default: 10 },
          description: "Số lượng mỗi trang",
        },
        {
          name: "search",
          in: "query",
          required: false,
          schema: { type: "string" },
          description: "Tìm kiếm theo tên hoặc mô tả mẫu dịch vụ",
        },
        {
          name: "isActive",
          in: "query",
          required: false,
          schema: { type: "boolean" },
          description: "Lọc theo trạng thái hoạt động của mẫu",
        },
        {
          name: "sort",
          in: "query",
          required: false,
          schema: { type: "string", enum: ["asc", "desc"], default: "asc" },
          description: "Sắp xếp theo tên (asc/desc)",
        },
      ],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Lấy danh sách mẫu dịch vụ thành công",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: {
                    type: "string",
                    example: "Lấy danh sách mẫu dịch vụ thành công",
                  },
                  data: {
                    type: "array",
                    items: joiToSwagger(ServiceTemplateResponseSchema),
                  },
                  pagination: paginationSchema,
                },
              },
            },
          },
        },
      },
    },
  },

  "/api/service-templates/{id}": {
    get: {
      tags: ["Service Template"],

      summary: "Lấy thông tin mẫu dịch vụ theo ID",

      description: "Lấy chi tiết mẫu dịch vụ bao gồm danh sách dịch vụ",

      parameters: [
        {
          name: "id",

          in: "path",

          required: true,

          schema: { type: "string", format: "uuid" },

          description: "ID của mẫu dịch vụ cần lấy",
        },
      ],

      security: [{ bearerAuth: [] }],

      responses: {
        200: {
          description: "Lấy thông tin mẫu dịch vụ thành công",

          content: {
            "application/json": {
              schema: joiToSwagger(ServiceTemplateResponseSchema),
            },
          },
        },

        404: {
          description: "Không tìm thấy mẫu dịch vụ",
        },
      },
    },

    put: {
      tags: ["Service Template"],

      summary: "Cập nhật mẫu dịch vụ",

      description:
        "Cập nhật thông tin mẫu dịch vụ. Có thể cập nhật tên, mô tả, trạng thái và/hoặc danh sách dịch vụ. Khi cập nhật details: items có templateDetailId sẽ được update, items không có sẽ được tạo mới, items không gửi trong request sẽ bị xóa.",

      parameters: [
        {
          name: "id",

          in: "path",

          required: true,

          schema: { type: "string", format: "uuid" },

          description: "ID của mẫu dịch vụ cần cập nhật",
        },
      ],

      requestBody: {
        required: true,

        content: {
          "application/json": {
            schema: joiToSwagger(UpdateServiceTemplateRequestSchema),
          },
        },
      },

      security: [{ bearerAuth: [] }],

      responses: {
        200: {
          description: "Cập nhật mẫu dịch vụ thành công",

          content: {
            "application/json": {
              schema: joiToSwagger(ServiceTemplateResponseSchema),
            },
          },
        },

        400: {
          description: "Lỗi validation hoặc dịch vụ trùng lặp/không tồn tại",
        },

        404: {
          description: "Không tìm thấy mẫu dịch vụ",
        },
      },
    },
  },
};

export default ServiceTemplateSwagger;
