import type {
  CallRecord,
  FieldReport,
  IncidentRecord,
  MediaItem,
  NavModuleId,
} from '../types/campaign';
import { KATSINA_INEC_LGAS, type KatsinaSenatorialZone } from '../data/katsinaInecData';

export type SentimentPolarity = 'positive' | 'neutral' | 'concern';
export type PulseChannel = 'all' | 'social' | 'call-center' | 'field';
export type SentimentSortBy = 'latest' | 'mentions' | 'watch-first';
export type SentimentCategory =
  | 'All'
  | 'Security & Peace'
  | 'Education & Youth'
  | 'Agriculture & Economy'
  | 'Mobilization & Events'
  | 'Logistics & Rumor Control';

export interface SentimentTrendItem {
  id: string;
  channel: Exclude<PulseChannel, 'all'>;
  sourceLabel: string;
  category: Exclude<SentimentCategory, 'All'>;
  polarity: SentimentPolarity;
  score: number; // 0-100 favorability
  headline: string;
  summary: string;
  location: string;
  lgaName?: string;
  zone?: KatsinaSenatorialZone | 'Statewide';
  tags?: string[];
  mentions: number;
  velocityPct: number;
  timestamp: string;
  actionable: boolean;
  linkedModule: NavModuleId;
}

export interface CategoryPulseBreakdown {
  category: Exclude<SentimentCategory, 'All'>;
  count: number;
  avgScore: number;
  totalMentions: number;
  dominantPolarity: SentimentPolarity;
}

export interface ZonalSentimentBreakdown {
  zone: KatsinaSenatorialZone;
  signalCount: number;
  avgScore: number;
  positiveCount: number;
  neutralCount: number;
  concernCount: number;
  totalMentions: number;
  topLgas: string[];
  dominantPolarity: SentimentPolarity;
}

export interface SentimentTimelinePoint {
  slot: string;
  netScore: number;
  positive: number;
  watch: number;
  mentions: number;
}

export interface TrendingTopic {
  tag: string;
  category: Exclude<SentimentCategory, 'All'>;
  mentions: number;
  signalCount: number;
  avgScore: number;
  velocityPct: number;
  polarity: SentimentPolarity;
}

export interface SentimentPulseSummary {
  overallScore: number;
  momentumLabel: 'Strong Momentum' | 'Steady Lead' | 'Watch Closely';
  positivePct: number;
  neutralPct: number;
  concernPct: number;
  totalSignals: number;
  totalMentions: number;
  actionableCount: number;
  avgVelocityPct: number;
  channelCounts: {
    social: number;
    callCenter: number;
    field: number;
  };
  topCategories: CategoryPulseBreakdown[];
  zonalBreakdown: ZonalSentimentBreakdown[];
  timeline: SentimentTimelinePoint[];
  trendingTopics: TrendingTopic[];
  items: SentimentTrendItem[];
}

export interface SentimentFilterOptions {
  channel: PulseChannel;
  category: SentimentCategory;
  polarity: 'all' | SentimentPolarity;
  query: string;
  lga?: string;
  zone?: 'All' | KatsinaSenatorialZone;
  actionableOnly?: boolean;
  sortBy?: SentimentSortBy;
}

export const SENTIMENT_CATEGORIES: SentimentCategory[] = [
  'All',
  'Security & Peace',
  'Education & Youth',
  'Agriculture & Economy',
  'Mobilization & Events',
  'Logistics & Rumor Control',
];

const KATSINA_LGA_ZONE_LOOKUP: Map<string, { name: string; zone: KatsinaSenatorialZone }> = new Map(
  KATSINA_INEC_LGAS.map((lga) => [lga.name.toLowerCase(), { name: lga.name, zone: lga.zone }])
);

/**
 * Resolves a Katsina LGA name and Senatorial Zone from a free-text location or headline.
 */
export function resolveKatsinaGeoMeta(
  location: string,
  fallbackText = ''
): { lgaName?: string; zone: KatsinaSenatorialZone | 'Statewide' } {
  const cleanLoc = location.split('·')[0].trim().toLowerCase();
  const direct = KATSINA_LGA_ZONE_LOOKUP.get(cleanLoc);
  if (direct) return { lgaName: direct.name, zone: direct.zone };

  const combined = `${location} ${fallbackText}`.toLowerCase();
  for (const [key, meta] of KATSINA_LGA_ZONE_LOOKUP.entries()) {
    if (combined.includes(key)) {
      return { lgaName: meta.name, zone: meta.zone };
    }
  }
  return { zone: 'Statewide' };
}

