import { FileType } from "../constants/file-type.constant";
import { joiToSwagger } from "../utils/joi-swagger.util";
import { DeleteFileRequestSchema } from "../modules/file/dtos/delete-file.request.dto";

const FileSwagger = {
  "/api/files/upload": {
    post: {
      tags: ["Files"],
      summary: "Upload file",
      description: "Upload a file to the server",
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: "type",
          in: "query",
          required: true,
          schema: {
            type: "string",
            enum: Object.values(FileType),
          },
          description: "Type of the file to be uploaded",
        },
      ],
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              properties: {
                file: {
                  type: "string",
                  format: "binary",
                  description: "File to upload (Max 10MB)",
                },
              },
              required: ["file"],
            },
          },
        },
      },
      responses: {
        200: {
          description: "File uploaded successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  statusCode: { type: "number", example: 200 },
                  message: {
                    type: "string",
                    example: "File uploaded successfully",
                  },
                  data: {
                    type: "object",
                    properties: {
                      FileID: { type: "string" },
                      RelativePath: { type: "string" },
                      Type: { type: "string" },
                      MimeType: { type: "string" },
                      Size: { type: "number" },
                      CreatedAt: { type: "string", format: "date-time" },
                    },
                  },
                },
              },
            },
          },
        },
        400: {
          description: "Bad request - No file uploaded or invalid file type",
        },
        401: {
          description: "Unauthorized - Token required",
        },
      },
    },
  },

  "/api/files/delete": {
    post: {
      tags: ["Files"],
      summary: "Delete file",
      description: "Delete a file from the server by its relative path",
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: joiToSwagger(DeleteFileRequestSchema),
          },
        },
      },
      responses: {
        200: {
          description: "File deleted successfully",
        },
      },
    },
  },
};

export default FileSwagger;
