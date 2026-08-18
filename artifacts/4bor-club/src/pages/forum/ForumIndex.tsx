import React, { useState } from 'react';
import { Link } from 'wouter';
import {
  MessageSquare, Lock, ChevronRight, Search, Bookmark,
  ScanSearch, Scale, BookOpen, Shield, Bell,
  type LucideProps,
} from 'lucide-react';
import { useForum } from '../../contexts/ForumContext';
import { useAuth } from '../../contexts/AuthContext';
import { ROLE_LABELS } from '../../lib/format';
import type { Role } from '../../data/mock';

type IconFC = React.FC<LucideProps>;

const CATEGORY_ICONS: Record<string, IconFC> = {
  'message-square': MessageSquare,
  'scan-search':    ScanSearch,
  'scale':          Scale,
  'book-open':      BookOpen,
  'shield':         Shield,
  'bell':           Bell,
};

const ROLE_COLOR: Record<Role, string> = {
  admin:     'text-purple-600',
  dealer:    'text-primary',
  collector: 'text-blue-600',
};

function formatRelative(iso: string) {
  const diff  = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 2)   return 'только что';
  if (mins < 60)  return `${mins} мин назад`;
  if (hours < 24) return `${hours} ч назад`;
  if (days < 30)  return `${days} дн назад`;
  return new Date(iso).toLocaleDateString('ru-RU');
}

