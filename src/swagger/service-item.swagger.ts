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
    metaData: { type: "object", nullable: true },
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
    configs: {
      type: "array",
      items: serviceItemConfigSchema,
    },
    category: serviceNodeRefSchema,
    type: serviceNodeRefSchema,
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
        409: { description: "Mã dịch vụ đã tồn tại hoặc danh mục/loại không tồn tại" },
      },
    },
  },
};

export default ServiceItemSwagger;
