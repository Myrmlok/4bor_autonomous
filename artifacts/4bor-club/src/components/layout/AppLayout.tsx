import React from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MobileBottomNav } from './MobileNav';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <Header />
      <div className="flex flex-1 w-full">
        <main className="flex-1 flex flex-col min-h-0 overflow-x-hidden pb-16 md:pb-0">
          {children}
        </main>
        <Sidebar />
      </div>
      <MobileBottomNav />
    </div>
  );
}
