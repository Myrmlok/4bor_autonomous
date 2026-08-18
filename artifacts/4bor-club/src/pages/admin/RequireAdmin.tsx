import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from 'wouter';

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  React.useEffect(() => {
    if (user && user.role !== 'admin') {
      setLocation('/');
    }
  }, [user, setLocation]);

  if (!user || user.role !== 'admin') {
    return null; // or loading
  }

  return <>{children}</>;
}
