import React, { useState } from 'react';
import { Link } from 'wouter';
import { formatPrice } from '../lib/format';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { useToast } from '../hooks/use-toast';
import { useCart } from '../contexts/CartContext';
import { Trash2, ShoppingBag, AlertCircle } from 'lucide-react';

export default function Cart() {
  const { toast } = useToast();
  const { items, removeItem, clearCart } = useCart();
  const [checkedOut, setCheckedOut] = useState(false);

  const total = items.reduce((sum, item) => sum + (item.lot.price || 0), 0);

  const handleRemove = (lotId: string) => {
    removeItem(lotId);
    toast({ title: 'Лот удалён из корзины' });
  };

  const handleCheckout = () => {
    // [STUB] Оформление заказа: при подключении бэкенда → POST /api/orders { lotIds: [...] }
    toast({
      title: 'Заявка принята',
      description: 'Менеджер свяжется с вами в ближайшее время для уточнения деталей.',
    });
    clearCart();
    setCheckedOut(true);
  };

  if (checkedOut) {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <div className="py-16 md:py-20 text-center border border-border/50 bg-card">
          <div className="w-14 h-14 md:w-16 md:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-5 md:mb-6">
            <ShoppingBag className="w-7 h-7 md:w-8 md:h-8 text-primary" />
          </div>
          <h2 className="text-xl md:text-2xl font-serif font-semibold mb-3">Заявка оформлена</h2>
          <p className="text-muted-foreground mb-6 md:mb-8 max-w-sm mx-auto px-4 text-sm">
            Наш менеджер свяжется с вами в течение рабочего дня для уточнения условий доставки и оплаты.
          </p>
          <Link href="/catalog">
            <Button variant="outline">Продолжить покупки</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-serif font-semibold">Корзина</h1>
        {items.length > 0 && (
          <span className="text-sm text-muted-foreground">
            {items.length} {items.length === 1 ? 'лот' : 'лота'}
          </span>
        )}
      </div>

      {/* [STUB] Уведомление о заглушке оплаты */}
      {items.length > 0 && (
        <div className="flex items-start gap-3 border border-amber-300/40 bg-amber-50/50 px-4 py-3 mb-5 md:mb-6 text-sm text-amber-800">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
          <span>Оплата через платформу пока недоступна — менеджер свяжется с вами после оформления заявки.</span>
        </div>
      )}

      {items.length === 0 ? (
        <div className="py-16 md:py-20 text-center border border-border/50 bg-card">
          <ShoppingBag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground mb-6">Ваша корзина пуста.</p>
          <Link href="/catalog">
            <Button variant="outline">Перейти в каталог</Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Items list */}
          <div className="space-y-3 md:space-y-4">
            {items.map(({ lot }) => (
              <Card key={lot.id} className="overflow-hidden flex border-border/50">
                <Link href={`/lots/${lot.id}`} className="w-20 h-20 sm:w-28 sm:h-24 md:w-32 md:h-28 flex-shrink-0 bg-muted block">
                  <img src={lot.imageUrl} alt={lot.title} className="w-full h-full object-cover hover:opacity-90 transition-opacity" />
                </Link>
                <CardContent className="p-3 md:p-4 flex-1 flex flex-col justify-between min-w-0">
                  <div className="flex justify-between items-start gap-2 md:gap-4">
                    <div className="min-w-0">
                      <Link href={`/lots/${lot.id}`} className="hover:text-primary transition-colors">
                        <h3 className="font-serif font-medium leading-tight mb-1 text-sm md:text-base line-clamp-2">{lot.title}</h3>
                      </Link>
                      <div className="text-xs text-muted-foreground hidden sm:block">
                        Лот #{lot.id.toUpperCase()} · {lot.format === 'fixed' ? 'Фикс. цена' : 'Аукцион'}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemove(lot.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1 shrink-0"
                      title="Удалить"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="font-semibold text-base md:text-lg mt-2">{formatPrice(lot.price || lot.bidMax)}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order summary — full width on mobile */}
          <div className="w-full lg:self-start lg:w-80 lg:sticky lg:top-24">
            <Card className="p-5 md:p-6 border-border/50">
              <h2 className="font-serif text-lg md:text-xl font-medium mb-4 border-b border-border/50 pb-4">Ваш заказ</h2>
              <div className="space-y-3 mb-5 md:mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Товары ({items.length})</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Доставка</span>
                  <span className="text-muted-foreground">Уточняется</span>
                </div>
              </div>
              <div className="flex justify-between items-center mb-5 md:mb-6 pt-4 border-t border-border/50">
                <span className="font-medium">Итого</span>
                <span className="text-lg md:text-xl font-bold text-primary">{formatPrice(total)}</span>
              </div>
              <Button className="w-full" size="lg" onClick={handleCheckout}>
                Оформить заявку
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-3 leading-relaxed">
                После отправки заявки менеджер свяжется с вами для уточнения деталей.
              </p>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
