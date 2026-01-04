import cors from "cors";
import type { CorsOptions } from "cors";

export const corsMiddleware = (allowedOrigins: string[]) =>
  cors({
    origin: (origin, callback) => {
      if (allowedOrigins.length === 0) return callback(null, true);

      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        console.log(`Allowed by CORS: ${origin}`);
        return callback(null, true);
      }

      console.warn(`Not allowed by CORS: ${origin}`);
      return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
  } satisfies CorsOptions);
