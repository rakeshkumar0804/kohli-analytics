import { useRef, useState } from 'react';
import { famousChases } from '../../data/kohliData';
import { useIntersectionObserver } from '../../hooks';
import './ChaseSection.css';

export default function ChaseSection() {
  const [sectionRef, isVisible] = useIntersectionObserver(0.2);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [chaseFormat, setChaseFormat] = useState<'ALL' | 'ODI' | 'Test' | 'T20I'>('ALL');

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
              <p className="section-label">DEEP DIVE ({chaseFormat.toUpperCase()} CHASES)</p>
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
            Virat Kohli is universally acknowledged as the greatest run-chaser in cricket history. 
            When calculating target vs pressure in <strong>{chaseFormat === 'ALL' ? 'all formats' : `${chaseFormat} chases`}</strong>, no batter in modern cricket comes close to his mastery of pacing an innings.
          </p>
        </div>

        {/* Top Stats Cards */}
        <div className="chase-stats-grid">
          <div className={`chase-stat-card glass-card ${isVisible ? 'animate-in' : ''}`}>
            <span className="chase-stat-number text-gold">65.0</span>
            <span className="chase-stat-label">ODI Chase Average</span>
            <span className="chase-stat-sub">Highest in ODI History (Min 2000 runs)</span>
          </div>

          <div className={`chase-stat-card glass-card ${isVisible ? 'animate-in' : ''}`} style={{ animationDelay: '150ms' }}>
            <span className="chase-stat-number text-red">82.5</span>
            <span className="chase-stat-label">T20I Chase Average</span>
            <span className="chase-stat-sub">270.5 avg in T20 WC successful chases</span>
          </div>

          <div className={`chase-stat-card glass-card ${isVisible ? 'animate-in' : ''}`} style={{ animationDelay: '300ms' }}>
            <span className="chase-stat-number text-gold">28</span>
            <span className="chase-stat-label">ODI Chase Centuries</span>
            <span className="chase-stat-sub">World Record (Passes Sachin's 17)</span>
          </div>

          <div className={`chase-stat-card glass-card ${isVisible ? 'animate-in' : ''}`} style={{ animationDelay: '450ms' }}>
            <span className="chase-stat-number text-red">49.8</span>
            <span className="chase-stat-label">Test 4th Innings Avg</span>
            <span className="chase-stat-sub">Iconic Day 5 chases (Adelaide 141)</span>
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
