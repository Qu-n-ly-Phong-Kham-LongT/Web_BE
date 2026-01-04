import { joiToSwagger } from "../utils/joi-swagger.util";
import { CreatePatientRequestSchema } from "../modules/patient/dtos/create-patient.request.dto";
import { UpdatePatientRequestSchema } from "../modules/patient/dtos/update-patient.request.dto";
import { PatientResponseSchema } from "../modules/patient/dtos/patient.response.dto";
import { PatientListResponseSchema } from "../modules/patient/dtos/patient-list.response.dto";
import { PatientEnumResponseSchema } from "../modules/patient/dtos/patient-enum.response.dto";

const PatientSwagger = {
  "/api/patients": {
    post: {
      tags: ["Patient"],
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
          description: "Tìm kiếm theo tên, mã, số điện thoại, email hoặc CMND/CCCD",
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
      tags: ["Patient"],
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
      tags: ["Patient"],
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

};

export default PatientSwagger;