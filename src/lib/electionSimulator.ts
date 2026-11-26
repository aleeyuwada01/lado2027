import {
  KATSINA_INEC_LGAS,
  KATSINA_INEC_META,
  type KatsinaLgaINEC,
  type KatsinaSenatorialZone,
  type KatsinaWardINEC,
} from '../data/katsinaInecData';

export type PoliticalParty = 'PDP' | 'APC' | 'ADC' | 'OTHERS';

export type SimulationPresetId = 'lado-victory' | 'grassroots-sweep' | 'battleground-win';

export interface SimulationPresetMeta {
  id: SimulationPresetId;
  label: string;
  shortLabel: string;
  description: string;
  turnoutRate: number; // e.g. 0.44 = 44%
  pdpWardCaptureBoost: number; // adjustment to default ward targets
  adcSurgeFactor: number; // 0.8 to 1.4
}

export const SIMULATION_PRESETS: SimulationPresetMeta[] = [
  {
    id: 'lado-victory',
    label: 'Lado Victory Path (3.1M+ Turnout)',
    shortLabel: 'Lado Victory Path',
    description:
      'High-mobilization 2027 turnout (80% of 3,876,051 INEC Oct 2026 voters = 3.1M+ valid votes) with decisive Senator Yakubu Lado victory across all three Katsina zones.',
    turnoutRate: 0.8,
    pdpWardCaptureBoost: 0,
    adcSurgeFactor: 1.0,
  },
  {
    id: 'grassroots-sweep',
    label: 'Grassroots Landslide (3.3M+ Turnout)',
    shortLabel: 'Grassroots Sweep',
    description:
      'Full PVC polling-unit mobilization (86% of 3,876,051 INEC register = 3.3M+ valid votes) delivering over 2 Million PDP votes across all 361 wards.',
    turnoutRate: 0.86,
    pdpWardCaptureBoost: 1,
    adcSurgeFactor: 0.9,
  },
  {
    id: 'battleground-win',
    label: 'Tight Battleground (2.9M+ Turnout)',
    shortLabel: 'Battleground Win',
    description:
      'Competitive APC & ADC push on the 3,876,051 Oct 2026 register (74% turnout) where Senator Yakubu Lado still secures the governorship via Katsina South & Central.',
    turnoutRate: 0.74,
    pdpWardCaptureBoost: -2,
    adcSurgeFactor: 1.25,
  },
];

export interface SimulationConfig {
  presetId: SimulationPresetId;
  turnoutRate: number; // 0.30 - 0.68
  adcSurgeFactor: number; // 0.5 - 1.8
  /** Optional LGA-level override of how many wards PDP wins (0..wardCount) */
  lgaWardTargetOverrides: Record<string, number>;
  /** Optional individual ward winner overrides ('PDP' | 'APC' | 'ADC') */
  wardWinnerOverrides: Record<string, 'PDP' | 'APC' | 'ADC'>;
}

export interface WardSimulationResult {
  ward: KatsinaWardINEC;
  winner: 'PDP' | 'APC' | 'ADC';
  projectedValidVotes: number;
  pdpVotes: number;
  apcVotes: number;
  adcVotes: number;
  othersVotes: number;
  pdpSharePct: number;
  potentialReachVoters: number; // PVC-collected reachable base
}

export interface LgaSimulationResult {
  lga: KatsinaLgaINEC;
  winner: 'PDP' | 'APC' | 'ADC';
  targetWardsPdp: number;
  pdpWardsWon: number;
  apcWardsWon: number;
  adcWardsWon: number;
  projectedValidVotes: number;
  pdpVotes: number;
  apcVotes: number;
  adcVotes: number;
  othersVotes: number;
  pdpSharePct: number;
  apcSharePct: number;
  adcSharePct: number;
  othersSharePct: number;
  marginVotes: number; // PDP - top rival (positive = Lado leads)
  marginPct: number;
  meets25PctSpread: boolean;
  potentialReachVoters: number;
  wardCapturePct: number;
  /** Additional votes PDP gains if flipping +1 extra ward in this LGA */
  oneExtraWardVoteGain: number;
  wards: WardSimulationResult[];
}

