import React from 'react';
import { Link } from 'wouter';
import { newsList } from '../data/mock';
import { Lock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/card';

export default function News() {
  const { user } = useAuth();
  
  if (user?.role === 'collector') {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-serif font-semibold mb-4">Раздел новостей закрыт</h1>
          <p className="text-muted-foreground mb-8">
            Новости клуба доступны только для дилеров.
          </p>
          <Link href="/">
            <Button variant="outline">На главную</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-serif font-semibold mb-8">Новости клуба</h1>
      
      <div className="space-y-8">
        {newsList.map(news => (
          <Card key={news.id} className="overflow-hidden hover-elevate">
            <div className="flex flex-col md:flex-row">
              <div className="w-full md:w-1/3 aspect-video md:aspect-auto">
                <img 
                  src={news.imageUrl} 
                  alt={news.title} 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div className="p-6 md:w-2/3 flex flex-col justify-center">
                <div className="text-sm text-primary mb-2 font-mono">
                  {new Date(news.date).toLocaleDateString('ru-RU')}
                </div>
                <h2 className="text-xl font-serif font-semibold mb-4 leading-tight">
                  {news.title}
                </h2>
                <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                  Подробная информация о данном событии доступна для участников клуба.
                  Это краткий анонс из внутренней рассылки.
                </p>
                <div>
                  <Button variant="link" className="p-0 h-auto text-primary">
                    Читать полностью →
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
