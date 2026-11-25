import React, { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Download,
  Flame,
  Landmark,
  Lightbulb,
  Map as MapIcon,
  MapPin,
  Plus,
  Printer,
  Rocket,
  Search,
  ShieldAlert,
  Sparkles,
  ThumbsUp,
  Users,
} from 'lucide-react';
import { useCampaign } from '../context/CampaignContext';
import { KatsinaMapboxViz } from '../components/KatsinaMapboxViz';
import { TRANSITION_LGA_PROJECTS, TRANSITION_PROJECTS_BY_LGA_ID } from '../data/transitionProjectsSeed';
import { createDefaultSimulationConfig, runKatsinaSimulation } from '../lib/electionSimulator';
import { canPerformAction } from '../lib/rbac';
import { KATSINA_INEC_LGAS, KATSINA_INEC_META } from '../data/katsinaInecData';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import {
  computeTransitionReadiness,
  exportTransitionBriefingCsv,
  filterGovernanceIdeas,
  filterTransitionActions,
} from '../lib/postElection';
import type {
  CabinetVettingStatus,
  GovernanceIdeaStatus,
  HandoverAuditStatus,
  TaskPriority,
  TransitionActionStatus,
  TransitionDayWindow,
  TransitionPhase,
  TransitionSector,
} from '../types/campaign';

type PortalTab = 'day-100' | 'ideas-bank' | 'cabinet-setup' | 'handover-audit' | 'projects-map';

const PHASES: TransitionPhase[] = [
  'Pre-Inauguration Transition',
  'First 100 Days',
  'Full-Term Delivery',
];

const SECTORS: TransitionSector[] = [
  'Security & Peace',
  'Clean Energy & Rimi Wind',
  'AI, Digital & Free Internet',
  'Education & STEM',
  'Healthcare',
  'Agriculture & Economy',
  'Governance & Civil Service',
];

const WINDOWS: TransitionDayWindow[] = ['Days 1–30', 'Days 31–60', 'Days 61–100', 'Year 1'];

const ZONES = [
  'Statewide',
  'Katsina Central',
  'Daura (Katsina North)',
  'Funtua (Katsina South)',
] as const;

const ACTION_STATUSES: TransitionActionStatus[] = [
  'Planned',
  'In Progress',
  'Completed',
  'Blocked',
];

const IDEA_STATUSES: GovernanceIdeaStatus[] = [
  'Proposed',
  'Under Review',
  'Approved for Cabinet',
  'In 100-Day Plan',
];

const VETTING_STATUSES: CabinetVettingStatus[] = [
  'Open Portfolio',
  'Transition Committee',
  'Shortlist Vetting',
  'Appointee Confirmed',
];

const AUDIT_STATUSES: HandoverAuditStatus[] = [
  'Pending Handover',
  'Documents Requested',
  'Under Review',
  'Verified',
];

function statusBadgeStyle(status: string): string {
  switch (status) {
    case 'Completed':
    case 'Appointee Confirmed':
    case 'Verified':
    case 'In 100-Day Plan':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/70';
    case 'In Progress':
    case 'Shortlist Vetting':
    case 'Under Review':
    case 'Approved for Cabinet':
      return 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800/70';
    case 'Blocked':
      return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800/70';
    case 'Documents Requested':
    case 'Transition Committee':
      return 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/70';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
  }
}

