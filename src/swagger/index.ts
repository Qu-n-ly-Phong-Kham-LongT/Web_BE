import ENV from "../config/environment.config";
import AuthSwagger from "./auth.swagger";
import UserSwagger from "./user.swagger";
import PatientSwagger from "./patient.swagger";
import PatientRelativeSwagger from "./patient-relative.swagger";

const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: `${ENV.appName} API Documentation`,
    version: "1.0.0",
  },
  paths: {
    ...AuthSwagger,
    ...UserSwagger,
    ...PatientSwagger,
    ...PatientRelativeSwagger,
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
};

export default swaggerDocument;
