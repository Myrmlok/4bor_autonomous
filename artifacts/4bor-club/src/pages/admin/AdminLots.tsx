import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { AdminLayout } from './AdminDashboard';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { formatPrice } from '../../lib/format';
import { useToast } from '../../hooks/use-toast';
import { ExternalLink, Plus, Search } from 'lucide-react';
import { catalog, type ApiLot } from '../../lib/api-client';

const SECTION_RU: Record<string, string> = {
  auction:     'Аукцион',
  exclusive:   'Эксклюзив',
  liquidation: 'Ликвидация',
};
const FORMAT_RU: Record<string, string> = {
  fixed:   'Фиксированная цена',
  auction: 'Аукцион',
};
const STATUS_CLS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  sold:   'bg-gray-100 text-gray-500',
};

export default function AdminLots() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [section, setSection] = useState('all');

  const { data: lots = [], isLoading } = useQuery({
    queryKey: ['lots'],
    queryFn:  () => catalog.lots(),
    staleTime: 60_000,
  });

  const filtered = lots.filter(l => {
    const matchSection = section === 'all' || l.sectionType === section;
    const matchSearch  = !search.trim() || l.title.toLowerCase().includes(search.toLowerCase());
    return matchSection && matchSearch;
  });

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-semibold mb-1">Управление лотами</h1>
          <p className="text-muted-foreground text-sm">Всего лотов: {lots.length}</p>
        </div>
        <Button
          onClick={() => toast({
            title: 'Скоро',
            description: 'Форма добавления лота появится в следующей версии.',
          })}
        >
          <Plus className="w-4 h-4 mr-2" />
          Добавить лот
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Section tabs */}
        <div className="flex gap-2 flex-wrap">
          {['all', 'auction', 'exclusive', 'liquidation'].map(s => (
            <Button
              key={s}
              variant={section === s ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSection(s)}
            >
              {s === 'all' ? 'Все' : SECTION_RU[s]}
            </Button>
          ))}
        </div>
        {/* Search */}
        <div className="relative flex-1 min-w-0 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по названию..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-border bg-card focus:outline-none focus:border-primary/60 transition-colors h-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Загрузка...</div>
      ) : (
        <Card className="overflow-hidden border-border/50">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                <tr>
                  <th className="px-4 py-3 font-medium">Лот</th>
                  <th className="px-4 py-3 font-medium">Раздел</th>
                  <th className="px-4 py-3 font-medium">Формат</th>
                  <th className="px-4 py-3 font-medium">Цена</th>
                  <th className="px-4 py-3 font-medium">Статус</th>
                  <th className="px-4 py-3 font-medium text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(lot => (
                  <tr key={lot.id} className="hover:bg-muted/10">
                    <td className="px-4 py-3">
                      <div className="font-medium line-clamp-1 max-w-[200px]">{lot.title}</div>
                      <div className="text-[11px] text-muted-foreground font-mono">#{lot.id}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{SECTION_RU[lot.sectionType]}</td>
                    <td className="px-4 py-3 text-muted-foreground">{FORMAT_RU[lot.format]}</td>
                    <td className="px-4 py-3 font-medium">
                      {lot.format === 'auction'
                        ? `${(lot.bidMin ?? 0).toLocaleString('ru-RU')} — ${(lot.bidMax ?? 0).toLocaleString('ru-RU')} ₽`
                        : `${(lot.price ?? 0).toLocaleString('ru-RU')} ₽`}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-0.5 font-bold uppercase ${STATUS_CLS[lot.status] ?? ''}`}>
                        {lot.status === 'active' ? 'Активен' : 'Продан'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/lots/${lot.id}`}>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
                      {search ? `По запросу «${search}» лотов не найдено` : 'Лотов нет'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </AdminLayout>
  );
}
