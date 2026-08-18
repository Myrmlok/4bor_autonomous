import React, { useState } from 'react';
import { Link } from 'wouter';
import { Lock } from 'lucide-react';
import { lots, themes } from '../data/mock';
import { formatPrice } from '../lib/format';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../contexts/AuthContext';

export default function Exclusives() {
  const { user } = useAuth();
  const [activeTheme, setActiveTheme] = useState<string>('all');
  
  if (user?.role === 'collector') {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-serif font-semibold mb-4">Раздел недоступен</h1>
          <p className="text-muted-foreground mb-8">
            Эксклюзивы от дилеров доступны только участникам клуба со статусом "Дилер". Для повышения статуса обратитесь к администрации.
          </p>
          <Link href="/">
            <Button variant="outline">Вернуться на главную</Button>
          </Link>
        </div>
      </div>
    );
  }

  const exclusiveLots = lots.filter(l => l.sectionType === 'exclusive');
  const filteredLots = activeTheme === 'all' ? exclusiveLots : exclusiveLots.filter(l => l.themeId === activeTheme);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-semibold mb-2">Эксклюзивы от дилеров</h1>
        <p className="text-muted-foreground">Закрытый раздел с лотами по фиксированной цене</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
        <Button 
          variant={activeTheme === 'all' ? 'default' : 'outline'} 
          onClick={() => setActiveTheme('all')}
          size="sm"
          className="rounded-full"
        >
          Все тематики
        </Button>
        {themes.map(theme => (
          <Button
            key={theme.id}
            variant={activeTheme === theme.id ? 'default' : 'outline'}
            onClick={() => setActiveTheme(theme.id)}
            size="sm"
            className="rounded-full whitespace-nowrap"
          >
            {theme.name}
          </Button>
        ))}
      </div>

      {filteredLots.length === 0 ? (
        <div className="py-20 text-center border rounded-xl bg-card">
          <p className="text-muted-foreground mb-4">В данном разделе пока нет активных лотов.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredLots.map(lot => (
            <Card key={lot.id} className="overflow-hidden flex flex-col hover-elevate">
              <Link href={`/lots/${lot.id}`} className="relative h-48 overflow-hidden block group">
                <img 
                  src={lot.imageUrl} 
                  alt={lot.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <Badge className="absolute top-3 left-3" variant="secondary">
                  Фикс. цена
                </Badge>
              </Link>
              <CardContent className="p-4 flex-1 flex flex-col">
                <Link href={`/lots/${lot.id}`} className="hover:text-primary transition-colors">
                  <h3 className="font-serif text-base font-medium leading-tight mb-2 line-clamp-2">{lot.title}</h3>
                </Link>
                <div className="mt-auto pt-2 border-t">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Цена</div>
                  <div className="font-semibold">{formatPrice(lot.price)}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
