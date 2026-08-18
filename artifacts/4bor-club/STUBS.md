# Заглушки (Stubs) — 4BOR Клуб Frontend

Этот файл документирует **все места, где фронтенд использует моковые данные или заглушки**  
вместо реальных вызовов к бэкенду. При подключении API каждый пункт нужно заменить.

---

## 1. Аутентификация и сессии

### `src/contexts/AuthContext.tsx`
| Заглушка | Описание | Заменить на |
|---|---|---|
| `DEMO_ACCOUNTS` из `lib/demo-accounts.ts` | 3 захардкоженных аккаунта (dealer/collector/admin) | `POST /api/auth/login { login, password }` → JWT токен |
| `loginAs()` | Мгновенный вход без пароля (для демо) | Убрать из продакшена |
| `registerWithInvite()` | Регистрация только в `localStorage` | `POST /api/auth/register { token, login, email, password }` |
| `localStorage '4bor_session'` | Хранение сессии в JSON в браузере | `httpOnly` cookie с JWT или `Authorization: Bearer` |
| Prefix-based token parsing (`dealer-xxx`) | Роль определяется из префикса токена | Сервер должен возвращать роль по токену из БД |

### `src/lib/demo-accounts.ts`
- `DEMO_ACCOUNTS` — тестовые аккаунты с паролем `123`. **Удалить полностью** перед продакшеном.
- `DEMO_INVITES` — 2 предустановленных инвайт-токена. Заменить на хранение в БД.

---

## 2. Данные каталога

### `src/data/mock.ts`
Весь файл — заглушка. Содержит статические данные для:

| Экспорт | Что заменить | Эндпоинт |
|---|---|---|
| `themes` | Тематики каталога | `GET /api/themes` |
| `groups` | Группы внутри тематик | `GET /api/themes/:id/groups` |
| `lots` | Лоты (аукционы, эксклюзивы, ликвидация) | `GET /api/lots?section=&themeId=&groupId=` |
| `stickers` | Стикеры участников | `GET /api/stickers` |
| `newsList` | Новости клуба | `GET /api/news` |
| `activities` | Лента активности в сайдбаре | `GET /api/activity` или WebSocket |

---

## 3. Корзина

### `src/contexts/CartContext.tsx`
- Корзина хранится в `localStorage '4bor_cart'` — сбрасывается при смене браузера/устройства.  
- Заменить на `GET /api/cart`, `POST /api/cart/items`, `DELETE /api/cart/items/:id`.

### `src/pages/Cart.tsx`
- `handleCheckout()` — только отображает тост, не создаёт реальный заказ.  
- Заменить на `POST /api/orders { lotIds: [...] }`.
- Доставка: поле «Уточняется» — нет формы для указания адреса.

---

## 4. Лоты

### `src/pages/LotDetail.tsx`
| Заглушка | Описание | Заменить на |
|---|---|---|
| `activeBid` (local state) | Ставка хранится только в памяти страницы, сбрасывается при перезагрузке | `POST /api/lots/:id/bids { amount }` |
| `bidsCount` | Счётчик ставок из mock.ts, не обновляется | WebSocket / polling `GET /api/lots/:id/bids` |
| Похожие лоты | Отбираются из mock по `themeId` | `GET /api/lots/:id/related` |
| Статус лота | Всегда «Активен» | Поле `status` из API |

### `src/pages/Auctions.tsx` / `Exclusives.tsx` / `Liquidation.tsx` / `CatalogGroup.tsx`
- Все используют `lots` из `data/mock.ts`.
- Нет пагинации — заглушка отображает все лоты сразу.
- Заменить на `GET /api/lots?section=auction&page=1&limit=20`.

---

## 5. Стикеры

### `src/pages/Stickers.tsx`
| Заглушка | Описание | Заменить на |
|---|---|---|
| `stickersList` (local state) | Добавление/удаление только в памяти компонента | `POST /api/stickers`, `DELETE /api/stickers/:id` |
| Случайное изображение при создании | `themes[random].imageUrl` | Загрузка файла: `POST /api/stickers` с `multipart/form-data` |
| Кнопка «Предложить» | Отправляет только тост | `POST /api/stickers/:id/offers { message, price }` → уведомление автору |

