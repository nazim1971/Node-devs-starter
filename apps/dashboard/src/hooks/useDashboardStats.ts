"use client";

import { useCallback, useEffect, useState } from "react";
import { apiClient } from "../lib/apiClient";
import type { ApiResponse } from "@app/shared";

export interface RecentSignup {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: string;
  createdAt: string;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  bannedUsers: number;
  newThisMonth: number;
  userGrowth: Array<{ label: string; value: number }>;
  recentSignups: RecentSignup[];
}

interface UseDashboardStatsReturn {
  stats: DashboardStats | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useDashboardStats(): UseDashboardStatsReturn {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const res = await apiClient.get<DashboardStats>("/admin/stats");
    if (res.success && res.data) {
      setStats(res.data);
    } else {
      setError(res.message);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return { stats, isLoading, error, refresh: fetch };
}
