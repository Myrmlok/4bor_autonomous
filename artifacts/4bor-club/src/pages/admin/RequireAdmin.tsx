import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from 'wouter';

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  React.useEffect(() => {
    if (isLoading) return;
    if (!user) {
      setLocation('/login');
    } else if (user.role !== 'admin') {
      setLocation('/');
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') return null;

  return <>{children}</>;
}
