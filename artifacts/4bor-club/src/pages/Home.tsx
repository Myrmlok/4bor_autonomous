import React, { useState } from 'react';
import { Link } from 'wouter';
import { ChevronRight, Lock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { catalog, newsApi, type ApiTheme, type ApiGroup } from '../lib/api-client';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const { user } = useAuth();
  const isCollector = user?.role === 'collector';

  const { data: themes = [] } = useQuery<ApiTheme[]>({
    queryKey: ['catalog', 'themes'],
    queryFn: catalog.themes,
  });

  const [activeThemeId, setActiveThemeId] = useState<string | null>(null);
  const resolvedThemeId = activeThemeId ?? themes[0]?.id ?? null;

  const { data: themeGroups = [] } = useQuery<ApiGroup[]>({
    queryKey: ['catalog', 'themeGroups', resolvedThemeId],
    queryFn: () => catalog.themeGroups(resolvedThemeId!),
    enabled: !!resolvedThemeId,
  });

  const { data: newsList = [] } = useQuery({
    queryKey: ['news'],
    queryFn: newsApi.list,
    enabled: !isCollector,
  });

  const activeTheme = themes.find(t => t.id === resolvedThemeId) ?? themes[0];

  return (
    <div className="flex flex-col pb-20 md:pb-12">
      {/* Hero */}
      <section className="relative h-[140px] md:h-[180px] bg-secondary flex flex-col justify-center px-5 md:px-8 overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('/images/hero-bg.jpg')] bg-cover bg-center pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-2xl md:text-4xl font-serif text-white mb-1.5 md:mb-2">Добро пожаловать в Клуб</h1>
          <p className="text-sm md:text-base text-white/70 font-light tracking-wide">
            Закрытое пространство для дилеров и коллекционеров
          </p>
        </div>
      </section>

      {/* Themes */}
      <section className="px-4 md:px-8 py-6 md:py-10">
        <h2 className="text-xs font-bold tracking-widest text-muted-foreground uppercase mb-4 md:mb-6">Тематики</h2>
        <div className="flex gap-3 md:gap-4 overflow-x-auto pb-3 md:pb-4 snap-x scrollbar-none -mx-4 md:mx-0 px-4 md:px-0">
          {themes.map(theme => {
            const isActive = theme.id === resolvedThemeId;
            return (
              <button
                key={theme.id}
                onClick={() => setActiveThemeId(theme.id)}
                className={`group relative flex-shrink-0 w-36 h-48 md:w-48 md:h-64 overflow-hidden snap-start transition-all duration-300 ${
                  isActive ? 'ring-2 ring-primary ring-offset-2 md:ring-offset-4 ring-offset-background' : 'opacity-75 hover:opacity-100'
                }`}
              >
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors z-10" />
                <img src={theme.imageUrl} alt={theme.name} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 p-3 md:p-4 bg-gradient-to-t from-black/80 to-transparent z-20">
                  <h3 className="text-white font-serif text-base md:text-lg font-medium leading-tight">{theme.name}</h3>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Active Theme Groups */}
      {activeTheme && (
        <section className="px-4 md:px-8 pb-8 md:pb-12">
          <div className="bg-card border border-border/50 overflow-hidden">
            <div className="px-4 md:px-6 py-3 md:py-4 border-b border-border/50 bg-muted/30">
              <h2 className="font-serif text-xl md:text-2xl font-semibold">{activeTheme.name}</h2>
            </div>
            <div className="divide-y divide-border/40">
              {themeGroups.map(group => (
                <div key={group.id} className="flex flex-col hover:bg-muted/10 transition-colors">
                  {/* Group name — full width header on mobile */}
                  <div className="px-4 md:px-6 py-3 border-b border-border/30 font-medium text-sm bg-muted/5 md:bg-transparent md:hidden">
                    {group.name}
                  </div>
                  <div className="flex flex-col md:flex-row items-stretch">
                    {/* Group name — desktop left column */}
                    <div className="hidden md:flex w-1/4 px-6 py-4 border-r border-border/30 font-medium text-sm items-center">
                      {group.name}
                    </div>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border/30">
                      {/* Аукционы */}
                      <Link
                        href={`/catalog/${activeTheme.id}/groups/${group.id}`}
                        className="flex items-center justify-between px-4 md:px-6 py-3.5 md:py-4 group/link hover:text-primary transition-colors"
                      >
                        <span className="text-sm">Аукционы от находчиков</span>
                        <ChevronRight className="w-4 h-4 opacity-50 group-hover/link:opacity-100 transition-opacity" />
                      </Link>

                      {/* Эксклюзивы */}
                      {isCollector ? (
                        <div className="flex items-center justify-between px-4 md:px-6 py-3.5 md:py-4 text-muted-foreground/40 cursor-not-allowed select-none">
                          <span className="text-sm">Эксклюзивы</span>
                          <Lock className="w-4 h-4" />
                        </div>
                      ) : (
                        <Link
                          href={`/catalog/${activeTheme.id}/groups/${group.id}?section=exclusive`}
                          className="flex items-center justify-between px-4 md:px-6 py-3.5 md:py-4 group/link hover:text-primary transition-colors"
                        >
                          <span className="text-sm">Эксклюзивы от дилеров</span>
                          <ChevronRight className="w-4 h-4 opacity-50 group-hover/link:opacity-100 transition-opacity" />
                        </Link>
                      )}

                      {/* Ликвидация */}
                      <Link
                        href={`/catalog/${activeTheme.id}/groups/${group.id}?section=liquidation`}
                        className="flex items-center justify-between px-4 md:px-6 py-3.5 md:py-4 group/link hover:text-destructive transition-colors"
                      >
                        <span className="text-sm text-destructive/80 group-hover/link:text-destructive">Ликвидация</span>
                        <ChevronRight className="w-4 h-4 opacity-50 group-hover/link:opacity-100 transition-opacity text-destructive" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-6 md:mt-8">
            <Link href="/auctions" className="p-3 md:p-4 border border-border/50 bg-card hover:border-primary/50 transition-colors group">
              <div className="text-primary font-mono text-xs mb-1.5 md:mb-2">01</div>
              <div className="font-medium group-hover:text-primary transition-colors text-sm">Аукционы</div>
            </Link>

            {isCollector ? (
              <div className="p-3 md:p-4 border border-border/30 bg-muted/20 text-muted-foreground/40 cursor-not-allowed select-none">
                <div className="flex justify-between items-start mb-1.5 md:mb-2">
                  <div className="font-mono text-xs">02</div>
                  <Lock className="w-3 h-3" />
                </div>
                <div className="font-medium text-sm">Эксклюзивы</div>
              </div>
            ) : (
              <Link href="/exclusives" className="p-3 md:p-4 border border-border/50 bg-card hover:border-primary/50 transition-colors group">
                <div className="text-primary font-mono text-xs mb-1.5 md:mb-2">02</div>
                <div className="font-medium group-hover:text-primary transition-colors text-sm">Эксклюзивы</div>
              </Link>
            )}

            <Link href="/liquidation" className="p-3 md:p-4 border border-border/50 bg-card hover:border-destructive/40 transition-colors group">
              <div className="text-destructive font-mono text-xs mb-1.5 md:mb-2">03</div>
              <div className="font-medium group-hover:text-destructive transition-colors text-sm">Ликвидация</div>
            </Link>

            {/* Архив — в разработке */}
            <div className="p-3 md:p-4 border border-border/30 bg-muted/20 text-muted-foreground/40 cursor-not-allowed select-none" title="В разработке">
              <div className="flex justify-between items-start mb-1.5 md:mb-2">
                <div className="font-mono text-xs">04</div>
                <Lock className="w-3 h-3" />
              </div>
              <div className="font-medium text-sm">Архив</div>
            </div>
          </div>
        </section>
      )}

      {/* News — hidden for collectors */}
      {!isCollector && (
        <section className="px-4 md:px-8 pb-8 md:pb-12">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Новости клуба</h2>
            <Link href="/news" className="text-sm text-primary hover:underline">Все новости</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
            {newsList.map(news => (
              <Link key={news.id} href={`/news/${news.id}`} className="group flex flex-col gap-2 md:gap-3">
                <div className="w-full aspect-[4/3] overflow-hidden bg-muted">
                  <img
                    src={news.imageUrl}
                    alt={news.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5 md:mb-1">
                    {new Date(news.date).toLocaleDateString('ru-RU')}
                  </div>
                  <h3 className="font-serif font-medium leading-tight group-hover:text-primary transition-colors line-clamp-2 text-xs md:text-sm">
                    {news.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
