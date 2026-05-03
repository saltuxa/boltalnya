# Болтальня

«Болтальня» - серверный Next.js мессенджер для неформального общения. Просто болтаем.

## Стек

- Next.js 15 App Router, TypeScript, Tailwind CSS 4
- SQLite + Drizzle ORM
- NextAuth Credentials provider
- Socket.IO realtime
- PWA manifest + service worker через `next-pwa`
- Yarn 1 через Corepack

## Локальный запуск

```bash
corepack yarn install
copy .env.example .env.local
corepack yarn dev
```

Минимально нужен `AUTH_SECRET`. Для локальной разработки можно поставить любую длинную случайную строку.

## Команды

```bash
corepack yarn typecheck
corepack yarn test
corepack yarn build
```

## Деплой

Приложение требует Node.js сервер, потому что использует SQLite, NextAuth Credentials и Socket.IO.
Подойдут VPS, Render, Fly.io или Railway с persistent volume для файла SQLite.

Переменные окружения:

- `AUTH_SECRET`
- `AUTH_URL`
- `DATABASE_URL`
- `NEXT_PUBLIC_APP_URL`

## Auth connector

Текущий коннектор авторизации - встроенный `login/password`:

- `POST /api/register` создает пользователя;
- `POST /api/auth/callback/credentials` используется NextAuth для входа;
- пароль хранится как PBKDF2-хеш.

Внешние OAuth-коннекторы можно добавить позже без изменения мессенджерного ядра.
