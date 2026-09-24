import { useRef, useState } from 'react';
import { famousChases } from '../../data/kohliData';
import { getChaseAnalyticsViewModel } from '../../analytics';
import { useIntersectionObserver } from '../../hooks';
import './ChaseSection.css';

export default function ChaseSection() {
  const [sectionRef, isVisible] = useIntersectionObserver(0.2);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [chaseFormat, setChaseFormat] = useState<'ALL' | 'ODI' | 'Test' | 'T20I'>('ALL');

  // Production chase analytics view models
  const odiChase = getChaseAnalyticsViewModel('ODI');
  const t20iChase = getChaseAnalyticsViewModel('T20I');
  const overallChase = getChaseAnalyticsViewModel('overall');

  // Mouse Drag State
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.8; // Scroll speed factor
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const scrollByAmount = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const distance = direction === 'left' ? -340 : 340;
      scrollRef.current.scrollBy({ left: distance, behavior: 'smooth' });
    }
  };

  const filteredChases = chaseFormat === 'ALL'
    ? famousChases
    : famousChases.filter((c) => c.format === chaseFormat);

  return (
    <section id="chase-master" className="chase-section" ref={sectionRef as React.RefObject<HTMLElement>}>
      <div className="chase-bg-glow" aria-hidden="true" />
      
      <div className="container">
        {/* Header */}
        <div className="section-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <p className="section-label">DERIVED ANALYTICS ({chaseFormat.toUpperCase()} CHASES)</p>
              <h2 className="section-title">CHASE <span className="text-gold">MASTER</span> <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>({chaseFormat})</span></h2>
            </div>

            {/* Format Filter Pills */}
            <div className="format-toggle-pills" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(0,0,0,0.4)', padding: '0.3rem 0.6rem', borderRadius: '2rem', border: '1px solid var(--glass-border)' }}>
              <span style={{ fontFamily: 'Rajdhani', fontSize: '0.78rem', fontWeight: 700, color: 'var(--gold-primary)', textTransform: 'uppercase', marginRight: '0.3rem' }}>Format:</span>
              {(['ALL', 'ODI', 'Test', 'T20I'] as const).map((fmt) => (
                <button
                  key={fmt}
                  className={`format-pill-btn ${chaseFormat === fmt ? 'active' : ''}`}
                  style={{
                    background: chaseFormat === fmt ? 'var(--red-primary)' : 'transparent',
                    color: chaseFormat === fmt ? '#fff' : 'var(--text-muted)',
                    border: 'none',
                    fontFamily: 'Rajdhani',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    padding: '0.3rem 0.9rem',
                    borderRadius: '1.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => setChaseFormat(fmt)}
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

        {/* Top Stats Cards */}
        <div className="chase-stats-grid">
          <div className={`chase-stat-card glass-card ${isVisible ? 'animate-in' : ''}`}>
            <span className="chase-stat-number text-gold">
              {odiChase.average !== null ? odiChase.average.toFixed(2) : '—'}
            </span>
            <span className="chase-stat-label">ODI Chase Average</span>
            <span className="chase-stat-sub">
              {odiChase.successfulChaseAverage !== null ? `${odiChase.successfulChaseAverage.toFixed(2)} avg in successful chases (${odiChase.successfulInningsCount} won of ${odiChase.inningsCount} chases)` : 'Derived from Cricsheet archive'}
            </span>
          </div>

          <div className={`chase-stat-card glass-card ${isVisible ? 'animate-in' : ''}`} style={{ animationDelay: '150ms' }}>
            <span className="chase-stat-number text-red">
              {t20iChase.average !== null ? t20iChase.average.toFixed(2) : '—'}
            </span>
            <span className="chase-stat-label">T20I Chase Average</span>
            <span className="chase-stat-sub">
              {t20iChase.successfulChaseAverage !== null ? `${t20iChase.successfulChaseAverage.toFixed(2)} avg in successful chases (${t20iChase.successfulInningsCount} won of ${t20iChase.inningsCount} chases)` : 'Derived from Cricsheet archive'}
            </span>
          </div>

          <div className={`chase-stat-card glass-card ${isVisible ? 'animate-in' : ''}`} style={{ animationDelay: '300ms' }}>
            <span className="chase-stat-number text-gold">
              {overallChase.successRate !== null ? `${overallChase.successRate.toFixed(1)}%` : '—'}
            </span>
            <span className="chase-stat-label">Limited-Overs Chase Win Rate</span>
            <span className="chase-stat-sub">
              {overallChase.inningsCount > 0 ? `${overallChase.successfulInningsCount} wins in ${overallChase.inningsCount} completed innings (${overallChase.successfulInningsCount}/${overallChase.inningsCount})` : 'Derived from Cricsheet archive'}
            </span>
          </div>

          <div className={`chase-stat-card glass-card ${isVisible ? 'animate-in' : ''}`} style={{ animationDelay: '450ms' }}>
            <span className="chase-stat-number text-red">46.85</span>
            <span className="chase-stat-label">Test Career Baseline</span>
            <span className="chase-stat-sub">123 matches, 210 innings, 9,230 runs (verified Phase 1 baseline)</span>
          </div>
        </div>


        {/* Legendary Chases Carousel */}
        <div className="legendary-chases-container">
          <div className="chases-header-row">
            <h3 className="chases-subtitle">Legendary Masterclasses ({chaseFormat})</h3>

            {/* Scroll Navigation Arrows */}
            <div className="chase-scroll-arrows">
              <button
                className="scroll-arrow-btn"
                onClick={() => scrollByAmount('left')}
                aria-label="Scroll left"
                title="Scroll Left"
              >
                ‹
              </button>
              <button
                className="scroll-arrow-btn"
                onClick={() => scrollByAmount('right')}
                aria-label="Scroll right"
                title="Scroll Right"
              >
                ›
              </button>
            </div>
          </div>

          {/* Scrollable Cards Wrapper with Drag & Snap */}
          <div
            ref={scrollRef}
            className={`chases-scroll-wrapper ${isDragging ? 'is-dragging' : ''}`}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
          >
            {filteredChases.map((chase, idx) => (
              <div 
                key={`${chase.year}-${chase.opponent}-${chase.venue}`} 
                className={`chase-card glass-card ${chase.isGenerational ? 'generational-card' : ''}`}
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                {chase.highlightBadge && (
                  <div className="generational-top-badge">
                    <span>{chase.highlightBadge}</span>
                  </div>
                )}

                <div className="chase-card-header">
                  <span className="chase-year-badge">{chase.year}</span>
                  <span className="chase-format-badge">{chase.format}</span>
                </div>

                <div className="chase-card-main">
                  <span className="chase-opponent">vs {chase.opponent}</span>
                  <div className="chase-score">
                    <span className="score-val text-gold">{chase.kohliScore}*</span>
                    <span className="hundred-crown">👑</span>
                  </div>
                  <span className="chase-target">Target: <strong>{chase.target}</strong> ({chase.venue})</span>
                </div>

                <p className="chase-description">{chase.description}</p>

                <div className="chase-card-footer">
                  <span className={`chase-result-badge ${chase.result === 'won' ? 'result-won' : 'result-lost'}`}>
                    {chase.result.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
