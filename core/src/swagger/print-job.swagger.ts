const PrintJobSwagger = {
  "/api/print-jobs/{jobId}": {
    get: {
      tags: ["Core Businesses"],
      summary: "Get print job status",
      description:
        "Returns the status of a print job created by the print endpoints. Jobs of another clinic are reported as not found.",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "jobId",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      responses: {
        200: {
          description: "Print job status",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "Print job status" },
                  data: {
                    type: "object",
                    properties: {
                      jobId: { type: "string", format: "uuid" },
                      type: {
                        type: "string",
                        enum: ["MEDICAL_RECORD", "PRESCRIPTION", "SERVICE_REQUEST"],
                      },
                      status: {
                        type: "string",
                        enum: ["PENDING", "PROCESSING", "DONE", "FAILED"],
                      },
                      fileId: { type: "string", nullable: true },
                      fileUrl: { type: "string", nullable: true },
                      errorMsg: { type: "string", nullable: true },
                      createdAt: { type: "string", format: "date-time" },
                      finishedAt: {
                        type: "string",
                        format: "date-time",
                        nullable: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        400: { description: "jobId is not a UUID" },
        401: { description: "Missing or invalid token" },
        404: { description: "Print job not found" },
      },
    },
  },
};

export default PrintJobSwagger;