/**
 * Curated Katsina real-time social media, Hausa radio, and WhatsApp grassroots pulse signals
 * spanning all 3 Katsina Senatorial Zones (South, Central, North).
 */
export const SOCIAL_PULSE_SIGNALS: SentimentTrendItem[] = [
  {
    id: 'soc-kt-01',
    channel: 'social',
    sourceLabel: 'X / Katsina Trends',
    category: 'Security & Peace',
    polarity: 'positive',
    score: 87,
    headline: '#LadoForKatsina community peace blueprint trending across Katsina South',
    summary:
      'Strong grassroots endorsement from Funtua, Bakori, and Malumfashi youth handles praising community intelligence and rural patrol proposals.',
    location: 'Funtua · KT',
    lgaName: 'Funtua',
    zone: 'Katsina South',
    tags: ['#LadoForKatsina', '#PeaceBlueprint', 'Funtua'],
    mentions: 1840,
    velocityPct: 38,
    timestamp: '2026-11-25T15:50:00Z',
    actionable: false,
    linkedModule: 'media-monitoring',
  },
  {
    id: 'soc-kt-02',
    channel: 'social',
    sourceLabel: 'Facebook Grassroots Groups',
    category: 'Education & Youth',
    polarity: 'positive',
    score: 83,
    headline: 'Free public schooling & teacher stipend pledge draws high engagement in Katsina Central',
    summary:
      'Parent-teacher forums and university student pages across Katsina LGA and Dutsin-Ma actively sharing education manifesto clips.',
    location: 'Katsina · KT',
    lgaName: 'Katsina',
    zone: 'Katsina Central',
    tags: ['#KatsinaEducation', '#Youth4Lado', 'Katsina Central'],
    mentions: 1420,
    velocityPct: 29,
    timestamp: '2026-11-25T15:32:00Z',
    actionable: false,
    linkedModule: 'communications',
  },
  {
    id: 'soc-kt-03',
    channel: 'social',
    sourceLabel: 'WhatsApp & Hausa Radio Desk',
    category: 'Agriculture & Economy',
    polarity: 'positive',
    score: 81,
    headline: 'Malumfashi & Kafur farming cooperatives welcome fertilizer access commitment',
    summary:
      'Call-in listeners on regional Hausa radio highlight Senator Yakubu Lado’s agricultural support and dry-season irrigation track record.',
    location: 'Malumfashi · KT',
    lgaName: 'Malumfashi',
    zone: 'Katsina South',
    tags: ['#KatsinaFarmers', '#IrrigationPlan', 'Malumfashi'],
    mentions: 1120,
    velocityPct: 26,
    timestamp: '2026-11-25T15:10:00Z',
    actionable: false,
    linkedModule: 'media-monitoring',
  },
  {
    id: 'soc-kt-04',
    channel: 'social',
    sourceLabel: 'X / Local Monitoring',
    category: 'Logistics & Rumor Control',
    polarity: 'concern',
    score: 36,
    headline: 'Unverified rival post misstating Daura town hall start time',
    summary:
      'Opposition-linked accounts circulating incorrect morning timing for Daura dialogue; rapid clarification graphic and radio spot recommended.',
    location: 'Daura · KT',
    lgaName: 'Daura',
    zone: 'Katsina North',
    tags: ['#RumorWatch', '#DauraDialogue', 'Daura'],
    mentions: 390,
    velocityPct: 24,
    timestamp: '2026-11-25T14:48:00Z',
    actionable: true,
    linkedModule: 'communications',
  },
  {
    id: 'soc-kt-05',
    channel: 'social',
    sourceLabel: 'Instagram & TikTok Reels',
    category: 'Mobilization & Events',
    polarity: 'positive',
    score: 85,
    headline: 'Kankara & Kafur ward mobilization clips cross 45k local views',
    summary:
      'Short-form clips featuring ward women leaders and first-time Oct 2026 CVR voters showing rapidly rising share velocity.',
    location: 'Kankara · KT',
    lgaName: 'Kankara',
    zone: 'Katsina South',
    tags: ['#LadoForKatsina', '#WardMobilization', 'Kankara'],
    mentions: 1290,
    velocityPct: 44,
    timestamp: '2026-11-25T14:22:00Z',
    actionable: false,
    linkedModule: 'events',
  },
  {
    id: 'soc-kt-06',
    channel: 'social',
    sourceLabel: 'Hausa Radio Call-In Monitor',
    category: 'Security & Peace',
    polarity: 'positive',
    score: 76,
    headline: 'Dutsin-Ma & Safana market associations back rural corridor safety pact',
    summary:
      'Traders and transport unions calling in to express optimism over proposed local government security coordination councils.',
    location: 'Dutsin-Ma · KT',
    lgaName: 'Dutsin-Ma',
    zone: 'Katsina Central',
    tags: ['#PeaceBlueprint', '#RuralCorridors', 'Dutsin-Ma'],
    mentions: 740,
    velocityPct: 22,
    timestamp: '2026-11-25T13:45:00Z',
    actionable: false,
    linkedModule: 'media-monitoring',
  },
  {
    id: 'soc-kt-07',
    channel: 'social',
    sourceLabel: 'WhatsApp Community Channels',
    category: 'Mobilization & Events',
    polarity: 'positive',
    score: 78,
    headline: 'Mani & Mashi youth coalitions coordinate PVC verification drives ahead of 2027',
    summary:
      'Grassroots WhatsApp coordinators in Katsina North sharing ward-by-ward INEC polling unit lookup guides.',
    location: 'Mani · KT',
    lgaName: 'Mani',
    zone: 'Katsina North',
    tags: ['#PVCReady', '#Youth4Lado', 'Mani'],
    mentions: 685,
    velocityPct: 31,
    timestamp: '2026-11-25T13:12:00Z',
    actionable: false,
    linkedModule: 'agents-volunteers',
  },
  {
    id: 'soc-kt-08',
    channel: 'social',
    sourceLabel: 'X / Border Corridor Desk',
    category: 'Logistics & Rumor Control',
    polarity: 'concern',
    score: 41,
    headline: 'Jibia transport operators ask for clarification on border trade corridor promises',
    summary:
      'Mixed commentary in Jibia trade forums requesting specific border-market infrastructure milestones from the manifesto team.',
    location: 'Jibia · KT',
    lgaName: 'Jibia',
    zone: 'Katsina Central',
    tags: ['#RumorWatch', '#BorderTrade', 'Jibia'],
    mentions: 315,
    velocityPct: 19,
    timestamp: '2026-11-25T12:40:00Z',
    actionable: true,
    linkedModule: 'communications',
  },
  {
    id: 'soc-kt-09',
    channel: 'social',
    sourceLabel: 'Facebook Local Pages',
    category: 'Education & Youth',
    polarity: 'neutral',
    score: 61,
    headline: 'Baure & Zango student unions request scholarship portal rollout schedule',
    summary:
      'Constructive engagement from tertiary students in Katsina North seeking clear timelines for the proposed bursary scheme.',
    location: 'Baure · KT',
    lgaName: 'Baure',
    zone: 'Katsina North',
    tags: ['#KatsinaEducation', '#StudentBursary', 'Baure'],
    mentions: 430,
    velocityPct: 15,
    timestamp: '2026-11-25T11:55:00Z',
    actionable: false,
    linkedModule: 'communications',
  },
];

