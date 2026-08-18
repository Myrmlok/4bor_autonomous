import React from 'react';
import { Link, useLocation } from 'wouter';
import { Search, ShoppingCart, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ROLE_LABELS } from '../../lib/format';
import { Badge } from '../ui/badge';

export function Header() {
  const [location] = useLocation();
  const { user } = useAuth();

  const navLinks = [
    { href: '/catalog', label: 'Каталог' },
    { href: '/auctions', label: 'Аукционы' },
    { href: '/exclusives', label: 'Эксклюзивы' },
    { href: '/liquidation', label: 'Ликвидация' },
  ];

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between h-16 px-6 bg-secondary text-secondary-foreground">
      <div className="flex items-center gap-8 h-full">
        <Link href="/" className="font-serif text-xl tracking-wider font-semibold">
          <span className="text-white">4BOR</span>
          <span className="text-primary ml-2">/ КЛУБ</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 h-full">
          {navLinks.map(link => {
            const isActive = location.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`h-full flex items-center border-b-2 transition-colors ${
                  isActive 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-white/60 hover:text-white hover:border-white/30'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input 
            type="text" 
            placeholder="Поиск лотов..." 
            className="w-48 pl-9 pr-4 py-1.5 text-sm bg-white/5 border border-white/10 rounded-md text-white placeholder:text-white/40 focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
        
        <Link href="/cart" className="relative p-2 text-white/60 hover:text-white transition-colors">
          <ShoppingCart className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
        </Link>
        
        <Link href="/profile" className="flex items-center gap-3 ml-2 group">
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium text-white group-hover:text-primary transition-colors">
              {user?.login || 'Гость'}
            </span>
            {user && (
              <span className="text-[10px] text-white/50 uppercase tracking-wider">
                {ROLE_LABELS[user.role]}
              </span>
            )}
          </div>
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20 group-hover:border-primary/50 transition-colors">
            <UserIcon className="w-4 h-4 text-white/70" />
          </div>
        </Link>
      </div>
    </header>
  );
}
