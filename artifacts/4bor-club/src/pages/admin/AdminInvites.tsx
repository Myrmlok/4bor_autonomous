import React, { useState } from 'react';
import { AdminLayout } from './AdminDashboard';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../../components/ui/dialog';
import { useToast } from '../../hooks/use-toast';
import { Copy, Plus, Check, Trash2 } from 'lucide-react';
import { ROLE_LABELS } from '../../lib/format';
import type { Role } from '../../data/mock';

interface Invite {
  id: number;
  token: string;
  role: Role;
  status: 'active' | 'used' | 'revoked';
  created: string;
}

// [STUB] Инвайты хранятся в локальном стейте компонента.
// При подключении бэкенда: GET /api/admin/invites, POST /api/admin/invites, DELETE /api/admin/invites/:id
const INITIAL_INVITES: Invite[] = [
  { id: 1, token: 'dealer-invite-demo2025', role: 'dealer', status: 'active', created: '2025-05-13' },
  { id: 2, token: 'collector-invite-demo2025', role: 'collector', status: 'active', created: '2025-05-10' },
  { id: 3, token: 'dealer-a1bc88xk42bb', role: 'dealer', status: 'used', created: '2025-05-01' },
];

export default function AdminInvites() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role>('dealer');
  const [invites, setInvites] = useState<Invite[]>(INITIAL_INVITES);
  const [copied, setCopied] = useState<number | null>(null);

  const generateInvite = () => {
    const rand = Math.random().toString(36).substring(2, 8) + Math.random().toString(36).substring(2, 8);
    // Токен содержит префикс роли — Register.tsx использует его для определения роли
    const token = `${selectedRole}-${rand}`;
    const newInvite: Invite = {
      id: Date.now(),
      token,
      role: selectedRole,
      status: 'active',
      created: new Date().toISOString().slice(0, 10),
    };
    setInvites(prev => [newInvite, ...prev]);
    setOpen(false);
    toast({ title: 'Инвайт создан', description: `Роль: ${ROLE_LABELS[selectedRole]}` });
  };

  const revokeInvite = (id: number) => {
    setInvites(prev => prev.map(i => i.id === id ? { ...i, status: 'revoked' } : i));
    toast({ title: 'Инвайт отозван' });
  };

  const copyLink = async (invite: Invite) => {
    const url = `${window.location.origin}/register/${invite.token}`;
    await navigator.clipboard.writeText(url);
    setCopied(invite.id);
    setTimeout(() => setCopied(null), 2000);
    toast({ title: 'Ссылка скопирована' });
  };

  const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
    active: { label: 'Активен', cls: 'bg-green-100 text-green-700' },
    used: { label: 'Использован', cls: 'bg-gray-100 text-gray-500' },
    revoked: { label: 'Отозван', cls: 'bg-red-100 text-red-500' },
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-serif font-semibold mb-2">Инвайт-ссылки</h1>
          <p className="text-muted-foreground text-sm">Генерация приглашений в закрытый клуб</p>
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
            <div className="py-4">
              <p className="text-sm text-muted-foreground mb-4">Выберите роль для нового участника:</p>
              <div className="flex flex-col gap-2">
                {(['dealer', 'collector'] as Role[]).map(r => (
                  <button
                    key={r}
                    onClick={() => setSelectedRole(r)}
                    className={`text-left px-4 py-3 border text-sm transition-all ${
                      selectedRole === r ? 'border-primary bg-primary/10 font-medium' : 'border-border/50 hover:border-primary/40'
                    }`}
                  >
                    <div className="font-medium">{ROLE_LABELS[r]}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {r === 'dealer' ? 'Полный доступ: аукционы, эксклюзивы, новости' : 'Аукционы от находчиков, стикеры, ликвидация'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Отмена</Button>
              <Button onClick={generateInvite}>Сгенерировать</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="overflow-hidden border-border/50">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
              <tr>
                <th className="px-6 py-4 font-medium">Токен</th>
                <th className="px-6 py-4 font-medium">Роль</th>
                <th className="px-6 py-4 font-medium">Статус</th>
                <th className="px-6 py-4 font-medium">Создан</th>
                <th className="px-6 py-4 font-medium text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {invites.map(inv => {
                const st = STATUS_LABEL[inv.status];
                return (
                  <tr key={inv.id} className="hover:bg-muted/10">
                    <td className="px-6 py-4 font-mono text-xs">{inv.token}</td>
                    <td className="px-6 py-4">{ROLE_LABELS[inv.role]}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${st.cls}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{new Date(inv.created).toLocaleDateString('ru-RU')}</td>
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyLink(inv)}
                        disabled={inv.status !== 'active'}
                      >
                        {copied === inv.id ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span className="ml-2">{copied === inv.id ? 'Скопировано' : 'Копировать'}</span>
                      </Button>
                      {inv.status === 'active' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => revokeInvite(inv.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </AdminLayout>
  );
}
