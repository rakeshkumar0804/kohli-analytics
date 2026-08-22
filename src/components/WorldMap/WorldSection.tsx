import { useState } from 'react';
import { opponentData } from '../../data/kohliData';
import { useIntersectionObserver } from '../../hooks';
import type { OpponentStats } from '../../types';
import './WorldSection.css';

export default function WorldSection() {
  const [activeCountry, setActiveCountry] = useState<OpponentStats | null>(opponentData[0]);
  const [sectionRef, isVisible] = useIntersectionObserver(0.2);

  return (
    <section id="world-map" className="world-section" ref={sectionRef as React.RefObject<HTMLElement>}>
      <div className="container">
        <div className="section-header">
          <p className="section-label">GLOBAL DOMINANCE • ALL INTERNATIONAL FORMATS</p>
          <h2 className="section-title">DOMINANCE <span className="text-gold">BY COUNTRY</span></h2>
          <p className="section-body">
            Virat Kohli has scored international centuries in nearly every major cricket-playing nation. Here is his record against each opposition across all international formats (Test + ODI + T20I).
          </p>
        </div>

        <div className="world-layout">
          {/* Countries Grid / List */}
          <div className="countries-grid">
            {opponentData.map((opp: OpponentStats) => {
              const isSelected = activeCountry?.country === opp.country;
              const displayAvg = opp.avg ?? opp.odiAvg ?? 0;
              const displayRuns = opp.runs ?? opp.odiRuns ?? 0;
              return (
                <div
                  key={opp.country}
                  className={`country-card glass-card ${isSelected ? 'active' : ''} ${isVisible ? 'animate-in' : ''}`}
                  onClick={() => setActiveCountry(opp)}
                >
                  <div className="country-card-header">
                    <span className="country-name">{opp.country}</span>
                    <span className="country-code">{opp.code}</span>
                  </div>

                  <div className="country-stats-preview">
                    <div className="preview-stat">
                      <span className="stat-num text-gold">{displayAvg.toFixed(1)}</span>
                      <span className="stat-lbl">Average</span>
                    </div>

                    <div className="preview-stat">
                      <span className="stat-num text-red">{opp.centuries}</span>
                      <span className="stat-lbl">100s</span>
                    </div>

                    <div className="preview-stat">
                      <span className="stat-num">{displayRuns.toLocaleString()}</span>
                      <span className="stat-lbl">Runs</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Country Detail Spotlight */}
          {activeCountry && (
            <div className="country-spotlight glass-card">
              <div className="spotlight-header">
                <span className="spotlight-code">{activeCountry.code}</span>
                <h3 className="spotlight-title">Record vs {activeCountry.country}</h3>
              </div>

              <div className="spotlight-metrics-grid">
                <div className="spotlight-metric">
                  <span className="metric-val text-gold">{(activeCountry.avg ?? activeCountry.odiAvg ?? 0).toFixed(2)}</span>
                  <span className="metric-lbl">International Batting Avg</span>
                </div>

                <div className="spotlight-metric">
                  <span className="metric-val text-red">{activeCountry.centuries}</span>
                  <span className="metric-lbl">Centuries</span>
                </div>

                <div className="spotlight-metric">
                  <span className="metric-val">{activeCountry.fifties}</span>
                  <span className="metric-lbl">50s</span>
                </div>

                <div className="spotlight-metric">
                  <span className="metric-val">{activeCountry.highScore}</span>
                  <span className="metric-lbl">Highest Score</span>
                </div>

                <div className="spotlight-metric">
                  <span className="metric-val">{activeCountry.matches}</span>
                  <span className="metric-lbl">Matches</span>
                </div>

                <div className="spotlight-metric">
                  <span className="metric-val">{(activeCountry.runs ?? activeCountry.odiRuns ?? 0).toLocaleString()}</span>
                  <span className="metric-lbl">Total Runs</span>
                </div>
              </div>

              <div className="dominance-bar-container">
                <div className="dominance-header">
                  <span>Dominance Score</span>
                  <span className="text-gold">{activeCountry.dominanceScore}/100</span>
                </div>
                <div className="dominance-track">
                  <div 
                    className="dominance-fill"
                    style={{ width: `${activeCountry.dominanceScore}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
