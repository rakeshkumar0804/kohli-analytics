import { useState, useEffect, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer
} from 'recharts';
import { eraData } from '../../data/kohliData';
import type { EraStats } from '../../types';
import './EraSection.css';

type Metric = 'odiAvg' | 'testAvg' | 'centuries' | 'chaseAvg';

const METRICS: { key: Metric; label: string }[] = [
  { key: 'odiAvg',    label: 'ODI Avg' },
  { key: 'testAvg',   label: 'Test Avg' },
  { key: 'centuries', label: 'Centuries' },
  { key: 'chaseAvg',  label: 'Chase Avg' },
];

// Custom bar label with crown for peak era
function CustomBarLabel(props: any) {
  const { x = 0, y = 0, width = 0, era } = props;
  if (era !== 'peak') return null;
  return (
    <text x={x + width / 2} y={y - 10} textAnchor="middle" fontSize="16">
      👑
    </text>
  );
}

export default function EraSection() {
  const [activeMetric, setActiveMetric] = useState<Metric>('odiAvg');
  const [activeEraIndex, setActiveEraIndex] = useState(0);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const chartData = eraData.map((era) => ({
    name: era.label.split(' ')[0],
    value: era[activeMetric],
    color: era.color,
    era: era.era,
    fullLabel: era.label,
  }));

  // IntersectionObserver for each era card
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    cardRefs.current.forEach((el, i) => {
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveEraIndex(i); },
        { threshold: 0.6 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const activeEra: EraStats = eraData[activeEraIndex];

  return (
    <section id="era-engine" className="era-section">
      <div className="era-bg-grid" aria-hidden="true" />

      <div className="container">
        {/* Header */}
        <div className="section-header">
          <p className="section-label">ERA COMPARISON</p>
          <h2 className="section-title">THE ARC OF<br /><span className="text-red">GREATNESS</span></h2>
          <p className="section-body">
            Five chapters. One extraordinary career. Watch how Kohli's numbers evolve across eras —
            including the drought that would have broken most, and the renaissance that proved them all wrong.
          </p>
        </div>

        <div className="era-layout">
          {/* Left: Era Cards (scrollable) */}
          <div className="era-cards">
            {eraData.map((era, i) => (
              <div
                key={era.era}
                ref={(el) => { cardRefs.current[i] = el; }}
                className={`era-card glass-card ${i === activeEraIndex ? 'era-card--active' : ''}`}
                style={{ borderLeftColor: i === activeEraIndex ? era.color : 'transparent' }}
                onClick={() => setActiveEraIndex(i)}
              >
                <div className="era-card-top">
                  <span className="era-card-years">{era.years}</span>
                  <span className="era-card-badge" style={{ color: era.color }}>
                    {era.era === 'peak' ? '👑 ' : ''}{era.label}
                  </span>
                </div>
                <div className="era-card-stat" style={{ color: era.color }}>
                  {era.odiAvg.toFixed(1)}
                </div>
                <div className="era-card-stat-label">ODI Average</div>
                <p className="era-card-description">{era.description}</p>
              </div>
            ))}
          </div>

          {/* Right: Sticky chart */}
          <div className="era-chart-panel">
            {/* Metric selector */}
            <div className="era-metric-tabs">
              {METRICS.map(({ key, label }) => (
                <button
                  key={key}
                  className={`era-metric-tab ${activeMetric === key ? 'era-metric-tab--active' : ''}`}
                  onClick={() => setActiveMetric(key)}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Chart */}
            <div className="era-chart-wrapper">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={chartData} margin={{ top: 30, right: 20, left: 0, bottom: 5 }}>
                  <XAxis
                    dataKey="name"
                    tick={{ fill: 'rgba(240,240,248,0.5)', fontFamily: 'Rajdhani', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(8,8,18,0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '0.5rem',
                      fontFamily: 'Rajdhani',
                      color: '#F0F0F8',
                    }}
                    formatter={(value: any, _: any, props: any) => [
                      `${Number(value).toFixed(1)}`,
                      props?.payload?.fullLabel ?? ''
                    ]}
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} label={<CustomBarLabel />}>
                    {chartData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.color}
                        opacity={i === activeEraIndex ? 1 : 0.35}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Active era description */}
            <div
              className="era-active-card glass-card"
              style={{ borderColor: activeEra.color + '40' }}
            >
              <div className="era-active-header">
                <span style={{ color: activeEra.color, fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.8rem' }}>
                  {activeEra.odiAvg.toFixed(1)}
                </span>
                <span className="era-active-title">{activeEra.label} · {activeEra.years}</span>
              </div>
              <p className="era-active-body">{activeEra.description}</p>
              <div className="era-active-stats">
                <div className="era-mini-stat">
                  <span style={{ color: activeEra.color }}>{activeEra.centuries}</span>
                  <span>Centuries</span>
                </div>
                <div className="era-mini-stat">
                  <span style={{ color: activeEra.color }}>{activeEra.chaseAvg.toFixed(1)}</span>
                  <span>Chase Avg</span>
                </div>
                <div className="era-mini-stat">
                  <span style={{ color: activeEra.color }}>{activeEra.matches}</span>
                  <span>Matches</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
