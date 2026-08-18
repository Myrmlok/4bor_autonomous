import React, { useState } from 'react';
import { AdminLayout } from './AdminDashboard';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { useToast } from '../../hooks/use-toast';
import { Copy, Plus, Ticket } from 'lucide-react';

export default function AdminInvites() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [invites, setInvites] = useState([
    { id: 1, token: 'f93k-12xk-99aa-zbx8', role: 'dealer', status: 'active', created: '2024-05-13' },
    { id: 2, token: 'a1bc-88xk-42bb-mmz1', role: 'collector', status: 'used', created: '2024-05-10' },
  ]);

  const generateInvite = () => {
    const token = Math.random().toString(36).substring(2, 10) + '-' + Math.random().toString(36).substring(2, 10);
    const newInvite = {
      id: Date.now(),
      token,
      role: 'dealer',
      status: 'active',
      created: new Date().toISOString()
    };
    setInvites([newInvite, ...invites]);
    setOpen(false);
    toast({ title: "Инвайт создан" });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(`https://4bor.ru/register/${text}`);
    toast({ title: "Ссылка скопирована" });
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-serif font-semibold mb-2">Инвайт-ссылки</h1>
          <p className="text-muted-foreground">Генерация доступов в закрытый клуб</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Создать инвайт
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Генерация приглашения</DialogTitle>
            </DialogHeader>
            <div className="py-6">
              <p className="text-sm text-muted-foreground mb-4">Будет создана одноразовая ссылка для регистрации в качестве Дилера.</p>
            </div>
            <DialogFooter>
              <Button onClick={generateInvite}>Сгенерировать</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
              <tr>
                <th className="px-6 py-4 font-medium">Токен</th>
                <th className="px-6 py-4 font-medium">Роль</th>
                <th className="px-6 py-4 font-medium">Статус</th>
                <th className="px-6 py-4 font-medium">Создан</th>
                <th className="px-6 py-4 font-medium text-right">Ссылка</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {invites.map(inv => (
                <tr key={inv.id} className="hover:bg-muted/10">
                  <td className="px-6 py-4 font-mono font-medium">{inv.token}</td>
                  <td className="px-6 py-4">Дилер</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                      inv.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {inv.status === 'active' ? 'Активен' : 'Использован'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{new Date(inv.created).toLocaleDateString('ru-RU')}</td>
                  <td className="px-6 py-4 text-right">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => copyToClipboard(inv.token)}
                      disabled={inv.status !== 'active'}
                    >
                      <Copy className="w-3.5 h-3.5 mr-2" />
                      Копировать
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </AdminLayout>
  );
}
