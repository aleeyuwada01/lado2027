export type NavModuleId =
  | 'situation-room'
  | 'katsina-simulator'
  | 'voter-sentiment'
  | 'campaign-overview'
  | 'geographic-ops'
  | 'field-ops'
  | 'agents-volunteers'
  | 'call-center'
  | 'incidents'
  | 'events'
  | 'logistics'
  | 'organization'
  | 'polling-coverage'
  | 'election-day'
  | 'reports-analytics'
  | 'communications'
  | 'media-monitoring'
  | 'documents'
  | 'tasks'
  | 'security-audit'
  | 'settings-admin';

export type GeopoliticalZone =
  | 'North-West'
  | 'North-East'
  | 'North-Central'
  | 'South-West'
  | 'South-East'
  | 'South-South';

export type RoleName =
  | 'Platform Super Administrator'
  | 'Campaign Administrator'
  | 'Candidate / Executive Viewer'
  | 'Campaign Director'
  | 'Campaign Manager'
  | 'Situation Room Director'
  | 'State Coordinator'
  | 'LGA Coordinator'
  | 'Ward Coordinator'
  | 'Field Supervisor'
  | 'Polling Unit Agent'
  | 'Call Center Supervisor'
  | 'Call Center Operator'
  | 'Incident Manager'
  | 'Logistics Manager'
  | 'Events Manager'
  | 'Communications Manager'
  | 'Data Analyst'
  | 'Auditor'
  | 'Volunteer'
  | 'Read-Only Viewer';

export type IncidentStatus =
  | 'New'
  | 'Assigned'
  | 'Acknowledged'
  | 'Investigating'
  | 'Action Required'
  | 'Resolved'
  | 'Closed';

export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';

export type IncidentVerification = 'Unverified Report' | 'Allegation' | 'Verified Fact';

export type IncidentCategory =
  | 'Operational issue'
  | 'Personnel assistance'
  | 'Logistics failure'
  | 'Communication outage'
  | 'Safety concern'
  | 'Event disruption'
  | 'Equipment issue'
  | 'Infrastructure issue'
  | 'Report discrepancy'
  | 'General emergency'
  | 'Other';

export type FieldReportStatus =
  | 'Submitted'
  | 'Pending Review'
  | 'Under Verification'
  | 'Verified'
  | 'Rejected'
  | 'Requires Clarification';

export type DataAttributionLabel =
  | 'Campaign-Reported Data'
  | 'Unverified Data'
  | 'Verified Campaign Submission'
  | 'Official Published Source';

export type TaskStatus =
  | 'Backlog'
  | 'Pending'
  | 'Assigned'
  | 'In Progress'
  | 'Awaiting Approval'
  | 'Blocked'
  | 'Completed'
  | 'Cancelled';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type CallStatus = 'Waiting' | 'Active' | 'Open Case' | 'Escalated' | 'Resolved';

export type CallCategory =
  | 'General campaign inquiry'
  | 'Campaign office inquiry'
  | 'Volunteer inquiry'
  | 'Event inquiry'
  | 'Logistics inquiry'
  | 'Technical support'
  | 'Personnel assistance'
  | 'Safety concern'
  | 'Incident report'
  | 'General complaint'
  | 'Other';

export interface NigeriaState {
  code: string;
  name: string;
  capital: string;
  zone: GeopoliticalZone;
  lat: number;
  lng: number;
  mapX: number;
  mapY: number;
  lgas: string[];
}

export interface ImportedGeoUnit {
  id: string;
  stateCode: string;
  lga: string;
  ward: string;
  pollingUnitName: string;
  pollingUnitCode: string;
  sourceLabel: 'Official Imported Dataset' | 'Demo Sample Record';
  assignedAgentId?: string;
  importJobId?: string;
  isDemo?: boolean;
}

export interface GeoImportJob {
  id: string;
  fileName: string;
  format: 'CSV' | 'JSON' | 'GeoJSON';
  recordsImported: number;
  duplicatesSkipped: number;
  errorsCount: number;
  importedBy: string;
  importedAt: string;
  status: 'Completed' | 'Rolled Back';
}

