import test from 'node:test';
import assert from 'node:assert/strict';
import { KATSINA_INEC_LGAS, KATSINA_INEC_META } from '../data/katsinaInecData';
import {
  buildKatsinaCorridorsGeoJson,
  buildKatsinaGeoJson,
  buildKatsinaZonePolygonsGeoJson,
  compareSimulations,
  createDefaultSimulationConfig,
  exportKatsinaSimulationCsv,
  runKatsinaSimulation,
} from './electionSimulator';

test('Katsina INEC dataset matches exact October 2026 official totals (34 LGAs, 361 wards, 6,652 PUs, 3,876,051 voters)', () => {
  assert.equal(KATSINA_INEC_LGAS.length, 34);

  const totalWards = KATSINA_INEC_LGAS.reduce((sum, lga) => sum + lga.wards.length, 0);
  const totalPus = KATSINA_INEC_LGAS.reduce((sum, lga) => sum + lga.pollingUnits, 0);
  const totalVoters = KATSINA_INEC_LGAS.reduce((sum, lga) => sum + lga.registeredVoters, 0);
  const totalVoters2023 = KATSINA_INEC_LGAS.reduce((sum, lga) => sum + lga.registeredVoters2023, 0);
  const totalCvr2026 = KATSINA_INEC_LGAS.reduce((sum, lga) => sum + lga.cvr2026NewVoters, 0);
  const totalPdp2023 = KATSINA_INEC_LGAS.reduce((sum, lga) => sum + lga.baseline2023PdpVotes, 0);
  const totalApc2023 = KATSINA_INEC_LGAS.reduce((sum, lga) => sum + lga.baseline2023ApcVotes, 0);

  assert.equal(totalWards, KATSINA_INEC_META.totalWards);
  assert.equal(totalPus, KATSINA_INEC_META.totalPollingUnits);
  assert.equal(totalVoters, 3876051);
  assert.equal(totalVoters, KATSINA_INEC_META.totalRegisteredVoters);
  assert.equal(totalVoters2023, 3516719);
  assert.equal(totalCvr2026, 359332);
  assert.equal(totalPdp2023, 486620);
  assert.equal(totalApc2023, 859892);
  assert.equal(KATSINA_INEC_META.nationalRank, 4);

  // Every LGA's wards must sum strictly to that LGA's exact polling units and October 2026 registered voters
  for (const lga of KATSINA_INEC_LGAS) {
    assert.equal(lga.wards.length, lga.wardCount, `${lga.name} ward count mismatch`);
    const wardPuSum = lga.wards.reduce((s, w) => s + w.pollingUnits, 0);
    const wardVoterSum = lga.wards.reduce((s, w) => s + w.registeredVoters, 0);
    assert.equal(wardPuSum, lga.pollingUnits, `${lga.name} ward PU sum mismatch`);
    assert.equal(wardVoterSum, lga.registeredVoters, `${lga.name} ward voter sum mismatch`);
  }
});

test('Default Lado Victory Path simulation delivers decisive PDP victory on October 2026 INEC register and meets 25% spread', () => {
  const config = createDefaultSimulationConfig('lado-victory');
  const result = runKatsinaSimulation(config);

  assert.equal(result.totalRegisteredVoters, 3876051);
  assert.equal(result.cvr2026NetAdditions, 359332);
  assert.equal(result.baseline2023PdpVotes, 486620);
  assert.equal(result.baseline2023ApcVotes, 859892);
  assert.equal(result.nationalRank, 4);
  assert.equal(result.totalWards, 361);
  assert.equal(result.totalPollingUnits, 6652);
  assert.equal(result.winningParty, 'PDP');
  assert.equal(result.ladoWins, true);
  assert.equal(result.meetsConstitutionalSpread, true);
  assert.ok(result.lgasMeeting25PctSpread >= 23);
  assert.ok(result.projectedValidVotes >= 3000000, `Expected 3M+ simulated votes, got ${result.projectedValidVotes}`);
  assert.ok(result.pdpVotes >= 1700000, `Expected 1.7M+ PDP votes, got ${result.pdpVotes}`);
  assert.ok(result.pdpVotes > result.apcVotes);
  assert.ok(result.pdpVotes > result.adcVotes);
  assert.ok(result.pdpGainVs2023 > 1200000);
  assert.ok(result.marginOverRunnerUp > 800000);

  // Party votes must sum strictly to total projected valid votes
  assert.equal(
    result.pdpVotes + result.apcVotes + result.adcVotes + result.othersVotes,
    result.projectedValidVotes
  );
});

