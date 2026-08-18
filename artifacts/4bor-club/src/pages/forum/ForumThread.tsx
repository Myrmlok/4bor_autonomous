import React, { useState, useRef, useEffect } from 'react';
import { Link, useParams, useLocation } from 'wouter';
import {
  ChevronRight, Lock, Heart, Quote, Reply, Pin, Send, X,
  Pencil, Trash2, Bookmark, BookmarkCheck, ShieldCheck,
  PinOff, Unlock,
} from 'lucide-react';
import { useForum } from '../../contexts/ForumContext';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { ROLE_LABELS } from '../../lib/format';
import type { Role } from '../../data/mock';
import type { ForumPost } from '../../data/forum-mock';

// ─── Styles ───────────────────────────────────────────────────────────────────

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
  if (n === 1)                     return '1 сообщение';
  if (n >= 2 && n <= 4)            return `${n} сообщения`;
  return `${n} сообщений`;
}
function pluralViews(n: number) {
  if (n === 1)                     return '1 просмотр';
  if (n >= 2 && n <= 4)            return `${n} просмотра`;
  return `${n} просмотров`;
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ login, role }: { login: string; role: Role }) {
  return (
    <div className={`w-9 h-9 md:w-10 md:h-10 flex items-center justify-center font-serif font-bold text-sm flex-shrink-0 border ${ROLE_BG[role]}`}>
      {login[0]?.toUpperCase()}
    </div>
  );
}

// ─── Delete confirm ───────────────────────────────────────────────────────────

function DeleteConfirm({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="mx-4 mb-3 flex items-center gap-3 p-3 bg-red-50 border border-red-200 text-sm">
      <span className="flex-1 text-red-700">Удалить это сообщение?</span>
      <button onClick={onCancel} className="text-muted-foreground hover:text-foreground px-2 py-1 text-xs">Отмена</button>
      <button onClick={onConfirm} className="bg-red-600 text-white px-3 py-1 text-xs hover:bg-red-700 transition-colors">Удалить</button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ForumThread() {
  const { threadId } = useParams<{ threadId: string }>();
  const [, setLocation] = useLocation();
  const {
    getThreadById, getCategoryById, getThreadPosts,
    addPost, editPost, deletePost,
    toggleLike, toggleLock, togglePin, toggleBookmark,
    incrementViews, markThreadSeen,
    likedPosts, bookmarkedThreads,
    getUserPostCount,
  } = useForum();
  const { user } = useAuth();

  const thread   = getThreadById(threadId);
  const category = thread ? getCategoryById(thread.categoryId) : undefined;
  const posts    = getThreadPosts(threadId);

  // ── Reply state ────────────────────────────────────────────────────────────
  const [replyBody, setReplyBody]   = useState('');
  const [quotedPost, setQuotedPost] = useState<ForumPost | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const replyRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // ── Edit state ────────────────────────────────────────────────────────────
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [editBody, setEditBody]     = useState('');

  // ── Delete state ─────────────────────────────────────────────────────────
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── View tracking ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (thread) {
      incrementViews(thread.id);
      markThreadSeen(thread.id, posts.length);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (quotedPost && replyRef.current) {
      replyRef.current.focus();
      replyRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [quotedPost]);

  if (!thread || !category) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground mb-4">Тема не найдена.</p>
        <Button variant="outline" onClick={() => setLocation('/forum')}>На форум</Button>
      </div>
    );
  }

  const isAdmin     = user?.role === 'admin';
  const isBookmarked = bookmarkedThreads.has(thread.id);
  const canReply    = !!(user && !thread.isLocked);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !replyBody.trim()) return;
    setSubmitting(true);
    setTimeout(() => {
      addPost({ threadId, body: replyBody.trim(), authorLogin: user.login, authorRole: user.role, quotedPostId: quotedPost?.id });
      setReplyBody('');
      setQuotedPost(null);
      setSubmitting(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }, 150);
  };

  const startEdit = (post: ForumPost) => {
    setEditingId(post.id);
    setEditBody(post.body);
    setDeletingId(null);
  };

  const saveEdit = (postId: string) => {
    if (!editBody.trim()) return;
    editPost(postId, editBody.trim());
    setEditingId(null);
  };

  const confirmDelete = (postId: string) => {
    deletePost(postId);
    setDeletingId(null);
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto pb-24 md:pb-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-5 flex-wrap">
        <Link href="/forum" className="hover:text-primary transition-colors">Форум</Link>
        <ChevronRight className="w-3 h-3 flex-shrink-0" />
        <Link href={`/forum/${category.id}`} className="hover:text-primary transition-colors">
          {category.title}
        </Link>
        <ChevronRight className="w-3 h-3 flex-shrink-0" />
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
              <span className={`font-medium ${ROLE_COLOR[thread.authorRole]}`}>{thread.authorLogin}</span>
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
            {/* Bookmark */}
            <button
              onClick={() => toggleBookmark(thread.id)}
              title={isBookmarked ? 'Убрать из закладок' : 'В закладки'}
              className={`p-1.5 transition-colors ${isBookmarked ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
            >
              {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            </button>

            {/* Reply */}
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
              onClick={() => togglePin(thread.id)}
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
              onClick={() => toggleLock(thread.id)}
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
          const quotedSource = post.quotedPostId
            ? posts.find(p => p.id === post.quotedPostId)
            : undefined;
          const isLiked    = likedPosts.has(post.id);
          const isOwn      = user?.login === post.authorLogin;
          const canEdit    = isOwn || isAdmin;
          const postCount  = getUserPostCount(post.authorLogin);
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
                      <span className={`text-sm font-semibold ${ROLE_COLOR[post.authorRole]}`}>
                        {post.authorLogin}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 border font-medium uppercase tracking-wider ${ROLE_BG[post.authorRole]}`}>
                        {ROLE_LABELS[post.authorRole]}
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
                      {(post as ForumPost & { editedAt?: string }).editedAt && (
                        <span className="text-[10px] text-muted-foreground/60 italic">· изменено</span>
                      )}
                      <span className="text-[10px] text-muted-foreground/50 hidden sm:inline">
                        {postCount} {postCount === 1 ? 'сообщение' : postCount < 5 ? 'сообщения' : 'сообщений'} в клубе
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {/* Edit / delete — own post or admin */}
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
                  <span className={`font-semibold ${ROLE_COLOR[quotedSource.authorRole]} mr-1`}>
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
                    onClick={() => toggleLike(post.id)}
                    className={`flex items-center gap-1.5 text-xs transition-colors ${
                      isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-red-400'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
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
                <span className={`text-xs font-medium ${ROLE_COLOR[user.role]}`}>{user.login}</span>
              </div>
            )}
          </div>

          <form onSubmit={handleReply} className="p-4 md:p-6 space-y-3">
            {/* Quoted preview */}
            {quotedPost && (
              <div className="flex items-start gap-2 p-3 border-l-2 border-primary/40 bg-muted/30 text-xs">
                <div className="flex-1 min-w-0">
                  <span className={`font-semibold ${ROLE_COLOR[quotedPost.authorRole]} mr-1`}>
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