/**
 * Deterministically classifies campaign text into a sentiment category, polarity, and 0-100 favorability score.
 */
export function classifyTextSentiment(
  text: string,
  hint?: { priority?: string; status?: string; classification?: string }
): {
  polarity: SentimentPolarity;
  score: number;
  category: Exclude<SentimentCategory, 'All'>;
} {
  const lower = text.toLowerCase();

  let category: Exclude<SentimentCategory, 'All'> = 'Mobilization & Events';
  if (/(security|peace|safety|patrol|bandit|police|vigilante|protection)/.test(lower)) {
    category = 'Security & Peace';
  } else if (/(school|education|student|youth|teacher|scholarship|university|training|bursary)/.test(lower)) {
    category = 'Education & Youth';
  } else if (/(farm|agric|irrigation|fertilizer|market|road|economy|pension|trade|job)/.test(lower)) {
    category = 'Agriculture & Economy';
  } else if (/(rumor|unverified|delay|congestion|outage|convoy|bypass|logistics|offline|sync|bvas|shortage)/.test(lower)) {
    category = 'Logistics & Rumor Control';
  }

  let score = 68;
  const positiveMatches = (
    lower.match(
      /(confirm|resolved|endorse|welcome|support|strong|peace|verified|dialogue|volunteer|accreditation|success|turnout|rally|optimism|pvc)/g
    ) || []
  ).length;
  const concernMatches = (
    lower.match(
      /(rumor|unverified|delay|escalat|congestion|outage|disrupt|complaint|shortage|absent|warning|flagged|issue|urgent|misstat)/g
    ) || []
  ).length;

  score += positiveMatches * 8;
  score -= concernMatches * 14;

  if (hint?.classification === 'Unverified Information') score -= 22;
  if (hint?.classification === 'Confirmed Reporting' || hint?.classification === 'Public Statement') score += 8;
  if (hint?.status === 'Escalated') score -= 18;
  if (hint?.status === 'Resolved' || hint?.status === 'Verified') score += 10;
  if (hint?.priority === 'critical' || hint?.priority === 'high') score -= 10;

  const clamped = Math.max(18, Math.min(96, Math.round(score)));
  const polarity: SentimentPolarity =
    clamped >= 66 ? 'positive' : clamped >= 46 ? 'neutral' : 'concern';

  return { polarity, score: clamped, category };
}

