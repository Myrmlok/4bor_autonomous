import React, { useState, useRef, useEffect } from 'react';
import { Link, useParams, useLocation } from 'wouter';
import { ChevronRight, Lock, Heart, Quote, Reply, Pin, Send, X } from 'lucide-react';
import { useForum } from '../../contexts/ForumContext';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { ROLE_LABELS } from '../../lib/format';
import type { Role } from '../../data/mock';
import type { ForumPost } from '../../data/forum-mock';

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

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}
function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 2)   return 'только что';
  if (mins < 60)  return `${mins} мин назад`;
  if (hours < 24) return `${hours} ч назад`;
  if (days < 30)  return `${days} дн назад`;
  return new Date(iso).toLocaleDateString('ru-RU');
}

function Avatar({ login, role }: { login: string; role: Role }) {
  return (
    <div className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center font-serif font-bold text-sm flex-shrink-0 border ${ROLE_BG[role]}`}>
      {login[0]?.toUpperCase()}
    </div>
  );
}

function PostBody({ body }: { body: string }) {
  return (
    <div className="text-sm leading-relaxed text-foreground whitespace-pre-wrap break-words">
      {body}
    </div>
  );
}

export default function ForumThread() {
  const { threadId } = useParams<{ threadId: string }>();
  const [, setLocation] = useLocation();
  const { getThreadById, getCategoryById, getThreadPosts, addPost, toggleLike, likedPosts } = useForum();
  const { user } = useAuth();

  const thread   = getThreadById(threadId);
  const category = thread ? getCategoryById(thread.categoryId) : undefined;
  const posts    = getThreadPosts(threadId);

  const [replyBody, setReplyBody]       = useState('');
  const [quotedPost, setQuotedPost]     = useState<ForumPost | null>(null);
  const [submitting, setSubmitting]     = useState(false);
  const replyRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

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

  const handleQuote = (post: ForumPost) => {
    setQuotedPost(post);
  };

  const handleReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !replyBody.trim()) return;
    setSubmitting(true);
    setTimeout(() => {
      addPost({
        threadId,
        body: replyBody.trim(),
        authorLogin: user.login,
        authorRole: user.role,
        quotedPostId: quotedPost?.id,
      });
      setReplyBody('');
      setQuotedPost(null);
      setSubmitting(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }, 200);
  };

  const canReply = user && !thread.isLocked;

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
      <div className="mb-6 md:mb-8 border border-border/50 bg-card px-4 md:px-6 py-4">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              {thread.isPinned && <Pin className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
              {thread.isLocked && <Lock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
              <h1 className="text-lg md:text-2xl font-serif font-semibold leading-tight">{thread.title}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className={`font-medium ${ROLE_COLOR[thread.authorRole]}`}>{thread.authorLogin}</span>
              <span>·</span>
              <span>{formatRelative(thread.createdAt)}</span>
              <span>·</span>
              <span>{posts.length} {posts.length === 1 ? 'сообщение' : posts.length < 5 ? 'сообщения' : 'сообщений'}</span>
              <span>·</span>
              <span>{thread.views} просмотров</span>
              {thread.isLocked && (
                <span className="text-muted-foreground border border-border/50 px-1.5 py-0.5 text-[10px] uppercase tracking-wider">
                  Закрыта
                </span>
              )}
            </div>
          </div>
          {!thread.isLocked && canReply && (
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 hidden sm:flex items-center gap-1.5"
              onClick={() => replyRef.current?.focus()}
            >
              <Reply className="w-3.5 h-3.5" />
              Ответить
            </Button>
          )}
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-4 md:space-y-5 mb-6 md:mb-8">
        {posts.map((post, idx) => {
          const quotedSource = post.quotedPostId
            ? posts.find(p => p.id === post.quotedPostId)
            : undefined;
          const isLiked = likedPosts.has(post.id);

          return (
            <div
              key={post.id}
              id={`post-${post.id}`}
              className={`border bg-card transition-colors ${post.isOp ? 'border-primary/20' : 'border-border/50'}`}
            >
              {/* Post header */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/30 bg-muted/20">
                <div className="flex items-center gap-2.5">
                  <Avatar login={post.authorLogin} role={post.authorRole} />
                  <div>
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
                    <div className="text-[11px] text-muted-foreground mt-0.5" title={formatDate(post.createdAt)}>
                      {formatRelative(post.createdAt)}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground/50 font-mono">#{idx + 1}</div>
              </div>

              {/* Quoted post */}
              {quotedSource && (
                <div className="mx-4 mt-3 px-3 py-2.5 border-l-2 border-primary/40 bg-muted/30 text-xs text-muted-foreground">
                  <span className={`font-semibold ${ROLE_COLOR[quotedSource.authorRole]} mr-1`}>
                    {quotedSource.authorLogin}:
                  </span>
                  <span className="line-clamp-3 leading-relaxed">{quotedSource.body}</span>
                </div>
              )}

              {/* Post body */}
              <div className="px-4 py-3.5 md:py-4">
                <PostBody body={post.body} />
              </div>

              {/* Post footer */}
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
                    onClick={() => handleQuote(post)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Quote className="w-3.5 h-3.5" />
                    Цитировать
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div ref={bottomRef} />

      {/* Reply form */}
      {canReply ? (
        <div className="border border-border/50 bg-card">
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