export interface ZoneSimulationSummary {
  zone: KatsinaSenatorialZone;
  lgaCount: number;
  lgaWonByPdp: number;
  totalWards: number;
  pdpWardsWon: number;
  registeredVoters: number;
  pollingUnits: number;
  projectedValidVotes: number;
  pdpVotes: number;
  apcVotes: number;
  adcVotes: number;
  othersVotes: number;
  pdpSharePct: number;
  apcSharePct: number;
  adcSharePct: number;
}

export interface TurnoutCurvePoint {
  turnoutPct: number;
  pdpVotes: number;
  apcVotes: number;
  adcVotes: number;
  margin: number;
}

export interface KatsinaSimulationOutput {
  registerRelease: string;
  nationalRank: number;
  nationalRankLabel: string;
  totalRegisteredVoters: number;
  previous2023RegisteredVoters: number;
  cvr2026NetAdditions: number;
  baseline2023PdpVotes: number;
  baseline2023ApcVotes: number;
  pdpGainVs2023: number;
  totalPvcCollected: number;
  totalPollingUnits: number;
  totalWards: number;
  totalLgas: number;
  projectedValidVotes: number;
  turnoutPct: number;
  pdpVotes: number;
  apcVotes: number;
  adcVotes: number;
  othersVotes: number;
  pdpSharePct: number;
  apcSharePct: number;
  adcSharePct: number;
  othersSharePct: number;
  winningParty: PoliticalParty;
  ladoWins: boolean;
  marginOverRunnerUp: number;
  runnerUpParty: 'APC' | 'ADC';
  pdpLgasWon: number;
  apcLgasWon: number;
  adcLgasWon: number;
  pdpWardsWon: number;
  apcWardsWon: number;
  adcWardsWon: number;
  lgasMeeting25PctSpread: number;
  meetsConstitutionalSpread: boolean;
  potentialReachVoters: number;
  lgas: LgaSimulationResult[];
  lgaById: Record<string, LgaSimulationResult>;
  zones: ZoneSimulationSummary[];
  turnoutSensitivity: TurnoutCurvePoint[];
}

