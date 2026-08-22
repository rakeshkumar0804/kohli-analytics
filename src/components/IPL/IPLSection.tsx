import { iplCareerData, domesticCareerData } from '../../data/kohliData';
import { useIntersectionObserver } from '../../hooks';
import './IPLSection.css';

export default function IPLSection() {
  const [sectionRef, isVisible] = useIntersectionObserver(0.15);

  return (
    <section id="ipl-domestic" className="ipl-section" ref={sectionRef as React.RefObject<HTMLElement>}>
      <div className="ipl-bg-glow" aria-hidden="true" />

      <div className="container">
        {/* Header */}
        <div className="section-header">
          <p className="section-label">DOMESTIC & T20 LEAGUE RECORDS</p>
          <h2 className="section-title">
            IPL & <span className="text-gold">DOMESTIC</span> CAREER
          </h2>
          <p className="section-body">
            From the fierce grind of Delhi's Ranji Trophy circuit to becoming the undisputed all-time leading run-scorer in Indian Premier League history.
          </p>
        </div>

        {/* Dual Panel Grid */}
        <div className="ipl-domestic-grid">
          {/* Panel 1: IPL Career (Prominent / Larger) */}
          <div className={`ipl-card glass-card ${isVisible ? 'animate-in' : ''}`}>
            <div className="ipl-card-top">
              <div className="ipl-badge-row">
                <span className="ipl-badge-primary">👑 {iplCareerData.highlightBadge}</span>
                <span className="ipl-team-tag">🔴 {iplCareerData.team} ({iplCareerData.yearsActive})</span>
              </div>
              <h3 className="ipl-card-title">Indian Premier League Record</h3>
            </div>

            {/* Main IPL Stat Grid */}
            <div className="ipl-stats-grid">
              <div className="ipl-stat-box box-runs">
                <span className="ipl-stat-val text-gold">{iplCareerData.runs.toLocaleString()}</span>
                <span className="ipl-stat-lbl">IPL Runs</span>
                <span className="ipl-stat-sub">#1 All-Time IPL Leader</span>
              </div>

              <div className="ipl-stat-box box-tons">
                <span className="ipl-stat-val text-red">{iplCareerData.centuries}</span>
                <span className="ipl-stat-lbl">IPL Centuries</span>
                <span className="ipl-stat-sub">Most 100s in IPL History</span>
              </div>

              <div className="ipl-stat-box">
                <span className="ipl-stat-val">{iplCareerData.average}</span>
                <span className="ipl-stat-lbl">Batting Avg</span>
                <span className="ipl-stat-sub">{iplCareerData.fifties} Fifties</span>
              </div>

              <div className="ipl-stat-box">
                <span className="ipl-stat-val">{iplCareerData.strikeRate}</span>
                <span className="ipl-stat-lbl">Strike Rate</span>
                <span className="ipl-stat-sub">High Score {iplCareerData.highScore}</span>
              </div>

              <div className="ipl-stat-box">
                <span className="ipl-stat-val">{iplCareerData.matches}</span>
                <span className="ipl-stat-lbl">IPL Matches</span>
                <span className="ipl-stat-sub">{iplCareerData.innings} Innings</span>
              </div>

              <div className="ipl-stat-box">
                <span className="ipl-stat-val text-gold">{iplCareerData.orangeCaps}</span>
                <span className="ipl-stat-lbl">Orange Caps</span>
                <span className="ipl-stat-sub">2016 (973) & 2024 (741)</span>
              </div>
            </div>

            {/* Key Milestone Cards */}
            <div className="ipl-milestone-grid">
              {iplCareerData.keyMilestones.map((m) => (
                <div key={m.label} className="ipl-milestone-item">
                  <span className="milestone-label">{m.label}</span>
                  <span className="milestone-desc">{m.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Panel 2: Domestic Career (Smaller / Foundational) */}
          <div className={`domestic-card glass-card ${isVisible ? 'animate-in' : ''}`} style={{ animationDelay: '200ms' }}>
            <div className="domestic-card-top">
              <span className="domestic-team-tag">🔵 {domesticCareerData.team}</span>
              <h3 className="domestic-card-title">Ranji & First-Class Roots</h3>
            </div>

            {/* Foundational Note */}
            <div className="foundational-quote-box">
              <span className="quote-icon">⚡</span>
              <p className="foundational-note-text">
                "{domesticCareerData.foundationalNote}"
              </p>
            </div>

            {/* Domestic Stats */}
            <div className="domestic-stats-column">
              <div className="domestic-stat-row">
                <div className="domestic-stat-group">
                  <span className="domestic-stat-num text-gold">{domesticCareerData.firstClassRuns.toLocaleString()}</span>
                  <span className="domestic-stat-lbl">First-Class Runs</span>
                </div>
                <div className="domestic-stat-sub-info">
                  <span>{domesticCareerData.firstClassAverage} Avg</span>
                  <span>•</span>
                  <span>{domesticCareerData.firstClassCenturies} Centuries</span>
                </div>
              </div>

              <div className="domestic-stat-row">
                <div className="domestic-stat-group">
                  <span className="domestic-stat-num text-red">{domesticCareerData.listARuns.toLocaleString()}</span>
                  <span className="domestic-stat-lbl">List-A Runs</span>
                </div>
                <div className="domestic-stat-sub-info">
                  <span>{domesticCareerData.listAAverage} Avg</span>
                  <span>•</span>
                  <span>{domesticCareerData.listAMatches} Matches</span>
                </div>
              </div>
            </div>

            {/* Ranji Highlight Box */}
            <div className="ranji-highlight-box">
              <span className="ranji-badge">LEGENDARY FOUNDATION</span>
              <p className="ranji-desc">{domesticCareerData.ranjiHighlight}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
