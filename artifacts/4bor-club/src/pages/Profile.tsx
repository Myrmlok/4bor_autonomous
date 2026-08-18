import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ROLE_LABELS } from '../lib/format';
import { User as UserIcon, LogOut, Settings, Gavel, Crown } from 'lucide-react';
import { Role } from '../data/mock';
import { useLocation } from 'wouter';

const ROLE_BADGE: Record<string, string> = {
  dealer: 'bg-primary/15 text-primary border border-primary/30',
  collector: 'bg-blue-500/15 text-blue-700 border border-blue-400/30',
  admin: 'bg-purple-500/15 text-purple-700 border border-purple-400/30',
};

const MOCK_BIDS = [
  { lot: 'Денга Ивана Грозного', date: '12.05.2025, 15:30', amount: 3500, status: 'leader' },
  { lot: 'Крест энколпион', date: '10.05.2025, 11:20', amount: 6000, status: 'outbid' },
  { lot: 'Дирхем Золотой Орды', date: '07.05.2025, 09:45', amount: 900, status: 'won' },
];

const MOCK_ORDERS = [
  { lot: 'Полушка Василия Дмитриевича', date: '05.05.2025', amount: 12000 },
  { lot: '5 копеек 1726 года', date: '01.05.2025', amount: 45000 },
];

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  leader: { label: 'Лидирует', cls: 'text-green-600' },
  outbid: { label: 'Перебита', cls: 'text-red-500' },
  won: { label: 'Выиграна', cls: 'text-primary' },
};

export default function Profile() {
  const { user, logout, setRole } = useAuth();
  const [, setLocation] = useLocation();

  if (!user) {
    setLocation('/login');
    return null;
  }

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif font-semibold text-foreground">Личный кабинет</h1>
          <p className="text-sm text-muted-foreground mt-1">Управление аккаунтом и история активности</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 border border-destructive/30 text-destructive text-sm hover:bg-destructive/5 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Выйти
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Profile card */}
        <div className="col-span-1 flex flex-col gap-5">
          <div className="border border-border/50 bg-card">
            <div className="h-20 bg-secondary flex items-center justify-center relative">
              <div className="absolute -bottom-8 w-16 h-16 rounded-full bg-card border-2 border-border flex items-center justify-center">
                <span className="text-xl font-serif font-bold text-foreground">{user.login[0].toUpperCase()}</span>
              </div>
            </div>
            <div className="pt-12 pb-6 px-5 text-center">
              <h2 className="text-lg font-serif font-semibold">{user.login}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
              <div className={`inline-flex items-center gap-1.5 mt-3 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${ROLE_BADGE[user.role]}`}>
                <Crown className="w-3 h-3" />
                {ROLE_LABELS[user.role] ?? user.role}
              </div>
              <div className="text-xs text-muted-foreground mt-4 border-t border-border/50 pt-4">
                В Клубе с {new Date(user.createdAt).toLocaleDateString('ru-RU')}
              </div>
            </div>
          </div>

          {/* Demo role switcher */}
          <div className="border border-border/50 bg-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Settings className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Демо-режим</span>
            </div>
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              Переключитесь в другую роль, чтобы проверить, как меняется интерфейс и доступные разделы.
            </p>
            <div className="flex flex-col gap-2">
              {(['dealer', 'collector', 'admin'] as Role[]).map(role => (
                <button
                  key={role}
                  onClick={() => setRole(role)}
                  className={`text-left px-3 py-2.5 text-sm border transition-all ${
                    user.role === role
                      ? 'border-primary bg-primary/10 text-foreground font-medium'
                      : 'border-border/40 hover:border-primary/40 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {ROLE_LABELS[role]}
                  {user.role === role && <span className="ml-2 text-[10px] text-primary uppercase tracking-widest">Активна</span>}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* History */}
        <div className="col-span-2 flex flex-col gap-5">
          {/* Bids — only for dealers */}
          {user.role !== 'collector' && (
            <div className="border border-border/50 bg-card p-6">
              <h3 className="text-sm font-medium uppercase tracking-widest text-muted-foreground mb-5 flex items-center gap-2">
                <Gavel className="w-4 h-4" />
                История ставок
              </h3>
              <div className="divide-y divide-border/40">
                {MOCK_BIDS.map((b, i) => (
                  <div key={i} className="flex items-center justify-between py-3">
                    <div>
                      <div className="text-sm font-medium">{b.lot}</div>
                      <div className="text-xs text-muted-foreground">{b.date}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{b.amount.toLocaleString('ru-RU')} ₽</div>
                      <div className={`text-[10px] font-bold uppercase ${STATUS_LABEL[b.status].cls}`}>
                        {STATUS_LABEL[b.status].label}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Purchases */}
          <div className="border border-border/50 bg-card p-6">
            <h3 className="text-sm font-medium uppercase tracking-widest text-muted-foreground mb-5">
              История покупок
            </h3>
            <div className="divide-y divide-border/40">
              {MOCK_ORDERS.map((o, i) => (
                <div key={i} className="flex items-center justify-between py-3">
                  <div>
                    <div className="text-sm font-medium">{o.lot}</div>
                    <div className="text-xs text-muted-foreground">{o.date}</div>
                  </div>
                  <div className="text-sm font-semibold">{o.amount.toLocaleString('ru-RU')} ₽</div>
                </div>
              ))}
            </div>
          </div>

          {/* Access info for collector */}
          {user.role === 'collector' && (
            <div className="border border-blue-400/30 bg-blue-50/50 p-5">
              <p className="text-sm text-blue-800/80 font-medium mb-1">Роль: Коллекционер</p>
              <ul className="text-xs text-blue-700/60 space-y-1 list-disc list-inside">
                <li>Доступен раздел «Аукционы от находчиков и коллекционеров»</li>
                <li>Можно создавать аукционные лоты в этом разделе</li>
                <li>Нельзя делать ставки</li>
                <li>Разделы «Эксклюзивы» и «Новости» закрыты</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