export function createDefaultSimulationConfig(
  presetId: SimulationPresetId = 'lado-victory'
): SimulationConfig {
  const preset = SIMULATION_PRESETS.find((p) => p.id === presetId) ?? SIMULATION_PRESETS[0];
  return {
    presetId: preset.id,
    turnoutRate: preset.turnoutRate,
    adcSurgeFactor: preset.adcSurgeFactor,
    lgaWardTargetOverrides: {},
    wardWinnerOverrides: {},
  };
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function computeSingleLgaSimulation(
  lga: KatsinaLgaINEC,
  config: SimulationConfig,
  preset: SimulationPresetMeta
): LgaSimulationResult {
  const baseTarget = clamp(
    lga.defaultTargetWardsPdp + preset.pdpWardCaptureBoost,
    0,
    lga.wardCount
  );
  const targetWardsPdp =
    config.lgaWardTargetOverrides[lga.id] !== undefined
      ? clamp(config.lgaWardTargetOverrides[lga.id], 0, lga.wardCount)
      : baseTarget;

  // Sort wards by baseline PDP strength descending so the top `targetWardsPdp` wards go to PDP by default
  const rankedWardIds = [...lga.wards]
    .sort((a, b) => b.baselinePdpStrength - a.baselinePdpStrength)
    .map((w) => w.id);
  const pdpDefaultSet = new Set(rankedWardIds.slice(0, targetWardsPdp));

  // Among non-PDP wards, allocate roughly 72% to APC and 28% to ADC (scaled by adcSurgeFactor)
  const nonPdpWardIds = rankedWardIds.slice(targetWardsPdp);
  const adcWardCount = Math.min(
    nonPdpWardIds.length,
    Math.round(nonPdpWardIds.length * clamp(0.24 * config.adcSurgeFactor, 0.1, 0.55))
  );
  const adcDefaultSet = new Set(nonPdpWardIds.slice(nonPdpWardIds.length - adcWardCount));

  const wards: WardSimulationResult[] = lga.wards.map((ward) => {
    const defaultWinner: 'PDP' | 'APC' | 'ADC' = pdpDefaultSet.has(ward.id)
      ? 'PDP'
      : adcDefaultSet.has(ward.id)
        ? 'ADC'
        : 'APC';
    const winner = config.wardWinnerOverrides[ward.id] ?? defaultWinner;

    // Effective valid votes based on PVC collection and turnout rate across the 3,876,051 Oct 2026 register
    const localTurnout = clamp(
      config.turnoutRate * (0.97 + ward.pvcCollectionRate * 0.05),
      0.3,
      0.94
    );
    const projectedValidVotes = Math.round(ward.registeredVoters * localTurnout);
    const potentialReachVoters = Math.round(ward.registeredVoters * ward.pvcCollectionRate);

    // Party shares inside this ward depending on which party carries the ward
    let pdpShare: number;
    let apcShare: number;
    let adcShare: number;
    let othersShare: number;

    const adcBoost = clamp(config.adcSurgeFactor, 0.5, 1.8);

    if (winner === 'PDP') {
      // PDP wins the ward decisively (58% - 71% depending on grassroots strength)
      pdpShare = clamp(0.56 + (ward.baselinePdpStrength - 0.5) * 0.36, 0.54, 0.72);
      const rem = 1 - pdpShare;
      othersShare = rem * 0.11;
      const adcRaw = rem * lga.baselineAdcShareOfRemainder * adcBoost;
      adcShare = Math.min(rem * 0.4, adcRaw);
      apcShare = Math.max(0.05, rem - othersShare - adcShare);
    } else if (winner === 'APC') {
      // APC carries the ward (~48% - 54%), while PDP remains competitive (~31% - 37%)
      apcShare = 0.49;
      pdpShare = clamp(0.32 + (ward.baselinePdpStrength - 0.5) * 0.12, 0.28, 0.38);
      const rem = 1 - apcShare - pdpShare;
      adcShare = rem * clamp(0.68 * adcBoost, 0.45, 0.8);
      othersShare = Math.max(0.02, rem - adcShare);
    } else {
      // ADC carries the ward (~43%), PDP second (~33%), APC (~20%)
      adcShare = 0.43;
      pdpShare = 0.33;
      apcShare = 0.2;
      othersShare = 0.04;
    }

    const sumShare = pdpShare + apcShare + adcShare + othersShare;
    const pdpVotes = Math.round((pdpShare / sumShare) * projectedValidVotes);
    const apcVotes = Math.round((apcShare / sumShare) * projectedValidVotes);
    const adcVotes = Math.round((adcShare / sumShare) * projectedValidVotes);
    const othersVotes = Math.max(0, projectedValidVotes - pdpVotes - apcVotes - adcVotes);

    return {
      ward,
      winner,
      projectedValidVotes,
      pdpVotes,
      apcVotes,
      adcVotes,
      othersVotes,
      pdpSharePct: projectedValidVotes > 0 ? Number(((pdpVotes / projectedValidVotes) * 100).toFixed(1)) : 0,
      potentialReachVoters,
    };
  });

  const projectedValidVotes = wards.reduce((s, w) => s + w.projectedValidVotes, 0);
  const pdpVotes = wards.reduce((s, w) => s + w.pdpVotes, 0);
  const apcVotes = wards.reduce((s, w) => s + w.apcVotes, 0);
  const adcVotes = wards.reduce((s, w) => s + w.adcVotes, 0);
  const othersVotes = wards.reduce((s, w) => s + w.othersVotes, 0);
  const potentialReachVoters = wards.reduce((s, w) => s + w.potentialReachVoters, 0);

  const pdpWardsWon = wards.filter((w) => w.winner === 'PDP').length;
  const apcWardsWon = wards.filter((w) => w.winner === 'APC').length;
  const adcWardsWon = wards.filter((w) => w.winner === 'ADC').length;

  const pdpSharePct = projectedValidVotes > 0 ? Number(((pdpVotes / projectedValidVotes) * 100).toFixed(1)) : 0;
  const apcSharePct = projectedValidVotes > 0 ? Number(((apcVotes / projectedValidVotes) * 100).toFixed(1)) : 0;
  const adcSharePct = projectedValidVotes > 0 ? Number(((adcVotes / projectedValidVotes) * 100).toFixed(1)) : 0;
  const othersSharePct = Number(Math.max(0, 100 - pdpSharePct - apcSharePct - adcSharePct).toFixed(1));

  const winner: 'PDP' | 'APC' | 'ADC' =
    pdpVotes >= apcVotes && pdpVotes >= adcVotes
      ? 'PDP'
      : apcVotes >= adcVotes
        ? 'APC'
        : 'ADC';

  const topRival = Math.max(apcVotes, adcVotes);
  const marginVotes = pdpVotes - topRival;
  const marginPct = projectedValidVotes > 0 ? Number(((marginVotes / projectedValidVotes) * 100).toFixed(1)) : 0;

  // Estimate net vote gain for PDP from flipping 1 average non-PDP ward in this LGA
  const avgWardVotes = projectedValidVotes / lga.wardCount;
  const oneExtraWardVoteGain = Math.round(avgWardVotes * 0.28);

  return {
    lga,
    winner,
    targetWardsPdp: pdpWardsWon,
    pdpWardsWon,
    apcWardsWon,
    adcWardsWon,
    projectedValidVotes,
    pdpVotes,
    apcVotes,
    adcVotes,
    othersVotes,
    pdpSharePct,
    apcSharePct,
    adcSharePct,
    othersSharePct,
    marginVotes,
    marginPct,
    meets25PctSpread: pdpSharePct >= 25,
    potentialReachVoters,
    wardCapturePct: Number(((pdpWardsWon / lga.wardCount) * 100).toFixed(1)),
    oneExtraWardVoteGain,
    wards,
  };
}

export function runKatsinaSimulation(config: SimulationConfig): KatsinaSimulationOutput {
  const preset = SIMULATION_PRESETS.find((p) => p.id === config.presetId) ?? SIMULATION_PRESETS[0];

  const lgas = KATSINA_INEC_LGAS.map((lga) => computeSingleLgaSimulation(lga, config, preset));
  const lgaById = Object.fromEntries(lgas.map((r) => [r.lga.id, r]));

  const totalRegisteredVoters = lgas.reduce((s, r) => s + r.lga.registeredVoters, 0);
  const totalPvcCollected = lgas.reduce((s, r) => s + r.lga.pvcCollected, 0);
  const totalPollingUnits = lgas.reduce((s, r) => s + r.lga.pollingUnits, 0);
  const totalWards = lgas.reduce((s, r) => s + r.lga.wardCount, 0);
  const projectedValidVotes = lgas.reduce((s, r) => s + r.projectedValidVotes, 0);
  const potentialReachVoters = lgas.reduce((s, r) => s + r.potentialReachVoters, 0);

  const pdpVotes = lgas.reduce((s, r) => s + r.pdpVotes, 0);
  const apcVotes = lgas.reduce((s, r) => s + r.apcVotes, 0);
  const adcVotes = lgas.reduce((s, r) => s + r.adcVotes, 0);
  const othersVotes = lgas.reduce((s, r) => s + r.othersVotes, 0);

  const pdpSharePct = projectedValidVotes > 0 ? Number(((pdpVotes / projectedValidVotes) * 100).toFixed(1)) : 0;
  const apcSharePct = projectedValidVotes > 0 ? Number(((apcVotes / projectedValidVotes) * 100).toFixed(1)) : 0;
  const adcSharePct = projectedValidVotes > 0 ? Number(((adcVotes / projectedValidVotes) * 100).toFixed(1)) : 0;
  const othersSharePct = Number(Math.max(0, 100 - pdpSharePct - apcSharePct - adcSharePct).toFixed(1));

  const pdpLgasWon = lgas.filter((r) => r.winner === 'PDP').length;
  const apcLgasWon = lgas.filter((r) => r.winner === 'APC').length;
  const adcLgasWon = lgas.filter((r) => r.winner === 'ADC').length;

  const pdpWardsWon = lgas.reduce((s, r) => s + r.pdpWardsWon, 0);
  const apcWardsWon = lgas.reduce((s, r) => s + r.apcWardsWon, 0);
  const adcWardsWon = lgas.reduce((s, r) => s + r.adcWardsWon, 0);

  const lgasMeeting25PctSpread = lgas.filter((r) => r.meets25PctSpread).length;
  const meetsConstitutionalSpread =
    lgasMeeting25PctSpread >= KATSINA_INEC_META.constitutionalSpreadThresholdLgas;

  const runnerUpParty: 'APC' | 'ADC' = apcVotes >= adcVotes ? 'APC' : 'ADC';
  const runnerUpVotes = Math.max(apcVotes, adcVotes);
  const marginOverRunnerUp = pdpVotes - runnerUpVotes;
  const winningParty: PoliticalParty =
    pdpVotes >= apcVotes && pdpVotes >= adcVotes
      ? 'PDP'
      : apcVotes >= adcVotes
        ? 'APC'
        : 'ADC';
  const ladoWins = winningParty === 'PDP' && meetsConstitutionalSpread;

  // Aggregate by 3 Katsina Senatorial Zones
  const zoneOrder: KatsinaSenatorialZone[] = ['Katsina South', 'Katsina Central', 'Katsina North'];
  const zones: ZoneSimulationSummary[] = zoneOrder.map((zone) => {
    const zLgas = lgas.filter((r) => r.lga.zone === zone);
    const zValid = zLgas.reduce((s, r) => s + r.projectedValidVotes, 0);
    const zPdp = zLgas.reduce((s, r) => s + r.pdpVotes, 0);
    const zApc = zLgas.reduce((s, r) => s + r.apcVotes, 0);
    const zAdc = zLgas.reduce((s, r) => s + r.adcVotes, 0);
    const zOthers = zLgas.reduce((s, r) => s + r.othersVotes, 0);
    return {
      zone,
      lgaCount: zLgas.length,
      lgaWonByPdp: zLgas.filter((r) => r.winner === 'PDP').length,
      totalWards: zLgas.reduce((s, r) => s + r.lga.wardCount, 0),
      pdpWardsWon: zLgas.reduce((s, r) => s + r.pdpWardsWon, 0),
      registeredVoters: zLgas.reduce((s, r) => s + r.lga.registeredVoters, 0),
      pollingUnits: zLgas.reduce((s, r) => s + r.lga.pollingUnits, 0),
      projectedValidVotes: zValid,
      pdpVotes: zPdp,
      apcVotes: zApc,
      adcVotes: zAdc,
      othersVotes: zOthers,
      pdpSharePct: zValid > 0 ? Number(((zPdp / zValid) * 100).toFixed(1)) : 0,
      apcSharePct: zValid > 0 ? Number(((zApc / zValid) * 100).toFixed(1)) : 0,
      adcSharePct: zValid > 0 ? Number(((zAdc / zValid) * 100).toFixed(1)) : 0,
    };
  });

  // Compute Turnout Sensitivity Curve (45% -> 90% of the 3,876,051 Oct 2026 INEC register)
  const turnoutSteps = [0.45, 0.55, 0.65, 0.72, 0.78, 0.82, 0.86, 0.9];
  const pdpRatio = projectedValidVotes > 0 ? pdpVotes / projectedValidVotes : 0.55;
  const apcRatio = projectedValidVotes > 0 ? apcVotes / projectedValidVotes : 0.3;
  const adcRatio = projectedValidVotes > 0 ? adcVotes / projectedValidVotes : 0.1;

  const turnoutSensitivity: TurnoutCurvePoint[] = turnoutSteps.map((rate) => {
    const valid = Math.round(totalRegisteredVoters * rate);
    // Higher grassroots mobilization gently strengthens PDP turnout conversion
    const mobFactor = 1 + (rate - config.turnoutRate) * 0.18;
    const adjPdpRatio = clamp(pdpRatio * mobFactor, 0.25, 0.78);
    const remScale = (1 - adjPdpRatio) / Math.max(0.01, 1 - pdpRatio);
    const pV = Math.round(valid * adjPdpRatio);
    const aV = Math.round(valid * apcRatio * remScale);
    const dV = Math.round(valid * adcRatio * remScale);
    return {
      turnoutPct: Math.round(rate * 100),
      pdpVotes: pV,
      apcVotes: aV,
      adcVotes: dV,
      margin: pV - Math.max(aV, dV),
    };
  });

  return {
    registerRelease: KATSINA_INEC_META.registerRelease,
    nationalRank: KATSINA_INEC_META.nationalRank,
    nationalRankLabel: KATSINA_INEC_META.nationalRankLabel,
    totalRegisteredVoters,
    previous2023RegisteredVoters: KATSINA_INEC_META.previous2023RegisteredVoters,
    cvr2026NetAdditions: KATSINA_INEC_META.cvr2026NetAdditions,
    baseline2023PdpVotes: KATSINA_INEC_META.baseline2023PdpVotes,
    baseline2023ApcVotes: KATSINA_INEC_META.baseline2023ApcVotes,
    pdpGainVs2023: pdpVotes - KATSINA_INEC_META.baseline2023PdpVotes,
    totalPvcCollected,
    totalPollingUnits,
    totalWards,
    totalLgas: lgas.length,
    projectedValidVotes,
    turnoutPct: Number(((projectedValidVotes / totalRegisteredVoters) * 100).toFixed(1)),
    pdpVotes,
    apcVotes,
    adcVotes,
    othersVotes,
    pdpSharePct,
    apcSharePct,
    adcSharePct,
    othersSharePct,
    winningParty,
    ladoWins,
    marginOverRunnerUp,
    runnerUpParty,
    pdpLgasWon,
    apcLgasWon,
    adcLgasWon,
    pdpWardsWon,
    apcWardsWon,
    adcWardsWon,
    lgasMeeting25PctSpread,
    meetsConstitutionalSpread,
    potentialReachVoters,
    lgas,
    lgaById,
    zones,
    turnoutSensitivity,
  };
}

export interface KatsinaGeoJsonFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: {
    id: string;
    name: string;
    zone: KatsinaSenatorialZone;
    registeredVoters: number;
    pollingUnits: number;
    wardCount: number;
    pdpWardsWon: number;
    wardCapturePct: number;
    winner: 'PDP' | 'APC' | 'ADC';
    pdpVotes: number;
    apcVotes: number;
    adcVotes: number;
    pdpSharePct: number;
    marginVotes: number;
    potentialReachVoters: number;
    voterWeight: number;
    pdpStrengthWeight: number;
    swingOpportunityWeight: number;
  };
}

