# Security Specification — Yakubu Lado Dan Marke Campaign Command Platform

## 1. Data Invariants
1. **Default-Deny Gate**: Every path not explicitly matched is denied (`allow read, write: if false`).
2. **Email Verification Mandate**: All write operations require `request.auth != null && request.auth.token.email_verified == true`.
3. **PII Isolation**: Private user fields (`email`, `phone`, `emergencyContact`) live exclusively in `/users/{userId}/private/{docId}`, readable and writable only by the owner (`request.auth.uid == userId`) or a verified platform admin.
4. **No Self-Assigned Privileges**: Users cannot set `role` to an administrative tier on registration and cannot modify their own `role` field on update; only verified platform admins may mutate `/admins/{adminUid}` or assign elevated roles.
5. **Immutable Audit Trail**: Documents in `/audit_logs/{logId}` are strictly append-only (`allow update, delete: if false`), must set `actorUid == request.auth.uid`, and require server timestamp `createdAt == request.time`.
6. **Terminal State Locking**: Once an Incident reaches `Closed`, a FieldReport reaches `Verified` or `Rejected`, or a Task reaches `Completed` or `Cancelled`, non-admin updates are blocked.
7. **Temporal & Identity Integrity**: All `createdAt` fields must equal `request.time` on create and remain immutable on update; `updatedAt` must equal `request.time` on update; owner/reporter/submitter/operator UIDs must equal `request.auth.uid` on create and remain immutable on update.
8. **Scoped List Queries**: Every `allow list` rule evaluates `resource.data` against `request.auth.uid` or admin status — never blanket `isSignedIn()`.

## 2. The "Dirty Dozen" Adversarial Payloads (Must Return PERMISSION_DENIED)
1. **Shadow Field Injection on Incident Create**: Adding `isVerifiedOverride: true` to `/incidents/inc-1` -> Rejected by `keys().hasOnly(...)`.
2. **Identity Spoofing on Field Report**: Submitting `submitterUid: "other-uid"` as `user-a` -> Rejected by `submitterUid == request.auth.uid`.
3. **Self-Privilege Escalation**: Creating `/users/user-a` with `role: "Platform Super Administrator"` -> Rejected by role allowlist on self-create.
4. **Admin Email Spoofing**: Request with `email: "Aleeyuwada01@gmail.com"` and `email_verified: false` -> Rejected by `isAdmin()` requiring `email_verified == true`.
5. **Cross-User PII Read**: `user-b` attempting `get` on `/users/user-a/private/info` -> Rejected by owner/admin isolation.
6. **Audit Log Tampering**: Updating or deleting `/audit_logs/log-1` even by admin -> Rejected by `allow update, delete: if false`.
7. **Timestamp Forgery**: Creating a task with client-supplied `createdAt` instead of `request.time` -> Rejected by `incoming().createdAt == request.time`.
8. **ID Poisoning**: Writing to `/incidents/` with a 200-character ID or invalid characters (`../admin`) -> Rejected by `isValidId()`.
9. **Terminal State Mutation**: Non-admin editing a `Closed` incident -> Rejected by terminal status lock.
10. **Value Poisoning on Update**: Updating an incident `status` to a 500KB string or boolean -> Rejected because `isValidIncident(incoming())` wraps the update block.
11. **Owner Reassignment Attack**: Updating a task to change `ownerUid` -> Rejected by `incoming().ownerUid == existing().ownerUid`.
12. **Blanket Collection Scraping**: Non-admin listing `/calls` without scoping to `operatorUid == request.auth.uid` -> Rejected by `allow list` resource predicate.
