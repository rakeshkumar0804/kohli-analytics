import { useState, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { pressureMapData } from '../../data/kohliData';
import type { PressureCell, Phase } from '../../types';
import './PressureSection.css';

type PressureLevel = 'comfortable' | 'moderate' | 'stiff' | 'mountain';

const PHASES: Phase[] = ['powerplay', 'middle', 'death'];
const PRESSURE_LEVELS: PressureLevel[] = ['comfortable', 'moderate', 'stiff', 'mountain'];

const PHASE_LABELS: Record<Phase, string> = {
  powerplay: 'Powerplay (0–10 ov)',
  middle:    'Middle (11–40 ov)',
  death:     'Death (41–50 ov)',
};

const PRESSURE_LABELS: Record<PressureLevel, string> = {
  comfortable: 'Comfortable\n<6 rpo',
  moderate:    'Moderate\n6–8 rpo',
  stiff:       'Stiff\n8–10 rpo',
  mountain:    'Mountain\n>10 rpo',
};

interface TooltipState {
  cell: PressureCell;
  x: number;
  y: number;
}

export default function PressureSection() {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  // Color scale: dark → red → gold
  const minAvg = Math.min(...pressureMapData.map((c) => c.average));
  const maxAvg = Math.max(...pressureMapData.map((c) => c.average));
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
    pressureMapData.find((c) => c.phase === phase && c.pressureLevel === pressure);

  return (
    <section id="pressure-map" className="pressure-section" ref={sectionRef}>
      <div className="pressure-bg-glow" aria-hidden="true" />

      <div className="container">
        {/* Header */}
        <div className="section-header">
          <p className="section-label">ORIGINAL METRIC</p>
          <h2 className="section-title">PRESSURE <span className="text-red">MAP</span></h2>
          <p className="section-body">
            A custom heatmap engineered from ball-by-ball situational data. Each cell reveals Kohli's
            batting average segmented by match phase and required run rate — showing exactly when he
            rises and when he's tested.
          </p>
        </div>

        <div className="pressure-layout">
          {/* Left: Narrative */}
          <div className="pressure-narrative">
            <div className="narrative-block">
              <div className="narrative-icon">⚡</div>
              <h3>What is Required Run Rate?</h3>
              <p>
                RRR is the runs per over India needs when Kohli bats. The higher the RRR, the more
                pressure he's under. This map segments his performance across 12 distinct situations.
              </p>
            </div>
            <div className="narrative-block">
              <div className="narrative-icon">🎯</div>
              <h3>The Key Finding</h3>
              <p>
                Kohli's <strong>Middle Overs / Moderate Pressure</strong> cell (avg <strong style={{ color: '#FFD700' }}>89.4</strong>) is
                higher than most world-class batters' career averages. This is his golden zone.
              </p>
            </div>
            <div className="narrative-block">
              <div className="narrative-icon">🔥</div>
              <h3>The Surprise</h3>
              <p>
                Even in <strong style={{ color: '#C8102E' }}>Mountain situations</strong> (&gt;10 RRR) during death overs,
                he averages <strong style={{ color: '#FFD700' }}>52.1</strong> — when most batters panic,
                he accelerates.
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

          {/* Right: Heatmap */}
          <div className="pressure-heatmap-wrapper">
            {/* X-axis labels */}
            <div className="heatmap-x-labels">
              {PRESSURE_LEVELS.map((p) => (
                <div key={p} className="x-label">
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
                  <div key={phase} className="y-label">
                    {PHASE_LABELS[phase]}
                  </div>
                ))}
              </div>

              {/* Grid */}
              <div className="heatmap-grid">
                {PHASES.map((phase, row) =>
                  PRESSURE_LEVELS.map((pressure, col) => {
                    const cell = getCell(phase, pressure);
                    if (!cell) return null;
                    const bg = colorScale(cell.average);
                    const isHigh = cell.average > 75;
                    const delay = (row * 4 + col) * 80;

                    return (
                      <div
                        key={`${phase}-${pressure}`}
                        className="heatmap-cell"
                        style={{
                          background: bg,
                          border: `1px solid rgba(255,255,255,0.08)`,
                          opacity: isVisible ? 1 : 0,
                          transform: isVisible ? 'scale(1)' : 'scale(0.8)',
                          transition: `opacity 0.5s ease ${delay}ms, transform 0.5s cubic-bezier(0.34,1.56,0.64,1) ${delay}ms`,
                        }}
                        onMouseEnter={(e) => {
                          const rect = (e.target as HTMLElement).getBoundingClientRect();
                          setTooltip({ cell, x: rect.left + rect.width / 2, y: rect.top });
                        }}
                        onMouseLeave={() => setTooltip(null)}
                        role="gridcell"
                        aria-label={`${PHASE_LABELS[phase]}, ${PRESSURE_LABELS[pressure].replace('\n', ' ')}: avg ${cell.average}`}
                        tabIndex={0}
                      >
                        <span
                          className="cell-avg"
                          style={{ color: isHigh ? '#000' : '#fff', textShadow: isHigh ? 'none' : '0 1px 3px rgba(0,0,0,0.8)' }}
                        >
                          {cell.average.toFixed(1)}
                        </span>
                        <span
                          className="cell-innings"
                          style={{ color: isHigh ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.45)' }}
                        >
                          {cell.innings} inn
                        </span>
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
                <span>🏆 Peak Zone: Middle / Moderate — avg <strong>89.4</strong></span>
              </div>
              <div className="annotation annotation--red">
                <span className="annotation-dot" />
                <span>⚡ Even Mountain/Death: avg <strong>52.1</strong> — above world avg</span>
              </div>
            </div>
          </div>
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
          <div className="tooltip-phase">{PHASE_LABELS[tooltip.cell.phase]}</div>
          <div className="tooltip-pressure">{tooltip.cell.rrrRange}</div>
          <div className="tooltip-row">
            <span>Average</span>
            <strong style={{ color: '#FFD700' }}>{tooltip.cell.average.toFixed(1)}</strong>
          </div>
          <div className="tooltip-row">
            <span>Strike Rate</span>
            <strong>{tooltip.cell.strikeRate.toFixed(1)}</strong>
          </div>
          <div className="tooltip-row">
            <span>Innings</span>
            <strong>{tooltip.cell.innings}</strong>
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