export interface KatsinaGeoJsonFeatureCollection {
  type: 'FeatureCollection';
  features: KatsinaGeoJsonFeature[];
}

/**
 * Builds a Mapbox GL / MapLibre GL GeoJSON FeatureCollection for all 34 Katsina LGAs
 * driving native WebGL heatmaps, proportional voter circles, and margin layers.
 */
export function buildKatsinaGeoJson(
  sim: KatsinaSimulationOutput
): KatsinaGeoJsonFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: sim.lgas.map((item) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [item.lga.lng, item.lga.lat],
      },
      properties: {
        id: item.lga.id,
        name: item.lga.name,
        zone: item.lga.zone,
        registeredVoters: item.lga.registeredVoters,
        pollingUnits: item.lga.pollingUnits,
        wardCount: item.lga.wardCount,
        pdpWardsWon: item.pdpWardsWon,
        wardCapturePct: item.wardCapturePct,
        winner: item.winner,
        pdpVotes: item.pdpVotes,
        apcVotes: item.apcVotes,
        adcVotes: item.adcVotes,
        pdpSharePct: item.pdpSharePct,
        marginVotes: item.marginVotes,
        potentialReachVoters: item.potentialReachVoters,
        // Normalized 0..1 weight for Mapbox heatmap intensity
        voterWeight: Number((item.lga.registeredVoters / 270000).toFixed(3)),
        pdpStrengthWeight: Number(((item.pdpSharePct / 100) * (item.lga.registeredVoters / 220000)).toFixed(3)),
        swingOpportunityWeight: Number(
          (((item.lga.wardCount - item.pdpWardsWon + 1) / item.lga.wardCount) * (item.lga.registeredVoters / 220000)).toFixed(3)
        ),
      },
    })),
  };
}

