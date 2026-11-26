# Security Architecture & Firestore Rules

## Enforcement Pillars (`/firestore.rules` & `/security_spec.md`)
1. **Default-Deny Posture**: Every path not explicitly authorized is denied.
2. **Verified Identity Enforcement**: Cloud writes and sensitive reads require `request.auth != null && request.auth.token.email_verified == true`.
3. **PII Isolation**: User emails and private contact records live exclusively under `/users/{userId}/private/{docId}` and are never exposed in public collections.
4. **Immutable Audit Trail**: `/audit_logs/{logId}` enforces `allow update, delete: if false` so historical governance records cannot be altered or erased.
5. **Terminal State Locking**: Closed incidents and verified/rejected field reports prevent unauthorized status regression.
6. **Zero-Read Scoped List Queries**: `allow list` rules avoid `get()`/`exists()` database lookups and require owner-scoped queries or verified bootstrapped admin identity.
7. **Schema & Timestamp Validation**: Every write validates field types, string lengths, enum allowlists, and `request.time` server timestamps.

## Validation
- Static rules verification via `npx eslint firestore.rules` (`@firebase/eslint-plugin-security-rules`) passes with 0 errors and 0 warnings.
- Client-side RBAC matrix (`src/lib/rbac.ts`) and workflow guards are unit-tested in `src/lib/analytics.test.ts`.
