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

  "/api/prescriptions/patients-by-date": {
    get: {
      tags: ["Prescriptions"],
      summary: "Lấy danh sách bệnh nhân có toa thuốc theo ngày",
      parameters: [
        {
          name: "from",
          in: "query",
          required: false,
          schema: { type: "string", example: "2026-01-26" },
          description:
            "Ngày bắt đầu (YYYY-MM-DD, giờ VN). Nếu chỉ có from thì lấy từ ngày đó đến ngày hiện tại",
        },
        {
          name: "to",
          in: "query",
          required: false,
          schema: { type: "string", example: "2026-01-26" },
          description:
            "Ngày kết thúc (YYYY-MM-DD, giờ VN). Nếu chỉ có to thì lấy ngày hiện tại",
        },
        {
          name: "isDispended",
          in: "query",
          required: false,
          schema: { type: "boolean" },
          description: "Lọc theo trạng thái đã xuất thuốc hay chưa",
        },        {
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
        200: {
          description: "Lấy danh sách bệnh nhân có toa thuốc thành công",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean" },
                  message: { type: "string" },
                  data: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        patient: {
                          type: "object",
                          properties: {
                            patientId: { type: "string", format: "uuid" },
                            patientCode: { type: "string" },
                            fullName: { type: "string" },
                            gender: {
                              type: "string",
                              enum: ["Male", "Female", "Other"],
                              nullable: true,
                            },
                            dob: { type: "string", format: "date-time" },
                            phone: { type: "string" },
                          },
                        },
                        medicalRecord: {
                          type: "object",
                          properties: {
                            recordId: { type: "string", format: "uuid" },
                            recordCode: { type: "string" },
                            createdAt: { type: "string", format: "date-time" },
                          },
                        },
                        prescription: {
                          type: "object",
                          properties: {
                            prescriptionId: { type: "string", format: "uuid" },
                            prescriptionCode: { type: "string" },
                            status: { type: "string" },
                            note: { type: "string" },
                            totalPrice: { type: "number" },
                            createdAt: { type: "string", format: "date-time" },
                            printedAt: { type: "string", format: "date-time" },
                            isDispensed: { type: "boolean" },
                            dispensedAt: { type: "string", format: "date-time" },
                            details: {
                              type: "array",
                              items: {
                                type: "object",
                                properties: {
                                  medicineId: { type: "string", format: "uuid" },
                                  medicineName: { type: "string" },
                                  sellPrice: { type: "number", nullable: true },
                                  frequencyPerDay: { type: "number" },
                                  quantityPerTime: { type: "number" },
                                  quantity: { type: "number" },
                                  unit: { type: "string" },
                                  timing: { type: "string" },
                                  daysToTake: { type: "number" },
                                  note: { type: "string", nullable: true },
                                  isInsuranceCovered: { type: "boolean" },
                                },
                              },
                            },
                          },
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
        401: { description: "Chưa đăng nhập" },
        403: { description: "Không có quyền truy cập" },
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

  "/api/prescriptions/{prescriptionId}/dispense": {
    put: {
      tags: ["Prescriptions"],
      summary: "Xuất toa thuốc",
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
        {
          name: "forceExport",
          in: "query",
          required: false,
          schema: { type: "boolean", default: false },
          description:
            "Xuất toa khi thiếu thuốc (true). Nếu false sẽ trả lỗi 409 kèm danh sách thiếu.",
        },
      ],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Xuất toa thuốc thành công",
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
                      prescriptionId: { type: "string", format: "uuid" },
                      totalPrice: { type: "number" },
                    },
                  },
                  pagination: { type: "object", nullable: true },
                },
              },
            },
          },
        },
        409: {
          description: "Không đủ thuốc để xuất",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean" },
                  message: { type: "string" },
                  error: {
                    type: "object",
                    properties: {
                      items: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            medicineId: { type: "string", format: "uuid" },
                            medicineName: { type: "string" },
                            required: { type: "number" },
                            available: { type: "number" },
                            shortage: { type: "number" },
                          },
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