/**
 * Computes a clean Andrew's monotone chain convex hull expanded slightly outward from centroid
 * so Mapbox GL renders executive Senatorial Zone territory fills & Katsina state perimeter cleanly.
 */
function computeExpandedHull(points: Array<[number, number]>, expandFactor: number): Array<[number, number]> {
  if (points.length < 3) return points;
  const sorted = [...points].sort((a, b) => (a[0] === b[0] ? a[1] - b[1] : a[0] - b[0]));
  const cross = (o: [number, number], a: [number, number], b: [number, number]) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);

  const lower: Array<[number, number]> = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }
  const upper: Array<[number, number]> = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }
  lower.pop();
  upper.pop();
  const hull = lower.concat(upper);
  if (hull.length < 3) return hull;

  const cx = hull.reduce((s, p) => s + p[0], 0) / hull.length;
  const cy = hull.reduce((s, p) => s + p[1], 0) / hull.length;

  const expanded: Array<[number, number]> = hull.map(([x, y]) => [
    Number((cx + (x - cx) * expandFactor).toFixed(4)),
    Number((cy + (y - cy) * expandFactor).toFixed(4)),
  ]);
  expanded.push(expanded[0]);
  return expanded;
}

export interface KatsinaTerritoryGeoJson {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    geometry: {
      type: 'Polygon';
      coordinates: Array<Array<[number, number]>>;
    };
    properties: {
      kind: 'state' | 'zone';
      name: string;
      pdpSharePct: number;
      lgaCount: number;
      pdpWardsWon: number;
      totalWards: number;
    };
  }>;
}

