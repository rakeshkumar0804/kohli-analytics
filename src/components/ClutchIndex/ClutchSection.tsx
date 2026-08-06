import { useState, useEffect } from 'react';
import { clutchMetricsByFormat, legendsClutch } from '../../data/kohliData';
import { useCountUp, useIntersectionObserver } from '../../hooks';
import './ClutchSection.css';

const BREAKDOWN_ITEMS = [
  {
    label: 'Chase Dominance',
    weight: 35,
    value: 65.0,
    baseline: 52.3,
    unit: 'avg',
    color: '#C8102E',
    description: 'ODI batting average while chasing vs baseline',
  },
  {
    label: 'Knockout Elevation',
    weight: 25,
    value: 68.4,
    baseline: 52.3,
    unit: 'avg',
    color: '#e07b39',
    description: 'ICC knockout match average',
  },
  {
    label: 'Finals Performance',
    weight: 20,
    value: 71.2,
    baseline: 52.3,
    unit: 'avg',
    color: '#FFD700',
    description: 'Tournament finals batting average',
  },
  {
    label: 'SR Pressure Boost',
    weight: 20,
    value: 93.4,
    baseline: 87.2,
    unit: 'SR',
    color: '#22c55e',
    description: 'Chase strike rate vs baseline strike rate',
  },
];

// Animated SVG Clutch Ring
function ClutchRing({ index, isVisible }: { index: number; isVisible: boolean }) {
  const radius = 130;
  const circumference = 2 * Math.PI * radius;
  const fillAmount = (index / 100) * circumference;
  const dashOffset = circumference - fillAmount;

  const { count } = useCountUp({
    target: index,
    duration: 2500,
    decimals: 1,
    startOnVisible: false,
  });

  const [animatedOffset, setAnimatedOffset] = useState(circumference);

  useEffect(() => {
    if (!isVisible) return;
    const timer = setTimeout(() => setAnimatedOffset(dashOffset), 100);
    return () => clearTimeout(timer);
  }, [isVisible, dashOffset]);

  return (
    <div className="clutch-ring-wrapper">
      <svg viewBox="0 0 300 300" className="clutch-ring-svg" aria-label={`Clutch Index score: ${index}`}>
        <defs>
          <linearGradient id="clutchGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C8102E" />
            <stop offset="100%" stopColor="#FFD700" />
          </linearGradient>
          <filter id="ringGlow">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Track ring */}
        <circle cx="150" cy="150" r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="12"
        />

        {/* Animated fill ring */}
        <circle cx="150" cy="150" r={radius}
          fill="none"
          stroke="url(#clutchGrad)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animatedOffset}
          transform="rotate(-90 150 150)"
          style={{ transition: 'stroke-dashoffset 2.5s cubic-bezier(0.16, 1, 0.3, 1)' }}
          filter="url(#ringGlow)"
        />

        {/* Inner decorative ring */}
        <circle cx="150" cy="150" r="105"
          fill="none"
          stroke="rgba(200,16,46,0.12)"
          strokeWidth="1"
          strokeDasharray="3 6"
        />

        {/* Score text */}
        <text x="150" y="140" textAnchor="middle"
          fontFamily="'Bebas Neue', sans-serif"
          fontSize="56"
          fill={isVisible ? '#FFD700' : 'transparent'}
          style={{ transition: 'fill 0.5s ease' }}
        >
          {isVisible ? count.toFixed(1) : '0.0'}
        </text>

        <text x="150" y="166" textAnchor="middle"
          fontFamily="'Rajdhani', sans-serif"
          fontSize="11"
          fontWeight="700"
          letterSpacing="4"
          fill="rgba(255,215,0,0.5)"
        >
          CLUTCH INDEX
        </text>

        <text x="150" y="185" textAnchor="middle"
          fontFamily="'Inter', sans-serif"
          fontSize="10"
          fill="rgba(240,240,248,0.3)"
        >
          out of 100
        </text>
      </svg>
    </div>
  );
}

