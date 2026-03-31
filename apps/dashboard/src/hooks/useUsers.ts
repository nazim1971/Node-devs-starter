"use client";

import { useCallback, useEffect, useState } from "react";
import { apiClient } from "../lib/apiClient";
import type { PaginatedResponse, User } from "@app/shared";

export interface UseUsersOptions {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
}

export interface UseUsersReturn {
  users: User[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  refresh: () => void;
  setPage: (page: number) => void;
  setSearch: (search: string) => void;
  setRole: (role: string) => void;
  setStatus: (status: string) => void;
  banUser: (id: string, isBanned: boolean) => Promise<boolean>;
  deleteUser: (id: string) => Promise<boolean>;
  updateUser: (
    id: string,
    payload: {
      name?: string;
      email?: string;
      role?: string;
      isActive?: boolean;
    },
  ) => Promise<boolean>;
}

export function useUsers(initialOptions: UseUsersOptions = {}): UseUsersReturn {
  const [page, setPage] = useState(initialOptions.page ?? 1);
  const [search, setSearch] = useState(initialOptions.search ?? "");
  const [role, setRole] = useState(initialOptions.role ?? "");
  const [status, setStatus] = useState(initialOptions.status ?? "");
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] =
    useState<UseUsersReturn["pagination"]>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "10");
    if (search) params.set("search", search);
    if (role) params.set("role", role);
    if (status) params.set("status", status);

    const res = await apiClient.get<PaginatedResponse<User>>(
      `/users?${params.toString()}`,
    );

    if (res.success && res.data) {
      const paged = res.data as unknown as {
        data: User[];
        pagination: UseUsersReturn["pagination"];
      };
      setUsers(paged.data ?? []);
      setPagination(paged.pagination ?? null);
    } else {
      setError(res.message);
    }
    setIsLoading(false);
  }, [page, search, role, status]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const banUser = useCallback(async (id: string, isBanned: boolean) => {
    const res = await apiClient.patch(`/users/${id}/ban`, { isBanned });
    if (res.success) {
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, isBanned } : u)),
      );
    }
    return res.success;
  }, []);

  const deleteUser = useCallback(async (id: string) => {
    const res = await apiClient.delete(`/users/${id}`);
    if (res.success) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
    }
    return res.success;
  }, []);

  const updateUser = useCallback(
    async (
      id: string,
      payload: {
        name?: string;
        email?: string;
        role?: string;
        isActive?: boolean;
      },
    ) => {
      const res = await apiClient.patch<User>(`/users/${id}`, payload);
      if (res.success && res.data) {
        setUsers((prev) => prev.map((u) => (u.id === id ? res.data : u)));
      }
      return res.success;
    },
    [],
  );

  return {
    users,
    isLoading,
    error,
    pagination,
    refresh: fetchUsers,
    setPage,
    setSearch,
    setRole,
    setStatus,
    banUser,
    deleteUser,
    updateUser,
  };
}
