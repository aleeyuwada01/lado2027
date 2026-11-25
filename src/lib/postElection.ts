import type {
  CabinetPortfolioItem,
  GovernanceIdea,
  HandoverAuditItem,
  TransitionActionItem,
  TransitionDayWindow,
  TransitionSector,
} from '../types/campaign';

export interface TransitionReadinessSummary {
  totalActions: number;
  completedActions: number;
  inProgressActions: number;
  blockedActions: number;
  avgActionProgressPct: number;
  day1To30Count: number;
  totalIdeas: number;
  approvedOrPlannedIdeas: number;
  cabinetTotal: number;
  cabinetConfirmedCount: number;
  cabinetVettedPct: number;
  auditsTotal: number;
  auditsVerifiedCount: number;
  overallReadinessScore: number;
}

export function computeTransitionReadiness(input: {
  actions: TransitionActionItem[];
  ideas: GovernanceIdea[];
  cabinet: CabinetPortfolioItem[];
  audits: HandoverAuditItem[];
}): TransitionReadinessSummary {
  const { actions, ideas, cabinet, audits } = input;

  const totalActions = actions.length;
  const completedActions = actions.filter((a) => a.status === 'Completed').length;
  const inProgressActions = actions.filter((a) => a.status === 'In Progress').length;
  const blockedActions = actions.filter((a) => a.status === 'Blocked').length;
  const avgActionProgressPct =
    totalActions > 0
      ? Math.round(actions.reduce((acc, a) => acc + a.progressPct, 0) / totalActions)
      : 0;
  const day1To30Count = actions.filter((a) => a.window === 'Days 1–30').length;

  const totalIdeas = ideas.length;
  const approvedOrPlannedIdeas = ideas.filter(
    (i) => i.status === 'Approved for Cabinet' || i.status === 'In 100-Day Plan'
  ).length;

  const cabinetTotal = cabinet.length;
  const cabinetConfirmedCount = cabinet.filter(
    (c) => c.vettingStatus === 'Appointee Confirmed'
  ).length;
  const cabinetReadyCount = cabinet.filter(
    (c) =>
      c.vettingStatus === 'Appointee Confirmed' || c.vettingStatus === 'Shortlist Vetting'
  ).length;
  const cabinetVettedPct =
    cabinetTotal > 0 ? Math.round((cabinetReadyCount / cabinetTotal) * 100) : 0;

  const auditsTotal = audits.length;
  const auditsVerifiedCount = audits.filter((a) => a.status === 'Verified').length;
  const auditsActivePct =
    auditsTotal > 0
      ? Math.round(
          (audits.filter((a) => a.status === 'Verified' || a.status === 'Under Review').length /
            auditsTotal) *
            100
        )
      : 0;

  const overallReadinessScore = Math.min(
    100,
    Math.round(avgActionProgressPct * 0.4 + cabinetVettedPct * 0.35 + auditsActivePct * 0.25)
  );

  return {
    totalActions,
    completedActions,
    inProgressActions,
    blockedActions,
    avgActionProgressPct,
    day1To30Count,
    totalIdeas,
    approvedOrPlannedIdeas,
    cabinetTotal,
    cabinetConfirmedCount,
    cabinetVettedPct,
    auditsTotal,
    auditsVerifiedCount,
    overallReadinessScore,
  };
}

export function filterTransitionActions(
  actions: TransitionActionItem[],
  filters: {
    windowFilter?: 'All' | TransitionDayWindow;
    sectorFilter?: 'All' | TransitionSector;
    zoneFilter?: string;
    searchQuery?: string;
  }
): TransitionActionItem[] {
  const q = (filters.searchQuery || '').trim().toLowerCase();
  return actions.filter((a) => {
    if (filters.windowFilter && filters.windowFilter !== 'All' && a.window !== filters.windowFilter) {
      return false;
    }
    if (filters.sectorFilter && filters.sectorFilter !== 'All' && a.sector !== filters.sectorFilter) {
      return false;
    }
    if (filters.zoneFilter && filters.zoneFilter !== 'All' && a.zone !== filters.zoneFilter) {
      return false;
    }
    if (!q) return true;
    return (
      a.title.toLowerCase().includes(q) ||
      a.summary.toLowerCase().includes(q) ||
      a.leadOffice.toLowerCase().includes(q) ||
      a.sector.toLowerCase().includes(q) ||
      a.zone.toLowerCase().includes(q)
    );
  });
}

