import React, { useState } from 'react';
import { Link, useParams, useLocation } from 'wouter';
import {
  Pin, Lock, MessageSquare, Eye, ChevronRight, Plus,
  ScanSearch, Scale, BookOpen, Shield, Bell,
  type LucideProps,
} from 'lucide-react';
import { useForum } from '../../contexts/ForumContext';
import { useAuth } from '../../contexts/AuthContext';
import { ROLE_LABELS } from '../../lib/format';
import { Button } from '../../components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../../components/ui/dialog';
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

type SortMode = 'latest' | 'replies' | 'views';

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

export default function ForumCategory() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [, setLocation]  = useLocation();
  const {
    getCategoryById, getCategoryThreads, getThreadPosts,
    createThread, hasNewPosts,
  } = useForum();
  const { user } = useAuth();

  const category = getCategoryById(categoryId);

  const [sort, setSort]           = useState<SortMode>('latest');
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle]   = useState('');
  const [newBody, setNewBody]     = useState('');

  const threads = getCategoryThreads(categoryId, sort);

  if (!category) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground mb-4">Раздел не найден.</p>
        <Button variant="outline" onClick={() => setLocation('/forum')}>На форум</Button>
      </div>
    );
  }

  if (category.accessRoles.length > 0 && (!user || !category.accessRoles.includes(user.role))) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <Lock className="w-10 h-10 text-muted-foreground/40 mb-4" />
        <h2 className="text-xl font-serif font-semibold mb-2">Раздел закрыт</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Доступно только для:{' '}
          {category.accessRoles.filter(r => r !== 'admin').map(r => ROLE_LABELS[r]).join(', ')}
        </p>
        <Button variant="outline" onClick={() => setLocation('/forum')}>На форум</Button>
      </div>
    );
  }

  const canCreate = !!(user && (!category.isReadOnly || user.role === 'admin'));

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTitle.trim() || !newBody.trim()) return;
    const thread = createThread({
      categoryId,
      title:       newTitle.trim(),
      body:        newBody.trim(),
      authorLogin: user.login,
      authorRole:  user.role,
    });
    setCreateOpen(false);
    setNewTitle('');
    setNewBody('');
    setLocation(`/forum/thread/${thread.id}`);
  };

  const Icon = CATEGORY_ICONS[category.icon] ?? MessageSquare;

  const SORT_LABELS: Record<SortMode, string> = {
    latest:  'Новые',
    replies: 'Популярные',
    views:   'Просмотры',
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto pb-20 md:pb-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-5 md:mb-6">
        <Link href="/forum" className="hover:text-primary transition-colors">Форум</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground font-medium">{category.title}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 mb-5 md:mb-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-1">
            <Icon className="w-5 h-5 text-primary/70 flex-shrink-0" />
            <h1 className="text-xl md:text-2xl font-serif font-semibold">{category.title}</h1>
          </div>
          <p className="text-sm text-muted-foreground">{category.description}</p>
        </div>
        {canCreate && (
          <Button onClick={() => setCreateOpen(true)} className="shrink-0 flex items-center gap-2 self-start">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Новая тема</span>
            <span className="sm:hidden">Создать</span>
          </Button>
        )}
      </div>

      {/* Sort tabs */}
      {threads.length > 0 && (
        <div className="flex items-center gap-1 mb-4 border-b border-border/30">
          {(Object.keys(SORT_LABELS) as SortMode[]).map(s => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`px-3 py-2 text-xs font-medium uppercase tracking-wider transition-colors border-b-2 -mb-px ${
                sort === s
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {SORT_LABELS[s]}
            </button>
          ))}
          <span className="ml-auto text-xs text-muted-foreground pr-1">{threads.length} тем</span>
        </div>
      )}

      {/* Thread list */}
      {threads.length === 0 ? (
        <div className="py-16 text-center border border-border/50 bg-card">
          <MessageSquare className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">В этом разделе пока нет тем.</p>
          {canCreate && (
            <Button variant="outline" className="mt-4" onClick={() => setCreateOpen(true)}>
              Создать первую тему
            </Button>
          )}
        </div>
      ) : (
        <div className="border border-border/50 bg-card overflow-hidden">
          {/* Table header — desktop */}
          <div className="hidden md:grid grid-cols-[1fr_80px_60px_180px] border-b border-border/30 bg-muted/30 px-4 py-2.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <span>Тема</span>
            <span className="text-center">Ответов</span>
            <span className="text-center">Просм.</span>
            <span className="text-right">Последнее</span>
          </div>

          <div className="divide-y divide-border/30">
            {threads.map(thread => {
              const threadPosts = getThreadPosts(thread.id);
              const replyCount  = Math.max(0, threadPosts.length - 1);
              const lastPost    = threadPosts[threadPosts.length - 1];
              const isNew       = hasNewPosts(thread.id);

              return (
                <Link
                  key={thread.id}
                  href={`/forum/thread/${thread.id}`}
                  className="flex md:grid md:grid-cols-[1fr_80px_60px_180px] items-start md:items-center gap-3 md:gap-0 px-4 py-3.5 hover:bg-muted/20 transition-colors group"
                >
                  {/* Title area */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {thread.isPinned && <Pin className="w-3 h-3 text-primary flex-shrink-0" />}
                      {thread.isLocked && <Lock className="w-3 h-3 text-muted-foreground/60 flex-shrink-0" />}
                      <span className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                        {thread.title}
                      </span>
                      {isNew && (
                        <span className="text-[9px] bg-primary text-primary-foreground px-1.5 py-0.5 font-bold uppercase tracking-wider shrink-0">NEW</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                      <span className={`font-medium ${ROLE_COLOR[thread.authorRole]}`}>{thread.authorLogin}</span>
                      <span>{formatRelative(thread.createdAt)}</span>
                      {/* Mobile stats */}
                      <span className="md:hidden flex items-center gap-2">
                        · <MessageSquare className="w-3 h-3 inline" /> {replyCount}
                        · <Eye className="w-3 h-3 inline" /> {thread.views}
                      </span>
                    </div>
                  </div>

                  {/* Reply count — desktop */}
                  <div className="hidden md:flex items-center justify-center text-sm text-muted-foreground">
                    {replyCount}
                  </div>

                  {/* Views — desktop */}
                  <div className="hidden md:flex items-center justify-center text-sm text-muted-foreground">
                    {thread.views}
                  </div>

                  {/* Last post — desktop */}
                  {lastPost ? (
                    <div className="hidden md:block text-right">
                      <div className={`text-xs font-medium ${ROLE_COLOR[lastPost.authorRole]}`}>
                        {lastPost.authorLogin}
                      </div>
                      <div className="text-[11px] text-muted-foreground">{formatRelative(lastPost.createdAt)}</div>
                    </div>
                  ) : (
                    <div className="hidden md:block" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* New thread dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif">Новая тема в «{category.title}»</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="space-y-4 py-2">
              <div>
                <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground block mb-1.5">
                  Заголовок темы
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Кратко опишите вопрос или тему..."
                  required
                  maxLength={200}
                  className="w-full border border-border px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-primary/60 transition-colors"
                />
                <div className="text-right text-xs text-muted-foreground mt-1">{newTitle.length}/200</div>
              </div>
              <div>
                <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground block mb-1.5">
                  Первое сообщение
                </label>
                <textarea
                  value={newBody}
                  onChange={e => setNewBody(e.target.value)}
                  placeholder="Подробно опишите ситуацию, вопрос или предложение..."
                  required
                  rows={7}
                  className="w-full border border-border px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-primary/60 transition-colors resize-y"
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Отмена</Button>
              <Button type="submit" disabled={!newTitle.trim() || !newBody.trim()}>Опубликовать</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