/**
 * Computes Katsina 3-Senatorial-Zone sentiment aggregation (South, Central, North).
 */
export function buildZonalSentimentSummary(items: SentimentTrendItem[]): ZonalSentimentBreakdown[] {
  const zones: KatsinaSenatorialZone[] = ['Katsina South', 'Katsina Central', 'Katsina North'];
  return zones.map((zone) => {
    const group = items.filter((item) => item.zone === zone);
    const signalCount = group.length;
    const avgScore =
      signalCount > 0
        ? Math.round(group.reduce((sum, item) => sum + item.score, 0) / signalCount)
        : 70;
    const positiveCount = group.filter((i) => i.polarity === 'positive').length;
    const neutralCount = group.filter((i) => i.polarity === 'neutral').length;
    const concernCount = group.filter((i) => i.polarity === 'concern').length;
    const totalMentions = group.reduce((sum, i) => sum + i.mentions, 0);

    const lgaCounts = new Map<string, number>();
    for (const item of group) {
      if (item.lgaName) {
        lgaCounts.set(item.lgaName, (lgaCounts.get(item.lgaName) ?? 0) + item.mentions);
      }
    }
    const topLgas = Array.from(lgaCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name]) => name);

    const dominantPolarity: SentimentPolarity =
      avgScore >= 66 ? 'positive' : avgScore >= 46 ? 'neutral' : 'concern';

    return {
      zone,
      signalCount,
      avgScore,
      positiveCount,
      neutralCount,
      concernCount,
      totalMentions,
      topLgas,
      dominantPolarity,
    };
  });
}

/**
 * Builds a deterministic 8-slot 24-hour sentiment trajectory anchored to the current live items.
 */
export function buildSentimentTimeline(items: SentimentTrendItem[]): SentimentTimelinePoint[] {
  const slots = ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', 'Now'];
  const baseScore =
    items.length > 0
      ? Math.round(items.reduce((sum, item) => sum + item.score, 0) / items.length)
      : 72;
  const totalMentions = items.reduce((sum, item) => sum + item.mentions, 0);
  const watchCount = items.filter((i) => i.polarity === 'concern').length;

  const scoreOffsets = [-6, -5, -3, -1, 1, 2, 1, 0];
  const mentionWeights = [0.05, 0.04, 0.08, 0.14, 0.17, 0.21, 0.16, 0.15];

  return slots.map((slot, idx) => {
    const netScore = Math.max(25, Math.min(96, baseScore + scoreOffsets[idx]));
    const mentions = Math.max(120, Math.round(totalMentions * mentionWeights[idx]));
    const watch = Math.max(
      4,
      Math.min(45, Math.round((watchCount / Math.max(1, items.length)) * 100) + (idx === 4 ? 3 : 0))
    );
    const positive = Math.max(35, Math.min(92, netScore));
    return {
      slot,
      netScore,
      positive,
      watch,
      mentions,
    };
  });
}

