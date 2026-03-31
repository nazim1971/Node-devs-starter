import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { Role, UpdateProfileInput, ChangePasswordInput } from "@app/shared";
import { User } from "./entities/user.entity";
import { Session } from "./entities/session.entity";
import { PAGINATION_DEFAULTS } from "@app/shared";

const BCRYPT_ROUNDS = 12;

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PaginatedUsers {
  users: Omit<User, "password" | "sessions">[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Session)
    private readonly sessionRepo: Repository<Session>,
  ) {}

  async findAll(query: PaginationQuery): Promise<PaginatedUsers> {
    const page = Math.max(1, query.page ?? PAGINATION_DEFAULTS.PAGE);
    const limit = Math.min(
      query.limit ?? PAGINATION_DEFAULTS.LIMIT,
      PAGINATION_DEFAULTS.MAX_LIMIT,
    );
    const skip = (page - 1) * limit;

    const [users, total] = await this.userRepo.findAndCount({
      skip,
      take: limit,
      order: { createdAt: "DESC" },
      withDeleted: false,
    });

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<Omit<User, "password" | "sessions">> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async updateProfile(
    id: string,
    dto: UpdateProfileInput,
    requesterId: string,
  ): Promise<Omit<User, "password" | "sessions">> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    if (dto.email && dto.email !== user.email) {
      const existing = await this.userRepo.findOne({
        where: { email: dto.email },
      });
      if (existing) {
        throw new ConflictException("Email is already in use");
      }
    }

    Object.assign(user, dto);
    const updated = await this.userRepo.save(user);
    return updated;
  }

  async changePassword(id: string, dto: ChangePasswordInput): Promise<void> {
    const user = await this.userRepo.findOne({
      where: { id },
      select: ["id", "password"],
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException("Current password is incorrect");
    }

    const hashed = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    await this.userRepo.update(id, { password: hashed });
  }

  async softDelete(id: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    await this.userRepo.softDelete(id);
  }

  async toggleBan(id: string): Promise<Omit<User, "password" | "sessions">> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    user.isBanned = !user.isBanned;
    return this.userRepo.save(user);
  }

  async changeRole(
    id: string,
    role: Role,
  ): Promise<Omit<User, "password" | "sessions">> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    if (!Object.values(Role).includes(role)) {
      throw new BadRequestException(`Invalid role: ${role}`);
    }

    user.role = role;
    return this.userRepo.save(user);
  }

  async getActivity(
    id: string,
  ): Promise<
    {
      id: string;
      action: string;
      ip: string | null;
      userAgent: string | null;
      createdAt: Date;
    }[]
  > {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    const sessions = await this.sessionRepo.find({
      where: { userId: id },
      select: ["id", "ip", "userAgent", "createdAt"],
      order: { createdAt: "DESC" },
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
