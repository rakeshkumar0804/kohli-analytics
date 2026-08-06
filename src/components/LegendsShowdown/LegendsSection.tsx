import { useState } from 'react';
import { legendsData } from '../../data/kohliData';
import { useIntersectionObserver } from '../../hooks';
import type { LegendStats } from '../../types';
import './LegendsSection.css';

type MetricType = 'odiCenturies' | 'odiAvg' | 'chaseAvg' | 'knockoutAvg' | 'odiRuns';

const METRICS: { id: MetricType; label: string; max: number }[] = [
  { id: 'odiCenturies', label: 'ODI Centuries', max: 60 },
  { id: 'odiAvg', label: 'ODI Average', max: 70 },
  { id: 'chaseAvg', label: 'Chase Average', max: 70 },
  { id: 'knockoutAvg', label: 'Knockout Avg', max: 75 },
  { id: 'odiRuns', label: 'ODI Runs', max: 20000 },
];

export default function LegendsSection() {
  const [activeMetric, setActiveMetric] = useState<MetricType>('odiCenturies');
  const [sectionRef, isVisible] = useIntersectionObserver(0.2);

  const selectedMetricConfig = METRICS.find(m => m.id === activeMetric)!;

  // Sort legends by active metric descending
  const sortedLegends = [...legendsData].sort((a, b) => (b[activeMetric] as number) - (a[activeMetric] as number));

  return (
    <section id="legends-showdown" className="legends-section" ref={sectionRef as React.RefObject<HTMLElement>}>
      <div className="legends-bg-glow" aria-hidden="true" />

      <div className="container">
        <div className="section-header text-center">
          <p className="section-label">COMPARATIVE ANALYSIS</p>
          <h2 className="section-title">LEGENDS <span className="text-red">SHOWDOWN</span></h2>
          <p className="section-body">
            Direct head-to-head metrics comparing Virat Kohli against cricket's greatest batting icons across generations.
          </p>
        </div>

        {/* Metric Selector Tabs */}
        <div className="metric-selector-tabs">
          {METRICS.map(m => (
            <button
              key={m.id}
              className={`metric-tab-btn ${activeMetric === m.id ? 'active' : ''}`}
              onClick={() => setActiveMetric(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Comparison Bars Container */}
        <div className="legends-bars-wrapper glass-card">
          <div className="bars-list">
            {sortedLegends.map((legend: LegendStats, i: number) => {
              const val = legend[activeMetric] as number;
              const pct = (val / selectedMetricConfig.max) * 100;
              const isKohli = legend.name === 'Virat Kohli';

              return (
                <div key={legend.name} className="legend-comparison-row">
                  <div className="legend-info">
                    <span className="legend-player-name">
                      {isKohli && <span className="crown-icon">👑</span>}
                      {legend.name}
                    </span>
                    <span className="legend-country-tag">{legend.country}</span>
                  </div>

                  <div className="legend-track">
                    <div
                      className={`legend-fill ${isKohli ? 'kohli-fill' : ''}`}
                      style={{
                        width: isVisible ? `${pct}%` : '0%',
                        backgroundColor: isKohli ? undefined : legend.color,
                        transitionDelay: `${i * 100}ms`,
                      }}
                    >
                      <span className="bar-value-text">
                        {activeMetric === 'odiAvg' || activeMetric === 'chaseAvg' || activeMetric === 'knockoutAvg'
                          ? val.toFixed(2)
                          : val.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Insight Card */}
        <div className="insight-card glass-card">
          <div className="insight-icon">💡</div>
          <div className="insight-text">
            <h4>Analytical takeaway</h4>
            <p>
              While Sachin Tendulkar holds the overall run volume record, Kohli surpasses all legends in 
              <strong> Chase Average (65.0)</strong> and <strong>ODI Centuries (54)</strong> — achieving his milestones in significantly fewer matches than his predecessors.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
