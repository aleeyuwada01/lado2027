import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  Headphones,
  MessageSquare,
  Pause,
  Play,
  Plus,
  Radio,
  Search,
  Sparkles,
  TrendingUp,
  X,
} from 'lucide-react';
import { useCampaign } from '../context/CampaignContext';
import { KATSINA_INEC_LGAS } from '../data/katsinaInecData';
import {
  aggregateVoterSentiment,
  classifyTextSentiment,
  filterSentimentTrends,
  SENTIMENT_CATEGORIES,
  type PulseChannel,
  type SentimentCategory,
  type SentimentPolarity,
  type SentimentTrendItem,
} from '../lib/voterSentiment';

interface VoterSentimentSidebarProps {
  open: boolean;
  onClose: () => void;
  onPulseScoreChange?: (score: number) => void;
}

const LIVE_ROTATING_PULSES: Array<Omit<SentimentTrendItem, 'id' | 'timestamp'>> = [
  {
    channel: 'social',
    sourceLabel: 'X / Katsina Live Pulse',
    category: 'Agriculture & Economy',
    polarity: 'positive',
    score: 85,
    headline: 'Bakori & Danja farmer cooperatives endorse PDP dry-season irrigation plan',
    summary: 'Fresh radio call-ins and WhatsApp voice notes show upbeat response across southern agrarian wards.',
    location: 'Bakori · KT',
    mentions: 640,
    velocityPct: 33,
    actionable: false,
    linkedModule: 'media-monitoring',
  },
  {
    channel: 'call-center',
    sourceLabel: 'Call Center · Inbound Desk',
    category: 'Mobilization & Events',
    polarity: 'positive',
    score: 81,
    headline: 'High volume of PVC verification inquiries from Batagarawa & Rimi youth',
    summary: 'Call operators report 24 consecutive callers requesting ward coordinator contact details.',
    location: 'Batagarawa · KT',
    mentions: 74,
    velocityPct: 26,
    actionable: false,
    linkedModule: 'call-center',
  },
  {
    channel: 'social',
    sourceLabel: 'Katsina Community Radio',
    category: 'Security & Peace',
    polarity: 'neutral',
    score: 58,
    headline: 'Batsari elders request detailed timeline for rural patrol support',
    summary: 'Constructive town-hall questions seeking clear rollout milestones for frontline communities.',
    location: 'Batsari · KT',
    mentions: 420,
    velocityPct: 19,
    actionable: true,
    linkedModule: 'communications',
  },
];

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diffMs) || diffMs < 60_000) return 'Just now';
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export const VoterSentimentSidebar: React.FC<VoterSentimentSidebarProps> = ({
  open,
  onClose,
  onPulseScoreChange,
}) => {
  const { calls, mediaItems, fieldReports, incidents, setActiveModule } = useCampaign();

  const [channel, setChannel] = useState<PulseChannel>('all');
  const [category, setCategory] = useState<SentimentCategory>('All');
  const [polarity, setPolarity] = useState<'all' | SentimentPolarity>('all');
  const [lgaFilter, setLgaFilter] = useState<string>('All');
  const [query, setQuery] = useState<string>('');
  const [isLiveStream, setIsLiveStream] = useState<boolean>(true);
  const [customItems, setCustomItems] = useState<SentimentTrendItem[]>([]);
  const [pulseCursor, setPulseCursor] = useState<number>(0);

  // Compact inline composer for logging a new social/radio pulse trend
  const [composerOpen, setComposerOpen] = useState<boolean>(false);
  const [draftLga, setDraftLga] = useState<string>('Katsina');
  const [draftChannel, setDraftChannel] = useState<'social' | 'call-center'>('social');
  const [draftHeadline, setDraftHeadline] = useState<string>('');
  const [isDesktop, setIsDesktop] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 1280px)').matches : true
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(min-width: 1280px)');
    const handleChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    setIsDesktop(mq.matches);
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  // Gentle real-time pulse ticker when live stream is active (adds at most 3 live pulses while open)
  useEffect(() => {
    if (!open || !isLiveStream || pulseCursor >= LIVE_ROTATING_PULSES.length) return;
    const timer = window.setInterval(() => {
      setPulseCursor((prev) => {
        if (prev >= LIVE_ROTATING_PULSES.length) return prev;
        const tpl = LIVE_ROTATING_PULSES[prev];
        const nextItem: SentimentTrendItem = {
          ...tpl,
          id: `live-pulse-${Date.now()}-${prev}`,
          timestamp: new Date().toISOString(),
        };
        setCustomItems((existing) => [nextItem, ...existing]);
        return prev + 1;
      });
    }, 18000);
    return () => window.clearInterval(timer);
  }, [open, isLiveStream, pulseCursor]);

  const pulseSummary = useMemo(
    () =>
      aggregateVoterSentiment({
        calls,
        mediaItems,
        fieldReports,
        incidents,
        customSocialItems: customItems,
      }),
    [calls, mediaItems, fieldReports, incidents, customItems]
  );

  useEffect(() => {
    onPulseScoreChange?.(pulseSummary.overallScore);
  }, [pulseSummary.overallScore, onPulseScoreChange]);

  const filteredTrends = useMemo(
    () =>
      filterSentimentTrends(pulseSummary.items, {
        channel,
        category,
        polarity,
        lga: lgaFilter,
        query,
      }),
    [pulseSummary.items, channel, category, polarity, lgaFilter, query]
  );

  const handleAddPulseNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftHeadline.trim()) return;
    const classified = classifyTextSentiment(draftHeadline);
    const created: SentimentTrendItem = {
      id: `manual-pulse-${Date.now()}`,
      channel: draftChannel,
      sourceLabel: draftChannel === 'social' ? 'Social Desk Observation' : 'Call Center Pulse Note',
      category: classified.category,
      polarity: classified.polarity,
      score: classified.score,
      headline: draftHeadline.trim(),
      summary: `Logged live from ${draftLga} LGA sentiment monitoring desk for immediate campaign awareness.`,
      location: `${draftLga} · KT`,
      mentions: draftChannel === 'social' ? 185 : 24,
      velocityPct: 24,
      timestamp: new Date().toISOString(),
      actionable: classified.polarity === 'concern',
      linkedModule: draftChannel === 'social' ? 'media-monitoring' : 'call-center',
    };
    setCustomItems((prev) => [created, ...prev]);
    setDraftHeadline('');
    setComposerOpen(false);
  };

  if (!open) return null;

  const panelBody = (
    <div
      data-testid="voter-sentiment-sidebar"
      className="flex flex-col h-full bg-white dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 border-l border-slate-200/90 dark:border-slate-800"
    >
      {/* Top Header */}
      <div className="px-4 h-14 sm:h-16 border-b border-slate-200/90 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/80 flex items-center justify-center shrink-0">
            <Activity className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-bold text-slate-950 dark:text-white font-display truncate">
                Voter Sentiment
              </h2>
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  isLiveStream ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                }`}
                title={isLiveStream ? 'Live pulse stream active' : 'Stream paused'}
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              Social & Calls · {pulseSummary.totalSignals} signals
            </p>
          </div>
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsLiveStream((v) => !v)}
            aria-label={isLiveStream ? 'Pause live sentiment stream' : 'Resume live sentiment stream'}
            title={isLiveStream ? 'Pause live stream' : 'Resume live stream'}
            className="p-1.5 min-h-[34px] min-w-[34px] flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {isLiveStream ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => setComposerOpen((v) => !v)}
            aria-label="Log new pulse observation"
            data-testid="sentiment-add-pulse-btn"
            title="Log pulse observation"
            className="p-1.5 min-h-[34px] min-w-[34px] flex items-center justify-center rounded-lg text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Voter Sentiment sidebar"
            className="p-1.5 min-h-[34px] min-w-[34px] flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Inline Quick Pulse Logger */}
      {composerOpen && (
        <form
          onSubmit={handleAddPulseNote}
          data-testid="sentiment-composer-form"
          className="px-4 py-3 bg-slate-50/90 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800 space-y-2.5 shrink-0"
        >
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300">
            <span>Add Live Sentiment Signal</span>
            <button
              type="button"
              onClick={() => setComposerOpen(false)}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              Cancel
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={draftChannel}
              onChange={(e) => setDraftChannel(e.target.value as 'social' | 'call-center')}
              aria-label="Pulse source channel"
              className="px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            >
              <option value="social">Social / Radio</option>
              <option value="call-center">Call Center</option>
            </select>
            <select
              value={draftLga}
              onChange={(e) => setDraftLga(e.target.value)}
              aria-label="Katsina LGA"
              className="px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            >
              {KATSINA_INEC_LGAS.map((lga) => (
                <option key={lga.id} value={lga.name}>
                  {lga.name}
                </option>
              ))}
            </select>
          </div>
          <input
            type="text"
            required
            value={draftHeadline}
            onChange={(e) => setDraftHeadline(e.target.value)}
            placeholder="e.g., Strong youth turnout reported at Funtua town hall..."
            className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
          />
          <button
            type="submit"
            className="w-full min-h-[36px] px-3 py-1.5 text-xs font-semibold text-white bg-[#0D5C38] hover:bg-[#09452A] rounded-lg transition-colors"
          >
            Publish to Sentiment Stream
          </button>
        </form>
      )}

      {/* Net Sentiment Pulse Meter */}
      <div className="px-4 py-3.5 border-b border-slate-200/90 dark:border-slate-800 space-y-2.5 bg-slate-50/60 dark:bg-[#0D1425] shrink-0">
        <div className="flex items-end justify-between gap-2">
          <div>
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Katsina Net Favorability Index
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span
                data-testid="sentiment-overall-score"
                className="text-2xl font-bold tabular-nums text-slate-950 dark:text-white leading-none"
              >
                {pulseSummary.overallScore}
              </span>
              <span className="text-xs text-slate-400 font-medium">/ 100</span>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold ${
              pulseSummary.overallScore >= 70
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/70'
                : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/70'
            }`}
          >
            <TrendingUp className="w-3 h-3" />
            {pulseSummary.momentumLabel}
          </span>
        </div>

        {/* 3-Band Polarity Bar */}
        <div className="h-2 w-full rounded-full overflow-hidden flex bg-slate-200 dark:bg-slate-800">
          <div
            style={{ width: `${pulseSummary.positivePct}%` }}
            className="bg-emerald-500 transition-all duration-300"
          />
          <div
            style={{ width: `${pulseSummary.neutralPct}%` }}
            className="bg-slate-400 dark:bg-slate-500 transition-all duration-300"
          />
          <div
            style={{ width: `${pulseSummary.concernPct}%` }}
            className="bg-amber-500 transition-all duration-300"
          />
        </div>

        <div className="flex items-center justify-between text-[11px] tabular-nums">
          <span className="font-semibold text-emerald-700 dark:text-emerald-400">
            Positive {pulseSummary.positivePct}%
          </span>
          <span className="text-slate-500">Neutral {pulseSummary.neutralPct}%</span>
          <span className="font-semibold text-amber-700 dark:text-amber-400">
            Watch {pulseSummary.concernPct}%
          </span>
        </div>

        {/* Trending Topic Quick Chips + Full Sentiment Hub Launch */}
        <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center gap-1 overflow-x-auto min-w-0">
            {pulseSummary.trendingTopics.slice(0, 3).map((t) => (
              <button
                key={t.tag}
                type="button"
                onClick={() => setQuery(query === t.tag ? '' : t.tag)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap shrink-0 border transition-colors ${
                  query === t.tag
                    ? 'bg-[#0D5C38] text-white border-[#0D5C38]'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                }`}
              >
                {t.tag}
              </button>
            ))}
          </div>
          <button
            type="button"
            data-testid="sidebar-open-full-hub-btn"
            onClick={() => {
              setActiveModule('voter-sentiment');
              if (window.innerWidth < 1280) onClose();
            }}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline whitespace-nowrap shrink-0"
          >
            Full Hub <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Channel Filter + Search + Category Chips */}
      <div className="px-4 py-3 border-b border-slate-200/90 dark:border-slate-800 space-y-2.5 shrink-0">
        {/* Source Channel Segmented Switcher */}
        <div className="grid grid-cols-4 gap-1 bg-slate-100/90 dark:bg-slate-900 p-1 rounded-lg border border-slate-200/70 dark:border-slate-800">
          {(
            [
              { id: 'all', label: 'All', count: pulseSummary.totalSignals },
              { id: 'social', label: 'Social', count: pulseSummary.channelCounts.social },
              { id: 'call-center', label: 'Calls', count: pulseSummary.channelCounts.callCenter },
              { id: 'field', label: 'Field', count: pulseSummary.channelCounts.field },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setChannel(tab.id)}
              data-testid={`sentiment-channel-${tab.id}`}
              className={`min-h-[32px] px-1.5 py-1 rounded-md text-[11px] font-semibold transition-colors whitespace-nowrap ${
                channel === tab.id
                  ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label} <span className="text-[10px] opacity-70">{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Search + LGA & Polarity Quick Filters */}
        <div className="space-y-1.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter LGA, #tag, or trend..."
              aria-label="Filter voter sentiment trends"
              data-testid="sentiment-search-input"
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
            />
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <select
              value={lgaFilter}
              onChange={(e) => setLgaFilter(e.target.value)}
              aria-label="Filter sidebar by Katsina LGA"
              data-testid="sentiment-lga-select"
              className="px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200"
            >
              <option value="All">All KT LGAs</option>
              {KATSINA_INEC_LGAS.map((lga) => (
                <option key={lga.id} value={lga.name}>
                  {lga.name}
                </option>
              ))}
            </select>
            <select
              value={polarity}
              onChange={(e) => setPolarity(e.target.value as 'all' | SentimentPolarity)}
              aria-label="Filter by sentiment polarity"
              data-testid="sentiment-polarity-select"
              className="px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200"
            >
              <option value="all">All Tone</option>
              <option value="positive">Positive</option>
              <option value="neutral">Neutral</option>
              <option value="concern">Watch</option>
            </select>
          </div>
        </div>

        {/* Horizontally Scrollable Category Filter Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {SENTIMENT_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              data-testid={`sentiment-cat-${cat.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
              className={`px-2.5 py-1 min-h-[28px] rounded-md text-[11px] font-medium whitespace-nowrap shrink-0 transition-colors border ${
                category === cat
                  ? 'bg-[#0D5C38] text-white border-[#0D5C38]'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Categorized Real-Time Trend Stream */}
      <div
        data-testid="sentiment-trend-stream"
        className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80"
      >
        {filteredTrends.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <Sparkles className="w-5 h-5 text-slate-400 mx-auto" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              No matching pulse trends
            </p>
            <button
              type="button"
              onClick={() => {
                setChannel('all');
                setCategory('All');
                setPolarity('all');
                setLgaFilter('All');
                setQuery('');
              }}
              className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
            >
              Reset sentiment filters
            </button>
          </div>
        ) : (
          filteredTrends.map((item) => {
            const ChannelIcon =
              item.channel === 'social'
                ? MessageSquare
                : item.channel === 'call-center'
                  ? Headphones
                  : Radio;

            const polarityStyles =
              item.polarity === 'positive'
                ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200/80 dark:border-emerald-800/70'
                : item.polarity === 'concern'
                  ? 'text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border-amber-200/80 dark:border-amber-800/70'
                  : 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700';

            return (
              <article
                key={item.id}
                data-testid="sentiment-trend-card"
                className="px-4 py-3.5 hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors space-y-2"
              >
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="inline-flex items-center gap-1.5 font-medium text-slate-500 dark:text-slate-400 min-w-0">
                    <ChannelIcon className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">{item.sourceLabel}</span>
                  </span>
                  <span className="text-[10px] text-slate-400 tabular-nums shrink-0">
                    {formatRelativeTime(item.timestamp)}
                  </span>
                </div>

                <h3 className="text-xs font-bold text-slate-950 dark:text-white leading-snug">
                  {item.headline}
                </h3>

                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
                  {item.summary}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                    <span className={`px-2 py-0.5 rounded font-semibold border ${polarityStyles}`}>
                      {item.polarity === 'positive'
                        ? 'Supportive'
                        : item.polarity === 'concern'
                          ? 'Watch'
                          : 'Neutral'}{' '}
                      · {item.score}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 font-medium">
                      {item.category}
                    </span>
                  </div>

                  <span className="text-[10px] font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                    +{item.velocityPct}% vol
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="tabular-nums truncate">
                    {item.location} · {item.mentions.toLocaleString()} mentions
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveModule(item.linkedModule);
                      if (window.innerWidth < 1280) onClose();
                    }}
                    className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline whitespace-nowrap shrink-0"
                  >
                    {item.actionable ? (
                      <>
                        <AlertCircle className="w-3 h-3 text-amber-600 dark:text-amber-400 mr-0.5" />
                        Respond
                      </>
                    ) : (
                      'Inspect'
                    )}
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );

  if (isDesktop) {
    return (
      <aside
        aria-label="Voter Sentiment Pulse Sidebar"
        className="w-[336px] shrink-0 sticky top-0 h-screen z-20"
      >
        {panelBody}
      </aside>
    );
  }

  return (
    <div
      data-testid="voter-sentiment-mobile-drawer"
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Voter Sentiment Pulse Drawer"
    >
      <button
        type="button"
        aria-label="Dismiss Voter Sentiment drawer"
        onClick={onClose}
        className="flex-1 bg-slate-950/60 backdrop-blur-xs"
      />
      <div className="w-full max-w-[380px] h-full shadow-2xl">{panelBody}</div>
    </div>
  );
};
