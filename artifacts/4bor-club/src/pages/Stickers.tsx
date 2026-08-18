import React, { useState } from 'react';
import { stickers as initialStickers, themes } from '../data/mock';
import { formatPrice } from '../lib/format';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/use-toast';
import { Plus } from 'lucide-react';

export default function Stickers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stickersList, setStickersList] = useState(initialStickers);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [budget, setBudget] = useState('');
  
  const canAddSticker = user?.role === 'dealer' || user?.role === 'admin';

  const handleAddSticker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text || !budget) return;

    const newSticker = {
      id: `s${Date.now()}`,
      userId: user?.id || 1,
      text,
      budget: parseFloat(budget),
      imageUrl: themes[Math.floor(Math.random() * themes.length)].imageUrl, // mock random image
      createdAt: new Date().toISOString()
    };

    setStickersList([newSticker, ...stickersList]);
    setOpen(false);
    setText('');
    setBudget('');
    
    toast({
      title: "Стикер размещен",
      description: "Ваш запрос успешно опубликован на доске."
    });
  };

  const handleDelete = (id: string) => {
    setStickersList(stickersList.filter(s => s.id !== id));
    toast({
      title: "Стикер удален"
    });
  };

  return (
    <div className="p-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-serif font-semibold mb-2">Стикеры</h1>
          <p className="text-muted-foreground">Запросы на покупку и поиск монет от участников клуба</p>
        </div>
        
        {canAddSticker && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Разместить стикер
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Новый стикер</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddSticker} className="space-y-4 pt-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Текст запроса</label>
                  <Input 
                    placeholder="Например: Куплю чешую Михаила Федоровича..."
                    value={text}
                    onChange={e => setText(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Бюджет (₽)</label>
                  <Input 
                    type="number"
                    placeholder="5000"
                    value={budget}
                    onChange={e => setBudget(e.target.value)}
                    required
                  />
                </div>
                <DialogFooter className="mt-6">
                  <Button type="submit">Опубликовать</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {stickersList.map(sticker => (
          <Card key={sticker.id} className="overflow-hidden hover-elevate group relative">
            {user && sticker.userId === user.id && (
              <button 
                onClick={() => handleDelete(sticker.id)}
                className="absolute top-2 right-2 z-10 w-6 h-6 bg-destructive/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-destructive text-xs"
                title="Удалить"
              >
                ×
              </button>
            )}
            <div className="aspect-square w-full overflow-hidden bg-muted">
              <img 
                src={sticker.imageUrl} 
                alt="Sticker" 
                className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500" 
              />
            </div>
            <CardContent className="p-4 flex flex-col h-40">
              <p className="text-sm font-medium leading-snug line-clamp-3 mb-2 flex-1">
                {sticker.text}
              </p>
              <div className="mt-auto">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Бюджет</div>
                <div className="font-semibold text-primary mb-3">от {formatPrice(sticker.budget)}</div>
                <Button variant="outline" size="sm" className="w-full text-xs uppercase tracking-widest h-8" onClick={() => toast({ title: "Предложение отправлено" })}>
                  Предложить
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