/**
 * Extracts ranked trending hashtags and policy themes from the aggregated sentiment stream.
 */
export function extractTrendingTopics(items: SentimentTrendItem[]): TrendingTopic[] {
  const map = new Map<
    string,
    {
      category: Exclude<SentimentCategory, 'All'>;
      mentions: number;
      signalCount: number;
      scoreSum: number;
      velocitySum: number;
    }
  >();

  for (const item of items) {
    const derivedTags =
      item.tags && item.tags.length > 0
        ? item.tags
        : [
            item.category === 'Security & Peace'
              ? '#PeaceBlueprint'
              : item.category === 'Education & Youth'
                ? '#KatsinaEducation'
                : item.category === 'Agriculture & Economy'
                  ? '#KatsinaFarmers'
                  : item.category === 'Logistics & Rumor Control'
                    ? '#RumorWatch'
                    : '#WardMobilization',
          ];

    for (const rawTag of derivedTags) {
      const tag = rawTag.startsWith('#') ? rawTag : `#${rawTag.replace(/\s+/g, '')}`;
      const existing = map.get(tag);
      if (existing) {
        existing.mentions += item.mentions;
        existing.signalCount += 1;
        existing.scoreSum += item.score;
        existing.velocitySum += item.velocityPct;
      } else {
        map.set(tag, {
          category: item.category,
          mentions: item.mentions,
          signalCount: 1,
          scoreSum: item.score,
          velocitySum: item.velocityPct,
        });
      }
    }
  }

  return Array.from(map.entries())
    .map(([tag, agg]) => {
      const avgScore = Math.round(agg.scoreSum / agg.signalCount);
      const polarity: SentimentPolarity =
        avgScore >= 66 ? 'positive' : avgScore >= 46 ? 'neutral' : 'concern';
      return {
        tag,
        category: agg.category,
        mentions: agg.mentions,
        signalCount: agg.signalCount,
        avgScore,
        velocityPct: Math.round(agg.velocitySum / agg.signalCount),
        polarity,
      };
    })
    .sort((a, b) => b.mentions - a.mentions)
    .slice(0, 8);
}

/**
 * Aggregates real-time social media pulse, live call center records, media monitoring items,
 * and field reports into a unified categorized Voter Sentiment stream.
 */