test('Adjusting LGA ward targets and toggling individual wards recalculates votes deterministically', () => {
  const base = runKatsinaSimulation(createDefaultSimulationConfig('lado-victory'));

  const boostedConfig = createDefaultSimulationConfig('lado-victory');
  boostedConfig.lgaWardTargetOverrides['katsina'] = 12; // sweep all 12 wards in Katsina LGA
  const boosted = runKatsinaSimulation(boostedConfig);

  assert.equal(boosted.lgaById['katsina'].pdpWardsWon, 12);
  assert.ok(boosted.lgaById['katsina'].pdpVotes > base.lgaById['katsina'].pdpVotes);
  assert.ok(boosted.pdpVotes > base.pdpVotes);
  assert.equal(
    boosted.pdpVotes + boosted.apcVotes + boosted.adcVotes + boosted.othersVotes,
    boosted.projectedValidVotes
  );

  // Toggling an individual ward in Funtua to ADC updates ADC vote count cleanly
  const wardToggleConfig = createDefaultSimulationConfig('lado-victory');
  const firstFuntuaWardId = base.lgaById['funtua'].wards[0].ward.id;
  wardToggleConfig.wardWinnerOverrides[firstFuntuaWardId] = 'ADC';
  const toggled = runKatsinaSimulation(wardToggleConfig);

  assert.equal(toggled.lgaById['funtua'].wards[0].winner, 'ADC');
  assert.ok(toggled.lgaById['funtua'].adcVotes > base.lgaById['funtua'].adcVotes);
});

test('Mapbox GeoJSON generator outputs all 34 Katsina LGAs with valid coordinates and metrics', () => {
  const sim = runKatsinaSimulation(createDefaultSimulationConfig('lado-victory'));
  const geo = buildKatsinaGeoJson(sim);

  assert.equal(geo.type, 'FeatureCollection');
  assert.equal(geo.features.length, 34);
  for (const feat of geo.features) {
    const [lng, lat] = feat.geometry.coordinates;
    assert.ok(lng >= 6.8 && lng <= 9.0, `Unexpected Katsina longitude: ${lng}`);
    assert.ok(lat >= 11.0 && lat <= 13.4, `Unexpected Katsina latitude: ${lat}`);
    assert.ok(Number(feat.properties?.registeredVoters) > 0);
  }
});

test('Territory polygon and corridor GeoJSON builders produce valid Katsina state, zone, and spine geometries', () => {
  const sim = runKatsinaSimulation(createDefaultSimulationConfig('lado-victory'));
  const territories = buildKatsinaZonePolygonsGeoJson(sim);
  const corridors = buildKatsinaCorridorsGeoJson(sim);

  assert.equal(territories.type, 'FeatureCollection');
  assert.equal(territories.features.length, 4); // 1 state perimeter + 3 senatorial zones
  assert.equal(territories.features[0].properties.kind, 'state');
  for (const poly of territories.features) {
    assert.equal(poly.geometry.type, 'Polygon');
    const ring = poly.geometry.coordinates[0];
    assert.ok(ring.length >= 4, 'Polygon ring must be closed with at least 4 coordinates');
    assert.deepEqual(ring[0], ring[ring.length - 1], 'Polygon ring must close on first coordinate');
  }

  assert.equal(corridors.type, 'FeatureCollection');
  assert.equal(corridors.features.length, 4);
  for (const line of corridors.features) {
    assert.equal(line.geometry.type, 'LineString');
    assert.equal(line.geometry.coordinates.length, 2);
  }
});

test('Scenario comparison and CSV export produce accurate deltas and all 34 LGA rows', () => {
  const baseSim = runKatsinaSimulation(createDefaultSimulationConfig('lado-victory'));
  const sweepCfg = createDefaultSimulationConfig('lado-victory');
  sweepCfg.lgaWardTargetOverrides['katsina'] = 12;
  sweepCfg.lgaWardTargetOverrides['funtua'] = 11;
  const sweepSim = runKatsinaSimulation(sweepCfg);

  const delta = compareSimulations(sweepSim, baseSim);
  assert.ok(delta.pdpVotesDelta > 0);
  assert.ok(delta.marginDelta > 0);
  assert.ok(delta.pdpWardsDelta > 0);

  const csv = exportKatsinaSimulationCsv(baseSim);
  const lines = csv.trim().split('\n');
  assert.equal(lines.length, 35, 'CSV must have 1 header row + 34 LGA rows');
  assert.ok(lines[0].includes('INEC Registered Voters'));
  assert.ok(csv.includes('Katsina'));
  assert.ok(csv.includes('Funtua'));
});


