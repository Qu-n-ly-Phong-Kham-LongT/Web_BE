import { joiToSwagger } from "../utils/joi-swagger.util";
import { BasicMedicalRecordCreateBodySchema } from "../modules/medical-record/dtos/medical-record.request.dto";

const MedicalRecordSwagger = {
  "/api/medical-records": {
    post: {
      tags: ["Core Businesses"],
      summary: "Tạo bệnh án thô (chưa khám lâm sàng/chẩn đoán)",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: joiToSwagger(BasicMedicalRecordCreateBodySchema),
          },
        },
      },
      responses: {
        201: {
          description: "Tạo bệnh án thành công",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  recordId: { type: "string", format: "uuid" },
                  recordCode: { type: "string", nullable: true },
                  patientId: { type: "string", format: "uuid" },
                  doctorId: { type: "string", format: "uuid" },
                  clinicClinicId: { type: "string", format: "uuid", nullable: true },
                  consultationFee: { type: "number", nullable: true },
                  createdAt: { type: "string", format: "date-time", nullable: true },
                  updatedAt: { type: "string", format: "date-time", nullable: true },
                },
              },
            },
          },
        },
        400: { description: "Dữ liệu không hợp lệ" },
        401: { description: "Chưa đăng nhập" },
        403: { description: "Không đủ quyền" },
        404: { description: "Không tìm thấy bác sĩ / bệnh nhân / phòng khám" },
      },
    },
  },
};

export default MedicalRecordSwagger;
