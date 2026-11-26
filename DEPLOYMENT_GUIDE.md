# Deployment & Operations Guide

## Prerequisites
- Node.js 20+
- Provisioned Firebase project configuration in `/firebase-applet-config.json`
- Deployed Firestore security rules (`/firestore.rules`)

## Local & Production Build Commands
- Install dependencies: `npm install`
- Type-check: `npm run lint`
- Run unit tests: `npx --yes tsx --test src/lib/analytics.test.ts`
- Production bundle: `npm run build`
- Start dev server (port 3000): `npm run dev`

## First-Run Production Go-Live Checklist
1. Sign in via Google using the bootstrapped Super Administrator account (`Aleeyuwada01@gmail.com`).
2. Launch the **Campaign Initial Setup Wizard** from the top operational strip or **Settings & Administration**.
3. Upload official authorized campaign logo, party logo, and candidate portrait; enter official party affiliation and approved slogan.
4. Use **Demo Dataset Controls** → **Clear Demo Data** to remove clearly marked `DEMO DATA` evaluation records.
5. Import official ward and polling unit datasets via **Geographic Operations** → **Geo Import Wizard**.
6. Review `/firestore.rules` before expanding staff access across states and LGAs.
