import React, { useState } from 'react';
import { Link } from 'wouter';
import { lots } from '../data/mock';
import { formatPrice } from '../lib/format';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { useToast } from '../hooks/use-toast';
import { Trash2 } from 'lucide-react';

export default function Cart() {
  const { toast } = useToast();
  // Mock cart items based on fixed-price lots
  const [cartItems, setCartItems] = useState(
    lots.filter(l => l.format === 'fixed').slice(0, 2)
  );

  const total = cartItems.reduce((sum, item) => sum + (item.price || 0), 0);

  const handleRemove = (id: string) => {
    setCartItems(cartItems.filter(item => item.id !== id));
    toast({ title: "Лот удален из корзины" });
  };

  const handleCheckout = () => {
    toast({ 
      title: "Заказ оформлен", 
      description: "Наш менеджер свяжется с вами в ближайшее время." 
    });
    setCartItems([]);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-serif font-semibold mb-8">Корзина</h1>
      
      {cartItems.length === 0 ? (
        <div className="py-20 text-center border rounded-xl bg-card">
          <p className="text-muted-foreground mb-4">Ваша корзина пуста.</p>
          <Link href="/catalog">
            <Button variant="outline">Перейти в каталог</Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-4">
            {cartItems.map(item => (
              <Card key={item.id} className="overflow-hidden flex">
                <div className="w-32 h-32 flex-shrink-0 bg-muted">
                  <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                </div>
                <CardContent className="p-4 flex-1 flex flex-col justify-between">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <Link href={`/lots/${item.id}`} className="hover:text-primary transition-colors">
                        <h3 className="font-serif font-medium line-clamp-2">{item.title}</h3>
                      </Link>
                      <div className="text-xs text-muted-foreground mt-1">Лот #{item.id.toUpperCase()}</div>
                    </div>
                    <button 
                      onClick={() => handleRemove(item.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1"
                      title="Удалить"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="font-semibold text-lg">{formatPrice(item.price)}</div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="w-full lg:w-80">
            <Card className="p-6 sticky top-24">
              <h2 className="font-serif text-xl font-medium mb-4 border-b pb-4">Ваш заказ</h2>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Товары ({cartItems.length})</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Доставка</span>
                  <span>Уточняется</span>
                </div>
              </div>
              <div className="flex justify-between items-center mb-6 pt-4 border-t">
                <span className="font-medium">Итого</span>
                <span className="text-xl font-bold text-primary">{formatPrice(total)}</span>
              </div>
              <Button className="w-full" size="lg" onClick={handleCheckout}>
                Оформить заказ
              </Button>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
