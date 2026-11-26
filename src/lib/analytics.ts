import { NIGERIA_STATES, STATE_BY_CODE } from '../data/nigeriaGeo';
import type {
  CallOperatorStatus,
  CallRecord,
  CampaignEvent,
  CampaignTask,
  FieldReport,
  GeopoliticalZone,
  ImportedGeoUnit,
  IncidentRecord,
  LogisticsRequest,
  PersonnelRecord,
} from '../types/campaign';

export interface ExecutiveMetrics {
  totalPersonnel: number;
  activeCoordinators: number;
  registeredAgents: number;
  agentsCheckedIn: number;
  volunteerCount: number;
  statesWithActivePersonnel: number;
  totalStates: number;
  lgasCoveredCount: number;
  totalLgas: number;
  geographicCoveragePct: number;
  reportingCoveragePct: number;
  pollingUnitsTotal: number;
  pollingUnitsAssigned: number;
  pollingUnitsUnassigned: number;
  pendingFieldReports: number;
  verifiedFieldReports: number;
  openIncidents: number;
  highPriorityIncidents: number;
  resolvedIncidents: number;
  callsTotal: number;
  callsWaiting: number;
  callsActive: number;
  unresolvedCallTickets: number;
  avgHandlingSeconds: number;
  eventsScheduledTodayOrUpcoming: number;
  pendingLogisticsRequests: number;
  pendingTasks: number;
  overdueTasks: number;
}

export interface StateOperationalSummary {
  stateCode: string;
  stateName: string;
  zone: GeopoliticalZone;
  lgaCount: number;
  coveredLgas: number;
  personnelAssigned: number;
  agentsTotal: number;
  agentsCheckedIn: number;
  reportsSubmitted: number;
  reportsPending: number;
  openIncidents: number;
  criticalIncidents: number;
  pollingUnitsImported: number;
  pollingUnitsAssigned: number;
  eventsCount: number;
  coverageScorePct: number;
  operationalStatus: 'Nominal' | 'Attention' | 'Critical' | 'Standby';
}

