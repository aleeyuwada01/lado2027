import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEMO_CABINET_PORTFOLIOS,
  DEMO_GOVERNANCE_IDEAS,
  DEMO_HANDOVER_AUDITS,
  DEMO_TRANSITION_ACTIONS,
} from '../data/postElectionSeed';
import {
  computeTransitionReadiness,
  exportTransitionBriefingCsv,
  filterGovernanceIdeas,
  filterTransitionActions,
  promoteIdeaToActionItem,
} from './postElection';

test('computeTransitionReadiness calculates accurate counts and bounded readiness score', () => {
  const summary = computeTransitionReadiness({
    actions: DEMO_TRANSITION_ACTIONS,
    ideas: DEMO_GOVERNANCE_IDEAS,
    cabinet: DEMO_CABINET_PORTFOLIOS,
    audits: DEMO_HANDOVER_AUDITS,
  });

  assert.equal(summary.totalActions, DEMO_TRANSITION_ACTIONS.length);
  assert.equal(summary.totalIdeas, DEMO_GOVERNANCE_IDEAS.length);
  assert.equal(summary.cabinetTotal, DEMO_CABINET_PORTFOLIOS.length);
  assert.equal(summary.auditsTotal, DEMO_HANDOVER_AUDITS.length);
  assert.ok(summary.completedActions >= 1);
  assert.ok(summary.day1To30Count >= 2);
  assert.ok(summary.overallReadinessScore >= 0 && summary.overallReadinessScore <= 100);
});

test('filterTransitionActions and filterGovernanceIdeas support sector, window, search, and sorting', () => {
  const day1To30 = filterTransitionActions(DEMO_TRANSITION_ACTIONS, {
    windowFilter: 'Days 1–30',
  });
  assert.ok(day1To30.length > 0);
  assert.ok(day1To30.every((a) => a.window === 'Days 1–30'));

  const rimiIdeas = filterGovernanceIdeas(DEMO_GOVERNANCE_IDEAS, {
    sectorFilter: 'Clean Energy & Rimi Wind',
    searchQuery: 'Rimi',
  });
  assert.equal(rimiIdeas.length, 1);
  assert.match(rimiIdeas[0].title, /Rimi Wind/i);

  const sortedByUpvotes = filterGovernanceIdeas(DEMO_GOVERNANCE_IDEAS, { sortBy: 'upvotes' });
  for (let i = 1; i < sortedByUpvotes.length; i += 1) {
    assert.ok(sortedByUpvotes[i - 1].upvotes >= sortedByUpvotes[i].upvotes);
  }
});

test('promoteIdeaToActionItem creates a structured action plan item with checklist deliverables', () => {
  const targetIdea = DEMO_GOVERNANCE_IDEAS.find((i) => i.id === 'idea-03');
  assert.ok(targetIdea);
  const promoted = promoteIdeaToActionItem(targetIdea);

  assert.equal(promoted.title, targetIdea.title);
  assert.equal(promoted.sector, targetIdea.sector);
  assert.equal(promoted.window, targetIdea.estimatedTimeline);
  assert.equal(promoted.sourceIdeaId, targetIdea.id);
  assert.equal(promoted.status, 'Planned');
  assert.equal(promoted.deliverables.length, 3);
  assert.ok(promoted.leadOffice.includes('Bureau for Artificial Intelligence'));
});

test('exportTransitionBriefingCsv outputs properly escaped RFC-4180 CSV containing all transition tracks', () => {
  const csv = exportTransitionBriefingCsv({
    actions: DEMO_TRANSITION_ACTIONS.slice(0, 1),
    ideas: DEMO_GOVERNANCE_IDEAS.slice(0, 1),
    cabinet: DEMO_CABINET_PORTFOLIOS.slice(0, 1),
    audits: DEMO_HANDOVER_AUDITS.slice(0, 1),
  });

  const lines = csv.split('\n');
  assert.equal(lines.length, 5); // header + 4 rows
  assert.match(lines[0], /^RecordType,TitleOrPortfolio,/);
  assert.ok(lines[1].startsWith('100-Day Action,'));
  assert.ok(lines[2].startsWith('Governance Idea,'));
  assert.ok(lines[3].startsWith('Cabinet Portfolio,'));
  assert.ok(lines[4].startsWith('Handover Audit,'));
});
