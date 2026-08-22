// ============================================================
// Format-Wise Legends Comparison Radar Data (ODI / TEST / T20I)
// Multi-Player Autocomplete Comparison Engine
// ============================================================
// Normalization Methodology:
// Format-specific target max benchmarks scale raw values to 0–100 range.
// Formula: normalized = Math.min(100, Math.round((raw / formatTargetMax) * 100))
// ============================================================

export type CricketFormat = 'ODI' | 'TEST' | 'T20I';

export interface LegendRawStats {
  battingAvg: number;
  strikeRate: number;
  centuries: number;
  chaseSuccessRate: number; // % win rate in chases / 4th innings
  matchWinningInnings: number; // Count of winning innings >50 runs (or >30 in T20I)
  consistencyScore: number; // % of innings > own career avg
}

export interface LegendFormatProfile {
  raw: LegendRawStats;
  normalized: {
    battingAvg: number;
    strikeRate: number;
    centuries: number;
    chaseSuccessRate: number;
    matchWinningInnings: number;
    consistencyScore: number;
  };
}

export interface LegendFullProfile {
  id: string;
  name: string;
  shortName: string;
  country: string;
  color: string;
  flag: string;
  formats: Record<CricketFormat, LegendFormatProfile>;
}

// Format-specific normalization upper benchmarks
export const FORMAT_BENCHMARKS: Record<CricketFormat, Record<keyof LegendRawStats, number>> = {
  ODI: {
    battingAvg: 70.0,
    strikeRate: 100.0,
    centuries: 60,
    chaseSuccessRate: 95.0,
    matchWinningInnings: 160,
    consistencyScore: 50.0,
  },
  TEST: {
    battingAvg: 70.0,
    strikeRate: 70.0,
    centuries: 60,
    chaseSuccessRate: 80.0,
    matchWinningInnings: 120,
    consistencyScore: 50.0,
  },
  T20I: {
    battingAvg: 60.0,
    strikeRate: 150.0,
    centuries: 5,
    chaseSuccessRate: 95.0,
    matchWinningInnings: 80,
    consistencyScore: 50.0,
  },
};

function buildFormatProfile(format: CricketFormat, raw: LegendRawStats): LegendFormatProfile {
  const bench = FORMAT_BENCHMARKS[format];
  return {
    raw,
    normalized: {
      battingAvg: Math.min(100, Math.round((raw.battingAvg / bench.battingAvg) * 100)),
      strikeRate: Math.min(100, Math.round((raw.strikeRate / bench.strikeRate) * 100)),
      centuries: Math.min(100, Math.round((raw.centuries / bench.centuries) * 100)),
      chaseSuccessRate: Math.min(100, Math.round((raw.chaseSuccessRate / bench.chaseSuccessRate) * 100)),
      matchWinningInnings: Math.min(100, Math.round((raw.matchWinningInnings / bench.matchWinningInnings) * 100)),
      consistencyScore: Math.min(100, Math.round((raw.consistencyScore / bench.consistencyScore) * 100)),
    },
  };
}