export function buildKatsinaZonePolygonsGeoJson(
  sim: KatsinaSimulationOutput
): KatsinaTerritoryGeoJson {
  const allCoords: Array<[number, number]> = sim.lgas.map((r) => [r.lga.lng, r.lga.lat]);
  const stateRing = computeExpandedHull(allCoords, 1.14);

  const zoneFeatures = sim.zones.map((z) => {
    const zCoords: Array<[number, number]> = sim.lgas
      .filter((r) => r.lga.zone === z.zone)
      .map((r) => [r.lga.lng, r.lga.lat]);
    return {
      type: 'Feature' as const,
      geometry: {
        type: 'Polygon' as const,
        coordinates: [computeExpandedHull(zCoords, 1.16)],
      },
      properties: {
        kind: 'zone' as const,
        name: z.zone,
        pdpSharePct: z.pdpSharePct,
        lgaCount: z.lgaCount,
        pdpWardsWon: z.pdpWardsWon,
        totalWards: z.totalWards,
      },
    };
  });

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [stateRing],
        },
        properties: {
          kind: 'state',
          name: 'Katsina State',
          pdpSharePct: sim.pdpSharePct,
          lgaCount: sim.totalLgas,
          pdpWardsWon: sim.pdpWardsWon,
          totalWards: sim.totalWards,
        },
      },
      ...zoneFeatures,
    ],
  };
}

