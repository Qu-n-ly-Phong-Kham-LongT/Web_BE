import { joiToSwagger } from "../utils/joi-swagger.util";
import { CreatePatientRequestSchema } from "../modules/patient/dtos/create-patient.request.dto";
import { UpdatePatientRequestSchema } from "../modules/patient/dtos/update-patient.request.dto";
import { PatientResponseSchema } from "../modules/patient/dtos/patient.response.dto";
import { PatientListResponseSchema } from "../modules/patient/dtos/patient-list.response.dto";
import { PatientEnumResponseSchema } from "../modules/patient/dtos/patient-enum.response.dto";
import { UpdatePatientRelativeRequestSchema } from "../modules/patient/dtos/update-patient-relative.request.dto";
import { PatientRelativeResponseSchema } from "../modules/patient/dtos/patient-relative.response.dto";

const paginationSchema = {
  type: "object",
  properties: {
    currentPage: { type: "integer" },
    size: { type: "integer" },
    totalItems: { type: "integer" },
    totalPages: { type: "integer" },
  },
};

const patientQueueItemSchema = {
  type: "object",
  properties: {
    patientId: { type: "string", format: "uuid" },
    patientCode: { type: "string" },
    todayRecordId: { type: "string", format: "uuid", nullable: true },
    fullName: { type: "string", nullable: true },
    identityCard: { type: "string", nullable: true },
    gender: { type: "string", enum: ["Male", "Female", "Other"] },
    age: { type: "integer" },
    phone: { type: "string" },
    status: { type: "string", enum: ["WAITING", "IN_PROGRESS", "COMPLETED"] },
    arrivedAt: { type: "string", format: "date-time" },
  },
};

