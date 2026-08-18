import type { Role } from '../data/mock';

export interface User {
  id: number;
  login: string;
  email: string;
  role: Role;
  createdAt: string;
}

export type DemoAccount = User & { password: string };

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { id: 1, login: 'dealer_ivanov', email: 'ivanov@4bor.ru', role: 'dealer', password: '123', createdAt: '2024-01-15' },
  { id: 2, login: 'collector_petrov', email: 'petrov@4bor.ru', role: 'collector', password: '123', createdAt: '2024-02-10' },
  { id: 3, login: 'admin', email: 'admin@4bor.ru', role: 'admin', password: '123', createdAt: '2023-11-01' },
];

export const DEMO_INVITES: Record<string, { role: Role; label: string }> = {
  'dealer-invite-demo2025': { role: 'dealer', label: 'Дилер' },
  'collector-invite-demo2025': { role: 'collector', label: 'Коллекционер' },
};
