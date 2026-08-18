import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ROLE_LABELS } from '../lib/format';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { User as UserIcon, LogOut, Settings, Award } from 'lucide-react';
import { Role } from '../data/mock';
import { useLocation } from 'wouter';

export default function Profile() {
  const { user, logout, setRole } = useAuth();
  const [, setLocation] = useLocation();

  if (!user) {
    setLocation('/login');
    return null;
  }

  const handleLogout = () => {
    logout();
    setLocation('/login');
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-serif font-semibold">Личный кабинет</h1>
        <Button variant="outline" onClick={handleLogout} className="text-destructive hover:text-destructive border-destructive/20 hover:bg-destructive/5">
          <LogOut className="w-4 h-4 mr-2" /> Выйти
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Card */}
        <Card className="md:col-span-1 overflow-hidden">
          <div className="h-24 bg-secondary flex items-end justify-center pb-4 relative">
             <div className="absolute -bottom-10 w-24 h-24 rounded-full bg-card border-4 border-card flex items-center justify-center shadow-sm">
                <UserIcon className="w-10 h-10 text-muted-foreground" />
             </div>
          </div>
          <CardContent className="pt-14 pb-6 px-6 text-center">
            <h2 className="text-xl font-serif font-semibold mb-1">{user.login}</h2>
            <p className="text-sm text-muted-foreground mb-4">{user.email}</p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium uppercase tracking-wider mb-6">
              <Award className="w-3.5 h-3.5" />
              {ROLE_LABELS[user.role]}
            </div>
            <div className="text-xs text-muted-foreground border-t pt-4">
              В клубе с {new Date(user.createdAt).toLocaleDateString('ru-RU')}
            </div>
          </CardContent>
        </Card>

        {/* Demo Settings & History */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-serif font-medium mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-muted-foreground" />
                Настройки доступа (Демо-режим)
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Для демонстрации работы приложения вы можете переключать свою роль. Это повлияет на доступные разделы и возможности.
              </p>
              <div className="flex flex-wrap gap-3">
                {(['dealer', 'collector', 'admin'] as Role[]).map(role => (
                  <Button 
                    key={role}
                    variant={user.role === role ? 'default' : 'outline'}
                    onClick={() => setRole(role)}
                    size="sm"
                  >
                    Стать {ROLE_LABELS[role]}ом
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-serif font-medium mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-muted-foreground" />
                История ставок (Демо)
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <div className="font-medium text-sm">Денга Ивана Грозного</div>
                    <div className="text-xs text-muted-foreground">12 мая 2024, 15:30</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-primary">3 500 ₽</div>
                    <div className="text-[10px] uppercase text-green-600 font-bold">Лидирует</div>
                  </div>
                </div>
                <div className="flex items-center justify-between border-b pb-3 opacity-60">
                  <div>
                    <div className="font-medium text-sm">Крест энколпион</div>
                    <div className="text-xs text-muted-foreground">10 мая 2024, 11:20</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">6 000 ₽</div>
                    <div className="text-[10px] uppercase text-red-500 font-bold">Перебита</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
