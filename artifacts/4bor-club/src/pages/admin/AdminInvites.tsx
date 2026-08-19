import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from './AdminDashboard';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogTrigger, DialogFooter,
} from '../../components/ui/dialog';
import { useToast } from '../../hooks/use-toast';
import { Copy, Plus, Check, Trash2, Send } from 'lucide-react';
import { ROLE_LABELS } from '../../lib/format';
import { invites as invitesApi, type ApiInvite } from '../../lib/api-client';

type Role = 'dealer' | 'collector';

export default function AdminInvites() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen]   = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role>('dealer');
  const [creating, setCreating]       = useState(false);
  const [copied, setCopied]           = useState<number | null>(null);
  const [emailMap, setEmailMap]       = useState<Record<number, string>>({});
  const [sendingId, setSendingId]     = useState<number | null>(null);

  const { data: list = [], isLoading } = useQuery({
    queryKey: ['admin-invites'],
    queryFn:  () => invitesApi.list(),
    staleTime: 15_000,
  });

  const generate = async () => {
    setCreating(true);
    try {
      await invitesApi.create(selectedRole);
      await qc.invalidateQueries({ queryKey: ['admin-invites'] });
      setCreateOpen(false);
      toast({ title: 'Инвайт создан', description: `Роль: ${ROLE_LABELS[selectedRole]}` });
    } catch (err: unknown) {
      toast({ title: 'Ошибка', description: err instanceof Error ? err.message : 'Не удалось создать инвайт', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const revoke = async (id: number) => {
    if (!confirm('Удалить инвайт?')) return;
    try {
      await invitesApi.revoke(id);
      await qc.invalidateQueries({ queryKey: ['admin-invites'] });
      toast({ title: 'Инвайт удалён' });
    } catch {
      toast({ title: 'Ошибка при удалении', variant: 'destructive' });
    }
  };

  const copyLink = async (inv: ApiInvite) => {
    const url = `${window.location.origin}/register/${inv.token}`;
    await navigator.clipboard.writeText(url);
    setCopied(inv.id);
    setTimeout(() => setCopied(null), 2000);
    toast({ title: 'Ссылка скопирована' });
  };

  const sendEmail = async (inv: ApiInvite) => {
    const email = emailMap[inv.id]?.trim();
    if (!email) return;
    setSendingId(inv.id);
    try {
      await invitesApi.sendEmail(inv.id, email);
      toast({ title: 'Письмо отправлено', description: email });
      setEmailMap(prev => ({ ...prev, [inv.id]: '' }));
    } catch (err: unknown) {
      toast({ title: 'Ошибка отправки', description: err instanceof Error ? err.message : 'SMTP-ошибка', variant: 'destructive' });
    } finally {
      setSendingId(null);
    }
  };

  const statusLabel = (inv: ApiInvite) => {
    if (inv.used) return { label: 'Использован', cls: 'bg-gray-100 text-gray-500' };
    if (inv.expiresAt && new Date(inv.expiresAt) < new Date()) return { label: 'Истёк', cls: 'bg-orange-100 text-orange-600' };
    return { label: 'Активен', cls: 'bg-green-100 text-green-700' };
  };

  const isActive = (inv: ApiInvite) =>
    !inv.used && !(inv.expiresAt && new Date(inv.expiresAt) < new Date());

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif font-semibold mb-1">Инвайт-ссылки</h1>
          <p className="text-muted-foreground text-sm">Генерация приглашений в закрытый клуб</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
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
                      {r === 'dealer'
                        ? 'Полный доступ: аукционы, эксклюзивы, новости'
                        : 'Аукционы, стикеры, ликвидация'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Отмена</Button>
              <Button onClick={generate} disabled={creating}>
                {creating ? 'Создаю...' : 'Сгенерировать'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Загрузка...</div>
      ) : (
        <div className="space-y-3">
          {list.map(inv => {
            const st = statusLabel(inv);
            const active = isActive(inv);
            return (
              <Card key={inv.id} className="border-border/50 overflow-hidden">
                <div className="p-4 md:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    {/* Token + meta */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-mono text-xs text-foreground break-all">{inv.token}</span>
                        <span className={`text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider ${st.cls}`}>
                          {st.label}
                        </span>
                        <span className="text-[10px] bg-muted px-2 py-0.5 font-medium uppercase tracking-wider">
                          {ROLE_LABELS[inv.role as Role] ?? inv.role}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Создан: {new Date(inv.createdAt).toLocaleDateString('ru-RU')}
                        {inv.expiresAt && ` · Истекает: ${new Date(inv.expiresAt).toLocaleDateString('ru-RU')}`}
                        {inv.usedAt && ` · Использован: ${new Date(inv.usedAt).toLocaleDateString('ru-RU')}`}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {active && (
                        <Button variant="outline" size="sm" onClick={() => copyLink(inv)}>
                          {copied === inv.id
                            ? <><Check className="w-3.5 h-3.5 text-green-600 mr-1.5" />Скопировано</>
                            : <><Copy className="w-3.5 h-3.5 mr-1.5" />Копировать</>}
                        </Button>
                      )}
                      <Button
                        variant="ghost" size="sm"
                        onClick={() => revoke(inv.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Email send row — only for active invites */}
                  {active && (
                    <div className="mt-3 flex gap-2">
                      <input
                        type="email"
                        placeholder="Отправить на email..."
                        value={emailMap[inv.id] ?? ''}
                        onChange={e => setEmailMap(prev => ({ ...prev, [inv.id]: e.target.value }))}
                        className="flex-1 min-w-0 border border-border/50 px-3 py-1.5 text-xs bg-background focus:outline-none focus:border-primary/60 transition-colors"
                      />
                      <Button
                        size="sm" variant="outline"
                        disabled={!emailMap[inv.id]?.trim() || sendingId === inv.id}
                        onClick={() => sendEmail(inv)}
                        className="shrink-0"
                      >
                        <Send className="w-3.5 h-3.5 mr-1.5" />
                        {sendingId === inv.id ? 'Отправка...' : 'Отправить'}
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}

          {list.length === 0 && (
            <div className="py-16 text-center border border-border/50 bg-card">
              <p className="text-muted-foreground">Нет инвайт-ссылок. Создайте первую.</p>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
