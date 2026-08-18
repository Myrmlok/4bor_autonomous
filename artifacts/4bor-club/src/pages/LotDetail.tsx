import React, { useState } from 'react';
import { Link, useParams, useLocation } from 'wouter';
import { lots, themes, groups } from '../data/mock';
import { formatPrice } from '../lib/format';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { useToast } from '../hooks/use-toast';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { ChevronLeft, Info, Gavel, ShoppingBag, Check, Lock } from 'lucide-react';

export default function LotDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { addItem, hasItem } = useCart();
  const { user } = useAuth();

  const lot = lots.find(l => l.id === id);
  // [STUB] bidValue tracks user's current bid input only in local state.
  // При подключении бэкенда: POST /api/lots/:id/bids
  const [bidValue, setBidValue] = useState<string>('');
  // [STUB] activeBid — текущая ставка хранится локально, не синхронизирована с сервером.
  const [activeBid, setActiveBid] = useState<number | null>(null);

  if (!lot) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground text-lg mb-4">Лот не найден.</p>
        <Button variant="outline" onClick={() => setLocation('/catalog')}>В каталог</Button>
      </div>
    );
  }

  const theme = themes.find(t => t.id === lot.themeId);
  const group = groups.find(g => g.id === lot.groupId);

  const currentPrice = activeBid ?? (lot.format === 'auction' ? (lot.bidMax || lot.bidMin || 0) : (lot.price || 0));
  const minNextBid = Math.ceil(currentPrice * 1.05); // шаг +5%

  const isCollector = user?.role === 'collector';
  const alreadyInCart = hasItem(lot.id);

  const handleBid = (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseInt(bidValue, 10);
    if (isNaN(value) || value < minNextBid) {
      toast({
        title: 'Ошибка ставки',
        description: `Минимальная ставка — ${formatPrice(minNextBid)}`,
        variant: 'destructive',
      });
      return;
    }
    // [STUB] Ставка применяется только локально.
    // При подключении бэкенда: POST /api/lots/:id/bids { amount: value }
    setActiveBid(value);
    setBidValue('');
    toast({
      title: 'Ставка принята',
      description: `Ваша ставка ${formatPrice(value)} успешно размещена.`,
    });
  };

  const handleAddToCart = () => {
    addItem(lot);
    toast({
      title: 'Добавлено в корзину',
      description: `${lot.title} — в корзину для оформления.`,
    });
  };

  const handleBuyNow = () => {
    addItem(lot);
    setLocation('/cart');
  };

  const SECTION_LABEL: Record<string, string> = {
    auction: 'Аукцион',
    exclusive: 'Эксклюзив',
    liquidation: 'Ликвидация',
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Back */}
      <button
        onClick={() => window.history.length > 1 ? window.history.back() : setLocation('/catalog')}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6 transition-colors"
      >
        <ChevronLeft className="w-4 h-4 mr-1" /> Вернуться назад
      </button>

      <div className="bg-card border overflow-hidden flex flex-col lg:flex-row">
        {/* Image */}
        <div className="w-full lg:w-3/5 bg-muted p-8 flex items-center justify-center relative min-h-[360px]">
          <div className="absolute top-4 left-4 flex gap-2">
            <Badge variant={lot.format === 'auction' ? 'default' : 'secondary'}>
              {lot.format === 'auction' ? 'Аукцион' : 'Фиксированная цена'}
            </Badge>
            {lot.sectionType !== 'auction' && (
              <Badge variant="outline">{SECTION_LABEL[lot.sectionType]}</Badge>
            )}
          </div>
          <img
            src={lot.imageUrl}
            alt={lot.title}
            className="w-full max-h-[500px] object-contain drop-shadow-2xl"
          />
        </div>

        {/* Info */}
        <div className="w-full lg:w-2/5 p-8 lg:p-10 flex flex-col border-l border-border/50">
          <div className="mb-2 text-xs font-bold tracking-widest text-muted-foreground uppercase">
            {theme?.name}{group ? ` / ${group.name}` : ''}
          </div>

          <h1 className="text-3xl font-serif font-semibold leading-tight mb-4 text-foreground">
            {lot.title}
          </h1>

          <p className="text-muted-foreground leading-relaxed mb-8 text-sm">{lot.description}</p>

          {/* Price / Bid block */}
          <div className="bg-background border border-border/50 p-6 mb-6">
            {lot.format === 'auction' ? (
              <>
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Текущая ставка</div>
                    <div className="text-3xl font-bold text-primary">{formatPrice(currentPrice)}</div>
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
                  <form onSubmit={handleBid} className="flex gap-3">
                    <Input
                      type="number"
                      placeholder={`от ${minNextBid}`}
                      value={bidValue}
                      onChange={e => setBidValue(e.target.value)}
                      className="flex-1 text-base h-11"
                      min={minNextBid}
                    />
                    <Button type="submit" className="px-8 h-11">
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
                <div className="mb-6">
                  <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Стоимость</div>
                  <div className="text-3xl font-bold">{formatPrice(lot.price)}</div>
                </div>
                <div className="flex gap-3">
                  <Button size="lg" className="flex-1 h-11" onClick={handleBuyNow}>
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Купить сейчас
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="px-6 h-11"
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
          <div className="mt-auto space-y-3 pt-6 border-t border-border/50 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Номер лота</span>
              <span className="font-mono">{lot.id.toUpperCase()}</span>
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
              <span className="text-green-600 font-medium">Активен</span>
            </div>
          </div>
        </div>
      </div>

      {/* Related lots */}
      {/* [STUB] Похожие лоты — отображаются из той же тематики */}
      <div className="mt-10">
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-5">Похожие лоты</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {lots.filter(l => l.themeId === lot.themeId && l.id !== lot.id).slice(0, 4).map(related => (
            <Link key={related.id} href={`/lots/${related.id}`} className="group border border-border/50 overflow-hidden hover:border-primary/40 transition-colors bg-card">
              <div className="h-32 overflow-hidden bg-muted">
                <img src={related.imageUrl} alt={related.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-3">
                <p className="text-xs font-medium line-clamp-2 mb-1 group-hover:text-primary transition-colors">{related.title}</p>
                <p className="text-xs text-primary font-semibold">{formatPrice(related.price || related.bidMax || related.bidMin)}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
