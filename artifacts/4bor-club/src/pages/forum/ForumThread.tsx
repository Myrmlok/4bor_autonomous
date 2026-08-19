import React, { useState, useRef, useEffect } from 'react';
import { Link, useParams, useLocation } from 'wouter';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ChevronRight, Lock, Heart, Quote, Reply, Pin, Send, X,
  Pencil, Trash2, Bookmark, BookmarkCheck, ShieldCheck,
  PinOff, Unlock,
} from 'lucide-react';
import { forum as forumApi, type ApiForumPost, type ApiForumThread } from '../../lib/api-client';
import { useForum, FORUM_CATEGORIES } from '../../contexts/ForumContext';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { ROLE_LABELS } from '../../lib/format';

type Role = 'admin' | 'dealer' | 'collector';

const ROLE_COLOR: Record<Role, string> = {
  admin:     'text-purple-600',
  dealer:    'text-primary',
  collector: 'text-blue-600',
};
const ROLE_BG: Record<Role, string> = {
  admin:     'bg-purple-100 text-purple-700 border-purple-200',
  dealer:    'bg-primary/10 text-primary border-primary/20',
  collector: 'bg-blue-100 text-blue-700 border-blue-200',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}
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
function pluralPosts(n: number) {
  if (n === 1)          return '1 сообщение';
  if (n >= 2 && n <= 4) return `${n} сообщения`;
  return `${n} сообщений`;
}
function pluralViews(n: number) {
  if (n === 1)          return '1 просмотр';
  if (n >= 2 && n <= 4) return `${n} просмотра`;
  return `${n} просмотров`;
}

function Avatar({ login, role }: { login: string; role: string }) {
  const r = (role as Role) in ROLE_BG ? (role as Role) : 'collector';
  return (
    <div className={`w-9 h-9 md:w-10 md:h-10 flex items-center justify-center font-serif font-bold text-sm flex-shrink-0 border ${ROLE_BG[r]}`}>
      {login[0]?.toUpperCase()}
    </div>
  );
}