### `src/components/layout/Sidebar.tsx`
- Счётчик «Сейчас в клубе» захардкожен как `24`.  
- Заменить на WebSocket / `GET /api/online-count` с polling.
- Стикеры в сайдбаре берутся из `data/mock.ts` (не из стейта Stickers.tsx).

---

## 6. Новости

### `src/pages/News.tsx` / `NewsDetail.tsx`
| Заглушка | Описание | Заменить на |
|---|---|---|
| `newsList` из `data/mock.ts` | 4 захардкоженные новости | `GET /api/news` |
| `ARTICLE_BODIES` в NewsDetail.tsx | Тела статей — статичные строки в коде | `GET /api/news/:id` → поле `body` |
| Комментарии | Заглушка «появится после подключения» | `GET /api/news/:id/comments`, `POST /api/news/:id/comments` |

---

## 7. Профиль

### `src/pages/Profile.tsx`
| Заглушка | Описание | Заменить на |
|---|---|---|
| `MOCK_BIDS` | Захардкоженная история ставок | `GET /api/users/me/bids` |
| `MOCK_ORDERS` | Захардкоженная история покупок | `GET /api/users/me/orders` |
| `setRole()` — «Демо-режим» | Переключение роли только в localStorage | Убрать в продакшене (роль назначает только admin) |

---

## 8. Поиск

### `src/components/layout/Header.tsx`
- Live-поиск работает по `lots` из `data/mock.ts` — только по названию, только по лотам.  
- Заменить на `GET /api/search?q=...` с дебаунсом (300ms).
- Нет поиска по тематикам, стикерам, новостям.

---

## 9. Администрирование

### `src/pages/admin/AdminUsers.tsx`
| Заглушка | Описание | Заменить на |
|---|---|---|
| `INITIAL_USERS` | 4 захардкоженных пользователя | `GET /api/admin/users` |
| Смена роли (dialog) | Применяется только в локальном стейте | `PATCH /api/admin/users/:id { role }` |
| Нет блокировки пользователя | Только смена роли | `PATCH /api/admin/users/:id { banned: true }` |

### `src/pages/admin/AdminInvites.tsx`
| Заглушка | Описание | Заменить на |
|---|---|---|
| `INITIAL_INVITES` (local state) | Инвайты хранятся только в компоненте | `GET /api/admin/invites` |
| Генерация инвайта | Создаётся только в local state | `POST /api/admin/invites { role }` → токен в БД |
| Отзыв инвайта | Только в local state | `DELETE /api/admin/invites/:id` |
| URL для копирования | `window.location.origin + /register/token` | Должен приходить с сервера |

### `src/pages/admin/AdminLots.tsx`
| Заглушка | Описание | Заменить на |
|---|---|---|
| `initialLots` из mock.ts | Все лоты — моковые | `GET /api/admin/lots` |
| Удаление | Только в local state | `DELETE /api/admin/lots/:id` |
| Кнопка «Добавить лот» | Показывает тост «В разработке» | Форма создания лота + `POST /api/admin/lots` |
| Нет редактирования | Нет кнопки Edit | `PATCH /api/admin/lots/:id` |

### `src/pages/admin/AdminDashboard.tsx`
- Счётчик «Участники: 148» — захардкожен.  
- Заменить на `GET /api/admin/stats`.

---

## 10. Лента активности

### `src/data/mock.ts` → `activities`
### `src/components/layout/Sidebar.tsx`
- 5 захардкоженных событий.  
- Заменить на WebSocket (`ws://api/ws/activity`) или Server-Sent Events.

---

## 11. Архив

### `src/pages/Home.tsx` (Quick Link «04 Архив»)
- Раздел полностью в разработке. Кнопка заблокирована (`cursor-not-allowed`).  
- Нужна страница `/archive` + `GET /api/lots?status=sold`.

---

## Приоритеты при подключении бэкенда

1. **Высокий**: Auth (JWT) + Лоты (API) + Корзина + Заказы
2. **Средний**: Стикеры (CRUD + уведомления) + Инвайты (БД) + Новости (body из БД)  
3. **Низкий**: Онлайн-счётчик (WebSocket) + Лента активности (WS) + Поиск (полнотекстовый) + Комментарии
