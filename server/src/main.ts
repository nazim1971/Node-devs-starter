import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { AppLogger } from "./common/logger/logger.service";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { LoggerInterceptor } from "./common/interceptors/logger.interceptor";
import { ResponseTransformInterceptor } from "./common/interceptors/response-transform.interceptor";
import helmet from "helmet";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = app.get(AppLogger);
  app.useLogger(logger);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }),
  );

  app.enableCors({
    origin: [
      process.env["FRONTEND_URL"] ?? "http://localhost:3000",
      "http://localhost:3001",
    ],
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: [
      "X-RateLimit-Limit",
      "X-RateLimit-Remaining",
      "X-RateLimit-Reset",
    ],
    maxAge: 86400,
  });

  app.setGlobalPrefix("api");

  app.useGlobalFilters(new HttpExceptionFilter(logger));
  app.useGlobalInterceptors(
    new LoggerInterceptor(logger),
    new ResponseTransformInterceptor(),
  );

  const port = process.env["PORT"] ?? 4000;
  await app.listen(port);
  logger.log(`Server running on http://localhost:${port}/api`, "Bootstrap");
}

bootstrap();
