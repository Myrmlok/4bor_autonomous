import React from 'react';
import { Link } from 'wouter';
import { MessageSquare, Lock, ChevronRight, Pin } from 'lucide-react';
import { useForum } from '../../contexts/ForumContext';
import { useAuth } from '../../contexts/AuthContext';
import { ROLE_LABELS } from '../../lib/format';
import type { Role } from '../../data/mock';

const ROLE_COLOR: Record<Role, string> = {
  admin:     'text-purple-600',
  dealer:    'text-primary',
  collector: 'text-blue-600',
};

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 2)    return 'только что';
  if (mins < 60)   return `${mins} мин назад`;
  if (hours < 24)  return `${hours} ч назад`;
  if (days < 30)   return `${days} дн назад`;
  return new Date(iso).toLocaleDateString('ru-RU');
}

export default function ForumIndex() {
  const { categories, threads, posts } = useForum();
  const { user } = useAuth();

  const canAccess = (accessRoles: Role[]) =>
    accessRoles.length === 0 || (user ? accessRoles.includes(user.role) : false);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto pb-20 md:pb-8">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-serif font-semibold">Форум клуба</h1>
        <p className="text-sm text-muted-foreground mt-1">Обсуждения, экспертиза и общение участников</p>
      </div>

      {/* Stats bar */}
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
          const lastThread = catThreads
            .filter(t => !t.isPinned)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
            ?? catThreads[catThreads.length - 1];

          return (
            <div key={cat.id} className={`border border-border/50 bg-card transition-colors ${accessible ? 'hover:border-primary/30' : 'opacity-60'}`}>
              {accessible ? (
                <Link href={`/forum/${cat.id}`} className="flex items-stretch">
                  <CategoryCard cat={cat} threadCount={catThreads.length} postCount={catPosts.length} lastThread={lastThread} accessible />
                </Link>
              ) : (
                <div className="flex items-stretch cursor-not-allowed">
                  <CategoryCard cat={cat} threadCount={catThreads.length} postCount={catPosts.length} lastThread={lastThread} accessible={false} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CategoryCard({
  cat, threadCount, postCount, lastThread, accessible,
}: {
  cat: ReturnType<typeof useForum>['categories'][0];
  threadCount: number;
  postCount: number;
  lastThread: ReturnType<typeof useForum>['threads'][0] | undefined;
  accessible: boolean;
}) {
  const { user } = useAuth();
  return (
    <div className="flex flex-1 min-w-0">
      {/* Icon column */}
      <div className="w-12 md:w-16 flex-shrink-0 flex items-center justify-center border-r border-border/30 text-2xl md:text-3xl">
        {accessible ? cat.icon : <Lock className="w-5 h-5 text-muted-foreground/50" />}
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0 px-4 py-3 md:py-4">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="font-serif font-semibold text-base md:text-lg leading-tight">
            {cat.title}
          </h2>
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
