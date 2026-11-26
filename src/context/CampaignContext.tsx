import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleAuthProvider,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import {
  computeExecutiveMetrics,
  computeStateSummaries,
  computeZoneSummaries,
  type ExecutiveMetrics,
  type StateOperationalSummary,
} from '../lib/analytics';
import {
  DEFAULT_BRANDING,
  DEMO_ALERT_RULES,
  DEMO_ANNOUNCEMENTS,
  DEMO_AUDIT_LOGS,
  DEMO_CALL_OPERATORS,
  DEMO_CALLS,
  DEMO_CHECKINS,
  DEMO_DEPARTMENTS,
  DEMO_DOCUMENTS,
  DEMO_EVENTS,
  DEMO_FIELD_REPORTS,
  DEMO_GEO_UNITS,
  DEMO_INCIDENTS,
  DEMO_INVENTORY,
  DEMO_LOGISTICS_REQUESTS,
  DEMO_MEDIA_ITEMS,
  DEMO_MEDIA_SOURCES,
  DEMO_NOTIFICATIONS,
  DEMO_PERSONNEL,
  DEMO_TASKS,
  DEMO_VEHICLES,
} from '../data/demoSeed';
import type {
  AlertRule,
  Announcement,
  AuditLogEntry,
  CallOperatorStatus,
  CallRecord,
  CampaignBranding,
  CampaignDocument,
  CampaignEvent,
  CampaignTask,
  CampaignUser,
  FieldCheckIn,
  FieldReport,
  FieldReportStatus,
  GeoImportJob,
  ImportedGeoUnit,
  IncidentRecord,
  IncidentStatus,
  IncidentVerification,
  InventoryItem,
  LogisticsRequest,
  MediaItem,
  MediaSource,
  NavModuleId,
  OfflineQueueItem,
  PersonnelRecord,
  RoleName,
  SystemNotification,
  TaskStatus,
  VehicleAsset,
} from '../types/campaign';

const BOOTSTRAPPED_ADMIN_EMAIL = 'Aleeyuwada01@gmail.com';
const OFFLINE_QUEUE_KEY = 'yldm_offline_sync_queue_v1';

interface CampaignContextValue {
  activeModule: NavModuleId;
  setActiveModule: (module: NavModuleId) => void;
  selectedStateCode: string;
  setSelectedStateCode: (code: string) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  fullscreenSituationRoom: boolean;
  setFullscreenSituationRoom: (v: boolean) => void;
  setupWizardOpen: boolean;
  setSetupWizardOpen: (v: boolean) => void;
  commandSearchOpen: boolean;
  setCommandSearchOpen: (v: boolean) => void;

  // Auth & RBAC
  currentUser: CampaignUser;
  authReady: boolean;
  firebaseSyncActive: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  switchDemoRole: (role: RoleName, stateCode?: string | null, lga?: string | null) => void;

  // Demo & Offline Mode
  hasDemoData: boolean;
  clearDemoData: () => void;
  reseedDemoData: () => void;
  isOfflineMode: boolean;
  setIsOfflineMode: (v: boolean) => void;
  offlineQueue: OfflineQueueItem[];
  syncOfflineQueue: () => void;

