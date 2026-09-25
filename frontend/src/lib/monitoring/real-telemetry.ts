'use client';

export type DemographicType = 'MASCULINO' | 'FEMENINO' | 'NIÑO / INFANTE';

export interface IRealInteractionTelemetry {
  id: string;
  timestamp: string;
  timestampMs: number;
  personId: number;
  gender: DemographicType;
  objectName: string;
  category: string;
  durationSeconds: number;
  icon: string;
  color: string;
}

export interface IRealDemographicsSummary {
  maleCount: number;
  femaleCount: number;
  childCount: number;
  totalUniquePeople: number;
}

const TELEMETRY_STORAGE_KEY = 'ris3_real_telemetry_interactions_v1';
const DEMOGRAPHICS_STORAGE_KEY = 'ris3_real_telemetry_demographics_v1';

export function getRealInteractionHistory(): IRealInteractionTelemetry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(TELEMETRY_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function getRealDemographicsSummary(): IRealDemographicsSummary {
  if (typeof window === 'undefined') {
    return { maleCount: 0, femaleCount: 0, childCount: 0, totalUniquePeople: 0 };
  }
  try {
    const raw = localStorage.getItem(DEMOGRAPHICS_STORAGE_KEY);
    if (!raw) {
      return { maleCount: 0, femaleCount: 0, childCount: 0, totalUniquePeople: 0 };
    }
    return JSON.parse(raw);
  } catch {
    return { maleCount: 0, femaleCount: 0, childCount: 0, totalUniquePeople: 0 };
  }
}

export function recordRealPerson(gender: DemographicType) {
  if (typeof window === 'undefined') return;
  try {
    const summary = getRealDemographicsSummary();
    if (gender === 'MASCULINO') summary.maleCount += 1;
    else if (gender === 'FEMENINO') summary.femaleCount += 1;
    else if (gender === 'NIÑO / INFANTE') summary.childCount += 1;
    summary.totalUniquePeople += 1;

    localStorage.setItem(DEMOGRAPHICS_STORAGE_KEY, JSON.stringify(summary));
  } catch (err) {
    console.error('Error recording real person:', err);
  }
}

export function recordRealInteractionEvent(
  personId: number,
  gender: DemographicType,
  objectName: string,
  category: string,
  icon: string = '⚡',
  color: string = '#00F0FF',
  durationSeconds: number = 3.0
): IRealInteractionTelemetry {
  const event: IRealInteractionTelemetry = {
    id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    timestampMs: Date.now(),
    personId,
    gender,
    objectName,
    category,
    durationSeconds,
    icon,
    color,
  };

  if (typeof window !== 'undefined') {
    try {
      const history = getRealInteractionHistory();
      const updated = [event, ...history.slice(0, 99)];
      localStorage.setItem(TELEMETRY_STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Error saving real interaction telemetry:', err);
    }
  }

  return event;
}

export function clearRealTelemetry() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TELEMETRY_STORAGE_KEY);
  localStorage.removeItem(DEMOGRAPHICS_STORAGE_KEY);
}