export function computeExecutiveMetrics(params: {
  personnel: PersonnelRecord[];
  geoUnits: ImportedGeoUnit[];
  fieldReports: FieldReport[];
  incidents: IncidentRecord[];
  calls: CallRecord[];
  events: CampaignEvent[];
  logisticsRequests: LogisticsRequest[];
  tasks: CampaignTask[];
  todayIsoDate?: string;
}): ExecutiveMetrics {
  const {
    personnel,
    geoUnits,
    fieldReports,
    incidents,
    calls,
    events,
    logisticsRequests,
    tasks,
  } = params;

  const today = params.todayIsoDate ?? new Date().toISOString().slice(0, 10);

  const activeCoordinators = personnel.filter(
    (p) =>
      p.status !== 'Inactive' &&
      (p.role === 'State Coordinator' ||
        p.role === 'LGA Coordinator' ||
        p.role === 'Ward Coordinator' ||
        p.role === 'Field Supervisor')
  ).length;

  const agents = personnel.filter((p) => p.isFieldAgent);
  const agentsCheckedIn = agents.filter((a) => a.checkedIn).length;
  const volunteerCount = personnel.filter((p) => p.isVolunteer).length;

  const activeStatesSet = new Set(
    personnel.filter((p) => p.status !== 'Inactive').map((p) => p.stateCode)
  );
  const coveredLgasSet = new Set(
    personnel
      .filter((p) => p.status !== 'Inactive' && p.lga)
      .map((p) => `${p.stateCode}:${p.lga.toLowerCase()}`)
  );

  const totalStates = NIGERIA_STATES.length;
  const totalLgas = NIGERIA_STATES.reduce((acc, s) => acc + s.lgas.length, 0);

  const pollingUnitsTotal = geoUnits.length;
  const pollingUnitsAssigned = geoUnits.filter((u) => Boolean(u.assignedAgentId)).length;
  const pollingUnitsUnassigned = Math.max(0, pollingUnitsTotal - pollingUnitsAssigned);

  const pendingFieldReports = fieldReports.filter(
    (r) =>
      r.status === 'Submitted' ||
      r.status === 'Pending Review' ||
      r.status === 'Under Verification' ||
      r.status === 'Requires Clarification'
  ).length;

  const verifiedFieldReports = fieldReports.filter((r) => r.status === 'Verified').length;

  const reportingCoveragePct =
    pollingUnitsTotal > 0
      ? Math.min(100, Math.round((fieldReports.length / pollingUnitsTotal) * 100))
      : agents.length > 0
        ? Math.min(100, Math.round((fieldReports.length / agents.length) * 100))
        : 0;

  const openIncidents = incidents.filter(
    (i) => i.status !== 'Resolved' && i.status !== 'Closed'
  ).length;
  const highPriorityIncidents = incidents.filter(
    (i) =>
      (i.severity === 'high' || i.severity === 'critical') &&
      i.status !== 'Resolved' &&
      i.status !== 'Closed'
  ).length;
  const resolvedIncidents = incidents.filter(
    (i) => i.status === 'Resolved' || i.status === 'Closed'
  ).length;

  const callsWaiting = calls.filter((c) => c.status === 'Waiting').length;
  const callsActive = calls.filter((c) => c.status === 'Active').length;
  const unresolvedCallTickets = calls.filter((c) => c.status !== 'Resolved').length;
  const avgHandlingSeconds =
    calls.length > 0
      ? Math.round(calls.reduce((sum, c) => sum + c.handlingSeconds, 0) / calls.length)
      : 0;

  const eventsScheduledTodayOrUpcoming = events.filter(
    (e) => e.status !== 'Completed' && e.status !== 'Postponed' && e.date >= today
  ).length;

  const pendingLogisticsRequests = logisticsRequests.filter(
    (l) => l.approvalStatus === 'Pending Approval' || l.fulfillmentStatus !== 'Delivered'
  ).length;

  const pendingTasks = tasks.filter(
    (t) => t.status !== 'Completed' && t.status !== 'Cancelled'
  ).length;

  const overdueTasks = tasks.filter(
    (t) =>
      t.status !== 'Completed' &&
      t.status !== 'Cancelled' &&
      t.dueDate < today
  ).length;

  const geographicCoveragePct =
    totalStates > 0 ? Math.round((activeStatesSet.size / totalStates) * 100) : 0;

  return {
    totalPersonnel: personnel.length,
    activeCoordinators,
    registeredAgents: agents.length,
    agentsCheckedIn,
    volunteerCount,
    statesWithActivePersonnel: activeStatesSet.size,
    totalStates,
    lgasCoveredCount: coveredLgasSet.size,
    totalLgas,
    geographicCoveragePct,
    reportingCoveragePct,
    pollingUnitsTotal,
    pollingUnitsAssigned,
    pollingUnitsUnassigned,
    pendingFieldReports,
    verifiedFieldReports,
    openIncidents,
    highPriorityIncidents,
    resolvedIncidents,
    callsTotal: calls.length,
    callsWaiting,
    callsActive,
    unresolvedCallTickets,
    avgHandlingSeconds,
    eventsScheduledTodayOrUpcoming,
    pendingLogisticsRequests,
    pendingTasks,
    overdueTasks,
  };
}

