import { joiToSwagger } from "../utils/joi-swagger.util";
import { AuditLogListResponseSchema } from "../modules/audit-log/dtos/audit-log-list.response.dto";

const AuditLogSwagger = {
  "/api/audit-logs": {
    get: {
      tags: ["AuditLog"],
      summary: "Lấy danh sách audit log",
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
          name: "username",
          in: "query",
          required: false,
          schema: { type: "string" },
          description: "Tìm kiếm theo username",
        },
        {
          name: "from",
          in: "query",
          required: false,
          schema: { type: "string", format: "date" },
          description: "Ngày bắt đầu (yyyy-MM-dd). Backend convert sang UTC",
        },
        {
          name: "to",
          in: "query",
          required: false,
          schema: { type: "string", format: "date" },
          description: "Ngày kết thúc (yyyy-MM-dd). Backend convert sang UTC",
        },
        {
          name: "sortBy",
          in: "query",
          required: false,
          schema: {
            type: "string",
            enum: [
              "createdAt",
              "username",
              "action",
              "entityName",
              "statusCode",
              "durationMs",
            ],
            default: "createdAt",
          },
          description: "Sắp xếp theo trường",
        },
        {
          name: "sort",
          in: "query",
          required: false,
          schema: { type: "string", enum: ["asc", "desc"], default: "desc" },
          description: "Hướng sắp xếp",
        },
      ],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Lấy danh sách audit log thành công",
          content: {
            "application/json": {
              schema: joiToSwagger(AuditLogListResponseSchema),
            },
          },
        },
      },
    },
  },
};

export default AuditLogSwagger;
