import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { User } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import {
  AuthTokens,
  LoginInput,
  RegisterInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from "@app/shared";
import { PrismaService } from "../../prisma/prisma.service";
import type { SafeUser } from "./interfaces/auth.interfaces";

const BCRYPT_ROUNDS = 12;
const RESET_EXPIRES_MS = 60 * 60 * 1000; // 1 hour

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(
    dto: Omit<RegisterInput, "confirmPassword">,
    ip: string | null = null,
    userAgent: string | null = null,
  ): Promise<{ user: SafeUser; tokens: AuthTokens }> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException("Email is already registered");
    }

    const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.prisma.user.create({
      data: { name: dto.name, email: dto.email, password: hashedPassword },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshToken: tokens.refreshToken,
        ip,
        userAgent,
      },
    });

    const {
      password: _p,
      passwordResetToken: _t,
      passwordResetExpires: _e,
      ...safeUser
    } = user;
    return { user: safeUser, tokens };
  }

  async login(
    dto: LoginInput,
    ip: string | null,
    userAgent: string | null,
  ): Promise<{ user: SafeUser; tokens: AuthTokens }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || user.deletedAt !== null) {
      throw new UnauthorizedException("Invalid credentials");
    }

    if (user.isBanned) {
      throw new ForbiddenException("Your account has been banned");
    }

    if (!user.isActive) {
      throw new ForbiddenException("Your account is inactive");
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshToken: tokens.refreshToken,
        ip,
        userAgent,
      },
    });

    const {
      password: _p,
      passwordResetToken: _t,
      passwordResetExpires: _e,
      ...safeUser
    } = user;
    return { user: safeUser, tokens };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    let payload: { sub: string; email: string; role: string };

    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>("JWT_REFRESH_SECRET"),
      });
    } catch {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }

    const session = await this.prisma.session.findFirst({
      where: { refreshToken, userId: payload.sub },
    });

    if (!session) {
      throw new UnauthorizedException(
        "Session not found or already invalidated",
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user || user.deletedAt !== null || user.isBanned || !user.isActive) {
      throw new UnauthorizedException("User is not available");
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    await this.prisma.session.update({
      where: { id: session.id },
      data: { refreshToken: tokens.refreshToken },
    });

    return tokens;
  }

  async logout(userId: string): Promise<void> {
    await this.invalidateAllSessions(userId);
  }

  async forgotPassword(dto: ForgotPasswordInput): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // Always return success to prevent email enumeration
    if (!user || user.deletedAt !== null) return;

    const token = uuidv4();
    const expires = new Date(Date.now() + RESET_EXPIRES_MS);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: token, passwordResetExpires: expires },
    });

    // TODO: Integrate email service (e.g. SendGrid, Nodemailer) to send reset link
    this.logger.log(`Password reset token for ${dto.email}: ${token}`);
  }

  async resetPassword(dto: ResetPasswordInput): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { passwordResetToken: dto.token },
    });

    if (
      !user ||
      !user.passwordResetExpires ||
      user.passwordResetExpires < new Date()
    ) {
      throw new BadRequestException("Reset token is invalid or has expired");
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    await this.invalidateAllSessions(user.id);
  }

  private async generateTokens(
    userId: string,
    email: string,
    role: string,
  ): Promise<AuthTokens> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email, role },
        {
          secret: this.configService.get<string>("JWT_ACCESS_SECRET"),
          expiresIn:
            this.configService.get<string>("JWT_ACCESS_EXPIRES") ?? "15m",
        },
      ),
      this.jwtService.signAsync(
        { sub: userId, email, role },
        {
          secret: this.configService.get<string>("JWT_REFRESH_SECRET"),
          expiresIn:
            this.configService.get<string>("JWT_REFRESH_EXPIRES") ?? "7d",
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }

  private async invalidateAllSessions(userId: string): Promise<void> {
    await this.prisma.session.deleteMany({ where: { userId } });
  }
}