export const ALL_RADAR_PLAYERS_FORMATTED: LegendFullProfile[] = [
  {
    id: 'kohli',
    name: 'Virat Kohli',
    shortName: 'Kohli',
    country: 'India',
    color: '#FFD700',
    flag: '🇮🇳',
    formats: {
      ODI: buildFormatProfile('ODI', {
        battingAvg: 58.60,
        strikeRate: 94.00,
        centuries: 54,
        chaseSuccessRate: 89.4,
        matchWinningInnings: 142,
        consistencyScore: 44.2,
      }),
      TEST: buildFormatProfile('TEST', {
        battingAvg: 46.90,
        strikeRate: 55.60,
        centuries: 30,
        chaseSuccessRate: 52.4,
        matchWinningInnings: 74,
        consistencyScore: 41.5,
      }),
      T20I: buildFormatProfile('T20I', {
        battingAvg: 48.70,
        strikeRate: 137.00,
        centuries: 1,
        chaseSuccessRate: 82.5,
        matchWinningInnings: 68,
        consistencyScore: 46.2,
      }),
    },
  },
  {
    id: 'sachin',
    name: 'Sachin Tendulkar',
    shortName: 'Sachin',
    country: 'India',
    color: '#E8153A',
    flag: '🇮🇳',
    formats: {
      ODI: buildFormatProfile('ODI', {
        battingAvg: 44.83,
        strikeRate: 86.23,
        centuries: 49,
        chaseSuccessRate: 56.4,
        matchWinningInnings: 138,
        consistencyScore: 38.6,
      }),
      TEST: buildFormatProfile('TEST', {
        battingAvg: 53.78,
        strikeRate: 54.04,
        centuries: 51,
        chaseSuccessRate: 51.2,
        matchWinningInnings: 112,
        consistencyScore: 46.8,
      }),
      T20I: buildFormatProfile('T20I', {
        battingAvg: 10.00,
        strikeRate: 83.33,
        centuries: 0,
        chaseSuccessRate: 50.0,
        matchWinningInnings: 1,
        consistencyScore: 20.0,
      }),
    },
  },
  {
    id: 'smith',
    name: 'Steve Smith',
    shortName: 'Smith',
    country: 'Australia',
    color: '#F5B800',
    flag: '🇦🇺',
    formats: {
      ODI: buildFormatProfile('ODI', {
        battingAvg: 43.34,
        strikeRate: 87.15,
        centuries: 12,
        chaseSuccessRate: 52.8,
        matchWinningInnings: 54,
        consistencyScore: 35.1,
      }),
      TEST: buildFormatProfile('TEST', {
        battingAvg: 56.97,
        strikeRate: 53.80,
        centuries: 32,
        chaseSuccessRate: 48.6,
        matchWinningInnings: 78,
        consistencyScore: 48.2,
      }),
      T20I: buildFormatProfile('T20I', {
        battingAvg: 25.20,
        strikeRate: 125.45,
        centuries: 0,
        chaseSuccessRate: 48.0,
        matchWinningInnings: 22,
        consistencyScore: 28.5,
      }),
    },
  },
  {
    id: 'root',
    name: 'Joe Root',
    shortName: 'Root',
    country: 'England',
    color: '#3B82F6',
    flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    formats: {
      ODI: buildFormatProfile('ODI', {
        battingAvg: 49.72,
        strikeRate: 86.92,
        centuries: 20,
        chaseSuccessRate: 51.2,
        matchWinningInnings: 62,
        consistencyScore: 39.4,
      }),
      TEST: buildFormatProfile('TEST', {
        battingAvg: 50.20,
        strikeRate: 56.80,
        centuries: 36,
        chaseSuccessRate: 46.5,
        matchWinningInnings: 84,
        consistencyScore: 43.1,
      }),
      T20I: buildFormatProfile('T20I', {
        battingAvg: 35.72,
        strikeRate: 126.30,
        centuries: 0,
        chaseSuccessRate: 50.0,
        matchWinningInnings: 24,
        consistencyScore: 32.1,
      }),
    },
  },
  {
    id: 'williamson',
    name: 'Kane Williamson',
    shortName: 'Williamson',
    country: 'New Zealand',
    color: '#22C55E',
    flag: '🇳🇿',
    formats: {
      ODI: buildFormatProfile('ODI', {
        battingAvg: 47.48,
        strikeRate: 81.24,
        centuries: 15,
        chaseSuccessRate: 54.1,
        matchWinningInnings: 58,
        consistencyScore: 37.8,
      }),
      TEST: buildFormatProfile('TEST', {
        battingAvg: 54.72,
        strikeRate: 51.40,
        centuries: 32,
        chaseSuccessRate: 49.0,
        matchWinningInnings: 66,
        consistencyScore: 45.4,
      }),
      T20I: buildFormatProfile('T20I', {
        battingAvg: 33.44,
        strikeRate: 123.01,
        centuries: 0,
        chaseSuccessRate: 52.0,
        matchWinningInnings: 35,
        consistencyScore: 31.0,
      }),
    },
  },
  {
    id: 'rohit',
    name: 'Rohit Sharma',
    shortName: 'Rohit',
    country: 'India',
    color: '#0284C7',
    flag: '🇮🇳',
    formats: {
      ODI: buildFormatProfile('ODI', {
        battingAvg: 49.12,
        strikeRate: 92.40,
        centuries: 31,
        chaseSuccessRate: 64.2,
        matchWinningInnings: 98,
        consistencyScore: 40.2,
      }),
      TEST: buildFormatProfile('TEST', {
        battingAvg: 44.27,
        strikeRate: 56.20,
        centuries: 12,
        chaseSuccessRate: 45.8,
        matchWinningInnings: 38,
        consistencyScore: 38.0,
      }),
      T20I: buildFormatProfile('T20I', {
        battingAvg: 32.05,
        strikeRate: 140.89,
        centuries: 5,
        chaseSuccessRate: 68.4,
        matchWinningInnings: 72,
        consistencyScore: 34.5,
      }),
    },
  },
  {
    id: 'ponting',
    name: 'Ricky Ponting',
    shortName: 'Ponting',
    country: 'Australia',
    color: '#EAB308',
    flag: '🇦🇺',
    formats: {
      ODI: buildFormatProfile('ODI', {
        battingAvg: 42.03,
        strikeRate: 80.39,
        centuries: 30,
        chaseSuccessRate: 58.2,
        matchWinningInnings: 118,
        consistencyScore: 38.2,
      }),
      TEST: buildFormatProfile('TEST', {
        battingAvg: 51.85,
        strikeRate: 58.72,
        centuries: 41,
        chaseSuccessRate: 52.1,
        matchWinningInnings: 96,
        consistencyScore: 44.5,
      }),
      T20I: buildFormatProfile('T20I', {
        battingAvg: 28.42,
        strikeRate: 132.78,
        centuries: 0,
        chaseSuccessRate: 50.0,
        matchWinningInnings: 8,
        consistencyScore: 28.0,
      }),
    },
  },
];

// Helper to construct Recharts Radar Data array for MULTIPLE selected players
export function buildMultiFormatRadarData(
  players: LegendFullProfile[],
  format: CricketFormat
) {
  const formatVal = (raw: number, isPct: boolean = false) =>
    isPct ? raw.toFixed(1) + '%' : raw > 10 ? Math.round(raw).toString() : raw.toFixed(2);

  const dimensions: { key: keyof LegendRawStats; label: string; isPct?: boolean }[] = [
    { key: 'battingAvg', label: 'Batting Average' },
    { key: 'strikeRate', label: 'Strike Rate' },
    { key: 'centuries', label: 'Centuries' },
    { key: 'chaseSuccessRate', label: 'Chase Success %', isPct: true },
    { key: 'matchWinningInnings', label: 'Match Winning Inn.' },
    { key: 'consistencyScore', label: 'Consistency Score', isPct: true },
  ];

  return dimensions.map((dim) => {
    const row: Record<string, any> = { dimension: dim.label };
    players.forEach((p) => {
      const f = p.formats[format];
      row[`${p.id}_norm`] = f.normalized[dim.key];
      row[`${p.id}_raw`] = formatVal(f.raw[dim.key], dim.isPct);
    });
    return row;
  });
}
