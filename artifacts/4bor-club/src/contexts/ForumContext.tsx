// ForumContext now provides only static category definitions and no local state.
// All data is fetched via React Query in the individual forum pages.
// Mutation helpers are exposed here so pages don't import api-client directly.

import React, { createContext, useContext, useCallback, type ReactNode } from 'react';
import { forum as forumApi } from '../lib/api-client';

// ─── Category type (mirrors backend static data) ──────────────────────────────

export interface ForumCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  accessRoles: string[];
  isReadOnly: boolean;
}

// ─── Static list (same as server; no network call needed for this) ────────────

export const FORUM_CATEGORIES: ForumCategory[] = [
  { id:'c-general',     title:'Общий чат',              description:'Знакомства, вопросы о клубе, общение участников',                 icon:'message-square', accessRoles:[],                    isReadOnly:false },
  { id:'c-expertise',   title:'Экспертиза и атрибуция', description:'Определение монет, помощь с атрибуцией, экспертные оценки',       icon:'scan-search',    accessRoles:[],                    isReadOnly:false },
  { id:'c-deals',       title:'Сделки и переговоры',    description:'Обсуждение сделок, поиск партнёров. Только для дилеров',          icon:'scale',          accessRoles:['dealer','admin'],    isReadOnly:false },
  { id:'c-numizmatika', title:'Нумизматика',            description:'История монет, редкости, литература, каталоги и исследования',    icon:'book-open',      accessRoles:[],                    isReadOnly:false },
  { id:'c-tech',        title:'Хранение и реставрация', description:'Чистка, консервация, капсулы, сейфы, советы по хранению',         icon:'shield',         accessRoles:[],                    isReadOnly:false },
  { id:'c-announce',    title:'Объявления',             description:'Официальные объявления администрации клуба',                      icon:'bell',           accessRoles:[],                    isReadOnly:true  },
];

// ─── Context ──────────────────────────────────────────────────────────────────

interface ForumContextValue {
  categories:      ForumCategory[];
  createThread:    (catId: string, title: string, body: string)    => Promise<unknown>;
  addPost:         (threadId: number, body: string, quotedPostId?: number) => Promise<unknown>;
  editPost:        (postId: number, body: string)                  => Promise<unknown>;
  deletePost:      (postId: number)                                => Promise<void>;
  likePost:        (postId: number, liked: boolean)               => Promise<{ liked: boolean; likes: number }>;
  bookmark:        (threadId: number, bookmarked: boolean)         => Promise<void>;
  togglePin:       (threadId: number, isPinned: boolean)           => Promise<void>;
  toggleLock:      (threadId: number, isLocked: boolean)           => Promise<void>;
  incrementViews:  (threadId: number)                              => Promise<void>;
  markSeen:        (threadId: number, postCount: number)           => Promise<void>;
  searchThreads:   (q: string)                                     => Promise<unknown[]>;
}

const ForumContext = createContext<ForumContextValue>({
  categories:     FORUM_CATEGORIES,
  createThread:   async () => {},
  addPost:        async () => {},
  editPost:       async () => {},
  deletePost:     async () => {},
  likePost:       async () => ({ liked: false, likes: 0 }),
  bookmark:       async () => {},
  togglePin:      async () => {},
  toggleLock:     async () => {},
  incrementViews: async () => {},
  markSeen:       async () => {},
  searchThreads:  async () => [],
});

export function ForumProvider({ children }: { children: ReactNode }) {
  const createThread   = useCallback((catId: string, title: string, body: string) =>
    forumApi.createThread(catId, title, body), []);

  const addPost        = useCallback((threadId: number, body: string, quotedPostId?: number) =>
    forumApi.addPost(threadId, body, quotedPostId), []);

  const editPost       = useCallback((postId: number, body: string) =>
    forumApi.editPost(postId, body), []);

  const deletePost     = useCallback((postId: number) =>
    forumApi.deletePost(postId), []);

  const likePost       = useCallback((postId: number, liked: boolean) =>
    liked ? forumApi.unlikePost(postId) : forumApi.likePost(postId), []);

  const bookmark       = useCallback((threadId: number, bookmarked: boolean) =>
    bookmarked ? forumApi.unbookmark(threadId) : forumApi.bookmark(threadId).then(() => {}), []);

  const togglePin      = useCallback((threadId: number, isPinned: boolean) =>
    forumApi.togglePin(threadId, isPinned), []);

  const toggleLock     = useCallback((threadId: number, isLocked: boolean) =>
    forumApi.toggleLock(threadId, isLocked), []);

  const incrementViews = useCallback((threadId: number) =>
    forumApi.incrementViews(threadId), []);

  const markSeen       = useCallback((threadId: number, postCount: number) =>
    forumApi.markSeen(threadId, postCount), []);

  const searchThreads  = useCallback((q: string) =>
    forumApi.search(q), []);

  return (
    <ForumContext.Provider value={{
      categories: FORUM_CATEGORIES,
      createThread, addPost, editPost, deletePost,
      likePost, bookmark, togglePin, toggleLock,
      incrementViews, markSeen, searchThreads,
    }}>
      {children}
    </ForumContext.Provider>
  );
}

export function useForum() {
  return useContext(ForumContext);
}
