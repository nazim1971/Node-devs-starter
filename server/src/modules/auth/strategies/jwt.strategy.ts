import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { Request } from "express";
import { User } from "@prisma/client";
import { PrismaService } from "../../../prisma/prisma.service";
import type { JwtPayload } from "../interfaces/auth.interfaces";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>("JWT_ACCESS_SECRET") ?? "secret",
      passReqToCallback: true,
    });
  }

  async validate(_req: Request, payload: JwtPayload): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || user.deletedAt !== null) {
      throw new UnauthorizedException("User not found");
    }

    if (user.isBanned) {
      throw new UnauthorizedException("Account is banned");
    }

    if (!user.isActive) {
      throw new UnauthorizedException("Account is inactive");
    }

    return user;
  }
}
