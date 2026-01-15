import { joiToSwagger } from "../utils/joi-swagger.util";
import { CreatePatientRelativeRequestSchema } from "../modules/patient/dtos/create-patient-relative.request.dto";
import { UpdatePatientRelativeRequestSchema } from "../modules/patient/dtos/update-patient-relative.request.dto";
import { PatientRelativeResponseSchema } from "../modules/patient/dtos/patient-relative.response.dto";

const PatientRelativeSwagger = {
  "/api/patients/{patientId}/relatives": {
    post: {
      tags: ["Patient Relative"],
      summary: "Tạo mới người thân",
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
            schema: joiToSwagger(CreatePatientRelativeRequestSchema),
          },
        },
      },
      security: [{ bearerAuth: [] }],
      responses: {
        201: {
          description: "Tạo người thân thành công",
          content: {
            "application/json": {
              schema: joiToSwagger(PatientRelativeResponseSchema),
            },
          },
        },
      },
    },
    get: {
      tags: ["Patient Relative"],
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
      tags: ["Patient Relative"],
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
      tags: ["Patient Relative"],
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

export default PatientRelativeSwagger;

