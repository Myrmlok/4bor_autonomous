import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  forumCategories, forumThreads, forumPosts,
  type ForumCategory, type ForumThread, type ForumPost,
} from '../data/forum-mock';
import type { Role } from '../data/mock';

// ─── Input shapes ────────────────────────────────────────────────────────────

interface NewThread {
  categoryId: string;
  title:      string;
  body:       string;
  authorLogin: string;
  authorRole:  Role;
}

interface NewPost {
  threadId:     string;
  body:         string;
  authorLogin:  string;
  authorRole:   Role;
  quotedPostId?: string;
}

// ─── Context value ────────────────────────────────────────────────────────────

interface ForumContextValue {
  categories: ForumCategory[];
  threads:    ForumThread[];
  posts:      ForumPost[];

  // CRUD
  createThread:    (data: NewThread) => ForumThread;
  addPost:         (data: NewPost) => ForumPost;
  editPost:        (postId: string, body: string) => void;
  deletePost:      (postId: string) => void;
  toggleLike:      (postId: string) => void;
  toggleLock:      (threadId: string) => void;   // admin only
  togglePin:       (threadId: string) => void;   // admin only
  toggleBookmark:  (threadId: string) => void;
  incrementViews:  (threadId: string) => void;
  markThreadSeen:  (threadId: string, postCount: number) => void;

  // State sets
  likedPosts:      Set<string>;
  bookmarkedThreads: Set<string>;
  seenThreads:     Record<string, number>;

  // Queries
  getThreadPosts:      (threadId: string)  => ForumPost[];
  getCategoryThreads:  (categoryId: string, sort?: 'latest' | 'replies' | 'views') => ForumThread[];
  getThreadById:       (threadId: string)  => ForumThread | undefined;
  getCategoryById:     (categoryId: string)=> ForumCategory | undefined;
  getUserPostCount:    (login: string)     => number;
  searchThreads:       (q: string) => Array<ForumThread & { categoryTitle: string }>;
  hasNewPosts:         (threadId: string)  => boolean;
  getCategoryUnread:   (categoryId: string)=> number;
}

