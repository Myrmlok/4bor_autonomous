import React, { useState } from 'react';
import { AdminLayout } from './AdminDashboard';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { lots as initialLots } from '../../data/mock';
import { formatPrice } from '../../lib/format';
import { useToast } from '../../hooks/use-toast';
import { Trash2, ExternalLink, Plus } from 'lucide-react';
import { Link } from 'wouter';

export default function AdminLots() {
  const { toast } = useToast();
  const [lotsList, setLotsList] = useState(initialLots);

  const handleDelete = (id: string) => {
    if (!confirm('Удалить лот? Действие нельзя отменить.')) return;
    // [STUB] Удаление — только в локальном стейте. При подключении бэкенда: DELETE /api/admin/lots/:id
    setLotsList(prev => prev.filter(l => l.id !== id));
    toast({ title: 'Лот удалён', variant: 'destructive' });
  };

  const SECTION_RU: Record<string, string> = {
    auction: 'Аукционы',
    exclusive: 'Эксклюзивы',
    liquidation: 'Ликвидация',
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-serif font-semibold mb-2">Управление лотами</h1>
          <p className="text-muted-foreground text-sm">Всего лотов: {lotsList.length}</p>
        </div>
        {/* [STUB] Кнопка создания лота — форма добавления лота не реализована. При подключении бэкенда: POST /api/admin/lots */}
        <Button onClick={() => toast({ title: 'В разработке', description: 'Форма создания лота появится после подключения бэкенда.' })}>
          <Plus className="w-4 h-4 mr-2" />
          Добавить лот
        </Button>
      </div>

      {lotsList.length === 0 ? (
        <div className="py-20 text-center border border-border/50 bg-card">
          <p className="text-muted-foreground">Нет лотов. Добавьте первый лот через форму.</p>
        </div>
      ) : (
        <Card className="overflow-hidden border-border/50">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                <tr>
                  <th className="px-6 py-4 font-medium">ID</th>
                  <th className="px-6 py-4 font-medium">Название</th>
                  <th className="px-6 py-4 font-medium">Раздел</th>
                  <th className="px-6 py-4 font-medium">Формат</th>
                  <th className="px-6 py-4 font-medium">Цена / Ставка</th>
                  <th className="px-6 py-4 font-medium text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {lotsList.map(l => (
                  <tr key={l.id} className="hover:bg-muted/10">
                    <td className="px-6 py-4 font-mono text-muted-foreground text-xs">#{l.id.toUpperCase()}</td>
                    <td className="px-6 py-4 font-medium max-w-[200px] truncate">
                      <Link href={`/lots/${l.id}`} className="hover:text-primary transition-colors inline-flex items-center gap-1">
                        {l.title}
                        <ExternalLink className="w-3 h-3 opacity-40" />
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs">{SECTION_RU[l.sectionType]}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                        l.format === 'auction' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                      }`}>
                        {l.format === 'auction' ? 'Аукцион' : 'Фикс.'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium">{formatPrice(l.price || l.bidMax || l.bidMin)}</td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(l.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        title="Удалить"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </AdminLayout>
  );
}
