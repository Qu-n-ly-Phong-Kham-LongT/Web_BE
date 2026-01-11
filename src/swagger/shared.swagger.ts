import { joiToSwagger } from "../utils/joi-swagger.util";
import { PatientResponseSchema } from "../modules/patient/dtos/patient.response.dto";
import { ServiceRequestFullResponseSchema } from "../modules/service-request/dtos/service-request.response.dto";

const SharedSwagger = {
  "/api/medical-records/{id}/full": {
    get: {
      tags: ["Core Businesses"],
      summary: "Lấy full thông tin bệnh án",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "ID benh an",
        },
      ],
      responses: {
        200: {
          description: "Lấy full thông tin bệnh án",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  patient: joiToSwagger(PatientResponseSchema),
                  clinicalExamination: {
                    type: "object",
                    properties: {
                      examId: { type: "string", format: "uuid" },
                      recordId: { type: "string", format: "uuid" },
                      reasonForVisit: { type: "string", nullable: true },
                      medicalHistory: { type: "string", nullable: true },
                      pastMedicalHistory: { type: "string", nullable: true },
                      clinicalExamination: { type: "string", nullable: true },
                      heartRate: { type: "number", nullable: true },
                      bloodPressure: { type: "string", nullable: true },
                      temperature: { type: "number", nullable: true },
                      height: { type: "number", nullable: true },
                      weight: { type: "number", nullable: true },
                      pregnancyStatus: { type: "string", nullable: true },
                      pregnancyWeeks: { type: "number", nullable: true },
                      clinicalNotes: { type: "string", nullable: true },
                      examinedAt: { type: "string", format: "date-time", nullable: true },
                      examinedBy: { type: "string", format: "uuid", nullable: true },
                      allergies: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            drug: { type: "string", nullable: true },
                            reaction: { type: "string", nullable: true },
                          },
                        },
                      },
                    },
                  },
                  medicalRecord: {
                    type: "object",
                    properties: {
                      recordId: { type: "string", format: "uuid" },
                      recordCode: { type: "string" },
                      patientId: { type: "string", format: "uuid" },
                      doctorId: { type: "string", format: "uuid" },
                      clinicId: { type: "string", format: "uuid" },
                      evidenceBasedDiagnosis: { type: "boolean", nullable: true },
                      diagnoses: { type: "object", nullable: true },
                      doctorAdvice: { type: "string", nullable: true },
                      treatmentNote: { type: "string", nullable: true },
                      consultationFee: { type: "number" },
                      createdAt: { type: "string", format: "date-time" },
                      updatedAt: { type: "string", format: "date-time" },
                    },
                  },
                  serviceRequest: {
                    type: "array",
                    items: joiToSwagger(ServiceRequestFullResponseSchema),
                  },
                  prescription: {
                    type: "object",
                    properties: {
                      prescriptionId: { type: "string", format: "uuid" },
                      pdfPath: { type: "string", nullable: true },
                      fileName: { type: "string", nullable: true },
                      note: { type: "string", nullable: true },
                      totalPrice: { type: "number" },
                      status: { type: "string" },
                      createdAt: { type: "string", format: "date-time" },
                      updateAt: { type: "string", format: "date-time" },
                      details: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            medicineId: { type: "string", format: "uuid" },
                            frequencyPerDay: { type: "number" },
                            quantityPerTime: { type: "number" },
                            quantity: { type: "number" },
                            unit: { type: "string" },
                            administrationRoute: { type: "string", nullable: true },
                            timing: { type: "string" },
                            daysToTake: { type: "number" },
                            note: { type: "string", nullable: true },
                            isInsuranceCovered: { type: "boolean" },
                          },
                        },
                      },
                    },
                  },
                  followUp: {
                    type: "object",
                    properties: {
                      appointmentDate: { type: "string", format: "date", nullable: true },
                      session: { type: "string", nullable: true },
                      reason: { type: "string", nullable: true },
                    },
                  },
                },
              },
            },
          },
        },
        401: { description: "Chưa đăng nhập" },
        403: { description: "Không đủ quyền" },
        404: { description: "Không tìm thấy bệnh án" },
      },
    },
  },
};

export default SharedSwagger;
