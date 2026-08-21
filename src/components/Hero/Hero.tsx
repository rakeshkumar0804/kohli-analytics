import { useRef, useState } from 'react';
import { useCountUp } from '../../hooks';
import { heroStatsByFormat } from '../../data/kohliData';
import './Hero.css';



// CSS-only particle dots
function ParticleField() {
  return (
    <div className="particle-field" aria-hidden="true">
      {Array.from({ length: 40 }).map((_, i) => (
        <span
          key={i}
          className="particle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 8}s`,
            animationDuration: `${6 + Math.random() * 8}s`,
            width: `${2 + Math.random() * 3}px`,
            height: `${2 + Math.random() * 3}px`,
            background: Math.random() > 0.5 ? '#C8102E' : '#FFD700',
            opacity: 0.15 + Math.random() * 0.4,
          }}
        />
      ))}
    </div>
  );
}

// Animated Jersey Number Ring
function JerseyRing() {
  return (
    <div className="jersey-ring-wrapper" aria-label="Kohli jersey number 18">
      {/* Outer orbit */}
      <div className="orbit orbit-1" />
      <div className="orbit orbit-2" />
      {/* Main ring */}
      <svg className="jersey-ring" viewBox="0 0 320 320" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C8102E" />
            <stop offset="100%" stopColor="#FFD700" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        {/* Background circle */}
        <circle cx="160" cy="160" r="140" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        {/* Main animated ring arc */}
        <circle
          cx="160" cy="160" r="130"
          stroke="url(#ringGrad)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray="817"
          strokeDashoffset="0"
          transform="rotate(-90 160 160)"
          className="ring-arc"
          filter="url(#glow)"
        />
        {/* Inner dashed ring */}
        <circle
          cx="160" cy="160" r="108"
          stroke="rgba(200,16,46,0.2)"
          strokeWidth="1"
          strokeDasharray="4 8"
        />
        {/* Jersey number */}
        <text
          x="160" y="148"
          textAnchor="middle"
          fontFamily="'Bebas Neue', sans-serif"
          fontSize="80"
          fill="#FFD700"
          className="jersey-number"
        >
          18
        </text>
        <text
          x="160" y="185"
          textAnchor="middle"
          fontFamily="'Rajdhani', sans-serif"
          fontSize="14"
          fontWeight="600"
          letterSpacing="6"
          fill="rgba(255,215,0,0.55)"
        >
          JERSEY
        </text>
        {/* Dots on ring */}
        {[0, 60, 120, 180, 240, 300].map((angle) => {
          const r = 130;
          const rad = (angle - 90) * (Math.PI / 180);
          const x = 160 + r * Math.cos(rad);
          const y = 160 + r * Math.sin(rad);
          return (
            <circle key={angle} cx={x} cy={y} r="4"
              fill={angle % 120 === 0 ? '#FFD700' : '#C8102E'}
              className="ring-dot"
              style={{ animationDelay: `${angle / 60 * 0.3}s` }}
            />
          );
        })}
      </svg>
    </div>
  );
}

// Single animated stat counter
function StatCounter({ value, label, subtext, decimals }: { value: number; label: string; subtext: string; decimals: number }) {
  const { count, ref } = useCountUp({ target: value, duration: 2200, decimals, startOnVisible: true });
  return (
    <div className="stat-counter" ref={ref as React.RefObject<HTMLDivElement>}>
      <span className="stat-value">
        {decimals > 0 ? count.toFixed(decimals) : count.toLocaleString()}
      </span>
      <span className="stat-label">{label}</span>
      <span className="stat-subtext" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.15rem' }}>
        {subtext}
      </span>
    </div>
  );
}

export default function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const [heroFormat, setHeroFormat] = useState<'ALL' | 'ODI' | 'Test' | 'T20I'>('ALL');

  const handleExplore = () => {
    document.getElementById('next-match')?.scrollIntoView({ behavior: 'smooth' });
  };

  const activeStats = heroStatsByFormat[heroFormat];

  return (
    <section id="hero" className="hero-section" ref={heroRef}>
      <ParticleField />

      {/* Large VK watermark behind everything */}
      <div className="vk-watermark" aria-hidden="true">VK</div>

      <div className="hero-content">
        {/* Left: Text side */}
        <div className="hero-left">
          <div className="hero-badge">
            <span>👑</span>
            <span>THE ANALYTICS STORY</span>
          </div>

          <h1 className="hero-headline">
            <span className="headline-virat">VIRAT</span>
            <span className="headline-kohli">KOHLI</span>
          </h1>

          <p className="hero-subtext">
            Not just stats. A data-driven story of the greatest batter of his generation — 
            told through original metrics you won't find anywhere else.
          </p>

          {/* Format Selector Pills */}
          <div className="hero-format-pills" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1.25rem' }}>
            <span style={{ fontFamily: 'Rajdhani', fontSize: '0.8rem', fontWeight: 700, color: 'var(--gold-primary)', textTransform: 'uppercase', marginRight: '0.3rem' }}>
              Format Scope:
            </span>
            {(['ALL', 'ODI', 'Test', 'T20I'] as const).map((fmt) => (
              <button
                key={fmt}
                className={`format-pill-btn ${heroFormat === fmt ? 'active' : ''}`}
                style={{
                  padding: '0.25rem 0.75rem',
                  fontSize: '0.78rem',
                  borderRadius: '1rem',
                  border: '1px solid var(--glass-border)',
                  background: heroFormat === fmt ? 'var(--red-primary)' : 'rgba(0,0,0,0.3)',
                  color: heroFormat === fmt ? '#fff' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontFamily: 'Rajdhani',
                  fontWeight: 800,
                  transition: 'all 0.2s ease',
                }}
                onClick={() => setHeroFormat(fmt)}
              >
                {fmt}
              </button>
            ))}
          </div>

          <div className="hero-stats">
            {activeStats.map((s) => (
              <StatCounter key={s.label} value={s.value} label={s.label} subtext={s.subtext} decimals={s.decimals} />
            ))}
          </div>

          <button className="hero-cta" onClick={handleExplore} id="explore-btn">
            <span>Explore The Story</span>
            <span className="cta-arrow">↓</span>
          </button>
        </div>

        {/* Right: Jersey ring */}
        <div className="hero-right" aria-hidden="true">
          <JerseyRing />
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="scroll-indicator" aria-hidden="true">
        <div className="scroll-line" />
        <span>SCROLL</span>
      </div>
    </section>
  );
}
