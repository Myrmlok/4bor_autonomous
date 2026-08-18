import React, { useState } from 'react';
import { Link } from 'wouter';
import { ChevronRight, Lock } from 'lucide-react';
import { themes, groups, newsList } from '../data/mock';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent } from '../components/ui/card';

export default function Home() {
  const { user } = useAuth();
  const isCollector = user?.role === 'collector';
  const [activeThemeId, setActiveThemeId] = useState<string>(themes[0].id);

  const activeTheme = themes.find(t => t.id === activeThemeId) || themes[0];
  const themeGroups = groups.filter(g => g.themeId === activeThemeId);

  return (
    <div className="flex flex-col pb-20">
      {/* Hero */}
      <section className="relative h-[180px] bg-secondary flex flex-col justify-center px-8 overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('/images/hero-bg.jpg')] bg-cover bg-center"></div>
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-serif text-white mb-2">Добро пожаловать в Клуб</h1>
          <p className="text-white/70 font-light tracking-wide">
            Закрытое пространство для дилеров и коллекционеров
          </p>
        </div>
      </section>

      {/* Themes */}
      <section className="px-8 py-10">
        <h2 className="text-sm font-bold tracking-widest text-muted-foreground uppercase mb-6">Тематики</h2>
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
          {themes.map(theme => {
            const isActive = theme.id === activeThemeId;
            return (
              <button
                key={theme.id}
                onClick={() => setActiveThemeId(theme.id)}
                className={`group relative flex-shrink-0 w-48 h-64 rounded-xl overflow-hidden snap-start transition-all duration-300 ${isActive ? 'ring-2 ring-primary ring-offset-4 ring-offset-background' : 'opacity-80 hover:opacity-100 hover-elevate'}`}
              >
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors z-10"></div>
                <img src={theme.imageUrl} alt={theme.name} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent z-20">
                  <h3 className="text-white font-serif text-lg font-medium leading-tight">{theme.name}</h3>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Active Theme Groups */}
      <section className="px-8 pb-12">
        <div className="bg-card border rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b bg-muted/30">
            <h2 className="font-serif text-2xl font-semibold text-foreground">{activeTheme.name}</h2>
          </div>
          <div className="divide-y">
            {themeGroups.map(group => (
              <div key={group.id} className="flex flex-col md:flex-row items-center hover:bg-muted/10 transition-colors">
                <div className="w-full md:w-1/4 px-6 py-4 border-b md:border-b-0 md:border-r font-medium">
                  {group.name}
                </div>
                <div className="w-full md:w-3/4 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x">
                  <Link 
                    href={`/catalog/${activeTheme.id}/groups/${group.id}`} 
                    className="flex items-center justify-between px-6 py-4 group/link hover:text-primary transition-colors"
                  >
                    <span className="text-sm">Аукционы от находчиков</span>
                    <ChevronRight className="w-4 h-4 opacity-50 group-hover/link:opacity-100 transition-opacity" />
                  </Link>
                  
                  {isCollector ? (
                    <div className="flex items-center justify-between px-6 py-4 text-muted-foreground/50 cursor-not-allowed">
                      <span className="text-sm">Эксклюзивы</span>
                      <Lock className="w-4 h-4" />
                    </div>
                  ) : (
                    <Link 
                      href={`/catalog/${activeTheme.id}/groups/${group.id}?section=exclusive`} 
                      className="flex items-center justify-between px-6 py-4 group/link hover:text-primary transition-colors"
                    >
                      <span className="text-sm">Эксклюзивы от дилеров</span>
                      <ChevronRight className="w-4 h-4 opacity-50 group-hover/link:opacity-100 transition-opacity" />
                    </Link>
                  )}
                  
                  <Link 
                    href={`/catalog/${activeTheme.id}/groups/${group.id}?section=liquidation`} 
                    className="flex items-center justify-between px-6 py-4 group/link hover:text-primary transition-colors"
                  >
                    <span className="text-sm text-destructive">Ликвидация</span>
                    <ChevronRight className="w-4 h-4 opacity-50 group-hover/link:opacity-100 transition-opacity text-destructive" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <Link href="/auctions" className="p-4 border rounded-lg bg-card hover:border-primary/50 transition-colors group">
            <div className="text-primary font-mono text-xs mb-2">01</div>
            <div className="font-medium group-hover:text-primary transition-colors">Аукционы</div>
          </Link>
          <div className="p-4 border rounded-lg bg-muted/30 text-muted-foreground/50 cursor-not-allowed">
            <div className="flex justify-between items-start mb-2">
              <div className="font-mono text-xs">02</div>
              <Lock className="w-3 h-3" />
            </div>
            <div className="font-medium">Эксклюзивы</div>
          </div>
          <div className="p-4 border rounded-lg bg-muted/30 text-muted-foreground/50 cursor-not-allowed">
            <div className="flex justify-between items-start mb-2">
              <div className="font-mono text-xs">03</div>
              <Lock className="w-3 h-3" />
            </div>
            <div className="font-medium">Ликвидация</div>
          </div>
          <div className="p-4 border rounded-lg bg-muted/30 text-muted-foreground/50 cursor-not-allowed">
            <div className="flex justify-between items-start mb-2">
              <div className="font-mono text-xs">04</div>
              <Lock className="w-3 h-3" />
            </div>
            <div className="font-medium">Архив</div>
          </div>
        </div>
      </section>

      {/* News */}
      <section className="px-8 pb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-bold tracking-widest text-muted-foreground uppercase">Новости клуба</h2>
          <Link href="/news" className="text-sm text-primary hover:underline">Все новости</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {newsList.map(news => (
            <Link key={news.id} href={`/news`} className="group flex flex-col gap-3 cursor-pointer">
              <div className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-muted">
                <img src={news.imageUrl} alt={news.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">
                  {new Date(news.date).toLocaleDateString('ru-RU')}
                </div>
                <h3 className="font-serif font-medium leading-tight group-hover:text-primary transition-colors line-clamp-2">
                  {news.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

    </div>
  );
}
