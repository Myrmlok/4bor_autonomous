import React, { useState } from 'react';
import { stickers as initialStickers, themes } from '../data/mock';
import { formatPrice } from '../lib/format';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/use-toast';
import { Plus, MessageSquare, X } from 'lucide-react';

export default function Stickers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stickersList, setStickersList] = useState(initialStickers);

  // Create sticker dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [text, setText] = useState('');
  const [budget, setBudget] = useState('');

  // Offer dialog
  const [offerStickerId, setOfferStickerId] = useState<string | null>(null);
  const [offerText, setOfferText] = useState('');
  const [offerPrice, setOfferPrice] = useState('');

  const canAddSticker = user?.role === 'dealer' || user?.role === 'admin';
  const offerSticker = stickersList.find(s => s.id === offerStickerId);

  const handleAddSticker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text || !budget) return;
    const newSticker = {
      id: `s${Date.now()}`,
      userId: user?.id || 1,
      text,
      budget: parseFloat(budget),
      // [STUB] Изображение стикера — случайная тематика. При подключении бэкенда: загрузка своего фото
      imageUrl: themes[Math.floor(Math.random() * themes.length)].imageUrl,
      createdAt: new Date().toISOString(),
    };
    setStickersList(prev => [newSticker, ...prev]);
    setCreateOpen(false);
    setText('');
    setBudget('');
    toast({ title: 'Стикер размещён', description: 'Ваш запрос опубликован на доске.' });
  };

  const handleDelete = (id: string) => {
    // [STUB] Удаление только в локальном стейте. При подключении бэкенда: DELETE /api/stickers/:id
    setStickersList(prev => prev.filter(s => s.id !== id));
    toast({ title: 'Стикер удалён' });
  };

  const handleOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerText.trim()) return;
    // [STUB] Предложение отправляется только как тост.
    // При подключении бэкенда: POST /api/stickers/:id/offers { message, price }
    toast({
      title: 'Предложение отправлено',
      description: `Автор стикера получит ваше сообщение.`,
    });
    setOfferStickerId(null);
    setOfferText('');
    setOfferPrice('');
  };

  return (
    <div className="p-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-serif font-semibold mb-2">Стикеры</h1>
          <p className="text-muted-foreground text-sm">Запросы на покупку и поиск монет от участников клуба</p>
        </div>

        {canAddSticker && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
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
                    min={1}
                  />
                </div>
                {/* [STUB] Загрузка фото стикера не реализована — используется случайное изображение */}
                <p className="text-xs text-muted-foreground border border-border/50 px-3 py-2 bg-muted/30">
                  Изображение будет подобрано автоматически. Загрузка своего фото появится после подключения бэкенда.
                </p>
                <DialogFooter className="mt-6">
                  <Button type="submit">Опубликовать</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {stickersList.length === 0 ? (
        <div className="py-20 text-center border border-border/50 bg-card">
          <p className="text-muted-foreground">Стикеров пока нет. Разместите первый запрос!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {stickersList.map(sticker => (
            <Card key={sticker.id} className="overflow-hidden group relative border-border/50 hover:border-primary/40 transition-colors flex flex-col">
              {/* Delete button — only for own stickers */}
              {user && (sticker.userId === user.id || user.role === 'admin') && (
                <button
                  onClick={() => handleDelete(sticker.id)}
                  className="absolute top-2 right-2 z-10 w-6 h-6 bg-secondary/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-destructive"
                  title="Удалить"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
              <div className="aspect-square w-full overflow-hidden bg-muted flex-shrink-0">
                <img
                  src={sticker.imageUrl}
                  alt="Стикер"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <CardContent className="p-4 flex flex-col flex-1">
                <p className="text-sm font-medium leading-snug line-clamp-3 mb-3 flex-1">
                  {sticker.text}
                </p>
                <div className="mt-auto">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Бюджет</div>
                  <div className="font-semibold text-primary mb-3">от {formatPrice(sticker.budget)}</div>
                  {/* Предложить — открывает диалог с формой */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs uppercase tracking-widest h-8"
                    onClick={() => setOfferStickerId(sticker.id)}
                    disabled={sticker.userId === user?.id}
                  >
                    <MessageSquare className="w-3 h-3 mr-1.5" />
                    Предложить
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Offer dialog */}
      <Dialog open={!!offerStickerId} onOpenChange={open => !open && setOfferStickerId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Сделать предложение</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleOffer} className="space-y-4 pt-2">
            {offerSticker && (
              <div className="border border-border/50 bg-muted/30 px-4 py-3 text-sm">
                <span className="text-muted-foreground">Запрос: </span>
                <span className="font-medium">{offerSticker.text}</span>
              </div>
            )}
            <div>
              <label className="text-sm font-medium mb-1.5 block">Ваше сообщение</label>
              <Input
                placeholder="Есть подходящий экземпляр, готов обсудить..."
                value={offerText}
                onChange={e => setOfferText(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Предлагаемая цена (₽, необязательно)</label>
              <Input
                type="number"
                placeholder="4500"
                value={offerPrice}
                onChange={e => setOfferPrice(e.target.value)}
                min={1}
              />
            </div>
            {/* [STUB] Отправка уведомления продавцу — только тост. POST /api/stickers/:id/offers при бэкенде */}
            <p className="text-xs text-muted-foreground">
              Ваше предложение будет передано автору запроса через внутренние сообщения.
            </p>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOfferStickerId(null)}>Отмена</Button>
              <Button type="submit">Отправить</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
