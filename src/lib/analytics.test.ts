import test from 'node:test';
import assert from 'node:assert/strict';
import { getTotalLgaCount, NIGERIA_STATES, searchNigeriaGeography } from '../data/nigeriaGeo';
import {
  computeExecutiveMetrics,
  computeStateSummaries,
  exportRowsToCsv,
  parseAndValidateGeoImport,
} from './analytics';
import {
  canAccessLga,
  canAccessState,
  canPerformAction,
  canTransitionReportStatus,
  getAllowedNextIncidentStatuses,
  ROLE_PERMISSION_MATRIX,
} from './rbac';
import type { CampaignUser } from '../types/campaign';

test('Nigeria geography dataset contains all 36 states + FCT and exactly 774 authentic LGAs', () => {
  assert.equal(NIGERIA_STATES.length, 37);
  assert.equal(getTotalLgaCount(), 774);
  const katsina = NIGERIA_STATES.find((s) => s.code === 'KT');
  assert.ok(katsina);
  assert.equal(katsina.lgas.length, 34);
  assert.ok(katsina.lgas.includes('Kankara'));
  assert.ok(katsina.lgas.includes('Daura'));
});

test('Nigeria geography search locates states and LGAs accurately', () => {
  const results = searchNigeriaGeography('Katsina');
  assert.ok(results.some((r) => r.type === 'State' && r.stateCode === 'KT'));
  assert.ok(results.some((r) => r.type === 'LGA' && r.lgaName === 'Katsina'));
});

test('RBAC permission matrix enforces all 21 roles and geographic boundaries', () => {
  assert.equal(ROLE_PERMISSION_MATRIX.length, 21);

  const stateCoord: CampaignUser = {
    uid: 'u-state',
    displayName: 'Katsina State Coord',
    email: 'kt@example.com',
    role: 'State Coordinator',
    department: 'Field Operations',
    assignedStateCode: 'KT',
    assignedLga: null,
    isAuthenticated: true,
  };

  assert.equal(canAccessState(stateCoord, 'KT'), true);
  assert.equal(canAccessState(stateCoord, 'LA'), false);
  assert.equal(canPerformAction(stateCoord, 'admin'), false);
  assert.equal(canPerformAction(stateCoord, 'write'), true);

  const lgaCoord: CampaignUser = {
    ...stateCoord,
    role: 'LGA Coordinator',
    assignedLga: 'Daura',
  };
  assert.equal(canAccessLga(lgaCoord, 'KT', 'Daura'), true);
  assert.equal(canAccessLga(lgaCoord, 'KT', 'Funtua'), false);
});

test('Incident and Field Report state machines lock terminal states for non-admins', () => {
  assert.deepEqual(getAllowedNextIncidentStatuses('Closed', false), []);
  assert.ok(getAllowedNextIncidentStatuses('New', false).includes('Assigned'));
  assert.equal(canTransitionReportStatus('Verified', 'Submitted', false), false);
  assert.equal(canTransitionReportStatus('Under Verification', 'Verified', false), true);
  assert.equal(canTransitionReportStatus('Verified', 'Under Verification', true), true);
});

