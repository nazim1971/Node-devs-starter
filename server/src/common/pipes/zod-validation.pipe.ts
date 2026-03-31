import { PipeTransform, BadRequestException } from "@nestjs/common";
import { ZodSchema, ZodError } from "zod";

export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown): unknown {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      const zodError = result.error as ZodError;
      throw new BadRequestException({
        message: "Validation failed",
        errors: zodError.flatten(),
      });
    }

    return result.data;
  }
}
