import type {
  CampaignUser,
  FieldReportStatus,
  IncidentStatus,
  RoleName,
} from '../types/campaign';

export interface RolePermissionEntry {
  role: RoleName;
  scope: 'National' | 'State' | 'LGA' | 'Ward' | 'Assigned Unit';
  read: boolean;
  write: boolean;
  approve: boolean;
  exportData: boolean;
  admin: boolean;
  viewSensitivePii: boolean;
  description: string;
}

export const ROLE_PERMISSION_MATRIX: RolePermissionEntry[] = [
  { role: 'Platform Super Administrator', scope: 'National', read: true, write: true, approve: true, exportData: true, admin: true, viewSensitivePii: true, description: 'Full platform control, RBAC, branding, election-day mode, and audit access.' },
  { role: 'Campaign Administrator', scope: 'National', read: true, write: true, approve: true, exportData: true, admin: true, viewSensitivePii: true, description: 'Manages departments, user onboarding, settings, and geographic imports.' },
  { role: 'Candidate / Executive Viewer', scope: 'National', read: true, write: false, approve: false, exportData: true, admin: false, viewSensitivePii: false, description: 'Executive situation room and aggregated analytics dashboards.' },
  { role: 'Campaign Director', scope: 'National', read: true, write: true, approve: true, exportData: true, admin: false, viewSensitivePii: false, description: 'National strategic command, approvals, escalations, and announcements.' },
  { role: 'Campaign Manager', scope: 'National', read: true, write: true, approve: true, exportData: true, admin: false, viewSensitivePii: false, description: 'Day-to-day operational orchestration across all campaign departments.' },
  { role: 'Situation Room Director', scope: 'National', read: true, write: true, approve: true, exportData: true, admin: false, viewSensitivePii: false, description: 'Commands live situation room, incident escalations, and report verification.' },
  { role: 'State Coordinator', scope: 'State', read: true, write: true, approve: true, exportData: true, admin: false, viewSensitivePii: false, description: 'Scoped to assigned State; manages LGA coordinators, agents, and state incidents.' },
  { role: 'LGA Coordinator', scope: 'LGA', read: true, write: true, approve: false, exportData: false, admin: false, viewSensitivePii: false, description: 'Scoped to assigned LGA; oversees ward coordinators and agent deployment.' },
  { role: 'Ward Coordinator', scope: 'Ward', read: true, write: true, approve: false, exportData: false, admin: false, viewSensitivePii: false, description: 'Scoped to assigned Ward; tracks polling unit agent check-ins and reports.' },
  { role: 'Field Supervisor', scope: 'LGA', read: true, write: true, approve: false, exportData: false, admin: false, viewSensitivePii: false, description: 'Supervises field teams, assists agents, and validates field check-ins.' },
  { role: 'Polling Unit Agent', scope: 'Assigned Unit', read: true, write: true, approve: false, exportData: false, admin: false, viewSensitivePii: false, description: 'Mobile field interface for check-in, operational reporting, and assistance alerts.' },
  { role: 'Call Center Supervisor', scope: 'National', read: true, write: true, approve: true, exportData: true, admin: false, viewSensitivePii: false, description: 'Oversees call queue, operator workload, and escalated call cases.' },
  { role: 'Call Center Operator', scope: 'Assigned Unit', read: true, write: true, approve: false, exportData: false, admin: false, viewSensitivePii: false, description: 'Logs calls, classifies inquiries, and escalates urgent cases.' },
  { role: 'Incident Manager', scope: 'National', read: true, write: true, approve: true, exportData: true, admin: false, viewSensitivePii: false, description: 'Triages incidents, verifies facts vs allegations, and coordinates resolution.' },
  { role: 'Logistics Manager', scope: 'National', read: true, write: true, approve: true, exportData: true, admin: false, viewSensitivePii: false, description: 'Manages fleet vehicles, inventory, fuel logs, and request approvals.' },
  { role: 'Events Manager', scope: 'National', read: true, write: true, approve: true, exportData: true, admin: false, viewSensitivePii: false, description: 'Schedules rallies, town halls, venues, checklists, and event budgets.' },
  { role: 'Communications Manager', scope: 'National', read: true, write: true, approve: true, exportData: false, admin: false, viewSensitivePii: false, description: 'Publishes scoped announcements and monitors public media feeds.' },
  { role: 'Data Analyst', scope: 'National', read: true, write: false, approve: false, exportData: true, admin: false, viewSensitivePii: false, description: 'Analyzes aggregate operational coverage and generates authorized reports.' },
  { role: 'Auditor', scope: 'National', read: true, write: false, approve: false, exportData: true, admin: false, viewSensitivePii: false, description: 'Read-only access to immutable audit trails, verification logs, and compliance.' },
  { role: 'Volunteer', scope: 'Assigned Unit', read: true, write: false, approve: false, exportData: false, admin: false, viewSensitivePii: false, description: 'Views assigned events, tasks, and public team announcements.' },
  { role: 'Read-Only Viewer', scope: 'Assigned Unit', read: true, write: false, approve: false, exportData: false, admin: false, viewSensitivePii: false, description: 'View-only access to authorized operational summaries.' },
];