const PatientSwagger = {
  "/api/patients": {
    post: {
      tags: ["Core Businesses"],
      summary: "Tạo mới bệnh nhân",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: joiToSwagger(CreatePatientRequestSchema),
          },
        },
      },
      security: [{ bearerAuth: [] }],
      responses: {
        201: {
          description: "Tạo bệnh nhân thành công",
          content: {
            "application/json": {
              schema: joiToSwagger(PatientResponseSchema),
            },
          },
        },
      },
    },
    get: {
      tags: ["Patient"],
      summary: "Lấy danh sách bệnh nhân",
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
          name: "search",
          in: "query",
          required: false,
          schema: { type: "string" },
          description:
            "Tìm kiếm theo tên, mã BN, sđt, email, CMND/CCCD",
        },
        {
          name: "sortBy",
          in: "query",
          required: false,
          schema: {
            type: "string",
            enum: ["fullName", "gender", "patientCategory", "identityCard"],
            default: "fullName",
          },
          description: "Sắp xếp theo thuộc tính",
        },
        {
          name: "sort",
          in: "query",
          required: false,
          schema: { type: "string", enum: ["asc", "desc"], default: "desc" },
          description: "Asc hay Desc",
        },
        {
          name: "gender",
          in: "query",
          required: false,
          schema: { type: "string", enum: ["Male", "Female", "Other"] },
          description: "Lọc theo giới tính",
        },
        {
          name: "patientCategory",
          in: "query",
          required: false,
          schema: { type: "string", enum: ["BHYT", "DichVu", "UuTien"] },
          description: "Lọc theo loại bệnh nhân",
        },
        {
          name: "createdAt",
          in: "query",
          required: false,
          schema: { type: "string", example: "2026-07-01" },
          description: "Lọc theo ngày tạo (yyyy-MM-dd)",
        },
      ],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Lấy danh sách bệnh nhân thành công",
          content: {
            "application/json": {
              schema: joiToSwagger(PatientListResponseSchema),
            },
          },
        },
      },
    },
  },
  "/api/patients/{id}": {
    get: {
      tags: ["Core Businesses"],
      summary: "Lấy thông tin bệnh nhân theo ID",
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "ID của bệnh nhân cần lấy",
        },
      ],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Lấy thông tin bệnh nhân thành công",
          content: {
            "application/json": {
              schema: joiToSwagger(PatientResponseSchema),
            },
          },
        },
      },
    },
    put: {
      tags: ["Core Businesses"],
      summary: "Cập nhật thông tin bệnh nhân",
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "ID của bệnh nhân cần cập nhật",
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: joiToSwagger(UpdatePatientRequestSchema),
          },
        },
      },
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Cập nhật thông tin bệnh nhân thành công",
          content: {
            "application/json": {
              schema: joiToSwagger(PatientResponseSchema),
            },
          },
        },
      },
    },
  },
  "/api/patients/enums": {
    get: {
      tags: ["Patient"],
      summary: "Lấy danh sách enum bệnh nhân",
      description: "Lấy tất cả giá trị enum của bệnh nhân",
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Lấy danh sách enum bệnh nhân thành công",
          content: {
            "application/json": {
              schema: joiToSwagger(PatientEnumResponseSchema),
            },
          },
        },
      },
    },
  },
  "/api/patients/queue": {
    get: {
      tags: ["Core Businesses"],
      summary: "Lấy danh sách hàng đợi khám trong ngày",
      description:
        "Danh sách bệnh nhân đến trong ngày tại phòng khám, kèm trạng thái chờ/đang khám/hoàn tất.",
      parameters: [
        {
          name: "page",
          in: "query",
          required: false,
          schema: { type: "integer", default: 1 },
          description: "Trang cần lấy",
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
          description: "Tìm kiếm theo tên, mã, số điện thoại, CCCD",
        },
        {
          name: "date",
          in: "query",
          required: false,
          schema: { type: "string", example: "2026-07-01" },
          description: "Ngày cần lấy danh sách (YYYY-MM-DD hoặc ISO)",
        },
        {
          name: "status",
          in: "query",
          require: false,
          schema: {
            type: "string",
            enum: ["WAITING", "IN_PROGRESS", "COMPLETED"],
          },
          description: "Lọc theo trạng thái khám",
        },
        {
          name: "sort",
          in: "query",
          required: false,
          schema: {
            type: "string",
            enum: ["asc", "desc"],
            default: "desc",
          },
          description:
            "Sắp xếp theo thời gian đến (arrivedAt). 'asc' để hiện người đến sớm nhất lên đầu, 'desc' để hiện người mới nhất lên đầu.",
        },
      ],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Lấy danh sách hàng đợi thành công",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: {
                    type: "string",
                    example: "Lấy danh sách hàng đợi thành công",
                  },
                  data: {
                    type: "array",
                    items: patientQueueItemSchema,
                  },
                  pagination: paginationSchema,
                },
              },
            },
          },
        },
      },
    },
  },
  "/api/patients/{patientId}/relatives": {
    get: {
      tags: ["Patient"],
      summary: "Lấy danh sách người thân theo ID bệnh nhân",
      parameters: [
        {
          name: "patientId",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "ID của bệnh nhân",
        },
      ],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Lấy danh sách người thân thành công",
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: joiToSwagger(PatientRelativeResponseSchema),
              },
            },
          },
        },
      },
    },
  },
  "/api/patients/relatives/{relativeId}": {
    get: {
      tags: ["Patient"],
      summary: "Lấy thông tin người thân theo ID",
      parameters: [
        {
          name: "relativeId",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "ID của người thân cần lấy",
        },
      ],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Lấy thông tin người thân thành công",
          content: {
            "application/json": {
              schema: joiToSwagger(PatientRelativeResponseSchema),
            },
          },
        },
      },
    },
    put: {
      tags: ["Patient"],
      summary: "Cập nhật thông tin người thân",
      parameters: [
        {
          name: "relativeId",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "ID của người thân cần cập nhật",
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: joiToSwagger(UpdatePatientRelativeRequestSchema),
          },
        },
      },
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Cập nhật thông tin người thân thành công",
          content: {
            "application/json": {
              schema: joiToSwagger(PatientRelativeResponseSchema),
            },
          },
        },
      },
    },
  },
};

export default PatientSwagger;
