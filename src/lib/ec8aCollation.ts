import type { Ec8aResultRecord } from '../types/campaign';
import { KATSINA_INEC_LGAS } from '../data/katsinaInecData';
import type { KatsinaSimulationOutput } from './electionSimulator';

export interface Ec8aSheetValidation {
  totalValidVotes: number;
  totalCastVotes: number;
  hasOverVoting: boolean;
  overVotesBy: number;
  marginPdpOverApc: number;
}

export interface Ec8aLgaCollationSummary {
  lgaId: string;
  lgaName: string;
  sheetsCount: number;
  verifiedCount: number;
  flaggedCount: number;
  accreditedTotal: number;
  pdpVotes: number;
  apcVotes: number;
  adcVotes: number;
  otherVotes: number;
  validVotes: number;
  pdpSharePct: number;
  meets25Pct: boolean;
  projectedPdpVotes: number;
}

export interface Ec8aCollationAggregate {
  sheetsCaptured: number;
  verifiedSheets: number;
  flaggedSheets: number;
  pendingSheets: number;
  totalAccredited: number;
  totalValidVotes: number;
  totalRejectedVotes: number;
  pdpVotes: number;
  apcVotes: number;
  adcVotes: number;
  otherVotes: number;
  pdpSharePct: number;
  apcSharePct: number;
  adcSharePct: number;
  marginPdpOverApc: number;
  lgasReported: number;
  lgasMeeting25Pct: number;
  meetsConstitutionalSpread: boolean;
  lgaBreakdown: Ec8aLgaCollationSummary[];
}

export function validateEc8aSheet(input: {
  accreditedVoters: number;
  pdpVotes: number;
  apcVotes: number;
  adcVotes: number;
  otherVotes: number;
  rejectedVotes: number;
}): Ec8aSheetValidation {
  const accredited = Math.max(0, Math.round(input.accreditedVoters));
  const pdp = Math.max(0, Math.round(input.pdpVotes));
  const apc = Math.max(0, Math.round(input.apcVotes));
  const adc = Math.max(0, Math.round(input.adcVotes));
  const other = Math.max(0, Math.round(input.otherVotes));
  const rejected = Math.max(0, Math.round(input.rejectedVotes));

  const totalValidVotes = pdp + apc + adc + other;
  const totalCastVotes = totalValidVotes + rejected;
  const hasOverVoting = accredited > 0 && totalCastVotes > accredited;

  return {
    totalValidVotes,
    totalCastVotes,
    hasOverVoting,
    overVotesBy: hasOverVoting ? totalCastVotes - accredited : 0,
    marginPdpOverApc: pdp - apc,
  };
}

export function aggregateEc8aCollation(
  records: Ec8aResultRecord[],
  baselineSimulation?: KatsinaSimulationOutput
): Ec8aCollationAggregate {
  const lgaAcc = new Map<
    string,
    {
      lgaName: string;
      sheetsCount: number;
      verifiedCount: number;
      flaggedCount: number;
      accreditedTotal: number;
      pdpVotes: number;
      apcVotes: number;
      adcVotes: number;
      otherVotes: number;
    }
  >();

  let verifiedSheets = 0;
  let flaggedSheets = 0;
  let pendingSheets = 0;
  let totalAccredited = 0;
  let totalRejectedVotes = 0;
  let pdpVotes = 0;
  let apcVotes = 0;
  let adcVotes = 0;
  let otherVotes = 0;

  for (const r of records) {
    if (r.status === 'Verified') verifiedSheets += 1;
    else if (r.status === 'Discrepancy Flagged') flaggedSheets += 1;
    else pendingSheets += 1;

    totalAccredited += r.accreditedVoters;
    totalRejectedVotes += r.rejectedVotes;
    pdpVotes += r.pdpVotes;
    apcVotes += r.apcVotes;
    adcVotes += r.adcVotes;
    otherVotes += r.otherVotes;

    const current = lgaAcc.get(r.lgaId) ?? {
      lgaName: r.lgaName,
      sheetsCount: 0,
      verifiedCount: 0,
      flaggedCount: 0,
      accreditedTotal: 0,
      pdpVotes: 0,
      apcVotes: 0,
      adcVotes: 0,
      otherVotes: 0,
    };

    current.sheetsCount += 1;
    if (r.status === 'Verified') current.verifiedCount += 1;
    if (r.status === 'Discrepancy Flagged') current.flaggedCount += 1;
    current.accreditedTotal += r.accreditedVoters;
    current.pdpVotes += r.pdpVotes;
    current.apcVotes += r.apcVotes;
    current.adcVotes += r.adcVotes;
    current.otherVotes += r.otherVotes;
    lgaAcc.set(r.lgaId, current);
  }

  const totalValidVotes = pdpVotes + apcVotes + adcVotes + otherVotes;
  const pct = (part: number, whole: number) =>
    whole > 0 ? Number(((part / whole) * 100).toFixed(1)) : 0;

  const lgaBreakdown: Ec8aLgaCollationSummary[] = Array.from(lgaAcc.entries())
    .map(([lgaId, agg]) => {
      const validVotes = agg.pdpVotes + agg.apcVotes + agg.adcVotes + agg.otherVotes;
      const pdpSharePct = pct(agg.pdpVotes, validVotes);
      const projectedPdpVotes =
        baselineSimulation?.lgaById[lgaId]?.pdpVotes ??
        KATSINA_INEC_LGAS.find((l) => l.id === lgaId)?.baseline2023PdpVotes ??
        0;
      return {
        lgaId,
        lgaName: agg.lgaName,
        sheetsCount: agg.sheetsCount,
        verifiedCount: agg.verifiedCount,
        flaggedCount: agg.flaggedCount,
        accreditedTotal: agg.accreditedTotal,
        pdpVotes: agg.pdpVotes,
        apcVotes: agg.apcVotes,
        adcVotes: agg.adcVotes,
        otherVotes: agg.otherVotes,
        validVotes,
        pdpSharePct,
        meets25Pct: pdpSharePct >= 25,
        projectedPdpVotes,
      };
    })
    .sort((a, b) => b.pdpVotes - a.pdpVotes);

  const lgasMeeting25Pct = lgaBreakdown.filter((l) => l.meets25Pct).length;

  return {
    sheetsCaptured: records.length,
    verifiedSheets,
    flaggedSheets,
    pendingSheets,
    totalAccredited,
    totalValidVotes,
    totalRejectedVotes,
    pdpVotes,
    apcVotes,
    adcVotes,
    otherVotes,
    pdpSharePct: pct(pdpVotes, totalValidVotes),
    apcSharePct: pct(apcVotes, totalValidVotes),
    adcSharePct: pct(adcVotes, totalValidVotes),
    marginPdpOverApc: pdpVotes - apcVotes,
    lgasReported: lgaBreakdown.length,
    lgasMeeting25Pct,
    meetsConstitutionalSpread: lgasMeeting25Pct >= 23, // two-thirds of Katsina's 34 LGAs
    lgaBreakdown,
  };
}
