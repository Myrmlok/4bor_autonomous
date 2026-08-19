// Typed API client — all calls go to /api with credentials (JWT cookie).

const BASE = '/api';

async function req<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: 'include',
    headers: body != null ? { 'Content-Type': 'application/json' } : {},
    body: body != null ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return undefined as T;

  const data = await res.json();
  if (!res.ok) {
    const msg = typeof data?.error === 'string' ? data.error : `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}

const get    = <T>(path: string)              => req<T>('GET',    path);
const post   = <T>(path: string, body?: unknown) => req<T>('POST',   path, body);
const put    = <T>(path: string, body?: unknown) => req<T>('PUT',    path, body);
const patch  = <T>(path: string, body?: unknown) => req<T>('PATCH',  path, body);
const del    = <T>(path: string, body?: unknown) => req<T>('DELETE', path, body);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiUser {
  id: number;
  login: string;
  email: string;
  role: 'admin' | 'dealer' | 'collector';
  createdAt: string;
}

export interface ApiLot {
  id: string; title: string; description: string;
  price?: number; bidMin?: number; bidMax?: number; bidsCount: number;
  format: 'fixed' | 'auction'; status: 'active' | 'sold';
  imageUrl: string; themeId: string; groupId: string;
  sectionType: 'auction' | 'exclusive' | 'liquidation'; createdAt: string;
}

export interface ApiTheme  { id: string; slug: string; name: string; imageUrl: string; }
export interface ApiGroup  { id: string; themeId: string; name: string; }
export interface ApiNews   { id: string; date: string; title: string; imageUrl: string; }

export interface ApiForumCategory {
  id: string; title: string; description: string; icon: string;
  accessRoles: string[]; isReadOnly: boolean;
  threadCount: number; postCount: number; unread: number;
}

export interface ApiForumThread {
  id: number; categoryId: string; title: string;
  authorLogin: string; authorRole: string;
  createdAt: string; isPinned: boolean; isLocked: boolean; views: number;
  replyCount: number; isBookmarked: boolean; hasNewPosts: boolean;
  lastPost: { authorLogin: string; authorRole: string; createdAt: string } | null;
  categoryTitle?: string;
}

export interface ApiForumPost {
  id: number; threadId: number;
  authorLogin: string; authorRole: string;
  createdAt: string; body: string;
  likes: number; isLiked: boolean; isOp: boolean;
  quotedPostId: number | null; editedAt: string | null;
  authorPostCount: number;
}

export interface ApiCartItem {
  id: number; userId: number; lotId: string; addedAt: string;
  lot: ApiLot;
}

export interface ApiInvite {
  id: number; token: string; role: string; label: string;
  used: boolean; usedAt: string | null; expiresAt: string | null; createdAt: string;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const auth = {
  me:       ()                                         => get<ApiUser>('/auth/me'),
  login:    (login: string, password: string)          => post<ApiUser>('/auth/login', { login, password }),
  register: (token: string, login: string, email: string, password: string) =>
              post<ApiUser>('/auth/register', { token, login, email, password }),
  logout:   ()                                         => post<void>('/auth/logout'),
  setRole:  (role: string)                             => patch<ApiUser>('/auth/me', { role }),
};

// ─── Catalog ──────────────────────────────────────────────────────────────────

export const catalog = {
  themes:       ()          => get<ApiTheme[]>('/catalog/themes'),
  theme:        (id: string) => get<ApiTheme>(`/catalog/themes/${id}`),
  themeGroups:  (id: string) => get<ApiGroup[]>(`/catalog/themes/${id}/groups`),
  group:        (id: string) => get<ApiGroup>(`/catalog/groups/${id}`),
  lots:         (params?: { section?: string; themeId?: string; groupId?: string }) => {
    const qs = new URLSearchParams(Object.entries(params ?? {}).filter(([, v]) => v) as [string, string][]).toString();
    return get<ApiLot[]>(`/catalog/lots${qs ? `?${qs}` : ''}`);
  },
  lot:          (id: string) => get<ApiLot>(`/catalog/lots/${id}`),
};

// ─── News ─────────────────────────────────────────────────────────────────────

export const newsApi = {
  list: () => get<ApiNews[]>('/catalog/news'),
};

// ─── Forum ────────────────────────────────────────────────────────────────────

export const forum = {
  categories:      ()                              => get<ApiForumCategory[]>('/forum/categories'),
  threads:         (catId: string, sort = 'latest') => get<ApiForumThread[]>(`/forum/categories/${catId}/threads?sort=${sort}`),
  search:          (q: string)                     => get<ApiForumThread[]>(`/forum/threads?q=${encodeURIComponent(q)}`),
  thread:          (id: number)                    => get<ApiForumThread>(`/forum/threads/${id}`),
  posts:           (threadId: number)              => get<ApiForumPost[]>(`/forum/threads/${threadId}/posts`),
  bookmarks:       ()                              => get<(ApiForumThread & { categoryTitle: string })[]>('/forum/bookmarks'),

  createThread:    (catId: string, title: string, body: string) =>
                     post<ApiForumThread>(`/forum/categories/${catId}/threads`, { title, body }),
  addPost:         (threadId: number, body: string, quotedPostId?: number) =>
                     post<ApiForumPost>(`/forum/threads/${threadId}/posts`, { body, quotedPostId }),
  editPost:        (postId: number, body: string)  => put<ApiForumPost>(`/forum/posts/${postId}`, { body }),
  deletePost:      (postId: number)                => del<void>(`/forum/posts/${postId}`),
  likePost:        (postId: number)                => post<{ liked: boolean; likes: number }>(`/forum/posts/${postId}/like`),
  unlikePost:      (postId: number)                => del<{ liked: boolean; likes: number }>(`/forum/posts/${postId}/like`),
  bookmark:        (threadId: number)              => post<{ bookmarked: boolean }>(`/forum/threads/${threadId}/bookmark`),
  unbookmark:      (threadId: number)              => del<{ bookmarked: boolean }>(`/forum/threads/${threadId}/bookmark`),
  incrementViews:  (threadId: number)              => post<void>(`/forum/threads/${threadId}/views`),
  markSeen:        (threadId: number, postCount: number) =>
                     post<void>(`/forum/threads/${threadId}/seen`, { postCount }),
  togglePin:       (threadId: number, isPinned: boolean)  => patch<void>(`/forum/threads/${threadId}`, { isPinned }),
  toggleLock:      (threadId: number, isLocked: boolean)  => patch<void>(`/forum/threads/${threadId}`, { isLocked }),
};

// ─── Cart ─────────────────────────────────────────────────────────────────────

export const cart = {
  get:    ()               => get<ApiCartItem[]>('/cart'),
  add:    (lotId: string)  => post<ApiCartItem>('/cart', { lotId }),
  remove: (lotId: string)  => del<void>(`/cart/${lotId}`),
  clear:  ()               => del<void>('/cart'),
};

// ─── Invites ──────────────────────────────────────────────────────────────────

export const invites = {
  list:       ()                              => get<ApiInvite[]>('/invites'),
  create:     (role: string)                  => post<ApiInvite>('/invites', { role }),
  revoke:     (id: number)                    => del<void>(`/invites/${id}`),
  sendEmail:  (id: number, email: string)     => post<{ sent: boolean; to: string }>(`/invites/${id}/email`, { email }),
  check:      (token: string)                 => get<{ valid: boolean; role?: string; reason?: string }>(`/invites/check/${token}`),
};

// ─── Admin ────────────────────────────────────────────────────────────────────

export const admin = {
  users:      ()                              => get<ApiUser[]>('/admin/users'),
  setRole:    (userId: number, role: string)  => patch<ApiUser>(`/admin/users/${userId}`, { role }),
  deleteUser: (userId: number)                => del<void>(`/admin/users/${userId}`),
  stats:      ()                              => get<{ userCount: number; threadCount: number; postCount: number }>('/admin/stats'),
};