function DeleteConfirm({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="mx-4 mb-3 flex items-center gap-3 p-3 bg-red-50 border border-red-200 text-sm">
      <span className="flex-1 text-red-700">Удалить это сообщение?</span>
      <button onClick={onCancel} className="text-muted-foreground hover:text-foreground px-2 py-1 text-xs">Отмена</button>
      <button onClick={onConfirm} className="bg-red-600 text-white px-3 py-1 text-xs hover:bg-red-700 transition-colors">Удалить</button>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ForumThread() {
  const { threadId } = useParams<{ threadId: string }>();
  const [, setLocation] = useLocation();
  const { addPost, editPost, deletePost, likePost, bookmark, togglePin, toggleLock, incrementViews, markSeen } = useForum();
  const { user } = useAuth();
  const qc = useQueryClient();
  const tid = Number(threadId);

  // ── Data ──────────────────────────────────────────────────────────────────
  const { data: thread, isLoading: threadLoading } = useQuery({
    queryKey: ['forum-thread', tid],
    queryFn:  () => forumApi.thread(tid),
    enabled:  !isNaN(tid),
  });

  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['forum-posts', tid],
    queryFn:  () => forumApi.posts(tid),
    enabled:  !isNaN(tid),
    staleTime: 10_000,
  });

  const category = thread ? FORUM_CATEGORIES.find(c => c.id === thread.categoryId) : undefined;

  // ── Track view + seen ─────────────────────────────────────────────────────
  const viewedRef = useRef(false);
  useEffect(() => {
    if (!thread || viewedRef.current) return;
    viewedRef.current = true;
    incrementViews(tid).catch(() => {});
    if (user && posts.length > 0) {
      markSeen(tid, posts.length).catch(() => {});
    }
  }, [thread, posts.length, user]);

  // ── Reply state ────────────────────────────────────────────────────────────
  const [replyBody, setReplyBody]   = useState('');
  const [quotedPost, setQuotedPost] = useState<ApiForumPost | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const replyRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // ── Edit / delete state ────────────────────────────────────────────────────
  const [editingId, setEditingId]   = useState<number | null>(null);
  const [editBody, setEditBody]     = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (quotedPost && replyRef.current) {
      replyRef.current.focus();
      replyRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [quotedPost]);

  // ── Loading / not found ───────────────────────────────────────────────────
  if (threadLoading || postsLoading) {
    return <div className="p-8 text-center text-sm text-muted-foreground">Загрузка...</div>;
  }

  if (!thread) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground mb-4">Тема не найдена.</p>
        <Button variant="outline" onClick={() => setLocation('/forum')}>На форум</Button>
      </div>
    );
  }

  const isAdmin      = user?.role === 'admin';
  const isBookmarked = thread.isBookmarked;
  const canReply     = !!(user && !thread.isLocked);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['forum-posts', tid] });
    qc.invalidateQueries({ queryKey: ['forum-thread', tid] });
    qc.invalidateQueries({ queryKey: ['forum-threads'] });
    qc.invalidateQueries({ queryKey: ['forum-categories'] });
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !replyBody.trim()) return;
    setSubmitting(true);
    try {
      await addPost(tid, replyBody.trim(), quotedPost?.id);
      await qc.invalidateQueries({ queryKey: ['forum-posts', tid] });
      setReplyBody('');
      setQuotedPost(null);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (post: ApiForumPost) => {
    setEditingId(post.id);
    setEditBody(post.body);
    setDeletingId(null);
  };

  const saveEdit = async (postId: number) => {
    if (!editBody.trim()) return;
    try {
      await editPost(postId, editBody.trim());
      await qc.invalidateQueries({ queryKey: ['forum-posts', tid] });
    } catch (err) { console.error(err); }
    setEditingId(null);
  };

  const confirmDelete = async (postId: number) => {
    try {
      await deletePost(postId);
      await qc.invalidateQueries({ queryKey: ['forum-posts', tid] });
      qc.invalidateQueries({ queryKey: ['forum-thread', tid] });
    } catch (err) { console.error(err); }
    setDeletingId(null);
  };

  const handleLike = async (post: ApiForumPost) => {
    const result = await likePost(post.id, post.isLiked);
    // Optimistically update in cache
    qc.setQueryData<ApiForumPost[]>(['forum-posts', tid], prev =>
      prev?.map(p => p.id === post.id ? { ...p, likes: result.likes, isLiked: result.liked } : p),
    );
  };

  const handleBookmark = async () => {
    await bookmark(thread.id, isBookmarked);
    qc.setQueryData<ApiForumThread>(['forum-thread', tid], prev =>
      prev ? { ...prev, isBookmarked: !isBookmarked } : prev,
    );
    qc.invalidateQueries({ queryKey: ['forum-bookmarks'] });
  };

  const handleTogglePin = async () => {
    await togglePin(thread.id, !thread.isPinned);
    qc.setQueryData<ApiForumThread>(['forum-thread', tid], prev =>
      prev ? { ...prev, isPinned: !prev.isPinned } : prev,
    );
    invalidate();
  };

  const handleToggleLock = async () => {
    await toggleLock(thread.id, !thread.isLocked);
    qc.setQueryData<ApiForumThread>(['forum-thread', tid], prev =>
      prev ? { ...prev, isLocked: !prev.isLocked } : prev,
    );
  };

  const roleColor = (role: string) => ROLE_COLOR[(role as Role) in ROLE_COLOR ? (role as Role) : 'collector'];
  const roleBg    = (role: string) => ROLE_BG[(role as Role) in ROLE_BG     ? (role as Role) : 'collector'];

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto pb-24 md:pb-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-5 flex-wrap">
        <Link href="/forum" className="hover:text-primary transition-colors">Форум</Link>
        <ChevronRight className="w-3 h-3 flex-shrink-0" />
        {category && (
          <>
            <Link href={`/forum/${category.id}`} className="hover:text-primary transition-colors">
              {category.title}
            </Link>
            <ChevronRight className="w-3 h-3 flex-shrink-0" />
          </>
        )}
        <span className="text-foreground font-medium line-clamp-1">{thread.title}</span>
      </nav>

      {/* Thread header */}
      <div className="mb-5 md:mb-6 border border-border/50 bg-card px-4 md:px-6 py-4">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              {thread.isPinned && <Pin className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
              {thread.isLocked && <Lock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
              <h1 className="text-lg md:text-2xl font-serif font-semibold leading-tight">{thread.title}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              <span className={`font-medium ${roleColor(thread.authorRole)}`}>{thread.authorLogin}</span>
              <span>·</span>
              <span title={formatDate(thread.createdAt)}>{formatRelative(thread.createdAt)}</span>
              <span>·</span>
              <span>{pluralPosts(posts.length)}</span>
              <span>·</span>
              <span>{pluralViews(thread.views)}</span>
              {thread.isLocked && (
                <span className="border border-border/50 px-1.5 py-0.5 text-[10px] uppercase tracking-wider">Закрыта</span>
              )}
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {user && (
              <button
                onClick={handleBookmark}
                title={isBookmarked ? 'Убрать из закладок' : 'В закладки'}
                className={`p-1.5 transition-colors ${isBookmarked ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
              >
                {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              </button>
            )}
            {canReply && (
              <Button
                size="sm" variant="outline"
                className="hidden sm:flex items-center gap-1.5"
                onClick={() => replyRef.current?.focus()}
              >
                <Reply className="w-3.5 h-3.5" />
                Ответить
              </Button>
            )}
          </div>
        </div>

        {/* Admin controls */}
        {isAdmin && (
          <div className="mt-3 pt-3 border-t border-border/20 flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-muted-foreground mr-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Модерация:
            </span>
            <button
              onClick={handleTogglePin}
              className={`flex items-center gap-1 text-xs px-2.5 py-1 border transition-colors ${
                thread.isPinned
                  ? 'border-primary/40 text-primary bg-primary/5 hover:bg-muted'
                  : 'border-border/50 text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              {thread.isPinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
              {thread.isPinned ? 'Открепить' : 'Закрепить'}
            </button>
            <button
              onClick={handleToggleLock}
              className={`flex items-center gap-1 text-xs px-2.5 py-1 border transition-colors ${
                thread.isLocked
                  ? 'border-amber-400/40 text-amber-700 bg-amber-50 hover:bg-muted'
                  : 'border-border/50 text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              {thread.isLocked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
              {thread.isLocked ? 'Открыть' : 'Закрыть'}
            </button>
          </div>
        )}
      </div>

      {/* Posts */}
      <div className="space-y-4 md:space-y-5 mb-6 md:mb-8">
        {posts.map((post, idx) => {
          const quotedSource = post.quotedPostId ? posts.find(p => p.id === post.quotedPostId) : undefined;
          const isOwn      = user?.login === post.authorLogin;
          const canEdit    = isOwn || isAdmin;
          const isEditing  = editingId === post.id;
          const isDeleting = deletingId === post.id;

          return (
            <div
              key={post.id}
              id={`post-${post.id}`}
              className={`border bg-card transition-colors ${post.isOp ? 'border-primary/20' : 'border-border/50'}`}
            >
              {/* Post header */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/30 bg-muted/20">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar login={post.authorLogin} role={post.authorRole} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-sm font-semibold ${roleColor(post.authorRole)}`}>
                        {post.authorLogin}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 border font-medium uppercase tracking-wider ${roleBg(post.authorRole)}`}>
                        {ROLE_LABELS[post.authorRole as Role] ?? post.authorRole}
                      </span>
                      {post.isOp && (
                        <span className="text-[10px] px-1.5 py-0.5 border border-primary/20 bg-primary/5 text-primary font-medium uppercase tracking-wider">
                          Автор
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-muted-foreground" title={formatDate(post.createdAt)}>
                        {formatRelative(post.createdAt)}
                      </span>
                      {post.editedAt && (
                        <span className="text-[10px] text-muted-foreground/60 italic">· изменено</span>
                      )}
                      <span className="text-[10px] text-muted-foreground/50 hidden sm:inline">
                        {post.authorPostCount} {post.authorPostCount === 1 ? 'сообщение' : post.authorPostCount < 5 ? 'сообщения' : 'сообщений'} в клубе
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {canEdit && !isEditing && (
                    <>
                      <button
                        onClick={() => startEdit(post)}
                        title="Редактировать"
                        className="p-1.5 text-muted-foreground/50 hover:text-foreground transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => { setDeletingId(post.id); setEditingId(null); }}
                        title="Удалить"
                        className="p-1.5 text-muted-foreground/50 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                  <div className="text-xs text-muted-foreground/40 font-mono pl-1">#{idx + 1}</div>
                </div>
              </div>

              {/* Delete confirm */}
              {isDeleting && (
                <DeleteConfirm
                  onConfirm={() => confirmDelete(post.id)}
                  onCancel={() => setDeletingId(null)}
                />
              )}

              {/* Quoted post */}
              {quotedSource && !isEditing && (
                <div className="mx-4 mt-3 px-3 py-2.5 border-l-2 border-primary/40 bg-muted/30 text-xs text-muted-foreground">
                  <span className={`font-semibold ${roleColor(quotedSource.authorRole)} mr-1`}>
                    {quotedSource.authorLogin}:
                  </span>
                  <span className="line-clamp-3 leading-relaxed">{quotedSource.body}</span>
                </div>
              )}

              {/* Post body — normal or editing */}
              {isEditing ? (
                <div className="px-4 py-3 space-y-2">
                  <textarea
                    value={editBody}
                    onChange={e => setEditBody(e.target.value)}
                    rows={5}
                    autoFocus
                    className="w-full border border-border px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-primary/60 transition-colors resize-y"
                  />
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 border border-border/50 transition-colors"
                    >
                      Отмена
                    </button>
                    <button
                      onClick={() => saveEdit(post.id)}
                      disabled={!editBody.trim()}
                      className="text-xs bg-primary text-primary-foreground px-3 py-1.5 hover:opacity-90 transition-opacity disabled:opacity-40"
                    >
                      Сохранить
                    </button>
                  </div>
                </div>
              ) : (
                <div className="px-4 py-3.5 md:py-4 text-sm leading-relaxed text-foreground whitespace-pre-wrap break-words">
                  {post.body}
                </div>
              )}

              {/* Post footer */}
              {!isEditing && (
                <div className="px-4 pb-3 flex items-center gap-3">
                  <button
                    onClick={() => handleLike(post)}
                    disabled={!user}
                    className={`flex items-center gap-1.5 text-xs transition-colors ${
                      post.isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-red-400'
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${post.isLiked ? 'fill-current' : ''}`} />
                    {post.likes > 0 && <span>{post.likes}</span>}
                  </button>
                  {canReply && !thread.isLocked && (
                    <button
                      onClick={() => setQuotedPost(post)}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Quote className="w-3.5 h-3.5" />
                      Цитировать
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div ref={bottomRef} />

      {/* Reply form */}
      {canReply ? (
        <div className="border border-border/50 bg-card" id="reply-form">
          <div className="px-4 md:px-6 py-3 border-b border-border/30 bg-muted/20 flex items-center justify-between">
            <span className="text-sm font-medium">Ваш ответ</span>
            {user && (
              <div className="flex items-center gap-2">
                <Avatar login={user.login} role={user.role} />
                <span className={`text-xs font-medium ${roleColor(user.role)}`}>{user.login}</span>
              </div>
            )}
          </div>
          <form onSubmit={handleReply} className="p-4 md:p-6 space-y-3">
            {quotedPost && (
              <div className="flex items-start gap-2 p-3 border-l-2 border-primary/40 bg-muted/30 text-xs">
                <div className="flex-1 min-w-0">
                  <span className={`font-semibold ${roleColor(quotedPost.authorRole)} mr-1`}>
                    {quotedPost.authorLogin}:
                  </span>
                  <span className="text-muted-foreground line-clamp-2">{quotedPost.body}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setQuotedPost(null)}
                  className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <textarea
              ref={replyRef}
              value={replyBody}
              onChange={e => setReplyBody(e.target.value)}
              placeholder="Напишите ответ..."
              rows={5}
              className="w-full border border-border px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-primary/60 transition-colors resize-y min-h-[100px]"
            />
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">
                {replyBody.length > 0 ? `${replyBody.length} символов` : 'Поддерживается перенос строк'}
              </span>
              <Button
                type="submit"
                disabled={!replyBody.trim() || submitting}
                className="flex items-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                {submitting ? 'Отправка...' : 'Отправить'}
              </Button>
            </div>
          </form>
        </div>
      ) : thread.isLocked ? (
        <div className="flex items-center gap-3 border border-border/50 bg-muted/20 px-4 py-3.5 text-sm text-muted-foreground">
          <Lock className="w-4 h-4 flex-shrink-0" />
          Тема закрыта для новых ответов.
        </div>
      ) : (
        <div className="border border-border/50 bg-muted/20 px-4 py-3.5 text-sm text-muted-foreground text-center">
          <Link href="/login" className="text-primary hover:underline">Войдите</Link>, чтобы оставить ответ.
        </div>
      )}
    </div>
  );
}
