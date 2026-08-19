import React from 'react';
import { Link, useParams } from 'wouter';
import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { catalog, type ApiLot, type ApiTheme, type ApiGroup } from '../lib/api-client';
import { formatPrice } from '../lib/format';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardFooter } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

export default function CatalogGroup() {
  const { themeId, groupId } = useParams();
  
  // parse search params manually since wouter doesn't have useSearchParams
  const section = new URLSearchParams(window.location.search).get('section') || 'auction';

  const { data: theme } = useQuery<ApiTheme>({
    queryKey: ['catalog', 'theme', themeId],
    queryFn: () => catalog.theme(themeId!),
    enabled: !!themeId,
  });

  const { data: group } = useQuery<ApiGroup>({
    queryKey: ['catalog', 'group', groupId],
    queryFn: () => catalog.group(groupId!),
    enabled: !!groupId,
  });

  const { data: groupLots = [], isLoading } = useQuery<ApiLot[]>({
    queryKey: ['catalog', 'lots', { themeId, groupId, section }],
    queryFn: () => catalog.lots({ section, themeId, groupId }),
    enabled: !!themeId && !!groupId,
  });

  const sectionTitles: Record<string, string> = {
    'auction': 'Аукционы',
    'exclusive': 'Эксклюзивы',
    'liquidation': 'Ликвидация'
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!theme || !group) return <div className="p-8">Раздел не найден</div>;

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link href={`/catalog/${themeId}`} className="text-sm text-muted-foreground hover:text-primary mb-2 inline-block">
          ← К группе
        </Link>
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-serif font-semibold">{theme.name} / {group.name}</h1>
            <p className="text-muted-foreground mt-2 text-lg">{sectionTitles[section]}</p>
          </div>
          <div className="text-sm text-muted-foreground">
            Лотов: <span className="font-semibold text-foreground">{groupLots.length}</span>
          </div>
        </div>
      </div>

      {groupLots.length === 0 ? (
        <div className="py-20 text-center border rounded-xl bg-card">
          <p className="text-muted-foreground mb-4">В данном разделе пока нет активных лотов.</p>
          <Link href="/">
            <Button variant="outline">Вернуться на главную</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groupLots.map(lot => (
            <Card key={lot.id} className="overflow-hidden flex flex-col hover-elevate">
              <Link href={`/lots/${lot.id}`} className="relative h-64 overflow-hidden block group">
                <img 
                  src={lot.imageUrl} 
                  alt={lot.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <Badge className="absolute top-4 left-4" variant={lot.format === 'auction' ? 'default' : 'secondary'}>
                  {lot.format === 'auction' ? 'Аукцион' : 'Фикс. цена'}
                </Badge>
              </Link>
              <CardContent className="p-5 flex-1 flex flex-col">
                <Link href={`/lots/${lot.id}`} className="hover:text-primary transition-colors">
                  <h3 className="font-serif text-lg font-medium leading-tight mb-2 line-clamp-2">{lot.title}</h3>
                </Link>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
                  {lot.description}
                </p>
                <div className="flex items-center justify-between mt-auto">
                  {lot.format === 'auction' ? (
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Текущая ставка</div>
                      <div className="font-semibold text-primary">{formatPrice(lot.bidMax || lot.bidMin)}</div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Цена</div>
                      <div className="font-semibold">{formatPrice(lot.price)}</div>
                    </div>
                  )}
                  {lot.format === 'auction' && (
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground mb-1">Ставок</div>
                      <div className="font-semibold">{lot.bidsCount}</div>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="px-5 pb-5 pt-0">
                <Link href={`/lots/${lot.id}`} className="w-full">
                  <Button className="w-full" variant={lot.format === 'auction' ? 'default' : 'outline'}>
                    {lot.format === 'auction' ? 'Сделать ставку' : 'Купить'}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
