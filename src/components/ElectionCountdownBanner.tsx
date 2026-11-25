import React, { useEffect, useState } from 'react';
import { ArrowRight, CalendarCheck2, Clock, Radio, ShieldCheck } from 'lucide-react';
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
  portraitUrl: string;
  pdpLogoUrl: string;
  candidateName: string;
  partyName: string;
}

export const ElectionCountdownBanner: React.FC<ElectionCountdownBannerProps> = ({
  language,
  portraitUrl,
  pdpLogoUrl,
  candidateName,
  partyName,
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

  // Progress bar across campaign home-stretch window (Sep 9, 2026 campaign start -> Feb 6, 2027 poll)
  const campaignStartMs = Date.parse('2026-09-09T00:00:00+01:00');
  const targetMs = Date.parse(targetIso);
  const stretchPct =
    targetMs > campaignStartMs
      ? Math.min(
          100,
          Math.max(4, Math.round(((nowMs - campaignStartMs) / (targetMs - campaignStartMs)) * 100))
        )
      : 100;

  const blocks = [
    {
      label: t(language, 'countdownDays'),
      value: String(breakdown.days),
      accent: 'text-emerald-400 drop-shadow-[0_0_16px_rgba(52,211,153,0.35)]',
      ring: 'border-emerald-400/35 from-[#0F231E] via-[#0B1722] to-[#070C17]',
    },
    {
      label: t(language, 'countdownHours'),
      value: padTwo(breakdown.hours),
      accent: 'text-white',
      ring: 'border-slate-700/90 from-[#141F36] via-[#0C1425] to-[#070C17]',
    },
    {
      label: t(language, 'countdownMinutes'),
      value: padTwo(breakdown.minutes),
      accent: 'text-white',
      ring: 'border-slate-700/90 from-[#141F36] via-[#0C1425] to-[#070C17]',
    },
    {
      label: t(language, 'countdownSeconds'),
      value: padTwo(breakdown.seconds),
      accent: 'text-amber-300 drop-shadow-[0_0_14px_rgba(251,191,36,0.3)]',
      ring: 'border-amber-400/30 from-[#1D1B29] via-[#0E1322] to-[#070C17]',
    },
  ];

  return (
    <section
      aria-label="Official 2027 Election Victory Countdown"
      data-testid="election-countdown-banner"
      className="relative overflow-hidden bg-[#050A14] text-white border-b border-emerald-900/60"
    >
      {/* PDP Tricolor Precision Top Rule */}
      <div className="h-1 w-full bg-gradient-to-r from-[#0D5C38] via-emerald-400 to-[#B91C1C]" />

      {/* Subtle Ambient Architectural Grid & Emerald Halo */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.4) 1px, transparent 1px)',
          backgroundSize: '42px 42px',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -left-16 w-80 h-80 rounded-full bg-emerald-500/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 right-0 w-96 h-96 rounded-full bg-sky-500/10 blur-3xl"
      />

      <div className="relative max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-10 py-5 sm:py-7">
        <div className="rounded-2xl bg-white/[0.03] backdrop-blur-md border border-white/10 p-4 sm:p-6 shadow-2xl">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 xl:gap-8">
            {/* Left Identity Lockup: Framed Senator Yakubu Lado Portrait + Mandate Countdown Title */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 min-w-0 flex-1">
              {/* Candidate Portrait Spotlight Frame */}
              <div className="flex items-center gap-3.5 sm:block shrink-0">
                <div className="relative w-20 h-24 sm:w-28 sm:h-34 lg:w-32 lg:h-40 rounded-2xl overflow-hidden border border-emerald-400/40 bg-slate-900 shadow-[0_0_38px_-10px_rgba(16,185,129,0.55)] shrink-0">
                  <img
                    src={portraitUrl}
                    alt={`Senator ${candidateName} — Official Campaign Portrait`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-top"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#050A14] via-[#050A14]/65 to-transparent" />
                  <div className="hidden sm:block absolute bottom-1.5 inset-x-2 text-[9px] font-bold uppercase tracking-wider text-emerald-300 truncate text-center">
                    Lado 2027
                  </div>
                  <img
                    src={pdpLogoUrl}
                    alt="PDP Umbrella Emblem"
                    referrerPolicy="no-referrer"
                    className="absolute top-1.5 right-1.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover border border-white/80 bg-white shadow-md"
                  />
                </div>

                {/* Compact Mobile Identity Beside Portrait (<sm) */}
                <div className="sm:hidden min-w-0 space-y-1">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/35 text-[10px] font-semibold text-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {t(language, 'countdownBadge')}
                  </span>
                  <div className="text-sm font-bold font-display text-white leading-tight truncate">
                    Senator {candidateName}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">{partyName}</div>
                </div>
              </div>

              {/* Headline, INEC Confirmed Timestamp & Poll Switcher */}
              <div className="space-y-2.5 min-w-0 flex-1">
                <div className="hidden sm:flex flex-wrap items-center gap-2 text-[11px] font-semibold">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/40 text-emerald-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    {t(language, 'countdownBadge')}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-200 font-mono">
                    <CalendarCheck2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    {pollTarget === 'governorship'
                      ? t(language, 'countdownGovDate')
                      : t(language, 'countdownPresDate')}
                  </span>
                </div>

                <div className="sm:hidden inline-flex items-center gap-1.5 text-[11px] text-emerald-300 font-mono">
                  <CalendarCheck2 className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {pollTarget === 'governorship'
                      ? t(language, 'countdownGovDate')
                      : t(language, 'countdownPresDate')}
                  </span>
                </div>

                <h2 className="text-lg sm:text-2xl lg:text-[26px] font-bold font-display tracking-tight text-white leading-snug">
                  {breakdown.isReached
                    ? t(language, 'countdownReached')
                    : pollTarget === 'governorship'
                      ? t(language, 'countdownGovTitle')
                      : t(language, 'countdownPresTitle')}
                </h2>

                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-300">
                  <span className="inline-flex items-center gap-1 text-slate-300">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    Senator {candidateName} · 34 LGAs · 361 Wards · 6,652 PUs
                  </span>
                </div>

                {/* Poll Target Toggle Pills + Jump CTA */}
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setPollTarget('governorship')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[34px] text-xs font-semibold rounded-lg border transition-all ${
                      pollTarget === 'governorship'
                        ? 'bg-emerald-600 text-white border-emerald-400 shadow-[0_0_20px_-4px_rgba(16,185,129,0.7)]'
                        : 'bg-slate-900/90 text-slate-300 border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    <Radio className="w-3 h-3 shrink-0" />
                    Governorship · Feb 6, 2027 ({govSummary.days}d)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPollTarget('presidential')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[34px] text-xs font-semibold rounded-lg border transition-all ${
                      pollTarget === 'presidential'
                        ? 'bg-sky-700 text-white border-sky-400 shadow-[0_0_20px_-4px_rgba(2,132,199,0.7)]'
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
            </div>

            {/* Right Showcase: High-Contrast Mechanical Split Flip-Clock Readout */}
            <div className="w-full xl:w-[490px] shrink-0 space-y-3">
              <div className="grid grid-cols-4 gap-2 sm:gap-3">
                {blocks.map((block) => (
                  <div
                    key={block.label}
                    className={`relative rounded-2xl bg-gradient-to-b ${block.ring} border px-1.5 py-3 sm:px-3.5 sm:py-4 text-center shadow-xl overflow-hidden`}
                  >
                    {/* Top specular highlight */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-2 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    />
                    {/* Split-flap horizontal seam */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-black/55 border-b border-white/[0.06]"
                    />
                    <div
                      data-testid={`countdown-value-${block.label.toLowerCase()}`}
                      className={`relative text-2xl sm:text-4xl lg:text-[44px] font-mono font-extrabold tabular-nums tracking-tight leading-none ${block.accent}`}
                    >
                      {block.value}
                    </div>
                    <div className="relative text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-2">
                      {block.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Campaign Home-Stretch Mobilization Timeline Bar */}
              <div className="space-y-1 px-0.5">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>INEC Campaign Window</span>
                  <span className="text-emerald-300 font-semibold">
                    {stretchPct}% to Ballot Opening
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-800/90 overflow-hidden border border-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-amber-400 transition-all duration-500"
                    style={{ width: `${stretchPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
