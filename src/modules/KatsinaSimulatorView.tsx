import React, { useMemo, useState } from 'react';
import {
  BookmarkCheck,
  CheckCircle2,
  Download,
  ExternalLink,
  RotateCcw,
  Search,
  Sliders,
  TrendingUp,
  X,
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
import { KATSINA_INEC_META, type KatsinaSenatorialZone } from '../data/katsinaInecData';
import {
  compareSimulations,
  createDefaultSimulationConfig,
  exportKatsinaSimulationCsv,
  runKatsinaSimulation,
  SIMULATION_PRESETS,
  type KatsinaSimulationOutput,
  type SimulationConfig,
  type SimulationPresetId,
} from '../lib/electionSimulator';
import { KatsinaMapboxViz } from '../components/KatsinaMapboxViz';
import { KatsinaLgaInspector } from '../components/KatsinaLgaInspector';
import { useCampaign } from '../context/CampaignContext';

export const KatsinaSimulatorView: React.FC = () => {
  const { branding } = useCampaign();
  const [config, setConfig] = useState<SimulationConfig>(() =>
    createDefaultSimulationConfig('lado-victory')
  );
  const [selectedLgaId, setSelectedLgaId] = useState<string>('katsina');
  const [zoneTableFilter, setZoneTableFilter] = useState<'ALL' | KatsinaSenatorialZone>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'voters' | 'margin' | 'wards'>('voters');
  const [savedSnapshot, setSavedSnapshot] = useState<{
    label: string;
    result: KatsinaSimulationOutput;
  } | null>(null);

  const simulation = useMemo(() => runKatsinaSimulation(config), [config]);
  const selectedLgaResult = simulation.lgaById[selectedLgaId] ?? simulation.lgas[0];

  const comparisonDelta = useMemo(
    () => (savedSnapshot ? compareSimulations(simulation, savedSnapshot.result) : null),
    [simulation, savedSnapshot]
  );

  const handleSelectPreset = (presetId: SimulationPresetId) => {
    setConfig(createDefaultSimulationConfig(presetId));
  };

  const handleSweepZone = (zone: KatsinaSenatorialZone) => {
    setConfig((prev) => {
      const nextOverrides = { ...prev.lgaWardTargetOverrides };
      const nextWards = { ...prev.wardWinnerOverrides };
      for (const item of simulation.lgas) {
        if (item.lga.zone === zone) {
          nextOverrides[item.lga.id] = item.lga.wardCount;
          for (const w of item.lga.wards) {
            delete nextWards[w.id];
          }
        }
      }
      return {
        ...prev,
        lgaWardTargetOverrides: nextOverrides,
        wardWinnerOverrides: nextWards,
      };
    });
  };

  const handleSaveSnapshot = () => {
    const presetMeta = SIMULATION_PRESETS.find((p) => p.id === config.presetId);
    setSavedSnapshot({
      label: `${presetMeta?.shortLabel ?? 'Baseline'} (${simulation.turnoutPct}% turnout)`,
      result: simulation,
    });
  };

  const handleExportCsv = () => {
    const csv = exportKatsinaSimulationCsv(simulation);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `katsina-34-lga-inec-simulation-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleChangeLgaTargetWards = (lgaId: string, wardsCount: number) => {
    setConfig((prev) => {
      const nextWardOverrides = { ...prev.wardWinnerOverrides };
      const lga = simulation.lgaById[lgaId]?.lga;
      if (lga) {
        for (const w of lga.wards) {
          delete nextWardOverrides[w.id];
        }
      }
      return {
        ...prev,
        lgaWardTargetOverrides: {
          ...prev.lgaWardTargetOverrides,
          [lgaId]: wardsCount,
        },
        wardWinnerOverrides: nextWardOverrides,
      };
    });
  };

  const handleToggleWardWinner = (wardId: string, winner: 'PDP' | 'APC' | 'ADC') => {
    setConfig((prev) => ({
      ...prev,
      wardWinnerOverrides: {
        ...prev.wardWinnerOverrides,
        [wardId]: winner,
      },
    }));
  };

  const handleResetLga = (lgaId: string) => {
    setConfig((prev) => {
      const nextLga = { ...prev.lgaWardTargetOverrides };
      delete nextLga[lgaId];
      const nextWards = { ...prev.wardWinnerOverrides };
      const lga = simulation.lgaById[lgaId]?.lga;
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
    if (config.lgaWardTargetOverrides[selectedLgaId] !== undefined) return true;
    return selectedLgaResult.lga.wards.some((w) => config.wardWinnerOverrides[w.id] !== undefined);
  }, [config, selectedLgaId, selectedLgaResult]);

  const filteredLgas = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return simulation.lgas
      .filter((r) => (zoneTableFilter === 'ALL' ? true : r.lga.zone === zoneTableFilter))
      .filter((r) =>
        !q
          ? true
          : r.lga.name.toLowerCase().includes(q) ||
            r.lga.zone.toLowerCase().includes(q) ||
            r.lga.wards.some((w) => w.name.toLowerCase().includes(q))
      )
      .sort((a, b) => {
        if (sortBy === 'margin') return b.marginVotes - a.marginVotes;
        if (sortBy === 'wards') return b.wardCapturePct - a.wardCapturePct;
        return b.lga.registeredVoters - a.lga.registeredVoters;
      });
  }, [simulation.lgas, zoneTableFilter, searchQuery, sortBy]);

  return (
    <div className="space-y-6">
      {/* Executive Header & Scenario Controls */}
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
            <div className="flex items-start sm:items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-1 sm:mt-0" />
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-950 dark:text-white font-display leading-snug sm:truncate">
                Katsina State INEC Intelligence & Victory Simulator
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed sm:truncate">
              INEC Oct 2026 Update (Code {KATSINA_INEC_META.stateCode}) ·{' '}
              {KATSINA_INEC_META.totalRegisteredVoters.toLocaleString()} Voters (#4 Nationally behind Lagos, Kano & Kaduna) ·{' '}
              {KATSINA_INEC_META.totalLgas} LGAs · {KATSINA_INEC_META.totalWards} Wards ·{' '}
              {KATSINA_INEC_META.totalPollingUnits.toLocaleString()} PUs
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 w-full xl:w-auto shrink-0">
          <div className="grid grid-cols-3 sm:inline-flex items-center w-full sm:w-auto bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800 gap-0.5">
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
                  onClick={() => handleSelectPreset(preset.id)}
                  className={`px-1.5 sm:px-3 py-2 sm:py-1.5 min-h-[36px] text-[11px] sm:text-xs font-medium rounded-md transition-colors text-center whitespace-nowrap ${
                    config.presetId === preset.id
                      ? 'bg-[#0D5C38] text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
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
            onClick={() => setConfig(createDefaultSimulationConfig('lado-victory'))}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 min-h-[38px] text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Scenario
          </button>
        </div>
      </div>

      {/* Easy 1-Click Zonal Strategy Boosters, Scenario Compare & CSV Export Bar */}
      <div
        data-testid="simulator-strategy-bar"
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 bg-white dark:bg-[#0F172A] border border-slate-200/90 dark:border-slate-800 rounded-xl p-3 sm:px-3.5 sm:py-2.5 shadow-2xs"
      >
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            <Zap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Quick Boost:
          </span>
          <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-1.5 sm:gap-2">
            {(
              [
                ['Katsina South', 'Sweep South (11)', 'South (11)'],
                ['Katsina Central', 'Sweep Central (11)', 'Central (11)'],
                ['Katsina North', 'Sweep North (12)', 'North (12)'],
              ] as const
            ).map(([zone, label, shortLabel]) => (
              <button
                key={zone}
                type="button"
                onClick={() => handleSweepZone(zone)}
                data-testid={`sweep-zone-${zone.toLowerCase().replace(/\s+/g, '-')}`}
                className="px-2 sm:px-2.5 py-2 sm:py-1.5 min-h-[36px] text-[11px] sm:text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50/90 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-lg transition-colors whitespace-nowrap text-center"
              >
                <span className="sm:hidden">{shortLabel}</span>
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSaveSnapshot}
            data-testid="save-compare-scenario-btn"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 min-h-[36px] text-xs font-semibold text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap"
          >
            <BookmarkCheck className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
            {savedSnapshot ? 'Update Baseline' : 'Save & Compare'}
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            data-testid="export-sim-csv-btn"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 min-h-[36px] text-xs font-semibold text-white bg-[#0D5C38] hover:bg-[#09452A] rounded-lg transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span className="sm:hidden">Export CSV</span>
            <span className="hidden sm:inline">Export 34-LGA CSV</span>
          </button>
        </div>
      </div>

      {/* Live Scenario Comparison Delta Banner */}
      {savedSnapshot && comparisonDelta && (
        <div
          data-testid="scenario-comparison-banner"
          className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-xs"
        >
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="font-semibold text-slate-900 dark:text-white">
              Comparing vs {savedSnapshot.label}:
            </span>
            <span className="font-bold tabular-nums text-emerald-800 dark:text-emerald-300">
              PDP Votes {comparisonDelta.pdpVotesDelta >= 0 ? '+' : ''}
              {comparisonDelta.pdpVotesDelta.toLocaleString()}
            </span>
            <span className="font-bold tabular-nums text-emerald-800 dark:text-emerald-300">
              Margin {comparisonDelta.marginDelta >= 0 ? '+' : ''}
              {comparisonDelta.marginDelta.toLocaleString()}
            </span>
            <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-300">
              Wards {comparisonDelta.pdpWardsDelta >= 0 ? '+' : ''}
              {comparisonDelta.pdpWardsDelta}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSavedSnapshot(null)}
            aria-label="Clear saved scenario comparison"
            className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Executive Simulation Scoreboard Banner */}
      <section
        aria-label="Katsina Election Simulation Outcome Summary"
        className="bg-[#0A0F1A] text-white rounded-2xl border border-slate-800 p-5 sm:p-6 space-y-5"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-emerald-400 font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {simulation.ladoWins
                  ? 'Projected Governorship Victory — Senator Yakubu Lado Dan Marke (PDP)'
                  : `Competitive Projection — ${simulation.winningParty} Currently Leading`}
              </span>
              <span className="hidden sm:inline text-slate-600" aria-hidden="true">·</span>
              <span className="text-slate-300 font-normal">
                Constitutional 25% Spread: {simulation.lgasMeeting25PctSpread}/34 LGAs (23 required)
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Projected valid votes:{' '}
              <span className="font-mono text-white">
                {simulation.projectedValidVotes.toLocaleString()}
              </span>{' '}
              ({simulation.turnoutPct}% of {simulation.totalRegisteredVoters.toLocaleString()} INEC registered voters) · Potential PVC Reach:{' '}
              <span className="font-mono text-emerald-300">
                {simulation.potentialReachVoters.toLocaleString()}
              </span>
            </p>
          </div>

          {/* Live Global Simulation Sliders */}
          <div className="flex flex-wrap items-center gap-5 text-xs bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2.5">
              <Sliders className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <label htmlFor="sim-turnout-rate" className="text-slate-300 whitespace-nowrap">
                Turnout: <span className="font-mono font-bold text-white">{Math.round(config.turnoutRate * 100)}%</span>
              </label>
              <input
                id="sim-turnout-rate"
                type="range"
                min={35}
                max={92}
                step={1}
                value={Math.round(config.turnoutRate * 100)}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, turnoutRate: Number(e.target.value) / 100 }))
                }
                className="w-24 sm:w-28 accent-emerald-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-2.5">
              <label htmlFor="sim-adc-factor" className="text-slate-300 whitespace-nowrap">
                ADC Factor: <span className="font-mono font-bold text-amber-400">{config.adcSurgeFactor.toFixed(1)}x</span>
              </label>
              <input
                id="sim-adc-factor"
                type="range"
                min={6}
                max={16}
                step={1}
                value={Math.round(config.adcSurgeFactor * 10)}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, adcSurgeFactor: Number(e.target.value) / 10 }))
                }
                className="w-20 sm:w-24 accent-amber-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* 4-Party Comparative Bar */}
        <div className="h-3 w-full rounded-full overflow-hidden flex bg-slate-800">
          <div style={{ width: `${simulation.pdpSharePct}%` }} className="bg-emerald-500 transition-all duration-200" />
          <div style={{ width: `${simulation.apcSharePct}%` }} className="bg-sky-500 transition-all duration-200" />
          <div style={{ width: `${simulation.adcSharePct}%` }} className="bg-amber-500 transition-all duration-200" />
          <div style={{ width: `${simulation.othersSharePct}%` }} className="bg-slate-500 transition-all duration-200" />
        </div>

        {/* 5 Key Scoreboard Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800/80">
            <div className="text-[11px] font-semibold text-emerald-300">PDP · Yakubu Lado</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-white mt-1">
              {simulation.pdpVotes.toLocaleString()}
            </div>
            <div className="text-[11px] font-mono text-emerald-400 mt-0.5">
              {simulation.pdpSharePct}% · {simulation.pdpWardsWon}/361 wards · {simulation.pdpLgasWon}/34 LGAs
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
            <div className="text-[11px] font-semibold text-sky-400">APC</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-white mt-1">
              {simulation.apcVotes.toLocaleString()}
            </div>
            <div className="text-[11px] font-mono text-slate-400 mt-0.5">
              {simulation.apcSharePct}% · {simulation.apcWardsWon} wards · {simulation.apcLgasWon} LGAs
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
            <div className="text-[11px] font-semibold text-amber-400">ADC</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-white mt-1">
              {simulation.adcVotes.toLocaleString()}
            </div>
            <div className="text-[11px] font-mono text-slate-400 mt-0.5">
              {simulation.adcSharePct}% · {simulation.adcWardsWon} wards · {simulation.adcLgasWon} LGAs
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
            <div className="text-[11px] font-semibold text-slate-400">Others (NNPP/PRP/LP)</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-200 mt-1">
              {simulation.othersVotes.toLocaleString()}
            </div>
            <div className="text-[11px] font-mono text-slate-400 mt-0.5">
              {simulation.othersSharePct}% combined share
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 col-span-2 md:col-span-1">
            <div className="text-[11px] font-semibold text-slate-300">Winning Margin</div>
            <div
              className={`text-2xl font-bold font-mono tabular-nums mt-1 ${
                simulation.marginOverRunnerUp >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {simulation.marginOverRunnerUp >= 0 ? '+' : ''}
              {simulation.marginOverRunnerUp.toLocaleString()}
            </div>
            <div className="text-[11px] font-mono text-slate-400 mt-0.5">
              vs {simulation.runnerUpParty} runner-up
            </div>
          </div>
        </div>
      </section>

      {/* Primary Interactive Mapbox Studio + LGA/Ward Inspector */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        <div className="xl:col-span-8">
          <KatsinaMapboxViz
            simulation={simulation}
            selectedLgaId={selectedLgaId}
            onSelectLga={setSelectedLgaId}
            heightClass="h-[360px] sm:h-[460px] xl:h-[540px]"
          />
        </div>
        <div className="xl:col-span-4">
          <KatsinaLgaInspector
            lgaResult={selectedLgaResult}
            onChangeTargetWards={handleChangeLgaTargetWards}
            onToggleWardWinner={handleToggleWardWinner}
            onResetLga={handleResetLga}
            hasCustomOverrides={hasLgaOverride}
          />
        </div>
      </div>

      {/* Advanced Analytical Visualizations Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Chart 1: Senatorial Zone 4-Party Vote Comparison */}
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200/90 dark:border-slate-800 rounded-xl p-5">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-950 dark:text-white font-display">
              Senatorial Zone Party Comparison (Katsina South · Central · North)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Simulated valid votes for PDP (Yakubu Lado), APC, ADC, and Others across all three Katsina zones.
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={simulation.zones} margin={{ top: 8, right: 12, left: 6, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="zone" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                />
                <Tooltip
                  formatter={(value) => Number(value ?? 0).toLocaleString()}
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

        {/* Chart 2: Turnout & Potential Reach Trajectory */}
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200/90 dark:border-slate-800 rounded-xl p-5">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-950 dark:text-white font-display">
              Potential Reach & Turnout Sensitivity Curve (30% – 65% Turnout)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Projected vote trajectory across mobilization turnout levels based on{' '}
              {KATSINA_INEC_META.totalRegisteredVoters.toLocaleString()} Oct 2026 INEC registered voters (+
              {KATSINA_INEC_META.cvr2026NetAdditions.toLocaleString()} vs 2023).
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={simulation.turnoutSensitivity}
                margin={{ top: 8, right: 12, left: 6, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="pdpAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="apcAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284C7" stopOpacity={0.25} />
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
                  labelFormatter={(l) => `Voter Turnout: ${l}%`}
                  formatter={(value) => Number(value ?? 0).toLocaleString()}
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
                  fill="url(#pdpAreaGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="apcVotes"
                  name="APC"
                  stroke="#0284C7"
                  strokeWidth={2}
                  fill="url(#apcAreaGrad)"
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

      {/* Complete 34-LGA INEC Directory & Ward Capture Matrix */}
      <div className="bg-white dark:bg-[#0F172A] border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200/90 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-950 dark:text-white font-display">
              All 34 Katsina Local Government Areas — INEC Voter & Ward Simulation Matrix
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Click any row to inspect its wards on the Mapbox studio · Source reference:{' '}
              <a
                href={KATSINA_INEC_META.portalReferenceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-700 dark:text-emerald-400 hover:underline inline-flex items-center gap-0.5"
              >
                cvr.inecnigeria.org/pu <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search LGA or ward name..."
                aria-label="Search Katsina LGAs or wards"
                className="w-full sm:w-52 pl-8 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
              />
            </div>

            <div className="grid grid-cols-2 sm:flex gap-2">
              <select
                value={zoneTableFilter}
                onChange={(e) => setZoneTableFilter(e.target.value as 'ALL' | KatsinaSenatorialZone)}
                aria-label="Filter by Senatorial Zone"
                className="px-2.5 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
              >
                <option value="ALL">All 3 Zones</option>
                <option value="Katsina South">South (Funtua)</option>
                <option value="Katsina Central">Central</option>
                <option value="Katsina North">North (Daura)</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'voters' | 'margin' | 'wards')}
                aria-label="Sort LGAs"
                className="px-2.5 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
              >
                <option value="voters">By INEC Voters</option>
                <option value="margin">By Lado Margin</option>
                <option value="wards">By PDP Ward %</option>
              </select>
            </div>
          </div>
        </div>

        {/* Mobile-First Card Stack (<md) */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800/80">
          {filteredLgas.map((r) => {
            const isSelected = r.lga.id === selectedLgaId;
            return (
              <button
                key={r.lga.id}
                type="button"
                onClick={() => setSelectedLgaId(r.lga.id)}
                className={`w-full text-left px-4 py-3.5 space-y-2 transition-colors ${
                  isSelected
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/35'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-bold text-slate-950 dark:text-white">
                      {r.lga.name}{' '}
                      <span className="text-[10px] font-mono text-slate-400">{r.lga.inecCode}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {r.lga.zone} · {r.lga.registeredVoters.toLocaleString()} INEC voters · {r.lga.pollingUnits} PUs
                    </div>
                  </div>
                  <div className="text-right font-mono tabular-nums shrink-0">
                    <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                      {r.pdpWardsWon}/{r.lga.wardCount} wards
                    </div>
                    <div
                      className={`text-[11px] font-semibold ${
                        r.marginVotes >= 0
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-red-700 dark:text-red-400'
                      }`}
                    >
                      {r.marginVotes >= 0 ? '+' : ''}
                      {r.marginVotes.toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px] font-mono tabular-nums">
                  <div className="px-2 py-1 rounded bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300">
                    PDP {r.pdpVotes.toLocaleString()}
                  </div>
                  <div className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-900 text-sky-700 dark:text-sky-400">
                    APC {r.apcVotes.toLocaleString()}
                  </div>
                  <div className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-900 text-amber-700 dark:text-amber-400">
                    ADC {r.adcVotes.toLocaleString()}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Tablet/Desktop High-Density Table (md+) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">Local Government</th>
                <th className="py-3 px-3">Senatorial Zone</th>
                <th className="py-3 px-3 text-right">INEC Voters</th>
                <th className="py-3 px-3 text-right">Polling Units</th>
                <th className="py-3 px-3 text-center">PDP Wards</th>
                <th className="py-3 px-3 text-right">PDP (Lado)</th>
                <th className="py-3 px-3 text-right">APC</th>
                <th className="py-3 px-3 text-right">ADC</th>
                <th className="py-3 px-4 text-right">Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredLgas.map((r) => {
                const isSelected = r.lga.id === selectedLgaId;
                return (
                  <tr
                    key={r.lga.id}
                    onClick={() => setSelectedLgaId(r.lga.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/30'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-2.5 px-4 font-semibold text-slate-950 dark:text-white whitespace-nowrap">
                      {r.lga.name}
                      <span className="ml-2 text-[10px] font-mono text-slate-400">
                        {r.lga.inecCode}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {r.lga.zone}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                      {r.lga.registeredVoters.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600 dark:text-slate-400">
                      {r.lga.pollingUnits}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono tabular-nums">
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">
                        {r.pdpWardsWon}/{r.lga.wardCount}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-emerald-700 dark:text-emerald-400">
                      {r.pdpVotes.toLocaleString()}{' '}
                      <span className="text-[10px] font-normal">({r.pdpSharePct}%)</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-sky-700 dark:text-sky-400">
                      {r.apcVotes.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-amber-700 dark:text-amber-400">
                      {r.adcVotes.toLocaleString()}
                    </td>
                    <td
                      className={`py-2.5 px-4 text-right font-mono tabular-nums font-semibold whitespace-nowrap ${
                        r.marginVotes >= 0
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-red-700 dark:text-red-400'
                      }`}
                    >
                      {r.marginVotes >= 0 ? '+' : ''}
                      {r.marginVotes.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
