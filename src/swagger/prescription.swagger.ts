import { joiToSwagger } from "../utils/joi-swagger.util";
import { upsertDiagnosisPrescriptionSchema } from "../modules/prescriptions/dtos/prescription.request.dto";

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

  "/api/prescriptions/{id}/print": {
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
          },
        },
      ],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "PDF file",
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
                      requestCode: { type: "string" },
                      file: {
                        type: "object",
                        properties: {
                          fileId: { type: "string" },
                          relativePath: { type: "string" },
                          url: { type: "string" },
                          type: { type: "string" },
                          size: { type: "number" },
                          createdAt: { type: "string" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        401: { description: "Chưa đăng nhập" },
        403: { description: "Forbidden" },
        404: { description: "Not found" },
      },
    },
  },
};

export default PrescriptionSwagger;
