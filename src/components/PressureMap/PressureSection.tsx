import { useState, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { getPressureMapViewModel } from '../../analytics';
import type { PressureCell, Phase } from '../../types';
import './PressureSection.css';

type PressureLevel = 'comfortable' | 'moderate' | 'stiff' | 'severe' | 'extreme';

const PHASES: Phase[] = ['powerplay', 'middle', 'death'];
const PRESSURE_LEVELS: PressureLevel[] = ['comfortable', 'moderate', 'stiff', 'severe', 'extreme'];

const PHASE_LABELS_BY_FORMAT: Record<'ODI' | 'T20I' | 'Test', Record<Phase, string>> = {
  ODI: {
    powerplay: 'Powerplay (Overs 1–10)',
    middle:    'Middle (Overs 11–40)',
    death:     'Death (Overs 41–50)',
  },
  T20I: {
    powerplay: 'Powerplay (Overs 1–6)',
    middle:    'Middle (Overs 7–15)',
    death:     'Death (Overs 16–20)',
  },
  Test: {
    powerplay: 'New Ball (Overs 1–20)',
    middle:    'Middle (Overs 21–80)',
    death:     '2nd New Ball (Overs 81+)',
  },
};


const PRESSURE_LABELS: Record<PressureLevel, string> = {
  comfortable: 'Comfortable\n<6 rpo',
  moderate:    'Moderate\n6–8 rpo',
  stiff:       'Stiff\n8–10 rpo',
  severe:      'Severe\n10–12 rpo',
  extreme:     'Extreme\n>12 rpo',
};

const SAMPLE_SIZE_LABELS: Record<'insufficient' | 'limited' | 'usable' | 'strong', string> = {
  insufficient: 'Insufficient Sample (<12 balls)',
  limited:      'Limited Sample (12–29 balls)',
  usable:       'Usable Sample (30–59 balls)',
  strong:       'Strong Sample (≥60 balls)',
};

interface TooltipState {
  cell: PressureCell;
  x: number;
  y: number;
}

export default function PressureSection() {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [pressureFormat, setPressureFormat] = useState<'ODI' | 'Test' | 'T20I'>('ODI');
  const sectionRef = useRef<HTMLElement>(null);

  const viewModel = getPressureMapViewModel(pressureFormat);
  const activeData = viewModel.cells;

  // Color scale: dark → red → gold
  const minAvg = Math.max(0, viewModel.minAvg);
  const maxAvg = Math.max(minAvg + 10, viewModel.maxAvg);
  const colorScale = d3.scaleSequential()
    .domain([minAvg, maxAvg])
    .interpolator(d3.interpolateRgbBasis(['#0d0d1a', '#4a1020', '#C8102E', '#e8a020', '#FFD700']));

  // IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.25 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const getCell = (phase: Phase, pressure: PressureLevel): PressureCell | undefined =>
    activeData.find((c) => c.phase === phase && c.pressureLevel === pressure);

  const phaseLabels = PHASE_LABELS_BY_FORMAT[pressureFormat];

  // Dynamic peak cell calculation
  const validCells = activeData.filter((c) => (c.ballsFaced ?? 0) >= 12 && c.average !== null && c.average > 0);
  const peakCell = validCells.length > 0
    ? validCells.reduce((prev, current) => ((prev.average ?? 0) > (current.average ?? 0) ? prev : current), validCells[0])
    : null;

  return (
    <section id="pressure-map" className="pressure-section" ref={sectionRef}>
      <div className="pressure-bg-glow" aria-hidden="true" />

      <div className="container">
        {/* Header */}
        <div className="section-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <p className="section-label">{viewModel.warningLabel}</p>
              <h2 className="section-title">PRESSURE <span className="text-red">MAP</span> <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>({pressureFormat})</span></h2>
            </div>

            {/* Format Toggle Pills */}
            <div className="format-toggle-pills" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(0,0,0,0.4)', padding: '0.3rem 0.6rem', borderRadius: '2rem', border: '1px solid var(--glass-border)' }}>
              <span style={{ fontFamily: 'Rajdhani', fontSize: '0.78rem', fontWeight: 700, color: 'var(--gold-primary)', textTransform: 'uppercase', marginRight: '0.3rem' }}>Format:</span>
              {(['ODI', 'Test', 'T20I'] as const).map((fmt) => (
                <button
                  key={fmt}
                  className={`format-pill-btn ${pressureFormat === fmt ? 'active' : ''}`}
                  style={{
                    background: pressureFormat === fmt ? 'var(--red-primary)' : 'transparent',
                    color: pressureFormat === fmt ? '#fff' : 'var(--text-muted)',
                    border: 'none',
                    fontFamily: 'Rajdhani',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    padding: '0.3rem 0.9rem',
                    borderRadius: '1.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => setPressureFormat(fmt)}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>

          <p className="section-body" style={{ marginTop: '1rem' }}>
            Calculated from available Cricsheet ball-by-ball coverage: 429 of 439 reference matches. Career aggregates are independently reconciled; delivery-level situational results exclude unavailable matches.
          </p>
        </div>

        <div className="pressure-layout">
          {/* Left: Narrative */}
          <div className="pressure-narrative">
            <div className="narrative-block">
              <div className="narrative-icon">⚡</div>
              <h3>What is Required Run Rate?</h3>
              <p>
                RRR is the runs per over India needs when Kohli bats in run chases. The higher the RRR, the more
                pressure he faces. This production matrix segments his delivery performance across 15 distinct phase × RRR situations.
              </p>
            </div>
            <div className="narrative-block">
              <div className="narrative-icon">🎯</div>
              <h3>The Golden Zone</h3>
              <p>
                {peakCell && peakCell.average !== null
                  ? `Kohli's ${phaseLabels[peakCell.phase]} / ${peakCell.rrrRange} cell averages a staggering ${peakCell.average.toFixed(1)} across ${peakCell.innings} innings (${peakCell.ballsFaced ?? 0} balls).`
                  : `Kohli's middle-overs moderate pressure cell is historically higher than most world-class batters' career averages.`}
              </p>
            </div>
            <div className="narrative-block">
              <div className="narrative-icon">🔥</div>
              <h3>Death Over Acceleration</h3>
              <p>
                In severe and extreme pressure bands (&gt;10 RRR) at the death, he maintains elite boundary acceleration, keeping dismissals controlled while elevating strike rates.
              </p>
            </div>

            {/* Color Legend */}
            <div className="pressure-legend">
              <div className="legend-bar-gradient" />
              <div className="legend-labels">
                <span>{minAvg.toFixed(0)}</span>
                <span>Avg →</span>
                <span>{maxAvg.toFixed(0)}</span>
              </div>
            </div>
          </div>

          {/* Right: Heatmap or Unsupported Format Message */}
          {pressureFormat === 'Test' ? (
            <div className="pressure-heatmap-wrapper unsupported-format-card">
              <div style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🏏</div>
                <h3 style={{ fontFamily: 'Rajdhani', fontSize: '1.4rem', fontWeight: 700, color: 'var(--gold-primary)', marginBottom: '0.8rem' }}>
                  TEST FORMAT SITUATIONAL MODEL
                </h3>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto', fontSize: '0.92rem', lineHeight: '1.6' }}>
                  Test cricket situational pressure is governed by match sessions, pitch deterioration, and innings declarations rather than limited-overs Required Run Rates. The 15-cell RRR grid applies exclusively to ODI and T20I chases.
                </p>
                <div style={{ marginTop: '1.5rem', display: 'inline-block', padding: '0.4rem 1rem', background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.3)', borderRadius: '2rem', fontSize: '0.8rem', color: 'var(--gold-primary)' }}>
                  Status: unsupported-format (Option B policy)
                </div>
              </div>
            </div>
          ) : (
            <div className="pressure-heatmap-wrapper">
              {/* X-axis labels */}
              <div className="heatmap-x-labels">
                {PRESSURE_LEVELS.map((p) => (
                  <div key={p} className="x-label" data-column-header="true">
                    {PRESSURE_LABELS[p].split('\n').map((line, i) => (
                      <span key={i} style={{ display: 'block', fontSize: i === 0 ? '0.78rem' : '0.65rem', opacity: i === 0 ? 1 : 0.55 }}>
                        {line}
                      </span>
                    ))}
                  </div>
                ))}
              </div>

              <div className="heatmap-grid-row">
                {/* Y-axis labels */}
                <div className="heatmap-y-labels">
                  {PHASES.map((phase) => (
                    <div key={phase} className="y-label" data-phase-header="true">
                      {phaseLabels[phase]}
                    </div>
                  ))}
                </div>

                {/* Grid */}
                <div className="heatmap-grid">
                  {PHASES.map((phase, row) =>
                    PRESSURE_LEVELS.map((pressure, col) => {
                      const cell = getCell(phase, pressure);
                      if (!cell) return null;
                      const isInsufficient = (cell.ballsFaced ?? 0) < 12 || cell.sampleSizeBand === 'insufficient';
                      const bg = isInsufficient
                        ? 'rgba(20, 20, 35, 0.6)'
                        : cell.average !== null
                        ? colorScale(cell.average)
                        : 'rgba(30, 30, 45, 0.8)';
                      const isHigh = !isInsufficient && cell.average !== null && cell.average > 75;
                      const delay = (row * 5 + col) * 50;

                      const handleOpenTooltip = (e: React.MouseEvent | React.FocusEvent) => {
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        setTooltip({ cell, x: rect.left + rect.width / 2, y: rect.top });
                      };

                      const avgLabel = cell.average !== null
                        ? `Batting avg ${cell.average.toFixed(1)}`
                        : 'Batting average unavailable — no dismissals in this sample';

                      return (
                        <div
                          key={`${phase}-${pressure}`}
                          className={`heatmap-cell ${isInsufficient ? 'cell--insufficient' : ''}`}
                          data-analytical-cell="true"
                          data-cell-type="data"
                          data-phase={phase}
                          data-pressure={pressure}
                          style={{
                            background: bg,
                            border: isInsufficient ? '1px dashed rgba(255,255,255,0.12)' : '1px solid rgba(255,255,255,0.08)',
                            opacity: isVisible ? 1 : 0,
                            transform: isVisible ? 'scale(1)' : 'scale(0.8)',
                            transition: `opacity 0.4s ease ${delay}ms, transform 0.4s cubic-bezier(0.34,1.56,0.64,1) ${delay}ms`,
                          }}
                          onMouseEnter={handleOpenTooltip}
                          onMouseLeave={() => setTooltip(null)}
                          onFocus={handleOpenTooltip}
                          onBlur={() => setTooltip(null)}
                          role="gridcell"
                          aria-label={`${phaseLabels[phase]}, ${PRESSURE_LABELS[pressure].replace('\n', ' ')}: ${isInsufficient ? 'Insufficient sample size' : `${avgLabel}, Batting SR ${cell.strikeRate.toFixed(1)}, Balls faced ${cell.ballsFaced ?? 0}`}`}
                          tabIndex={0}
                        >
                          {isInsufficient ? (
                            <>
                              <span className="cell-insufficient-label">INSUFFICIENT</span>
                              <span className="cell-innings" style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.62rem' }}>
                                {cell.ballsFaced ?? 0}b faced ({cell.innings} inn)
                              </span>
                            </>
                          ) : (
                            <>
                              <span
                                className="cell-avg"
                                style={{ color: isHigh ? '#000' : '#fff', textShadow: isHigh ? 'none' : '0 1px 3px rgba(0,0,0,0.8)' }}
                              >
                                {cell.average !== null ? cell.average.toFixed(1) : '—'}
                              </span>
                              <span
                                className="cell-innings"
                                style={{ color: isHigh ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.45)' }}
                              >
                                {cell.ballsFaced ?? 0}b faced · {cell.innings} inn
                              </span>
                            </>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Annotations */}
              <div className="heatmap-annotations">
                <div className="annotation annotation--gold">
                  <span className="annotation-dot" />
                  <span>
                    🏆 Peak Production Zone: {peakCell && peakCell.average !== null ? `${phaseLabels[peakCell.phase]} / ${peakCell.rrrRange} — avg ${peakCell.average.toFixed(1)} (${peakCell.strikeRate.toFixed(1)} SR)` : 'Middle / Moderate'}
                  </span>
                </div>
                <div className="annotation annotation--red">
                  <span className="annotation-dot" />
                  <span>
                    ⚡ Full 15-cell coverage derived strictly from verified Cricsheet ball-by-ball archive.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="pressure-tooltip"
          style={{
            position: 'fixed',
            left: tooltip.x,
            top: tooltip.y - 8,
            transform: 'translate(-50%, -100%)',
            zIndex: 200,
          }}
          role="tooltip"
        >
          <div className="tooltip-phase">{phaseLabels[tooltip.cell.phase]}</div>
          <div className="tooltip-pressure">{tooltip.cell.rrrRange}</div>

          <div className="tooltip-row">
            <span>Batting Average</span>
            <strong style={{ color: '#FFD700' }}>{tooltip.cell.average !== null ? tooltip.cell.average.toFixed(1) : '—'}</strong>
          </div>
          {tooltip.cell.average === null && (
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '0.3rem' }}>
              Batting average unavailable — no dismissals in this sample.
            </div>
          )}
          <div className="tooltip-row">
            <span>Batting Strike Rate</span>
            <strong>{(tooltip.cell.battingStrikeRate ?? tooltip.cell.strikeRate) > 0 ? (tooltip.cell.battingStrikeRate ?? tooltip.cell.strikeRate).toFixed(1) : '—'}</strong>
          </div>
          <div className="tooltip-row">
            <span>Balls Faced</span>
            <strong>{tooltip.cell.officialBatterBallsFaced ?? tooltip.cell.ballsFaced ?? 0} balls faced</strong>
          </div>
          {tooltip.cell.teamLegalDeliveries !== undefined && (
            <div className="tooltip-row">
              <span>Team Legal Balls</span>
              <strong>{tooltip.cell.teamLegalDeliveries} legal balls</strong>
            </div>
          )}
          <div className="tooltip-row">
            <span>Innings</span>
            <strong>{tooltip.cell.innings} inn</strong>
          </div>
          {tooltip.cell.runs !== undefined && (
            <div className="tooltip-row">
              <span>Runs / Dismissals</span>
              <strong>{tooltip.cell.runs} r / {tooltip.cell.dismissals ?? 0} w</strong>
            </div>
          )}
          {tooltip.cell.fours !== undefined && (
            <div className="tooltip-row">
              <span>Boundaries</span>
              <strong>{tooltip.cell.fours}x4 · {tooltip.cell.sixes ?? 0}x6</strong>
            </div>
          )}
          {tooltip.cell.dotBallPercentage !== undefined && (
            <div className="tooltip-row">
              <span>Dot Ball %</span>
              <strong>{tooltip.cell.dotBallPercentage.toFixed(1)}%</strong>
            </div>
          )}
          {tooltip.cell.boundaryPercentage !== undefined && (
            <div className="tooltip-row">
              <span>Boundary Run %</span>
              <strong>{tooltip.cell.boundaryPercentage.toFixed(1)}%</strong>
            </div>
          )}

          <div className="tooltip-sample-badge" style={{ marginTop: '0.4rem', paddingTop: '0.3rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.72rem', color: (tooltip.cell.ballsFaced ?? 0) < 12 ? '#f87171' : 'var(--text-muted)' }}>
            📊 {SAMPLE_SIZE_LABELS[tooltip.cell.sampleSizeBand ?? ((tooltip.cell.ballsFaced ?? 0) < 12 ? 'insufficient' : 'usable')]}
          </div>

          {tooltip.cell.famousKnock && (
            <div className="tooltip-knock">
              🎯 {tooltip.cell.famousKnock}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
