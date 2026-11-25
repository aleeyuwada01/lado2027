import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeCountdownBreakdown,
  KATSINA_GOVERNORSHIP_ELECTION_ISO,
  NIGERIA_PRESIDENTIAL_ELECTION_ISO,
  padTwo,
} from './electionCountdown';

test('computeCountdownBreakdown computes exact days/hours/minutes/seconds for Feb 6, 2027 Governorship Poll', () => {
  const sampleNow = Date.parse('2026-11-25T21:20:00+01:00');
  const result = computeCountdownBreakdown(KATSINA_GOVERNORSHIP_ELECTION_ISO, sampleNow);

  assert.equal(result.isReached, false);
  assert.equal(result.days, 72);
  assert.equal(result.hours, 11);
  assert.equal(result.minutes, 10);
  assert.equal(result.seconds, 0);

  const presidential = computeCountdownBreakdown(NIGERIA_PRESIDENTIAL_ELECTION_ISO, sampleNow);
  assert.equal(presidential.days, 51);
});

test('computeCountdownBreakdown clamps cleanly at zero when poll date arrives or passes', () => {
  const onTime = Date.parse(KATSINA_GOVERNORSHIP_ELECTION_ISO);
  const after = onTime + 3600 * 1000;

  const exact = computeCountdownBreakdown(KATSINA_GOVERNORSHIP_ELECTION_ISO, onTime);
  assert.equal(exact.isReached, true);
  assert.equal(exact.days, 0);
  assert.equal(exact.seconds, 0);

  const past = computeCountdownBreakdown(KATSINA_GOVERNORSHIP_ELECTION_ISO, after);
  assert.equal(past.isReached, true);
  assert.equal(past.totalMs, 0);
  assert.equal(padTwo(5), '05');
});
