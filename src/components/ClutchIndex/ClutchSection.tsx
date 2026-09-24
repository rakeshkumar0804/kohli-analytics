import { useState } from 'react';
import { getClutchViewModel } from '../../analytics';
import { useIntersectionObserver } from '../../hooks';
import './ClutchSection.css';

export default function ClutchSection() {
  const [sectionRef] = useIntersectionObserver(0.15);
  const [clutchFormat, setClutchFormat] = useState<'ODI' | 'T20I' | 'Test'>('ODI');
  const [showMethodology, setShowMethodology] = useState(false);

  const viewModel = getClutchViewModel(clutchFormat);
  const perfView = viewModel.pressurePerformance;

  return (
    <section
      id="clutch-index"
      className="clutch-section"
      ref={sectionRef as React.RefObject<HTMLElement>}
      aria-label="Pressure Performance & Situational Batting Analysis"
    >
      {/* Background radial glow */}
      <div className="clutch-bg-glow" aria-hidden="true" />

      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <div className="clutch-header-top">
            <div>
              <p className="section-label">
                {clutchFormat === 'Test'
                  ? 'VERIFIED TEST SITUATIONAL ANALYSIS'
                  : `EMPIRICAL SITUATIONAL ANALYSIS (${clutchFormat} FORMAT)`}
              </p>
              <h2 className="section-title">
                {clutchFormat === 'Test' ? (
                  <>
                    TEST <span className="gold-text">PERFORMANCE</span>{' '}
                    <span className="format-badge-subtitle">(Test Cricket)</span>
                  </>
                ) : (
                  <>
                    PRESSURE <span className="gold-text">PERFORMANCE</span>{' '}
                    <span className="format-badge-subtitle">({clutchFormat})</span>
                  </>
                )}
              </h2>
            </div>

            {/* Format Toggle Pills */}
            <div
              className="format-toggle-pills"
              role="group"
              aria-label="Select format for situational performance analysis"
            >
              <span className="format-toggle-label">Format:</span>
              {(['ODI', 'T20I', 'Test'] as const).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  className={`format-pill-btn ${clutchFormat === fmt ? 'active' : ''}`}
                  aria-pressed={clutchFormat === fmt}
                  onClick={() => setClutchFormat(fmt)}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>

          <p className="section-body clutch-intro-text">
            {perfView.coverageDisclosure} Composite score not published; calibration pending. Sourced situational statistics are reported directly below without synthetic weighting.
          </p>

          {/* Compact Test Career Totals Context Line */}
          {clutchFormat === 'Test' && (
            <div className="test-compact-baseline-bar">
              <span className="baseline-dot">🏏</span>
              <span>
                <strong>Verified Test Baseline:</strong> 123 Matches · 210 Innings (13 Not Outs) · 9,230 Runs · 46.85 Batting Average · 55.58 Strike Rate · 30 Centuries (7 Double 100s)
              </span>
            </div>
          )}
        </div>

        {/* Situational Cards Grid (ODI, T20I, and Test) */}
        <div className="pressure-dashboard-block">
          <div className="pressure-cards-grid">
            {perfView.cards.map((card) => {
              const isSmallSample = card.sampleStatus === 'insufficient-sample' || card.innings < 10;
              return (
                <div
                  key={card.id}
                  className={`pressure-stat-card ${isSmallSample ? 'pressure-card--small-sample' : ''}`}
                >
                  {/* Card Header */}
                  <div className="pressure-card-top">
                    <span className="pressure-card-category">{card.category}</span>
                    <span
                      className={`pressure-sample-badge ${
                        isSmallSample ? 'badge--insufficient' : 'badge--usable'
                      }`}
                    >
                      {card.sampleBadgeText}
                    </span>
                  </div>

                  <h3 className="pressure-card-title">{card.title}</h3>

                  {/* Primary Hero Metrics */}
                  <div className="pressure-metric-hero">
                    <div className="pressure-avg-block">
                      <span className="pressure-metric-label">Batting Average</span>
                      <div className="pressure-avg-value">
                        {card.battingAvgDisplay}
                      </div>
                    </div>

                    <div className="pressure-sr-block">
                      <span className="pressure-metric-label">Strike Rate</span>
                      <div className="pressure-sr-value">{card.strikeRateDisplay}</div>
                    </div>
                  </div>

                  {/* Baseline & Elevation Comparison */}
                  <div className="pressure-elevation-row">
                    <span className="pressure-elevation-label">vs Baseline:</span>
                    <span
                      className={`pressure-elevation-value ${
                        card.isElevationPositive ? 'elevation--positive' : 'elevation--negative'
                      }`}
                    >
                      {card.elevationDisplay}
                    </span>
                    <span
                      className="pressure-baseline-context"
                      title={card.baselineScopeLabel}
                    >
                      (Base: {card.baselineAvgDisplay})
                    </span>
                  </div>

                  {/* Detailed Count Invariants Table */}
                  <div className="pressure-counts-table">
                    <div className="pressure-count-col">
                      <span className="count-label">Innings (N)</span>
                      <span className="count-val">{card.innings}</span>
                    </div>
                    <div className="pressure-count-col">
                      <span className="count-label">Runs</span>
                      <span className="count-val">{card.runs.toLocaleString()}</span>
                    </div>
                    <div className="pressure-count-col">
                      <span className="count-label">Balls</span>
                      <span className="count-val">{card.balls.toLocaleString()}</span>
                    </div>
                    <div className="pressure-count-col">
                      <span className="count-label">Dismissals</span>
                      <span className="count-val">
                        {card.dismissals}{' '}
                        <small className="not-out-tag">({card.notOuts} NO)</small>
                      </span>
                    </div>
                  </div>

                  {/* Scope & Coverage Context */}
                  <div className="pressure-card-footer">
                    <p className="pressure-scope-desc">{card.scopeDescription}</p>
                    <span className="pressure-cov-text">📁 {card.coverageLabel}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Small Navigation Links to Dedicated Sections (For Test format) */}
        {clutchFormat === 'Test' && (
          <div className="test-quick-routes-panel">
            <span className="quick-routes-title">Explore Dedicated Test Sections:</span>
            <div className="quick-routes-list">
              <a href="#captaincy-myth" className="test-quick-link">
                👑 Test Captaincy Legacy (58.82% Wins) →
              </a>
              <a
                href="#defining-innings"
                onClick={() => window.dispatchEvent(new CustomEvent('set-defining-innings-format', { detail: 'Test' }))}
                className="test-quick-link"
              >
                🏏 Defining Test Innings Gallery (Pune 254*, Adelaide 141) →
              </a>
              <a
                href="#era-engine"
                onClick={() => window.dispatchEvent(new CustomEvent('set-era-metric', { detail: 'testAvg' }))}
                className="test-quick-link"
              >
                📈 Era Engine Test Splits (Peak Avg 66.79) →
              </a>
              <a href="#career-timeline" className="test-quick-link">
                📊 Career Timeline & Double Centuries →
              </a>
            </div>
          </div>
        )}

        {/* Collapsible Methodology & Formal Calibration Panel */}
        <div className="clutch-methodology-drawer">
          <button
            type="button"
            className="methodology-drawer-btn"
            onClick={() => setShowMethodology((prev) => !prev)}
            aria-expanded={showMethodology}
          >
            <span>
              🔬 Methodology, Statistical Calibration Ledger & Overlap Analysis
            </span>
            <span className="drawer-arrow">{showMethodology ? '▲ Collapse' : '▼ Expand'}</span>
          </button>

          {showMethodology && (
            <div className="methodology-drawer-content">
              <div className="drawer-meta-bar">
                <div>
                  <span className="drawer-status-pill badge--blocked">
                    STATUS: {viewModel.calibrationStatus.toUpperCase()}
                  </span>
                  <span className="drawer-status-pill badge--null">
                    COMPOSITE SCORE NOT PUBLISHED (CALIBRATION PENDING)
                  </span>
                </div>
                <span className="drawer-verdict-text">
                  Formal Blocker: {viewModel.blockerReason}
                </span>
              </div>

              {/* Component Overlap & Multicollinearity Analysis */}
              {perfView.overlapRelations.length > 0 && (
                <div className="pressure-overlap-box" style={{ marginBottom: '1.5rem' }}>
                  <div className="overlap-box-header">
                    <span className="overlap-badge">MATHEMATICAL DISCLOSURE</span>
                    <h3 className="overlap-title">
                      Component Overlap & Containment Analysis ({clutchFormat})
                    </h3>
                  </div>

                  <div className="overlap-grid">
                    {perfView.overlapRelations.map((rel, idx) => (
                      <div key={idx} className="overlap-card">
                        <div className="overlap-card-top">
                          <span className="overlap-rel-label">{rel.label}</span>
                          <span className="overlap-rel-containment">{rel.containment}</span>
                        </div>
                        <p className="overlap-finding-text">{rel.finding}</p>
                        <div className="overlap-formula-tag">
                          <code>{rel.directionalMath}</code>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="overlap-summary-note">
                    <strong style={{ color: 'var(--gold-primary)' }}>
                      Why No Single Composite Score Is Published:
                    </strong>{' '}
                    {perfView.overlapWarning} Publishing an arbitrary weighted composite score creates false
                    precision and conceals the high variance of small samples (e.g. N=3 in T20I finals). The dashboard
                    presents verified empirical splits directly without synthetic weighting.
                  </div>
                </div>
              )}

              {/* Component Accounting Table */}
              {viewModel.components.length > 0 && (
                <div className="clutch-table-scroll">
                  <table className="clutch-spec-table">
                    <thead>
                      <tr>
                        <th>Component</th>
                        <th style={{ textAlign: 'center' }}>Innings (N)</th>
                        <th style={{ textAlign: 'center' }}>Balls</th>
                        <th style={{ textAlign: 'center' }}>Runs</th>
                        <th style={{ textAlign: 'center' }}>Dismissals</th>
                        <th style={{ textAlign: 'right' }}>Split Avg</th>
                        <th style={{ textAlign: 'right' }}>Base Avg</th>
                        <th style={{ textAlign: 'center' }}>Ratio</th>
                        <th style={{ textAlign: 'center' }}>Tanh Score</th>
                        <th style={{ textAlign: 'center' }}>Sample Gate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewModel.components.map((c) => (
                        <tr key={c.id}>
                          <td style={{ fontWeight: 600, color: '#fff' }}>{c.label}</td>
                          <td
                            style={{
                              textAlign: 'center',
                              fontFamily: 'Rajdhani',
                              fontWeight: 700,
                              color:
                                c.innings >= c.minSampleInnings
                                  ? 'var(--gold-primary)'
                                  : '#FF6B6B',
                            }}
                          >
                            {c.innings}
                          </td>
                          <td style={{ textAlign: 'center', color: 'rgba(240,240,248,0.6)' }}>
                            {c.balls}
                          </td>
                          <td style={{ textAlign: 'center', color: 'rgba(240,240,248,0.8)' }}>
                            {c.runs}
                          </td>
                          <td style={{ textAlign: 'center', color: 'rgba(240,240,248,0.6)' }}>
                            {c.dismissals}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: '#FFD700' }}>
                            {c.splitAvg !== null ? c.splitAvg.toFixed(2) : '—'}
                          </td>
                          <td style={{ textAlign: 'right', color: 'rgba(240,240,248,0.5)' }}>
                            {c.baselineAvg !== null ? c.baselineAvg.toFixed(2) : '—'}
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 700, color: '#22c55e' }}>
                            {c.ratio !== null ? `${c.ratio.toFixed(2)}x` : '—'}
                          </td>
                          <td
                            style={{
                              textAlign: 'center',
                              fontFamily: 'Rajdhani',
                              fontWeight: 700,
                              color: '#fff',
                            }}
                          >
                            {c.normalizedScore !== null ? c.normalizedScore.toFixed(1) : 'null'}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span
                              className={`gate-badge ${
                                c.status === 'usable-sample' ? 'gate--pass' : 'gate--fail'
                              }`}
                            >
                              {c.status === 'usable-sample'
                                ? `PASS (N≥${c.minSampleInnings})`
                                : `FAIL (N=${c.innings} < ${c.minSampleInnings})`}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Calibration Gates Grid */}
              <div className="calibration-gates-grid" style={{ marginBottom: '1.25rem' }}>
                {viewModel.calibrationGates.map((g) => (
                  <div key={g.gateId} className="gate-card">
                    <div className="gate-card-header">
                      <span className="gate-title">
                        Gate {g.gateId}: {g.gateName.split('(')[0]}
                      </span>
                      <span className={`gate-status ${g.passed ? 'pass' : 'blocked'}`}>
                        {g.passed ? 'PASSED' : 'BLOCKED'}
                      </span>
                    </div>
                    <p className="gate-desc">{g.finding}</p>
                  </div>
                ))}
              </div>

              {/* Peer Benchmarking Short Governance Note */}
              <div className="peer-benchmarking-notice" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '0.5rem', padding: '0.85rem 1rem' }}>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'rgba(240, 240, 248, 0.7)', lineHeight: '1.5' }}>
                  <strong style={{ color: 'var(--gold-primary)' }}>Peer Benchmarking Governance Notice:</strong> Cross-player comparative pressure scoring is withheld (Gate 2 Blocker). Constructing valid percentile rankings requires a matched multi-player delivery corpus with uniform situational definitions. Synthetic quantitative score bars are omitted until authenticated peer archives are calibrated.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
