import { joiToSwagger } from "../utils/joi-swagger.util";
import { RegisterRequestSchema } from "../modules/auth/dtos/register.request.dto";
import { RegisterResponseSchema } from "../modules/auth/dtos/register.response.dto";
import { UserResponseSchema } from "../modules/auth/dtos/user.response.dto";

const AuthSwagger = {
  "/api/auth/register": {
    post: {
      tags: ["Auth"],
      summary: "Register new user",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: joiToSwagger(RegisterRequestSchema),
          },
        },
      },
      responses: {
        201: {
          description: "User registered successfully",
          content: {
            "application/json": {
              schema: joiToSwagger(RegisterResponseSchema),
            },
          },
        },
      },
    },
  },
  "/api/auth/users/{id}": {
    get: {
      tags: ["Auth"],
      summary: "Get user by ID",
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "ID of the user to retrieve",
        },
      ],
      responses: {
        200: {
          description: "User retrieved successfully",
          content: {
            "application/json": {
              schema: joiToSwagger(UserResponseSchema),
            },
          },
        },
      },
    },
  },

};

export default AuthSwagger;
