const FollowUpSwagger = {
  "/api/follow-ups": {
    get: {
      tags: ["Core Businesses"],
      summary: "Lay danh sach tai kham",
      description:
        "Tra ve danh sach lich tai kham theo phong kham trong token va khoang ngay",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "startDate",
          in: "query",
          required: true,
          schema: { type: "string", format: "date", example: "2026-03-01" },
          description: "Ngay bat dau (YYYY-MM-DD)",
        },
        {
          name: "endDate",
          in: "query",
          required: true,
          schema: { type: "string", format: "date", example: "2026-03-31" },
          description: "Ngay ket thuc (YYYY-MM-DD)",
        },
        {
          name: "page",
          in: "query",
          required: false,
          schema: { type: "integer", minimum: 1, default: 1 },
          description: "So trang",
        },
        {
          name: "limit",
          in: "query",
          required: false,
          schema: { type: "integer", minimum: 1, maximum: 100, default: 10 },
          description: "So ban ghi moi trang",
        },
      ],
      responses: {
        200: {
          description: "Lay danh sach tai kham thanh cong",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "Lay danh sach tai kham thanh cong" },
                  data: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        followUpId: { type: "string", format: "uuid" },
                        appointmentDate: {
                          type: "string",
                          format: "date-time",
                          nullable: true,
                        },
                        session: {
                          type: "string",
                          nullable: true,
                          enum: ["Morning", "Noon", "Afternoon", "Evening"],
                        },
                        reason: { type: "string", nullable: true },
                        medicalRecord: {
                          type: "object",
                          nullable: true,
                          properties: {
                            recordId: { type: "string", format: "uuid" },
                            recordCode: { type: "string", nullable: true },
                            diagnoses: { nullable: true },
                            diagnosisNote: { type: "string", nullable: true },
                            patient: {
                              type: "object",
                              nullable: true,
                              properties: {
                                patientId: { type: "string", format: "uuid" },
                                patientCode: { type: "string", nullable: true },
                                fullName: { type: "string", nullable: true },
                                gender: { type: "string", nullable: true },
                                dob: {
                                  type: "string",
                                  format: "date-time",
                                  nullable: true,
                                },
                                phone: { type: "string", nullable: true },
                                email: { type: "string", nullable: true },
                              },
                            },
                            prescription: {
                              type: "object",
                              nullable: true,
                              properties: {
                                prescriptionId: { type: "string", format: "uuid" },
                                prescriptionCode: { type: "string", nullable: true },
                                status: { type: "string", nullable: true },
                                totalPrice: { type: "number", nullable: true },
                                isDispensed: { type: "boolean", nullable: true },
                                details: {
                                  type: "array",
                                  items: {
                                    type: "object",
                                    properties: {
                                      detailId: { type: "string", format: "uuid" },
                                      unit: { type: "string", nullable: true },
                                      quantity: { type: "number", nullable: true },
                                      frequencyPerDay: {
                                        type: "integer",
                                        nullable: true,
                                      },
                                      quantityPerTime: { type: "number", nullable: true },
                                      daysToTake: { type: "integer", nullable: true },
                                      administrationRoute: {
                                        type: "string",
                                        nullable: true,
                                      },
                                      timing: { type: "string", nullable: true },
                                      note: { type: "string", nullable: true },
                                      medicine: {
                                        type: "object",
                                        nullable: true,
                                        properties: {
                                          medicineId: {
                                            type: "string",
                                            format: "uuid",
                                            nullable: true,
                                          },
                                          medicineName: {
                                            type: "string",
                                            nullable: true,
                                          },
                                          activeIngredient: {
                                            type: "string",
                                            nullable: true,
                                          },
                                        },
                                      },
                                    },
                                  },
                                },
                              },
                            },
                            serviceRequests: {
                              type: "array",
                              items: {
                                type: "object",
                                properties: {
                                  requestId: { type: "string", format: "uuid" },
                                  requestCode: { type: "string", nullable: true },
                                  diagnoses: { nullable: true },
                                  diagnosisNote: { type: "string", nullable: true },
                                  isFollowUpTransferred: { type: "boolean" },
                                  followUpDate: {
                                    type: "string",
                                    format: "date-time",
                                    nullable: true,
                                  },
                                  followUpSession: {
                                    type: "string",
                                    nullable: true,
                                    enum: ["Morning", "Noon", "Afternoon", "Evening"],
                                  },
                                  note: { type: "string", nullable: true },
                                  details: {
                                    type: "array",
                                    items: {
                                      type: "object",
                                      properties: {
                                        requestDetailId: { type: "string", format: "uuid" },
                                        selectedOptions: { nullable: true },
                                        serviceItem: {
                                          type: "object",
                                          nullable: true,
                                          properties: {
                                            itemId: { type: "string", format: "uuid" },
                                            itemCode: { type: "string", nullable: true },
                                            name: { type: "string", nullable: true },
                                            basePrice: { type: "number", nullable: true },
                                            unit: { type: "string", nullable: true },
                                            specimen: { type: "string", nullable: true },
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
                      },
                    },
                  },
                  pagination: {
                    type: "object",
                    properties: {
                      currentPage: { type: "integer", example: 1 },
                      size: { type: "integer", example: 10 },
                      totalItems: { type: "integer", example: 35 },
                      totalPages: { type: "integer", example: 4 },
                    },
                  },
                },
              },
            },
          },
        },
        400: { description: "Validation failed" },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden" },
      },
    },
  },
};

export default FollowUpSwagger;
