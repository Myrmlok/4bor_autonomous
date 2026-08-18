import React, { useState } from 'react';
import { Link, useParams } from 'wouter';
import { lots, themes, groups } from '../data/mock';
import { formatPrice } from '../lib/format';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { useToast } from '../hooks/use-toast';
import { ChevronLeft, Info, Gavel, ShoppingBag } from 'lucide-react';

export default function LotDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  
  const lot = lots.find(l => l.id === id);
  const [bidValue, setBidValue] = useState<string>('');
  
  if (!lot) return <div className="p-8">Лот не найден</div>;
  
  const theme = themes.find(t => t.id === lot.themeId);
  const group = groups.find(g => g.id === lot.groupId);
  
  const currentPrice = lot.format === 'auction' ? (lot.bidMax || lot.bidMin || 0) : (lot.price || 0);
  const minNextBid = currentPrice + (currentPrice * 0.05); // +5% mock step
  
  const handleBid = (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(bidValue);
    if (isNaN(value) || value < minNextBid) {
      toast({
        title: "Ошибка ставки",
        description: `Ставка должна быть не менее ${formatPrice(minNextBid)}`,
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Ставка принята",
      description: `Ваша ставка ${formatPrice(value)} успешно размещена.`
    });
    setBidValue('');
  };
  
  const handleBuy = () => {
    toast({
      title: "Лот добавлен в корзину",
      description: `${lot.title} добавлен в вашу корзину для оформления.`
    });
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <Link href="#" onClick={() => window.history.back()} className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6">
        <ChevronLeft className="w-4 h-4 mr-1" /> Вернуться назад
      </Link>
      
      <div className="bg-card border rounded-xl overflow-hidden flex flex-col lg:flex-row">
        {/* Image Section */}
        <div className="w-full lg:w-3/5 bg-muted p-8 flex items-center justify-center relative">
          <Badge className="absolute top-4 left-4" variant={lot.format === 'auction' ? 'default' : 'secondary'}>
            {lot.format === 'auction' ? 'Аукцион' : 'Фиксированная цена'}
          </Badge>
          <img 
            src={lot.imageUrl} 
            alt={lot.title} 
            className="w-full max-h-[600px] object-contain drop-shadow-2xl" 
          />
        </div>
        
        {/* Info Section */}
        <div className="w-full lg:w-2/5 p-8 lg:p-10 flex flex-col border-l">
          <div className="mb-2 text-xs font-bold tracking-widest text-muted-foreground uppercase">
            {theme?.name} / {group?.name}
          </div>
          
          <h1 className="text-3xl font-serif font-semibold leading-tight mb-4 text-foreground">
            {lot.title}
          </h1>
          
          <p className="text-muted-foreground leading-relaxed mb-8">
            {lot.description}
          </p>
          
          <div className="bg-background border rounded-lg p-6 mb-8">
            {lot.format === 'auction' ? (
              <>
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Текущая ставка</div>
                    <div className="text-3xl font-bold text-primary">{formatPrice(currentPrice)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground mb-1">Ставок</div>
                    <div className="text-xl font-semibold">{lot.bidsCount}</div>
                  </div>
                </div>
                
                <form onSubmit={handleBid} className="flex gap-3">
                  <Input 
                    type="number" 
                    placeholder={`от ${formatPrice(minNextBid).replace(' ₽', '')}`}
                    value={bidValue}
                    onChange={(e) => setBidValue(e.target.value)}
                    className="flex-1 text-lg py-6"
                  />
                  <Button type="submit" size="lg" className="px-8">
                    <Gavel className="w-4 h-4 mr-2" />
                    Ставка
                  </Button>
                </form>
                <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
                  <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <p>Шаг аукциона рассчитывается автоматически. Ставки отменить нельзя.</p>
                </div>
              </>
            ) : (
              <>
                <div className="mb-6">
                  <div className="text-sm text-muted-foreground mb-1">Стоимость</div>
                  <div className="text-3xl font-bold">{formatPrice(lot.price)}</div>
                </div>
                <div className="flex gap-3">
                  <Button size="lg" className="flex-1" onClick={handleBuy}>
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Купить сейчас
                  </Button>
                  <Button size="lg" variant="outline" className="px-8" onClick={handleBuy}>
                    В корзину
                  </Button>
                </div>
              </>
            )}
          </div>
          
          <div className="mt-auto space-y-4 pt-6 border-t text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Номер лота</span>
              <span className="font-mono">{lot.id.toUpperCase()}</span>
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
    </div>
  );
}