export interface CampaignBranding {
  campaignName: string;
  candidateName: string;
  electionType: string;
  electionYear: string;
  headquarters: string;
  partyAffiliation: string;
  slogan: string;
  biography: string;
  primaryColor: string;
  accentColor: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  socialHandles: {
    x: string;
    facebook: string;
    instagram: string;
  };
  portraitDataUrl: string | null;
  campaignLogoDataUrl: string | null;
  partyLogoDataUrl: string | null;
  bannerDataUrl: string | null;
  electionDayMode: boolean;
  setupCompleted: boolean;
}

export interface CampaignUser {
  uid: string;
  displayName: string;
  email: string;
  role: RoleName;
  department: string;
  assignedStateCode: string | null;
  assignedLga: string | null;
  isAuthenticated: boolean;
}

export interface PersonnelRecord {
  id: string;
  fullName: string;
  role: RoleName;
  orgLevel: 'HQ' | 'State' | 'Senatorial' | 'LGA' | 'Ward' | 'Polling Unit';
  department: string;
  stateCode: string;
  lga: string;
  ward?: string;
  pollingUnit?: string;
  supervisor: string;
  phone: string;
  status: 'Active' | 'Deployed' | 'Standby' | 'Inactive';
  trainingStatus: 'Completed' | 'In Progress' | 'Scheduled' | 'Not Started';
  checkedIn: boolean;
  lastCheckInAt?: string;
  registeredAt: string;
  isVolunteer: boolean;
  isFieldAgent: boolean;
  isDemo?: boolean;
}

export interface FieldCheckIn {
  id: string;
  personnelId: string;
  personnelName: string;
  stateCode: string;
  lga: string;
  ward: string;
  status: 'Checked In' | 'Checked Out' | 'Assistance Requested' | 'Connectivity Issue';
  operationalNote: string;
  locationShared: boolean;
  coordinates?: { lat: number; lng: number };
  photoPreview?: string;
  timestamp: string;
  syncStatus: 'Synced' | 'Pending Offline Sync';
  isDemo?: boolean;
}

export interface FieldReport {
  id: string;
  refCode: string;
  reportType: 'Routine Situation' | 'Polling Unit Opening' | 'Accreditation Update' | 'Logistics Status' | 'Closing & Counting Observation' | 'Community Engagement';
  stateCode: string;
  lga: string;
  ward: string;
  pollingUnit: string;
  summary: string;
  accreditedCount?: number;
  dataLabel: DataAttributionLabel;
  status: FieldReportStatus;
  submitterName: string;
  submitterUid: string;
  reviewerName?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: 'Synced' | 'Pending Offline Sync';
  isDemo?: boolean;
}

export interface IncidentTimelineEntry {
  id: string;
  actor: string;
  note: string;
  status: IncidentStatus;
  timestamp: string;
}

export interface IncidentRecord {
  id: string;
  refCode: string;
  title: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  status: IncidentStatus;
  verificationStatus: IncidentVerification;
  stateCode: string;
  lga: string;
  ward: string;
  description: string;
  reporterName: string;
  reporterUid: string;
  assignedTeam: string;
  assignedSupervisor: string;
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
  responseMinutes?: number;
  timeline: IncidentTimelineEntry[];
  isDemo?: boolean;
}

export interface CallRecord {
  id: string;
  refCode: string;
  direction: 'incoming' | 'outgoing';
  callerName: string;
  callerPhone: string;
  consentRecorded: boolean;
  category: CallCategory;
  subject: string;
  description: string;
  operatorName: string;
  operatorUid: string;
  department: string;
  stateCode: string;
  lga: string;
  priority: IncidentSeverity;
  status: CallStatus;
  handlingSeconds: number;
  followUpRequired: boolean;
  escalatedTo?: string;
  resolution?: string;
  createdAt: string;
  updatedAt: string;
  isDemo?: boolean;
}

export interface CallOperatorStatus {
  id: string;
  name: string;
  station: string;
  status: 'Available' | 'On Call' | 'Wrap-Up' | 'Offline';
  callsHandledToday: number;
  avgHandlingSeconds: number;
}

export interface CampaignTask {
  id: string;
  title: string;
  description: string;
  department: string;
  supervisor: string;
  assigneeName: string;
  stateCode: string;
  lga?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  ownerUid: string;
  subtasks: { id: string; label: string; done: boolean }[];
  createdAt: string;
  updatedAt: string;
  isDemo?: boolean;
}

