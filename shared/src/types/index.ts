export enum Role {
  ADMIN = "admin",
  EDITOR = "editor",
  USER = "user",
}

export enum UserStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  BANNED = "banned",
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: Role;
  isActive: boolean;
  isBanned: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message: string;
  statusCode: number;
}

export interface PaginatedResponse<T = unknown> {
  success: boolean;
  data: T[];
  message: string;
  statusCode: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface UpdateProfilePayload {
  name?: string;
  email?: string;
  avatar?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: string;
  image: string | null;
  imagePublicId: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface CreateProductPayload {
  title: string;
  slug: string;
  description: string;
  price: number;
  image?: string | null;
  imagePublicId?: string | null;
}

export interface UpdateProductPayload {
  title?: string;
  slug?: string;
  description?: string;
  price?: number;
  image?: string | null;
  imagePublicId?: string | null;
}
