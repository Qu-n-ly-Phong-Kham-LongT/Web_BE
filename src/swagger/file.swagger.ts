import { joiToSwagger } from "../utils/joi-swagger.util";

const FileSwagger = {
  "/api/files/upload": {
    post: {
      tags: ["Files"],
      summary: "Upload file",
      description: "Upload a file to the server",
      parameters: [
        {
          name: "type",
          in: "query",
          required: true,
          schema: { type: "string" },
          description: "Type of the file to be uploaded",
        },
      ],
      responses: {
        200: {
          // description: "Login successful",
          // content: {
          //   "application/json": {
          //     schema: joiToSwagger(LoginResponseSchema),
          //   },
          // },
        },
      },
    },
  },
};

export default FileSwagger;