export const PostElectionPortalView: React.FC = () => {
  const {
    branding,
    currentUser,
    transitionPhase,
    setTransitionPhase,
    transitionActions,
    createTransitionAction,
    updateTransitionActionStatus,
    toggleTransitionDeliverable,
    governanceIdeas,
    submitGovernanceIdea,
    upvoteGovernanceIdea,
    updateGovernanceIdeaStatus,
    promoteGovernanceIdea,
    cabinetPortfolios,
    addCabinetPortfolio,
    updateCabinetPortfolio,
    handoverAudits,
    updateHandoverAuditItem,
    createTask,
    setActiveModule,
  } = useCampaign();

  const canWrite = canPerformAction(currentUser, 'write');
  const canApprove = canPerformAction(currentUser, 'approve');
  const canExport = canPerformAction(currentUser, 'exportData');

  const [tab, setTab] = useState<PortalTab>('day-100');
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);
  const [syncedTasksMap, setSyncedTasksMap] = useState<Record<string, boolean>>({});

  // Action plan filters & form
  const [actionWindowFilter, setActionWindowFilter] = useState<'All' | TransitionDayWindow>('All');
  const [actionSectorFilter, setActionSectorFilter] = useState<'All' | TransitionSector>('All');
  const [actionZoneFilter, setActionZoneFilter] = useState<string>('All');
  const [actionSearch, setActionSearch] = useState<string>('');
  const [showNewActionForm, setShowNewActionForm] = useState<boolean>(false);
  const [newActTitle, setNewActTitle] = useState('');
  const [newActSector, setNewActSector] = useState<TransitionSector>('Clean Energy & Rimi Wind');
  const [newActWindow, setNewActWindow] = useState<TransitionDayWindow>('Days 1–30');
  const [newActZone, setNewActZone] = useState<(typeof ZONES)[number]>('Statewide');
  const [newActLead, setNewActLead] = useState('Office of the Secretary to the State Government (SSG)');
  const [newActMetric, setNewActMetric] = useState('');
  const [newActPriority, setNewActPriority] = useState<TaskPriority>('high');
  const [newActSummary, setNewActSummary] = useState('');
  const [newActDeliverables, setNewActDeliverables] = useState('');

  // Ideas Bank filters & form
  const [ideaSectorFilter, setIdeaSectorFilter] = useState<'All' | TransitionSector>('All');
  const [ideaStatusFilter, setIdeaStatusFilter] = useState<'All' | GovernanceIdeaStatus>('All');
  const [ideaSearch, setIdeaSearch] = useState<string>('');
  const [ideaSortBy, setIdeaSortBy] = useState<'upvotes' | 'latest'>('upvotes');
  const [showNewIdeaForm, setShowNewIdeaForm] = useState<boolean>(false);
  const [newIdeaTitle, setNewIdeaTitle] = useState('');
  const [newIdeaSector, setNewIdeaSector] = useState<TransitionSector>('AI, Digital & Free Internet');
  const [newIdeaZone, setNewIdeaZone] = useState<(typeof ZONES)[number]>('Statewide');
  const [newIdeaTimeline, setNewIdeaTimeline] = useState<TransitionDayWindow>('Days 31–60');
  const [newIdeaBudget, setNewIdeaBudget] = useState<'Low Cost / Quick Win' | 'Medium Capital' | 'Major Flagship / PPP'>('Medium Capital');
  const [newIdeaSummary, setNewIdeaSummary] = useState('');
  const [newIdeaPlan, setNewIdeaPlan] = useState('');

  // Cabinet Setup form & inline edits
  const [showNewCabinetForm, setShowNewCabinetForm] = useState<boolean>(false);
  const [newMinistryName, setNewMinistryName] = useState('');
  const [newMinistrySector, setNewMinistrySector] = useState<TransitionSector>('Governance & Civil Service');
  const [newMinistryLead, setNewMinistryLead] = useState('');
  const [newMinistryDirective, setNewMinistryDirective] = useState('');
  const [newMinistryMandate, setNewMinistryMandate] = useState('');
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [editingLeadDraft, setEditingLeadDraft] = useState<string>('');

  // Handover Audit notes drafts
  const [auditNotesDraft, setAuditNotesDraft] = useState<Record<string, string>>({});
  const [selectedProjectLgaId, setSelectedProjectLgaId] = useState<string>('rimi');

  const katsinaSim = useMemo(
    () => runKatsinaSimulation(createDefaultSimulationConfig()),
    []
  );

  const sectorChartData = useMemo(() => {
    return SECTORS.map((sec) => ({
      sector: sec.split('&')[0].trim(),
      actions: transitionActions.filter((a) => a.sector === sec).length,
      ideas: governanceIdeas.filter((i) => i.sector === sec).length,
    }));
  }, [transitionActions, governanceIdeas]);

  const readiness = useMemo(
    () =>
      computeTransitionReadiness({
        actions: transitionActions,
        ideas: governanceIdeas,
        cabinet: cabinetPortfolios,
        audits: handoverAudits,
      }),
    [transitionActions, governanceIdeas, cabinetPortfolios, handoverAudits]
  );

  const filteredActions = useMemo(
    () =>
      filterTransitionActions(transitionActions, {
        windowFilter: actionWindowFilter,
        sectorFilter: actionSectorFilter,
        zoneFilter: actionZoneFilter,
        searchQuery: actionSearch,
      }),
    [transitionActions, actionWindowFilter, actionSectorFilter, actionZoneFilter, actionSearch]
  );

  const filteredIdeas = useMemo(
    () =>
      filterGovernanceIdeas(governanceIdeas, {
        sectorFilter: ideaSectorFilter,
        statusFilter: ideaStatusFilter,
        searchQuery: ideaSearch,
        sortBy: ideaSortBy,
      }),
    [governanceIdeas, ideaSectorFilter, ideaStatusFilter, ideaSearch, ideaSortBy]
  );

  const katsinaZoneStats = useMemo(() => {
    const zones = [
      { key: 'Katsina Central', label: 'Katsina Central' },
      { key: 'Katsina North', label: 'Katsina North (Daura)' },
      { key: 'Katsina South', label: 'Katsina South (Funtua)' },
    ] as const;
    return zones.map(({ key, label }) => {
      const lgas = KATSINA_INEC_LGAS.filter((l) => l.zone === key);
      return {
        zoneName: label,
        lgaCount: lgas.length,
        wardsCount: lgas.reduce((sum, l) => sum + l.wardCount, 0),
        pollingUnitsCount: lgas.reduce((sum, l) => sum + l.pollingUnits, 0),
        registeredVoters: lgas.reduce((sum, l) => sum + l.registeredVoters, 0),
      };
    });
  }, []);

  const notify = (msg: string) => {
    setBannerMessage(msg);
  };

  const handleExportBriefing = () => {
    const csv = exportTransitionBriefingCsv({
      actions: transitionActions,
      ideas: governanceIdeas,
      cabinet: cabinetPortfolios,
      audits: handoverAudits,
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lado2027-transition-briefing-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    notify('Exported complete Post-Election Transition Briefing CSV.');
  };

  const handleCreateAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWrite || !newActTitle.trim()) return;
    const rawDeliverables = newActDeliverables
      .split(/\n|;/)
      .map((s) => s.trim())
      .filter(Boolean);
    const deliverables = (
      rawDeliverables.length > 0
        ? rawDeliverables
        : [
            'Convene sector working group and confirm timeline',
            'Finalize MDA funding and KPI targets',
          ]
    ).map((label, idx) => ({ id: `cdel-${Date.now()}-${idx}`, label, done: false }));

    createTransitionAction({
      title: newActTitle.trim(),
      sector: newActSector,
      window: newActWindow,
      zone: newActZone,
      leadOffice: newActLead.trim() || 'Executive Transition Council',
      priority: newActPriority,
      status: 'Planned',
      progressPct: 0,
      targetMetric: newActMetric.trim() || `${newActWindow} milestone execution`,
      summary: newActSummary.trim() || `Priority post-election governance milestone for ${newActSector}.`,
      deliverables,
      isDemo: false,
    });
    setNewActTitle('');
    setNewActMetric('');
    setNewActSummary('');
    setNewActDeliverables('');
    setShowNewActionForm(false);
    notify(`Added "${newActTitle.trim()}" to ${newActWindow} Action Plan.`);
  };

  const handleCreateIdea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWrite || !newIdeaTitle.trim() || !newIdeaSummary.trim()) return;
    submitGovernanceIdea({
      title: newIdeaTitle.trim(),
      sector: newIdeaSector,
      zone: newIdeaZone,
      estimatedTimeline: newIdeaTimeline,
      budgetTier: newIdeaBudget,
      summary: newIdeaSummary.trim(),
      executionPlan:
        newIdeaPlan.trim() ||
        'Form technical implementation team within 14 days. Verify site & beneficiary scope across target LGAs. Launch tracked pilot and publish progress metrics.',
      submittedBy: `${currentUser.displayName} (${currentUser.role})`,
      isDemo: false,
    });
    setNewIdeaTitle('');
    setNewIdeaSummary('');
    setNewIdeaPlan('');
    setShowNewIdeaForm(false);
    notify('Submitted new governance idea to the Post-Election Ideas & Policy Bank.');
  };

  const handleCreateCabinetPortfolio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWrite || !newMinistryName.trim()) return;
    addCabinetPortfolio({
      ministryName: newMinistryName.trim(),
      sector: newMinistrySector,
      transitionLead: newMinistryLead.trim() || 'To Be Designated',
      dayOneDirective:
        newMinistryDirective.trim() || 'Conduct Day-1 sector asset and staffing audit.',
      statutoryMandate:
        newMinistryMandate.trim() ||
        `Executive mandate covering ${newMinistrySector} delivery across Katsina State.`,
      vettingStatus: 'Transition Committee',
      committeeSize: 7,
      kpis: ['First 100-Day Delivery Charter signed', '34-LGA coverage plan submitted'],
      isDemo: false,
    });
    setNewMinistryName('');
    setNewMinistryLead('');
    setNewMinistryDirective('');
    setNewMinistryMandate('');
    setShowNewCabinetForm(false);
    notify(`Added portfolio "${newMinistryName.trim()}" to Cabinet & Agencies Setup.`);
  };

  return (
    <div className="space-y-6">
      {/* Executive Mandate Banner */}
      <section className="rounded-xl bg-[#0A0F1A] text-white border border-slate-800 p-5 sm:p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <Landmark className="w-4 h-4 shrink-0" />
              Post-Election Transition &amp; Governance Command
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-white">
              Mandate Delivery, Cabinet Setup &amp; 100-Day Governance Blueprint
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Continuity portal turning {branding.candidateName}&apos;s electoral victory across{' '}
              {KATSINA_INEC_META.totalLgas} LGAs and {KATSINA_INEC_META.totalWards} wards into
              vetted cabinet structures, handover audits, and actionable policies.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0 no-print">
            {canExport && (
              <button
                type="button"
                onClick={handleExportBriefing}
                className="inline-flex items-center justify-center gap-2 px-3.5 py-2 min-h-[40px] text-xs font-semibold rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                Export Transition Briefing (CSV)
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setTab('projects-map');
                window.setTimeout(() => window.print(), 120);
              }}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[40px] text-xs font-semibold rounded-lg border border-slate-700 text-slate-200 hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Charter
            </button>
            <button
              type="button"
              onClick={() => setActiveModule('voter-sentiment')}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[40px] text-xs font-medium rounded-lg border border-slate-700 text-slate-200 hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              Citizen Pulse
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Phase Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-800/90">
          <div className="text-xs text-slate-400">
            Active Transition Stage:{' '}
            <span className="font-semibold text-white">{transitionPhase}</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-full">
            {PHASES.map((phase) => {
              const active = transitionPhase === phase;
              return (
                <button
                  key={phase}
                  type="button"
                  disabled={!canWrite}
                  onClick={() => setTransitionPhase(phase)}
                  className={`px-3 py-1.5 min-h-[36px] text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500 disabled:opacity-60'
                  }`}
                >
                  {phase}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {bannerMessage && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="truncate">{bannerMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setBannerMessage(null)}
            className="text-[11px] font-semibold underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 4 Readiness KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Government Readiness</span>
            <Rocket className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1.5">
            {readiness.overallReadinessScore} / 100
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {readiness.day1To30Count} Days 1–30 executive directives
          </div>
        </div>

        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>100-Day Plan Execution</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400 mt-1.5">
            {readiness.avgActionProgressPct}%
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {readiness.completedActions} completed · {readiness.inProgressActions} active ({readiness.totalActions} total)
          </div>
        </div>

        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Ideas &amp; Policy Bank</span>
            <Lightbulb className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1.5">
            {readiness.totalIdeas} Plans
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {readiness.approvedOrPlannedIdeas} Cabinet-approved or promoted
          </div>
        </div>

        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Cabinet &amp; Handover Audit</span>
            <Building2 className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1.5">
            {readiness.cabinetConfirmedCount}/{readiness.cabinetTotal} Ready
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {readiness.auditsVerifiedCount}/{readiness.auditsTotal} handover audits verified
          </div>
        </div>
      </div>

      {/* Horizontal Scrollable Mobile-Friendly Portal Tabs */}
      <div
        role="tablist"
        aria-label="Post-Election Portal Sections"
        className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1"
      >
        {(
          [
            { id: 'day-100', label: '100-Day Action Plan', icon: Rocket, count: transitionActions.length },
            { id: 'ideas-bank', label: 'Ideas & Policy Bank', icon: Lightbulb, count: governanceIdeas.length },
            { id: 'cabinet-setup', label: 'Cabinet & Agencies', icon: Users, count: cabinetPortfolios.length },
            { id: 'handover-audit', label: 'Handover Audit & LGAs', icon: ClipboardCheck, count: handoverAudits.length },
            { id: 'projects-map', label: 'Projects Map & Print', icon: MapIcon, count: TRANSITION_LGA_PROJECTS.length },
          ] as const
        ).map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(item.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 min-h-[40px] rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 ${
                active
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-emerald-700 dark:border-emerald-600'
                  : 'bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{item.label}</span>
              <span
                className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
                  active
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {item.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: 100-DAY ACTION PLAN */}
      {tab === 'day-100' && (
        <section className="space-y-4">
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative w-full sm:flex-1 sm:min-w-[220px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={actionSearch}
                  onChange={(e) => setActionSearch(e.target.value)}
                  placeholder="Search 100-day directives, offices, or KPIs..."
                  aria-label="Search transition actions"
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <select
                  aria-label="Filter actions by sector"
                  value={actionSectorFilter}
                  onChange={(e) =>
                    setActionSectorFilter(e.target.value as 'All' | TransitionSector)
                  }
                  className="flex-1 sm:flex-none px-2.5 py-2 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  <option value="All">All Sectors</option>
                  {SECTORS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>

                <select
                  aria-label="Filter actions by zone"
                  value={actionZoneFilter}
                  onChange={(e) => setActionZoneFilter(e.target.value)}
                  className="flex-1 sm:flex-none px-2.5 py-2 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  <option value="All">All Zones</option>
                  {ZONES.map((z) => (
                    <option key={z} value={z}>
                      {z}
                    </option>
                  ))}
                </select>

                {canWrite && (
                  <button
                    type="button"
                    onClick={() => setShowNewActionForm((v) => !v)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 min-h-[38px] text-xs font-semibold text-white rounded-md whitespace-nowrap"
                    style={{ backgroundColor: branding.primaryColor }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Plan Item
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {(['All', ...WINDOWS] as const).map((win) => (
                <button
                  key={win}
                  type="button"
                  onClick={() => setActionWindowFilter(win)}
                  className={`px-3 py-1.5 min-h-[34px] text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                    actionWindowFilter === win
                      ? 'bg-emerald-700 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {win}
                </button>
              ))}
            </div>
          </div>

          {showNewActionForm && canWrite && (
            <form
              onSubmit={handleCreateAction}
              className="bg-white dark:bg-[#111827] border border-emerald-300 dark:border-emerald-800 rounded-lg p-5 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Create Post-Election Action Milestone
                </h3>
                <button
                  type="button"
                  onClick={() => setShowNewActionForm(false)}
                  className="text-xs text-slate-500 underline"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <input
                  required
                  type="text"
                  value={newActTitle}
                  onChange={(e) => setNewActTitle(e.target.value)}
                  placeholder="Action milestone title..."
                  className="sm:col-span-2 px-3 py-2 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                />
                <select
                  value={newActSector}
                  onChange={(e) => setNewActSector(e.target.value as TransitionSector)}
                  className="px-3 py-2 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                >
                  {SECTORS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <select
                  value={newActWindow}
                  onChange={(e) => setNewActWindow(e.target.value as TransitionDayWindow)}
                  className="px-3 py-2 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                >
                  {WINDOWS.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <select
                  value={newActZone}
                  onChange={(e) => setNewActZone(e.target.value as (typeof ZONES)[number])}
                  className="px-3 py-2 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                >
                  {ZONES.map((z) => (
                    <option key={z} value={z}>
                      {z}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={newActLead}
                  onChange={(e) => setNewActLead(e.target.value)}
                  placeholder="Lead ministry / office..."
                  className="px-3 py-2 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                />
                <select
                  value={newActPriority}
                  onChange={(e) => setNewActPriority(e.target.value as TaskPriority)}
                  className="px-3 py-2 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                >
                  <option value="urgent">Priority: Urgent</option>
                  <option value="high">Priority: High</option>
                  <option value="medium">Priority: Medium</option>
                  <option value="low">Priority: Low</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={newActMetric}
                  onChange={(e) => setNewActMetric(e.target.value)}
                  placeholder="Target outcome metric (e.g. 12 LGA Wi-Fi zones live)..."
                  className="px-3 py-2 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                />
                <input
                  type="text"
                  value={newActDeliverables}
                  onChange={(e) => setNewActDeliverables(e.target.value)}
                  placeholder="Key checklist steps separated by semicolons (;)"
                  className="px-3 py-2 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                />
              </div>

              <textarea
                rows={2}
                value={newActSummary}
                onChange={(e) => setNewActSummary(e.target.value)}
                placeholder="Brief implementation description..."
                className="w-full px-3 py-2 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 min-h-[38px] text-xs font-semibold text-white rounded-md"
                  style={{ backgroundColor: branding.primaryColor }}
                >
                  Save to Governance Plan
                </button>
              </div>
            </form>
          )}

          <div className="space-y-4">
            {filteredActions.map((action) => (
              <article
                key={action.id}
                className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-lg p-4 sm:p-5 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span className="font-mono font-semibold px-2 py-0.5 rounded bg-slate-900 text-white dark:bg-slate-800">
                        {action.window}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 font-medium">
                        {action.sector}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {action.zone}
                      </span>
                      {action.priority === 'urgent' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/50 dark:text-red-300 font-semibold">
                          <Flame className="w-3 h-3" /> Day-1 Critical
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                      {action.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {action.summary}
                    </p>
                  </div>

                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-md border ${statusBadgeStyle(
                        action.status
                      )}`}
                    >
                      {action.status} · {action.progressPct}%
                    </span>
                    {canWrite && (
                      <select
                        aria-label={`Change status for ${action.title}`}
                        value={action.status}
                        onChange={(e) =>
                          updateTransitionActionStatus(
                            action.id,
                            e.target.value as TransitionActionStatus
                          )
                        }
                        className="px-2.5 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                      >
                        {ACTION_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 transition-all duration-300"
                      style={{ width: `${action.progressPct}%` }}
                    />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <span>Lead: {action.leadOffice}</span>
                    <span className="font-medium text-emerald-700 dark:text-emerald-400">
                      Target: {action.targetMetric}
                    </span>
                  </div>
                </div>

                {/* Deliverables Checklist & Task Sync */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    {action.deliverables.map((del) => (
                      <label
                        key={del.id}
                        className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          disabled={!canWrite}
                          checked={del.done}
                          onChange={() => toggleTransitionDeliverable(action.id, del.id)}
                          className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className={del.done ? 'line-through text-slate-400' : ''}>
                          {del.label}
                        </span>
                      </label>
                    ))}
                  </div>

                  {canWrite && (
                    <button
                      type="button"
                      disabled={Boolean(syncedTasksMap[action.id])}
                      onClick={() => {
                        createTask({
                          title: `[Transition] ${action.title}`,
                          description: `${action.summary} Target: ${action.targetMetric}`,
                          department: action.leadOffice,
                          supervisor: currentUser.displayName,
                          assigneeName: action.leadOffice,
                          stateCode: 'KT',
                          lga: action.zone === 'Katsina Central' ? 'Katsina' : undefined,
                          priority: action.priority,
                          status: action.status === 'Completed' ? 'Completed' : 'In Progress',
                          dueDate: '2027-06-30',
                          subtasks: action.deliverables.map((d) => ({
                            id: d.id,
                            label: d.label,
                            done: d.done,
                          })),
                          isDemo: false,
                        });
                        setSyncedTasksMap((prev) => ({ ...prev, [action.id]: true }));
                        notify(`Created workflow task in Tasks module for "${action.title}".`);
                      }}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 min-h-[36px] text-xs font-medium border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60 whitespace-nowrap shrink-0"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      {syncedTasksMap[action.id] ? 'Synced to Tasks' : 'Send to Tasks Workflow'}
                    </button>
                  )}
                </div>
              </article>
            ))}

            {filteredActions.length === 0 && (
              <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-lg p-8 text-center text-xs text-slate-500">
                No transition actions match your current filters.
              </div>
            )}
          </div>
        </section>
      )}

      {/* TAB 2: GOVERNMENT IDEAS & POLICY BANK */}
      {tab === 'ideas-bank' && (
        <section className="space-y-4">
          <div className="rounded-lg bg-emerald-950/95 text-white border border-emerald-800/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5 text-xs">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-white">
                  Actionable Ideas Repository — Turn Campaign Promises Into Cabinet Execution
                </div>
                <p className="text-emerald-200/80 mt-0.5">
                  Propose new policies, endorse high-impact ideas, or promote vetted plans straight
                  into your First 100-Day Government Action Plan in one click.
                </p>
              </div>
            </div>
            {canWrite && (
              <button
                type="button"
                onClick={() => setShowNewIdeaForm((v) => !v)}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[38px] text-xs font-semibold rounded-md bg-emerald-400 text-slate-950 hover:bg-emerald-300 whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                Submit Idea / Plan
              </button>
            )}
          </div>

          {/* Search & Filters */}
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-lg p-4 flex flex-wrap items-center gap-2.5">
            <div className="relative w-full sm:flex-1 sm:min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={ideaSearch}
                onChange={(e) => setIdeaSearch(e.target.value)}
                placeholder="Search ideas (e.g. Rimi Wind, Free Internet, AI, cold chain)..."
                aria-label="Search governance ideas"
                className="w-full pl-8 pr-3 py-2 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
              />
            </div>

            <select
              aria-label="Filter ideas by sector"
              value={ideaSectorFilter}
              onChange={(e) => setIdeaSectorFilter(e.target.value as 'All' | TransitionSector)}
              className="flex-1 sm:flex-none px-2.5 py-2 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
            >
              <option value="All">All Sectors</option>
              {SECTORS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter ideas by review status"
              value={ideaStatusFilter}
              onChange={(e) =>
                setIdeaStatusFilter(e.target.value as 'All' | GovernanceIdeaStatus)
              }
              className="flex-1 sm:flex-none px-2.5 py-2 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
            >
              <option value="All">All Statuses</option>
              {IDEA_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              aria-label="Sort governance ideas"
              value={ideaSortBy}
              onChange={(e) => setIdeaSortBy(e.target.value as 'upvotes' | 'latest')}
              className="flex-1 sm:flex-none px-2.5 py-2 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
            >
              <option value="upvotes">Sort: Most Endorsed</option>
              <option value="latest">Sort: Latest Added</option>
            </select>
          </div>

          {showNewIdeaForm && canWrite && (
            <form
              onSubmit={handleCreateIdea}
              className="bg-white dark:bg-[#111827] border border-emerald-300 dark:border-emerald-800 rounded-lg p-5 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Propose Post-Election Policy Idea or Implementation Plan
                </h3>
                <button
                  type="button"
                  onClick={() => setShowNewIdeaForm(false)}
                  className="text-xs text-slate-500 underline"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <input
                  required
                  type="text"
                  value={newIdeaTitle}
                  onChange={(e) => setNewIdeaTitle(e.target.value)}
                  placeholder="Idea title..."
                  className="sm:col-span-2 px-3 py-2 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                />
                <select
                  value={newIdeaSector}
                  onChange={(e) => setNewIdeaSector(e.target.value as TransitionSector)}
                  className="px-3 py-2 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                >
                  {SECTORS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <select
                  value={newIdeaTimeline}
                  onChange={(e) => setNewIdeaTimeline(e.target.value as TransitionDayWindow)}
                  className="px-3 py-2 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                >
                  {WINDOWS.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={newIdeaZone}
                  onChange={(e) => setNewIdeaZone(e.target.value as (typeof ZONES)[number])}
                  className="px-3 py-2 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                >
                  {ZONES.map((z) => (
                    <option key={z} value={z}>
                      Zone: {z}
                    </option>
                  ))}
                </select>
                <select
                  value={newIdeaBudget}
                  onChange={(e) =>
                    setNewIdeaBudget(
                      e.target.value as
                        | 'Low Cost / Quick Win'
                        | 'Medium Capital'
                        | 'Major Flagship / PPP'
                    )
                  }
                  className="px-3 py-2 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                >
                  <option value="Low Cost / Quick Win">Budget: Low Cost / Quick Win</option>
                  <option value="Medium Capital">Budget: Medium Capital</option>
                  <option value="Major Flagship / PPP">Budget: Major Flagship / PPP</option>
                </select>
              </div>

              <textarea
                required
                rows={2}
                value={newIdeaSummary}
                onChange={(e) => setNewIdeaSummary(e.target.value)}
                placeholder="What problem does this solve and what citizens benefit?"
                className="w-full px-3 py-2 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
              />
              <textarea
                rows={2}
                value={newIdeaPlan}
                onChange={(e) => setNewIdeaPlan(e.target.value)}
                placeholder="Concrete execution steps (3 short sentences become deliverables if promoted)..."
                className="w-full px-3 py-2 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 min-h-[38px] text-xs font-semibold text-white rounded-md"
                  style={{ backgroundColor: branding.primaryColor }}
                >
                  Save to Ideas Bank
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredIdeas.map((idea) => {
              const promoted = Boolean(idea.promotedActionId) || idea.status === 'In 100-Day Plan';
              return (
                <article
                  key={idea.id}
                  className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-lg p-5 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 font-medium">
                          {idea.sector}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {idea.estimatedTimeline}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300">
                          {idea.budgetTier}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => upvoteGovernanceIdea(idea.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 min-h-[34px] rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-mono font-semibold shrink-0"
                        title="Endorse this idea"
                      >
                        <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />
                        {idea.upvotes}
                      </button>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                        {idea.title}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mt-1.5">
                        {idea.summary}
                      </p>
                    </div>

                    <div className="rounded-md bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 p-3 text-xs space-y-1">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        Execution Roadmap ({idea.zone})
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                        {idea.executionPlan}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    <div className="text-[11px] text-slate-500">
                      {idea.submittedBy} · {idea.createdAt}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {canApprove && !promoted && (
                        <select
                          aria-label={`Review status for ${idea.title}`}
                          value={idea.status}
                          onChange={(e) =>
                            updateGovernanceIdeaStatus(
                              idea.id,
                              e.target.value as GovernanceIdeaStatus
                            )
                          }
                          className="px-2 py-1 text-[11px] rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                        >
                          {IDEA_STATUSES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      )}

                      {promoted ? (
                        <button
                          type="button"
                          onClick={() => setTab('day-100')}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 min-h-[34px] text-xs font-semibold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          In 100-Day Plan
                        </button>
                      ) : (
                        canWrite && (
                          <button
                            type="button"
                            onClick={() => {
                              const actionId = promoteGovernanceIdea(idea.id);
                              if (actionId) {
                                notify(
                                  `Promoted "${idea.title}" to the 100-Day Action Plan.`
                                );
                              }
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[34px] text-xs font-semibold text-white rounded-md"
                            style={{ backgroundColor: branding.primaryColor }}
                          >
                            <Rocket className="w-3.5 h-3.5" />
                            Promote to 100-Day Plan
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* TAB 3: CABINET, MINISTRIES & TRANSITION COMMITTEES */}
      {tab === 'cabinet-setup' && (
        <section className="space-y-4">
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-lg p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Executive Council Portfolios, Bureaus &amp; Transition Sub-Committees
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Assign vetting leads, review Day-1 executive directives, and track appointee confirmation across MDAs.
              </p>
            </div>
            {canWrite && (
              <button
                type="button"
                onClick={() => setShowNewCabinetForm((v) => !v)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] text-xs font-semibold text-white rounded-md whitespace-nowrap"
                style={{ backgroundColor: branding.primaryColor }}
              >
                <Plus className="w-3.5 h-3.5" />
                Add Ministry / Agency
              </button>
            )}
          </div>

          {showNewCabinetForm && canWrite && (
            <form
              onSubmit={handleCreateCabinetPortfolio}
              className="bg-white dark:bg-[#111827] border border-emerald-300 dark:border-emerald-800 rounded-lg p-5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold">Add Government Portfolio or Special Agency</h4>
                <button
                  type="button"
                  onClick={() => setShowNewCabinetForm(false)}
                  className="text-xs text-slate-500 underline"
                >
                  Cancel
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  required
                  type="text"
                  value={newMinistryName}
                  onChange={(e) => setNewMinistryName(e.target.value)}
                  placeholder="Ministry or agency name..."
                  className="px-3 py-2 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                />
                <select
                  value={newMinistrySector}
                  onChange={(e) => setNewMinistrySector(e.target.value as TransitionSector)}
                  className="px-3 py-2 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                >
                  {SECTORS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={newMinistryLead}
                  onChange={(e) => setNewMinistryLead(e.target.value)}
                  placeholder="Transition lead / nominee chair..."
                  className="px-3 py-2 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                />
              </div>
              <input
                type="text"
                value={newMinistryDirective}
                onChange={(e) => setNewMinistryDirective(e.target.value)}
                placeholder="Day-1 Executive Directive..."
                className="w-full px-3 py-2 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
              />
              <textarea
                rows={2}
                value={newMinistryMandate}
                onChange={(e) => setNewMinistryMandate(e.target.value)}
                placeholder="Statutory mandate and transition deliverables..."
                className="w-full px-3 py-2 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 min-h-[38px] text-xs font-semibold text-white rounded-md"
                  style={{ backgroundColor: branding.primaryColor }}
                >
                  Save Portfolio
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {cabinetPortfolios.map((port) => {
              const isEditingLead = editingLeadId === port.id;
              return (
                <article
                  key={port.id}
                  className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-lg p-5 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                        {port.sector}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug mt-0.5">
                        {port.ministryName}
                      </h3>
                    </div>

                    {canApprove || canWrite ? (
                      <select
                        aria-label={`Vetting status for ${port.ministryName}`}
                        value={port.vettingStatus}
                        onChange={(e) =>
                          updateCabinetPortfolio(port.id, {
                            vettingStatus: e.target.value as CabinetVettingStatus,
                          })
                        }
                        className={`px-2.5 py-1.5 text-[11px] font-semibold rounded-md border shrink-0 ${statusBadgeStyle(
                          port.vettingStatus
                        )}`}
                      >
                        {VETTING_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-md border shrink-0 ${statusBadgeStyle(
                          port.vettingStatus
                        )}`}
                      >
                        {port.vettingStatus}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {port.statutoryMandate}
                  </p>

                  <div className="rounded-md bg-slate-50 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 p-3 text-xs">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      Day-1 Directive:{' '}
                    </span>
                    <span className="text-slate-600 dark:text-slate-300">
                      {port.dayOneDirective}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {port.kpis.map((kpi) => (
                      <span
                        key={kpi}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 text-[11px]"
                      >
                        <CheckCircle2 className="w-3 h-3 shrink-0" /> {kpi}
                      </span>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                    {isEditingLead ? (
                      <div className="flex items-center gap-2 w-full">
                        <input
                          type="text"
                          value={editingLeadDraft}
                          onChange={(e) => setEditingLeadDraft(e.target.value)}
                          className="flex-1 px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (editingLeadDraft.trim()) {
                              updateCabinetPortfolio(port.id, {
                                transitionLead: editingLeadDraft.trim(),
                              });
                            }
                            setEditingLeadId(null);
                          }}
                          className="px-2.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="text-slate-600 dark:text-slate-300">
                          Lead: <span className="font-semibold">{port.transitionLead}</span> ·{' '}
                          <span className="font-mono text-[11px]">
                            {port.committeeSize} committee members
                          </span>
                        </div>
                        {canWrite && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingLeadId(port.id);
                              setEditingLeadDraft(port.transitionLead);
                            }}
                            className="text-xs font-medium text-emerald-700 dark:text-emerald-400 underline"
                          >
                            Assign Lead
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* TAB 4: HANDOVER AUDIT & KATSINA 34-LGA READINESS */}
      {tab === 'handover-audit' && (
        <section className="space-y-6">
          <div className="space-y-4">
            {handoverAudits.map((audit) => {
              const draft = auditNotesDraft[audit.id] ?? audit.notes;
              return (
                <article
                  key={audit.id}
                  className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-lg p-5 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-[11px]">
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                          {audit.department}
                        </span>
                        {audit.priority === 'critical' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 font-semibold">
                            <ShieldAlert className="w-3 h-3" /> Forensic Priority
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {audit.workstream}
                      </h3>
                    </div>

                    {canWrite ? (
                      <select
                        aria-label={`Audit status for ${audit.workstream}`}
                        value={audit.status}
                        onChange={(e) =>
                          updateHandoverAuditItem(audit.id, {
                            status: e.target.value as HandoverAuditStatus,
                          })
                        }
                        className={`px-2.5 py-1.5 text-xs font-semibold rounded-md border shrink-0 ${statusBadgeStyle(
                          audit.status
                        )}`}
                      >
                        {AUDIT_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span
                        className={`px-2.5 py-1 text-xs font-semibold rounded-md border shrink-0 ${statusBadgeStyle(
                          audit.status
                        )}`}
                      >
                        {audit.status}
                      </span>
                    )}
                  </div>

                  <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400 list-disc pl-5">
                    {audit.keyQuestions.map((q) => (
                      <li key={q}>{q}</li>
                    ))}
                  </ul>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2">
                    <input
                      type="text"
                      disabled={!canWrite}
                      value={draft}
                      onChange={(e) =>
                        setAuditNotesDraft((prev) => ({ ...prev, [audit.id]: e.target.value }))
                      }
                      aria-label={`Audit notes for ${audit.workstream}`}
                      className="flex-1 px-3 py-2 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                    />
                    {canWrite && (
                      <button
                        type="button"
                        onClick={() => {
                          updateHandoverAuditItem(audit.id, { notes: draft });
                          notify(`Updated handover notes for "${audit.workstream}".`);
                        }}
                        className="px-3.5 py-2 min-h-[38px] text-xs font-semibold text-white rounded-md whitespace-nowrap"
                        style={{ backgroundColor: branding.primaryColor }}
                      >
                        Save Audit Note
                      </button>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2">
                    <span>Owner: {audit.owner}</span>
                    <span className="font-mono">Last Updated: {audit.updatedAt}</span>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Katsina Senatorial Zones Governance & Handover Coverage */}
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-lg p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Katsina State Zonal Governance Footprint ({KATSINA_INEC_META.totalLgas} LGAs ·{' '}
                  {KATSINA_INEC_META.totalWards} Wards)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Direct handover structure for deploying Local Government transition committees across all three senatorial zones.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveModule('settings-admin')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] text-xs font-semibold border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                Inspect All 361 Wards
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {katsinaZoneStats.map((z) => (
                <div
                  key={z.zoneName}
                  className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-900/70 space-y-2"
                >
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {z.zoneName}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-[11px] text-slate-500">LGAs / Wards</div>
                      <div className="font-mono font-bold">
                        {z.lgaCount} / {z.wardsCount}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-500">Polling Units</div>
                      <div className="font-mono font-bold">
                        {z.pollingUnitsCount.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Mandate Electorate:{' '}
                    <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                      {z.registeredVoters.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* TAB 5: LGA TRANSITION PROJECTS MAP, SECTOR CHART & PRINTABLE EXECUTIVE CHARTER */}
      {tab === 'projects-map' && (
        <section className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
            <div className="xl:col-span-7 min-w-0">
              <KatsinaMapboxViz
                simulation={katsinaSim}
                selectedLgaId={selectedProjectLgaId}
                onSelectLga={setSelectedProjectLgaId}
                initialVizMode="transition"
                heightClass="h-[320px] sm:h-[420px]"
              />
            </div>

            <div className="xl:col-span-5 space-y-4 min-w-0">
              <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-lg p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Selected LGA Anchor Projects
                  </h3>
                  <span className="font-mono text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                    {katsinaSim.lgaById[selectedProjectLgaId]?.lga.name || 'Katsina'} LGA
                  </span>
                </div>

                {(TRANSITION_PROJECTS_BY_LGA_ID[selectedProjectLgaId] ?? []).length > 0 ? (
                  <div className="space-y-3">
                    {TRANSITION_PROJECTS_BY_LGA_ID[selectedProjectLgaId].map((pin) => (
                      <div
                        key={pin.id}
                        className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2 text-[11px]">
                          <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                            {pin.sector}
                          </span>
                          <span className="font-mono text-slate-500">{pin.window}</span>
                        </div>
                        <div className="font-bold text-slate-900 dark:text-white">{pin.title}</div>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                          {pin.summary}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Covered under Statewide 361-Ward Free Public Wi-Fi, Free Public Tuition, and Ward PHC Solarization programs. Select Rimi, Katsina, Daura, Funtua, Batsari, Bakori, or Malumfashi for flagship capital hub details.
                  </p>
                )}

                <div className="pt-2 flex flex-wrap gap-1.5">
                  {['rimi', 'katsina', 'daura', 'funtua', 'bakori', 'batsari'].map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setSelectedProjectLgaId(id)}
                      className={`px-2.5 py-1 text-[11px] font-medium rounded border capitalize ${
                        selectedProjectLgaId === id
                          ? 'bg-emerald-700 text-white border-emerald-600'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {katsinaSim.lgaById[id]?.lga.name || id}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sector Allocation Chart */}
              <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-lg p-5 space-y-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Policy Pipeline by Governance Sector
                </h3>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sectorChartData} margin={{ top: 6, right: 8, left: -24, bottom: 0 }}>
                      <XAxis dataKey="sector" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="ideas" name="Policy Ideas" radius={[4, 4, 0, 0]}>
                        {sectorChartData.map((entry, idx) => (
                          <Cell
                            key={entry.sector}
                            fill={idx % 2 === 0 ? '#0D5C38' : '#0284C7'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Printable Executive Transition Charter Sheet */}
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-lg p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Printable Executive Transition Brief &amp; Day-1 Directives
                </h3>
                <p className="text-xs text-slate-500">
                  Formatted A4 briefing sheet compiling active transition stage ({transitionPhase}), confirmed portfolios, and Days 1–30 orders.
                </p>
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                className="no-print inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] text-xs font-semibold text-white rounded-md"
                style={{ backgroundColor: branding.primaryColor }}
              >
                <Printer className="w-3.5 h-3.5" />
                Print / Save PDF Brief
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <div className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                  Priority Transition Milestones ({transitionActions.length})
                </div>
                <ul className="space-y-1.5">
                  {transitionActions.slice(0, 6).map((a) => (
                    <li key={a.id} className="border-b border-slate-100 dark:border-slate-800 pb-1.5">
                      <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                        [{a.window}]
                      </span>{' '}
                      <span className="font-semibold text-slate-900 dark:text-white">{a.title}</span>
                      <div className="text-[11px] text-slate-500">
                        Lead: {a.leadOffice} · {a.status} ({a.progressPct}%)
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-2">
                <div className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                  Cabinet Portfolio Day-1 Mandates ({cabinetPortfolios.length})
                </div>
                <ul className="space-y-1.5">
                  {cabinetPortfolios.slice(0, 6).map((c) => (
                    <li key={c.id} className="border-b border-slate-100 dark:border-slate-800 pb-1.5">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {c.ministryName}
                      </span>{' '}
                      <span className="font-mono text-[10px] text-sky-700 dark:text-sky-400">
                        ({c.vettingStatus})
                      </span>
                      <div className="text-[11px] text-slate-500">{c.dayOneDirective}</div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