export function filterGovernanceIdeas(
  ideas: GovernanceIdea[],
  filters: {
    sectorFilter?: 'All' | TransitionSector;
    statusFilter?: 'All' | GovernanceIdea['status'];
    zoneFilter?: string;
    searchQuery?: string;
    sortBy?: 'upvotes' | 'latest';
  }
): GovernanceIdea[] {
  const q = (filters.searchQuery || '').trim().toLowerCase();
  const filtered = ideas.filter((idea) => {
    if (filters.sectorFilter && filters.sectorFilter !== 'All' && idea.sector !== filters.sectorFilter) {
      return false;
    }
    if (filters.statusFilter && filters.statusFilter !== 'All' && idea.status !== filters.statusFilter) {
      return false;
    }
    if (filters.zoneFilter && filters.zoneFilter !== 'All' && idea.zone !== filters.zoneFilter) {
      return false;
    }
    if (!q) return true;
    return (
      idea.title.toLowerCase().includes(q) ||
      idea.summary.toLowerCase().includes(q) ||
      idea.executionPlan.toLowerCase().includes(q) ||
      idea.submittedBy.toLowerCase().includes(q) ||
      idea.sector.toLowerCase().includes(q)
    );
  });

  if (filters.sortBy === 'latest') {
    return [...filtered].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  return [...filtered].sort((a, b) => b.upvotes - a.upvotes);
}

const DEFAULT_LEAD_BY_SECTOR: Record<TransitionSector, string> = {
  'Security & Peace': 'Ministry of Internal Security & Community Peace',
  'Clean Energy & Rimi Wind': 'Ministry of Power, Renewable Energy & Rimi Wind Revival',
  'AI, Digital & Free Internet': 'Bureau for Artificial Intelligence, Digital Economy & Free Internet',
  'Education & STEM': 'Ministry of Basic & Higher Education',
  Healthcare: 'Ministry of Health & Zonal Medical Services',
  'Agriculture & Economy': 'Ministry of Agriculture, Irrigation & Rural Enterprise',
  'Governance & Civil Service': 'Office of the Secretary to the State Government (SSG)',
};

export function promoteIdeaToActionItem(
  idea: GovernanceIdea,
  customLeadOffice?: string
): Omit<TransitionActionItem, 'id'> {
  const steps = idea.executionPlan
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim().replace(/\.$/, ''))
    .filter(Boolean)
    .slice(0, 3);

  const deliverableLabels =
    steps.length > 0
      ? steps
      : [
          `Constitute implementation committee for ${idea.title}`,
          'Confirm budget & technical specification',
          'Launch Phase-1 rollout and weekly KPI tracking',
        ];

  return {
    title: idea.title,
    sector: idea.sector,
    window: idea.estimatedTimeline,
    zone: idea.zone,
    leadOffice: customLeadOffice?.trim() || DEFAULT_LEAD_BY_SECTOR[idea.sector],
    priority: idea.budgetTier === 'Major Flagship / PPP' ? 'urgent' : 'high',
    status: 'Planned',
    progressPct: 10,
    targetMetric: `${idea.estimatedTimeline} rollout across ${idea.zone}`,
    summary: idea.summary,
    deliverables: deliverableLabels.map((label, idx) => ({
      id: `pdel-${idx + 1}`,
      label,
      done: false,
    })),
    sourceIdeaId: idea.id,
    isDemo: false,
  };
}

function escapeCsvCell(value: string | number | undefined): string {
  const str = value == null ? '' : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportTransitionBriefingCsv(input: {
  actions: TransitionActionItem[];
  ideas: GovernanceIdea[];
  cabinet: CabinetPortfolioItem[];
  audits: HandoverAuditItem[];
}): string {
  const header = [
    'RecordType',
    'TitleOrPortfolio',
    'SectorOrDepartment',
    'WindowOrTimeline',
    'ZoneOrScope',
    'Status',
    'ProgressOrSupport',
    'LeadOrOwner',
    'SummaryOrDirective',
  ].join(',');

  const rows: string[] = [];

  for (const a of input.actions) {
    rows.push(
      [
        '100-Day Action',
        a.title,
        a.sector,
        a.window,
        a.zone,
        a.status,
        `${a.progressPct}%`,
        a.leadOffice,
        a.targetMetric,
      ]
        .map(escapeCsvCell)
        .join(',')
    );
  }

  for (const idea of input.ideas) {
    rows.push(
      [
        'Governance Idea',
        idea.title,
        idea.sector,
        idea.estimatedTimeline,
        idea.zone,
        idea.status,
        `${idea.upvotes} endorsements`,
        idea.submittedBy,
        idea.summary,
      ]
        .map(escapeCsvCell)
        .join(',')
    );
  }

  for (const cab of input.cabinet) {
    rows.push(
      [
        'Cabinet Portfolio',
        cab.ministryName,
        cab.sector,
        'Cabinet Setup',
        'Statewide',
        cab.vettingStatus,
        `${cab.committeeSize} committee members`,
        cab.transitionLead,
        cab.dayOneDirective,
      ]
        .map(escapeCsvCell)
        .join(',')
    );
  }

  for (const aud of input.audits) {
    rows.push(
      [
        'Handover Audit',
        aud.workstream,
        aud.department,
        aud.updatedAt,
        'Statewide',
        aud.status,
        aud.priority.toUpperCase(),
        aud.owner,
        aud.notes,
      ]
        .map(escapeCsvCell)
        .join(',')
    );
  }

  return [header, ...rows].join('\n');
}