const ForumContext = createContext<ForumContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ForumProvider({ children }: { children: React.ReactNode }) {
  const [threads,    setThreads]    = useState<ForumThread[]>(forumThreads);
  const [posts,      setPosts]      = useState<ForumPost[]>(forumPosts);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [bookmarkedThreads, setBookmarked] = useState<Set<string>>(new Set());
  const [seenThreads, setSeenThreads] = useState<Record<string, number>>({});

  // ── Thread creation ────────────────────────────────────────────────────────
  const createThread = useCallback((data: NewThread): ForumThread => {
    const thread: ForumThread = {
      id:          `t-user-${Date.now()}`,
      categoryId:  data.categoryId,
      title:       data.title,
      authorLogin: data.authorLogin,
      authorRole:  data.authorRole,
      createdAt:   new Date().toISOString(),
      isPinned:    false,
      isLocked:    false,
      views:       1,
    };
    const op: ForumPost = {
      id:          `p-user-${Date.now()}`,
      threadId:    thread.id,
      authorLogin: data.authorLogin,
      authorRole:  data.authorRole,
      createdAt:   new Date().toISOString(),
      body:        data.body,
      likes:       0,
      isOp:        true,
    };
    setThreads(prev => [thread, ...prev]);
    setPosts(prev => [...prev, op]);
    return thread;
  }, []);

  // ── Post CRUD ──────────────────────────────────────────────────────────────
  const addPost = useCallback((data: NewPost): ForumPost => {
    const post: ForumPost = {
      id:           `p-user-${Date.now()}`,
      threadId:     data.threadId,
      authorLogin:  data.authorLogin,
      authorRole:   data.authorRole,
      createdAt:    new Date().toISOString(),
      body:         data.body,
      likes:        0,
      isOp:         false,
      quotedPostId: data.quotedPostId,
    };
    setPosts(prev => [...prev, post]);
    return post;
  }, []);

  const editPost = useCallback((postId: string, body: string) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, body, editedAt: new Date().toISOString() } : p));
  }, []);

  const deletePost = useCallback((postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  }, []);

  // ── Likes ──────────────────────────────────────────────────────────────────
  const toggleLike = useCallback((postId: string) => {
    setLikedPosts(prev => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
        setPosts(ps => ps.map(p => p.id === postId ? { ...p, likes: Math.max(0, p.likes - 1) } : p));
      } else {
        next.add(postId);
        setPosts(ps => ps.map(p => p.id === postId ? { ...p, likes: p.likes + 1 } : p));
      }
      return next;
    });
  }, []);

  // ── Moderation ─────────────────────────────────────────────────────────────
  const toggleLock = useCallback((threadId: string) => {
    setThreads(prev => prev.map(t => t.id === threadId ? { ...t, isLocked: !t.isLocked } : t));
  }, []);

  const togglePin = useCallback((threadId: string) => {
    setThreads(prev => prev.map(t => t.id === threadId ? { ...t, isPinned: !t.isPinned } : t));
  }, []);

  // ── Bookmarks ──────────────────────────────────────────────────────────────
  const toggleBookmark = useCallback((threadId: string) => {
    setBookmarked(prev => {
      const next = new Set(prev);
      next.has(threadId) ? next.delete(threadId) : next.add(threadId);
      return next;
    });
  }, []);

  // ── Views ──────────────────────────────────────────────────────────────────
  const incrementViews = useCallback((threadId: string) => {
    setThreads(prev => prev.map(t => t.id === threadId ? { ...t, views: t.views + 1 } : t));
  }, []);

  // ── Read tracking ──────────────────────────────────────────────────────────
  const markThreadSeen = useCallback((threadId: string, postCount: number) => {
    setSeenThreads(prev => ({ ...prev, [threadId]: postCount }));
  }, []);

  const hasNewPosts = useCallback((threadId: string): boolean => {
    const count = posts.filter(p => p.threadId === threadId).length;
    return (seenThreads[threadId] ?? 0) < count && count > 0;
  }, [posts, seenThreads]);

  const getCategoryUnread = useCallback((categoryId: string): number => {
    return threads
      .filter(t => t.categoryId === categoryId)
      .filter(t => hasNewPosts(t.id))
      .length;
  }, [threads, hasNewPosts]);

  // ── Queries ────────────────────────────────────────────────────────────────
  const getThreadPosts = useCallback((threadId: string) =>
    posts
      .filter(p => p.threadId === threadId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
  [posts]);

  const getCategoryThreads = useCallback((
    categoryId: string,
    sort: 'latest' | 'replies' | 'views' = 'latest',
  ): ForumThread[] => {
    const cat = threads.filter(t => t.categoryId === categoryId);
    const pinned    = cat.filter(t => t.isPinned);
    const unpinned  = cat.filter(t => !t.isPinned);

    const sorted = unpinned.sort((a, b) => {
      if (sort === 'views') return b.views - a.views;
      if (sort === 'replies') {
        const ra = posts.filter(p => p.threadId === a.id).length;
        const rb = posts.filter(p => p.threadId === b.id).length;
        return rb - ra;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return [...pinned, ...sorted];
  }, [threads, posts]);

  const getThreadById   = useCallback((id: string) => threads.find(t => t.id === id), [threads]);
  const getCategoryById = useCallback((id: string) => forumCategories.find(c => c.id === id), []);

  const getUserPostCount = useCallback((login: string) =>
    posts.filter(p => p.authorLogin === login).length,
  [posts]);

  const searchThreads = useCallback((q: string) => {
    if (!q.trim()) return [];
    const lower = q.toLowerCase();
    return threads
      .filter(t => t.title.toLowerCase().includes(lower))
      .map(t => ({
        ...t,
        categoryTitle: forumCategories.find(c => c.id === t.categoryId)?.title ?? '',
      }))
      .slice(0, 20);
  }, [threads]);

  return (
    <ForumContext.Provider value={{
      categories: forumCategories,
      threads,
      posts,
      createThread,
      addPost,
      editPost,
      deletePost,
      toggleLike,
      toggleLock,
      togglePin,
      toggleBookmark,
      incrementViews,
      markThreadSeen,
      likedPosts,
      bookmarkedThreads,
      seenThreads,
      getThreadPosts,
      getCategoryThreads,
      getThreadById,
      getCategoryById,
      getUserPostCount,
      searchThreads,
      hasNewPosts,
      getCategoryUnread,
    }}>
      {children}
    </ForumContext.Provider>
  );
}

export function useForum() {
  const ctx = useContext(ForumContext);
  if (!ctx) throw new Error('useForum must be inside ForumProvider');
  return ctx;
}
