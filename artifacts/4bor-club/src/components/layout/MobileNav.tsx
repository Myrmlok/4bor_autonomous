import React from 'react';
import { Link, useLocation } from 'wouter';
import { Home, BookOpen, MessageSquare, ShoppingCart, User } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';

export function MobileBottomNav() {
  const [location] = useLocation();
  const { count } = useCart();

  const tabs = [
    { href: '/',       icon: Home,          label: 'Главная' },
    { href: '/catalog',icon: BookOpen,      label: 'Каталог' },
    { href: '/forum',  icon: MessageSquare, label: 'Форум'   },
    { href: '/cart',   icon: ShoppingCart,  label: 'Корзина', badge: count },
    { href: '/profile',icon: User,          label: 'Профиль' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-secondary border-t border-white/10 flex items-stretch">
      {tabs.map(({ href, icon: Icon, label, badge }) => {
        const isActive = href === '/' ? location === '/' : location.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 relative transition-colors ${
              isActive ? 'text-primary' : 'text-white/40 active:text-white/70'
            }`}
          >
            <span className="relative">
              <Icon className="w-5 h-5" />
              {badge != null && badge > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-[14px] h-3.5 bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                  {badge}
                </span>
              )}
            </span>
            <span className="text-[9px] uppercase tracking-wider font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
