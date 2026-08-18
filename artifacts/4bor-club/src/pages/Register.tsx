import React, { useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { useAuth } from '../contexts/AuthContext';
import { DEMO_INVITES } from '../lib/demo-accounts';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Register() {
  const { token } = useParams<{ token: string }>();
  const [loginName, setLoginName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError] = useState('');
  const [isPending, setIsPending] = useState(false);
  const { registerWithInvite } = useAuth();
  const [, setLocation] = useLocation();

  const invite = token ? DEMO_INVITES[token] : null;
  const ROLE_RU: Record<string, string> = { dealer: 'Дилер', collector: 'Коллекционер' };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== password2) { setError('Пароли не совпадают.'); return; }
    if (password.length < 3) { setError('Пароль слишком короткий.'); return; }
    setIsPending(true);
    setTimeout(() => {
      const result = registerWithInvite(token || '', loginName, email);
      if (result.ok) {
        setLocation('/');
      } else {
        setError(result.error || 'Ошибка регистрации.');
      }
      setIsPending(false);
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-8 bg-[url('/images/hero-bg.jpg')] bg-cover bg-center pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="font-serif text-3xl tracking-widest font-semibold mb-2">
            <span className="text-white">4BOR</span>
            <span className="text-primary"> / КЛУБ</span>
          </div>
          <p className="text-sm text-white/50 uppercase tracking-widest">Регистрация участника</p>
        </div>

        <div className="bg-secondary/80 border border-white/10 backdrop-blur-sm p-8 shadow-2xl">

          {/* Invite status */}
          {invite ? (
            <div className="flex items-center gap-2 border border-primary/30 bg-primary/10 px-4 py-3 mb-6">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
              <div>
                <p className="text-xs text-primary font-medium">Приглашение действительно</p>
                <p className="text-[11px] text-white/50">Роль в Клубе: <span className="text-white/80 font-medium">{ROLE_RU[invite.role] ?? invite.role}</span></p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 border border-red-500/30 bg-red-500/10 px-4 py-3 mb-6">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <div>
                <p className="text-xs text-red-400 font-medium">Недействительная ссылка</p>
                <p className="text-[11px] text-white/40">Токен: <span className="font-mono">{token?.slice(0, 16)}…</span></p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              placeholder="Придумайте логин"
              value={loginName}
              onChange={e => setLoginName(e.target.value)}
              required
              disabled={!invite}
              autoComplete="username"
              className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/60 transition-colors disabled:opacity-40"
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              disabled={!invite}
              autoComplete="email"
              className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/60 transition-colors disabled:opacity-40"
            />
            <input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              disabled={!invite}
              autoComplete="new-password"
              className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/60 transition-colors disabled:opacity-40"
            />
            <input
              type="password"
              placeholder="Повторите пароль"
              value={password2}
              onChange={e => setPassword2(e.target.value)}
              required
              disabled={!invite}
              autoComplete="new-password"
              className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/60 transition-colors disabled:opacity-40"
            />

            {error && <p className="text-red-400 text-xs text-center">{error}</p>}

            <button
              type="submit"
              disabled={isPending || !invite}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm py-3 transition-colors flex items-center justify-center gap-2 h-12 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Завершить регистрацию'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-white/30">
            Уже есть аккаунт?{' '}
            <a href="/login" className="text-primary hover:underline">Войти</a>
          </p>
        </div>
      </div>
    </div>
  );
}