export const PERMISSION_BY_ROLE: Record<RoleName, RolePermissionEntry> = Object.fromEntries(
  ROLE_PERMISSION_MATRIX.map((r) => [r.role, r])
) as Record<RoleName, RolePermissionEntry>;

export function canPerformAction(
  user: CampaignUser,
  action: 'read' | 'write' | 'approve' | 'exportData' | 'admin'
): boolean {
  const entry = PERMISSION_BY_ROLE[user.role];
  if (!entry) return false;
  return entry[action];
}

export function canAccessState(user: CampaignUser, stateCode: string): boolean {
  const entry = PERMISSION_BY_ROLE[user.role];
  if (!entry) return false;
  if (entry.scope === 'National') return true;
  if (!user.assignedStateCode) return true;
  return user.assignedStateCode === stateCode;
}

export function canAccessLga(user: CampaignUser, stateCode: string, lga: string): boolean {
  if (!canAccessState(user, stateCode)) return false;
  const entry = PERMISSION_BY_ROLE[user.role];
  if (entry.scope === 'National' || entry.scope === 'State') return true;
  if (!user.assignedLga) return true;
  return user.assignedLga.toLowerCase() === lga.toLowerCase();
}

export const INCIDENT_WORKFLOW_ORDER: IncidentStatus[] = [
  'New',
  'Assigned',
  'Acknowledged',
  'Investigating',
  'Action Required',
  'Resolved',
  'Closed',
];

export function getAllowedNextIncidentStatuses(
  current: IncidentStatus,
  isAdmin: boolean
): IncidentStatus[] {
  if (current === 'Closed' && !isAdmin) return [];
  const idx = INCIDENT_WORKFLOW_ORDER.indexOf(current);
  if (idx === -1) return ['New'];
  const next = INCIDENT_WORKFLOW_ORDER.slice(idx + 1);
  if (isAdmin) {
    return INCIDENT_WORKFLOW_ORDER.filter((s) => s !== current);
  }
  return next;
}

export const REPORT_REVIEW_TRANSITIONS: Record<FieldReportStatus, FieldReportStatus[]> = {
  Submitted: ['Pending Review', 'Under Verification'],
  'Pending Review': ['Under Verification', 'Requires Clarification'],
  'Under Verification': ['Verified', 'Rejected', 'Requires Clarification'],
  'Requires Clarification': ['Pending Review', 'Under Verification', 'Rejected'],
  Verified: [],
  Rejected: [],
};

export function canTransitionReportStatus(
  from: FieldReportStatus,
  to: FieldReportStatus,
  isAdmin: boolean
): boolean {
  if (isAdmin) return from !== to;
  return REPORT_REVIEW_TRANSITIONS[from]?.includes(to) ?? false;
}
