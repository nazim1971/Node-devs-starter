import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import {
  Role,
  AuthTokens,
  LoginInput,
  RegisterInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from "@app/shared";
import { User } from "../users/entities/user.entity";
import { Session } from "../users/entities/session.entity";

const BCRYPT_ROUNDS = 12;
const RESET_EXPIRES_MS = 60 * 60 * 1000; // 1 hour

export type SafeUser = Omit<User, "password" | "sessions">;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Session)
    private readonly sessionRepo: Repository<Session>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(
    dto: Omit<RegisterInput, "confirmPassword">,
    ip: string | null = null,
    userAgent: string | null = null,
  ): Promise<{ user: SafeUser; tokens: AuthTokens }> {
    const existing = await this.userRepo.findOne({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException("Email is already registered");
    }

    const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = this.userRepo.create({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
    });

    const saved = await this.userRepo.save(user);

    const tokens = await this.generateTokens(saved.id, saved.email, saved.role);
    const session = this.sessionRepo.create({
      userId: saved.id,
      refreshToken: tokens.refreshToken,
      ip,
      userAgent,
    });
    await this.sessionRepo.save(session);

    const { password: _p, sessions: _s, ...safeUser } = saved;
    return { user: safeUser, tokens };
  }

  async login(
    dto: LoginInput,
    ip: string | null,
    userAgent: string | null,
  ): Promise<{ user: SafeUser; tokens: AuthTokens }> {
    const user = await this.userRepo.findOne({
      where: { email: dto.email },
      select: [
        "id",
        "name",
        "email",
        "password",
        "role",
        "isActive",
        "isBanned",
        "avatar",
        "createdAt",
        "updatedAt",
        "deletedAt",
      ],
    });

    if (!user) {
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

    const session = this.sessionRepo.create({
      userId: user.id,
      refreshToken: tokens.refreshToken,
      ip,
      userAgent,
    });
    await this.sessionRepo.save(session);

    const { password: _p, sessions: _s, ...safeUser } = user;
    return { user: safeUser, tokens };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    let payload: { sub: string; email: string; role: Role };

    try {
      payload = this.jwtService.verify<{
        sub: string;
        email: string;
        role: Role;
      }>(refreshToken, {
        secret: this.configService.get<string>("JWT_REFRESH_SECRET"),
      });
    } catch {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }

    const session = await this.sessionRepo.findOne({
      where: { refreshToken, userId: payload.sub },
    });

    if (!session) {
      throw new UnauthorizedException(
        "Session not found or already invalidated",
      );
    }

    const user = await this.userRepo.findOne({ where: { id: payload.sub } });
    if (!user || user.isBanned || !user.isActive) {
      throw new UnauthorizedException("User is not available");
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    session.refreshToken = tokens.refreshToken;
    await this.sessionRepo.save(session);

    return tokens;
  }

  async logout(userId: string): Promise<void> {
    await this.invalidateAllSessions(userId);
  }

  async forgotPassword(dto: ForgotPasswordInput): Promise<void> {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });

    // Always return success to prevent email enumeration
    if (!user) return;

    const token = uuidv4();
    const expires = new Date(Date.now() + RESET_EXPIRES_MS);
    await this.userRepo.update(user.id, {
      passwordResetToken: token,
      passwordResetExpires: expires,
    });

    // TODO: Integrate email service (e.g. SendGrid, Nodemailer) to send reset link
    this.logger.log(`Password reset token for ${dto.email}: ${token}`);
  }

  async resetPassword(dto: ResetPasswordInput): Promise<void> {
    const user = await this.userRepo.findOne({
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
    await this.userRepo.update(user.id, {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
    });

    await this.invalidateAllSessions(user.id);
  }

  private async generateTokens(
    userId: string,
    email: string,
    role: Role,
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
    await this.sessionRepo.delete({ userId });
  }
}
