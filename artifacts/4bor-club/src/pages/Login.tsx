import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../contexts/AuthContext';
import { DEMO_ACCOUNTS, DEMO_INVITES } from '../lib/demo-accounts';
import { Loader2, Copy, Check } from 'lucide-react';

export default function Login() {
  const [loginName, setLoginName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const { login, loginAs } = useAuth();
  const [, setLocation] = useLocation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsPending(true);
    setTimeout(() => {
      const ok = login(loginName.trim(), password);
      if (ok) { setLocation('/'); } else { setError('Неверный логин или пароль.'); }
      setIsPending(false);
    }, 400);
  };

  const handleQuickLogin = (account: typeof DEMO_ACCOUNTS[0]) => {
    const { password: _, ...u } = account;
    loginAs(u);
    setLocation('/');
  };

  const getInviteUrl = (token: string) => `${window.location.origin}/register/${token}`;

  const copyInvite = async (token: string) => {
    await navigator.clipboard.writeText(getInviteUrl(token));
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const ROLE_COLORS: Record<string, string> = {
    dealer:    'bg-primary/20 text-primary border-primary/30',
    collector: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
    admin:     'bg-purple-500/20 text-purple-300 border-purple-400/30',
  };
  const ROLE_RU: Record<string, string> = { dealer: 'Дилер', collector: 'Коллекционер', admin: 'Администратор' };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary p-4 relative overflow-auto">
      <div className="absolute inset-0 opacity-8 bg-[url('/images/hero-bg.jpg')] bg-cover bg-center pointer-events-none" />

      {/* Responsive: column on mobile, row on md+ */}
      <div className="w-full max-w-[880px] relative z-10 flex flex-col md:flex-row gap-4 md:gap-6 items-stretch my-4">

        {/* Login form */}
        <div className="flex-1 bg-secondary/80 border border-white/10 backdrop-blur-sm p-6 md:p-8 shadow-2xl">
          <div className="text-center mb-6 md:mb-8">
            <div className="font-serif text-2xl md:text-3xl tracking-widest font-semibold mb-2">
              <span className="text-white">4BOR</span>
              <span className="text-primary"> / КЛУБ</span>
            </div>
            <p className="text-sm text-white/50 uppercase tracking-widest">Вход в закрытый клуб</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Логин или Email"
              value={loginName}
              onChange={e => setLoginName(e.target.value)}
              required
              autoComplete="username"
              className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/60 transition-colors"
            />
            <input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/60 transition-colors"
            />
            {error && <p className="text-red-400 text-xs text-center">{error}</p>}
            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm py-3 transition-colors flex items-center justify-center gap-2 h-12 disabled:opacity-60"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Войти в Клуб'}
            </button>
          </form>

          <p className="mt-6 md:mt-8 text-center text-xs text-white/30 uppercase tracking-widest border-t border-white/10 pt-5">
            Доступ только по приглашениям
          </p>
        </div>

        {/* Demo panel — below form on mobile, right column on desktop */}
        <div className="flex flex-col gap-4 md:w-72 md:shrink-0">
          {/* Quick login accounts */}
          <div className="bg-secondary/80 border border-white/10 backdrop-blur-sm p-4 md:p-5 shadow-xl">
            <p className="text-[10px] text-white/40 uppercase tracking-widest mb-3 font-medium">
              Демо-аккаунты (пароль: 123)
            </p>
            {/* Mobile: horizontal scrollable row; desktop: vertical list */}
            <div className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-1 md:pb-0 snap-x md:snap-none">
              {DEMO_ACCOUNTS.map(acc => (
                <button
                  key={acc.id}
                  onClick={() => handleQuickLogin(acc)}
                  className={`flex-shrink-0 md:flex-shrink snap-start flex flex-col md:flex-row items-start md:items-center justify-between border px-3 py-2.5 text-left transition-all hover:bg-white/5 group ${ROLE_COLORS[acc.role]} min-w-[140px] md:min-w-0 w-40 md:w-auto`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{acc.login}</div>
                    <div className="text-[10px] opacity-70 truncate">{acc.email}</div>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wide opacity-70 group-hover:opacity-100 mt-1 md:mt-0 md:ml-2 shrink-0">
                    {ROLE_RU[acc.role]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Demo invite links */}
          <div className="bg-secondary/80 border border-white/10 backdrop-blur-sm p-4 md:p-5 shadow-xl">
            <p className="text-[10px] text-white/40 uppercase tracking-widest mb-3 font-medium">
              Инвайт-ссылки (демо)
            </p>
            <div className="flex flex-col gap-2">
              {Object.entries(DEMO_INVITES).map(([token, { label }]) => (
                <div key={token} className="flex items-center justify-between border border-white/10 px-3 py-2 gap-2">
                  <div className="min-w-0">
                    <div className="text-xs text-white/80 font-medium">{label}</div>
                    <div className="text-[10px] text-white/30 font-mono truncate">{token.slice(0, 22)}…</div>
                  </div>
                  <button
                    onClick={() => copyInvite(token)}
                    className="text-white/50 hover:text-primary transition-colors shrink-0"
                    title="Скопировать ссылку"
                  >
                    {copiedToken === token ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              ))}
              <p className="text-[10px] text-white/30 leading-tight mt-1">
                Скопируйте ссылку — откроется страница регистрации с нужной ролью.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
