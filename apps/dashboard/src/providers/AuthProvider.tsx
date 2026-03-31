'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { apiClient, clearTokens, setTokens } from '../lib/apiClient';
import type { AuthTokens, User } from '@app/shared';

export interface DashLoginPayload {
  email: string;
  password: string;
}

export interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (payload: DashLoginPayload) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get<User>('/users/me')
      .then((res) => {
        if (res.success && res.data) setUser(res.data);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (payload: DashLoginPayload) => {
    const res = await apiClient.post<{ user: User; tokens: AuthTokens }>(
      '/auth/login',
      payload,
    );
    if (res.success && res.data) {
      setTokens(res.data.tokens);
      setUser(res.data.user);
      return { success: true, message: res.message };
    }
    return { success: false, message: res.message };
  }, []);

  const logout = useCallback(async () => {
    await apiClient.post('/auth/logout').catch(() => undefined);
    clearTokens();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const res = await apiClient.get<User>('/users/me');
    if (res.success && res.data) setUser(res.data);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: user !== null,
        login,
        logout,
        refreshUser,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx === null) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
