import { joiToSwagger } from "../utils/joi-swagger.util";
import { upsertDiagnosisPrescriptionSchema } from "../modules/prescriptions/dtos/prescription.request.dto";
import { PrescriptionStatus } from "@prisma/client";

const PrescriptionSwagger = {
  "/api/prescriptions": {
    put: {
      tags: ["Core Businesses"],
      summary: "Tạo/Cập nhật toa thuốc kèm chẩn đoán và tái khám",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: joiToSwagger(upsertDiagnosisPrescriptionSchema),
          },
        },
      },
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Tạo/Cập nhật toa thuốc thành công",
        },
      },
    },
  },

  "/api/prescriptions/patient/{patientId}": {
    get: {
      tags: ["Prescriptions"],
      summary: "Lấy toa thuốc cũ của bệnh nhân",
      parameters: [
        {
          name: "patientId",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "ID bệnh nhân",
        },
        {
          name: "search",
          in: "query",
          required: false,
          schema: { type: "string" },
          description:
            "Chuỗi ngày (YYYY-MM-DD). Parse được thì lọc theo ngày đó",
        },
        {
          name: "status",
          in: "query",
          required: false,
          schema: { type: "string", enum: Object.values(PrescriptionStatus) },
          description: "Trạng thái toa thuốc",
        },
        {
          name: "page",
          in: "query",
          required: false,
          schema: { type: "integer", minimum: 1, default: 1 },
        },
        {
          name: "size",
          in: "query",
          required: false,
          schema: { type: "integer", minimum: 1, default: 10 },
        },
      ],
      security: [{ bearerAuth: [] }],
      responses: {
        200: { description: "Danh sách toa thuốc cũ" },
        401: { description: "Chưa đăng nhập" },
        403: { description: "Không có quyền truy cập" },
        404: { description: "Không tìm thấy bệnh nhân" },
      },
    },
  },

  "/api/prescriptions/{prescriptionId}/print": {
    get: {
      tags: ["Core Businesses"],
      summary: "In toa",
      parameters: [
        {
          name: "prescriptionId",
          in: "path",
          required: true,
          schema: {
            type: "string",
            format: "uuid",
          },
          description: "ID Toa",
        },
      ],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "PDF Toa thuốc",
          content: {
            "application/pdf": {
              schema: { type: "string", format: "binary" },
            },
          },
        },
      },
      401: { description: "Chưa đăng nhập" },
      403: { description: "Không đủ quyền" },
      404: { description: "Không tìm thấy toa" },
    },
  },

  "/api/prescriptions/{prescriptionId}/status/draft": {
    put: {
      tags: ["Core Businesses"],
      summary: "Cập nhật trạng thái toa thuốc về nháp",
      parameters: [
        {
          name: "prescriptionId",
          in: "path",
          required: true,
          schema: {
            type: "string",
            format: "uuid",
          },
          description: "ID toa thuốc",
        },
      ],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Cập nhật trạng thái toa thuốc về nháp thành công",
        },
        401: { description: "Chưa đăng nhập" },
        403: { description: "Không có quyền truy cập" },
        404: { description: "Không tìm thấy toa thuốc" },
      },
    },
  },

  "/api/prescriptions/statuses": {
    get: {
      tags: ["Prescriptions"],
      summary: "Lấy danh sách trạng thái toa thuốc",
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Lấy danh sách trạng thái toa thuốc thành công",
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
                      statuses: {
                        type: "array",
                        items: {
                          type: "string",
                          enum: Object.values(PrescriptionStatus),
                        },
                      },
                    },
                  },
                  pagination: { type: "object", nullable: true },
                },
              },
            },
          },
        },
      },
      401: { description: "Chưa đăng nhập" },
    },
  },
};

export default PrescriptionSwagger;
