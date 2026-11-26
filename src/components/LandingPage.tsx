import React, { useMemo, useState } from 'react';
import {
  Activity,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Globe,
  HeartPulse,
  MapPin,
  Radio,
  ShieldCheck,
  GraduationCap,
  Briefcase,
  TrendingUp,
} from 'lucide-react';
import { useCampaign } from '../context/CampaignContext';
import { KATSINA_INEC_META } from '../data/katsinaInecData';
import { NigeriaMap } from './NigeriaMap';
import { LandingSimulationSnippet } from './LandingSimulationSnippet';
import {
  createDefaultSimulationConfig,
  runKatsinaSimulation,
} from '../lib/electionSimulator';
import type { NavModuleId } from '../types/campaign';

interface LandingPageProps {
  onEnterCommand: (
    initialModule?: NavModuleId,
    options?: { openSentiment?: boolean }
  ) => void;
}

const WELCOME_TARGET_LGAS = [
  { id: 'katsina', label: 'Katsina' },
  { id: 'malumfashi', label: 'Malumfashi' },
  { id: 'funtua', label: 'Funtua' },
  { id: 'kafur', label: 'Kafur' },
  { id: 'kankara', label: 'Kankara' },
  { id: 'bakori', label: 'Bakori' },
  { id: 'daura', label: 'Daura' },
  { id: 'batsari', label: 'Batsari' },
] as const;

const AGENDA_PILLARS = [
  {
    number: '01',
    title: 'Security & Community Peace Restoration',
    summary:
      'Coordinated state-federal security collaboration, early-warning local intelligence networks, and community policing support across all 34 Katsina LGAs.',
    icon: ShieldCheck,
  },
  {
    number: '02',
    title: 'Free Education & School Renewal',
    summary:
      'Comprehensive free public education for state indigenes paired with classroom reconstruction, teacher support, and vocational skills pipelines.',
    icon: GraduationCap,
  },
  {
    number: '03',
    title: 'Zonal Healthcare Expansion',
    summary:
      'Modern medical centers across Katsina Central, North (Daura), and South (Funtua) senatorial zones with reliable essential medicine supply.',
    icon: HeartPulse,
  },
  {
    number: '04',
    title: 'Civil Service Reform & Youth Enterprise',
    summary:
      'Sustainable pension arrangements for public servants alongside structured agricultural modernization and enterprise financing for women and youth.',
    icon: Briefcase,
  },
];

