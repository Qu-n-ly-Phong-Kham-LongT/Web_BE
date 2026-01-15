import { joiToSwagger } from "../utils/joi-swagger.util";
import { CreatePatientAllergyRequestSchema } from "../modules/patient/dtos/create-patient-allergy.request.dto";
import { UpdatePatientAllergyRequestSchema } from "../modules/patient/dtos/update-patient-allergy.request.dto";
import { PatientAllergyResponseSchema } from "../modules/patient/dtos/patient-allergy.response.dto";

const PatientAllergySwagger = {
  "/api/patients/{patientId}/allergies": {
    post: {
      tags: ["Patient Allergy"],
      summary: "Tạo mới danh sách dị ứng",
      parameters: [
        {
          name: "patientId",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "ID của bệnh nhân",
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: joiToSwagger(CreatePatientAllergyRequestSchema),
          },
        },
      },
      security: [{ bearerAuth: [] }],
      responses: {
        201: {
          description: "Tạo danh sách dị ứng thành công",
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: joiToSwagger(PatientAllergyResponseSchema),
              },
            },
          },
        },
      },
    },
    get: {
      tags: ["Patient Allergy"],
      summary: "Lấy danh sách dị ứng theo ID bệnh nhân",
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
          description: "Lấy danh sách dị ứng thành công",
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: joiToSwagger(PatientAllergyResponseSchema),
              },
            },
          },
        },
      },
    },
  },
  "/api/patients/allergies/{allergyId}": {
    get: {
      tags: ["Patient Allergy"],
      summary: "Lấy thông tin dị ứng theo ID",
      parameters: [
        {
          name: "allergyId",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "ID của dị ứng cần lấy",
        },
      ],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Lấy thông tin dị ứng thành công",
          content: {
            "application/json": {
              schema: joiToSwagger(PatientAllergyResponseSchema),
            },
          },
        },
      },
    },
    put: {
      tags: ["Patient Allergy"],
      summary: "Cập nhật thông tin dị ứng",
      parameters: [
        {
          name: "allergyId",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "ID của dị ứng cần cập nhật",
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: joiToSwagger(UpdatePatientAllergyRequestSchema),
          },
        },
      },
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Cập nhật thông tin dị ứng thành công",
          content: {
            "application/json": {
              schema: joiToSwagger(PatientAllergyResponseSchema),
            },
          },
        },
      },
    },
    delete: {
      tags: ["Patient Allergy"],
      summary: "Xóa thông tin dị ứng",
      parameters: [
        {
          name: "allergyId",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "ID của dị ứng cần xóa",
        },
      ],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Xóa thông tin dị ứng thành công",
        },
      },
    },
  },
};

export default PatientAllergySwagger;

