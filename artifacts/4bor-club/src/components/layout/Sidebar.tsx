import React, { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { Clock, Users, Activity as ActivityIcon } from 'lucide-react';
import { activities, stickers } from '../../data/mock';
import { formatPrice } from '../../lib/format';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

export function Sidebar() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const moscowTime = time.toLocaleTimeString('ru-RU', { 
    timeZone: 'Europe/Moscow',
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  });

  return (
    <aside className="w-80 flex-shrink-0 bg-sidebar border-l border-sidebar-border h-[calc(100vh-4rem)] overflow-y-auto flex flex-col hidden lg:flex">
      
      {/* Stats Block */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Сейчас в клубе</h3>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="font-semibold text-sm">24</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3 h-3" /> Время (МСК)
          </h3>
          <span className="font-mono text-sm font-semibold">{moscowTime}</span>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="p-6 border-b border-sidebar-border">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-1">
          <ActivityIcon className="w-3 h-3" /> Последняя активность
        </h3>
        <div className="space-y-4">
          {activities.map(activity => (
            <div key={activity.id} className="text-sm">
              <p className="text-foreground leading-snug">{activity.text}</p>
              <p className="text-xs text-muted-foreground mt-1">{activity.timeAgo}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stickers */}
      <div className="p-6 flex-1">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Стикеры</h3>
          <Link href="/stickers" className="text-xs text-primary hover:underline">Все</Link>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {stickers.slice(0, 4).map(sticker => (
            <Card key={sticker.id} className="bg-background overflow-hidden hover-elevate border-border/50">
              <div className="h-20 w-full overflow-hidden">
                <img src={sticker.imageUrl} alt="Sticker" className="w-full h-full object-cover opacity-80 mix-blend-multiply" />
              </div>
              <CardContent className="p-3 text-center">
                <p className="text-[10px] font-medium leading-tight mb-2 line-clamp-2" title={sticker.text}>
                  {sticker.text}
                </p>
                <div className="text-xs font-bold text-primary mb-2">
                  от {formatPrice(sticker.budget)}
                </div>
                <Button variant="outline" size="sm" className="w-full h-7 text-[10px] uppercase tracking-wider">
                  Предложить
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </aside>
  );
}
