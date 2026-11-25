# Deployment & Operations Guide

## Prerequisites
- Node.js 22+ (configured for `24.x` on Vercel)
- Provisioned Firebase project configuration in `/firebase-applet-config.json`
- Deployed Firestore security rules (`/firestore.rules`)

## Local & Production Build Commands
- Install dependencies: `npm ci` (or `npm install`)
- Type-check: `npm run lint`
- Run unit tests: `npx tsx --test src/lib/analytics.test.ts src/lib/electionSimulator.test.ts src/lib/voterSentiment.test.ts`
- Lint Firestore rules: `npx eslint firestore.rules`
- Production bundle: `npm run build` (outputs to `dist/`)
- Preview production build locally: `npm run preview`
- Start dev server (port 3000): `npm run dev`

## Vercel Deployment Guide
This repository is pre-configured for zero-config deployment on Vercel via `/vercel.json`, `/index.html`, and `/vite.config.ts`:

1. **Build & Output Settings** (`/vercel.json`):
   - Framework preset: `vite`
   - Install command: `npm install --no-audit --no-fund` (cross-platform safe across Windows/macOS/Linux optional native dependencies)
   - Build command: `npm run build`
   - Output directory: `dist`
   - URL normalization: `cleanUrls: true`, `trailingSlash: false`
2. **Redirect Rules & SPA Fallback** (`/vercel.json`):
   - Shorthand redirects: `/home` → `/`, `/command` & `/dashboard` → `/situation-room`, `/simulator` & `/katsina` → `/katsina-simulator`, `/sentiment` → `/voter-sentiment`, `/geo` → `/geographic-ops`, `/field` & `/mobile` → `/field-ops`, `/admin` & `/settings` → `/settings-admin`.
   - Internal AI Studio scratch path `/assets/aistudio/*` is excluded from `dist/` at build time and redirected to `/`.
   - SPA fallback rewrite maps all non-asset routes to `/index.html`, paired with client-side route synchronization in `/src/App.tsx` so direct links and refreshes on any module path (e.g. `/katsina-simulator`, `/voter-sentiment`, `/situation-room`) work seamlessly.
3. **Environment Variables (Vercel Project Settings)**:
   - `VITE_MAPBOX_ACCESS_TOKEN` *(optional)*: When set (`pk.*`), maps render official Mapbox styles (`dark-v11` / `light-v11`); otherwise maps fall back automatically to MapLibre GL with Esri ArcGIS tiles.
4. **Firebase Authorized Domains (Required for Live Google Sign-In)**:
   - After deploying to Vercel, open **Firebase Console → Authentication → Settings → Authorized domains** and add your `*.vercel.app` deployment domain and any custom domain so `signInWithPopup` works in production.

## First-Run Production Go-Live Checklist
1. Sign in via Google using the bootstrapped Super Administrator account (`Aleeyuwada01@gmail.com`).
2. Launch the **Campaign Initial Setup Wizard** from the top operational strip or **Settings & Administration**.
3. Upload official authorized campaign logo, party logo, and candidate portrait; enter official party affiliation and approved slogan.
4. Use **Demo Dataset Controls** → **Clear Demo Data** to remove clearly marked `DEMO DATA` evaluation records.
5. Import official ward and polling unit datasets via **Geographic Operations** → **Geo Import Wizard**.
6. Review `/firestore.rules` before expanding staff access across states and LGAs.
