import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Request } from "express";
import { Role } from "@app/shared";
import { User } from "../../users/entities/user.entity";

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>("JWT_ACCESS_SECRET") ?? "secret",
      passReqToCallback: true,
    });
  }

  async validate(_req: Request, payload: JwtPayload): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id: payload.sub } });

    if (!user) {
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