// Animated breakdown bar
function BreakdownBar({ item, isVisible, delay }: {
  item: typeof BREAKDOWN_ITEMS[0];
  isVisible: boolean;
  delay: number;
}) {
  const maxVal = item.unit === 'avg' ? 80 : 100;
  const pct = (item.value / maxVal) * 100;
  const baselinePct = (item.baseline / maxVal) * 100;
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    if (!isVisible) return;
    const t = setTimeout(() => setAnimated(true), delay);
    return () => clearTimeout(t);
  }, [isVisible, delay]);

  return (
    <div className="breakdown-bar-row">
      <div className="breakdown-bar-header">
        <span className="breakdown-label">{item.label}</span>
        <span className="breakdown-weight-badge">{item.weight}% weight</span>
      </div>
      <div className="breakdown-bar-track">
        {/* Baseline marker */}
        <div
          className="breakdown-baseline"
          style={{ left: `${baselinePct}%` }}
          title={`Baseline: ${item.baseline} ${item.unit}`}
        />
        {/* Fill bar */}
        <div
          className="breakdown-fill"
          style={{
            width: animated ? `${pct}%` : '0%',
            background: item.color,
            transition: `width 1s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
          }}
        />
      </div>
      <div className="breakdown-values">
        <span className="breakdown-value" style={{ color: item.color }}>
          {item.value} {item.unit}
        </span>
        <span className="breakdown-baseline-label">
          baseline: {item.baseline} {item.unit}
        </span>
      </div>
    </div>
  );
}

export default function ClutchSection() {
  const [sectionRef, isVisible] = useIntersectionObserver(0.2);
  const [clutchFormat, setClutchFormat] = useState<'ODI' | 'Test' | 'T20I'>('ODI');

  const currentMetrics = clutchMetricsByFormat[clutchFormat];

  // Dynamic breakdown items based on selected format
  const dynamicBreakdown = [
    {
      label: clutchFormat === 'Test' ? '4th Innings Chases' : 'Chase Dominance',
      weight: 35,
      value: currentMetrics.chaseAvg,
      baseline: currentMetrics.baselineAvg,
      unit: 'avg',
      color: '#C8102E',
      description: clutchFormat === 'Test' ? '4th innings Test chasing average' : 'Run chase batting average vs baseline',
    },
    {
      label: clutchFormat === 'Test' ? 'SENA Away Test Elevation' : clutchFormat === 'T20I' ? 'T20 WC Knockouts' : 'Knockout Elevation',
      weight: 25,
      value: currentMetrics.knockoutAvg,
      baseline: currentMetrics.baselineAvg,
      unit: 'avg',
      color: '#e07b39',
      description: clutchFormat === 'Test' ? 'SENA test match average' : 'ICC knockout match average',
    },
    {
      label: clutchFormat === 'Test' ? 'WTC Deciders / Finals' : 'Finals Performance',
      weight: 20,
      value: currentMetrics.finalsAvg,
      baseline: currentMetrics.baselineAvg,
      unit: 'avg',
      color: '#FFD700',
      description: clutchFormat === 'Test' ? 'WTC decider batting average' : 'Tournament finals batting average',
    },
    {
      label: clutchFormat === 'T20I' ? 'Death Overs SR Boost' : 'SR Pressure Boost',
      weight: 20,
      value: currentMetrics.chaseSR,
      baseline: currentMetrics.baselineSR,
      unit: 'SR',
      color: '#22c55e',
      description: clutchFormat === 'T20I' ? 'Death overs strike rate in chases' : 'Chase strike rate vs baseline',
    },
  ];

  return (
    <section
      id="clutch-index"
      className="clutch-section"
      ref={sectionRef as React.RefObject<HTMLElement>}
    >
      {/* Background glow */}
      <div className="clutch-bg-glow" aria-hidden="true" />

      <div className="container">
        {/* Header */}
        <div className="section-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <p className="section-label">CUSTOM METRIC ({clutchFormat.toUpperCase()} FORMAT)</p>
              <h2 className="section-title">CLUTCH <span style={{ color: '#FFD700' }}>INDEX</span> <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>({clutchFormat})</span></h2>
            </div>

            {/* Format Toggle Pills */}
            <div className="format-toggle-pills" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(0,0,0,0.4)', padding: '0.3rem 0.6rem', borderRadius: '2rem', border: '1px solid var(--glass-border)' }}>
              <span style={{ fontFamily: 'Rajdhani', fontSize: '0.78rem', fontWeight: 700, color: 'var(--gold-primary)', textTransform: 'uppercase', marginRight: '0.3rem' }}>Format:</span>
              {(['ODI', 'Test', 'T20I'] as const).map((fmt) => (
                <button
                  key={fmt}
                  className={`format-pill-btn ${clutchFormat === fmt ? 'active' : ''}`}
                  style={{
                    background: clutchFormat === fmt ? 'var(--red-primary)' : 'transparent',
                    color: clutchFormat === fmt ? '#fff' : 'var(--text-muted)',
                    border: 'none',
                    fontFamily: 'Rajdhani',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    padding: '0.3rem 0.9rem',
                    borderRadius: '1.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => setClutchFormat(fmt)}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>

          <p className="section-body" style={{ marginTop: '1rem' }}>
            A composite score measuring how much Kohli elevates his game when stakes are highest in <strong>{clutchFormat} cricket</strong>.
            Computed from situational averages, knockout records, and pressure strike rates.
          </p>
        </div>

        {/* Main content */}
        <div className="clutch-main">
          {/* Left: Ring */}
          <div className="clutch-left">
            <ClutchRing index={currentMetrics.clutchIndex} isVisible={isVisible} />
            <div className="clutch-ring-labels">
              <div className="clutch-tier">🔥 {clutchFormat} Pressure Rating: {currentMetrics.clutchIndex}/100</div>
              <p className="clutch-description" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {currentMetrics.formatNote}
              </p>
            </div>
          </div>

          {/* Right: Breakdown */}
          <div className="clutch-right">
            <h3 className="clutch-breakdown-title">How It's Computed ({clutchFormat})</h3>
            <div className="clutch-formula">
              <code>Clutch Index = Σ (situational / baseline) × weight × 100</code>
            </div>
            <div className="breakdown-bars">
              {dynamicBreakdown.map((item, i) => (
                <BreakdownBar
                  key={`${clutchFormat}-${item.label}`}
                  item={item}
                  isVisible={isVisible}
                  delay={i * 200}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="divider" />

        {/* Legends Comparison */}
        <div className="clutch-legends">
          <h3 className="clutch-legends-title">Clutch Index — vs The Greats</h3>
          <div className="legends-bars">
            {legendsClutch.map((legend, i) => {
              const isKohli = legend.name === 'Kohli';
              return (
                <div key={legend.name} className="legend-bar-row">
                  <span className={`legend-name ${isKohli ? 'legend-name--kohli' : ''}`}>
                    {isKohli && '👑 '}{legend.name}
                  </span>
                  <div className="legend-bar-track">
                    <div
                      className={`legend-bar-fill ${isKohli ? 'legend-bar--kohli' : ''}`}
                      style={{
                        width: isVisible ? `${legend.clutchIndex}%` : '0%',
                        background: legend.color,
                        transition: `width 1.2s cubic-bezier(0.16, 1, 0.3, 1) ${i * 150}ms`,
                      }}
                    />
                  </div>
                  <span className="legend-bar-value" style={{ color: legend.color }}>
                    {legend.clutchIndex}
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