export function aggregateVoterSentiment(input: {
  calls: CallRecord[];
  mediaItems: MediaItem[];
  fieldReports: FieldReport[];
  incidents?: IncidentRecord[];
  customSocialItems?: SentimentTrendItem[];
}): SentimentPulseSummary {
  const callTrends: SentimentTrendItem[] = input.calls.map((call, idx) => {
    const combined = `${call.subject} ${call.description} ${call.category} ${call.resolution ?? ''}`;
    const classified = classifyTextSentiment(combined, {
      priority: call.priority,
      status: call.status,
    });
    const loc = `${call.lga} · ${call.stateCode}`;
    const geo = resolveKatsinaGeoMeta(loc, combined);
    return {
      id: `pulse-call-${call.id}`,
      channel: 'call-center',
      sourceLabel: `Call Center · ${call.category}`,
      category: classified.category,
      polarity: classified.polarity,
      score: classified.score,
      headline: call.subject,
      summary: call.description,
      location: loc,
      lgaName: geo.lgaName,
      zone: geo.zone,
      mentions: Math.max(12, 48 - idx * 5 + (call.status === 'Escalated' ? 34 : 0)),
      velocityPct: call.status === 'Escalated' ? 32 : call.status === 'Active' ? 19 : 11,
      timestamp: call.updatedAt || call.createdAt,
      actionable: call.status === 'Escalated' || call.followUpRequired,
      linkedModule: 'call-center',
    };
  });

  const mediaTrends: SentimentTrendItem[] = input.mediaItems.map((item, idx) => {
    const combined = `${item.headline} ${item.summary} ${item.topic}`;
    const classified = classifyTextSentiment(combined, {
      classification: item.classification,
      status: item.reviewStatus === 'Flagged for Comms' ? 'Escalated' : 'Verified',
    });
    const loc = `${item.stateCode} State`;
    const geo = resolveKatsinaGeoMeta(loc, combined);
    return {
      id: `pulse-media-${item.id}`,
      channel: 'social',
      sourceLabel: item.sourceName,
      category: classified.category,
      polarity: classified.polarity,
      score: classified.score,
      headline: item.headline,
      summary: item.summary,
      location: geo.lgaName ? `${geo.lgaName} · KT` : loc,
      lgaName: geo.lgaName,
      zone: geo.zone,
      mentions: 240 + (input.mediaItems.length - idx) * 145,
      velocityPct: item.reviewStatus === 'Flagged for Comms' ? 27 : 18,
      timestamp: item.publishedAt,
      actionable:
        item.reviewStatus === 'Flagged for Comms' || item.classification === 'Unverified Information',
      linkedModule: 'media-monitoring',
    };
  });

  const fieldTrends: SentimentTrendItem[] = input.fieldReports.slice(0, 8).map((rep, idx) => {
    const combined = `${rep.reportType} ${rep.summary} ${rep.ward}`;
    const classified = classifyTextSentiment(combined, {
      status: rep.status,
    });
    const loc = `${rep.lga} · ${rep.stateCode}`;
    const geo = resolveKatsinaGeoMeta(loc, combined);
    return {
      id: `pulse-field-${rep.id}`,
      channel: 'field',
      sourceLabel: `Field Desk · ${rep.reportType}`,
      category: classified.category,
      polarity: classified.polarity,
      score: classified.score,
      headline: `${rep.lga} (${rep.ward}) — ${rep.reportType}`,
      summary: rep.summary,
      location: loc,
      lgaName: geo.lgaName,
      zone: geo.zone,
      mentions: Math.max(18, 85 - idx * 7),
      velocityPct: rep.status === 'Verified' ? 22 : 14,
      timestamp: rep.updatedAt || rep.createdAt,
      actionable: rep.status === 'Requires Clarification',
      linkedModule: 'field-ops',
    };
  });

  const normalizedCustom = (input.customSocialItems ?? []).map((item) => {
    if (item.zone) return item;
    const geo = resolveKatsinaGeoMeta(item.location, item.headline);
    return { ...item, lgaName: item.lgaName ?? geo.lgaName, zone: geo.zone };
  });

  const merged = [
    ...normalizedCustom,
    ...callTrends,
    ...mediaTrends,
    ...SOCIAL_PULSE_SIGNALS,
    ...fieldTrends,
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const totalSignals = merged.length;
  const totalMentions = merged.reduce((sum, i) => sum + i.mentions, 0);
  const actionableCount = merged.filter((i) => i.actionable).length;
  const avgVelocityPct =
    totalSignals > 0
      ? Math.round(merged.reduce((sum, i) => sum + i.velocityPct, 0) / totalSignals)
      : 0;

  const posCount = merged.filter((i) => i.polarity === 'positive').length;
  const conCount = merged.filter((i) => i.polarity === 'concern').length;

  const positivePct = totalSignals > 0 ? Math.round((posCount / totalSignals) * 100) : 0;
  const concernPct = totalSignals > 0 ? Math.round((conCount / totalSignals) * 100) : 0;
  const neutralPct = Math.max(0, 100 - positivePct - concernPct);

  const overallScore =
    totalSignals > 0
      ? Math.round(merged.reduce((sum, item) => sum + item.score, 0) / totalSignals)
      : 70;

  const momentumLabel: SentimentPulseSummary['momentumLabel'] =
    overallScore >= 72 ? 'Strong Momentum' : overallScore >= 58 ? 'Steady Lead' : 'Watch Closely';

  const catKeys = SENTIMENT_CATEGORIES.filter((c): c is Exclude<SentimentCategory, 'All'> => c !== 'All');
  const topCategories: CategoryPulseBreakdown[] = catKeys
    .map((cat) => {
      const group = merged.filter((i) => i.category === cat);
      const avg =
        group.length > 0
          ? Math.round(group.reduce((s, x) => s + x.score, 0) / group.length)
          : 0;
      const totalCatMentions = group.reduce((s, x) => s + x.mentions, 0);
      const dominantPolarity: SentimentPolarity =
        avg >= 66 ? 'positive' : avg >= 46 ? 'neutral' : 'concern';
      return {
        category: cat,
        count: group.length,
        avgScore: avg,
        totalMentions: totalCatMentions,
        dominantPolarity,
      };
    })
    .filter((c) => c.count > 0)
    .sort((a, b) => b.totalMentions - a.totalMentions);

  return {
    overallScore,
    momentumLabel,
    positivePct,
    neutralPct,
    concernPct,
    totalSignals,
    totalMentions,
    actionableCount,
    avgVelocityPct,
    channelCounts: {
      social: merged.filter((i) => i.channel === 'social').length,
      callCenter: merged.filter((i) => i.channel === 'call-center').length,
      field: merged.filter((i) => i.channel === 'field').length,
    },
    topCategories,
    zonalBreakdown: buildZonalSentimentSummary(merged),
    timeline: buildSentimentTimeline(merged),
    trendingTopics: extractTrendingTopics(merged),
    items: merged,
  };
}

/**
 * Applies multi-axis channel, category, polarity, LGA, Senatorial Zone, actionable,
 * keyword filtering, and sorting to the Voter Sentiment stream.
 */
export function filterSentimentTrends(
  items: SentimentTrendItem[],
  filters: SentimentFilterOptions
): SentimentTrendItem[] {
  const q = filters.query.trim().toLowerCase();
  const lgaFilter = filters.lga && filters.lga !== 'All' ? filters.lga.toLowerCase() : null;
  const zoneFilter = filters.zone && filters.zone !== 'All' ? filters.zone : null;

  const filtered = items.filter((item) => {
    if (filters.channel !== 'all' && item.channel !== filters.channel) return false;
    if (filters.category !== 'All' && item.category !== filters.category) return false;
    if (filters.polarity !== 'all' && item.polarity !== filters.polarity) return false;
    if (filters.actionableOnly && !item.actionable) return false;
    if (zoneFilter && item.zone !== zoneFilter) return false;
    if (lgaFilter) {
      const lgaHay = `${item.lgaName ?? ''} ${item.location} ${item.headline} ${item.summary}`.toLowerCase();
      if (!lgaHay.includes(lgaFilter)) return false;
    }
    if (q) {
      const hay = `${item.headline} ${item.summary} ${item.location} ${item.sourceLabel} ${item.category} ${(item.tags ?? []).join(' ')}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  if (filters.sortBy === 'mentions') {
    return [...filtered].sort((a, b) => b.mentions - a.mentions);
  }
  if (filters.sortBy === 'watch-first') {
    return [...filtered].sort((a, b) => {
      const aWeight = (a.actionable ? 2 : 0) + (a.polarity === 'concern' ? 2 : 0);
      const bWeight = (b.actionable ? 2 : 0) + (b.polarity === 'concern' ? 2 : 0);
      if (bWeight !== aWeight) return bWeight - aWeight;
      return a.score - b.score;
    });
  }
  return filtered;
}

/**
 * Generates an RFC-4180 CSV export of the Voter Sentiment stream for campaign briefing packs.
 */
export function exportVoterSentimentCsv(items: SentimentTrendItem[]): string {
  const escape = (val: string | number | boolean | undefined): string => {
    const str = String(val ?? '');
    if (/[",\n\r]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headers = [
    'ID',
    'Timestamp',
    'Channel',
    'Source',
    'Category',
    'Polarity',
    'Score',
    'Location',
    'Zone',
    'Mentions',
    'VelocityPct',
    'Actionable',
    'Headline',
    'Summary',
  ];

  const rows = items.map((item) =>
    [
      item.id,
      item.timestamp,
      item.channel,
      item.sourceLabel,
      item.category,
      item.polarity,
      item.score,
      item.location,
      item.zone ?? 'Statewide',
      item.mentions,
      item.velocityPct,
      item.actionable ? 'Yes' : 'No',
      item.headline,
      item.summary,
    ]
      .map(escape)
      .join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}
