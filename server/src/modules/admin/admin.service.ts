import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../users/entities/user.entity";

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async getStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalUsers, activeUsers, bannedUsers, newThisMonth] =
      await Promise.all([
        this.userRepo.count(),
        this.userRepo.count({ where: { isActive: true, isBanned: false } }),
        this.userRepo.count({ where: { isBanned: true } }),
        this.userRepo
          .createQueryBuilder("u")
          .where("u.createdAt >= :start", { start: startOfMonth })
          .getCount(),
      ]);

    // Monthly growth: last 6 months
    const userGrowth: Array<{ label: string; value: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const value = await this.userRepo
        .createQueryBuilder("u")
        .where("u.createdAt >= :start AND u.createdAt < :end", {
          start: d,
          end,
        })
        .getCount();
      const label = d.toLocaleString("default", {
        month: "short",
        year: "2-digit",
      });
      userGrowth.push({ label, value });
    }

    const recentSignups = await this.userRepo.find({
      order: { createdAt: "DESC" },
      take: 10,
      select: ["id", "name", "email", "avatar", "role", "createdAt"],
    });

    return {
      totalUsers,
      activeUsers,
      bannedUsers,
      newThisMonth,
      userGrowth,
      recentSignups,
    };
  }
}