export function computeStateSummaries(params: {
  personnel: PersonnelRecord[];
  geoUnits: ImportedGeoUnit[];
  fieldReports: FieldReport[];
  incidents: IncidentRecord[];
  events: CampaignEvent[];
}): Record<string, StateOperationalSummary> {
  const { personnel, geoUnits, fieldReports, incidents, events } = params;
  const result: Record<string, StateOperationalSummary> = {};

  for (const state of NIGERIA_STATES) {
    const statePersonnel = personnel.filter((p) => p.stateCode === state.code);
    const stateAgents = statePersonnel.filter((p) => p.isFieldAgent);
    const checkedIn = stateAgents.filter((a) => a.checkedIn).length;
    const coveredLgas = new Set(
      statePersonnel.filter((p) => p.lga).map((p) => p.lga.toLowerCase())
    ).size;
    const stateReports = fieldReports.filter((r) => r.stateCode === state.code);
    const pendingReports = stateReports.filter(
      (r) => r.status !== 'Verified' && r.status !== 'Rejected'
    ).length;
    const stateIncidents = incidents.filter(
      (i) => i.stateCode === state.code && i.status !== 'Resolved' && i.status !== 'Closed'
    );
    const criticalIncidents = stateIncidents.filter(
      (i) => i.severity === 'critical' || i.severity === 'high'
    ).length;
    const stateUnits = geoUnits.filter((u) => u.stateCode === state.code);
    const assignedUnits = stateUnits.filter((u) => Boolean(u.assignedAgentId)).length;
    const stateEvents = events.filter((e) => e.stateCode === state.code).length;

    const lgaCoverageRatio = state.lgas.length > 0 ? coveredLgas / state.lgas.length : 0;
    const unitCoverageRatio = stateUnits.length > 0 ? assignedUnits / stateUnits.length : lgaCoverageRatio;
    const coverageScorePct = Math.min(
      100,
      Math.round(((lgaCoverageRatio * 0.5 + unitCoverageRatio * 0.5) || 0) * 100)
    );

    let operationalStatus: StateOperationalSummary['operationalStatus'] = 'Standby';
    if (criticalIncidents > 0) {
      operationalStatus = 'Critical';
    } else if (stateIncidents.length > 0 || pendingReports > 2) {
      operationalStatus = 'Attention';
    } else if (statePersonnel.length > 0) {
      operationalStatus = 'Nominal';
    }

    result[state.code] = {
      stateCode: state.code,
      stateName: state.name,
      zone: state.zone,
      lgaCount: state.lgas.length,
      coveredLgas,
      personnelAssigned: statePersonnel.length,
      agentsTotal: stateAgents.length,
      agentsCheckedIn: checkedIn,
      reportsSubmitted: stateReports.length,
      reportsPending: pendingReports,
      openIncidents: stateIncidents.length,
      criticalIncidents,
      pollingUnitsImported: stateUnits.length,
      pollingUnitsAssigned: assignedUnits,
      eventsCount: stateEvents,
      coverageScorePct,
      operationalStatus,
    };
  }

  return result;
}

export function computeZoneSummaries(
  stateSummaries: Record<string, StateOperationalSummary>
): Array<{
  zone: GeopoliticalZone;
  statesCount: number;
  lgasTotal: number;
  personnel: number;
  agentsCheckedIn: number;
  openIncidents: number;
  reportsSubmitted: number;
}> {
  const zones: GeopoliticalZone[] = [
    'North-West',
    'North-East',
    'North-Central',
    'South-West',
    'South-East',
    'South-South',
  ];

  return zones.map((zone) => {
    const items = Object.values(stateSummaries).filter((s) => s.zone === zone);
    return {
      zone,
      statesCount: items.length,
      lgasTotal: items.reduce((a, s) => a + s.lgaCount, 0),
      personnel: items.reduce((a, s) => a + s.personnelAssigned, 0),
      agentsCheckedIn: items.reduce((a, s) => a + s.agentsCheckedIn, 0),
      openIncidents: items.reduce((a, s) => a + s.openIncidents, 0),
      reportsSubmitted: items.reduce((a, s) => a + s.reportsSubmitted, 0),
    };
  });
}

export function computeCallCenterStats(
  calls: CallRecord[],
  operators: CallOperatorStatus[]
) {
  const incoming = calls.filter((c) => c.direction === 'incoming').length;
  const outgoing = calls.filter((c) => c.direction === 'outgoing').length;
  const waiting = calls.filter((c) => c.status === 'Waiting').length;
  const active = calls.filter((c) => c.status === 'Active').length;
  const openCases = calls.filter((c) => c.status === 'Open Case').length;
  const escalated = calls.filter((c) => c.status === 'Escalated').length;
  const resolved = calls.filter((c) => c.status === 'Resolved').length;
  const activeOperators = operators.filter((o) => o.status !== 'Offline').length;
  const availableOperators = operators.filter((o) => o.status === 'Available').length;
  const busyOperators = operators.filter((o) => o.status === 'On Call' || o.status === 'Wrap-Up').length;
  const avgHandlingSeconds =
    calls.length > 0
      ? Math.round(calls.reduce((sum, c) => sum + c.handlingSeconds, 0) / calls.length)
      : 0;

  return {
    total: calls.length,
    incoming,
    outgoing,
    waiting,
    active,
    openCases,
    escalated,
    resolved,
    activeOperators,
    availableOperators,
    busyOperators,
    avgHandlingSeconds,
  };
}

export interface GeoImportValidationResult {
  validRecords: Omit<ImportedGeoUnit, 'id' | 'importJobId'>[];
  duplicates: string[];
  errors: string[];
}

