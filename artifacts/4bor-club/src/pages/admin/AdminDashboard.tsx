import React from 'react';
import { Link, useLocation } from 'wouter';
import { RequireAdmin } from './RequireAdmin';
import { Card, CardContent } from '../../components/ui/card';
import { Users, Gavel, FileText, Settings, Ticket } from 'lucide-react';
import { lots, stickers, themes, mockUser } from '../../data/mock';

function AdminSidebar() {
  const [location] = useLocation();
  const links = [
    { href: '/admin', label: 'Статистика', icon: FileText },
    { href: '/admin/users', label: 'Пользователи', icon: Users },
    { href: '/admin/invites', label: 'Инвайты', icon: Ticket },
    { href: '/admin/lots', label: 'Управление лотами', icon: Gavel },
  ];

  return (
    <div className="w-64 bg-card border-r min-h-[calc(100vh-4rem)] p-6 flex flex-col gap-2">
      <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Панель управления</div>
      {links.map(link => {
        const Icon = link.icon;
        const isActive = location === link.href;
        return (
          <Link 
            key={link.href} 
            href={link.href}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-md transition-colors text-sm font-medium ${
              isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/50 text-foreground'
            }`}
          >
            <Icon className="w-4 h-4" />
            {link.label}
          </Link>
        )
      })}
    </div>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAdmin>
      <div className="flex bg-background min-h-[calc(100vh-4rem)]">
        <AdminSidebar />
        <div className="flex-1 p-8 overflow-y-auto max-h-[calc(100vh-4rem)]">
          {children}
        </div>
      </div>
    </RequireAdmin>
  );
}

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <h1 className="text-3xl font-serif font-semibold mb-8">Общая статистика</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover-elevate">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Всего лотов</div>
              <Gavel className="w-5 h-5 text-primary" />
            </div>
            <div className="text-3xl font-bold">{lots.length}</div>
          </CardContent>
        </Card>
        <Card className="hover-elevate">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Стикеры</div>
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div className="text-3xl font-bold">{stickers.length}</div>
          </CardContent>
        </Card>
        <Card className="hover-elevate">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Участники</div>
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div className="text-3xl font-bold">148</div>
          </CardContent>
        </Card>
        <Card className="hover-elevate">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Тематики</div>
              <Settings className="w-5 h-5 text-primary" />
            </div>
            <div className="text-3xl font-bold">{themes.length}</div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
