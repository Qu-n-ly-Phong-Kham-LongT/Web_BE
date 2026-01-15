import { joiToSwagger } from "../utils/joi-swagger.util";
import { createServiceNodeSchema, updateServiceNodeSchema } from "../modules/service-node/dtos/service-node.request.dto";
import { NodeType } from "@prisma/client";

const serviceNodeItemSchema = {
  type: "object",
  properties: {
    nodeId: { type: "string", format: "uuid" },
    nodeType: { type: "string", enum: Object.values(NodeType) },
    parentId: { type: "string", format: "uuid", nullable: true },
    code: { type: "string" },
    name: { type: "string" },
    note: { type: "string", nullable: true },
    isActive: { type: "boolean" },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
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

const ServiceNodeSwagger = {
  "/api/service-nodes": {
    post: {
      tags: ["Service-Node (Danh mục/Dịch vụ CLS)"],
      summary: "Tạo Danh mục/Dịch vụ CLS mới",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: joiToSwagger(createServiceNodeSchema),
          },
        },
      },
      responses: {
        201: { description: "Tạo Danh mục/Dịch vụ CLS thành công" },
        400: { description: "Dữ liệu không hợp lệ" },
        401: { description: "Chưa đăng nhập" },
        403: { description: "Không đủ quyền" },
      },
    },
    get: {
      tags: ["Service-Node (Danh muc/Dich vu CLS)"],
      summary: "Lấy ds service node",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "page",
          in: "query",
          required: false,
          schema: { type: "integer", default: 1 },
          description: "Trang cần lấy",
        },
        {
          name: "size",
          in: "query",
          required: false,
          schema: { type: "integer", default: 10 },
          description: "Số lượng bản ghi mỗi trang",
        },
        {
          name: "nodeType",
          in: "query",
          required: false,
          schema: { type: "string", enum: Object.values(NodeType) },
          description: "Lọc theo nodeType",
        },
        {
          name: "isActive",
          in: "query",
          required: false,
          schema: { type: "boolean" },
          description: "Lọc theo active (true/false)",
        },
        {
          name: "search",
          in: "query",
          required: false,
          schema: { type: "string" },
          description: "Tìm theo code hoặc name",
        },
        {
          name: "sortBy",
          in: "query",
          required: false,
          schema: { type: "string", enum: ["code", "name", "createdAt", "updatedAt"] },
          description: "Trường sắp xếp",
        },
        {
          name: "sortDir",
          in: "query",
          required: false,
          schema: { type: "string", enum: ["asc", "desc"], default: "asc" },
          description: "Thứ tự sắp xếp",
        },
      ],
      responses: {
        200: {
          description: "Lấy danh sách thành công",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean" },
                  message: { type: "string" },
                  data: {
                    type: "array",
                    items: serviceNodeItemSchema,
                  },
                  pagination: paginationSchema,
                },
              },
            },
          },
        },
        401: { description: "Chưa đăng nhập" },
      },
    },
  },
  "/api/service-nodes/{nodeId}": {
    put: {
      tags: ["Service-Node (Danh mục/Dịch vụ CLS)"],
      summary: "Cập nhật service node",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "nodeId",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "ID service node",
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: joiToSwagger(updateServiceNodeSchema),
          },
        },
      },
      responses: {
        200: { description: "Cập nhật thành công" },
        400: { description: "Dữ liệu không hợp lệ / parent sai loại / code trùng" },
        401: { description: "Chưa đăng nhập" },
        403: { description: "Không đủ quyền" },
        404: { description: "Không tìm thấy service node" },
      },
    },
  },
  "/api/service-nodes/node-types": {
    get: {
      tags: ["Service-Node (Danh mục/Dịch vụ CLS)"],
      summary: "Lấy danh sách nodeType",
      security: [{ bearerAuth: [] }],
      responses: {
        200: { description: "Lấy danh sách nodeType thành công" },
        401: { description: "Chưa đăng nhập" },
      },
    },
  },
};

export default ServiceNodeSwagger;