const PUBLIC_SERVICE_RECORD = [
  { period: '1999 – 2002', role: 'Local Government Council Chairman', detail: 'Grassroots executive leadership in Katsina State.' },
  { period: '2003 – 2007', role: 'Member, House of Representatives', detail: 'Federal legislative representation and constituency delivery.' },
  { period: '2007 – 2011', role: 'Senator, Katsina South Senatorial Zone', detail: 'Chaired the Senate Committee on Land Transport under the PDP.' },
  { period: '2027 Mission', role: 'PDP Governorship Flagbearer & Campaign Command', detail: 'People-first governance agenda backed by disciplined 774-LGA operations.' },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterCommand }) => {
  const { branding, stateSummaries, selectedStateCode, setSelectedStateCode, metrics } =
    useCampaign();
  const [mapLayer, setMapLayer] = useState<'coverage' | 'incidents' | 'reports'>('coverage');

  // Interactive Welcome Hero LGA capture toggles: visitors immediately see Lado winning Katsina
  // and can toggle capturing key target LGAs to watch votes & winning margin recalculate live.
  const [capturedTargetLgas, setCapturedTargetLgas] = useState<string[]>([
    'katsina',
    'malumfashi',
    'funtua',
    'kafur',
    'kankara',
    'bakori',
  ]);

  const welcomeSimulation = useMemo(() => {
    const cfg = createDefaultSimulationConfig('lado-victory');
    const capturedSet = new Set(capturedTargetLgas);
    const baseline = runKatsinaSimulation(cfg);
    for (const target of WELCOME_TARGET_LGAS) {
      const lgaInfo = baseline.lgaById[target.id]?.lga;
      if (!lgaInfo) continue;
      if (capturedSet.has(target.id)) {
        // Full-LGA strategic capture boost
        cfg.lgaWardTargetOverrides[target.id] = lgaInfo.wardCount;
      } else {
        // Competitive baseline (~60% wards) if visitor unchecks this LGA
        cfg.lgaWardTargetOverrides[target.id] = Math.max(4, Math.floor(lgaInfo.wardCount * 0.55));
      }
    }
    return runKatsinaSimulation(cfg);
  }, [capturedTargetLgas]);

  const toggleWelcomeLga = (lgaId: string) => {
    setCapturedTargetLgas((prev) =>
      prev.includes(lgaId) ? prev.filter((id) => id !== lgaId) : [...prev, lgaId]
    );
  };

  const portraitSrc =
    branding.portraitDataUrl ||
    'https://i.ibb.co/Cp8c3Xnb/Smiling-Nigerian-Man-in-Traditional-Attire.png';
  const pdpLogoSrc =
    branding.partyLogoDataUrl ||
    '/src/assets/images/pdp_umbrella_emblem_1795647900978.jpg';
  const civicHorizonSrc =
    branding.bannerDataUrl ||
    '/src/assets/images/katsina_civic_horizon_1795647902341.jpg';

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 overflow-x-clip">
      {/* Mobile-First 3-Zone Sticky Header (h-14 mobile / h-16 desktop) */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-10 h-14 sm:h-16 flex items-center justify-between gap-3 md:gap-8">
          {/* Zone 1: PDP Emblem + Single-Line Brand Wordmark */}
          <a
            href="#top"
            className="flex items-center gap-2 sm:gap-3 min-w-0 group"
          >
            <img
              src={pdpLogoSrc}
              alt="PDP Umbrella Emblem"
              referrerPolicy="no-referrer"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border border-slate-200 bg-white shrink-0"
            />
            <span className="text-sm sm:text-base font-bold tracking-tight text-slate-950 font-display truncate">
              {branding.candidateName}
            </span>
          </a>

          {/* Zone 2: 4 Clean Single-Line Text Navigation Links */}
          <nav
            aria-label="Campaign Landing Navigation"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600 shrink-0"
          >
            <a
              href="#victory-simulation"
              className="hover:text-slate-950 transition-colors whitespace-nowrap shrink-0"
            >
              Victory Simulator
            </a>
            <a
              href="#leadership"
              className="hover:text-slate-950 transition-colors whitespace-nowrap shrink-0"
            >
              Leadership
            </a>
            <a
              href="#agenda"
              className="hover:text-slate-950 transition-colors whitespace-nowrap shrink-0"
            >
              Agenda
            </a>
            <a
              href="#operations-map"
              className="hover:text-slate-950 transition-colors whitespace-nowrap shrink-0"
            >
              Operations Map
            </a>
            <button
              type="button"
              onClick={() => onEnterCommand('settings-admin')}
              data-testid="landing-admin-wards-nav"
              className="hover:text-slate-950 transition-colors whitespace-nowrap shrink-0"
            >
              States & Wards
            </button>
            <button
              type="button"
              onClick={() => onEnterCommand('situation-room', { openSentiment: true })}
              data-testid="landing-voter-sentiment-nav"
              className="inline-flex items-center gap-1.5 text-emerald-700 hover:text-emerald-900 font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Voter Sentiment
            </button>
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={() => onEnterCommand('situation-room')}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 py-2 sm:px-4 min-h-[40px] text-xs font-semibold text-white rounded-lg transition-opacity hover:opacity-92 whitespace-nowrap shrink-0"
              style={{ backgroundColor: branding.primaryColor }}
            >
              <span className="sm:hidden">Situation Room</span>
              <span className="hidden sm:inline">Enter Situation Room</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </button>
          </div>
        </div>
      </header>

      <main id="top">
        {/* Welcome Editorial Hero + Live "Lado Wins Katsina" LGA-Capture Simulation Above the Fold */}
        <section className="bg-white border-b border-slate-200/80">
          <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-10 lg:py-14">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 lg:gap-10 items-stretch">
              {/* Left Column: Welcome Narrative + Instant Interactive Lado Victory Card */}
              <div className="lg:col-span-7 flex flex-col justify-between gap-5">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
                    <img
                      src={pdpLogoSrc}
                      alt="People's Democratic Party Logo"
                      referrerPolicy="no-referrer"
                      className="w-6 h-6 rounded-full object-cover border border-slate-200 bg-white shrink-0"
                    />
                    <span style={{ color: branding.primaryColor }}>
                      {branding.partyAffiliation}
                    </span>
                    <span className="hidden sm:inline text-slate-300" aria-hidden="true">·</span>
                    <span>Katsina State 2027 Victory Command</span>
                  </div>

                  <h1
                    className="font-display font-bold tracking-tight text-slate-950 leading-[1.08]"
                    style={{ fontSize: 'clamp(1.85rem, 3.5vw, 3.1rem)' }}
                  >
                    Welcome — See How Senator Yakubu Lado Wins Katsina State.
                  </h1>

                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
                    Built on the official{' '}
                    <span className="font-semibold text-slate-900">October 2026 INEC voter register</span>{' '}
                    of{' '}
                    <span className="font-mono font-semibold text-slate-900">
                      {KATSINA_INEC_META.totalRegisteredVoters.toLocaleString()}
                    </span>{' '}
                    registered voters (4th nationally behind Lagos, Kano & Kaduna;{' '}
                    <span className="font-mono font-semibold text-emerald-700">
                      +{KATSINA_INEC_META.cvr2026NetAdditions.toLocaleString()}
                    </span>{' '}
                    since 2023) across 34 LGAs and 361 wards. Toggle target LGAs below to model Lado’s 2027 victory path from the 2023 INEC baseline.
                  </p>
                </div>

                {/* Live Above-the-Fold Welcome Victory Simulation Card */}
                <div
                  data-testid="welcome-victory-card"
                  className="bg-[#080E1C] text-white rounded-2xl border border-slate-800 p-4 sm:p-5 space-y-4 shadow-md"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3.5 border-b border-slate-800/90">
                    <div className="space-y-1 min-w-0">
                      <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {welcomeSimulation.ladoWins
                            ? 'PROJECTED VICTORY · PDP YAKUBU LADO WINS KATSINA'
                            : 'LIVE KATSINA INEC PROJECTION'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                        <span
                          data-testid="welcome-pdp-votes"
                          className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-white"
                        >
                          {welcomeSimulation.pdpVotes.toLocaleString()}
                        </span>
                        <span className="text-xs font-mono text-emerald-400 font-semibold">
                          {welcomeSimulation.pdpSharePct}% vote share
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          <span className="hidden sm:inline" aria-hidden="true">· </span>
                          {welcomeSimulation.pdpLgasWon}/34 LGAs · {welcomeSimulation.pdpWardsWon}/361 Wards
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Simulated Turnout: <span className="text-slate-200 font-semibold">{welcomeSimulation.projectedValidVotes.toLocaleString()}</span> of{' '}
                        <span className="text-emerald-300 font-semibold">{KATSINA_INEC_META.totalRegisteredVoters.toLocaleString()}</span> INEC Oct 2026 Voters ({welcomeSimulation.turnoutPct}%)
                      </div>
                    </div>

                    <div className="sm:text-right shrink-0">
                      <div className="text-[11px] text-slate-400">Lead Over {welcomeSimulation.runnerUpParty}</div>
                      <div
                        data-testid="welcome-margin"
                        className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-emerald-400"
                      >
                        +{welcomeSimulation.marginOverRunnerUp.toLocaleString()}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        vs 2023 PDP ({welcomeSimulation.baseline2023PdpVotes.toLocaleString()}): +
                        {welcomeSimulation.pdpGainVs2023.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* 4-Party Instant Visual Bar */}
                  <div className="space-y-2">
                    <div className="h-2.5 w-full rounded-full overflow-hidden flex bg-slate-800">
                      <div
                        style={{ width: `${welcomeSimulation.pdpSharePct}%` }}
                        className="bg-emerald-500 transition-all duration-200"
                      />
                      <div
                        style={{ width: `${welcomeSimulation.apcSharePct}%` }}
                        className="bg-sky-500 transition-all duration-200"
                      />
                      <div
                        style={{ width: `${welcomeSimulation.adcSharePct}%` }}
                        className="bg-amber-500 transition-all duration-200"
                      />
                      <div
                        style={{ width: `${welcomeSimulation.othersSharePct}%` }}
                        className="bg-slate-500 transition-all duration-200"
                      />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono tabular-nums">
                      <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800/70">
                        <span className="font-sans font-semibold text-emerald-300">PDP</span>
                        <span className="font-bold text-white">{welcomeSimulation.pdpSharePct}%</span>
                      </div>
                      <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="font-sans font-semibold text-sky-400">APC</span>
                        <span className="text-slate-200">{welcomeSimulation.apcSharePct}%</span>
                      </div>
                      <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="font-sans font-semibold text-amber-400">ADC</span>
                        <span className="text-slate-200">{welcomeSimulation.adcSharePct}%</span>
                      </div>
                      <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="font-sans font-semibold text-slate-400">Others</span>
                        <span className="text-slate-300">{welcomeSimulation.othersSharePct}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Key Local Government Capture Selector */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="text-slate-300 font-medium">
                        Tap Local Governments to simulate full-LGA capture:
                      </span>
                      <span className="font-mono text-emerald-400 shrink-0">
                        {capturedTargetLgas.length}/{WELCOME_TARGET_LGAS.length} swept
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {WELCOME_TARGET_LGAS.map((target) => {
                        const isCaptured = capturedTargetLgas.includes(target.id);
                        const lgaSim = welcomeSimulation.lgaById[target.id];
                        return (
                          <button
                            key={target.id}
                            type="button"
                            onClick={() => toggleWelcomeLga(target.id)}
                            aria-pressed={isCaptured}
                            data-testid={`welcome-lga-toggle-${target.id}`}
                            className={`min-h-[44px] px-2.5 py-1.5 rounded-lg border text-left transition-colors flex items-center justify-between gap-1.5 ${
                              isCaptured
                                ? 'bg-emerald-950/90 border-emerald-500/80 text-white'
                                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-600'
                            }`}
                          >
                            <span className="min-w-0">
                              <span className="block text-xs font-semibold truncate leading-tight">
                                {target.label}
                              </span>
                              <span className="block text-[10px] font-mono text-slate-400 tabular-nums">
                                {lgaSim ? `${Math.round(lgaSim.lga.registeredVoters / 1000)}k voters` : ''}
                              </span>
                            </span>
                            <span
                              className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                                isCaptured ? 'bg-emerald-500 text-slate-950' : 'border border-slate-600'
                              }`}
                            >
                              {isCaptured && <Check className="w-3 h-3 stroke-[3]" />}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Mobile-First Primary Actions */}
                <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => onEnterCommand('katsina-simulator')}
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] text-sm font-semibold text-white rounded-lg shadow-xs hover:opacity-92 transition-opacity whitespace-nowrap"
                    style={{ backgroundColor: branding.primaryColor }}
                  >
                    <TrendingUp className="w-4 h-4 shrink-0" />
                    34-LGA Mapbox Simulator
                  </button>

                  <button
                    type="button"
                    onClick={() => onEnterCommand('situation-room', { openSentiment: true })}
                    data-testid="landing-open-sentiment-btn"
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] text-sm font-semibold text-emerald-900 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 rounded-lg transition-colors whitespace-nowrap"
                  >
                    <Activity className="w-4 h-4 text-emerald-700 shrink-0" />
                    Live Voter Sentiment
                  </button>

                  <button
                    type="button"
                    onClick={() => onEnterCommand('settings-admin')}
                    data-testid="landing-open-admin-wards-btn"
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] text-sm font-semibold text-slate-900 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap"
                  >
                    <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
                    States & 361 Wards
                  </button>
                </div>
              </div>

              {/* Right Framed Editorial Portrait (No 'Garba' in tagname!) */}
              <div className="lg:col-span-5">
                <div className="relative h-[360px] sm:h-[440px] lg:h-full lg:min-h-[520px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                  <img
                    src={portraitSrc}
                    alt={`Official editorial portrait of Senator ${branding.candidateName}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-top"
                  />

                  {/* Crisp PDP Crest Anchor in Top Right */}
                  <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm p-1.5 rounded-full shadow-md border border-slate-200/80">
                    <img
                      src={pdpLogoSrc}
                      alt="PDP Crest"
                      referrerPolicy="no-referrer"
                      className="w-11 h-11 rounded-full object-cover"
                    />
                  </div>

                  {/* Measured Contrast Scrim for Portrait Caption */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/92 via-slate-950/50 to-transparent px-5 sm:px-6 pt-16 pb-5 text-white">
                    <div className="text-xs font-medium text-emerald-300">
                      {branding.partyAffiliation}
                    </div>
                    <div
                      data-testid="portrait-caption-name"
                      className="text-xl font-bold font-display tracking-tight mt-0.5"
                    >
                      Senator {branding.candidateName}
                    </div>
                    <div className="text-xs text-slate-300 mt-1">
                      {branding.slogan}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Full-Width 4-Column Quantitative Operational Proof Strip */}
            <div className="mt-10 pt-7 border-t border-slate-200 grid grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-8">
              <div>
                <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-950">
                  {KATSINA_INEC_META.totalRegisteredVoters.toLocaleString()}
                </div>
                <div className="text-xs font-medium text-slate-600 mt-1">
                  Oct 2026 INEC Voters · #4 Nationally
                </div>
              </div>
              <div>
                <div
                  className="text-2xl sm:text-3xl font-bold font-mono tabular-nums"
                  style={{ color: branding.primaryColor }}
                >
                  34 LGAs · 361
                </div>
                <div className="text-xs font-medium text-slate-600 mt-1">
                  Katsina LGAs & Electoral Wards
                </div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-950">
                  6,652
                </div>
                <div className="text-xs font-medium text-slate-600 mt-1">
                  Verified Katsina Polling Units
                </div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-950">
                  36 + FCT
                </div>
                <div className="text-xs font-medium text-slate-600 mt-1">
                  National 774-LGA Operations Scope
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Detailed Interactive INEC Katsina Victory Simulation & Zonal LGA Capture Explorer */}
        <LandingSimulationSnippet
          onOpenFullSimulator={() => onEnterCommand('katsina-simulator')}
        />

        {/* Public Service Record & Leadership Timeline */}
        <section id="leadership" className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-10 py-14 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            <div className="lg:col-span-4 space-y-3">
              <div className="text-xs font-semibold text-emerald-800">
                Proven Public Service Record
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold font-display tracking-tight text-slate-950">
                Decades of Executive & Legislative Stewardship
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                From grassroots Local Government administration to the National Assembly, Senator Yakubu Lado Dan Marke brings institutional experience across every tier of Nigerian governance.
              </p>
            </div>

            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PUBLIC_SERVICE_RECORD.map((item) => (
                <div
                  key={item.period}
                  className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 space-y-2"
                >
                  <div className="text-xs font-mono tabular-nums font-semibold text-emerald-800">
                    {item.period}
                  </div>
                  <h3 className="text-base font-bold text-slate-950">{item.role}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Four-Point Governance Agenda — Asymmetric Editorial Bento */}
        <section id="agenda" className="bg-white border-y border-slate-200/80 py-14 lg:py-20">
          <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-10 space-y-8 lg:space-y-10">
            <div className="max-w-2xl space-y-2">
              <div className="text-xs font-semibold text-emerald-800">
                Governance Blueprint
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold font-display tracking-tight text-slate-950">
                Four Priorities for Security, Renewal & Economic Dignity
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Featured Civic Horizon Visual */}
              <div className="lg:col-span-5 relative rounded-2xl overflow-hidden border border-slate-200 min-h-[280px] sm:min-h-[340px]">
                <img
                  src={civicHorizonSrc}
                  alt="Katsina State Civic Heritage & Modern Infrastructure Vision"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-transparent p-5 sm:p-6 text-white">
                  <div className="flex items-center gap-2 text-xs text-emerald-300 font-medium">
                    <Building2 className="w-3.5 h-3.5" />
                    Katsina State Development Vision
                  </div>
                  <p className="text-sm font-medium mt-1.5 leading-snug text-slate-100">
                    Building safe communities, accountable public institutions, and thriving economic corridors across Katsina Central, Daura, and Funtua zones.
                  </p>
                </div>
              </div>

              {/* Numbered Editorial Pillars */}
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {AGENDA_PILLARS.map((pillar) => {
                  const Icon = pillar.icon;
                  return (
                    <div
                      key={pillar.number}
                      className="bg-[#F8F9FA] border border-slate-200/90 rounded-xl p-5 sm:p-6 flex flex-col justify-between gap-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-semibold text-slate-400">
                          {pillar.number}.
                        </span>
                        <Icon className="w-4 h-4 text-emerald-800" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-base font-bold text-slate-950 leading-snug">
                          {pillar.title}
                        </h3>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {pillar.summary}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Live Mapbox GL Operations Preview Section */}
        <section id="operations-map" className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-10 py-14 lg:py-20 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="text-xs font-semibold text-emerald-800">
                Live Geographic Operations · Powered by Mapbox GL
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold font-display tracking-tight text-slate-950">
                Nationwide Field Readiness Across All 36 States & FCT
              </h2>
              <p className="text-sm text-slate-600">
                Pan, zoom, and select any state marker to inspect real-time coordinator coverage, field agent check-ins, and active operational readiness across 774 verified LGAs.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex bg-white border border-slate-200 p-1 rounded-lg">
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
                    className={`px-3 py-1.5 min-h-[36px] text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                      mapLayer === key
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:text-slate-950'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => onEnterCommand('geographic-ops')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[44px] text-xs font-semibold text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 whitespace-nowrap"
              >
                <Globe className="w-3.5 h-3.5" />
                Open 774-LGA Explorer
              </button>
            </div>
          </div>

          <NigeriaMap
            stateSummaries={stateSummaries}
            selectedStateCode={selectedStateCode}
            onSelectState={setSelectedStateCode}
            layer={mapLayer}
          />
        </section>

        {/* Command Center Direct Access Strip */}
        <section id="command-platform" className="bg-[#0A0F1A] text-white py-14 sm:py-16">
          <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2.5 text-xs font-medium text-emerald-400">
                <MapPin className="w-3.5 h-3.5" />
                Campaign Operations & Election Situation Room
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold font-display tracking-tight">
                Ready for Live Campaign Command & Field Coordination
              </h2>
              <p className="text-sm text-slate-400">
                Currently tracking{' '}
                <span className="font-mono text-white">{metrics.totalPersonnel}</span> personnel,{' '}
                <span className="font-mono text-emerald-400">{metrics.agentsCheckedIn}</span>{' '}
                checked-in field agents, and{' '}
                <span className="font-mono text-white">{metrics.pollingUnitsTotal}</span> monitored
                units across 20 integrated operational modules.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto shrink-0">
              <button
                type="button"
                onClick={() => onEnterCommand('situation-room')}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] text-sm font-semibold text-white rounded-lg hover:opacity-92 transition-opacity whitespace-nowrap"
                style={{ backgroundColor: branding.primaryColor }}
              >
                Enter Situation Room
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onEnterCommand('settings-admin')}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[44px] text-sm font-medium text-slate-200 border border-slate-700 rounded-lg hover:bg-slate-800/80 transition-colors whitespace-nowrap"
              >
                Update Portrait & PDP Assets
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Quiet Editorial Footer */}
      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2.5 text-center sm:text-left">
            <img
              src={pdpLogoSrc}
              alt="PDP Emblem"
              referrerPolicy="no-referrer"
              className="w-6 h-6 rounded-full object-cover border border-slate-200 shrink-0"
            />
            <span className="font-semibold text-slate-800">{branding.campaignName}</span>
            <span className="text-slate-300 hidden sm:inline" aria-hidden="true">·</span>
            <span className="hidden sm:inline">{branding.partyAffiliation}</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-5">
            <button
              type="button"
              onClick={() => onEnterCommand('situation-room')}
              className="hover:text-slate-900 transition-colors py-1"
            >
              Situation Room
            </button>
            <button
              type="button"
              onClick={() => onEnterCommand('katsina-simulator')}
              className="hover:text-slate-900 transition-colors py-1"
            >
              Katsina Simulator
            </button>
            <button
              type="button"
              onClick={() => onEnterCommand('field-ops')}
              className="hover:text-slate-900 transition-colors py-1"
            >
              Field Mobile PWA
            </button>
            <button
              type="button"
              onClick={() => onEnterCommand('settings-admin')}
              className="hover:text-slate-900 transition-colors py-1"
            >
              Branding Settings
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
