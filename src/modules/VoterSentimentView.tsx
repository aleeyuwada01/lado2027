import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  Download,
  Flame,
  Hash,
  Headphones,
  MapPin,
  MessageSquare,
  Plus,
  Radio,
  Search,
  ShieldAlert,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useCampaign } from '../context/CampaignContext';
import { KATSINA_INEC_LGAS, type KatsinaSenatorialZone } from '../data/katsinaInecData';
import {
  aggregateVoterSentiment,
  classifyTextSentiment,
  exportVoterSentimentCsv,
  filterSentimentTrends,
  SENTIMENT_CATEGORIES,
  type PulseChannel,
  type SentimentCategory,
  type SentimentPolarity,
  type SentimentSortBy,
  type SentimentTrendItem,
} from '../lib/voterSentiment';

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diffMs) || diffMs < 60_000) return 'Just now';
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export const VoterSentimentView: React.FC = () => {
  const {
    calls,
    mediaItems,
    fieldReports,
    incidents,
    createIncident,
    setActiveModule,
    currentUser,
  } = useCampaign();

  const [channel, setChannel] = useState<PulseChannel>('all');
  const [category, setCategory] = useState<SentimentCategory>('All');
  const [polarity, setPolarity] = useState<'all' | SentimentPolarity>('all');
  const [selectedLga, setSelectedLga] = useState<string>('All');
  const [selectedZone, setSelectedZone] = useState<'All' | KatsinaSenatorialZone>('All');
  const [actionableOnly, setActionableOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<SentimentSortBy>('latest');
  const [query, setQuery] = useState<string>('');

  const [customItems, setCustomItems] = useState<SentimentTrendItem[]>([]);
  const [escalatedIds, setEscalatedIds] = useState<Record<string, boolean>>({});
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Inline composer state
  const [composerOpen, setComposerOpen] = useState<boolean>(false);
  const [draftChannel, setDraftChannel] = useState<'social' | 'call-center' | 'field'>('social');
  const [draftLga, setDraftLga] = useState<string>('Katsina');
  const [draftHeadline, setDraftHeadline] = useState<string>('');
  const [draftSummary, setDraftSummary] = useState<string>('');

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

  const filteredTrends = useMemo(
    () =>
      filterSentimentTrends(pulseSummary.items, {
        channel,
        category,
        polarity,
        query,
        lga: selectedLga,
        zone: selectedZone,
        actionableOnly,
        sortBy,
      }),
    [
      pulseSummary.items,
      channel,
      category,
      polarity,
      query,
      selectedLga,
      selectedZone,
      actionableOnly,
      sortBy,
    ]
  );

  const watchQueue = useMemo(
    () =>
      pulseSummary.items
        .filter((i) => i.actionable || i.polarity === 'concern')
        .slice(0, 5),
    [pulseSummary.items]
  );

  const showToast = (msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => setToastMsg(null), 3500);
  };

  const handlePublishPulse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftHeadline.trim()) return;
    const combined = `${draftHeadline} ${draftSummary}`;
    const classified = classifyTextSentiment(combined);
    const lgaMeta = KATSINA_INEC_LGAS.find((l) => l.name === draftLga);
    const created: SentimentTrendItem = {
      id: `hub-pulse-${Date.now()}`,
      channel: draftChannel,
      sourceLabel:
        draftChannel === 'social'
          ? 'Social & Radio Desk'
          : draftChannel === 'call-center'
            ? 'Call Center Pulse Desk'
            : 'Field Sentiment Desk',
      category: classified.category,
      polarity: classified.polarity,
      score: classified.score,
      headline: draftHeadline.trim(),
      summary:
        draftSummary.trim() ||
        `Logged via Voter Sentiment Intelligence Hub for ${draftLga} LGA (${lgaMeta?.zone ?? 'Katsina'}).`,
      location: `${draftLga} · KT`,
      lgaName: draftLga,
      zone: lgaMeta?.zone ?? 'Statewide',
      tags: [`#${draftLga.replace(/\s+/g, '')}`, '#KatsinaPulse'],
      mentions: draftChannel === 'social' ? 320 : draftChannel === 'call-center' ? 42 : 65,
      velocityPct: 28,
      timestamp: new Date().toISOString(),
      actionable: classified.polarity === 'concern',
      linkedModule:
        draftChannel === 'social'
          ? 'media-monitoring'
          : draftChannel === 'call-center'
            ? 'call-center'
            : 'field-ops',
    };
    setCustomItems((prev) => [created, ...prev]);
    setDraftHeadline('');
    setDraftSummary('');
    setComposerOpen(false);
    showToast(`Published live sentiment signal for ${draftLga} LGA.`);
  };

  const handleEscalateToIncident = (item: SentimentTrendItem) => {
    if (escalatedIds[item.id]) return;
    createIncident({
      title: `Sentiment Escalation: ${item.headline}`,
      category: item.category === 'Security & Peace' ? 'Safety concern' : 'Operational issue',
      severity: item.score < 42 ? 'high' : 'medium',
      status: 'New',
      verificationStatus: 'Unverified Report',
      stateCode: 'KT',
      lga: item.lgaName ?? 'Katsina',
      ward: 'Multiple Wards',
      reporterName: currentUser.displayName,
      reporterUid: currentUser.uid,
      assignedTeam: 'Situation Room Rapid Response',
      assignedSupervisor: 'Situation Room Director',
      description: `${item.summary} [Source: ${item.sourceLabel} · Score: ${item.score}/100 · ${item.mentions} mentions]`,
      isDemo: false,
    });
    setEscalatedIds((prev) => ({ ...prev, [item.id]: true }));
    showToast(`Escalated "${item.headline.slice(0, 48)}..." to Incident Management.`);
  };

  const handleExportCsv = () => {
    const csv = exportVoterSentimentCsv(filteredTrends);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `katsina-voter-sentiment-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${filteredTrends.length} voter sentiment signals to CSV.`);
  };

  const resetAllFilters = () => {
    setChannel('all');
    setCategory('All');
    setPolarity('all');
    setSelectedLga('All');
    setSelectedZone('All');
    setActionableOnly(false);
    setSortBy('latest');
    setQuery('');
  };

  return (
    <div data-testid="voter-sentiment-hub" className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 whitespace-nowrap shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              Live Katsina Pulse
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Social · Hausa Radio · WhatsApp · Call Center · Field Desks
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-950 dark:text-white mt-1 font-display">
            Voter Sentiment Intelligence Hub
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time public mood tracking across all 3 Katsina Senatorial Zones, trending policy themes, and rapid-response rumor escalation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            data-testid="hub-export-sentiment-csv"
            className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[38px] text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => setComposerOpen((v) => !v)}
            data-testid="hub-add-pulse-btn"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] text-xs font-semibold text-white bg-[#0D5C38] hover:bg-[#09452A] rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Log Sentiment Signal
          </button>
        </div>
      </div>

      {/* Live Toast Feedback */}
      {toastMsg && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs font-medium text-emerald-900 dark:text-emerald-200"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            {toastMsg}
          </span>
          <button
            type="button"
            onClick={() => setToastMsg(null)}
            className="text-[11px] font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Inline Signal Composer */}
      {composerOpen && (
        <form
          onSubmit={handlePublishPulse}
          data-testid="hub-composer-form"
          className="bg-white dark:bg-[#0F172A] border border-emerald-200 dark:border-emerald-800/70 rounded-xl p-5 space-y-4 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-950 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Publish Live Voter Sentiment Signal
            </h3>
            <button
              type="button"
              onClick={() => setComposerOpen(false)}
              className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white"
            >
              Cancel
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="hub-channel" className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Channel Source
              </label>
              <select
                id="hub-channel"
                value={draftChannel}
                onChange={(e) => setDraftChannel(e.target.value as 'social' | 'call-center' | 'field')}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              >
                <option value="social">Social / Radio / WhatsApp</option>
                <option value="call-center">Inbound Call Center</option>
                <option value="field">Field Coordinator Desk</option>
              </select>
            </div>
            <div>
              <label htmlFor="hub-lga" className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Katsina Local Government
              </label>
              <select
                id="hub-lga"
                value={draftLga}
                onChange={(e) => setDraftLga(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              >
                {KATSINA_INEC_LGAS.map((lga) => (
                  <option key={lga.id} value={lga.name}>
                    {lga.name} ({lga.zone})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="hub-headline" className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Trend Headline *
              </label>
              <input
                id="hub-headline"
                type="text"
                required
                value={draftHeadline}
                onChange={(e) => setDraftHeadline(e.target.value)}
                placeholder="e.g., Malumfashi traders endorse agriculture manifesto..."
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label htmlFor="hub-summary" className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Context / Field Summary (Optional)
            </label>
            <input
              id="hub-summary"
              type="text"
              value={draftSummary}
              onChange={(e) => setDraftSummary(e.target.value)}
              placeholder="Add radio station, social group, or caller volume context..."
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-[#0D5C38] hover:bg-[#09452A] rounded-lg"
            >
              Publish Signal Now
            </button>
          </div>
        </form>
      )}

      {/* Executive KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200/90 dark:border-slate-800 rounded-xl p-3.5 sm:p-4 space-y-1.5">
          <div className="flex items-center justify-between gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            <span className="leading-tight">Katsina Favorability</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
            <div className="inline-flex items-baseline gap-1 whitespace-nowrap">
              <span
                data-testid="hub-overall-score"
                className="text-2xl sm:text-3xl font-bold tabular-nums text-slate-950 dark:text-white font-display"
              >
                {pulseSummary.overallScore}
              </span>
              <span className="text-xs text-slate-400">/ 100</span>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
              {pulseSummary.momentumLabel}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800">
            <div style={{ width: `${pulseSummary.positivePct}%` }} className="bg-emerald-500" />
            <div style={{ width: `${pulseSummary.neutralPct}%` }} className="bg-slate-400" />
            <div style={{ width: `${pulseSummary.concernPct}%` }} className="bg-amber-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#0F172A] border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400">
            <span>Tracked Mentions (24h)</span>
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold tabular-nums text-slate-950 dark:text-white font-display">
            {pulseSummary.totalMentions.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
            Across {pulseSummary.totalSignals} verified pulse signals
          </div>
        </div>

        <div className="bg-white dark:bg-[#0F172A] border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400">
            <span>Avg Signal Velocity</span>
            <Flame className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400 font-display">
            +{pulseSummary.avgVelocityPct}%
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
            Positive {pulseSummary.positivePct}% · Neutral {pulseSummary.neutralPct}%
          </div>
        </div>

        <div className="bg-white dark:bg-[#0F172A] border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400">
            <span>Watch & Rapid Response</span>
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold tabular-nums text-amber-700 dark:text-amber-400 font-display">
            {pulseSummary.actionableCount}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Active alerts ready for comms or escalation
          </div>
        </div>
      </div>

      {/* Katsina 3-Senatorial-Zone Sentiment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {pulseSummary.zonalBreakdown.map((z) => {
          const isSelected = selectedZone === z.zone;
          return (
            <button
              key={z.zone}
              type="button"
              onClick={() => setSelectedZone(isSelected ? 'All' : z.zone)}
              data-testid={`zone-sentiment-card-${z.zone.toLowerCase().replace(/\s+/g, '-')}`}
              className={`text-left p-4 rounded-xl border transition-all space-y-2.5 ${
                isSelected
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500/40'
                  : 'bg-white dark:bg-[#0F172A] border-slate-200/90 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-800'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-950 dark:text-white flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  {z.zone}
                </span>
                <span className="text-lg font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                  {z.avgScore}
                  <span className="text-[11px] font-normal text-slate-400">/100</span>
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                <span>{z.signalCount} live signals</span>
                <span>{z.totalMentions.toLocaleString()} mentions</span>
              </div>
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80 text-[11px]">
                <span className="text-slate-600 dark:text-slate-300 truncate">
                  Active: {z.topLgas.length > 0 ? z.topLgas.join(', ') : 'Statewide'}
                </span>
                <span className="shrink-0 font-semibold text-emerald-700 dark:text-emerald-400">
                  {isSelected ? 'Filtered ✓' : 'Filter zone'}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Analytics Row: 24h Trajectory Chart + Category Favorability Chart */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-7 bg-white dark:bg-[#0F172A] border border-slate-200/90 dark:border-slate-800 rounded-xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-950 dark:text-white">
                24-Hour Sentiment Trajectory
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Net Favorability Index vs Watch Alert share across Katsina channels
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" /> Favorability
              </span>
              <span className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-medium">
                <span className="w-2.5 h-2.5 rounded-xs bg-amber-500" /> Watch %
              </span>
            </div>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={pulseSummary.timeline} margin={{ top: 6, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="sentimentFavGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.32} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="sentimentWatchGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#94A3B8" opacity={0.18} />
                <XAxis dataKey="slot" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    border: '1px solid #1E293B',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#F8FAFC',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="netScore"
                  name="Favorability Index"
                  stroke="#059669"
                  strokeWidth={2.5}
                  fill="url(#sentimentFavGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="watch"
                  name="Watch Share %"
                  stroke="#D97706"
                  strokeWidth={2}
                  fill="url(#sentimentWatchGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="xl:col-span-5 bg-white dark:bg-[#0F172A] border border-slate-200/90 dark:border-slate-800 rounded-xl p-5">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-950 dark:text-white">
              Favorability by Policy Issue
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Average voter sentiment score (0–100) by categorized topic
            </p>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={pulseSummary.topCategories}
                layout="vertical"
                margin={{ top: 2, right: 16, left: 6, bottom: 2 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#94A3B8" opacity={0.18} horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="category"
                  width={108}
                  tick={{ fontSize: 10, fill: '#64748B' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    border: '1px solid #1E293B',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#F8FAFC',
                  }}
                />
                <Bar dataKey="avgScore" name="Avg Favorability" radius={[0, 6, 6, 0]} barSize={18}>
                  {pulseSummary.topCategories.map((entry) => (
                    <Cell
                      key={entry.category}
                      fill={
                        entry.dominantPolarity === 'positive'
                          ? '#0D5C38'
                          : entry.dominantPolarity === 'concern'
                            ? '#D97706'
                            : '#64748B'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Trending Hashtags & Topics Strip */}
      <div className="bg-white dark:bg-[#0F172A] border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5 text-emerald-600" />
            Trending Katsina Narratives & Hashtags
          </h3>
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
            >
              Clear topic filter
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {pulseSummary.trendingTopics.map((topic) => {
            const active = query.toLowerCase() === topic.tag.toLowerCase();
            return (
              <button
                key={topic.tag}
                type="button"
                onClick={() => setQuery(active ? '' : topic.tag)}
                data-testid={`trending-topic-${topic.tag.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}`}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                  active
                    ? 'bg-[#0D5C38] text-white border-[#0D5C38]'
                    : 'bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                }`}
              >
                <span className="font-semibold">{topic.tag}</span>
                <span
                  className={`text-[10px] font-mono tabular-nums ${
                    active ? 'text-emerald-100' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {topic.mentions.toLocaleString()}
                </span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    topic.polarity === 'positive'
                      ? 'bg-emerald-500'
                      : topic.polarity === 'concern'
                        ? 'bg-amber-500'
                        : 'bg-slate-400'
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Split: Filtered Live Stream (8 cols) + Rapid-Response Watch Queue (4 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* Left: Full Multi-Axis Filtered Sentiment Stream */}
        <div className="xl:col-span-8 bg-white dark:bg-[#0F172A] border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden">
          {/* Stream Filter Bar */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3 bg-slate-50/70 dark:bg-[#0B1120]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="grid grid-cols-2 sm:inline-flex w-full sm:w-auto items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
                {(
                  [
                    { id: 'all', label: 'All', count: pulseSummary.totalSignals },
                    { id: 'social', label: 'Social & Radio', count: pulseSummary.channelCounts.social },
                    { id: 'call-center', label: 'Call Center', count: pulseSummary.channelCounts.callCenter },
                    { id: 'field', label: 'Field', count: pulseSummary.channelCounts.field },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setChannel(tab.id)}
                    className={`px-2.5 py-2 sm:py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap text-center ${
                      channel === tab.id
                        ? 'bg-[#0D5C38] text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                    }`}
                  >
                    {tab.label} <span className="opacity-75 text-[11px]">{tab.count}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="tabular-nums font-medium">
                  Showing {filteredTrends.length} of {pulseSummary.totalSignals}
                </span>
                {(channel !== 'all' ||
                  category !== 'All' ||
                  polarity !== 'all' ||
                  selectedLga !== 'All' ||
                  selectedZone !== 'All' ||
                  actionableOnly ||
                  query) && (
                  <button
                    type="button"
                    onClick={resetAllFilters}
                    className="font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search keyword or #tag..."
                  aria-label="Search voter sentiment hub"
                  data-testid="hub-search-input"
                  className="w-full pl-8 pr-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <select
                value={selectedLga}
                onChange={(e) => setSelectedLga(e.target.value)}
                aria-label="Filter by Katsina LGA"
                data-testid="hub-lga-filter"
                className="px-2.5 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
              >
                <option value="All">All 34 Katsina LGAs</option>
                {KATSINA_INEC_LGAS.map((lga) => (
                  <option key={lga.id} value={lga.name}>
                    {lga.name} ({lga.zone.replace('Katsina ', '')})
                  </option>
                ))}
              </select>

              <select
                value={polarity}
                onChange={(e) => setPolarity(e.target.value as 'all' | SentimentPolarity)}
                aria-label="Filter by polarity"
                className="px-2.5 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
              >
                <option value="all">All Sentiment Tones</option>
                <option value="positive">Supportive (66+)</option>
                <option value="neutral">Neutral (46–65)</option>
                <option value="concern">Watch / Concern (&lt;46)</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SentimentSortBy)}
                aria-label="Sort sentiment stream"
                className="px-2.5 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
              >
                <option value="latest">Sort: Most Recent</option>
                <option value="mentions">Sort: Highest Mentions</option>
                <option value="watch-first">Sort: Watch Priority First</option>
              </select>
            </div>

            {/* Category Filter Chips + Watch-Only Toggle */}
            <div className="flex flex-wrap items-center gap-1.5">
              {SENTIMENT_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                    category === cat
                      ? 'bg-[#0D5C38] text-white border-[#0D5C38]'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setActionableOnly((v) => !v)}
                className={`ml-auto px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors ${
                  actionableOnly
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/70'
                }`}
              >
                Actionable Only
              </button>
            </div>
          </div>

          {/* Stream Items */}
          <div data-testid="hub-sentiment-stream" className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredTrends.length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <Activity className="w-6 h-6 text-slate-400 mx-auto" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  No voter sentiment signals match these filters
                </p>
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                >
                  Reset all filters
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

                const polarityBadge =
                  item.polarity === 'positive'
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/70'
                    : item.polarity === 'concern'
                      ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/70'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700';

                const isEscalated = Boolean(escalatedIds[item.id]);

                return (
                  <article
                    key={item.id}
                    data-testid="hub-sentiment-card"
                    className="p-4 sm:p-5 hover:bg-slate-50/70 dark:hover:bg-slate-900/40 transition-colors space-y-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 min-w-0">
                        <ChannelIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-medium truncate">{item.sourceLabel}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {item.location}
                        </span>
                        {item.zone && item.zone !== 'Statewide' && (
                          <span className="hidden sm:inline text-[11px] text-slate-400">
                            ({item.zone})
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 tabular-nums shrink-0">
                        {formatRelativeTime(item.timestamp)}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-950 dark:text-white leading-snug">
                      {item.headline}
                    </h4>

                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {item.summary}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className={`px-2 py-0.5 rounded font-semibold border ${polarityBadge}`}>
                          {item.polarity === 'positive'
                            ? 'Supportive'
                            : item.polarity === 'concern'
                              ? 'Watch Alert'
                              : 'Neutral'}{' '}
                          · {item.score}/100
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                          {item.category}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 tabular-nums ml-1">
                          {item.mentions.toLocaleString()} mentions ·{' '}
                          <strong className="text-emerald-700 dark:text-emerald-400">
                            +{item.velocityPct}%
                          </strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {(item.actionable || item.polarity === 'concern') && (
                          <button
                            type="button"
                            disabled={isEscalated}
                            onClick={() => handleEscalateToIncident(item)}
                            data-testid={`escalate-btn-${item.id}`}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors ${
                              isEscalated
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 cursor-default'
                                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-950/70'
                            }`}
                          >
                            {isEscalated ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" /> Escalated
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-3 h-3" /> Escalate to Incident
                              </>
                            )}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setActiveModule(item.linkedModule)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/70 hover:bg-emerald-100/80 transition-colors"
                        >
                          Open Desk <ArrowUpRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Rapid-Response Watch Queue */}
        <aside className="xl:col-span-4 space-y-4">
          <div className="bg-white dark:bg-[#0F172A] border border-amber-200/90 dark:border-amber-900/50 rounded-xl overflow-hidden">
            <div className="px-4 py-3.5 bg-amber-50/80 dark:bg-amber-950/30 border-b border-amber-200/80 dark:border-amber-900/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                <h3 className="text-xs font-bold text-amber-950 dark:text-amber-200">
                  Rapid-Response Watch Queue
                </h3>
              </div>
              <span className="text-[11px] font-mono font-bold text-amber-800 dark:text-amber-300">
                {watchQueue.length} active
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {watchQueue.map((item) => {
                const isEscalated = Boolean(escalatedIds[item.id]);
                return (
                  <div key={item.id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {item.location}
                      </span>
                      <span className="font-mono text-amber-700 dark:text-amber-400 font-semibold">
                        Score {item.score}/100
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-950 dark:text-white leading-snug">
                      {item.headline}
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">
                      {item.summary}
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        disabled={isEscalated}
                        onClick={() => handleEscalateToIncident(item)}
                        className={`flex-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
                          isEscalated
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-amber-600 hover:bg-amber-700 text-white'
                        }`}
                      >
                        {isEscalated ? 'Incident Logged ✓' : 'Escalate to Incident'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveModule('communications')}
                        className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        Draft Comms
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white dark:bg-[#0F172A] border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 space-y-2.5">
            <h3 className="text-xs font-bold text-slate-950 dark:text-white">
              Channel Mix Overview
            </h3>
            <div className="space-y-2 text-xs">
              {[
                {
                  label: 'Social Media, Radio & WhatsApp',
                  count: pulseSummary.channelCounts.social,
                  color: 'bg-emerald-600',
                },
                {
                  label: 'Inbound Call Center Logs',
                  count: pulseSummary.channelCounts.callCenter,
                  color: 'bg-sky-600',
                },
                {
                  label: 'Field Coordinator Reports',
                  count: pulseSummary.channelCounts.field,
                  color: 'bg-amber-600',
                },
              ].map((row) => {
                const pct =
                  pulseSummary.totalSignals > 0
                    ? Math.round((row.count / pulseSummary.totalSignals) * 100)
                    : 0;
                return (
                  <div key={row.label} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-600 dark:text-slate-300">{row.label}</span>
                      <span className="font-mono font-semibold text-slate-900 dark:text-white">
                        {row.count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div style={{ width: `${pct}%` }} className={`h-full ${row.color}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
