import { joiToSwagger } from "../utils/joi-swagger.util";

const SharedSwagger = {
  "/api/medical-records/{id}/full": {
    get: {
      tags: ["Core Businesses"],
      summary: "Lấy full thông tin bệnh án",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "ID benh an",
        },
      ],
      responses: {
        200: {
          description: "Lấy full thông tin bệnh án",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/FullMedicalRecordDto",
              },
            },
          },
        },
        401: { description: "Chưa đăng nhập" },
        403: { description: "Không đủ quyền" },
        404: { description: "Không tìm thấy bệnh án" },
      },
    },
  },
  "/api/medical-records/{id}/print": {
    get: {
      tags: ["Core Businesses"],
      summary: "In bệnh án (PDF)",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "ID bệnh án",
        },
      ],
      responses: {
        200: {
          description: "PDF bệnh án",
          content: {
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
              {
                schema: { type: "string", format: "binary" },
              },
          },
        },
        401: { description: "Chưa đăng nhập" },
        403: { description: "Không đủ quyền" },
        404: { description: "Không tìm thấy bệnh án" },
      },
    },
  },
  "/api/medical-records/{id}/file": {
    get: {
      tags: ["Core Businesses"],
      summary: "Lấy file bệnh án (tự render lại nếu dữ liệu mới hơn)",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "ID bệnh án",
        },
      ],
      responses: {
        200: {
          description: "Thông tin file bệnh án",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  statusCode: { type: "number", example: 200 },
                  message: { type: "string" },
                  data: {
                    type: "object",
                    properties: {
                      fileId: { type: "string" },
                      relativePath: { type: "string" },
                      url: { type: "string" },
                      type: { type: "string" },
                      size: { type: "number" },
                      createdAt: { type: "string", format: "date-time" },
                    },
                  },
                },
              },
            },
          },
        },
        401: { description: "Chưa đăng nhập" },
        403: { description: "Không đủ quyền" },
        404: { description: "Không tìm thấy bệnh án/file" },
      },
    },
  },
};

export default SharedSwagger;
