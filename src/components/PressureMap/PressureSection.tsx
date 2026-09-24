import { useState, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { getPressureMapViewModel } from '../../analytics';
import { TEST_SITUATIONAL_SPLITS, TEST_CAREER_BASELINE } from '../../data/testSituationalData';
import type { PressureCell, Phase } from '../../types';
import './PressureSection.css';

type PressureLevel = 'comfortable' | 'moderate' | 'stiff' | 'severe' | 'extreme' | 'mountain';

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
  mountain:    'Mountain\n>12 rpo',
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
              <p className="section-label">
                {pressureFormat === 'Test'
                  ? 'VERIFIED TEST SITUATIONAL ANALYSIS'
                  : viewModel.warningLabel}
              </p>
              <h2 className="section-title">
                {pressureFormat === 'Test' ? (
                  <>
                    TEST MATCH <span className="text-red">PERFORMANCE</span>{' '}
                    <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>(TEST CRICKET)</span>
                  </>
                ) : (
                  <>
                    PRESSURE <span className="text-red">MAP</span>{' '}
                    <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>({pressureFormat})</span>
                  </>
                )}
              </h2>
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
            {pressureFormat === 'Test'
              ? 'Test match cricket is analyzed across 123 matches and 210 batting innings using sourced situational splits (1st vs 2nd team innings, home vs away, 4th innings pursuit, and match outcomes). Excluded from limited-overs target RRR models.'
              : 'Calculated from available Cricsheet ball-by-ball coverage: 429 of 439 limited-overs reference matches (311/314 ODI + 118/125 T20I). Test cricket is analyzed through verified career scorecards.'}
          </p>

          {/* Compact Test Context Line */}
          {pressureFormat === 'Test' && (
            <div style={{ marginTop: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,215,0,0.07)', border: '1px solid rgba(255,215,0,0.25)', borderRadius: '2rem', padding: '0.4rem 1.25rem', fontSize: '0.82rem', color: 'rgba(240,240,248,0.9)' }}>
              <span>🏏</span>
              <span>
                <strong style={{ color: 'var(--gold-primary)', fontFamily: 'Rajdhani', fontSize: '0.88rem' }}>Verified Test Baseline:</strong> 123 Matches · 210 Innings (13 Not Outs) · 9,230 Runs · 46.85 Avg · 55.58 SR · 30 Centuries (7 Double 100s)
              </span>
            </div>
          )}
        </div>

        <div className="pressure-layout">
          {/* Left: Format-Aware Narrative */}
          <div className="pressure-narrative">
            {pressureFormat === 'Test' ? (
              <>
                <div className="narrative-block">
                  <div className="narrative-icon">🏏</div>
                  <h3>Test Match Dynamics</h3>
                  <p>
                    Test cricket is governed by 5-day match duration, session-by-session tactical dynamics, pitch deterioration, and declaration strategy rather than limited-overs Required Run Rates.
                  </p>
                </div>
                <div className="narrative-block">
                  <div className="narrative-icon">📈</div>
                  <h3>Peak Era Mastery (66.79 Avg)</h3>
                  <p>
                    During his 2016–2019 peak era, Kohli scored 4,208 runs at 66.79 in Tests with 16 centuries and 7 double hundreds (Career-best 254* vs South Africa at Pune).
                  </p>
                </div>
                <div className="narrative-block">
                  <div className="narrative-icon">👑</div>
                  <h3>Elite Test Leadership</h3>
                  <p>
                    40 wins in 68 Tests as captain (58.82% win rate), 42 consecutive months at World No. 1, and 15 overseas victories including India's historic first-ever Test series win in Australia (2018/19).
                  </p>
                </div>
                <div className="test-disclosure-note" style={{ background: 'rgba(255,215,0,0.05)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: '0.5rem', padding: '0.75rem', fontSize: '0.78rem', color: 'rgba(240,240,248,0.7)', lineHeight: '1.4' }}>
                  📁 <strong>Scope Notice:</strong> Test cricket is excluded from limited-overs RRR models. Sourced from official ESPNcricinfo Statsguru database (Player ID: 253802).
                </div>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>

          {/* Right: Heatmap (ODI/T20I) or Test Situational Split Cards (Test) */}
          {pressureFormat === 'Test' ? (
            <div className="pressure-heatmap-wrapper test-situational-splits-wrapper" style={{ padding: '1.25rem' }}>
              <div style={{ marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
                <span style={{ fontFamily: 'Rajdhani', fontSize: '0.75rem', fontWeight: 700, color: 'var(--gold-primary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  TEST SITUATIONAL SPLITS MATRIX
                </span>
                <h3 style={{ fontFamily: 'Rajdhani', fontSize: '1.2rem', fontWeight: 800, color: '#fff', margin: '0.2rem 0 0' }}>
                  Condition, Innings & Result Breakdowns
                </h3>
              </div>

              {/* Grid of Key Test Splits */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.85rem' }}>
                {TEST_SITUATIONAL_SPLITS.map((split) => {
                  const baseAvg = TEST_CAREER_BASELINE.battingAvg;
                  const diff = Number((((split.battingAvg - baseAvg) / baseAvg) * 100).toFixed(1));
                  const isPositive = diff >= 0;
                  return (
                    <div
                      key={split.id}
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: '0.6rem',
                        padding: '0.85rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontFamily: 'Rajdhani', fontSize: '0.72rem', fontWeight: 700, color: 'var(--gold-primary)', textTransform: 'uppercase' }}>
                          {split.category}
                        </span>
                        <span style={{ fontFamily: 'Rajdhani', fontSize: '0.7rem', fontWeight: 700, color: '#4ade80', background: 'rgba(34,197,94,0.1)', padding: '0.1rem 0.4rem', borderRadius: '0.3rem' }}>
                          N={split.innings} inn
                        </span>
                      </div>

                      <h4 style={{ fontFamily: 'Rajdhani', fontSize: '1.05rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                        {split.title}
                      </h4>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', background: 'rgba(0,0,0,0.25)', padding: '0.5rem 0.75rem', borderRadius: '0.4rem' }}>
                        <div>
                          <span style={{ display: 'block', fontSize: '0.65rem', color: 'rgba(240,240,248,0.5)', textTransform: 'uppercase', fontFamily: 'Rajdhani', fontWeight: 700 }}>
                            Batting Avg
                          </span>
                          <span style={{ fontFamily: 'Bebas Neue', fontSize: '1.6rem', color: 'var(--gold-primary)', lineHeight: 1 }}>
                            {split.battingAvg.toFixed(2)}
                          </span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ display: 'block', fontSize: '0.65rem', color: 'rgba(240,240,248,0.5)', textTransform: 'uppercase', fontFamily: 'Rajdhani', fontWeight: 700 }}>
                            Strike Rate
                          </span>
                          <span style={{ fontFamily: 'Rajdhani', fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>
                            {split.strikeRate.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'rgba(240,240,248,0.6)' }}>
                        <span>vs Base ({baseAvg}):</span>
                        <strong style={{ color: isPositive ? '#4ade80' : '#f87171' }}>
                          {isPositive ? `+${diff}%` : `${diff}%`}
                        </strong>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.25rem', background: 'rgba(255,255,255,0.02)', padding: '0.35rem', borderRadius: '0.3rem', textAlign: 'center', fontSize: '0.72rem' }}>
                        <div>
                          <span style={{ display: 'block', color: 'rgba(240,240,248,0.4)', fontSize: '0.62rem' }}>Runs</span>
                          <strong style={{ color: '#fff' }}>{split.runs.toLocaleString()}</strong>
                        </div>
                        <div>
                          <span style={{ display: 'block', color: 'rgba(240,240,248,0.4)', fontSize: '0.62rem' }}>Balls</span>
                          <strong style={{ color: '#fff' }}>{split.balls.toLocaleString()}</strong>
                        </div>
                        <div>
                          <span style={{ display: 'block', color: 'rgba(240,240,248,0.4)', fontSize: '0.62rem' }}>100s / 50s</span>
                          <strong style={{ color: '#FFD700' }}>{split.centuries} / {split.fifties}</strong>
                        </div>
                      </div>

                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.35rem', fontSize: '0.7rem', color: 'rgba(240,240,248,0.5)' }}>
                        📁 {split.coverageLabel}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick links below Test analysis */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.6rem', flexWrap: 'wrap', marginTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.75rem' }}>
                <a
                  href="#captaincy-myth"
                  style={{ color: '#fff', background: 'rgba(200,16,46,0.2)', border: '1px solid rgba(200,16,46,0.4)', padding: '0.35rem 0.85rem', borderRadius: '1.5rem', textDecoration: 'none', fontSize: '0.78rem', fontFamily: 'Rajdhani', fontWeight: 700 }}
                >
                  👑 Test Captaincy Legacy (58.82% Wins) →
                </a>
                <a
                  href="#defining-innings"
                  onClick={() => window.dispatchEvent(new CustomEvent('set-defining-innings-format', { detail: 'Test' }))}
                  style={{ color: '#fff', background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.3)', padding: '0.35rem 0.85rem', borderRadius: '1.5rem', textDecoration: 'none', fontSize: '0.78rem', fontFamily: 'Rajdhani', fontWeight: 700 }}
                >
                  🏏 Defining Test Innings (Pune 254*, Adelaide 141) →
                </a>
                <a
                  href="#era-engine"
                  onClick={() => window.dispatchEvent(new CustomEvent('set-era-metric', { detail: 'testAvg' }))}
                  style={{ color: '#fff', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', padding: '0.35rem 0.85rem', borderRadius: '1.5rem', textDecoration: 'none', fontSize: '0.78rem', fontFamily: 'Rajdhani', fontWeight: 700 }}
                >
                  📈 Era Engine Test Splits (Peak Avg 66.79) →
                </a>
                <a
                  href="#career-timeline"
                  style={{ color: '#fff', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', padding: '0.35rem 0.85rem', borderRadius: '1.5rem', textDecoration: 'none', fontSize: '0.78rem', fontFamily: 'Rajdhani', fontWeight: 700 }}
                >
                  📊 Career Timeline & Double Hundreds →
                </a>
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
            </div>
          )}
        </div>

        {/* Floating Tooltip */}
        {tooltip && tooltip.cell && (
          <div
            className="pressure-tooltip"
            style={{
              position: 'fixed',
              left: `${tooltip.x}px`,
              top: `${tooltip.y - 12}px`,
              transform: 'translate(-50%, -100%)',
              zIndex: 1000,
              pointerEvents: 'none',
            }}
          >
            <div className="tooltip-header">
              <span className="tooltip-phase">{phaseLabels[tooltip.cell.phase]}</span>
              <span className="tooltip-rrr">{PRESSURE_LABELS[tooltip.cell.pressureLevel]?.replace('\n', ' ') || tooltip.cell.pressureLevel}</span>
            </div>
            <div className="tooltip-stats">
              <div className="tooltip-stat">
                <span className="stat-label">Batting Avg</span>
                <span className="stat-value">{tooltip.cell.average !== null ? tooltip.cell.average.toFixed(1) : 'N/A (0 out)'}</span>
              </div>
              <div className="tooltip-stat">
                <span className="stat-label">Batting SR</span>
                <span className="stat-value">{tooltip.cell.strikeRate.toFixed(1)}</span>
              </div>
              <div className="tooltip-stat">
                <span className="stat-label">Balls Faced</span>
                <span className="stat-value">{tooltip.cell.ballsFaced ?? 0}</span>
              </div>
              <div className="tooltip-stat">
                <span className="stat-label">Innings</span>
                <span className="stat-value">{tooltip.cell.innings}</span>
              </div>
              <div className="tooltip-stat">
                <span className="stat-label">Runs</span>
                <span className="stat-value">{tooltip.cell.runs}</span>
              </div>
              <div className="tooltip-stat">
                <span className="stat-label">Dismissals</span>
                <span className="stat-value">{tooltip.cell.dismissals}</span>
              </div>
            </div>
            <div className="tooltip-scope-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '0.4rem', paddingTop: '0.3rem', fontSize: '0.68rem', color: 'rgba(255,215,0,0.8)' }}>
              <span>Sample: {tooltip.cell.ballsFaced ?? 0} legal deliveries faced · {tooltip.cell.innings} innings</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
