import { joiToSwagger } from "../utils/joi-swagger.util";
import { createServiceItemSchema } from "../modules/service-item/dtos/service-item.request.dto";
import { InputType, NodeType } from "@prisma/client";

const serviceNodeRefSchema = {
  type: "object",
  properties: {
    nodeId: { type: "string", format: "uuid" },
    nodeType: { type: "string", enum: Object.values(NodeType) },
    parentId: { type: "string", format: "uuid", nullable: true },
    code: { type: "string", nullable: true },
    name: { type: "string", nullable: true },
    note: { type: "string", nullable: true },
    isActive: { type: "boolean", nullable: true },
  },
};

const serviceItemConfigSchema = {
  type: "object",
  properties: {
    configId: { type: "string", format: "uuid" },
    itemId: { type: "string", format: "uuid", nullable: true },
    configCode: { type: "string", nullable: true },
    displayName: { type: "string", nullable: true },
    inputType: { type: "string", enum: Object.values(InputType) },
    unit: { type: "string", nullable: true },
    refRange: { type: "string", nullable: true },
    metaData: {
      type: "object",
      nullable: true,
      properties: {
        uiStyle: { type: "string", nullable: true },
        allowMultiple: { type: "boolean", nullable: true },
        options: {
          type: "array",
          items: {
            type: "object",
            properties: {
              label: { type: "string" },
              value: { type: "string" },
              surcharge: { type: "number", nullable: true },
            },
          },
        },
        defaultValue: { nullable: true },
      },
    },
  },
};

const serviceItemSchema = {
  type: "object",
  properties: {
    itemId: { type: "string", format: "uuid" },
    itemCode: { type: "string", nullable: true },
    name: { type: "string", nullable: true },
    categoryId: { type: "string", format: "uuid", nullable: true },
    typeId: { type: "string", format: "uuid", nullable: true },
    unit: { type: "string", nullable: true },
    specimen: { type: "string", nullable: true },
    prepNote: { type: "string", nullable: true },
    isActive: { type: "boolean", nullable: true },
    basePrice: { type: "number", nullable: true },
    configs: {
      type: "array",
      items: serviceItemConfigSchema,
    },
    category: serviceNodeRefSchema,
    type: serviceNodeRefSchema,
  },
};

const serviceItemResponseSchema = {
  type: "object",
  properties: {
    itemId: { type: "string", format: "uuid" },
    itemCode: { type: "string", nullable: true },
    name: { type: "string", nullable: true },
    unit: { type: "string", nullable: true },
    specimen: { type: "string", nullable: true },
    prepNote: { type: "string", nullable: true },
    isActive: { type: "boolean", nullable: true },
    categoryName: { type: "string", nullable: true },
    typeName: { type: "string", nullable: true },
    basePrice: { type: "number", nullable: true },
    configs: {
      type: "array",
      items: serviceItemConfigSchema,
    },
  },
};

const paginationSchema = {
  type: "object",
  properties: {
    currentPage: { type: "integer" },
    size: { type: "integer" },
    totalItems: { type: "integer" },
    totalPages: { type: "integer" },
  },
};

const ServiceItemSwagger = {
  "/api/service-items": {
    post: {
      tags: ["Service Items"],
      summary: "Tạo dịch vụ cận lâm sàng",
      description: "Chỉ Admin được phép tạo dịch vụ cận lâm sàng.",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: joiToSwagger(createServiceItemSchema),
          },
        },
      },
      responses: {
        201: {
          description: "Tạo dịch vụ cận lâm sàng thành công",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean" },
                  message: { type: "string" },
                  data: serviceItemSchema,
                  pagination: { type: "object", nullable: true },
                },
              },
            },
          },
        },
        400: { description: "Dữ liệu không hợp lệ" },
        401: { description: "Chưa đăng nhập" },
        403: { description: "Không đủ quyền (chỉ Admin)" },
        409: {
          description:
            "Mã dịch vụ đã tồn tại hoặc danh mục/loại không tồn tại",
        },
      },
    },
    get: {
      tags: ["Core Businesses"],
      summary: "Lấy danh sách dịch vụ cận lâm sàng",
      description: "Chỉ Admin được phép xem danh sách dịch vụ cận lâm sàng.",
      security: [{ bearerAuth: [] }],
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
          description: "Số bản ghi mỗi trang",
        },
        {
          name: "search",
          in: "query",
          required: false,
          schema: { type: "string" },
          description: "Tìm theo mã hoặc tên dịch vụ",
        },
        {
          name: "typeId",
          in: "query",
          required: false,
          schema: { type: "string", format: "uuid" },
          description: "Lọc theo loại dịch vụ",
        },
        {
          name: "categoryId",
          in: "query",
          required: false,
          schema: { type: "string", format: "uuid" },
          description: "Filter by category",
        },
        {
          name: "isActive",
          in: "query",
          required: false,
          schema: { type: "boolean" },
          description:
            "Filter by status (true=active, false=inactive). If omitted, returns all; sorted by status.",
        },
      ],
      responses: {
        200: {
          description: "Lấy danh sách dịch vụ cận lâm sàng thành công",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean" },
                  message: { type: "string" },
                  data: {
                    type: "object",
                    properties: {
                      data: {
                        type: "array",
                        items: serviceItemResponseSchema,
                      },
                      pagination: paginationSchema,
                    },
                  },
                  pagination: { type: "object", nullable: true },
                },
              },
            },
          },
        },
        401: { description: "Chưa đăng nhập" },
        403: { description: "Không đủ quyền (chỉ Admin)" },
      },
    },
  },

  "/api/service-items/input-types": {
    get: {
      tags: ["Service Items"],
      summary: "Lấy danh sách loại dữ liệu nhập",
      description: "API công khai để lấy danh sách loại dữ liệu nhập.",
      responses: {
        200: {
          description: "Lấy danh sách loại dữ liệu nhập thành công",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean" },
                  message: { type: "string" },
                  data: {
                    type: "array",
                    items: { type: "string" },
                  },
                  pagination: { type: "object", nullable: true },
                },
              },
            },
          },
        },
      },
    },
  },
  "/api/service-items/{id}": {
    get: {
      tags: ["Core Businesses"],
      summary: "Lấy chi tiết dịch vụ cận lâm sàng",
      description: "Chỉ Admin được phép xem chi tiết dịch vụ cận lâm sàng.",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "ID dịch vụ cận lâm sàng",
        },
      ],
      responses: {
        200: {
          description: "Lấy dịch vụ cận lâm sàng thành công",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean" },
                  message: { type: "string" },
                  data: serviceItemResponseSchema,
                  pagination: { type: "object", nullable: true },
                },
              },
            },
          },
        },
        401: { description: "Chưa đăng nhập" },
        403: { description: "Không đủ quyền (chỉ Admin)" },
        404: { description: "Không tìm thấy dịch vụ cận lâm sàng" },
      },
    },
  },
};

export default ServiceItemSwagger;


