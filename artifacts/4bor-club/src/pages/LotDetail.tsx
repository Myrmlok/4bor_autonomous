import React, { useState } from 'react';
import { Link, useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { catalog, type ApiLot, type ApiTheme, type ApiGroup } from '../lib/api-client';
import { formatPrice } from '../lib/format';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { useToast } from '../hooks/use-toast';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { ChevronLeft, Info, Gavel, ShoppingBag, Check, Lock, Loader2 } from 'lucide-react';

export default function LotDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { addItem, isInCart } = useCart();
  const hasItem = isInCart;
  const { user } = useAuth();

  const { data: lot, isLoading, isError } = useQuery<ApiLot>({
    queryKey: ['catalog', 'lot', id],
    queryFn: () => catalog.lot(id!),
    enabled: !!id,
  });

  const { data: relatedLots = [] } = useQuery<ApiLot[]>({
    queryKey: ['catalog', 'lots', { themeId: lot?.themeId }],
    queryFn: () => catalog.lots({ themeId: lot!.themeId }),
    enabled: !!lot?.themeId,
  });

  const { data: theme } = useQuery<ApiTheme>({
    queryKey: ['catalog', 'theme', lot?.themeId],
    queryFn: () => catalog.theme(lot!.themeId),
    enabled: !!lot?.themeId,
  });

  const { data: group } = useQuery<ApiGroup>({
    queryKey: ['catalog', 'group', lot?.groupId],
    queryFn: () => catalog.group(lot!.groupId),
    enabled: !!lot?.groupId,
  });

  // [STUB] bidValue tracks user's current bid input only in local state.
  // При подключении бэкенда (Task 11): POST /api/lots/:id/bids
  const [bidValue, setBidValue] = useState<string>('');
  const [activeBid, setActiveBid] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !lot) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground text-lg mb-4">Лот не найден.</p>
        <Button variant="outline" onClick={() => setLocation('/catalog')}>В каталог</Button>
      </div>
    );
  }

  const currentPrice = activeBid ?? (lot.format === 'auction' ? (lot.bidMax || lot.bidMin || 0) : (lot.price || 0));
  const minNextBid = Math.ceil(currentPrice * 1.05);

  const isCollector = user?.role === 'collector';
  const alreadyInCart = hasItem(lot.id);

  const handleBid = (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseInt(bidValue, 10);
    if (isNaN(value) || value < minNextBid) {
      toast({ title: 'Ошибка ставки', description: `Минимальная ставка — ${formatPrice(minNextBid)}`, variant: 'destructive' });
      return;
    }
    // [STUB] Ставка применяется только локально.
    // Task 11: POST /api/lots/:id/bids { amount: value }
    setActiveBid(value);
    setBidValue('');
    toast({ title: 'Ставка принята', description: `Ваша ставка ${formatPrice(value)} успешно размещена.` });
  };

  const handleAddToCart = () => {
    addItem(lot);
    toast({ title: 'Добавлено в корзину', description: `${lot.title} — в корзину для оформления.` });
  };

  const handleBuyNow = () => { addItem(lot); setLocation('/cart'); };

  const SECTION_LABEL: Record<string, string> = {
    auction:    'Аукцион',
    exclusive:  'Эксклюзив',
    liquidation:'Ликвидация',
  };

  const otherLots = relatedLots.filter(l => l.id !== lot.id).slice(0, 4);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      {/* Back */}
      <button
        onClick={() => window.history.length > 1 ? window.history.back() : setLocation('/catalog')}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-5 transition-colors"
      >
        <ChevronLeft className="w-4 h-4 mr-1" /> Вернуться назад
      </button>

      <div className="bg-card border overflow-hidden flex flex-col lg:flex-row">
        {/* Image */}
        <div className="w-full lg:w-3/5 bg-muted p-4 md:p-8 flex items-center justify-center relative min-h-[220px] md:min-h-[360px]">
          <div className="absolute top-3 left-3 md:top-4 md:left-4 flex gap-2">
            <Badge variant={lot.format === 'auction' ? 'default' : 'secondary'}>
              {lot.format === 'auction' ? 'Аукцион' : 'Фикс. цена'}
            </Badge>
            {lot.sectionType !== 'auction' && (
              <Badge variant="outline">{SECTION_LABEL[lot.sectionType]}</Badge>
            )}
          </div>
          <img
            src={lot.imageUrl}
            alt={lot.title}
            className="w-full max-h-[280px] md:max-h-[500px] object-contain drop-shadow-2xl"
          />
        </div>

        {/* Info */}
        <div className="w-full lg:w-2/5 p-5 md:p-8 lg:p-10 flex flex-col border-t lg:border-t-0 lg:border-l border-border/50">
          <div className="mb-2 text-xs font-bold tracking-widest text-muted-foreground uppercase">
            {theme?.name}{group ? ` / ${group.name}` : ''}
          </div>

          <h1 className="text-2xl md:text-3xl font-serif font-semibold leading-tight mb-3 md:mb-4 text-foreground">
            {lot.title}
          </h1>

          <p className="text-muted-foreground leading-relaxed mb-6 md:mb-8 text-sm">{lot.description}</p>

          {/* Price / Bid block */}
          <div className="bg-background border border-border/50 p-4 md:p-6 mb-5 md:mb-6">
            {lot.format === 'auction' ? (
              <>
                <div className="flex justify-between items-end mb-5">
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Текущая ставка</div>
                    <div className="text-2xl md:text-3xl font-bold text-primary">{formatPrice(currentPrice)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Ставок</div>
                    <div className="text-xl font-semibold">{lot.bidsCount + (activeBid ? 1 : 0)}</div>
                  </div>
                </div>

                {isCollector ? (
                  <div className="flex items-center gap-2 border border-border/50 px-4 py-3 text-sm text-muted-foreground">
                    <Lock className="w-4 h-4 shrink-0" />
                    Коллекционеры не могут делать ставки в этом разделе.
                  </div>
                ) : (
                  <form onSubmit={handleBid} className="flex gap-2 md:gap-3">
                    <Input
                      type="number"
                      placeholder={`от ${minNextBid}`}
                      value={bidValue}
                      onChange={e => setBidValue(e.target.value)}
                      className="flex-1 text-base h-11"
                      min={minNextBid}
                    />
                    <Button type="submit" className="px-4 md:px-8 h-11 shrink-0">
                      <Gavel className="w-4 h-4 mr-2" />
                      Ставка
                    </Button>
                  </form>
                )}

                <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
                  <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>Шаг аукциона +5% от текущей ставки. Ставки отменить нельзя.</span>
                </div>
              </>
            ) : (
              <>
                <div className="mb-5">
                  <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Стоимость</div>
                  <div className="text-2xl md:text-3xl font-bold">{formatPrice(lot.price)}</div>
                </div>
                <div className="flex gap-2 md:gap-3">
                  <Button size="lg" className="flex-1 h-11" onClick={handleBuyNow}>
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Купить сейчас
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="px-4 md:px-6 h-11 shrink-0"
                    onClick={handleAddToCart}
                    disabled={alreadyInCart}
                  >
                    {alreadyInCart ? <Check className="w-4 h-4" /> : 'В корзину'}
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Lot metadata */}
          <div className="mt-auto space-y-3 pt-5 border-t border-border/50 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Номер лота</span>
              <span className="font-mono text-xs">{lot.id.toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Раздел</span>
              <span>{SECTION_LABEL[lot.sectionType]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Дата размещения</span>
              <span>{new Date(lot.createdAt).toLocaleDateString('ru-RU')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Статус</span>
              <span className={lot.status === 'active' ? 'text-green-600 font-medium' : 'text-muted-foreground'}>
                {lot.status === 'active' ? 'Активен' : 'Продан'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Related lots */}
      {otherLots.length > 0 && (
        <div className="mt-8 md:mt-10">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4 md:mb-5">Похожие лоты</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {otherLots.map(related => (
              <Link key={related.id} href={`/lots/${related.id}`} className="group border border-border/50 overflow-hidden hover:border-primary/40 transition-colors bg-card">
                <div className="h-24 md:h-32 overflow-hidden bg-muted">
                  <img src={related.imageUrl} alt={related.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-2.5 md:p-3">
                  <p className="text-xs font-medium line-clamp-2 mb-1 group-hover:text-primary transition-colors">{related.title}</p>
                  <p className="text-xs text-primary font-semibold">{formatPrice(related.price || related.bidMax || related.bidMin)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
