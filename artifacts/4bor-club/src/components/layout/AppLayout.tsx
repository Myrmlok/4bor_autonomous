import React from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <Header />
      <div className="flex flex-1 w-full overflow-hidden h-[calc(100vh-4rem)]">
        <main className="flex-1 flex flex-col min-h-0 overflow-y-auto">
          {children}
        </main>
        <Sidebar />
      </div>
    </div>
  );
}
