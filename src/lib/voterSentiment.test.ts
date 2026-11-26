import test from 'node:test';
import assert from 'node:assert/strict';
import { DEMO_CALLS, DEMO_FIELD_REPORTS, DEMO_MEDIA_ITEMS } from '../data/demoSeed';
import {
  aggregateVoterSentiment,
  classifyTextSentiment,
  exportVoterSentimentCsv,
  filterSentimentTrends,
} from './voterSentiment';

test('classifyTextSentiment categorizes policy and concern signals deterministically', () => {
  const securitySignal = classifyTextSentiment(
    'Community peace and security intelligence support strongly endorsed in Funtua'
  );
  assert.equal(securitySignal.category, 'Security & Peace');
  assert.equal(securitySignal.polarity, 'positive');
  assert.ok(securitySignal.score >= 70);

  const rumorSignal = classifyTextSentiment(
    'Unverified rumor and logistics delay flagged for urgent clarification',
    { classification: 'Unverified Information', status: 'Escalated', priority: 'high' }
  );
  assert.equal(rumorSignal.category, 'Logistics & Rumor Control');
  assert.equal(rumorSignal.polarity, 'concern');
  assert.ok(rumorSignal.score < 46);
});

test('aggregateVoterSentiment merges live streams and computes zonal, timeline, and trending analytics', () => {
  const summary = aggregateVoterSentiment({
    calls: DEMO_CALLS,
    mediaItems: DEMO_MEDIA_ITEMS,
    fieldReports: DEMO_FIELD_REPORTS,
  });

  assert.ok(summary.totalSignals >= DEMO_CALLS.length + DEMO_MEDIA_ITEMS.length);
  assert.equal(summary.positivePct + summary.neutralPct + summary.concernPct, 100);
  assert.ok(summary.overallScore >= 1 && summary.overallScore <= 100);
  assert.equal(summary.channelCounts.callCenter, DEMO_CALLS.length);
  assert.ok(summary.channelCounts.social >= DEMO_MEDIA_ITEMS.length);
  assert.ok(summary.topCategories.length >= 3);
  assert.ok(summary.totalMentions > 5000);
  assert.ok(summary.actionableCount >= 2);

  // 3 Katsina Senatorial Zones must be populated
  assert.equal(summary.zonalBreakdown.length, 3);
  assert.deepEqual(
    summary.zonalBreakdown.map((z) => z.zone),
    ['Katsina South', 'Katsina Central', 'Katsina North']
  );
  assert.ok(summary.zonalBreakdown.every((z) => z.signalCount > 0));

  // 8-slot 24h timeline & trending topics
  assert.equal(summary.timeline.length, 8);
  assert.equal(summary.timeline[7].slot, 'Now');
  assert.ok(summary.trendingTopics.length >= 4);
  assert.ok(summary.trendingTopics[0].mentions >= summary.trendingTopics[1].mentions);
});

test('filterSentimentTrends supports LGA, Senatorial Zone, actionable, and watch-first sorting', () => {
  const summary = aggregateVoterSentiment({
    calls: DEMO_CALLS,
    mediaItems: DEMO_MEDIA_ITEMS,
    fieldReports: DEMO_FIELD_REPORTS,
  });

  const callOnly = filterSentimentTrends(summary.items, {
    channel: 'call-center',
    category: 'All',
    polarity: 'all',
    query: '',
  });
  assert.equal(callOnly.length, DEMO_CALLS.length);
  assert.ok(callOnly.every((i) => i.channel === 'call-center'));

  const southZone = filterSentimentTrends(summary.items, {
    channel: 'all',
    category: 'All',
    polarity: 'all',
    zone: 'Katsina South',
    query: '',
  });
  assert.ok(southZone.length >= 3);
  assert.ok(southZone.every((i) => i.zone === 'Katsina South'));

  const dauraLga = filterSentimentTrends(summary.items, {
    channel: 'all',
    category: 'All',
    polarity: 'all',
    lga: 'Daura',
    query: '',
  });
  assert.ok(dauraLga.length > 0);
  assert.ok(
    dauraLga.every((i) =>
      `${i.lgaName ?? ''} ${i.location} ${i.headline} ${i.summary}`.toLowerCase().includes('daura')
    )
  );

  const watchSorted = filterSentimentTrends(summary.items, {
    channel: 'all',
    category: 'All',
    polarity: 'all',
    query: '',
    sortBy: 'watch-first',
  });
  assert.equal(watchSorted[0].actionable, true);

  const mentionsSorted = filterSentimentTrends(summary.items, {
    channel: 'all',
    category: 'All',
    polarity: 'all',
    query: '',
    sortBy: 'mentions',
  });
  assert.ok(mentionsSorted[0].mentions >= mentionsSorted[mentionsSorted.length - 1].mentions);
});

test('exportVoterSentimentCsv produces valid RFC-4180 CSV rows', () => {
  const summary = aggregateVoterSentiment({
    calls: DEMO_CALLS,
    mediaItems: DEMO_MEDIA_ITEMS,
    fieldReports: DEMO_FIELD_REPORTS,
  });

  const csv = exportVoterSentimentCsv(summary.items.slice(0, 3));
  const lines = csv.split('\n');
  assert.equal(lines.length, 4);
  assert.ok(lines[0].startsWith('ID,Timestamp,Channel,Source,Category,Polarity,Score'));
});
