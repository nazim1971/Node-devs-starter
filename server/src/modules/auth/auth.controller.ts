import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { Request } from "express";
import {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from "@app/shared";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { User } from "@prisma/client";
import { registerDtoSchema, type RegisterDto } from "./dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body(new ZodValidationPipe(registerDtoSchema)) dto: RegisterDto,
    @Req() req: Request,
  ) {
    const ip = req.ip ?? null;
    const userAgent = req.headers["user-agent"] ?? null;
    const result = await this.authService.register(dto, ip, userAgent);
    return { data: result, message: "Registration successful" };
  }

  @Post("login")
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  async login(
    @Body(new ZodValidationPipe(loginSchema)) dto: LoginInput,
    @Req() req: Request,
  ) {
    const ip = req.ip ?? null;
    const userAgent = req.headers["user-agent"] ?? null;
    const result = await this.authService.login(dto, ip, userAgent);
    return { data: result, message: "Login successful" };
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser() user: User) {
    await this.authService.logout(user.id);
    return { data: null, message: "Logged out successfully" };
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  async refresh(@Body("refreshToken") refreshToken: string) {
    if (!refreshToken) {
      throw new BadRequestException("refreshToken is required");
    }
    const tokens = await this.authService.refresh(refreshToken);
    return { data: tokens, message: "Token refreshed successfully" };
  }

  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Body(new ZodValidationPipe(forgotPasswordSchema)) dto: ForgotPasswordInput,
  ) {
    await this.authService.forgotPassword(dto);
    return {
      data: null,
      message: "If that email is registered, a reset link has been sent",
    };
  }

  @Post("reset-password")
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body(new ZodValidationPipe(resetPasswordSchema)) dto: ResetPasswordInput,
  ) {
    await this.authService.resetPassword(dto);
    return { data: null, message: "Password reset successful" };
  }
}
