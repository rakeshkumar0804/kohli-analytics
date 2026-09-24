import { useState, useEffect } from 'react';
import { DEFINING_INNINGS_DATA } from '../../data/definingInningsData';
import type { DefiningInningsFormat } from '../../types';
import './DefiningInningsSection.css';

type FilterTab = 'ALL' | DefiningInningsFormat;

export default function DefiningInningsSection() {
  const [selectedFormat, setSelectedFormat] = useState<FilterTab>('ALL');

  useEffect(() => {
    const handleFormatEvent = (e: Event) => {
      const customEvent = e as CustomEvent<FilterTab>;
      if (customEvent.detail) {
        setSelectedFormat(customEvent.detail);
      }
    };
    window.addEventListener('set-defining-innings-format', handleFormatEvent);
    return () => window.removeEventListener('set-defining-innings-format', handleFormatEvent);
  }, []);

  const filteredInnings =
    selectedFormat === 'ALL'
      ? DEFINING_INNINGS_DATA
      : DEFINING_INNINGS_DATA.filter((item) => item.format === selectedFormat);

  return (
    <section id="defining-innings" className="defining-innings-section" aria-labelledby="defining-heading">
      <div className="defining-bg-glow" aria-hidden="true" />

      <div className="container">
        {/* Section Header */}
        <div className="defining-header">
          <span className="section-label">CURATED CAREER MOMENTS</span>
          <h2 id="defining-heading" className="section-title">
            SELECTED <span className="text-gold">DEFINING INNINGS</span>
          </h2>
          <p className="section-subtitle">
            A curated gallery of verified milestone, counter-attack, and rescue masterclasses across formats.
          </p>
          <div className="defining-disclaimer-box" role="note">
            <span>ℹ️</span>
            <span>
              <strong>Scope Notice:</strong> This collection is an editorial selection of defining career moments, non-exhaustive, non-ranked, and isolated from algorithmic index weights.
            </span>
          </div>
        </div>

        {/* Format Filter Bar */}
        <div className="defining-filter-bar" role="tablist" aria-label="Format filter for defining innings">
          {(['ALL', 'Test', 'ODI', 'T20I', 'IPL'] as FilterTab[]).map((tab) => {
            const count =
              tab === 'ALL'
                ? DEFINING_INNINGS_DATA.length
                : DEFINING_INNINGS_DATA.filter((i) => i.format === tab).length;

            return (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={selectedFormat === tab}
                className={`defining-filter-btn ${selectedFormat === tab ? 'active' : ''}`}
                onClick={() => setSelectedFormat(tab)}
              >
                {tab === 'ALL' ? 'All Formats' : tab} ({count})
              </button>
            );
          })}
        </div>

        {/* Gallery Grid */}
        <div className="defining-grid" role="region" aria-label="Defining innings list">
          {filteredInnings.map((item) => (
            <article key={item.id} className="defining-card">
              {/* Card Header Tags */}
              <div className="defining-card-header">
                <div className="defining-tags">
                  <span className={`format-pill ${item.format}`}>{item.format}</span>
                  <span className="category-pill">{item.impactCategory}</span>
                </div>
                <span className={`result-pill ${item.inningsResult}`}>
                  {item.inningsResult === 'won' ? 'MATCH WON' : item.inningsResult === 'draw' ? 'DRAW' : 'MATCH LOST'}
                </span>
              </div>

              {/* Score Hero */}
              <div className="defining-score-row">
                <span className="defining-runs">
                  {item.runs}
                  {item.notOut ? '*' : ''}
                </span>
                <span className="defining-balls">({item.ballsFaced} balls)</span>
                <span className="defining-sr">SR: {item.strikeRate.toFixed(1)}</span>
              </div>

              {/* Title & Metadata */}
              <h3 className="defining-title">{item.title}</h3>
              <div className="defining-meta">
                <div className="defining-meta-item">
                  <span>📍</span>
                  <span>{item.venue} · vs {item.opponent}</span>
                </div>
                <div className="defining-meta-item">
                  <span>🏆</span>
                  <span>{item.tournament} ({new Date(item.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })})</span>
                </div>
              </div>

              {/* Narrative Context */}
              <p className="defining-narrative">{item.verifiedNarrative}</p>

              {/* Card Footer with Evidence Link */}
              <div className="defining-card-footer">
                <a
                  href={item.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="defining-source-link"
                  aria-label={`View primary scorecard for ${item.title} on ${item.sourceId}`}
                >
                  <span>🔗</span>
                  <span>{item.sourceId}</span>
                </a>
                {item.candidateSource === 'user-screenshot-candidate' && (
                  <span className="candidate-badge" title="Verified from candidate screenshot">
                    📷 Verified Candidate
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
