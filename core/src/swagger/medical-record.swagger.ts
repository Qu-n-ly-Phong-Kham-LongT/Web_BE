import { joiToSwagger } from "../utils/joi-swagger.util";
import { BasicMedicalRecordCreateBodySchema } from "../modules/medical-record/dtos/medical-record.request.dto";
import { legacyMedicalRecordImportSchema } from "../modules/medical-record/dtos/legacy-medical-record.request.dto";

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
                  record: {
                    type: "object",
                    properties: {
                      recordId: { type: "string", format: "uuid" },
                      recordCode: { type: "string", nullable: true },
                      patientId: { type: "string", format: "uuid" },
                      doctorId: { type: "string", format: "uuid" },
                      clinicId: {
                        type: "string",
                        format: "uuid",
                        nullable: true,
                      },
                      consultationFee: { type: "number", nullable: true },
                      createdAt: {
                        type: "string",
                        format: "date-time",
                        nullable: true,
                      },
                      updatedAt: {
                        type: "string",
                        format: "date-time",
                        nullable: true,
                      },
                    },
                  },
                  examinationId: { type: "string", format: "uuid" },
                  allergies: {
                    type: "array",
                    items: { type: "object" },
                  },
                  transferredServiceRequests: {
                    type: "object",
                    properties: {
                      transferred: { type: "number" },
                      requests: {
                        type: "array",
                        items: { type: "object" },
                      },
                    },
                  },
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
  "/api/medical-records/import-legacy": {
    post: {
      tags: ["Core Businesses"],
      summary: "Nhap benh an cu (backdate createdAt/updatedAt)",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: joiToSwagger(legacyMedicalRecordImportSchema),
          },
        },
      },
      responses: {
        201: {
          description: "Nhap benh an cu thanh cong",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  recordId: { type: "string", format: "uuid" },
                  examId: { type: "string", format: "uuid", nullable: true },
                  serviceRequestIds: {
                    type: "array",
                    items: { type: "string", format: "uuid" },
                  },
                  prescriptionId: { type: "string", format: "uuid", nullable: true },
                  fullRecord: { $ref: "#/components/schemas/FullMedicalRecordDto" },
                },
              },
            },
          },
        },
        400: { description: "Du lieu khong hop le" },
        401: { description: "Chua dang nhap" },
        403: { description: "Khong du quyen" },
        404: { description: "Khong tim thay bac si / benh nhan / phong kham" },
        409: { description: "Trung benh an theo ngay" },
      },
    },
  },
  "/api/medical-records/patient/{patientId}": {
    get: {
      tags: ["Core Businesses"],
      summary: "Lấy danh sách tất cả bệnh án đầy đủ của một bệnh nhân",
      description: "Lấy tất cả bệnh án của một bệnh nhân với đầy đủ thông tin (giống format API /api/medical-records/{id}/full), có thể filter theo ngày (fromDate, toDate)",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "patientId",
          in: "path",
          required: true,
          schema: {
            type: "string",
            format: "uuid",
          },
          description: "ID của bệnh nhân",
        },
        {
          name: "fromDate",
          in: "query",
          required: false,
          schema: {
            type: "string",
            format: "date",
          },
          description: "Ngày bắt đầu (YYYY-MM-DD)",
        },
        {
          name: "toDate",
          in: "query",
          required: false,
          schema: {
            type: "string",
            format: "date",
          },
          description: "Ngày kết thúc (YYYY-MM-DD)",
        },
      ],
      responses: {
        200: {
          description: "Lấy danh sách bệnh án thành công",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  data: {
                    type: "array",
                    items: {
                      $ref: "#/components/schemas/FullMedicalRecordDto",
                    },
                  },
                  message: { type: "string" },
                },
              },
            },
          },
        },
        400: { description: "Ngày không hợp lệ" },
        401: { description: "Chưa đăng nhập" },
        403: { description: "Không đủ quyền" },
        404: { description: "Bệnh nhân không tồn tại" },
      },
    },
  },
};

export default MedicalRecordSwagger;


