import React from 'react';
import { CheckCircle2, ExternalLink, RotateCcw, Sliders, Users } from 'lucide-react';
import type { LgaSimulationResult } from '../lib/electionSimulator';
import { KATSINA_INEC_META } from '../data/katsinaInecData';

interface KatsinaLgaInspectorProps {
  lgaResult: LgaSimulationResult;
  onChangeTargetWards: (lgaId: string, wardsCount: number) => void;
  onToggleWardWinner: (wardId: string, winner: 'PDP' | 'APC' | 'ADC') => void;
  onResetLga: (lgaId: string) => void;
  hasCustomOverrides: boolean;
}

export const KatsinaLgaInspector: React.FC<KatsinaLgaInspectorProps> = ({
  lgaResult,
  onChangeTargetWards,
  onToggleWardWinner,
  onResetLga,
  hasCustomOverrides,
}) => {
  const { lga } = lgaResult;

  return (
    <div className="bg-white dark:bg-[#0F172A] border border-slate-200/90 dark:border-slate-800 rounded-xl flex flex-col h-full overflow-hidden">
      {/* LGA Title & INEC Header */}
      <div className="px-5 py-4 border-b border-slate-200/90 dark:border-slate-800 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-950 dark:text-white font-display truncate">
              {lga.name} LGA
            </h3>
            <span className="text-[11px] font-mono text-slate-400 shrink-0">
              INEC {lga.inecCode}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {lga.zone} · {lga.wardCount} Wards · {lga.pollingUnits} Polling Units
          </p>
        </div>

        <div className="text-right shrink-0">
          <div
            className={`text-xs font-bold font-mono tabular-nums ${
              lgaResult.winner === 'PDP'
                ? 'text-emerald-700 dark:text-emerald-400'
                : lgaResult.winner === 'APC'
                  ? 'text-sky-700 dark:text-sky-400'
                  : 'text-amber-700 dark:text-amber-400'
            }`}
          >
            {lgaResult.winner === 'PDP' ? 'Lado Wins LGA' : `${lgaResult.winner} Leads`}
          </div>
          <div className="text-[11px] font-mono tabular-nums text-slate-500">
            {lgaResult.marginVotes >= 0 ? '+' : ''}
            {lgaResult.marginVotes.toLocaleString()} votes
          </div>
        </div>
      </div>

      {/* Exact INEC Registered Voters & Potential Reach Grid */}
      <div className="px-5 py-3.5 border-b border-slate-200/90 dark:border-slate-800 grid grid-cols-3 gap-3 text-xs bg-slate-50/70 dark:bg-slate-900/40">
        <div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">INEC Voters</div>
          <div className="text-sm font-bold font-mono tabular-nums text-slate-950 dark:text-white mt-0.5">
            {lga.registeredVoters.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">PVC Reach</div>
          <div className="text-sm font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400 mt-0.5">
            {lgaResult.potentialReachVoters.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Sim Valid Votes</div>
          <div className="text-sm font-bold font-mono tabular-nums text-slate-950 dark:text-white mt-0.5">
            {lgaResult.projectedValidVotes.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Interactive Ward Capture Target Slider */}
      <div className="px-5 py-3.5 border-b border-slate-200/90 dark:border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <label
            htmlFor={`ward-slider-${lga.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200"
          >
            <Sliders className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
            Target PDP Wards in {lga.name}
          </label>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
              {lgaResult.pdpWardsWon} / {lga.wardCount} Wards ({lgaResult.wardCapturePct}%)
            </span>
            {hasCustomOverrides && (
              <button
                type="button"
                onClick={() => onResetLga(lga.id)}
                title="Reset LGA overrides"
                className="text-[11px] text-slate-500 hover:text-slate-900 dark:hover:text-white inline-flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        <input
          id={`ward-slider-${lga.id}`}
          type="range"
          min={0}
          max={lga.wardCount}
          step={1}
          value={lgaResult.pdpWardsWon}
          onChange={(e) => onChangeTargetWards(lga.id, Number(e.target.value))}
          className="w-full h-7 accent-emerald-700 cursor-pointer"
        />

        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>
            Each +1 flipped ward adds ~
            <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
              +{lgaResult.oneExtraWardVoteGain.toLocaleString()}
            </span>{' '}
            PDP votes
          </span>
          <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
            <CheckCircle2 className="w-3 h-3" />
            {lgaResult.meets25PctSpread ? '25% Spread Met' : 'Below 25%'}
          </span>
        </div>
      </div>

      {/* 4-Party Comparison Bars (PDP Yakubu Lado vs APC vs ADC vs Others) */}
      <div className="px-5 py-3.5 border-b border-slate-200/90 dark:border-slate-800 space-y-2">
        <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
          Party Vote Comparison in {lga.name} LGA
        </div>
        {(
          [
            {
              party: 'PDP (Yakubu Lado)',
              votes: lgaResult.pdpVotes,
              pct: lgaResult.pdpSharePct,
              barClass: 'bg-[#0D5C38] dark:bg-emerald-500',
              textClass: 'text-emerald-800 dark:text-emerald-400 font-bold',
            },
            {
              party: 'APC',
              votes: lgaResult.apcVotes,
              pct: lgaResult.apcSharePct,
              barClass: 'bg-sky-600 dark:bg-sky-500',
              textClass: 'text-slate-700 dark:text-slate-300',
            },
            {
              party: 'ADC',
              votes: lgaResult.adcVotes,
              pct: lgaResult.adcSharePct,
              barClass: 'bg-amber-600 dark:bg-amber-500',
              textClass: 'text-slate-700 dark:text-slate-300',
            },
            {
              party: 'Others (NNPP/PRP/LP)',
              votes: lgaResult.othersVotes,
              pct: lgaResult.othersSharePct,
              barClass: 'bg-slate-400 dark:bg-slate-600',
              textClass: 'text-slate-500 dark:text-slate-400',
            },
          ] as const
        ).map((row) => (
          <div key={row.party} className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className={row.textClass}>{row.party}</span>
              <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
                {row.votes.toLocaleString()} ({row.pct}%)
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${row.barClass}`} style={{ width: `${row.pct}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Complete Interactive Ward-by-Ward INEC Breakdown */}
      <div className="p-4 flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            All {lga.wardCount} INEC Wards — Click Party to Simulate
          </span>
          <a
            href={KATSINA_INEC_META.portalReferenceUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 hover:underline whitespace-nowrap"
          >
            INEC Portal <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="flex-1 max-h-[290px] overflow-y-auto pr-1 divide-y divide-slate-100 dark:divide-slate-800/80">
          {lgaResult.wards.map((w) => (
            <div
              key={w.ward.id}
              className="py-2 flex items-center justify-between gap-2 text-xs"
            >
              <div className="min-w-0">
                <div className="font-medium text-slate-900 dark:text-slate-100 truncate">
                  {w.ward.name}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                  {w.ward.registeredVoters.toLocaleString()} voters · {w.ward.pollingUnits} PUs · PDP{' '}
                  {w.pdpVotes.toLocaleString()}
                </div>
              </div>

              <div className="inline-flex items-center bg-slate-100 dark:bg-slate-900 p-0.5 rounded-md border border-slate-200/80 dark:border-slate-800 shrink-0">
                {(['PDP', 'APC', 'ADC'] as const).map((party) => (
                  <button
                    key={party}
                    type="button"
                    onClick={() => onToggleWardWinner(w.ward.id, party)}
                    aria-label={`Assign ${w.ward.name} ward to ${party}`}
                    className={`px-2.5 py-1.5 min-h-[34px] sm:min-h-[28px] text-[10px] font-mono font-semibold rounded transition-colors ${
                      w.winner === party
                        ? party === 'PDP'
                          ? 'bg-[#0D5C38] text-white'
                          : party === 'APC'
                            ? 'bg-sky-600 text-white'
                            : 'bg-amber-600 text-white'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {party}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
