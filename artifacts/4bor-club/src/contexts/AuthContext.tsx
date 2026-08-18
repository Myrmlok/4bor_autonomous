import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { DEMO_ACCOUNTS, DEMO_INVITES, type User } from '../lib/demo-accounts';
import type { Role } from '../data/mock';

export type { User, Role };

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (loginName: string, password: string) => boolean;
  loginAs: (account: User) => void;
  logout: () => void;
  setRole: (role: Role) => void;
  registerWithInvite: (token: string, loginName: string, email: string) => { ok: boolean; error?: string };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PUBLIC_PATHS = ['/login', '/register'];

function isPublic(path: string) {
  return PUBLIC_PATHS.some(p => path === p || path.startsWith(p + '/'));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [location, setLocation] = useLocation();

  // Restore session from localStorage on mount (no auto-login if empty)
  useEffect(() => {
    const saved = localStorage.getItem('4bor_session');
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {
        localStorage.removeItem('4bor_session');
      }
    }
    setIsLoading(false);
  }, []);

  // Guard: redirect to /login when not authenticated and not on a public page
  useEffect(() => {
    if (!isLoading && !user && !isPublic(location)) {
      setLocation('/login');
    }
  }, [user, isLoading, location]);

  const login = (loginName: string, password: string): boolean => {
    const account = DEMO_ACCOUNTS.find(
      a => (a.login === loginName || a.email === loginName) && a.password === password
    );
    if (account) {
      const { password: _, ...u } = account;
      setUser(u);
      localStorage.setItem('4bor_session', JSON.stringify(u));
      return true;
    }
    return false;
  };

  const loginAs = (account: User) => {
    setUser(account);
    localStorage.setItem('4bor_session', JSON.stringify(account));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('4bor_session');
    setLocation('/login');
  };

  const setRole = (role: Role) => {
    if (user) {
      const updated = { ...user, role };
      setUser(updated);
      localStorage.setItem('4bor_session', JSON.stringify(updated));
    }
  };

  const registerWithInvite = (token: string, loginName: string, email: string): { ok: boolean; error?: string } => {
    // Accept known demo tokens OR any token prefixed with role name (dealer-xxx, collector-xxx)
    const invite =
      DEMO_INVITES[token] ||
      (token.startsWith('dealer-') ? { role: 'dealer' as Role, label: 'Дилер' } :
       token.startsWith('collector-') ? { role: 'collector' as Role, label: 'Коллекционер' } :
       null);
    if (!invite) return { ok: false, error: 'Недействительная пригласительная ссылка.' };
    if (!loginName.trim()) return { ok: false, error: 'Укажите логин.' };
    if (!email.trim()) return { ok: false, error: 'Укажите email.' };
    const newUser: User = {
      id: Date.now(),
      login: loginName.trim(),
      email: email.trim(),
      role: invite.role,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setUser(newUser);
    localStorage.setItem('4bor_session', JSON.stringify(newUser));
    return { ok: true };
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, loginAs, logout, setRole, registerWithInvite }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