  // Data Collections
  branding: CampaignBranding;
  updateBranding: (patch: Partial<CampaignBranding>) => void;
  departments: string[];
  addDepartment: (name: string) => void;
  personnel: PersonnelRecord[];
  addPersonnel: (record: Omit<PersonnelRecord, 'id' | 'registeredAt'>) => void;
  updatePersonnelAssignment: (id: string, patch: Partial<PersonnelRecord>) => void;
  geoUnits: ImportedGeoUnit[];
  importGeoUnits: (
    units: Omit<ImportedGeoUnit, 'id' | 'importJobId'>[],
    meta: { fileName: string; format: 'CSV' | 'JSON' | 'GeoJSON'; duplicatesSkipped: number; errorsCount: number }
  ) => void;
  rollbackImportJob: (jobId: string) => void;
  assignAgentToGeoUnit: (unitId: string, agentId: string | undefined) => void;
  importJobs: GeoImportJob[];
  checkIns: FieldCheckIn[];
  submitCheckIn: (entry: Omit<FieldCheckIn, 'id' | 'timestamp' | 'syncStatus'>) => void;
  fieldReports: FieldReport[];
  submitFieldReport: (report: Omit<FieldReport, 'id' | 'refCode' | 'createdAt' | 'updatedAt' | 'syncStatus'>) => void;
  reviewFieldReport: (id: string, status: FieldReportStatus, reviewNotes: string) => void;
  incidents: IncidentRecord[];
  createIncident: (inc: Omit<IncidentRecord, 'id' | 'refCode' | 'createdAt' | 'updatedAt' | 'timeline'>) => void;
  updateIncident: (id: string, patch: { status?: IncidentStatus; verificationStatus?: IncidentVerification; resolutionNotes?: string; note: string }) => void;
  calls: CallRecord[];
  callOperators: CallOperatorStatus[];
  logCall: (call: Omit<CallRecord, 'id' | 'refCode' | 'createdAt' | 'updatedAt'>) => void;
  updateCallStatus: (id: string, status: CallRecord['status'], resolution?: string, escalatedTo?: string) => void;
  tasks: CampaignTask[];
  createTask: (task: Omit<CampaignTask, 'id' | 'createdAt' | 'updatedAt' | 'ownerUid'>) => void;
  updateTaskStatus: (id: string, status: TaskStatus) => void;
  toggleTaskSubtask: (taskId: string, subtaskId: string) => void;
  events: CampaignEvent[];
  createEvent: (evt: Omit<CampaignEvent, 'id'>) => void;
  toggleEventChecklistItem: (eventId: string, itemId: string) => void;
  vehicles: VehicleAsset[];
  addVehicle: (v: Omit<VehicleAsset, 'id'>) => void;
  updateVehicleAvailability: (id: string, availability: VehicleAsset['availability'], currentTrip?: string) => void;
  inventory: InventoryItem[];
  adjustInventoryStock: (id: string, delta: number) => void;
  logisticsRequests: LogisticsRequest[];
  createLogisticsRequest: (req: Omit<LogisticsRequest, 'id' | 'refCode' | 'createdAt' | 'approvalStatus' | 'fulfillmentStatus'>) => void;
  updateLogisticsRequest: (id: string, patch: Partial<Pick<LogisticsRequest, 'approvalStatus' | 'fulfillmentStatus'>>) => void;
  announcements: Announcement[];
  publishAnnouncement: (ann: Omit<Announcement, 'id' | 'createdAt' | 'readCount'>) => void;
  mediaSources: MediaSource[];
  mediaItems: MediaItem[];
  addMediaItem: (item: Omit<MediaItem, 'id' | 'publishedAt'>) => void;
  updateMediaReviewStatus: (id: string, status: MediaItem['reviewStatus']) => void;
  documents: CampaignDocument[];
  addDocument: (docItem: Omit<CampaignDocument, 'id' | 'uploadedAt'>) => void;
  alertRules: AlertRule[];
  toggleAlertRule: (id: string) => void;
  auditLogs: AuditLogEntry[];
  notifications: SystemNotification[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  // Computed Real-Time Analytics
  metrics: ExecutiveMetrics;
  stateSummaries: Record<string, StateOperationalSummary>;
  zoneSummaries: ReturnType<typeof computeZoneSummaries>;
}

const CampaignContext = createContext<CampaignContextValue | null>(null);

function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export const CampaignProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeModule, setActiveModule] = useState<NavModuleId>('situation-room');
  const [selectedStateCode, setSelectedStateCode] = useState<string>('KT');
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [fullscreenSituationRoom, setFullscreenSituationRoom] = useState<boolean>(false);
  const [setupWizardOpen, setSetupWizardOpen] = useState<boolean>(false);
  const [commandSearchOpen, setCommandSearchOpen] = useState<boolean>(false);

  const [authReady, setAuthReady] = useState<boolean>(false);
  const [firebaseSyncActive, setFirebaseSyncActive] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<CampaignUser>({
    uid: 'demo-director',
    displayName: 'Campaign Command (Demo Session)',
    email: 'demo.command@campaign-hq.example.ng',
    role: 'Platform Super Administrator',
    department: 'Situation Room & Intelligence',
    assignedStateCode: null,
    assignedLga: null,
    isAuthenticated: false,
  });

  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
  const [offlineQueue, setOfflineQueue] = useState<OfflineQueueItem[]>(() => {
    try {
      const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
      return raw ? (JSON.parse(raw) as OfflineQueueItem[]) : [];
    } catch {
      return [];
    }
  });

  // Operational state initialized with clearly marked DEMO DATA
  const [branding, setBranding] = useState<CampaignBranding>(DEFAULT_BRANDING);
  const [departments, setDepartments] = useState<string[]>(DEMO_DEPARTMENTS);
  const [personnel, setPersonnel] = useState<PersonnelRecord[]>(DEMO_PERSONNEL);
  const [geoUnits, setGeoUnits] = useState<ImportedGeoUnit[]>(DEMO_GEO_UNITS);
  const [importJobs, setImportJobs] = useState<GeoImportJob[]>([]);
  const [checkIns, setCheckIns] = useState<FieldCheckIn[]>(DEMO_CHECKINS);
  const [fieldReports, setFieldReports] = useState<FieldReport[]>(DEMO_FIELD_REPORTS);
  const [incidents, setIncidents] = useState<IncidentRecord[]>(DEMO_INCIDENTS);
  const [calls, setCalls] = useState<CallRecord[]>(DEMO_CALLS);
  const [callOperators] = useState<CallOperatorStatus[]>(DEMO_CALL_OPERATORS);
  const [tasks, setTasks] = useState<CampaignTask[]>(DEMO_TASKS);
  const [events, setEvents] = useState<CampaignEvent[]>(DEMO_EVENTS);
  const [vehicles, setVehicles] = useState<VehicleAsset[]>(DEMO_VEHICLES);
  const [inventory, setInventory] = useState<InventoryItem[]>(DEMO_INVENTORY);
  const [logisticsRequests, setLogisticsRequests] = useState<LogisticsRequest[]>(DEMO_LOGISTICS_REQUESTS);
  const [announcements, setAnnouncements] = useState<Announcement[]>(DEMO_ANNOUNCEMENTS);
  const [mediaSources] = useState<MediaSource[]>(DEMO_MEDIA_SOURCES);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(DEMO_MEDIA_ITEMS);
  const [documents, setDocuments] = useState<CampaignDocument[]>(DEMO_DOCUMENTS);
  const [alertRules, setAlertRules] = useState<AlertRule[]>(DEMO_ALERT_RULES);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(DEMO_AUDIT_LOGS);
  const [notifications, setNotifications] = useState<SystemNotification[]>(DEMO_NOTIFICATIONS);

  // Sync CSS custom properties for dynamic campaign branding colors
  useEffect(() => {
    document.documentElement.style.setProperty('--campaign-primary', branding.primaryColor);
    document.documentElement.style.setProperty('--campaign-accent', branding.accentColor);
  }, [branding.primaryColor, branding.accentColor]);

  // Sync Tailwind dark mode class
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Persist offline sync queue
  useEffect(() => {
    try {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(offlineQueue));
    } catch {
      // Ignore storage quota errors
    }
  }, [offlineQueue]);

  // Global keyboard shortcut Cmd/Ctrl + K for Command Search
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && fullscreenSituationRoom) {
        setFullscreenSituationRoom(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [fullscreenSituationRoom]);

  // Firebase Authentication & Live Firestore Subscriptions
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setFirebaseSyncActive(false);
        setAuthReady(true);
        return;
      }

      const isSuperAdmin =
        fbUser.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase() &&
        fbUser.emailVerified;

      const resolvedRole: RoleName = isSuperAdmin
        ? 'Platform Super Administrator'
        : 'Polling Unit Agent';

      setCurrentUser({
        uid: fbUser.uid,
        displayName: fbUser.displayName || fbUser.email || 'Authorized Staff',
        email: fbUser.email || '',
        role: resolvedRole,
        department: isSuperAdmin ? 'Executive Secretariat' : 'Field Operations',
        assignedStateCode: null,
        assignedLga: null,
        isAuthenticated: true,
      });
      setFirebaseSyncActive(true);
      setAuthReady(true);

      // Register user profile + isolated private info in Firestore if verified
      if (fbUser.emailVerified) {
        try {
          await setDoc(
            doc(db, 'users', fbUser.uid),
            {
              uid: fbUser.uid,
              displayName: (fbUser.displayName || 'Authorized User').slice(0, 120),
              role: isSuperAdmin ? 'Platform Super Administrator' : 'Polling Unit Agent',
              department: isSuperAdmin ? 'Executive Secretariat' : 'Field Operations',
              status: 'active',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
          await setDoc(
            doc(db, 'users', fbUser.uid, 'private', 'info'),
            {
              uid: fbUser.uid,
              email: (fbUser.email || '').slice(0, 160),
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        } catch (error) {
          console.warn('Profile sync notice:', error);
        }
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Scoped Firestore listeners when authenticated & verified
  useEffect(() => {
    if (!authReady || !currentUser.isAuthenticated || !auth.currentUser?.emailVerified) {
      return;
    }
    const uid = currentUser.uid;
    const isBootstrapped =
      currentUser.email.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase();

    const unsubscribers: Array<() => void> = [];

    // Branding listener
    unsubscribers.push(
      onSnapshot(
        doc(db, 'settings', 'branding'),
        (snap) => {
          if (snap.exists()) {
            const d = snap.data();
            setBranding((prev) => ({
              ...prev,
              campaignName: d.campaignName ?? prev.campaignName,
              candidateName: d.candidateName ?? prev.candidateName,
              electionType: d.electionType ?? prev.electionType,
              electionYear: d.electionYear ?? prev.electionYear,
              headquarters: d.headquarters ?? prev.headquarters,
              partyAffiliation: d.partyAffiliation ?? prev.partyAffiliation,
              slogan: d.slogan ?? prev.slogan,
              biography: d.biography ?? prev.biography,
              primaryColor: d.primaryColor ?? prev.primaryColor,
              accentColor: d.accentColor ?? prev.accentColor,
              contactEmail: d.contactEmail ?? prev.contactEmail,
              contactPhone: d.contactPhone ?? prev.contactPhone,
              electionDayMode: Boolean(d.electionDayMode),
            }));
          }
        },
        (error) => handleFirestoreError(error, OperationType.GET, 'settings/branding')
      )
    );

    // Incidents listener (strictly scoped to satisfy Pillar 8 rules)
    const incidentsQuery = isBootstrapped
      ? collection(db, 'incidents')
      : query(collection(db, 'incidents'), where('reporterUid', '==', uid));

    unsubscribers.push(
      onSnapshot(
        incidentsQuery,
        (snap) => {
          if (snap.empty) return;
          const liveIncidents: IncidentRecord[] = snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              refCode: String(data.refCode || d.id),
              title: String(data.title || ''),
              category: (data.category || 'Operational issue') as IncidentRecord['category'],
              severity: (data.severity || 'medium') as IncidentRecord['severity'],
              status: (data.status || 'New') as IncidentStatus,
              verificationStatus: (data.verificationStatus || 'Unverified Report') as IncidentVerification,
              stateCode: String(data.stateCode || 'KT'),
              lga: String(data.lga || ''),
              ward: String(data.ward || ''),
              description: String(data.description || ''),
              reporterName: String(data.reporterName || 'Authorized User'),
              reporterUid: String(data.reporterUid || uid),
              assignedTeam: String(data.assignedTeam || 'Situation Room'),
              assignedSupervisor: 'Situation Room Director',
              createdAt: data.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
              updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
              timeline: [],
              isDemo: false,
            };
          });
          setIncidents((prev) => {
            const demoOnly = prev.filter((item) => item.isDemo);
            const liveIds = new Set(liveIncidents.map((i) => i.id));
            return [...liveIncidents, ...demoOnly.filter((i) => !liveIds.has(i.id))];
          });
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'incidents')
      )
    );

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [authReady, currentUser.isAuthenticated, currentUser.uid, currentUser.email]);

  const appendAuditLog = (entry: Omit<AuditLogEntry, 'id' | 'actorUid' | 'actorName' | 'actorRole' | 'timestamp'>) => {
    const logId = makeId('aud');
    const newEntry: AuditLogEntry = {
      id: logId,
      actorUid: currentUser.uid,
      actorName: currentUser.displayName,
      actorRole: currentUser.role,
      timestamp: new Date().toISOString(),
      ...entry,
    };
    setAuditLogs((prev) => [newEntry, ...prev]);

    if (currentUser.isAuthenticated && auth.currentUser?.emailVerified) {
      void setDoc(doc(db, 'audit_logs', logId), {
        actorUid: currentUser.uid,
        actorName: currentUser.displayName.slice(0, 120),
        actorRole: currentUser.role.slice(0, 64),
        action: entry.action.slice(0, 80),
        entity: entry.entity.slice(0, 64),
        entityId: entry.entityId.slice(0, 128),
        summary: entry.summary.slice(0, 500),
        createdAt: serverTimestamp(),
      }).catch((err) => handleFirestoreError(err, OperationType.CREATE, `audit_logs/${logId}`));
    }
  };

  const pushNotification = (notif: Omit<SystemNotification, 'id' | 'read' | 'timestamp'>) => {
    setNotifications((prev) => [
      {
        id: makeId('not'),
        read: false,
        timestamp: new Date().toISOString(),
        ...notif,
      },
      ...prev,
    ]);
  };

  const signInWithGoogle = async () => {
    await signInWithPopup(auth, googleAuthProvider);
  };

  const signOutUser = async () => {
    await signOut(auth);
    setCurrentUser({
      uid: 'demo-director',
      displayName: 'Campaign Command (Demo Session)',
      email: 'demo.command@campaign-hq.example.ng',
      role: 'Platform Super Administrator',
      department: 'Situation Room & Intelligence',
      assignedStateCode: null,
      assignedLga: null,
      isAuthenticated: false,
    });
  };

  const switchDemoRole = (role: RoleName, stateCode: string | null = null, lga: string | null = null) => {
    setCurrentUser((prev) => ({
      ...prev,
      role,
      assignedStateCode: stateCode,
      assignedLga: lga,
    }));
    appendAuditLog({
      action: 'ROLE_PERSPECTIVE_SWITCH',
      entity: 'Session',
      entityId: currentUser.uid,
      summary: `Switched active operational role perspective to ${role}${stateCode ? ` (${stateCode})` : ''}.`,
      source: 'Web Command',
    });
  };

  const hasDemoData = useMemo(
    () =>
      personnel.some((p) => p.isDemo) ||
      incidents.some((i) => i.isDemo) ||
      fieldReports.some((r) => r.isDemo) ||
      geoUnits.some((u) => u.isDemo),
    [personnel, incidents, fieldReports, geoUnits]
  );

  const clearDemoData = () => {
    setPersonnel((prev) => prev.filter((x) => !x.isDemo));
    setGeoUnits((prev) => prev.filter((x) => !x.isDemo));
    setCheckIns((prev) => prev.filter((x) => !x.isDemo));
    setFieldReports((prev) => prev.filter((x) => !x.isDemo));
    setIncidents((prev) => prev.filter((x) => !x.isDemo));
    setCalls((prev) => prev.filter((x) => !x.isDemo));
    setTasks((prev) => prev.filter((x) => !x.isDemo));
    setEvents((prev) => prev.filter((x) => !x.isDemo));
    setVehicles((prev) => prev.filter((x) => !x.isDemo));
    setInventory((prev) => prev.filter((x) => !x.isDemo));
    setLogisticsRequests((prev) => prev.filter((x) => !x.isDemo));
    setAnnouncements((prev) => prev.filter((x) => !x.isDemo));
    setMediaItems((prev) => prev.filter((x) => !x.isDemo));
    setDocuments((prev) => prev.filter((x) => !x.isDemo));
    appendAuditLog({
      action: 'DEMO_DATA_CLEARED',
      entity: 'System',
      entityId: 'demo-dataset',
      summary: 'Cleared all demo sample records to prepare for production campaign operations.',
      source: 'Web Command',
    });
  };

  const reseedDemoData = () => {
    setPersonnel(DEMO_PERSONNEL);
    setGeoUnits(DEMO_GEO_UNITS);
    setCheckIns(DEMO_CHECKINS);
    setFieldReports(DEMO_FIELD_REPORTS);
    setIncidents(DEMO_INCIDENTS);
    setCalls(DEMO_CALLS);
    setTasks(DEMO_TASKS);
    setEvents(DEMO_EVENTS);
    setVehicles(DEMO_VEHICLES);
    setInventory(DEMO_INVENTORY);
    setLogisticsRequests(DEMO_LOGISTICS_REQUESTS);
    setAnnouncements(DEMO_ANNOUNCEMENTS);
    setMediaItems(DEMO_MEDIA_ITEMS);
    setDocuments(DEMO_DOCUMENTS);
    setNotifications(DEMO_NOTIFICATIONS);
    appendAuditLog({
      action: 'DEMO_DATA_RESEEDED',
      entity: 'System',
      entityId: 'demo-dataset',
      summary: 'Restored labeled DEMO DATA sample dataset across all campaign modules.',
      source: 'Web Command',
    });
  };

  const updateBranding = (patch: Partial<CampaignBranding>) => {
    setBranding((prev) => {
      const next = { ...prev, ...patch };
      if (currentUser.isAuthenticated && auth.currentUser?.emailVerified) {
        void setDoc(
          doc(db, 'settings', 'branding'),
          {
            campaignName: next.campaignName.slice(0, 140),
            candidateName: next.candidateName.slice(0, 120),
            electionType: next.electionType.slice(0, 80),
            electionYear: next.electionYear.slice(0, 10),
            headquarters: next.headquarters.slice(0, 160),
            partyAffiliation: next.partyAffiliation.slice(0, 120),
            slogan: next.slogan.slice(0, 180),
            biography: next.biography.slice(0, 2000),
            primaryColor: next.primaryColor.slice(0, 16),
            accentColor: next.accentColor.slice(0, 16),
            contactEmail: next.contactEmail.slice(0, 120),
            contactPhone: next.contactPhone.slice(0, 40),
            electionDayMode: next.electionDayMode,
            updatedBy: currentUser.uid,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        ).catch((err) => handleFirestoreError(err, OperationType.WRITE, 'settings/branding'));
      }
      return next;
    });
    appendAuditLog({
      action: 'BRANDING_UPDATED',
      entity: 'CampaignBranding',
      entityId: 'branding',
      summary: `Updated campaign configuration (${Object.keys(patch).join(', ')}).`,
      source: 'Web Command',
    });
  };

  const addDepartment = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || departments.includes(trimmed)) return;
    setDepartments((prev) => [...prev, trimmed]);
    appendAuditLog({
      action: 'DEPARTMENT_CREATED',
      entity: 'Department',
      entityId: trimmed,
      summary: `Created campaign department "${trimmed}".`,
      source: 'Web Command',
    });
  };

  const addPersonnel = (record: Omit<PersonnelRecord, 'id' | 'registeredAt'>) => {
    const id = makeId('per');
    const created: PersonnelRecord = {
      ...record,
      id,
      registeredAt: new Date().toISOString().slice(0, 10),
    };
    setPersonnel((prev) => [created, ...prev]);
    appendAuditLog({
      action: 'PERSONNEL_REGISTERED',
      entity: 'Personnel',
      entityId: id,
      summary: `Registered ${created.fullName} as ${created.role} in ${created.stateCode} (${created.lga}).`,
      source: 'Web Command',
    });
  };

  const updatePersonnelAssignment = (id: string, patch: Partial<PersonnelRecord>) => {
    setPersonnel((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    appendAuditLog({
      action: 'PERSONNEL_UPDATED',
      entity: 'Personnel',
      entityId: id,
      summary: `Updated personnel assignment fields: ${Object.keys(patch).join(', ')}.`,
      source: 'Web Command',
    });
  };

  const importGeoUnits = (
    units: Omit<ImportedGeoUnit, 'id' | 'importJobId'>[],
    meta: { fileName: string; format: 'CSV' | 'JSON' | 'GeoJSON'; duplicatesSkipped: number; errorsCount: number }
  ) => {
    const jobId = makeId('imp');
    const createdUnits: ImportedGeoUnit[] = units.map((u) => ({
      ...u,
      id: makeId('gu'),
      importJobId: jobId,
    }));
    setGeoUnits((prev) => [...createdUnits, ...prev]);
    setImportJobs((prev) => [
      {
        id: jobId,
        fileName: meta.fileName,
        format: meta.format,
        recordsImported: createdUnits.length,
        duplicatesSkipped: meta.duplicatesSkipped,
        errorsCount: meta.errorsCount,
        importedBy: currentUser.displayName,
        importedAt: new Date().toISOString(),
        status: 'Completed',
      },
      ...prev,
    ]);
    appendAuditLog({
      action: 'GEO_DATASET_IMPORTED',
      entity: 'GeoImportJob',
      entityId: jobId,
      summary: `Imported ${createdUnits.length} verified geographic records from ${meta.fileName} (${meta.duplicatesSkipped} duplicates skipped).`,
      source: 'Web Command',
    });
  };

  const rollbackImportJob = (jobId: string) => {
    setGeoUnits((prev) => prev.filter((u) => u.importJobId !== jobId));
    setImportJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status: 'Rolled Back' } : j)));
    appendAuditLog({
      action: 'GEO_IMPORT_ROLLED_BACK',
      entity: 'GeoImportJob',
      entityId: jobId,
      summary: `Rolled back imported geographic records for job ${jobId}.`,
      source: 'Web Command',
    });
  };

  const assignAgentToGeoUnit = (unitId: string, agentId: string | undefined) => {
    setGeoUnits((prev) => prev.map((u) => (u.id === unitId ? { ...u, assignedAgentId: agentId } : u)));
    appendAuditLog({
      action: 'AGENT_ASSIGNED_PU',
      entity: 'PollingUnit',
      entityId: unitId,
      summary: agentId ? `Assigned agent ${agentId} to polling unit ${unitId}.` : `Cleared agent assignment on ${unitId}.`,
      source: 'Web Command',
    });
  };

  const submitCheckIn = (entry: Omit<FieldCheckIn, 'id' | 'timestamp' | 'syncStatus'>) => {
    const id = makeId('chk');
    const now = new Date().toISOString();
    const record: FieldCheckIn = {
      ...entry,
      id,
      timestamp: now,
      syncStatus: isOfflineMode ? 'Pending Offline Sync' : 'Synced',
    };
    setCheckIns((prev) => [record, ...prev]);
    setPersonnel((prev) =>
      prev.map((p) =>
        p.id === entry.personnelId
          ? { ...p, checkedIn: entry.status !== 'Checked Out', lastCheckInAt: now }
          : p
      )
    );
    if (isOfflineMode) {
      setOfflineQueue((prev) => [
        {
          id,
          type: 'checkin',
          summary: `${entry.personnelName} — ${entry.status} (${entry.stateCode}/${entry.lga})`,
          payload: record as unknown as Record<string, unknown>,
          queuedAt: now,
        },
        ...prev,
      ]);
    }
    if (entry.status === 'Assistance Requested') {
      pushNotification({
        title: `Field Assistance Requested — ${entry.lga}`,
        message: `${entry.personnelName} requested immediate field assistance: ${entry.operationalNote}`,
        severity: 'critical',
        module: 'field-ops',
      });
    }
    appendAuditLog({
      action: 'FIELD_CHECKIN',
      entity: 'FieldCheckIn',
      entityId: id,
      summary: `${entry.personnelName} logged "${entry.status}" in ${entry.stateCode} / ${entry.lga}.`,
      source: 'Mobile Field',
    });
  };

  const submitFieldReport = (
    report: Omit<FieldReport, 'id' | 'refCode' | 'createdAt' | 'updatedAt' | 'syncStatus'>
  ) => {
    const id = makeId('rep');
    const refCode = `FR-2026-${String(fieldReports.length + 101)}`;
    const now = new Date().toISOString();
    const record: FieldReport = {
      ...report,
      id,
      refCode,
      createdAt: now,
      updatedAt: now,
      syncStatus: isOfflineMode ? 'Pending Offline Sync' : 'Synced',
    };
    setFieldReports((prev) => [record, ...prev]);

    if (isOfflineMode) {
      setOfflineQueue((prev) => [
        {
          id,
          type: 'field_report',
          summary: `${refCode} — ${report.reportType} (${report.stateCode}/${report.lga})`,
          payload: record as unknown as Record<string, unknown>,
          queuedAt: now,
        },
        ...prev,
      ]);
    } else if (currentUser.isAuthenticated && auth.currentUser?.emailVerified) {
      void setDoc(doc(db, 'field_reports', id), {
        refCode: refCode.slice(0, 32),
        reportType: report.reportType.slice(0, 64),
        stateCode: report.stateCode.slice(0, 16),
        lga: report.lga.slice(0, 80),
        ward: report.ward.slice(0, 80),
        pollingUnit: report.pollingUnit.slice(0, 120),
        summary: report.summary.slice(0, 2000),
        dataLabel: report.dataLabel,
        status: report.status,
        submitterUid: currentUser.uid,
        submitterName: report.submitterName.slice(0, 120),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }).catch((err) => handleFirestoreError(err, OperationType.CREATE, `field_reports/${id}`));
    }

    appendAuditLog({
      action: 'FIELD_REPORT_SUBMITTED',
      entity: 'FieldReport',
      entityId: refCode,
      summary: `Submitted ${report.reportType} for ${report.stateCode}/${report.lga} (${report.dataLabel}).`,
      source: 'Mobile Field',
    });
  };

  const reviewFieldReport = (id: string, status: FieldReportStatus, reviewNotes: string) => {
    const now = new Date().toISOString();
    const target = fieldReports.find((r) => r.id === id);
    const nextDataLabel =
      status === 'Verified'
        ? 'Verified Campaign Submission'
        : target?.dataLabel ?? 'Campaign-Reported Data';

    setFieldReports((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status,
              dataLabel: nextDataLabel,
              reviewerName: currentUser.displayName,
              reviewedAt: now,
              reviewNotes,
              updatedAt: now,
            }
          : r
      )
    );
    appendAuditLog({
      action: 'FIELD_REPORT_REVIEWED',
      entity: 'FieldReport',
      entityId: target?.refCode || id,
      summary: `Updated report verification status to ${status}. Notes: ${reviewNotes || 'None'}.`,
      previousValue: target?.status,
      newValue: status,
      source: 'Web Command',
    });
  };

  const createIncident = (
    inc: Omit<IncidentRecord, 'id' | 'refCode' | 'createdAt' | 'updatedAt' | 'timeline'>
  ) => {
    const id = makeId('inc');
    const refCode = `INC-2026-${String(incidents.length + 101)}`;
    const now = new Date().toISOString();
    const created: IncidentRecord = {
      ...inc,
      id,
      refCode,
      createdAt: now,
      updatedAt: now,
      timeline: [
        {
          id: makeId('tl'),
          actor: inc.reporterName,
          note: `Incident logged as ${inc.verificationStatus}.`,
          status: inc.status,
          timestamp: now,
        },
      ],
    };
    setIncidents((prev) => [created, ...prev]);

    if (currentUser.isAuthenticated && auth.currentUser?.emailVerified && !isOfflineMode) {
      void setDoc(doc(db, 'incidents', id), {
        refCode: refCode.slice(0, 32),
        title: inc.title.slice(0, 180),
        category: inc.category.slice(0, 64),
        severity: inc.severity,
        status: inc.status,
        verificationStatus: inc.verificationStatus,
        stateCode: inc.stateCode.slice(0, 16),
        lga: inc.lga.slice(0, 80),
        ward: inc.ward.slice(0, 80),
        description: inc.description.slice(0, 2000),
        reporterUid: currentUser.uid,
        reporterName: inc.reporterName.slice(0, 120),
        assignedTeam: inc.assignedTeam.slice(0, 100),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }).catch((err) => handleFirestoreError(err, OperationType.CREATE, `incidents/${id}`));
    }

    if (inc.severity === 'high' || inc.severity === 'critical') {
      pushNotification({
        title: `${inc.severity.toUpperCase()} Incident Logged — ${refCode}`,
        message: `${inc.title} (${inc.stateCode}/${inc.lga}) — ${inc.verificationStatus}`,
        severity: inc.severity,
        module: 'incidents',
      });
    }

    appendAuditLog({
      action: 'INCIDENT_CREATED',
      entity: 'Incident',
      entityId: refCode,
      summary: `Logged ${inc.severity} incident "${inc.title}" (${inc.verificationStatus}) in ${inc.stateCode}.`,
      source: 'Web Command',
    });
  };

  const updateIncident = (
    id: string,
    patch: { status?: IncidentStatus; verificationStatus?: IncidentVerification; resolutionNotes?: string; note: string }
  ) => {
    const now = new Date().toISOString();
    const existing = incidents.find((i) => i.id === id);
    if (!existing) return;

    const nextStatus = patch.status ?? existing.status;
    const nextVerification = patch.verificationStatus ?? existing.verificationStatus;

    setIncidents((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: nextStatus,
              verificationStatus: nextVerification,
              resolutionNotes: patch.resolutionNotes ?? item.resolutionNotes,
              updatedAt: now,
              timeline: [
                ...item.timeline,
                {
                  id: makeId('tl'),
                  actor: currentUser.displayName,
                  note: patch.note || `Updated status to ${nextStatus}`,
                  status: nextStatus,
                  timestamp: now,
                },
              ],
            }
          : item
      )
    );

    if (currentUser.isAuthenticated && auth.currentUser?.emailVerified && !existing.isDemo) {
      void updateDoc(doc(db, 'incidents', id), {
        status: nextStatus,
        verificationStatus: nextVerification,
        updatedAt: serverTimestamp(),
      }).catch((err) => handleFirestoreError(err, OperationType.UPDATE, `incidents/${id}`));
    }

    appendAuditLog({
      action: 'INCIDENT_UPDATED',
      entity: 'Incident',
      entityId: existing.refCode,
      summary: `Incident updated to ${nextStatus} (${nextVerification}): ${patch.note}`,
      previousValue: existing.status,
      newValue: nextStatus,
      source: 'Web Command',
    });
  };

  const logCall = (call: Omit<CallRecord, 'id' | 'refCode' | 'createdAt' | 'updatedAt'>) => {
    const id = makeId('call');
    const refCode = `CC-2026-${String(calls.length + 201)}`;
    const now = new Date().toISOString();
    const record: CallRecord = {
      ...call,
      id,
      refCode,
      createdAt: now,
      updatedAt: now,
    };
    setCalls((prev) => [record, ...prev]);

    if (call.status === 'Escalated') {
      pushNotification({
        title: `Call Escalated — ${refCode}`,
        message: `${call.subject} (${call.stateCode}/${call.lga}) escalated to ${call.escalatedTo || 'Supervisor'}.`,
        severity: call.priority,
        module: 'call-center',
      });
    }

    appendAuditLog({
      action: 'CALL_LOGGED',
      entity: 'CallRecord',
      entityId: refCode,
      summary: `Logged ${call.direction} call (${call.category}) — Status: ${call.status}.`,
      source: 'Web Command',
    });
  };

  const updateCallStatus = (
    id: string,
    status: CallRecord['status'],
    resolution?: string,
    escalatedTo?: string
  ) => {
    const target = calls.find((c) => c.id === id);
    setCalls((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status,
              resolution: resolution ?? c.resolution,
              escalatedTo: escalatedTo ?? c.escalatedTo,
              updatedAt: new Date().toISOString(),
            }
          : c
      )
    );
    appendAuditLog({
      action: 'CALL_STATUS_UPDATED',
      entity: 'CallRecord',
      entityId: target?.refCode || id,
      summary: `Call status updated to ${status}${escalatedTo ? ` (Escalated to ${escalatedTo})` : ''}.`,
      previousValue: target?.status,
      newValue: status,
      source: 'Web Command',
    });
  };

  const createTask = (task: Omit<CampaignTask, 'id' | 'createdAt' | 'updatedAt' | 'ownerUid'>) => {
    const id = makeId('tsk');
    const now = new Date().toISOString();
    const created: CampaignTask = {
      ...task,
      id,
      ownerUid: currentUser.uid,
      createdAt: now,
      updatedAt: now,
    };
    setTasks((prev) => [created, ...prev]);
    appendAuditLog({
      action: 'TASK_CREATED',
      entity: 'Task',
      entityId: id,
      summary: `Created task "${task.title}" assigned to ${task.assigneeName} (${task.department}).`,
      source: 'Web Command',
    });
  };

  const updateTaskStatus = (id: string, status: TaskStatus) => {
    const target = tasks.find((t) => t.id === id);
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status, updatedAt: new Date().toISOString() } : t))
    );
    appendAuditLog({
      action: 'TASK_STATUS_CHANGED',
      entity: 'Task',
      entityId: id,
      summary: `Moved task "${target?.title || id}" to ${status}.`,
      previousValue: target?.status,
      newValue: status,
      source: 'Web Command',
    });
  };

  const toggleTaskSubtask = (taskId: string, subtaskId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              subtasks: t.subtasks.map((st) =>
                st.id === subtaskId ? { ...st, done: !st.done } : st
              ),
              updatedAt: new Date().toISOString(),
            }
          : t
      )
    );
  };

  const createEvent = (evt: Omit<CampaignEvent, 'id'>) => {
    const id = makeId('evt');
    setEvents((prev) => [{ ...evt, id }, ...prev]);
    appendAuditLog({
      action: 'EVENT_SCHEDULED',
      entity: 'CampaignEvent',
      entityId: id,
      summary: `Scheduled ${evt.eventType}: "${evt.title}" in ${evt.stateCode}/${evt.lga} on ${evt.date}.`,
      source: 'Web Command',
    });
  };

  const toggleEventChecklistItem = (eventId: string, itemId: string) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId
          ? {
              ...e,
              checklist: e.checklist.map((c) =>
                c.id === itemId ? { ...c, completed: !c.completed } : c
              ),
            }
          : e
      )
    );
  };

  const addVehicle = (v: Omit<VehicleAsset, 'id'>) => {
    const id = makeId('veh');
    setVehicles((prev) => [{ ...v, id }, ...prev]);
    appendAuditLog({
      action: 'VEHICLE_REGISTERED',
      entity: 'Vehicle',
      entityId: v.registration,
      summary: `Registered fleet vehicle ${v.registration} (${v.vehicleType}) in ${v.stateCode}.`,
      source: 'Web Command',
    });
  };

  const updateVehicleAvailability = (
    id: string,
    availability: VehicleAsset['availability'],
    currentTrip?: string
  ) => {
    setVehicles((prev) =>
      prev.map((v) => (v.id === id ? { ...v, availability, currentTrip } : v))
    );
    appendAuditLog({
      action: 'VEHICLE_STATUS_UPDATED',
      entity: 'Vehicle',
      entityId: id,
      summary: `Updated vehicle availability to ${availability}.`,
      source: 'Web Command',
    });
  };

  const adjustInventoryStock = (id: string, delta: number) => {
    const target = inventory.find((i) => i.id === id);
    setInventory((prev) =>
      prev.map((i) =>
        i.id === id
          ? {
              ...i,
              quantity: Math.max(0, i.quantity + delta),
              lastUpdated: new Date().toISOString().slice(0, 10),
            }
          : i
      )
    );
    appendAuditLog({
      action: 'INVENTORY_ADJUSTED',
      entity: 'InventoryItem',
      entityId: id,
      summary: `Adjusted stock for "${target?.name || id}" by ${delta > 0 ? `+${delta}` : delta}.`,
      source: 'Web Command',
    });
  };

  const createLogisticsRequest = (
    req: Omit<LogisticsRequest, 'id' | 'refCode' | 'createdAt' | 'approvalStatus' | 'fulfillmentStatus'>
  ) => {
    const id = makeId('lreq');
    const refCode = `LOG-2026-${String(logisticsRequests.length + 101)}`;
    setLogisticsRequests((prev) => [
      {
        ...req,
        id,
        refCode,
        approvalStatus: 'Pending Approval',
        fulfillmentStatus: 'Queued',
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
    appendAuditLog({
      action: 'LOGISTICS_REQUESTED',
      entity: 'LogisticsRequest',
      entityId: refCode,
      summary: `Submitted request for ${req.quantity}x ${req.itemRequested} (${req.stateCode}/${req.lga}).`,
      source: 'Web Command',
    });
  };

  const updateLogisticsRequest = (
    id: string,
    patch: Partial<Pick<LogisticsRequest, 'approvalStatus' | 'fulfillmentStatus'>>
  ) => {
    const target = logisticsRequests.find((l) => l.id === id);
    setLogisticsRequests((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
    appendAuditLog({
      action: 'LOGISTICS_UPDATED',
      entity: 'LogisticsRequest',
      entityId: target?.refCode || id,
      summary: `Updated logistics request: ${JSON.stringify(patch)}.`,
      source: 'Web Command',
    });
  };

  const publishAnnouncement = (ann: Omit<Announcement, 'id' | 'createdAt' | 'readCount'>) => {
    const id = makeId('ann');
    setAnnouncements((prev) => [
      { ...ann, id, createdAt: new Date().toISOString(), readCount: 1 },
      ...prev,
    ]);
    appendAuditLog({
      action: 'ANNOUNCEMENT_PUBLISHED',
      entity: 'Announcement',
      entityId: id,
      summary: `Published ${ann.priority} announcement "${ann.title}" to ${ann.scope}: ${ann.targetValue}.`,
      source: 'Web Command',
    });
  };

  const addMediaItem = (item: Omit<MediaItem, 'id' | 'publishedAt'>) => {
    const id = makeId('med');
    setMediaItems((prev) => [{ ...item, id, publishedAt: new Date().toISOString() }, ...prev]);
    appendAuditLog({
      action: 'MEDIA_ITEM_LOGGED',
      entity: 'MediaItem',
      entityId: id,
      summary: `Logged public media entry "${item.headline}" classified as ${item.classification}.`,
      source: 'Web Command',
    });
  };

  const updateMediaReviewStatus = (id: string, status: MediaItem['reviewStatus']) => {
    setMediaItems((prev) => prev.map((m) => (m.id === id ? { ...m, reviewStatus: status } : m)));
  };

  const addDocument = (docItem: Omit<CampaignDocument, 'id' | 'uploadedAt'>) => {
    const id = makeId('doc');
    setDocuments((prev) => [
      { ...docItem, id, uploadedAt: new Date().toISOString().slice(0, 10) },
      ...prev,
    ]);
    appendAuditLog({
      action: 'DOCUMENT_UPLOADED',
      entity: 'CampaignDocument',
      entityId: id,
      summary: `Uploaded document "${docItem.title}" (${docItem.category}, Access: ${docItem.accessLevel}).`,
      source: 'Web Command',
    });
  };

  const toggleAlertRule = (id: string) => {
    setAlertRules((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const syncOfflineQueue = () => {
    if (offlineQueue.length === 0) return;
    const count = offlineQueue.length;
    setCheckIns((prev) => prev.map((c) => ({ ...c, syncStatus: 'Synced' })));
    setFieldReports((prev) => prev.map((r) => ({ ...r, syncStatus: 'Synced' })));
    setOfflineQueue([]);
    setIsOfflineMode(false);
    appendAuditLog({
      action: 'OFFLINE_QUEUE_SYNCED',
      entity: 'FieldSync',
      entityId: makeId('sync'),
      summary: `Synchronized ${count} queued offline field operations records to command center.`,
      source: 'Mobile Field',
    });
  };

  const metrics = useMemo(
    () =>
      computeExecutiveMetrics({
        personnel,
        geoUnits,
        fieldReports,
        incidents,
        calls,
        events,
        logisticsRequests,
        tasks,
      }),
    [personnel, geoUnits, fieldReports, incidents, calls, events, logisticsRequests, tasks]
  );

  const stateSummaries = useMemo(
    () =>
      computeStateSummaries({
        personnel,
        geoUnits,
        fieldReports,
        incidents,
        events,
      }),
    [personnel, geoUnits, fieldReports, incidents, events]
  );

  const zoneSummaries = useMemo(() => computeZoneSummaries(stateSummaries), [stateSummaries]);

  const value: CampaignContextValue = {
    activeModule,
    setActiveModule,
    selectedStateCode,
    setSelectedStateCode,
    darkMode,
    toggleDarkMode: () => setDarkMode((d) => !d),
    fullscreenSituationRoom,
    setFullscreenSituationRoom,
    setupWizardOpen,
    setSetupWizardOpen,
    commandSearchOpen,
    setCommandSearchOpen,
    currentUser,
    authReady,
    firebaseSyncActive,
    signInWithGoogle,
    signOutUser,
    switchDemoRole,
    hasDemoData,
    clearDemoData,
    reseedDemoData,
    isOfflineMode,
    setIsOfflineMode,
    offlineQueue,
    syncOfflineQueue,
    branding,
    updateBranding,
    departments,
    addDepartment,
    personnel,
    addPersonnel,
    updatePersonnelAssignment,
    geoUnits,
    importGeoUnits,
    rollbackImportJob,
    assignAgentToGeoUnit,
    importJobs,
    checkIns,
    submitCheckIn,
    fieldReports,
    submitFieldReport,
    reviewFieldReport,
    incidents,
    createIncident,
    updateIncident,
    calls,
    callOperators,
    logCall,
    updateCallStatus,
    tasks,
    createTask,
    updateTaskStatus,
    toggleTaskSubtask,
    events,
    createEvent,
    toggleEventChecklistItem,
    vehicles,
    addVehicle,
    updateVehicleAvailability,
    inventory,
    adjustInventoryStock,
    logisticsRequests,
    createLogisticsRequest,
    updateLogisticsRequest,
    announcements,
    publishAnnouncement,
    mediaSources,
    mediaItems,
    addMediaItem,
    updateMediaReviewStatus,
    documents,
    addDocument,
    alertRules,
    toggleAlertRule,
    auditLogs,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    metrics,
    stateSummaries,
    zoneSummaries,
  };

  return <CampaignContext.Provider value={value}>{children}</CampaignContext.Provider>;
};

export function useCampaign(): CampaignContextValue {
  const ctx = useContext(CampaignContext);
  if (!ctx) {
    throw new Error('useCampaign must be used inside CampaignProvider');
  }
  return ctx;
}
