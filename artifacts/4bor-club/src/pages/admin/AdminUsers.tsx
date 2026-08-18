import React, { useState } from 'react';
import { AdminLayout } from './AdminDashboard';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { ROLE_LABELS } from '../../lib/format';

export default function AdminUsers() {
  const [filter, setFilter] = useState('all');
  
  // mock users
  const users = [
    { id: 1, login: 'dealer_test', email: 'dealer@test.ru', role: 'dealer', date: '2024-01-15' },
    { id: 2, login: 'collector_1', email: 'c1@test.ru', role: 'collector', date: '2024-02-20' },
    { id: 3, login: 'ivan_numizmat', email: 'ivan@test.ru', role: 'dealer', date: '2023-11-10' },
    { id: 4, login: 'admin', email: 'admin@4bor.ru', role: 'admin', date: '2023-01-01' },
  ];

  const filtered = filter === 'all' ? users : users.filter(u => u.role === filter);

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-serif font-semibold">Пользователи</h1>
      </div>

      <div className="flex gap-2 mb-6">
        <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')}>Все</Button>
        <Button variant={filter === 'dealer' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('dealer')}>Дилеры</Button>
        <Button variant={filter === 'collector' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('collector')}>Коллекционеры</Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
              <tr>
                <th className="px-6 py-4 font-medium">ID</th>
                <th className="px-6 py-4 font-medium">Логин</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">Роль</th>
                <th className="px-6 py-4 font-medium">Дата регистрации</th>
                <th className="px-6 py-4 font-medium text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-muted/10">
                  <td className="px-6 py-4 font-mono text-muted-foreground">#{u.id}</td>
                  <td className="px-6 py-4 font-medium">{u.login}</td>
                  <td className="px-6 py-4">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      u.role === 'admin' ? 'bg-destructive/10 text-destructive' :
                      u.role === 'dealer' ? 'bg-primary/10 text-primary' :
                      'bg-secondary/10 text-secondary'
                    }`}>
                      {ROLE_LABELS[u.role]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{new Date(u.date).toLocaleDateString('ru-RU')}</td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="outline" size="sm">Изменить роль</Button>
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
