import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { RequireAdmin } from './RequireAdmin';
import { Card, CardContent } from '../../components/ui/card';
import { Sheet, SheetContent, SheetTrigger } from '../../components/ui/sheet';
import { Users, Gavel, FileText, Settings, Ticket, Menu } from 'lucide-react';
import { lots, stickers, themes } from '../../data/mock';

const ADMIN_LINKS = [
  { href: '/admin',         label: 'Статистика',       icon: FileText },
  { href: '/admin/users',   label: 'Пользователи',     icon: Users    },
  { href: '/admin/invites', label: 'Инвайты',          icon: Ticket   },
  { href: '/admin/lots',    label: 'Управление лотами', icon: Gavel   },
];

function SidebarLinks({ location, onNav }: { location: string; onNav?: () => void }) {
  return (
    <>
      <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Панель управления</div>
      {ADMIN_LINKS.map(link => {
        const Icon = link.icon;
        const isActive = location === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNav}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-md transition-colors text-sm font-medium ${
              isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/50 text-foreground'
            }`}
          >
            <Icon className="w-4 h-4" />
            {link.label}
          </Link>
        );
      })}
    </>
  );
}

function AdminSidebar() {
  const [location] = useLocation();
  return (
    <div className="hidden md:flex w-64 bg-card border-r min-h-[calc(100vh-4rem)] p-6 flex-col gap-2 shrink-0">
      <SidebarLinks location={location} />
    </div>
  );
}

function AdminMobileBar() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const current = ADMIN_LINKS.find(l => location === l.href);

  return (
    <div className="md:hidden flex items-center justify-between px-4 py-3 bg-card border-b sticky top-16 z-30">
      <span className="text-sm font-medium text-foreground">{current?.label ?? 'Панель управления'}</span>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <Menu className="w-5 h-5" />
          </button>
        </SheetTrigger>
        <SheetContent side="right" className="w-64 bg-card border-l p-6 flex flex-col gap-2">
          <SidebarLinks location={location} onNav={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAdmin>
      <div className="flex bg-background min-h-screen">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <AdminMobileBar />
          <div className="p-4 md:p-8 overflow-x-hidden">
            {children}
          </div>
        </div>
      </div>
    </RequireAdmin>
  );
}

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <h1 className="text-2xl md:text-3xl font-serif font-semibold mb-6 md:mb-8">Общая статистика</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="hover-elevate">
          <CardContent className="p-4 md:p-6">
            <div className="flex justify-between items-start mb-3 md:mb-4">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Всего лотов</div>
              <Gavel className="w-4 h-4 md:w-5 md:h-5 text-primary" />
            </div>
            <div className="text-2xl md:text-3xl font-bold">{lots.length}</div>
          </CardContent>
        </Card>
        <Card className="hover-elevate">
          <CardContent className="p-4 md:p-6">
            <div className="flex justify-between items-start mb-3 md:mb-4">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Стикеры</div>
              <FileText className="w-4 h-4 md:w-5 md:h-5 text-primary" />
            </div>
            <div className="text-2xl md:text-3xl font-bold">{stickers.length}</div>
          </CardContent>
        </Card>
        <Card className="hover-elevate">
          <CardContent className="p-4 md:p-6">
            <div className="flex justify-between items-start mb-3 md:mb-4">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Участники</div>
              <Users className="w-4 h-4 md:w-5 md:h-5 text-primary" />
            </div>
            <div className="text-2xl md:text-3xl font-bold">148</div>
          </CardContent>
        </Card>
        <Card className="hover-elevate">
          <CardContent className="p-4 md:p-6">
            <div className="flex justify-between items-start mb-3 md:mb-4">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Тематики</div>
              <Settings className="w-4 h-4 md:w-5 md:h-5 text-primary" />
            </div>
            <div className="text-2xl md:text-3xl font-bold">{themes.length}</div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
