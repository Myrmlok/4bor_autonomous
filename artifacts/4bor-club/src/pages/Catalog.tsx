import React from 'react';
import { Link, useParams } from 'wouter';
import { ChevronRight, Lock } from 'lucide-react';
import { themes, groups } from '../data/mock';
import { useAuth } from '../contexts/AuthContext';

export default function Catalog() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-serif font-semibold mb-8">Каталог тематик</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {themes.map(theme => (
          <Link 
            key={theme.id} 
            href={`/catalog/${theme.id}`}
            className="group flex flex-col bg-card border rounded-xl overflow-hidden hover-elevate transition-all"
          >
            <div className="w-full h-48 overflow-hidden">
              <img 
                src={theme.imageUrl} 
                alt={theme.name} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
              />
            </div>
            <div className="p-5 flex items-center justify-between bg-card">
              <h2 className="font-serif text-lg font-medium">{theme.name}</h2>
              <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function CatalogTheme() {
  const { themeId } = useParams();
  const { user } = useAuth();
  const isCollector = user?.role === 'collector';
  
  const theme = themes.find(t => t.id === themeId);
  const themeGroups = groups.filter(g => g.themeId === themeId);

  if (!theme) return <div className="p-8">Тематика не найдена</div>;

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link href="/catalog" className="text-sm text-muted-foreground hover:text-primary mb-2 inline-block">
          ← К списку тематик
        </Link>
        <h1 className="text-3xl font-serif font-semibold">{theme.name}</h1>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="divide-y">
          {themeGroups.map(group => (
            <div key={group.id} className="flex flex-col md:flex-row items-center hover:bg-muted/10 transition-colors">
              <div className="w-full md:w-1/4 px-6 py-4 border-b md:border-b-0 md:border-r font-medium">
                {group.name}
              </div>
              <div className="w-full md:w-3/4 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x">
                <Link 
                  href={`/catalog/${theme.id}/groups/${group.id}`} 
                  className="flex items-center justify-between px-6 py-4 group/link hover:text-primary transition-colors"
                >
                  <span className="text-sm">Аукционы от находчиков</span>
                  <ChevronRight className="w-4 h-4 opacity-50 group-hover/link:opacity-100 transition-opacity" />
                </Link>
                
                {isCollector ? (
                  <div className="flex items-center justify-between px-6 py-4 text-muted-foreground/50 cursor-not-allowed">
                    <span className="text-sm">Эксклюзивы</span>
                    <Lock className="w-4 h-4" />
                  </div>
                ) : (
                  <Link 
                    href={`/catalog/${theme.id}/groups/${group.id}?section=exclusive`} 
                    className="flex items-center justify-between px-6 py-4 group/link hover:text-primary transition-colors"
                  >
                    <span className="text-sm">Эксклюзивы от дилеров</span>
                    <ChevronRight className="w-4 h-4 opacity-50 group-hover/link:opacity-100 transition-opacity" />
                  </Link>
                )}
                
                <Link 
                  href={`/catalog/${theme.id}/groups/${group.id}?section=liquidation`} 
                  className="flex items-center justify-between px-6 py-4 group/link hover:text-primary transition-colors"
                >
                  <span className="text-sm text-destructive">Ликвидация</span>
                  <ChevronRight className="w-4 h-4 opacity-50 group-hover/link:opacity-100 transition-opacity text-destructive" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
