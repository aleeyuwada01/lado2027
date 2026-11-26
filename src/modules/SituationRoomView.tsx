import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ClipboardList,
  Download,
  Globe,
  Headphones,
  MapPin,
  Maximize2,
  Megaphone,
  Minimize2,
  Printer,
  Radio,
  ShieldAlert,
  Target,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useCampaign } from '../context/CampaignContext';
import { STATE_BY_CODE } from '../data/nigeriaGeo';
import { NigeriaMap, type MapLayerMode } from '../components/NigeriaMap';
import { KatsinaMapboxViz } from '../components/KatsinaMapboxViz';
import { KatsinaLgaInspector } from '../components/KatsinaLgaInspector';
import { QuickCommandModal, type QuickCommandTab } from '../components/QuickCommandModal';
import { formatDurationSeconds } from '../lib/analytics';
import {
  createDefaultSimulationConfig,
  exportKatsinaSimulationCsv,
  runKatsinaSimulation,
  SIMULATION_PRESETS,
  type SimulationConfig,
  type SimulationPresetId,
} from '../lib/electionSimulator';

const PRIORITY_KATSINA_LGA_IDS = [
  'katsina',
  'malumfashi',
  'funtua',
  'kafur',
  'kankara',
  'bakori',
] as const;

export const SituationRoomView: React.FC = () => {
  const {
    branding,
    metrics,
    stateSummaries,
    zoneSummaries,
    selectedStateCode,
    setSelectedStateCode,
    incidents,
    fieldReports,
    checkIns,
    calls,
    callOperators,
    tasks,
    setActiveModule,
    fullscreenSituationRoom,
    setFullscreenSituationRoom,
    firebaseSyncActive,
  } = useCampaign();

  const [mapScope, setMapScope] = useState<'katsina' | 'national'>('katsina');
  const [mapLayer, setMapLayer] = useState<MapLayerMode>('coverage');
  const [selectedKatsinaLgaId, setSelectedKatsinaLgaId] = useState<string>('katsina');
  const [quickModalOpen, setQuickModalOpen] = useState<boolean>(false);
  const [quickModalTab, setQuickModalTab] = useState<QuickCommandTab>('incident');
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [simConfig, setSimConfig] = useState<SimulationConfig>(() =>
    createDefaultSimulationConfig('lado-victory')
  );

  const katsinaSim = useMemo(() => runKatsinaSimulation(simConfig), [simConfig]);
  const selectedKatsinaLga = katsinaSim.lgaById[selectedKatsinaLgaId] ?? katsinaSim.lgas[0];

  const openQuickModal = (tab: QuickCommandTab) => {
    setQuickModalTab(tab);
    setQuickModalOpen(true);
  };

  const handleExportBriefCsv = () => {
    const csv = exportKatsinaSimulationCsv(katsinaSim);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `katsina-lado-victory-brief-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExportNotice('34-LGA INEC Victory Brief exported as CSV.');
    window.setTimeout(() => setExportNotice(null), 3500);
  };

  const selectedState = STATE_BY_CODE[selectedStateCode];
  const selectedSummary = stateSummaries[selectedStateCode];

  const liveClock = useMemo(() => {
    const now = new Date();
    return now.toLocaleString('en-NG', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }, []);

  const openIncidents = useMemo(
    () => incidents.filter((i) => i.status !== 'Resolved' && i.status !== 'Closed').slice(0, 5),
    [incidents]
  );

  const escalatedTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.status !== 'Completed' && t.status !== 'Cancelled')
        .sort((a, b) => (a.priority === 'urgent' ? -1 : b.priority === 'urgent' ? 1 : 0))
        .slice(0, 4),
    [tasks]
  );

  const handlePresetChange = (presetId: SimulationPresetId) => {
    setSimConfig(createDefaultSimulationConfig(presetId));
  };

  const handleChangeLgaTargetWards = (lgaId: string, wardsCount: number) => {
    setSimConfig((prev) => {
      const nextWardOverrides = { ...prev.wardWinnerOverrides };
      const lga = katsinaSim.lgaById[lgaId]?.lga;
      if (lga) {
        for (const w of lga.wards) {
          delete nextWardOverrides[w.id];
        }
      }
      return {
        ...prev,
        lgaWardTargetOverrides: { ...prev.lgaWardTargetOverrides, [lgaId]: wardsCount },
        wardWinnerOverrides: nextWardOverrides,
      };
    });
  };

  const handleToggleWardWinner = (wardId: string, winner: 'PDP' | 'APC' | 'ADC') => {
    setSimConfig((prev) => ({
      ...prev,
      wardWinnerOverrides: { ...prev.wardWinnerOverrides, [wardId]: winner },
    }));
  };

  const handleResetLga = (lgaId: string) => {
    setSimConfig((prev) => {
      const nextLga = { ...prev.lgaWardTargetOverrides };
      delete nextLga[lgaId];
      const nextWards = { ...prev.wardWinnerOverrides };
      const lga = katsinaSim.lgaById[lgaId]?.lga;
      if (lga) {
        for (const w of lga.wards) {
          delete nextWards[w.id];
        }
      }
      return {
        ...prev,
        lgaWardTargetOverrides: nextLga,
        wardWinnerOverrides: nextWards,
      };
    });
  };

  const hasLgaOverride = useMemo(() => {
    if (simConfig.lgaWardTargetOverrides[selectedKatsinaLgaId] !== undefined) return true;
    return selectedKatsinaLga.lga.wards.some(
      (w) => simConfig.wardWinnerOverrides[w.id] !== undefined
    );
  }, [simConfig, selectedKatsinaLgaId, selectedKatsinaLga]);

  return (
    <div className={fullscreenSituationRoom ? 'p-6 space-y-6' : 'space-y-6'}>
      {/* Command Header Row */}
      <div className="flex flex-wrap xl:flex-nowrap items-center justify-between gap-4 pb-5 border-b border-slate-200/90 dark:border-slate-800">
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          {branding.partyLogoDataUrl && (
            <img
              src={branding.partyLogoDataUrl}
              alt="PDP Crest"
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 bg-white shrink-0 hidden sm:block"
            />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-start sm:items-center gap-2 min-w-0">
              <Radio className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-1 sm:mt-0" />
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-950 dark:text-white font-display leading-snug sm:truncate">
                Executive Situation Room — {branding.candidateName}
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed sm:truncate">
              {branding.partyAffiliation} · {branding.headquarters} · {liveClock} WAT ·{' '}
              <span
                className={
                  firebaseSyncActive
                    ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                    : 'text-amber-700 dark:text-amber-400 font-medium'
                }
              >
                {firebaseSyncActive ? 'Realtime Cloud Sync' : 'Demo Operational Feed'}
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto shrink-0">
          {/* Dual Map Scope Switcher: Katsina 34-LGA INEC Studio vs National 36+FCT */}
          <div className="flex items-center bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800 flex-1 sm:flex-none">
            <button
              type="button"
              onClick={() => setMapScope('katsina')}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 min-h-[38px] sm:min-h-[34px] text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                mapScope === 'katsina'
                  ? 'bg-[#0D5C38] text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              Katsina 34 LGAs
            </button>
            <button
              type="button"
              onClick={() => setMapScope('national')}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 min-h-[38px] sm:min-h-[34px] text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                mapScope === 'national'
                  ? 'bg-slate-900 dark:bg-slate-700 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              Nigeria 36+FCT
            </button>
          </div>

          <button
            type="button"
            onClick={() => setFullscreenSituationRoom(!fullscreenSituationRoom)}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#0A0F1A] dark:bg-slate-800 text-white rounded-lg hover:opacity-92 transition-opacity whitespace-nowrap"
          >
            {fullscreenSituationRoom ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" /> Exit Wall Mode
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" /> Wall Display Mode
              </>
            )}
          </button>
        </div>
      </div>

      {/* Easy-to-Use 1-Click Command Quick-Action Strip */}
      <div
        aria-label="Quick Campaign Actions"
        data-testid="situation-quick-actions"
        className="no-print flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between gap-2.5 bg-white dark:bg-[#0F172A] border border-slate-200/90 dark:border-slate-800 rounded-xl p-3 sm:px-3.5 sm:py-2.5 shadow-2xs"
      >
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mr-1 hidden sm:inline">
            Quick Actions:
          </span>
          <button
            type="button"
            onClick={() => openQuickModal('incident')}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 min-h-[38px] text-xs font-semibold text-white bg-[#0D5C38] hover:bg-[#09452A] rounded-lg transition-colors whitespace-nowrap"
          >
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            Log Incident
          </button>
          <button
            type="button"
            onClick={() => openQuickModal('field-report')}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 min-h-[38px] text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-100/90 dark:bg-slate-800/90 hover:bg-slate-200/80 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap"
          >
            <ClipboardList className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
            Field Report
          </button>
          <button
            type="button"
            onClick={() => openQuickModal('dispatch')}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 min-h-[38px] text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-100/90 dark:bg-slate-800/90 hover:bg-slate-200/80 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap"
          >
            <Megaphone className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            Dispatch
          </button>
          <button
            type="button"
            onClick={() => setActiveModule('settings-admin')}
            data-testid="sitroom-admin-wards-btn"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 min-h-[38px] text-xs font-semibold text-emerald-900 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-lg transition-colors whitespace-nowrap"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
            States & Wards
          </button>
          <button
            type="button"
            onClick={handleExportBriefCsv}
            data-testid="export-brief-csv-btn"
            className="sm:hidden col-span-2 inline-flex items-center justify-center gap-1.5 px-3 py-2 min-h-[38px] text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            Export Brief CSV
          </button>
        </div>

        {exportNotice && (
          <div className="sm:hidden text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 pt-1">
            {exportNotice}
          </div>
        )}

        <div className="hidden sm:flex flex-wrap items-center gap-2">
          {exportNotice && (
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
              {exportNotice}
            </span>
          )}
          <button
            type="button"
            onClick={handleExportBriefCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[38px] text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            Export Brief CSV
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[38px] text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Brief
          </button>
        </div>
      </div>

      {/* Advanced Executive Victory Telemetry Banner (Exact Oct 2026 INEC 3,876,051 Baseline) */}
      <section
        aria-label="Katsina INEC Election Simulation Telemetry"
        className="bg-[#0A0F1A] text-white rounded-2xl border border-slate-800 p-5 space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
              <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                Katsina Victory Projection — PDP Yakubu Lado Leads by +{katsinaSim.marginOverRunnerUp.toLocaleString()}
              </span>
              <span className="hidden sm:inline text-slate-600" aria-hidden="true">·</span>
              <span className="text-slate-300 font-mono">
                {katsinaSim.pdpWardsWon}/361 Wards · {katsinaSim.pdpLgasWon}/34 LGAs Won · 25% Spread ({katsinaSim.lgasMeeting25PctSpread}/34)
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Simulated Pool: <span className="font-mono text-white font-semibold">{katsinaSim.projectedValidVotes.toLocaleString()}</span> valid votes ({katsinaSim.turnoutPct}%) of{' '}
              <span className="font-mono text-slate-200">{katsinaSim.totalRegisteredVoters.toLocaleString()}</span> INEC Oct 2026 voters (#4 nationally) across{' '}
              <span className="font-mono text-slate-200">6,652</span> polling units · 2023 PDP Baseline:{' '}
              <span className="font-mono text-emerald-300">{katsinaSim.baseline2023PdpVotes.toLocaleString()}</span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 w-full lg:w-auto shrink-0">
            <div className="grid grid-cols-3 sm:inline-flex bg-slate-900 border border-slate-800 p-0.5 rounded-lg gap-0.5">
              {SIMULATION_PRESETS.map((preset) => {
                const mobileLabel =
                  preset.id === 'lado-victory'
                    ? 'Victory Path'
                    : preset.id === 'grassroots-sweep'
                      ? 'Grassroots'
                      : 'Battleground';
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handlePresetChange(preset.id)}
                    className={`px-1.5 sm:px-2.5 py-2 sm:py-1.5 text-[11px] font-medium rounded-md transition-colors text-center whitespace-nowrap ${
                      simConfig.presetId === preset.id
                        ? 'bg-[#0D5C38] text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="sm:hidden">{mobileLabel}</span>
                    <span className="hidden sm:inline">{preset.shortLabel}</span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setActiveModule('katsina-simulator')}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 text-[11px] font-semibold text-emerald-300 bg-emerald-950/80 border border-emerald-800/80 rounded-lg hover:bg-emerald-900/70 transition-colors whitespace-nowrap"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Full Simulator Studio
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* 4-Party Comparative Share Bar + Compact Numbers */}
        <div className="space-y-2.5">
          <div className="h-2.5 w-full rounded-full overflow-hidden flex bg-slate-800">
            <div style={{ width: `${katsinaSim.pdpSharePct}%` }} className="bg-emerald-500 transition-all duration-200" />
            <div style={{ width: `${katsinaSim.apcSharePct}%` }} className="bg-sky-500 transition-all duration-200" />
            <div style={{ width: `${katsinaSim.adcSharePct}%` }} className="bg-amber-500 transition-all duration-200" />
            <div style={{ width: `${katsinaSim.othersSharePct}%` }} className="bg-slate-500 transition-all duration-200" />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono tabular-nums">
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-emerald-950/50 border border-emerald-800/60">
              <span className="font-sans font-semibold text-emerald-300">PDP (Lado)</span>
              <span className="font-bold text-white">
                {katsinaSim.pdpVotes.toLocaleString()} ({katsinaSim.pdpSharePct}%)
              </span>
            </div>
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-900/90 border border-slate-800">
              <span className="font-sans font-semibold text-sky-400">APC</span>
              <span className="text-slate-200">
                {katsinaSim.apcVotes.toLocaleString()} ({katsinaSim.apcSharePct}%)
              </span>
            </div>
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-900/90 border border-slate-800">
              <span className="font-sans font-semibold text-amber-400">ADC</span>
              <span className="text-slate-200">
                {katsinaSim.adcVotes.toLocaleString()} ({katsinaSim.adcSharePct}%)
              </span>
            </div>
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-900/90 border border-slate-800">
              <span className="font-sans font-semibold text-slate-400">Others</span>
              <span className="text-slate-300">
                {katsinaSim.othersVotes.toLocaleString()} ({katsinaSim.othersSharePct}%)
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Executive Operational KPI Strip (100% Computed from Live Records with Progress Bars) */}
      <section
        aria-label="Executive Situation Room Metrics"
        className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3.5"
      >
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between gap-2.5 shadow-2xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Personnel</span>
            <Users className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold tabular-nums text-slate-950 dark:text-white leading-none">
            {metrics.totalPersonnel}
          </div>
          <div className="text-[11px] text-slate-500 tabular-nums">
            {metrics.activeCoordinators} coords · {metrics.volunteerCount} volunteers
          </div>
        </div>

        <div className="bg-white dark:bg-[#0F172A] border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between gap-2.5 shadow-2xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Agents Active</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400 leading-none">
            {metrics.agentsCheckedIn}
            <span className="text-sm font-semibold text-slate-400">/{metrics.registeredAgents}</span>
          </div>
          <div className="space-y-1">
            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 dark:bg-emerald-500 rounded-full"
                style={{
                  width: `${Math.min(
                    100,
                    metrics.registeredAgents > 0
                      ? Math.round((metrics.agentsCheckedIn / metrics.registeredAgents) * 100)
                      : 0
                  )}%`,
                }}
              />
            </div>
            <div className="text-[11px] text-slate-500 tabular-nums">
              {metrics.statesWithActivePersonnel}/{metrics.totalStates} states · {metrics.lgasCoveredCount} LGAs
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0F172A] border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between gap-2.5 shadow-2xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">PU Coverage</span>
            <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold tabular-nums text-slate-950 dark:text-white leading-none">
            {metrics.pollingUnitsAssigned}
            <span className="text-sm font-semibold text-slate-400">/{metrics.pollingUnitsTotal}</span>
          </div>
          <div className="space-y-1">
            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#0D5C38] dark:bg-emerald-500 rounded-full"
                style={{
                  width: `${Math.min(
                    100,
                    metrics.pollingUnitsTotal > 0
                      ? Math.round((metrics.pollingUnitsAssigned / metrics.pollingUnitsTotal) * 100)
                      : 0
                  )}%`,
                }}
              />
            </div>
            <div className="text-[11px] text-slate-500 tabular-nums">
              {metrics.pollingUnitsUnassigned} open · {metrics.pendingFieldReports} reports
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0F172A] border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between gap-2.5 shadow-2xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Open Incidents</span>
            <ShieldAlert className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold tabular-nums text-red-700 dark:text-red-400 leading-none">
            {metrics.openIncidents}
          </div>
          <div className="text-[11px] text-slate-500 tabular-nums">
            {metrics.highPriorityIncidents} urgent · {metrics.resolvedIncidents} resolved
          </div>
        </div>

        <div className="bg-white dark:bg-[#0F172A] border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between gap-2.5 shadow-2xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Call Center</span>
            <Headphones className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold tabular-nums text-slate-950 dark:text-white leading-none">
            {metrics.callsTotal}
          </div>
          <div className="text-[11px] text-slate-500 tabular-nums">
            {metrics.callsWaiting} waiting · AHT {formatDurationSeconds(metrics.avgHandlingSeconds)}
          </div>
        </div>

        <div className="bg-white dark:bg-[#0F172A] border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between gap-2.5 shadow-2xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Ops Pipeline</span>
            <Zap className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold tabular-nums text-slate-950 dark:text-white leading-none">
            {metrics.pendingTasks}
          </div>
          <div className="text-[11px] text-slate-500 tabular-nums">
            {metrics.eventsScheduledTodayOrUpcoming} events · {metrics.pendingLogisticsRequests} logistics
          </div>
        </div>
      </section>

      {/* Strategic Priority Battleground LGAs — 1-Click Focus & Ward Sweep */}
      <section
        aria-label="Priority High-Impact Katsina Local Governments"
        className="bg-white dark:bg-[#0F172A] border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 sm:p-5 space-y-3.5 shadow-2xs"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-slate-950 dark:text-white font-display">
                Top 6 High-Impact Katsina Local Governments (Over 1.04M INEC Voters)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Tap any LGA to inspect its wards on Mapbox, or toggle Sweep All Wards to model full mobilization.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveModule('katsina-simulator')}
            className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline whitespace-nowrap"
          >
            View All 34 LGAs →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5">
          {PRIORITY_KATSINA_LGA_IDS.map((id) => {
            const item = katsinaSim.lgaById[id];
            if (!item) return null;
            const isSelected = selectedKatsinaLgaId === id;
            const isSwept = item.pdpWardsWon === item.lga.wardCount;
            return (
              <div
                key={id}
                className={`rounded-xl border p-3 flex flex-col justify-between gap-2.5 transition-colors ${
                  isSelected
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/35 border-emerald-500/80'
                    : 'bg-slate-50/70 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setMapScope('katsina');
                      setSelectedKatsinaLgaId(id);
                    }}
                    className="text-left min-w-0 flex-1"
                  >
                    <div className="text-xs font-bold text-slate-950 dark:text-white truncate">
                      {item.lga.name}
                    </div>
                    <div className="text-[10px] text-slate-500 tabular-nums">
                      {item.lga.registeredVoters.toLocaleString()} voters
                    </div>
                  </button>
                  <span className="text-[11px] font-bold tabular-nums text-emerald-700 dark:text-emerald-400 shrink-0">
                    +{Math.round(item.marginVotes / 1000)}k
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] tabular-nums">
                    <span className="text-slate-500">PDP Wards</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-200">
                      {item.pdpWardsWon}/{item.lga.wardCount}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200/80 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0D5C38] dark:bg-emerald-500 rounded-full transition-all duration-200"
                      style={{ width: `${item.wardCapturePct}%` }}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setMapScope('katsina');
                    setSelectedKatsinaLgaId(id);
                    handleChangeLgaTargetWards(
                      id,
                      isSwept ? Math.max(4, Math.floor(item.lga.wardCount * 0.72)) : item.lga.wardCount
                    );
                  }}
                  className={`w-full min-h-[34px] px-2 py-1 rounded-lg text-[11px] font-semibold inline-flex items-center justify-center gap-1 transition-colors ${
                    isSwept
                      ? 'bg-[#0D5C38] text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-emerald-600'
                  }`}
                >
                  {isSwept && <Check className="w-3 h-3" />}
                  {isSwept ? 'All Wards Swept' : 'Sweep Wards'}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Primary Interactive Command Grid: Katsina 34-LGA Mapbox Studio OR National 36+FCT Map */}
      {mapScope === 'katsina' ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
          <div className="xl:col-span-8">
            <KatsinaMapboxViz
              simulation={katsinaSim}
              selectedLgaId={selectedKatsinaLgaId}
              onSelectLga={setSelectedKatsinaLgaId}
              heightClass="h-[360px] sm:h-[460px] xl:h-[540px]"
            />
          </div>
          <div className="xl:col-span-4">
            <KatsinaLgaInspector
              lgaResult={selectedKatsinaLga}
              onChangeTargetWards={handleChangeLgaTargetWards}
              onToggleWardWinner={handleToggleWardWinner}
              onResetLga={handleResetLga}
              hasCustomOverrides={hasLgaOverride}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-end">
            <div className="inline-flex items-center bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
              {(
                [
                  ['coverage', 'Coverage'],
                  ['incidents', 'Incidents'],
                  ['reports', 'Reports'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setMapLayer(key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    mapLayer === key
                      ? 'bg-slate-900 dark:bg-slate-700 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
            <div className="xl:col-span-8">
              <NigeriaMap
                stateSummaries={stateSummaries}
                selectedStateCode={selectedStateCode}
                onSelectState={setSelectedStateCode}
                layer={mapLayer}
              />
            </div>

            {/* Right Panel: Selected State Drill-Down */}
            <div className="xl:col-span-4 bg-white dark:bg-[#0F172A] border border-slate-200/90 dark:border-slate-800 rounded-xl flex flex-col">
              <div className="px-5 py-4 border-b border-slate-200/90 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-950 dark:text-white font-display">
                    {selectedState?.name} State Tactical Brief
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Capital: {selectedState?.capital} · {selectedState?.zone} · {selectedState?.lgas.length} LGAs
                  </p>
                </div>
                <span
                  className={`text-[11px] font-semibold ${
                    selectedSummary?.operationalStatus === 'Critical'
                      ? 'text-red-700 dark:text-red-400'
                      : selectedSummary?.operationalStatus === 'Attention'
                        ? 'text-amber-700 dark:text-amber-400'
                        : selectedSummary?.operationalStatus === 'Nominal'
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-slate-500'
                  }`}
                >
                  {selectedSummary?.operationalStatus}
                </span>
              </div>

              <div className="p-4 grid grid-cols-2 gap-3 border-b border-slate-200 dark:border-slate-800 text-xs">
                <div>
                  <div className="text-slate-500">Personnel Assigned</div>
                  <div className="text-base font-bold font-mono tabular-nums mt-0.5">
                    {selectedSummary?.personnelAssigned ?? 0}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">Agents Checked In</div>
                  <div className="text-base font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400 mt-0.5">
                    {selectedSummary?.agentsCheckedIn ?? 0} / {selectedSummary?.agentsTotal ?? 0}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">Open Incidents</div>
                  <div className="text-base font-bold font-mono tabular-nums text-red-700 dark:text-red-400 mt-0.5">
                    {selectedSummary?.openIncidents ?? 0}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">Polling Units Tracked</div>
                  <div className="text-base font-bold font-mono tabular-nums mt-0.5">
                    {selectedSummary?.pollingUnitsAssigned ?? 0} / {selectedSummary?.pollingUnitsImported ?? 0}
                  </div>
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Verified Local Government Areas ({selectedState?.lgas.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveModule('geographic-ops')}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 hover:underline"
                  >
                    Open Geo Explorer <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex-1 max-h-[260px] overflow-y-auto pr-1">
                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    {selectedState?.lgas.map((lga) => (
                      <div
                        key={lga}
                        className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded truncate text-slate-700 dark:text-slate-300 leading-tight"
                      >
                        {lga}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Analytics Row: Katsina Zone Comparison + Turnout Reach Curve */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200/90 dark:border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-950 dark:text-white font-display">
                Katsina Senatorial Zones — Party Vote Simulation
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                PDP (Yakubu Lado) vs APC, ADC & Others across Katsina South, Central, and North.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveModule('katsina-simulator')}
              className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline whitespace-nowrap"
            >
              34-LGA Matrix →
            </button>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={katsinaSim.zones} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="zone" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                />
                <Tooltip
                  formatter={(v) => Number(v ?? 0).toLocaleString()}
                  contentStyle={{
                    backgroundColor: '#0A0F1A',
                    borderColor: '#334155',
                    color: '#F8FAFC',
                    fontSize: '12px',
                    borderRadius: '8px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="pdpVotes" name="PDP (Yakubu Lado)" fill="#0D5C38" radius={[4, 4, 0, 0]} />
                <Bar dataKey="apcVotes" name="APC" fill="#0284C7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="adcVotes" name="ADC" fill="#D97706" radius={[4, 4, 0, 0]} />
                <Bar dataKey="othersVotes" name="Others" fill="#64748B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0F172A] border border-slate-200/90 dark:border-slate-800 rounded-xl p-5">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-950 dark:text-white font-display">
              Potential Reach & Turnout Sensitivity ({katsinaSim.totalRegisteredVoters.toLocaleString()} Oct 2026 INEC Voters)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Projected statewide vote curve for PDP Lado vs APC and ADC from 30% to 65% voter turnout.
            </p>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={katsinaSim.turnoutSensitivity}
                margin={{ top: 8, right: 12, left: 4, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="srPdpGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.32} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="srApcGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284C7" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#0284C7" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis
                  dataKey="turnoutPct"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickFormatter={(v: number) => `${v}%`}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                />
                <Tooltip
                  labelFormatter={(l) => `Turnout: ${l}%`}
                  formatter={(v) => Number(v ?? 0).toLocaleString()}
                  contentStyle={{
                    backgroundColor: '#0A0F1A',
                    borderColor: '#334155',
                    color: '#F8FAFC',
                    fontSize: '12px',
                    borderRadius: '8px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Area
                  type="monotone"
                  dataKey="pdpVotes"
                  name="PDP (Yakubu Lado)"
                  stroke="#0D5C38"
                  strokeWidth={2.5}
                  fill="url(#srPdpGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="apcVotes"
                  name="APC"
                  stroke="#0284C7"
                  strokeWidth={2}
                  fill="url(#srApcGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="adcVotes"
                  name="ADC"
                  stroke="#D97706"
                  strokeWidth={2}
                  fill="none"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Live Operational Feeds Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Live Incident Feed */}
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200/90 dark:border-slate-800 rounded-xl flex flex-col overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200/90 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-700 dark:text-red-400" />
              <h3 className="text-xs font-bold text-slate-950 dark:text-white font-display">
                Live Incident Feed
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setActiveModule('incidents')}
              className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 hover:underline"
            >
              Manage All
            </button>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {openIncidents.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">No open incidents recorded.</div>
            ) : (
              openIncidents.map((inc) => (
                <div key={inc.id} className="px-5 py-3.5 space-y-1">
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="font-mono text-slate-500">{inc.refCode}</span>
                    <span
                      className={`font-semibold uppercase ${
                        inc.severity === 'critical'
                          ? 'text-red-700 dark:text-red-400'
                          : inc.severity === 'high'
                            ? 'text-amber-700 dark:text-amber-400'
                            : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {inc.severity} · {inc.status}
                    </span>
                  </div>
                  <div className="text-xs font-medium text-slate-900 dark:text-white leading-snug">
                    {inc.title}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {inc.stateCode} / {inc.lga} · {inc.verificationStatus}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Incoming Field Reports & Check-In Activity */}
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200/90 dark:border-slate-800 rounded-xl flex flex-col overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200/90 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-950 dark:text-white font-display">
              Incoming Field Reports & Check-Ins
            </h3>
            <button
              type="button"
              onClick={() => setActiveModule('field-ops')}
              className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 hover:underline"
            >
              Field Console
            </button>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {fieldReports.slice(0, 4).map((rep) => (
              <div key={rep.id} className="px-5 py-3.5 space-y-1">
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="font-mono text-slate-500">{rep.refCode}</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{rep.status}</span>
                </div>
                <div className="text-xs font-medium text-slate-900 dark:text-white">
                  {rep.reportType} — {rep.stateCode}/{rep.lga}
                </div>
                <div className="text-[11px] text-slate-500 truncate">{rep.summary}</div>
                <div className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                  {rep.dataLabel} · By {rep.submitterName}
                </div>
              </div>
            ))}
            {checkIns.slice(0, 2).map((chk) => (
              <div key={chk.id} className="px-5 py-2.5 bg-slate-50/70 dark:bg-slate-900/40 text-[11px]">
                <span className="font-semibold text-slate-800 dark:text-slate-200">{chk.personnelName}</span>
                <span className="text-slate-500"> · {chk.status} · {chk.stateCode}/{chk.lga}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Call Center Status & Task Escalations */}
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200/90 dark:border-slate-800 rounded-xl flex flex-col overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200/90 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-950 dark:text-white font-display">
              Call Center & Escalation Queue
            </h3>
            <button
              type="button"
              onClick={() => setActiveModule('call-center')}
              className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 hover:underline"
            >
              Open Desk
            </button>
          </div>

          <div className="p-4 border-b border-slate-200/90 dark:border-slate-800 grid grid-cols-3 gap-2.5 text-center">
            <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <div className="text-[10px] text-slate-500">Operators</div>
              <div className="text-sm font-bold font-mono tabular-nums mt-0.5">{callOperators.length}</div>
            </div>
            <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <div className="text-[10px] text-slate-500">Escalated</div>
              <div className="text-sm font-bold font-mono tabular-nums text-red-700 dark:text-red-400 mt-0.5">
                {calls.filter((c) => c.status === 'Escalated').length}
              </div>
            </div>
            <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <div className="text-[10px] text-slate-500">Open Tickets</div>
              <div className="text-sm font-bold font-mono tabular-nums mt-0.5">{metrics.unresolvedCallTickets}</div>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80 flex-1">
            {escalatedTasks.map((t) => (
              <div key={t.id} className="px-5 py-3 space-y-0.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-medium text-slate-800 dark:text-slate-200 truncate pr-2">{t.title}</span>
                  <span
                    className={`font-mono uppercase shrink-0 ${
                      t.priority === 'urgent' ? 'text-red-700 dark:text-red-400 font-semibold' : 'text-slate-500'
                    }`}
                  >
                    {t.priority}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  {t.department} · {t.assigneeName} · Due {t.dueDate}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Regional Six Geopolitical Zone Operational Deployment Summary */}
      <div className="bg-white dark:bg-[#0F172A] border border-slate-200/90 dark:border-slate-800 rounded-xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-950 dark:text-white font-display">
              National Operational Deployment — Six Geopolitical Zones
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live personnel deployment, checked-in field agents, and verified field reports across all 36 states and FCT.
            </p>
          </div>
          {metrics.highPriorityIncidents > 0 && (
            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 dark:text-red-400">
              <AlertTriangle className="w-3.5 h-3.5" />
              {metrics.highPriorityIncidents} High/Critical Incident(s) Active
            </div>
          )}
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={zoneSummaries} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
              <XAxis dataKey="zone" tick={{ fontSize: 11, fill: '#64748B' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748B' }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0A0F1A',
                  borderColor: '#334155',
                  color: '#F8FAFC',
                  fontSize: '12px',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="personnel" name="Personnel Assigned" fill={branding.primaryColor} radius={[4, 4, 0, 0]} />
              <Bar dataKey="agentsCheckedIn" name="Agents Checked In" fill="#0D9488" radius={[4, 4, 0, 0]} />
              <Bar dataKey="reportsSubmitted" name="Reports Submitted" fill="#B45309" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <QuickCommandModal
        open={quickModalOpen}
        initialTab={quickModalTab}
        onClose={() => setQuickModalOpen(false)}
      />
    </div>
  );
};
