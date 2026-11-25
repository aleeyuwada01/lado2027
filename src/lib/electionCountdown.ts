export const KATSINA_GOVERNORSHIP_ELECTION_ISO = '2027-02-06T08:30:00+01:00';
export const NIGERIA_PRESIDENTIAL_ELECTION_ISO = '2027-01-16T08:30:00+01:00';

export interface CountdownBreakdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  isReached: boolean;
}

export function computeCountdownBreakdown(
  targetIso: string,
  nowMs: number = Date.now()
): CountdownBreakdown {
  const targetMs = Date.parse(targetIso);
  if (!Number.isFinite(targetMs)) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalMs: 0,
      isReached: true,
    };
  }

  const diffMs = Math.max(0, targetMs - nowMs);
  if (diffMs === 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalMs: 0,
      isReached: true,
    };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    days,
    hours,
    minutes,
    seconds,
    totalMs: diffMs,
    isReached: false,
  };
}

export function padTwo(value: number): string {
  return String(Math.max(0, Math.floor(value))).padStart(2, '0');
}
