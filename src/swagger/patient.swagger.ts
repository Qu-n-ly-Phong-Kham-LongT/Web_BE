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
      summary: "Create new patient",
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
          description: "Patient created successfully",
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
      summary: "Get list of patients",
      parameters: [
        {
          name: "page",
          in: "query",
          required: false,
          schema: { type: "integer", default: 1 },
          description: "Page number",
        },
        {
          name: "size",
          in: "query",
          required: false,
          schema: { type: "integer", default: 10 },
          description: "Number of items per page",
        },
        {
          name: "search",
          in: "query",
          required: false,
          schema: { type: "string" },
          description: "Search by name, code, phone, email, or identity card",
        },
      ],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Patients retrieved successfully",
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
      summary: "Get patient by ID",
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "ID of the patient to retrieve",
        },
      ],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Patient retrieved successfully",
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
      summary: "Update patient",
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "ID of the patient to update",
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
          description: "Patient updated successfully",
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
      summary: "Get patient enums",
      description: "Get all enum values for Gender and PatientCategory",
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Patient enums retrieved successfully",
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