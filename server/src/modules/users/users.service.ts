import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { User, Role as PrismaRole } from "@prisma/client";
import {
  Role,
  UpdateProfileInput,
  ChangePasswordInput,
  PAGINATION_DEFAULTS,
} from "@app/shared";
import { PrismaService } from "../../prisma/prisma.service";
import type {
  PaginationQuery,
  PaginatedUsers,
} from "./interfaces/users.interfaces";

const BCRYPT_ROUNDS = 12;

const SAFE_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  avatar: true,
  role: true,
  isActive: true,
  isBanned: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginationQuery): Promise<PaginatedUsers> {
    const page = Math.max(1, query.page ?? PAGINATION_DEFAULTS.PAGE);
    const limit = Math.min(
      query.limit ?? PAGINATION_DEFAULTS.LIMIT,
      PAGINATION_DEFAULTS.MAX_LIMIT,
    );
    const skip = (page - 1) * limit;

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where: { deletedAt: null },
        select: SAFE_USER_SELECT,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.user.count({ where: { deletedAt: null } }),
    ]);

    return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: SAFE_USER_SELECT,
    });
    if (!user || user.deletedAt !== null) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async updateProfile(
    id: string,
    dto: UpdateProfileInput,
    _requesterId: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user || user.deletedAt !== null) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    if (dto.email && dto.email !== user.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (existing) {
        throw new ConflictException("Email is already in use");
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: SAFE_USER_SELECT,
    });
  }

  async changePassword(id: string, dto: ChangePasswordInput): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user || user.deletedAt !== null) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException("Current password is incorrect");
    }

    const hashed = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    await this.prisma.user.update({
      where: { id },
      data: { password: hashed },
    });
  }

  async softDelete(id: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user || user.deletedAt !== null) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async toggleBan(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user || user.deletedAt !== null) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return this.prisma.user.update({
      where: { id },
      data: { isBanned: !user.isBanned },
      select: SAFE_USER_SELECT,
    });
  }

  async changeRole(id: string, role: Role) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user || user.deletedAt !== null) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    if (!Object.values(Role).includes(role)) {
      throw new BadRequestException(`Invalid role: ${role}`);
    }

    return this.prisma.user.update({
      where: { id },
      data: { role: role as unknown as PrismaRole },
      select: SAFE_USER_SELECT,
    });
  }

  async getActivity(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user || user.deletedAt !== null) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const sessions = await this.prisma.session.findMany({
      where: { userId: id },
      select: { id: true, ip: true, userAgent: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return sessions.map((s) => ({
      id: s.id,
      action: "Login session",
      ip: s.ip,
      userAgent: s.userAgent,
      createdAt: s.createdAt,
    }));
  }
}