/**
 * Validates and parses CSV or JSON Ward/Polling Unit datasets against Nigeria's 37 states & 774 LGAs.
 */
export function parseAndValidateGeoImport(
  rawText: string,
  format: 'CSV' | 'JSON' | 'GeoJSON',
  existingCodes: Set<string>
): GeoImportValidationResult {
  const validRecords: Omit<ImportedGeoUnit, 'id' | 'importJobId'>[] = [];
  const duplicates: string[] = [];
  const errors: string[] = [];
  const seenInBatch = new Set<string>();

  let rows: Array<Record<string, string>> = [];

  if (format === 'CSV') {
    const lines = rawText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length < 2) {
      return { validRecords, duplicates, errors: ['CSV must contain a header row and at least one data row.'] };
    }
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim());
      const obj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        obj[h] = cols[idx] ?? '';
      });
      rows.push(obj);
    }
  } else {
    try {
      const parsed = JSON.parse(rawText);
      if (format === 'GeoJSON' && Array.isArray(parsed?.features)) {
        rows = parsed.features.map((f: { properties?: Record<string, unknown> }) => {
          const p = f.properties ?? {};
          return {
            state_code: String(p.state_code ?? p.stateCode ?? ''),
            lga: String(p.lga ?? ''),
            ward: String(p.ward ?? ''),
            polling_unit_name: String(p.polling_unit_name ?? p.name ?? ''),
            polling_unit_code: String(p.polling_unit_code ?? p.code ?? ''),
          };
        });
      } else if (Array.isArray(parsed)) {
        rows = parsed.map((item: Record<string, unknown>) => ({
          state_code: String(item.state_code ?? item.stateCode ?? ''),
          lga: String(item.lga ?? ''),
          ward: String(item.ward ?? ''),
          polling_unit_name: String(item.polling_unit_name ?? item.pollingUnitName ?? ''),
          polling_unit_code: String(item.polling_unit_code ?? item.pollingUnitCode ?? ''),
        }));
      } else {
        return { validRecords, duplicates, errors: ['JSON must be an array of records or a GeoJSON FeatureCollection.'] };
      }
    } catch {
      return { validRecords, duplicates, errors: ['Invalid JSON syntax. Please check your file format.'] };
    }
  }

  rows.forEach((row, index) => {
    const rowNum = index + 1;
    const stateCode = (row.state_code || row.statecode || '').toUpperCase();
    const lga = (row.lga || '').trim();
    const ward = (row.ward || '').trim();
    const pollingUnitName = (row.polling_unit_name || row.pollingunitname || '').trim();
    const pollingUnitCode = (row.polling_unit_code || row.pollingunitcode || '').trim();

    const state = STATE_BY_CODE[stateCode];
    if (!state) {
      errors.push(`Row ${rowNum}: Unknown Nigerian state code "${stateCode}".`);
      return;
    }
    const matchedLga = state.lgas.find((item) => item.toLowerCase() === lga.toLowerCase());
    if (!matchedLga) {
      errors.push(`Row ${rowNum}: LGA "${lga}" does not belong to ${state.name} State.`);
      return;
    }
    if (!ward || !pollingUnitName || !pollingUnitCode) {
      errors.push(`Row ${rowNum}: Ward, Polling Unit Name, and Polling Unit Code are required.`);
      return;
    }
    if (existingCodes.has(pollingUnitCode) || seenInBatch.has(pollingUnitCode)) {
      duplicates.push(pollingUnitCode);
      return;
    }
    seenInBatch.add(pollingUnitCode);
    validRecords.push({
      stateCode: state.code,
      lga: matchedLga,
      ward,
      pollingUnitName,
      pollingUnitCode,
      sourceLabel: 'Official Imported Dataset',
      isDemo: false,
    });
  });

  return { validRecords, duplicates, errors };
}

export function exportRowsToCsv(headers: string[], rows: Array<Array<string | number | boolean | undefined>>): string {
  const escapeCell = (val: string | number | boolean | undefined): string => {
    const str = val === undefined || val === null ? '' : String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  return [
    headers.map(escapeCell).join(','),
    ...rows.map((r) => r.map(escapeCell).join(',')),
  ].join('\n');
}

export function formatDurationSeconds(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs.toString().padStart(2, '0')}s`;
}
