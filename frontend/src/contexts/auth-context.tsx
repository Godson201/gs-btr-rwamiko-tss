'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { roleHomePath } from '@/lib/session';

export interface CurrentUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'STUDENT' | 'TEACHER' | 'PARENT' | 'ADMIN' | 'SUPER_ADMIN';
  avatar?: string | null;
  phone?: string | null;
}

export interface RegisterParentInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
}

interface AuthContextValue {
  user: CurrentUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  registerParent: (input: RegisterParentInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function postSession(url: string, body: unknown) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message ?? 'Something went wrong. Please try again.');
  }
  return data;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get<CurrentUser>('/auth/me');
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await postSession('/api/auth/login', { email, password });
      setUser(data.user);
      router.push(roleHomePath(data.user.role));
      router.refresh();
    },
    [router],
  );

  const registerParent = useCallback(
    async (input: RegisterParentInput) => {
      const data = await postSession('/api/auth/register-parent', input);
      setUser(data.user);
      router.push(roleHomePath(data.user.role));
      router.refresh();
    },
    [router],
  );

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/auth/login');
    router.refresh();
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, registerParent, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
