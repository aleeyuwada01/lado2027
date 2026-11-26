# System Architecture

## Frontend Architecture
- **Framework**: React 19 + TypeScript + Vite 8 + Tailwind CSS v4.
- **State & Sync Layer**: `src/context/CampaignContext.tsx` manages unified client state, offline sync queue (`localStorage`), real-time Firestore subscriptions (`onSnapshot`), automatic audit logging, and dynamic CSS custom properties (`--campaign-primary`, `--campaign-accent`).
- **Pure Computation Engine**: `src/lib/analytics.ts` computes all Executive Situation Room KPIs, state/zone operational summaries, call center metrics, CSV/JSON geo-import validation, and CSV export purely from live data collections (zero hardcoded KPI totals).
- **RBAC Engine**: `src/lib/rbac.ts` enforces the 21-role permission matrix (`ROLE_PERMISSION_MATRIX`), geographic scope checks (`canAccessState`, `canAccessLga`), and workflow state machine transitions.
- **PWA & Field Resilience**: `public/manifest.webmanifest` enables installable mobile PWA support; Field Operations includes a dedicated Mobile Field Agent Mode and offline queue with one-click synchronization.

## Cloud Persistence & Auth
- **Firebase Authentication**: Google Sign-In (`signInWithPopup`) with verified-email checks and bootstrapped Super Admin (`Aleeyuwada01@gmail.com`).
- **Cloud Firestore**: Enterprise Firestore database storing `settings/branding`, `users/{uid}`, isolated PII in `users/{uid}/private/info`, `incidents`, `field_reports`, `call_records`, `tasks`, and append-only `audit_logs`.
- **Error Handling**: `src/components/ErrorBoundary.tsx` and `handleFirestoreError()` surface actionable permission diagnostics cleanly.
