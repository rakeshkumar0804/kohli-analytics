import { famousChases } from '../../data/kohliData';
import { useIntersectionObserver } from '../../hooks';
import './ChaseSection.css';

export default function ChaseSection() {
  const [sectionRef, isVisible] = useIntersectionObserver(0.2);

  return (
    <section id="chase-master" className="chase-section" ref={sectionRef as React.RefObject<HTMLElement>}>
      <div className="chase-bg-glow" aria-hidden="true" />
      
      <div className="container">
        {/* Header */}
        <div className="section-header">
          <p className="section-label">DEEP DIVE</p>
          <h2 className="section-title">CHASE <span className="text-gold">MASTER</span></h2>
          <p className="section-body">
            Virat Kohli is universally acknowledged as the greatest run-chaser in cricket history. 
            When calculating target vs pressure, no batter in modern cricket comes close to his mastery of pacing an innings.
          </p>
        </div>

        {/* Top Stats Cards */}
        <div className="chase-stats-grid">
          <div className={`chase-stat-card glass-card ${isVisible ? 'animate-in' : ''}`}>
            <span className="chase-stat-number text-gold">65.0</span>
            <span className="chase-stat-label">Career Chase Average (ODI)</span>
            <span className="chase-stat-sub">Highest in ODI History (Min 2000 runs)</span>
          </div>

          <div className={`chase-stat-card glass-card ${isVisible ? 'animate-in' : ''}`} style={{ animationDelay: '150ms' }}>
            <span className="chase-stat-number text-red">89.4</span>
            <span className="chase-stat-label">Avg in Successful Chases</span>
            <span className="chase-stat-sub">When Kohli stays, India wins 94% of the time</span>
          </div>

          <div className={`chase-stat-card glass-card ${isVisible ? 'animate-in' : ''}`} style={{ animationDelay: '300ms' }}>
            <span className="chase-stat-number text-gold">28</span>
            <span className="chase-stat-label">Chase Centuries</span>
            <span className="chase-stat-sub">World Record in ODIs (Passes Sachin's 17)</span>
          </div>

          <div className={`chase-stat-card glass-card ${isVisible ? 'animate-in' : ''}`} style={{ animationDelay: '450ms' }}>
            <span className="chase-stat-number text-red">24</span>
            <span className="chase-stat-label">Centuries in Winning Chases</span>
            <span className="chase-stat-sub">85.7% conversion rate to victory</span>
          </div>
        </div>

        {/* Legendary Chases Carousel */}
        <div className="legendary-chases-container">
          <h3 className="chases-subtitle">Legendary Masterclasses</h3>

          <div className="chases-scroll-wrapper h-scroll">
            {famousChases.map((chase, idx) => (
              <div 
                key={`${chase.year}-${chase.opponent}`} 
                className="chase-card glass-card"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="chase-card-header">
                  <span className="chase-year-badge">{chase.year}</span>
                  <span className="chase-format-badge">{chase.format}</span>
                </div>

                <div className="chase-card-main">
                  <span className="chase-opponent">vs {chase.opponent}</span>
                  <div className="chase-score">
                    <span className="score-val text-gold">{chase.kohliScore}</span>
                    {chase.kohliScore >= 100 && <span className="hundred-crown">👑</span>}
                  </div>
                  <span className="chase-target">Target: <strong>{chase.target}</strong> ({chase.venue})</span>
                </div>

                <p className="chase-description">{chase.description}</p>

                <div className="chase-card-footer">
                  <span className="chase-result-badge result-won">WON</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
