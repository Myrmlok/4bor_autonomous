import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Search, ShoppingCart, User as UserIcon, LayoutDashboard, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { ROLE_LABELS } from '../../lib/format';
import { lots } from '../../data/mock';

export function Header() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const { count } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<typeof lots>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const isCollector = user?.role === 'collector';

  const navLinks = [
    { href: '/catalog', label: 'Каталог', show: true },
    { href: '/auctions', label: 'Аукционы', show: true },
    { href: '/exclusives', label: 'Эксклюзивы', show: !isCollector },
    { href: '/liquidation', label: 'Ликвидация', show: true },
    { href: '/stickers', label: 'Стикеры', show: true },
    { href: '/news', label: 'Новости', show: !isCollector },
  ].filter(l => l.show);

  // Live search against mock lots
  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (q.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const lower = q.toLowerCase();
    setSearchResults(lots.filter(l => l.title.toLowerCase().includes(lower)).slice(0, 6));
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const goToLot = (id: string) => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchOpen(false);
    setLocation(`/lots/${id}`);
  };

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between h-16 px-6 bg-secondary text-secondary-foreground">
      <div className="flex items-center gap-8 h-full">
        <Link href="/" className="font-serif text-xl tracking-wider font-semibold shrink-0">
          <span className="text-white">4BOR</span>
          <span className="text-primary ml-2">/ КЛУБ</span>
        </Link>
        <nav className="hidden md:flex items-center gap-5 h-full">
          {navLinks.map(link => {
            const isActive = location === link.href || location.startsWith(link.href + '/');
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`h-full flex items-center border-b-2 text-sm transition-colors whitespace-nowrap ${
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
        {/* Live search */}
        <div className="relative hidden md:block" ref={searchRef}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
          <input
            type="text"
            placeholder="Поиск лотов..."
            value={searchQuery}
            onChange={e => { handleSearch(e.target.value); setSearchOpen(true); }}
            onFocus={() => setSearchOpen(true)}
            className="w-48 pl-9 pr-8 py-1.5 text-sm bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-primary/50 transition-colors"
          />
          {searchQuery && (
            <button onClick={() => { setSearchQuery(''); setSearchResults([]); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
              <X className="w-3 h-3" />
            </button>
          )}
          {/* Search dropdown */}
          {searchOpen && searchResults.length > 0 && (
            <div className="absolute top-full mt-1 left-0 w-72 bg-secondary border border-white/10 shadow-2xl z-50">
              {searchResults.map(lot => (
                <button
                  key={lot.id}
                  onClick={() => goToLot(lot.id)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 text-left transition-colors"
                >
                  <img src={lot.imageUrl} alt="" className="w-8 h-8 object-cover flex-shrink-0 opacity-80" />
                  <div>
                    <div className="text-sm text-white/90 font-medium leading-tight line-clamp-1">{lot.title}</div>
                    <div className="text-[10px] text-white/40 uppercase tracking-wider">
                      {lot.format === 'auction' ? 'Аукцион' : 'Фиксированная цена'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
          {searchOpen && searchQuery.length >= 2 && searchResults.length === 0 && (
            <div className="absolute top-full mt-1 left-0 w-72 bg-secondary border border-white/10 px-4 py-3">
              <p className="text-sm text-white/40">Ничего не найдено</p>
            </div>
          )}
        </div>

        {/* Cart with badge */}
        <Link href="/cart" className="relative p-2 text-white/60 hover:text-white transition-colors">
          <ShoppingCart className="w-5 h-5" />
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-1">
              {count}
            </span>
          )}
        </Link>

        {/* Admin panel link */}
        {user?.role === 'admin' && (
          <Link
            href="/admin"
            className={`p-2 transition-colors ${location.startsWith('/admin') ? 'text-primary' : 'text-white/60 hover:text-white'}`}
            title="Администрирование"
          >
            <LayoutDashboard className="w-5 h-5" />
          </Link>
        )}

        {/* User profile */}
        <Link href="/profile" className="flex items-center gap-3 ml-1 group">
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
