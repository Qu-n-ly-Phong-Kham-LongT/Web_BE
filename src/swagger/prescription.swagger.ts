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
};

export default PrescriptionSwagger;
