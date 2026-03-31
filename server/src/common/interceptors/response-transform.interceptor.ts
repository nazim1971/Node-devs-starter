import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { Response } from "express";

interface ServiceResponse<T> {
  data: T;
  message: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  statusCode: number;
}

@Injectable()
export class ResponseTransformInterceptor<T> implements NestInterceptor<
  T | ServiceResponse<T>,
  ApiResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T | ServiceResponse<T>>,
  ): Observable<ApiResponse<T>> {
    const res = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((payload) => {
        const statusCode = res.statusCode;

        if (
          payload !== null &&
          typeof payload === "object" &&
          "data" in payload &&
          "message" in payload
        ) {
          const typed = payload as ServiceResponse<T>;
          return {
            success: true,
            data: typed.data,
            message: typed.message,
            statusCode,
          };
        }

        return {
          success: true,
          data: payload as T,
          message: "Success",
          statusCode,
        };
      }),
    );
  }
}
