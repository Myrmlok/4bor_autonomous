import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, mockUser, Role } from '../data/mock';

interface AuthContextType {
  user: User | null;
  login: (login: string) => void;
  logout: () => void;
  setRole: (role: Role) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Mock auto-login
    const savedRole = localStorage.getItem('4bor_role') as Role;
    setUser({ ...mockUser, role: savedRole || mockUser.role });
  }, []);

  const login = (loginName: string) => {
    setUser({ ...mockUser, login: loginName });
  };

  const logout = () => {
    setUser(null);
  };

  const setRole = (role: Role) => {
    if (user) {
      setUser({ ...user, role });
      localStorage.setItem('4bor_role', role);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, setRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
