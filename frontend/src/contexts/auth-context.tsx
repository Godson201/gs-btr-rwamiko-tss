'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { roleHomePath } from '@/lib/session';

export interface LocationSummary {
  id: string;
  province: string;
  district: string;
  sector: string;
  cell: string;
  village: string;
}

export interface CurrentUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'STUDENT' | 'TEACHER' | 'PARENT' | 'ADMIN' | 'SUPER_ADMIN';
  avatar?: string | null;
  phone?: string | null;
  staffTitle?: string | null;
  nickname?: string | null;
  jobTitle?: string | null;
  dateOfBirth?: string | null;
  accountStatus?: 'ACTIVE' | 'PENDING' | 'REJECTED';
  portalAccess?: CurrentUser['role'][];
  residenceLocation?: LocationSummary | null;
  workplaceLocation?: LocationSummary | null;
  worksAtAnotherSchool?: boolean;
  otherSchoolName?: string | null;
  parent?: { status: 'PENDING' | 'APPROVED' | 'REJECTED'; occupation?: string | null; relationship?: string | null } | null;
}

export interface RegisterParentInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  nickname?: string;
  jobTitle?: string;
  dateOfBirth?: string;
  relationship?: string;
  occupation?: string;
  residenceLocationId?: string;
  workplaceLocationId?: string;
  requestedStudentId?: string;
  claimedStudentName?: string;
  claimedAdmissionNo?: string;
}

interface AuthContextValue {
  user: CurrentUser | null;
  permissions: string[];
  schoolRoles: Array<{ code: string; label: string; departmentIds: string[] }>;
  hasPermission: (permission: string) => boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  registerParent: (input: RegisterParentInput) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function postSession(url: string, body: unknown): Promise<{ user: CurrentUser }> {
  let response: Response;
  let responseText: string;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(90000),
    });
    responseText = await response.text();
  } catch (error) {
    if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
      throw new Error('The school server is taking too long to respond. Please try again.');
    }
    throw new Error('Unable to connect to the school. Check your internet connection and try again.');
  }
  let data: Record<string, unknown> = {};
  if (responseText) {
    try {
      data = JSON.parse(responseText) as Record<string, unknown>;
    } catch {
      data = {};
    }
  }
  if (!response.ok) {
    throw new Error(
      typeof data.message === 'string'
        ? data.message
        : 'The service is temporarily unavailable. Please try again.',
    );
  }
  if (!data.user || typeof data.user !== 'object') {
    throw new Error('The service returned an invalid response. Please try again.');
  }
  return { user: data.user as CurrentUser };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [schoolRoles, setSchoolRoles] = useState<AuthContextValue['schoolRoles']>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get<CurrentUser>('/auth/me');
      setUser(data);
      try {
        const access = await api.get<Pick<AuthContextValue, 'permissions' | 'schoolRoles'>>('/rbac/me/access');
        setPermissions(access.data.permissions);
        setSchoolRoles(access.data.schoolRoles);
      } catch {
        // Keep the authenticated session usable during a rolling backend deployment.
        setPermissions([]);
        setSchoolRoles([]);
      }
    } catch {
      setUser(null);
      setPermissions([]);
      setSchoolRoles([]);
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
      try {
        const access = await api.get<Pick<AuthContextValue, 'permissions' | 'schoolRoles'>>('/rbac/me/access');
        setPermissions(access.data.permissions);
        setSchoolRoles(access.data.schoolRoles);
      } catch {
        setPermissions([]);
        setSchoolRoles([]);
      }
      const destination =
        data.user.accountStatus && data.user.accountStatus !== 'ACTIVE'
          ? '/auth/pending-approval'
          : roleHomePath(data.user.role);
      router.push(destination);
      router.refresh();
    },
    [router],
  );

  const registerParent = useCallback(
    async (input: RegisterParentInput) => {
      const data = await postSession('/api/auth/register-parent', input);
      setUser(data.user);
      setPermissions([]);
      setSchoolRoles([]);
      const destination =
        data.user.accountStatus && data.user.accountStatus !== 'ACTIVE'
          ? '/auth/pending-approval'
          : roleHomePath(data.user.role);
      router.push(destination);
      router.refresh();
    },
    [router],
  );

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setPermissions([]);
    setSchoolRoles([]);
    router.push('/auth/login');
    router.refresh();
  }, [router]);

  const hasPermission = useCallback(
    (permission: string) => permissions.includes(permission),
    [permissions],
  );

  return (
    <AuthContext.Provider value={{ user, permissions, schoolRoles, hasPermission, isLoading, login, registerParent, logout, refresh }}>
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
