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
            type: "string", format: "uuid",
          },
          description: "ID Toa"
        },
      ],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "PDF Toa thuốc",
          content: {
            "application/pdf":
              {
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
