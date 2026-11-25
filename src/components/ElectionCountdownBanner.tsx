import React, { useEffect, useState } from 'react';
import { ArrowRight, CalendarCheck2, Clock, Radio } from 'lucide-react';
import {
  computeCountdownBreakdown,
  KATSINA_GOVERNORSHIP_ELECTION_ISO,
  NIGERIA_PRESIDENTIAL_ELECTION_ISO,
  padTwo,
} from '../lib/electionCountdown';
import { t } from '../lib/i18n';
import type { AppLanguage } from '../types/campaign';

interface ElectionCountdownBannerProps {
  language: AppLanguage;
}

export const ElectionCountdownBanner: React.FC<ElectionCountdownBannerProps> = ({
  language,
}) => {
  const [pollTarget, setPollTarget] = useState<'governorship' | 'presidential'>('governorship');
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const targetIso =
    pollTarget === 'governorship'
      ? KATSINA_GOVERNORSHIP_ELECTION_ISO
      : NIGERIA_PRESIDENTIAL_ELECTION_ISO;
  const breakdown = computeCountdownBreakdown(targetIso, nowMs);
  const presSummary = computeCountdownBreakdown(NIGERIA_PRESIDENTIAL_ELECTION_ISO, nowMs);
  const govSummary = computeCountdownBreakdown(KATSINA_GOVERNORSHIP_ELECTION_ISO, nowMs);

  const blocks = [
    { label: t(language, 'countdownDays'), value: String(breakdown.days), accent: 'text-emerald-400' },
    { label: t(language, 'countdownHours'), value: padTwo(breakdown.hours), accent: 'text-white' },
    { label: t(language, 'countdownMinutes'), value: padTwo(breakdown.minutes), accent: 'text-white' },
    { label: t(language, 'countdownSeconds'), value: padTwo(breakdown.seconds), accent: 'text-amber-400' },
  ];

  return (
    <section
      aria-label="Official 2027 Election Victory Countdown"
      data-testid="election-countdown-banner"
      className="bg-[#070C17] text-white border-b border-emerald-900/60 relative overflow-hidden"
    >
      {/* Subtle PDP Emerald Top Accent Line */}
      <div className="h-1 w-full bg-gradient-to-r from-[#0D5C38] via-emerald-400 to-[#B91C1C]" />

      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-10 py-5 sm:py-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 lg:gap-8">
          {/* Left: Verified INEC Poll Context + Selector */}
          <div className="space-y-2.5 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {t(language, 'countdownBadge')}
              </span>
              <span className="inline-flex items-center gap-1.5 text-slate-300 font-mono">
                <CalendarCheck2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                {pollTarget === 'governorship'
                  ? t(language, 'countdownGovDate')
                  : t(language, 'countdownPresDate')}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl lg:text-[28px] font-bold font-display tracking-tight text-white leading-tight">
              {breakdown.isReached
                ? t(language, 'countdownReached')
                : pollTarget === 'governorship'
                  ? t(language, 'countdownGovTitle')
                  : t(language, 'countdownPresTitle')}
            </h2>

            {/* Poll Selector Pills + Quick Jump */}
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => setPollTarget('governorship')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[34px] text-xs font-semibold rounded-lg border transition-colors ${
                  pollTarget === 'governorship'
                    ? 'bg-emerald-600 text-white border-emerald-400'
                    : 'bg-slate-900/90 text-slate-300 border-slate-700 hover:border-slate-500'
                }`}
              >
                <Radio className="w-3 h-3 shrink-0" />
                Governorship · Feb 6, 2027 ({govSummary.days}d)
              </button>
              <button
                type="button"
                onClick={() => setPollTarget('presidential')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[34px] text-xs font-semibold rounded-lg border transition-colors ${
                  pollTarget === 'presidential'
                    ? 'bg-sky-700 text-white border-sky-400'
                    : 'bg-slate-900/90 text-slate-300 border-slate-700 hover:border-slate-500'
                }`}
              >
                <Clock className="w-3 h-3 shrink-0" />
                Presidential · Jan 16, 2027 ({presSummary.days}d)
              </button>
              <a
                href="#victory-simulation"
                className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-emerald-300 hover:text-emerald-200 ml-1"
              >
                {t(language, 'countdownCta')}
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Right: Giant Real-Time Flip Clock */}
          <div className="grid grid-cols-4 gap-2 sm:gap-3 w-full lg:w-auto lg:min-w-[460px] shrink-0">
            {blocks.map((block) => (
              <div
                key={block.label}
                className="rounded-xl bg-[#0E1629] border border-slate-700/90 px-2 py-3 sm:px-4 sm:py-3.5 text-center shadow-inner"
              >
                <div
                  data-testid={`countdown-value-${block.label.toLowerCase()}`}
                  className={`text-2xl sm:text-4xl lg:text-5xl font-mono font-extrabold tabular-nums tracking-tight leading-none ${block.accent}`}
                >
                  {block.value}
                </div>
                <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 mt-1.5">
                  {block.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