export function buildKatsinaCorridorsGeoJson(sim: KatsinaSimulationOutput) {
  const katsinaHub = sim.lgaById['katsina']?.lga;
  const funtuaHub = sim.lgaById['funtua']?.lga;
  const dauraHub = sim.lgaById['daura']?.lga;
  const malumfashiHub = sim.lgaById['malumfashi']?.lga;
  const dutsinmaHub = sim.lgaById['dutsin-ma']?.lga;

  const pairs = [
    [katsinaHub, dauraHub, 'Katsina–Daura North Corridor'],
    [katsinaHub, dutsinmaHub, 'Katsina–Dutsin-Ma Central Spine'],
    [dutsinmaHub, malumfashiHub, 'Central–Malumfashi Corridor'],
    [malumfashiHub, funtuaHub, 'Malumfashi–Funtua South Stronghold'],
  ] as const;

  return {
    type: 'FeatureCollection' as const,
    features: pairs
      .filter(([a, b]) => Boolean(a && b))
      .map(([a, b, label]) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'LineString' as const,
          coordinates: [
            [a!.lng, a!.lat],
            [b!.lng, b!.lat],
          ],
        },
        properties: { label },
      })),
  };
}

export interface SimulationComparisonDelta {
  pdpVotesDelta: number;
  apcVotesDelta: number;
  adcVotesDelta: number;
  marginDelta: number;
  pdpWardsDelta: number;
  pdpLgasDelta: number;
  pdpSharePctDelta: number;
}

