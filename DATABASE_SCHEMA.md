# Database Schema & Data Model

Defined in `/firebase-blueprint.json` and mirrored by strict TypeScript interfaces in `/src/types/campaign.ts`.

## Core Collections
- `/settings/branding` — Campaign identity, configurable placeholders (party, slogan), colors, contact info, and `electionDayMode` flag.
- `/users/{userId}` — Non-sensitive operational staff profile (`uid`, `displayName`, `role`, `department`, `assignedStateCode`, `assignedLga`, `status`).
- `/users/{userId}/private/info` — Strictly isolated PII subcollection (`email`, optional `phone`) readable only by the owner or verified Super Admin.
- `/incidents/{incidentId}` — Operational incident records with `refCode`, `category`, `severity`, `status` (7-stage workflow), `verificationStatus` (`Unverified Report`, `Allegation`, `Verified Fact`), geographic scope, and `reporterUid`.
- `/field_reports/{reportId}` — Campaign field submissions with mandatory `dataLabel` (`Campaign-Reported Data`, `Unverified Data`, `Verified Campaign Submission`, `Official Published Source`), verification status, and reviewer audit fields.
- `/call_records/{callId}` — Call Center inquiry records with explicit `consentRecorded` boolean, category, operator attribution, and escalation metadata.
- `/tasks/{taskId}` — Departmental workflow items with 8 statuses, priority, due date, and subtasks.
- `/audit_logs/{logId}` — Immutable append-only governance ledger (`allow update, delete: if false`).

## Verified Geographic Reference Dataset
- `/src/data/nigeriaGeo.ts` provides all 36 Nigerian States + FCT (37 jurisdictions) and all 774 verified LGAs, capitals, geopolitical zones, and map coordinates.
- Official wards and polling units are ingested via the Geographic Operations Import Wizard (`ImportedGeoUnit` + `GeoImportJob` with rollback support).
