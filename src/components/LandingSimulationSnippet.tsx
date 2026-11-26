import React, { useMemo, useState } from 'react';
import { ArrowRight, Check, CheckCircle2, MapPin, Sliders, TrendingUp } from 'lucide-react';
import { KATSINA_INEC_META } from '../data/katsinaInecData';
import {
  createDefaultSimulationConfig,
  runKatsinaSimulation,
  SIMULATION_PRESETS,
  type SimulationPresetId,
} from '../lib/electionSimulator';

interface LandingSimulationSnippetProps {
  onOpenFullSimulator: () => void;
}

const ZONAL_CAPTURE_TARGETS = [
  { id: 'funtua', name: 'Funtua', zone: 'South' },
  { id: 'malumfashi', name: 'Malumfashi', zone: 'South' },
  { id: 'kafur', name: 'Kafur', zone: 'South' },
  { id: 'bakori', name: 'Bakori', zone: 'South' },
  { id: 'katsina', name: 'Katsina', zone: 'Central' },
  { id: 'kankara', name: 'Kankara', zone: 'Central' },
  { id: 'dutsin-ma', name: 'Dutsin-Ma', zone: 'Central' },
  { id: 'batsari', name: 'Batsari', zone: 'Central' },
  { id: 'daura', name: 'Daura', zone: 'North' },
  { id: 'mani', name: 'Mani', zone: 'North' },
  { id: 'mashi', name: 'Mashi', zone: 'North' },
  { id: 'baure', name: 'Baure', zone: 'North' },
] as const;

