import React, {
  createContext, useContext, useEffect, useState, useCallback, type ReactNode,
} from 'react';
import { auth, type ApiUser } from '../lib/api-client';

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'dealer' | 'collector';

export interface AuthUser {
  id: number;
  login: string;
  email: string;
  role: UserRole;
}

interface AuthContextValue {
  user:     AuthUser | null;
  loading:  boolean;
  login:    (loginOrEmail: string, password: string) => Promise<void>;
  register: (token: string, login: string, email: string, password: string) => Promise<void>;
  logout:   () => Promise<void>;
  setRole:  (role: UserRole) => Promise<void>;
}

// ─── Demo quick-login shortcuts ───────────────────────────────────────────────
// These work because the API seed creates these exact accounts with password '123'.

export const DEMO_ACCOUNTS = [
  { label: 'Дилер (Иванов)',      login: 'dealer_ivanov',    password: '123', role: 'dealer'    as UserRole },
  { label: 'Коллекционер (Петров)', login: 'collector_petrov', password: '123', role: 'collector' as UserRole },
  { label: 'Администратор',        login: 'admin',             password: 'admin123', role: 'admin' as UserRole },
];

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue>({
  user: null, loading: true,
  login: async () => {}, register: async () => {}, logout: async () => {}, setRole: async () => {},
});

function toAuthUser(u: ApiUser): AuthUser {
  return { id: u.id, login: u.login, email: u.email, role: u.role };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Boot: restore session from cookie ─────────────────────────────────────
  useEffect(() => {
    auth.me()
      .then(u => setUser(toAuthUser(u)))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (loginOrEmail: string, password: string) => {
    const u = await auth.login(loginOrEmail, password);
    setUser(toAuthUser(u));
  }, []);

  const register = useCallback(async (
    token: string, login: string, email: string, password: string,
  ) => {
    const u = await auth.register(token, login, email, password);
    setUser(toAuthUser(u));
  }, []);

  const logout = useCallback(async () => {
    await auth.logout().catch(() => {});
    setUser(null);
  }, []);

  const setRole = useCallback(async (role: UserRole) => {
    const u = await auth.setRole(role);
    setUser(toAuthUser(u));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
