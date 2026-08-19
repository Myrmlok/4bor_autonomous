import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from './AdminDashboard';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { ROLE_LABELS } from '../../lib/format';
import { admin as adminApi, type ApiUser } from '../../lib/api-client';
import { useToast } from '../../hooks/use-toast';

type Role = 'admin' | 'dealer' | 'collector';

const ROLE_BADGE: Record<string, string> = {
  admin:     'bg-purple-100 text-purple-700',
  dealer:    'bg-primary/10 text-primary',
  collector: 'bg-blue-100 text-blue-700',
};

export default function AdminUsers() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [filter, setFilter]       = useState('all');
  const [editUser, setEditUser]   = useState<ApiUser | null>(null);
  const [newRole, setNewRole]     = useState<Role>('dealer');
  const [saving, setSaving]       = useState(false);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn:  () => adminApi.users(),
    staleTime: 15_000,
  });

  const filtered = filter === 'all' ? users : users.filter(u => u.role === filter);

  const openEdit = (u: ApiUser) => {
    setEditUser(u);
    setNewRole(u.role as Role);
  };

  const applyRoleChange = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      await adminApi.setRole(editUser.id, newRole);
      await qc.invalidateQueries({ queryKey: ['admin-users'] });
      toast({ title: 'Роль изменена' });
      setEditUser(null);
    } catch (err: unknown) {
      toast({ title: 'Ошибка', description: err instanceof Error ? err.message : 'Не удалось изменить роль', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-serif font-semibold">Пользователи</h1>
        <span className="text-sm text-muted-foreground">{users.length} участников</span>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {['all', 'dealer', 'collector', 'admin'].map(r => (
          <Button key={r} variant={filter === r ? 'default' : 'outline'} size="sm" onClick={() => setFilter(r)}>
            {r === 'all' ? 'Все' : ROLE_LABELS[r as Role]}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Загрузка...</div>
      ) : (
        <Card className="overflow-hidden border-border/50">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                <tr>
                  <th className="px-6 py-4 font-medium">ID</th>
                  <th className="px-6 py-4 font-medium">Логин</th>
                  <th className="px-6 py-4 font-medium">Email</th>
                  <th className="px-6 py-4 font-medium">Роль</th>
                  <th className="px-6 py-4 font-medium">Зарегистрирован</th>
                  <th className="px-6 py-4 font-medium text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(u => (
                  <tr key={u.id} className="hover:bg-muted/10">
                    <td className="px-6 py-4 font-mono text-muted-foreground">#{u.id}</td>
                    <td className="px-6 py-4 font-medium">{u.login}</td>
                    <td className="px-6 py-4 text-muted-foreground">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${ROLE_BADGE[u.role] ?? ''}`}>
                        {ROLE_LABELS[u.role as Role] ?? u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="outline" size="sm"
                        onClick={() => openEdit(u)}
                        disabled={u.role === 'admin'}
                      >
                        Изменить роль
                      </Button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
                      Нет пользователей в этой группе
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Role change dialog */}
      <Dialog open={!!editUser} onOpenChange={open => !open && setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Изменить роль</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Пользователь: <span className="font-medium text-foreground">{editUser?.login}</span>
            </p>
            <div className="flex flex-col gap-2">
              {(['dealer', 'collector'] as Role[]).map(r => (
                <button
                  key={r}
                  onClick={() => setNewRole(r)}
                  className={`text-left px-4 py-3 border text-sm transition-all ${
                    newRole === r ? 'border-primary bg-primary/10 font-medium' : 'border-border/50 hover:border-primary/40'
                  }`}
                >
                  {ROLE_LABELS[r]}
                </button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Отмена</Button>
            <Button onClick={applyRoleChange} disabled={saving}>
              {saving ? 'Применяю...' : 'Применить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