export const LandingSimulationSnippet: React.FC<LandingSimulationSnippetProps> = ({
  onOpenFullSimulator,
}) => {
  const [presetId, setPresetId] = useState<SimulationPresetId>('lado-victory');
  const [turnoutPct, setTurnoutPct] = useState<number>(80);
  const [selectedLgaId, setSelectedLgaId] = useState<string>('funtua');
  const [sweptLgaIds, setSweptLgaIds] = useState<string[]>([
    'funtua',
    'malumfashi',
    'kafur',
    'bakori',
    'katsina',
    'kankara',
  ]);

  const simulation = useMemo(() => {
    const base = createDefaultSimulationConfig(presetId);
    base.turnoutRate = turnoutPct / 100;
    const baseline = runKatsinaSimulation(base);
    const sweptSet = new Set(sweptLgaIds);
    for (const target of ZONAL_CAPTURE_TARGETS) {
      const lgaInfo = baseline.lgaById[target.id]?.lga;
      if (!lgaInfo) continue;
      if (sweptSet.has(target.id)) {
        base.lgaWardTargetOverrides[target.id] = lgaInfo.wardCount;
      }
    }
    return runKatsinaSimulation(base);
  }, [presetId, turnoutPct, sweptLgaIds]);

  const activeLga = simulation.lgaById[selectedLgaId] ?? simulation.lgas[0];

  const handlePresetChange = (nextPreset: SimulationPresetId) => {
    setPresetId(nextPreset);
    const meta = SIMULATION_PRESETS.find((p) => p.id === nextPreset);
    if (meta) {
      setTurnoutPct(Math.round(meta.turnoutRate * 100));
    }
  };

  const toggleSweepLga = (id: string) => {
    setSelectedLgaId(id);
    setSweptLgaIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <section
      id="victory-simulation"
      className="bg-[#070B14] text-white border-y border-slate-800/90 py-14 lg:py-20"
    >
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-10 space-y-7">
        {/* Header & Scenario Switcher */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="text-xs font-semibold text-emerald-400">
              INEC October 2026 Katsina Register · {KATSINA_INEC_META.totalRegisteredVoters.toLocaleString()} Voters · #4 Nationally
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold font-display tracking-tight text-white">
              Capture Key Local Governments & Watch Lado’s Winning Margin Grow
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Modeled directly on the October 2026 INEC Katsina register (4th nationally behind Lagos, Kano & Kaduna;{' '}
              <span className="font-mono text-emerald-300">
                +{KATSINA_INEC_META.cvr2026NetAdditions.toLocaleString()}
              </span>{' '}
              new CVR voters) across <span className="font-mono text-white">34 LGAs</span>,{' '}
              <span className="font-mono text-white">{KATSINA_INEC_META.totalWards} wards</span>, and{' '}
              <span className="font-mono text-white">
                {KATSINA_INEC_META.totalPollingUnits.toLocaleString()}
              </span>{' '}
              polling units — benchmarked against official 2023 INEC results (PDP{' '}
              <span className="font-mono text-white">486,620</span> vs APC{' '}
              <span className="font-mono text-white">859,892</span>).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="inline-flex bg-slate-900 border border-slate-800 p-1 rounded-lg overflow-x-auto max-w-full">
              {SIMULATION_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handlePresetChange(preset.id)}
                  className={`px-3 py-2 min-h-[38px] text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    presetId === preset.id
                      ? 'bg-[#0D5C38] text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {preset.shortLabel}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main 2-Column Interactive Simulation Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left 7 Columns: Statewide Victory Projection & 4-Party Race */}
          <div className="lg:col-span-7 bg-[#0E1525] border border-slate-800 rounded-2xl p-4 sm:p-6 flex flex-col justify-between gap-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-slate-800/90">
              <div>
                <div className="text-xs text-slate-400">Projected Statewide Outcome</div>
                <div className="text-xl sm:text-2xl font-bold font-display text-white mt-1">
                  Senator Yakubu Lado (PDP) Wins Katsina
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    25% Spread: {simulation.lgasMeeting25PctSpread}/34 LGAs
                  </span>
                  <span>
                    <span className="font-mono text-white">{simulation.projectedValidVotes.toLocaleString()}</span> / 3,876,051 Simulated Votes
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    <span className="font-mono text-white">{simulation.pdpWardsWon}</span>/361 Wards
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    <span className="font-mono text-white">{simulation.pdpLgasWon}</span>/34 LGAs Won
                  </span>
                </div>
              </div>

              <div className="text-left sm:text-right shrink-0">
                <div className="text-[11px] text-slate-400">Projected Winning Margin</div>
                <div className="text-2xl font-bold font-mono tabular-nums text-emerald-400 mt-0.5">
                  +{simulation.marginOverRunnerUp.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  votes ahead of {simulation.runnerUpParty}
                </div>
              </div>
            </div>

            {/* 4-Party Comparative Breakdown */}
            <div className="space-y-4">
              <div className="h-3.5 w-full rounded-full overflow-hidden flex bg-slate-800">
                <div
                  style={{ width: `${simulation.pdpSharePct}%` }}
                  className="bg-emerald-500 transition-all duration-200"
                  title={`PDP: ${simulation.pdpSharePct}%`}
                />
                <div
                  style={{ width: `${simulation.apcSharePct}%` }}
                  className="bg-sky-500 transition-all duration-200"
                  title={`APC: ${simulation.apcSharePct}%`}
                />
                <div
                  style={{ width: `${simulation.adcSharePct}%` }}
                  className="bg-amber-500 transition-all duration-200"
                  title={`ADC: ${simulation.adcSharePct}%`}
                />
                <div
                  style={{ width: `${simulation.othersSharePct}%` }}
                  className="bg-slate-500 transition-all duration-200"
                  title={`Others: ${simulation.othersSharePct}%`}
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                <div className="p-3 sm:p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-800/70">
                  <div className="text-[11px] text-emerald-300 font-semibold">PDP · Yakubu Lado</div>
                  <div className="text-lg sm:text-xl font-bold font-mono tabular-nums text-white mt-1">
                    {simulation.pdpVotes.toLocaleString()}
                  </div>
                  <div className="text-xs font-mono text-emerald-400 mt-0.5">
                    {simulation.pdpSharePct}% share
                  </div>
                </div>

                <div className="p-3 sm:p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                  <div className="text-[11px] text-sky-400 font-semibold">APC</div>
                  <div className="text-lg sm:text-xl font-bold font-mono tabular-nums text-white mt-1">
                    {simulation.apcVotes.toLocaleString()}
                  </div>
                  <div className="text-xs font-mono text-slate-400 mt-0.5">
                    {simulation.apcSharePct}% share
                  </div>
                </div>

                <div className="p-3 sm:p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                  <div className="text-[11px] text-amber-400 font-semibold">ADC</div>
                  <div className="text-lg sm:text-xl font-bold font-mono tabular-nums text-white mt-1">
                    {simulation.adcVotes.toLocaleString()}
                  </div>
                  <div className="text-xs font-mono text-slate-400 mt-0.5">
                    {simulation.adcSharePct}% share
                  </div>
                </div>

                <div className="p-3 sm:p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                  <div className="text-[11px] text-slate-400 font-semibold">Others</div>
                  <div className="text-lg sm:text-xl font-bold font-mono tabular-nums text-slate-200 mt-1">
                    {simulation.othersVotes.toLocaleString()}
                  </div>
                  <div className="text-xs font-mono text-slate-400 mt-0.5">
                    {simulation.othersSharePct}% share
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Turnout Slider + 3 Senatorial Zones Summary */}
            <div className="pt-4 border-t border-slate-800/90 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <label
                  htmlFor="landing-turnout-slider"
                  className="inline-flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-300"
                >
                  <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                  Simulated Turnout:{' '}
                  <span className="font-mono font-bold text-white">{turnoutPct}%</span>
                  <span className="text-slate-500">
                    ({simulation.projectedValidVotes.toLocaleString()} valid votes)
                  </span>
                </label>
                <input
                  id="landing-turnout-slider"
                  type="range"
                  min={35}
                  max={92}
                  step={1}
                  value={turnoutPct}
                  onChange={(e) => setTurnoutPct(Number(e.target.value))}
                  className="w-full sm:w-52 h-8 accent-emerald-500 cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                {simulation.zones.map((z) => (
                  <div
                    key={z.zone}
                    className="px-3.5 py-2.5 rounded-lg bg-slate-900/80 border border-slate-800/90"
                  >
                    <div className="font-semibold text-slate-200">{z.zone}</div>
                    <div className="mt-1 flex items-center justify-between font-mono tabular-nums">
                      <span className="text-emerald-400 font-bold">{z.pdpSharePct}% PDP</span>
                      <span className="text-slate-400">
                        {z.pdpWardsWon}/{z.totalWards} wards
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right 5 Columns: Interactive Zonal LGA Capture Grid & Exact INEC Spotlight */}
          <div className="lg:col-span-5 bg-[#0E1525] border border-slate-800 rounded-2xl p-4 sm:p-6 flex flex-col justify-between gap-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                  <MapPin className="w-3.5 h-3.5" />
                  Capture Key LGAs Across 3 Zones
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  {sweptLgaIds.length}/{ZONAL_CAPTURE_TARGETS.length} swept
                </span>
              </div>

              {/* Mobile-First 3-Column Tappable LGA Capture Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {ZONAL_CAPTURE_TARGETS.map((target) => {
                  const isSwept = sweptLgaIds.includes(target.id);
                  const isFocused = selectedLgaId === target.id;
                  return (
                    <button
                      key={target.id}
                      type="button"
                      onClick={() => toggleSweepLga(target.id)}
                      className={`min-h-[44px] px-2.5 py-1.5 text-left rounded-lg border transition-colors flex items-center justify-between gap-1 ${
                        isSwept
                          ? isFocused
                            ? 'bg-emerald-700 text-white border-emerald-400'
                            : 'bg-emerald-950/80 text-emerald-100 border-emerald-700/80'
                          : isFocused
                            ? 'bg-slate-800 text-white border-slate-500'
                            : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block text-xs font-semibold truncate leading-tight">
                          {target.name}
                        </span>
                        <span className="block text-[10px] text-slate-400 leading-tight">
                          {target.zone}
                        </span>
                      </span>
                      {isSwept && <Check className="w-3.5 h-3.5 text-emerald-300 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Selected LGA Exact INEC Telemetry */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-base font-bold text-white font-display">
                      {activeLga.lga.name} Local Government
                    </div>
                    <div className="text-xs text-slate-400">
                      {activeLga.lga.zone} · INEC Code {activeLga.lga.inecCode}
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400 shrink-0">
                    {activeLga.pdpWardsWon}/{activeLga.lga.wardCount} Wards PDP
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-xs font-mono tabular-nums">
                  <div>
                    <div className="text-[10px] font-sans text-slate-400">INEC Voters</div>
                    <div className="font-bold text-white">
                      {activeLga.lga.registeredVoters.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-sans text-slate-400">Polling Units</div>
                    <div className="font-bold text-white">{activeLga.lga.pollingUnits}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-sans text-slate-400">PDP Margin</div>
                    <div className="font-bold text-emerald-400">
                      +{activeLga.marginVotes.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 space-y-1.5 text-[11px] font-mono tabular-nums">
                  <div className="flex justify-between">
                    <span className="text-emerald-400">PDP (Yakubu Lado)</span>
                    <span className="text-white">
                      {activeLga.pdpVotes.toLocaleString()} ({activeLga.pdpSharePct}%)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sky-400">APC</span>
                    <span className="text-slate-300">
                      {activeLga.apcVotes.toLocaleString()} ({activeLga.apcSharePct}%)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-400">ADC</span>
                    <span className="text-slate-300">
                      {activeLga.adcVotes.toLocaleString()} ({activeLga.adcSharePct}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={onOpenFullSimulator}
                className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-[#0D5C38] hover:bg-[#09452A] rounded-xl transition-colors"
              >
                <TrendingUp className="w-4 h-4 shrink-0" />
                Open Full 34-LGA Mapbox & Ward Simulator
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>
              <p className="text-[11px] text-slate-400 text-center">
                Tap any of Katsina’s 34 LGAs on Mapbox to inspect all 361 wards, adjust targets, and model reach.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
