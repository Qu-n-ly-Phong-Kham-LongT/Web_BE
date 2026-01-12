import { joiToSwagger } from "../utils/joi-swagger.util";
import {
  ClinicListResponseSchema,
  ClinicResponseSchema,
} from "../modules/clinic/dtos/clinic.response.dto";

const ClinicSwagger = {
  "/api/clinics": {
    post: {
      tags: ["Clinics"],
      summary: "Tạo mới phòng khám (Admin)",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["clinicName", "email"],
              properties: {
                clinicName: { type: "string", maxLength: 255 },
                address: { type: "string", nullable: true, maxLength: 255 },
                phone: {
                  type: "string",
                  nullable: true,
                  pattern: "^0[0-9]{9,10}$",
                },
                email: { type: "string", format: "email", maxLength: 150 },
                sessions: {
                  type: "array",
                  description: "Cấu hình khung giờ làm việc theo từng ca",
                  items: {
                    type: "object",
                    required: ["sessionType", "startTime", "endTime"],
                    properties: {
                      sessionType: {
                        type: "string",
                        enum: ["Morning", "Noon", "Afternoon", "Evening"],
                      },
                      startTime: { type: "string", example: "07:30" },
                      endTime: { type: "string", example: "11:30" },
                      isActive: { type: "boolean", default: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: "Tạo phòng khám thành công",
          content: {
            "application/json": {
              schema: joiToSwagger(ClinicResponseSchema),
            },
          },
        },
        400: { description: "Validation error" },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden" },
        409: { description: "Email/clinic đã tồn tại" },
      },
    },
    get: {
      tags: ["Clinics"],
      summary: "Lấy danh sách phòng khám",
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
          description: "Từ khóa tìm kiếm",
        },
      ],
      responses: {
        200: {
          description: "Lấy danh sách phòng khám thành công",
          content: {
            "application/json": {
              schema: joiToSwagger(ClinicListResponseSchema),
            },
          },
        },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden" },
      },
    },
  },
  "/api/clinics/{id}": {
    get: {
      tags: ["Clinics"],
      summary: "Lấy thông tin phòng khám theo ID",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "Clinic ID",
        },
      ],
      responses: {
        200: {
          description: "Lấy thông tin phòng khám thành công",
          content: {
            "application/json": {
              schema: joiToSwagger(ClinicResponseSchema),
            },
          },
        },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden" },
        404: { description: "Phòng khám không tồn tại" },
      },
    },
    put: {
      tags: ["Clinics"],
      summary: "Cập nhật thông tin phòng khám",
      description: "Cập nhật từng phần (Partial Update). Chỉ gửi các trường cần sửa.",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "Clinic ID",
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                clinicName: {
                  type: "string",
                  maxLength: 255,
                  minLength: 3,
                },
                address: {
                  type: "string",
                  maxLength: 255,
                  minLength: 5,
                },
                phone: {
                  type: "string",
                  pattern: "^0[0-9]{9,10}$",
                },
                email: {
                  type: "string",
                  format: "email",
                  maxLength: 150,
                },
                sessions: {
                  type: "array",
                  description: "Cấu hình khung giờ làm việc theo từng ca",
                  items: {
                    type: "object",
                    required: ["sessionType", "startTime", "endTime"],
                    properties: {
                      sessionType: {
                        type: "string",
                        enum: ["Morning", "Noon", "Afternoon", "Evening"],
                      },
                      startTime: { type: "string", example: "13:00" },
                      endTime: { type: "string", example: "17:00" },
                      isActive: { type: "boolean", default: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Cập nhật thành công",
          content: {
            "application/json": {
              schema: joiToSwagger(ClinicResponseSchema),
            },
          },
        },
        400: { description: "Validation error" },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden" },
        404: { description: "Phòng khám không tồn tại" },
        409: { description: "Trùng email" },
      },
    },
  },
};

export default ClinicSwagger;
