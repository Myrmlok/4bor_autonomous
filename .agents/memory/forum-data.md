---
name: Forum data model
description: How forum categories, threads, posts are stored and fetched
---

## Categories
- **Static** — defined in both backend (routes/forum.ts CATEGORIES array) and frontend (ForumContext.tsx FORUM_CATEGORIES)
- Not stored in DB; must keep both in sync if categories change

## DB tables (lib/db/src/schema/index.ts)
- forum_threads: id, category_id, title, author_id, is_pinned, is_locked, views, created_at, updated_at
- forum_posts: id, thread_id, author_id, body, quoted_post_id, is_op, edited_at, created_at
- post_likes: (post_id, user_id) PK
- thread_bookmarks: (thread_id, user_id) PK
- thread_seen: (thread_id, user_id) PK + post_count, updated_at

## Frontend data fetching
- React Query (@tanstack/react-query) used in all three forum pages
- ForumContext provides only mutation helpers and static FORUM_CATEGORIES
- Query keys: ['forum-categories'], ['forum-threads', catId, sort], ['forum-posts', threadId], ['forum-thread', threadId], ['forum-bookmarks'], ['forum-search', q]

**Why:** Moved from localStorage-based ForumContext state to React Query + API to get real persistence and multi-user sync.
