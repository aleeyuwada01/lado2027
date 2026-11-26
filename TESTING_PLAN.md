# Testing & Verification Plan

## 1. Automated Unit Tests (`node:test` via `tsx`)
Executed via `npx --yes tsx --test src/lib/analytics.test.ts`:
- Verifies all 37 Nigerian jurisdictions (36 States + FCT) and exact 774 LGA count.
- Verifies all 21 RBAC roles, permission boundaries, and state/LGA geographic scoping.
- Verifies incident workflow transition guards and report verification state machine locks.
- Verifies real-time KPI calculation engine against dynamic operational datasets.
- Verifies CSV geographic import parser, state validation, and duplicate detection.

## 2. Security Rules Linting
- Executed via `npx eslint firestore.rules` enforcing `@firebase/eslint-plugin-security-rules`.

## 3. Build & Static Analysis
- `npm run build` (`vite build`) verifies full production bundling.
- `npm run lint` (`tsc --noEmit`) verifies strict TypeScript soundness across all modules.

## 4. End-to-End Browser Verification (Headless Chromium)
- Desktop (`1440x900`) and Mobile (`390x844`) responsive visual verification.
- Interactive journeys across Situation Room map drill-down, Geographic Operations 774-LGA search & Import Wizard, Incident creation & live KPI increment, Field Operations Mobile PWA + Offline Sync Queue, and Settings Branding & Demo Controls.
