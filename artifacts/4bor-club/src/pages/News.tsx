import React from 'react';
import { Link } from 'wouter';
import { newsList } from '../data/mock';
import { Lock, Calendar } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';

export default function News() {
  const { user } = useAuth();

  if (user?.role === 'collector') {
    return (
      <div className="p-4 flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center mx-auto mb-5">
            <Lock className="w-7 h-7 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-serif font-semibold mb-4">Раздел новостей закрыт</h1>
          <p className="text-muted-foreground mb-8">
            Новости клуба доступны только для дилеров.
          </p>
          <Link href="/"><Button variant="outline">На главную</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-serif font-semibold mb-1.5 md:mb-2">Новости клуба</h1>
      <p className="text-muted-foreground mb-6 md:mb-8 text-sm">Актуальная информация для участников</p>

      <div className="space-y-4 md:space-y-6">
        {newsList.map(news => (
          <Link key={news.id} href={`/news/${news.id}`} className="group block border border-border/50 bg-card overflow-hidden hover:border-primary/40 transition-colors">
            <div className="flex flex-col sm:flex-row">
              <div className="w-full sm:w-48 md:w-72 h-44 sm:h-auto flex-shrink-0 overflow-hidden bg-muted">
                <img
                  src={news.imageUrl}
                  alt={news.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-4 md:p-6 flex flex-col justify-center">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2 md:mb-3 font-mono">
                  <Calendar className="w-3 h-3" />
                  {new Date(news.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
                <h2 className="text-lg md:text-xl font-serif font-semibold mb-2 md:mb-3 leading-tight group-hover:text-primary transition-colors">
                  {news.title}
                </h2>
                <p className="text-muted-foreground text-sm line-clamp-2 mb-3 md:mb-4">
                  Подробная информация о событии доступна для участников клуба. Нажмите для полного прочтения.
                </p>
                <span className="text-sm text-primary font-medium">Читать полностью →</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
