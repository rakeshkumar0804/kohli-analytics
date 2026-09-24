import { useState } from 'react';
import { legendsClutch } from '../../data/kohliData';
import { getClutchViewModel } from '../../analytics';
import { useIntersectionObserver } from '../../hooks';
import './ClutchSection.css';

export default function ClutchSection() {
  const [sectionRef] = useIntersectionObserver(0.15);
  const [clutchFormat, setClutchFormat] = useState<'ODI' | 'T20I' | 'Test'>('ODI');
  const [showResearchSpec, setShowResearchSpec] = useState(false);

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
              <p className="section-label">EMPIRICAL SITUATIONAL ANALYSIS ({clutchFormat} FORMAT)</p>
              <h2 className="section-title">
                PRESSURE <span className="gold-text">PERFORMANCE</span>{' '}
                <span className="format-badge-subtitle">({clutchFormat})</span>
              </h2>
            </div>

            {/* Format Toggle Pills */}
            <div
              className="format-toggle-pills"
              role="group"
              aria-label="Select format for pressure performance analysis"
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
            {perfView.coverageDisclosure} Composite score not published; calibration pending due to terminal sample sizes and component overlap. Supported empirical statistics are reported directly below without synthetic weighting.
          </p>
        </div>

        {/* Format-Specific Situational Cards Grid */}
        {perfView.isApplicable ? (
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

            {/* Plain-Language Multicollinearity & Overlap Matrix */}
            <div className="pressure-overlap-box">
              <div className="overlap-box-header">
                <span className="overlap-badge">MATHEMATICAL DISCLOSURE</span>
                <h3 className="overlap-title">
                  Component Overlap & Multicollinearity Analysis ({clutchFormat})
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
                {perfView.overlapWarning} Publishing an arbitrary weighted score or letter grade creates false
                precision and conceals the high variance of small samples (e.g. N=3 in T20I finals). The dashboard
                therefore presents verified empirical splits directly.
              </div>
            </div>
          </div>
        ) : (
          /* Test Cricket Scope Card */
          <div className="test-scope-card">
            <div className="test-scope-icon" aria-hidden="true">
              🏏
            </div>
            <h3 className="test-scope-title">Test Cricket Pressure & Performance Hub</h3>
            <p className="test-scope-text">
              Test match cricket is governed by 5-day match duration, session-by-session tactical dynamics, pitch deterioration, and declaration strategy rather than limited-overs Required Run Rates. Sourced and verified Test performance is analyzed across the dedicated sections below:
            </p>
            <div className="test-career-pill" style={{ marginBottom: '1.25rem' }}>
              {perfView.careerAggregatesNote}
            </div>

            <div className="test-routes-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginTop: '1rem' }}>
              <a href="#captaincy-myth" style={{ display: 'block', padding: '0.75rem 1rem', background: 'rgba(200,16,46,0.15)', border: '1px solid rgba(200,16,46,0.35)', borderRadius: '0.5rem', textDecoration: 'none', color: '#fff', textAlign: 'left' }}>
                <span style={{ display: 'block', fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '0.9rem', color: '#FFD700' }}>👑 Test Captaincy Legacy</span>
                <span style={{ display: 'block', fontSize: '0.78rem', color: 'rgba(240,240,248,0.7)', marginTop: '0.2rem' }}>40 wins in 68 Tests (58.82% win rate), 42 months World #1</span>
              </a>

              <a
                href="#defining-innings"
                onClick={() => window.dispatchEvent(new CustomEvent('set-defining-innings-format', { detail: 'Test' }))}
                style={{ display: 'block', padding: '0.75rem 1rem', background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.25)', borderRadius: '0.5rem', textDecoration: 'none', color: '#fff', textAlign: 'left' }}
              >
                <span style={{ display: 'block', fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '0.9rem', color: '#FFD700' }}>🏏 Defining Test Innings</span>
                <span style={{ display: 'block', fontSize: '0.78rem', color: 'rgba(240,240,248,0.7)', marginTop: '0.2rem' }}>Pune 254*, Edgbaston 149, Adelaide 141 (verified primary scorecards)</span>
              </a>

              <a
                href="#era-engine"
                onClick={() => window.dispatchEvent(new CustomEvent('set-era-metric', { detail: 'testAvg' }))}
                style={{ display: 'block', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.5rem', textDecoration: 'none', color: '#fff', textAlign: 'left' }}
              >
                <span style={{ display: 'block', fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '0.9rem', color: '#FFD700' }}>📈 Era Engine & Opponents</span>
                <span style={{ display: 'block', fontSize: '0.78rem', color: 'rgba(240,240,248,0.7)', marginTop: '0.2rem' }}>Peak Era (2016–19) Test avg 66.79; 2,042 runs vs Australia</span>
              </a>

              <a href="#career-timeline" style={{ display: 'block', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.5rem', textDecoration: 'none', color: '#fff', textAlign: 'left' }}>
                <span style={{ display: 'block', fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '0.9rem', color: '#FFD700' }}>📊 Career Milestones</span>
                <span style={{ display: 'block', fontSize: '0.78rem', color: 'rgba(240,240,248,0.7)', marginTop: '0.2rem' }}>Historical trajectory, 7 Test double hundreds, SENA series wins</span>
              </a>
            </div>
          </div>
        )}

        {/* Collapsible Research & Formal Calibration Ledger Accordion */}
        <div className="clutch-research-drawer">
          <button
            type="button"
            className="research-drawer-btn"
            onClick={() => setShowResearchSpec((prev) => !prev)}
            aria-expanded={showResearchSpec}
          >
            <span>
              🔬 Formal Statistical Calibration Ledger & Model Spec v{viewModel.modelVersion} (
              {viewModel.calibrationStatus.toUpperCase()})
            </span>
            <span className="drawer-arrow">{showResearchSpec ? '▲ Collapse' : '▼ Expand'}</span>
          </button>

          {showResearchSpec && (
            <div className="research-drawer-content">
              <div className="drawer-meta-bar">
                <div>
                  <span className="drawer-status-pill badge--blocked">
                    STATUS: {viewModel.calibrationStatus.toUpperCase()}
                  </span>
                  <span className="drawer-status-pill badge--null">COMPOSITE SCORE NOT PUBLISHED (CALIBRATION PENDING)</span>
                </div>
                <span className="drawer-verdict-text">
                  Formal Blocker: {viewModel.blockerReason}
                </span>
              </div>

              {/* Component Accounting Table */}
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

              {/* Calibration Gates Grid */}
              <div className="calibration-gates-grid">
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
            </div>
          )}
        </div>

        <div className="divider" />

        {/* Legends Benchmark */}
        <div className="clutch-legends">
          <h3 className="clutch-legends-title">
            Cross-Player Peer Benchmarking (Withheld — Gate 2 Blocker)
          </h3>
          <div className="peer-withheld-card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '1.25rem' }}>
            <p style={{ fontSize: '0.86rem', color: 'rgba(240,240,248,0.75)', lineHeight: '1.5', margin: 0 }}>
              <strong style={{ color: 'var(--gold-primary)' }}>Scientific Governance Notice:</strong> Comparative cross-player pressure scoring is withheld. Constructing valid percentile rankings requires a matched multi-player delivery corpus with uniform situational definitions. Synthetic quantitative bars are removed to prevent false precision until authenticated peer archives are calibrated.
            </p>
          </div>
          <div className="legends-peers-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
            {legendsClutch.map((legend) => {
              const isKohli = legend.name === 'Kohli';
              return (
                <div key={legend.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: isKohli ? 'rgba(200,16,46,0.15)' : 'rgba(255,255,255,0.03)', border: isKohli ? '1px solid rgba(200,16,46,0.4)' : '1px solid rgba(255,255,255,0.06)', borderRadius: '0.5rem' }}>
                  <span className={`legend-name ${isKohli ? 'legend-name--kohli' : ''}`} style={{ fontWeight: isKohli ? 700 : 600, color: isKohli ? '#FFD700' : 'rgba(240,240,248,0.85)' }}>
                    {isKohli && '👑 '}{legend.name}
                  </span>
                  <span style={{ fontSize: '0.72rem', fontFamily: 'Rajdhani', fontWeight: 700, color: 'rgba(240,240,248,0.5)', background: 'rgba(0,0,0,0.3)', padding: '0.15rem 0.5rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.08)' }}>
                    Score Withheld
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
