import React, { useState } from 'react';
import { Link } from 'wouter';
import { lots, themes } from '../data/mock';
import { formatPrice } from '../lib/format';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardFooter } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

export default function Auctions() {
  const [activeTheme, setActiveTheme] = useState<string>('all');
  
  const auctionLots = lots.filter(l => l.sectionType === 'auction');
  const filteredLots = activeTheme === 'all' ? auctionLots : auctionLots.filter(l => l.themeId === activeTheme);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-semibold mb-2">Аукционы</h1>
        <p className="text-muted-foreground">Открытые торги от находчиков и коллекционеров</p>
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
                <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground">
                  Аукцион
                </Badge>
              </Link>
              <CardContent className="p-4 flex-1 flex flex-col">
                <Link href={`/lots/${lot.id}`} className="hover:text-primary transition-colors">
                  <h3 className="font-serif text-base font-medium leading-tight mb-2 line-clamp-2">{lot.title}</h3>
                </Link>
                <div className="flex items-center justify-between mt-auto pt-2 border-t">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Ставка</div>
                    <div className="font-semibold text-primary">{formatPrice(lot.bidMax || lot.bidMin)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Ставок</div>
                    <div className="font-semibold">{lot.bidsCount}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