test('Executive metrics compute strictly from live record collections', () => {
  const metrics = computeExecutiveMetrics({
    personnel: [
      {
        id: 'p1',
        fullName: 'Amina Bello',
        role: 'Polling Unit Agent',
        orgLevel: 'Polling Unit',
        department: 'Field Operations',
        stateCode: 'KT',
        lga: 'Katsina',
        supervisor: 'Sadiq',
        phone: '+234800000001',
        status: 'Deployed',
        trainingStatus: 'Completed',
        checkedIn: true,
        registeredAt: '2026-11-01',
        isVolunteer: false,
        isFieldAgent: true,
      },
      {
        id: 'p2',
        fullName: 'Musa Danjuma',
        role: 'State Coordinator',
        orgLevel: 'State',
        department: 'Field Operations',
        stateCode: 'KT',
        lga: 'Daura',
        supervisor: 'HQ',
        phone: '+234800000002',
        status: 'Active',
        trainingStatus: 'Completed',
        checkedIn: false,
        registeredAt: '2026-11-01',
        isVolunteer: true,
        isFieldAgent: false,
      },
    ],
    geoUnits: [
      {
        id: 'u1',
        stateCode: 'KT',
        lga: 'Katsina',
        ward: 'Wakilin Gabas I',
        pollingUnitName: 'Sample PU 01',
        pollingUnitCode: 'KT-01-01',
        sourceLabel: 'Demo Sample Record',
        assignedAgentId: 'p1',
      },
      {
        id: 'u2',
        stateCode: 'KT',
        lga: 'Daura',
        ward: 'Sarkin Yara A',
        pollingUnitName: 'Sample PU 02',
        pollingUnitCode: 'KT-02-01',
        sourceLabel: 'Demo Sample Record',
      },
    ],
    fieldReports: [
      {
        id: 'r1',
        refCode: 'FR-001',
        reportType: 'Routine Situation',
        stateCode: 'KT',
        lga: 'Katsina',
        ward: 'Wakilin Gabas I',
        pollingUnit: 'Sample PU 01',
        summary: 'Station operational',
        dataLabel: 'Campaign-Reported Data',
        status: 'Pending Review',
        submitterName: 'Amina Bello',
        submitterUid: 'p1',
        createdAt: '2026-11-25T10:00:00Z',
        updatedAt: '2026-11-25T10:00:00Z',
        syncStatus: 'Synced',
      },
    ],
    incidents: [
      {
        id: 'i1',
        refCode: 'INC-001',
        title: 'Power outage at coordination desk',
        category: 'Infrastructure issue',
        severity: 'high',
        status: 'Investigating',
        verificationStatus: 'Unverified Report',
        stateCode: 'KT',
        lga: 'Katsina',
        ward: 'Wakilin Gabas I',
        description: 'Generator backup needed',
        reporterName: 'Amina Bello',
        reporterUid: 'p1',
        assignedTeam: 'Logistics',
        assignedSupervisor: 'Musa Danjuma',
        createdAt: '2026-11-25T09:00:00Z',
        updatedAt: '2026-11-25T09:30:00Z',
        timeline: [],
      },
    ],
    calls: [],
    events: [],
    logisticsRequests: [],
    tasks: [],
    todayIsoDate: '2026-11-25',
  });

  assert.equal(metrics.totalPersonnel, 2);
  assert.equal(metrics.registeredAgents, 1);
  assert.equal(metrics.agentsCheckedIn, 1);
  assert.equal(metrics.pollingUnitsAssigned, 1);
  assert.equal(metrics.pollingUnitsUnassigned, 1);
  assert.equal(metrics.openIncidents, 1);
  assert.equal(metrics.highPriorityIncidents, 1);
  assert.equal(metrics.pendingFieldReports, 1);

  const stateSummaries = computeStateSummaries({
    personnel: [],
    geoUnits: [],
    fieldReports: [],
    incidents: [],
    events: [],
  });
  assert.equal(Object.keys(stateSummaries).length, 37);
});

test('Geography CSV import validates state/LGA hierarchy and detects duplicates', () => {
  const csv = [
    'state_code,lga,ward,polling_unit_name,polling_unit_code',
    'KT,Katsina,Wakilin Yamma I,Primary School Gate,IMPORT-KT-001',
    'KT,Katsina,Wakilin Yamma I,Duplicate Row,IMPORT-KT-001',
    'KT,InvalidLga,Ward 1,Bad LGA Unit,IMPORT-KT-002',
    'ZZ,Unknown,Ward 1,Bad State Unit,IMPORT-ZZ-001',
  ].join('\n');

  const existing = new Set<string>(['EXISTING-01']);
  const result = parseAndValidateGeoImport(csv, 'CSV', existing);

  assert.equal(result.validRecords.length, 1);
  assert.equal(result.duplicates.length, 1);
  assert.equal(result.errors.length, 2);

  const exported = exportRowsToCsv(['Code', 'Name'], [['KT', 'Katsina, North']]);
  assert.equal(exported, 'Code,Name\nKT,"Katsina, North"');
});
