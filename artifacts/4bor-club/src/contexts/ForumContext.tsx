import React, { createContext, useContext, useState } from 'react';
import {
  forumCategories, forumThreads, forumPosts,
  type ForumCategory, type ForumThread, type ForumPost,
} from '../data/forum-mock';
import type { Role } from '../data/mock';

interface NewThread {
  categoryId: string;
  title: string;
  body: string;
  authorLogin: string;
  authorRole: Role;
}

interface NewPost {
  threadId: string;
  body: string;
  authorLogin: string;
  authorRole: Role;
  quotedPostId?: string;
}

interface ForumContextValue {
  categories: ForumCategory[];
  threads: ForumThread[];
  posts: ForumPost[];
  createThread: (data: NewThread) => ForumThread;
  addPost: (data: NewPost) => ForumPost;
  toggleLike: (postId: string) => void;
  likedPosts: Set<string>;
  getThreadPosts: (threadId: string) => ForumPost[];
  getCategoryThreads: (categoryId: string) => ForumThread[];
  getThreadById: (threadId: string) => ForumThread | undefined;
  getCategoryById: (categoryId: string) => ForumCategory | undefined;
}

const ForumContext = createContext<ForumContextValue | null>(null);

export function ForumProvider({ children }: { children: React.ReactNode }) {
  const [threads, setThreads] = useState<ForumThread[]>(forumThreads);
  const [posts, setPosts] = useState<ForumPost[]>(forumPosts);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  const createThread = (data: NewThread): ForumThread => {
    const thread: ForumThread = {
      id: `t-user-${Date.now()}`,
      categoryId: data.categoryId,
      title: data.title,
      authorLogin: data.authorLogin,
      authorRole: data.authorRole,
      createdAt: new Date().toISOString(),
      isPinned: false,
      isLocked: false,
      views: 1,
    };
    const op: ForumPost = {
      id: `p-user-${Date.now()}`,
      threadId: thread.id,
      authorLogin: data.authorLogin,
      authorRole: data.authorRole,
      createdAt: new Date().toISOString(),
      body: data.body,
      likes: 0,
      isOp: true,
    };
    setThreads(prev => [thread, ...prev]);
    setPosts(prev => [...prev, op]);
    return thread;
  };

  const addPost = (data: NewPost): ForumPost => {
    const post: ForumPost = {
      id: `p-user-${Date.now()}`,
      threadId: data.threadId,
      authorLogin: data.authorLogin,
      authorRole: data.authorRole,
      createdAt: new Date().toISOString(),
      body: data.body,
      likes: 0,
      isOp: false,
      quotedPostId: data.quotedPostId,
    };
    setPosts(prev => [...prev, post]);
    return post;
  };

  const toggleLike = (postId: string) => {
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
  };

  const getThreadPosts = (threadId: string) =>
    posts.filter(p => p.threadId === threadId).sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

  const getCategoryThreads = (categoryId: string) =>
    threads
      .filter(t => t.categoryId === categoryId)
      .sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

  const getThreadById = (id: string) => threads.find(t => t.id === id);
  const getCategoryById = (id: string) => forumCategories.find(c => c.id === id);

  return (
    <ForumContext.Provider value={{
      categories: forumCategories,
      threads,
      posts,
      createThread,
      addPost,
      toggleLike,
      likedPosts,
      getThreadPosts,
      getCategoryThreads,
      getThreadById,
      getCategoryById,
    }}>
      {children}
    </ForumContext.Provider>
  );
}

export function useForum() {
  const ctx = useContext(ForumContext);
  if (!ctx) throw new Error('useForum must be used inside ForumProvider');
  return ctx;
}
