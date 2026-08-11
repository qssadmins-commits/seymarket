# SeyMarket v2

A redesigned, rebuilt version of SeyMarket — a marketplace for small Seychelles
sellers. Same purpose as the original (buyers browse and search shops/products
in one place instead of scrolling Instagram/WhatsApp), rebuilt with a modern
stack and a more premium visual identity.

## What changed from v1

- **Frontend rebuilt** as a React (Vite) single-page app with React Router,
  instead of multiple static HTML pages + vanilla JS per page.
- **Styling rebuilt** with Tailwind CSS, keeping the teal / spice(coral) /
  sand "island market" identity from v1 but refined: deeper teal, a warmer
  sand, Fraunces + Public Sans + IBM Plex Mono typography, soft shadows,
  and a signature **market price-tag** treatment on every price (a small
  rotated tag with a punch-hole, echoing a physical market stall tag).
- **Backend rebuilt** as a clean Express + better-sqlite3 JSON API (same
  data model and routes design as v1: `sellers`, `products`, `admins`
  tables; session auth for sellers and a separate admin role), now
  decoupled from the frontend and serving `/api/*` only, with CORS for
  local dev and static-serving the built frontend in production.
- Feature set is unchanged on purpose (see original scope notes below) —
  this was a redesign, not a scope change.

## Project structure

```
seymarket-v2/
├── server/         Express + SQLite API
│   ├── server.js
│   ├── db/database.js       schema + seed data (5 shops, 13 products, 1 admin)
│   └── routes/               auth.js, products.js, shops.js, admin.js, middleware.js
└── client/         React + Vite + Tailwind frontend
    └── src/
        ├── pages/            Home, Shop, Product, Dashboard, Admin
        ├── components/       Header, Footer, ProductCard
        └── lib/               api.js (fetch wrapper), AuthContext.jsx
```

## Running it locally

Requires Node.js v18+.

**1. Start the API server** (seeds the database on first run):

```bash
cd server
npm install
npm start
```

Runs at `http://localhost:3000`.

**2. Start the frontend dev server** (in a second terminal):

```bash
cd client
npm install
npm run dev
```

Runs at `http://localhost:5173` and proxies `/api` and `/uploads` requests
to the server above.

Open **http://localhost:5173**.

### Demo logins

- **Seller dashboard:** `take5@example.com` / `demo1234` (or any seeded
  shop email — see `server/db/database.js`), or click "Create a shop" to
  sign up fresh.
- **Admin panel** at `/admin`: `admin@seymarket.com` / `admin1234`. As in
  v1, there's no nav link to it — that's intentional.

## Building for production (single server, one process)

```bash
cd client
npm install
npm run build

cd ../server
npm install
cp -r ../client/dist public-build
npm start
```

With `server/public-build` present, the Express server serves the built
React app directly, so you only need `http://localhost:3000` and no second
process or CORS. Regenerate `public-build` any time you change the client.
