# MenuVerse

MenuVerse is a mobile-first AR menu SaaS starter with:

- a direct public restaurant home page at `/`
- login and signup flows
- JWT cookie authentication
- role-aware dashboard pages with sidebar navigation
- Mongo-ready persistence plus a dev fallback
- seeded admin and owner accounts from env
- QR export and WebAR-ready item previews

## Main routes

- `/` public restaurant menu
- `/login`
- `/signup`
- `/dashboard`
- `/dashboard/profile`
- `/dashboard/branches`
- `/dashboard/menu`
- `/dashboard/qr`
- `/dashboard/users` admin only

## Stack

- Next.js 16 App Router
- React 19
- Tailwind CSS 4
- Framer Motion
- Mongoose
- `jose` + JWT cookies
- `bcryptjs`
- QRCode
- `@google/model-viewer`

## Setup

1. Copy `.env.example` to `.env.local`
2. Set your values
3. Run:

```bash
npm install
npm run seed
npm run dev
```

Open `http://localhost:3000`.

## Seeded accounts

The seed reads from env and creates:

- one admin user via `ADMIN_*`
- one owner user via `SEED_OWNER_*`
- one default restaurant via `SEED_RESTAURANT_NAME` and `NEXT_PUBLIC_DEFAULT_RESTAURANT_SLUG`

If `MONGODB_URI` is unset, the app falls back to an in-memory dev store so auth and dashboard flows still work locally.

## Implemented

- public restaurant page on the home route with 3-column medium cards
- login and signup
- JWT cookie session auth
- protected dashboard layout with sidebar links
- overview, profile, branches, menu, QR, and users pages
- admin user creation
- restaurant, branch, timings, category, and menu item editing
- Mongo-backed models and seed flow
