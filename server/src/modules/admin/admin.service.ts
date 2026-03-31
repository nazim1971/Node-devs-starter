import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalUsers, activeUsers, bannedUsers, newThisMonth] =
      await Promise.all([
        this.prisma.user.count({ where: { deletedAt: null } }),
        this.prisma.user.count({
          where: { deletedAt: null, isActive: true, isBanned: false },
        }),
        this.prisma.user.count({ where: { deletedAt: null, isBanned: true } }),
        this.prisma.user.count({
          where: { deletedAt: null, createdAt: { gte: startOfMonth } },
        }),
      ]);

    // Monthly growth: last 6 months
    const userGrowth: Array<{ label: string; value: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
      const value = await this.prisma.user.count({
        where: {
          deletedAt: null,
          createdAt: { gte: start, lt: end },
        },
      });
      const label = start.toLocaleString("default", {
        month: "short",
        year: "2-digit",
      });
      userGrowth.push({ label, value });
    }

    const recentSignups = await this.prisma.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
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
