import test from 'node:test';
import assert from 'node:assert/strict';
import { DEMO_EC8A_RESULTS } from '../data/ec8aSeed';
import { aggregateEc8aCollation, validateEc8aSheet } from './ec8aCollation';

test('validateEc8aSheet flags over-voting when valid + rejected exceeds accredited voters', () => {
  const clean = validateEc8aSheet({
    accreditedVoters: 500,
    pdpVotes: 290,
    apcVotes: 120,
    adcVotes: 45,
    otherVotes: 10,
    rejectedVotes: 8,
  });
  assert.equal(clean.totalValidVotes, 465);
  assert.equal(clean.totalCastVotes, 473);
  assert.equal(clean.hasOverVoting, false);
  assert.equal(clean.overVotesBy, 0);
  assert.equal(clean.marginPdpOverApc, 170);

  const over = validateEc8aSheet({
    accreditedVoters: 400,
    pdpVotes: 250,
    apcVotes: 130,
    adcVotes: 25,
    otherVotes: 5,
    rejectedVotes: 6,
  });
  assert.equal(over.hasOverVoting, true);
  assert.equal(over.overVotesBy, 16);
});

test('aggregateEc8aCollation rolls up PU tallies, discrepancies, and >=25% LGA spread', () => {
  const agg = aggregateEc8aCollation(DEMO_EC8A_RESULTS);
  assert.equal(agg.sheetsCaptured, DEMO_EC8A_RESULTS.length);
  assert.ok(agg.verifiedSheets >= 1);
  assert.ok(agg.flaggedSheets >= 1);
  assert.ok(agg.pdpVotes > agg.apcVotes);
  assert.ok(agg.lgaBreakdown.length >= 6);
  assert.equal(
    agg.totalValidVotes,
    agg.pdpVotes + agg.apcVotes + agg.adcVotes + agg.otherVotes
  );
});