export default function ForumIndex() {
  const { categories, threads, posts, getCategoryUnread, hasNewPosts, bookmarkedThreads, searchThreads } = useForum();
  const { user } = useAuth();

  const [query, setQuery] = useState('');
  const searchResults = searchThreads(query);

  const canAccess = (accessRoles: Role[]) =>
    accessRoles.length === 0 || (user ? accessRoles.includes(user.role) : false);

  const bookmarkedList = threads.filter(t => bookmarkedThreads.has(t.id));

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto pb-20 md:pb-8">
      {/* Header */}
      <div className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-end gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-serif font-semibold">Форум клуба</h1>
          <p className="text-sm text-muted-foreground mt-1">Обсуждения, экспертиза и общение участников</p>
        </div>
        {/* Search */}
        <div className="relative sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Поиск по темам..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-border bg-card focus:outline-none focus:border-primary/60 transition-colors"
          />
        </div>
      </div>

      {/* Search results */}
      {query.trim() && (
        <div className="mb-8">
          <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 px-1">
            Результаты поиска — {searchResults.length > 0 ? `${searchResults.length} тем` : 'ничего не найдено'}
          </div>
          {searchResults.length === 0 ? (
            <div className="border border-border/50 bg-card px-4 py-8 text-center text-sm text-muted-foreground">
              По запросу «{query}» тем не найдено.
            </div>
          ) : (
            <div className="border border-border/50 bg-card divide-y divide-border/30">
              {searchResults.map(t => (
                <Link
                  key={t.id}
                  href={`/forum/thread/${t.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors group"
                >
                  <MessageSquare className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-1">
                      {t.title}
                    </div>
                    <div className="text-xs text-muted-foreground">{t.categoryTitle} · {formatRelative(t.createdAt)}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/30 flex-shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bookmarks */}
      {!query.trim() && bookmarkedList.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 px-1">
            <Bookmark className="w-3 h-3" />
            Закладки
          </div>
          <div className="border border-border/50 bg-card divide-y divide-border/30">
            {bookmarkedList.map(t => {
              const isNew = hasNewPosts(t.id);
              return (
                <Link
                  key={t.id}
                  href={`/forum/thread/${t.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors group"
                >
                  <Bookmark className="w-4 h-4 text-primary/50 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-1">{t.title}</span>
                      {isNew && (
                        <span className="text-[9px] bg-primary text-primary-foreground px-1.5 py-0.5 font-bold uppercase tracking-wider shrink-0">NEW</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">{formatRelative(t.createdAt)}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/30 flex-shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats bar */}
      {!query.trim() && (
        <>
          <div className="flex gap-6 mb-6 md:mb-8 text-sm text-muted-foreground border border-border/50 bg-card px-4 md:px-6 py-3">
            <span><b className="text-foreground">{threads.length}</b> тем</span>
            <span><b className="text-foreground">{posts.length}</b> сообщений</span>
            <span><b className="text-foreground">148</b> участников</span>
          </div>

          {/* Categories */}
          <div className="space-y-2 md:space-y-3">
            {categories.map(cat => {
              const accessible = canAccess(cat.accessRoles);
              const catThreads = threads.filter(t => t.categoryId === cat.id);
              const catPosts   = posts.filter(p => catThreads.some(t => t.id === p.threadId));
              const unread     = getCategoryUnread(cat.id);
              const lastThread = catThreads
                .filter(t => !t.isPinned)
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
                ?? catThreads[catThreads.length - 1];

              return (
                <div
                  key={cat.id}
                  className={`border border-border/50 bg-card transition-colors ${accessible ? 'hover:border-primary/30' : 'opacity-60'}`}
                >
                  {accessible ? (
                    <Link href={`/forum/${cat.id}`} className="flex items-stretch">
                      <CategoryCard
                        cat={cat} threadCount={catThreads.length}
                        postCount={catPosts.length} lastThread={lastThread}
                        accessible unread={unread}
                      />
                    </Link>
                  ) : (
                    <div className="flex items-stretch cursor-not-allowed">
                      <CategoryCard
                        cat={cat} threadCount={catThreads.length}
                        postCount={catPosts.length} lastThread={lastThread}
                        accessible={false} unread={0}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ─── CategoryCard ─────────────────────────────────────────────────────────────

function CategoryCard({
  cat, threadCount, postCount, lastThread, accessible, unread,
}: {
  cat: ReturnType<typeof useForum>['categories'][0];
  threadCount: number;
  postCount: number;
  lastThread: ReturnType<typeof useForum>['threads'][0] | undefined;
  accessible: boolean;
  unread: number;
}) {
  const Icon = CATEGORY_ICONS[cat.icon] ?? MessageSquare;

  return (
    <div className="flex flex-1 min-w-0">
      {/* Icon column */}
      <div className="w-12 md:w-14 flex-shrink-0 flex items-center justify-center border-r border-border/30">
        {accessible
          ? <Icon className="w-5 h-5 text-primary/70" />
          : <Lock className="w-4 h-4 text-muted-foreground/40" />
        }
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0 px-4 py-3 md:py-4">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <h2 className="font-serif font-semibold text-base md:text-lg leading-tight">{cat.title}</h2>
          {unread > 0 && (
            <span className="text-[9px] bg-primary text-primary-foreground px-1.5 py-0.5 font-bold uppercase tracking-wider">
              {unread} NEW
            </span>
          )}
          {!accessible && cat.accessRoles.length > 0 && (
            <span className="text-[10px] bg-muted px-1.5 py-0.5 text-muted-foreground uppercase tracking-wider shrink-0">
              {cat.accessRoles.filter(r => r !== 'admin').map(r => ROLE_LABELS[r]).join(', ')}
            </span>
          )}
          {cat.isReadOnly && (
            <span className="text-[10px] bg-muted px-1.5 py-0.5 text-muted-foreground uppercase tracking-wider shrink-0">
              Только чтение
            </span>
          )}
        </div>
        <p className="text-xs md:text-sm text-muted-foreground leading-relaxed line-clamp-1">{cat.description}</p>

        {/* Mobile: stats inline */}
        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground md:hidden">
          <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{threadCount} тем</span>
          <span>{postCount} сообщ.</span>
        </div>
      </div>

      {/* Stats — desktop */}
      <div className="hidden md:flex flex-col items-center justify-center px-6 border-l border-border/30 text-center shrink-0 min-w-[80px]">
        <div className="text-lg font-semibold">{threadCount}</div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">тем</div>
        <div className="mt-1 text-sm font-medium">{postCount}</div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">сообщ.</div>
      </div>

      {/* Last activity — desktop */}
      {lastThread && accessible && (
        <div className="hidden lg:flex flex-col justify-center px-4 border-l border-border/30 shrink-0 w-52 min-w-0">
          <p className="text-xs font-medium line-clamp-2 mb-1 text-foreground leading-snug">{lastThread.title}</p>
          <p className="text-[11px] text-muted-foreground">{formatRelative(lastThread.createdAt)}</p>
          <p className={`text-[11px] font-medium ${ROLE_COLOR[lastThread.authorRole]}`}>{lastThread.authorLogin}</p>
        </div>
      )}

      {/* Chevron */}
      {accessible && (
        <div className="flex items-center pr-3">
          <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
        </div>
      )}
    </div>
  );
}
