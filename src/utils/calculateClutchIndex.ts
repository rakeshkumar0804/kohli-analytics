// ============================================================
// CLUTCH INDEX UTILITY (Phase 1 Data Integrity Freeze)
// Status: Option B — Calibration Pending
// ============================================================

export interface ClutchInput {
  baselineAvg: number;
  chaseAvg: number;
  knockoutAvg: number;
  finalsAvg: number;
  baselineSR: number;
  chaseSR: number;
}

export interface ClutchResult {
  status: 'calibration-pending';
  label: string;
  sublabel: string;
  message: string;
}

/**
 * Calculates Clutch Index for a given format.
 * In Phase 1, metrics are explicitly set to 'calibration-pending'
 * until Phase 2 derives a reproducible formula from ball-by-ball data.
 */
export function calculateClutchIndex(_input: ClutchInput): ClutchResult {
  return {
    status: 'calibration-pending',
    label: 'CALIBRATION PENDING',
    sublabel: 'Experimental Metric',
    message: 'Phase 2 will derive and calibrate the metric from reproducible ball-by-ball data.',
  };
}