/**
 * Compares an active Katsina simulation against a saved scenario snapshot.
 */
export function compareSimulations(
  current: KatsinaSimulationOutput,
  baseline: KatsinaSimulationOutput
): SimulationComparisonDelta {
  return {
    pdpVotesDelta: current.pdpVotes - baseline.pdpVotes,
    apcVotesDelta: current.apcVotes - baseline.apcVotes,
    adcVotesDelta: current.adcVotes - baseline.adcVotes,
    marginDelta: current.marginOverRunnerUp - baseline.marginOverRunnerUp,
    pdpWardsDelta: current.pdpWardsWon - baseline.pdpWardsWon,
    pdpLgasDelta: current.pdpLgasWon - baseline.pdpLgasWon,
    pdpSharePctDelta: Number((current.pdpSharePct - baseline.pdpSharePct).toFixed(1)),
  };
}

function escapeCsvCell(value: string | number): string {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Exports all 34 Katsina LGAs with official INEC baselines and live simulated results as CSV.
 */
export function exportKatsinaSimulationCsv(sim: KatsinaSimulationOutput): string {
  const header = [
    'INEC Code',
    'Local Government',
    'Senatorial Zone',
    'INEC Registered Voters (Oct 2026)',
    '2026 CVR Additions',
    '2023 INEC PDP Baseline',
    'Polling Units',
    'Total Wards',
    'PDP Wards Won',
    'PDP Votes (Yakubu Lado)',
    'PDP Share (%)',
    'APC Votes',
    'ADC Votes',
    'Others Votes',
    'Winning Party',
    'PDP Margin',
  ];

  const rows = sim.lgas.map((r) => [
    r.lga.inecCode,
    r.lga.name,
    r.lga.zone,
    r.lga.registeredVoters,
    r.lga.cvr2026NewVoters,
    r.lga.baseline2023PdpVotes,
    r.lga.pollingUnits,
    r.lga.wardCount,
    r.pdpWardsWon,
    r.pdpVotes,
    r.pdpSharePct,
    r.apcVotes,
    r.adcVotes,
    r.othersVotes,
    r.winner,
    r.marginVotes,
  ]);

  return [header, ...rows].map((row) => row.map(escapeCsvCell).join(',')).join('\n');
}