export interface CampaignEvent {
  id: string;
  title: string;
  eventType:
    | 'Campaign Rally'
    | 'Town Hall'
    | 'Community Meeting'
    | 'Stakeholder Meeting'
    | 'Press Event'
    | 'Volunteer Training'
    | 'Internal Strategy';
  date: string;
  time: string;
  stateCode: string;
  lga: string;
  venue: string;
  organizer: string;
  responsibleTeam: string;
  estimatedAttendance: number;
  budgetNgn: number;
  status: 'Planned' | 'Confirmed' | 'In Progress' | 'Completed' | 'Postponed';
  equipmentRequired: string[];
  checklist: { id: string; item: string; completed: boolean }[];
  notes: string;
  isDemo?: boolean;
}

export interface VehicleAsset {
  id: string;
  registration: string;
  vehicleType: 'Command SUV' | 'Field Hilux 4x4' | 'Campaign Bus' | 'Logistics Van' | 'Media Truck' | 'Motorcycle Dispatch';
  driverName: string;
  stateCode: string;
  assignedUnit: string;
  availability: 'Available' | 'On Trip' | 'Maintenance';
  fuelLitresLogged: number;
  lastServiceDate: string;
  currentTrip?: string;
  isDemo?: boolean;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'Campaign Materials' | 'Communication Equipment' | 'Office Equipment' | 'Event Materials' | 'Field Supplies';
  quantity: number;
  reorderLevel: number;
  unit: string;
  storageLocation: string;
  stateCode: string;
  supplier: string;
  lastUpdated: string;
  isDemo?: boolean;
}

export interface LogisticsRequest {
  id: string;
  refCode: string;
  requesterName: string;
  department: string;
  stateCode: string;
  lga: string;
  itemRequested: string;
  quantity: number;
  priority: IncidentSeverity;
  purpose: string;
  approvalStatus: 'Pending Approval' | 'Approved' | 'Rejected';
  fulfillmentStatus: 'Queued' | 'Dispatched' | 'Delivered';
  assignedOfficer: string;
  createdAt: string;
  isDemo?: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  scope: 'National HQ' | 'Department' | 'State' | 'LGA' | 'Ward';
  targetValue: string;
  channels: ('In-App' | 'Email' | 'SMS' | 'WhatsApp')[];
  priority: 'Standard' | 'Priority' | 'Urgent';
  authorName: string;
  createdAt: string;
  readCount: number;
  targetRecipients: number;
  consentVerified: boolean;
  isDemo?: boolean;
}

export interface MediaSource {
  id: string;
  name: string;
  type: 'National Press' | 'Regional Broadcast' | 'RSS Feed' | 'Official Campaign Account' | 'Public Release';
  url: string;
  active: boolean;
}

export interface MediaItem {
  id: string;
  headline: string;
  sourceName: string;
  sourceUrl: string;
  classification: 'Confirmed Reporting' | 'Public Statement' | 'Commentary' | 'Unverified Information';
  topic: string;
  stateCode: string;
  reviewStatus: 'Pending Review' | 'Reviewed' | 'Flagged for Comms';
  summary: string;
  publishedAt: string;
  isDemo?: boolean;
}

export interface CampaignDocument {
  id: string;
  title: string;
  category: 'Operations SOP' | 'Training Manual' | 'Legal & Compliance' | 'Geographic Dataset' | 'Briefing Pack' | 'Logistics Manifest';
  department: string;
  accessLevel: 'Executive Only' | 'Coordinators & Above' | 'All Authorized Staff';
  version: string;
  uploadedBy: string;
  uploadedAt: string;
  fileSizeLabel: string;
  summary: string;
  isDemo?: boolean;
}

export interface AlertRule {
  id: string;
  name: string;
  triggerType: string;
  severity: IncidentSeverity;
  recipients: string;
  channels: ('In-App' | 'Email' | 'SMS')[];
  escalationMinutes: number;
  enabled: boolean;
}

export interface AuditLogEntry {
  id: string;
  actorUid: string;
  actorName: string;
  actorRole: string;
  action: string;
  entity: string;
  entityId: string;
  summary: string;
  previousValue?: string;
  newValue?: string;
  source: 'Web Command' | 'Mobile Field' | 'System';
  timestamp: string;
  isDemo?: boolean;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  severity: IncidentSeverity;
  module: NavModuleId;
  read: boolean;
  timestamp: string;
}

export interface OfflineQueueItem {
  id: string;
  type: 'checkin' | 'field_report' | 'incident';
  summary: string;
  payload: Record<string, unknown>;
  queuedAt: string;
}
