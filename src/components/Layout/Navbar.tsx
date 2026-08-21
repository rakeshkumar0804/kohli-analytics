import { useState, useEffect } from 'react';

const NAV_LINKS = [
  { label: 'Next Match',   href: '#next-match' },
  { label: 'Clutch Index', href: '#clutch-index' },
  { label: 'Captaincy Myth', href: '#captaincy-myth' },
  { label: 'Era Engine',   href: '#era-engine' },
  { label: 'Pressure Map', href: '#pressure-map' },
  { label: 'Chase Master', href: '#chase-master' },
  { label: 'Legends',      href: '#legends-showdown' },
];

const SECTION_IDS = ['next-match', 'clutch-index', 'captaincy-myth', 'era-engine', 'pressure-map', 'chase-master', 'legends-showdown'];

export default function Navbar() {
  const [activeSection, setActiveSection] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    SECTION_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(id); },
        { threshold: 0.3 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMenuOpen(false);
    const target = document.querySelector(href);
    target?.scrollIntoView({ behavior: 'smooth' });
  };

  const navStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 clamp(1.5rem, 4vw, 3.5rem)',
    height: '64px',
    background: scrolled
      ? 'rgba(4, 4, 10, 0.85)'
      : 'transparent',
    backdropFilter: scrolled ? 'blur(20px)' : 'none',
    borderBottom: scrolled
      ? '1px solid rgba(255,255,255,0.07)'
      : '1px solid transparent',
    transition: 'all 0.4s cubic-bezier(0.16,1,0.3,1)',
  };

  const logoStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    textDecoration: 'none',
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: '1.5rem',
    letterSpacing: '0.06em',
    color: '#FFD700',
    filter: 'drop-shadow(0 0 10px rgba(255,215,0,0.4))',
    cursor: 'pointer',
  };

  const linksStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    listStyle: 'none',
  };

  const getLinkStyle = (href: string): React.CSSProperties => {
    const id = href.replace('#', '');
    const isActive = activeSection === id;
    return {
      padding: '0.4rem 0.85rem',
      borderRadius: '2rem',
      fontFamily: "'Rajdhani', sans-serif",
      fontSize: '0.85rem',
      fontWeight: 600,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      textDecoration: 'none',
      color: isActive ? '#fff' : 'rgba(240,240,248,0.65)',
      background: isActive ? '#C8102E' : 'transparent',
      boxShadow: isActive ? '0 0 20px rgba(200,16,46,0.4)' : 'none',
      transition: 'all 0.25s ease',
      cursor: 'pointer',
    };
  };

  const hamburgerStyle: React.CSSProperties = {
    display: 'none',
    background: 'none',
    border: 'none',
    color: 'rgba(240,240,248,0.8)',
    cursor: 'pointer',
    padding: '0.5rem',
  };

  return (
    <>
      <nav style={navStyle} aria-label="Main navigation">
        {/* Logo */}
        <a
          href="#hero"
          style={logoStyle}
          onClick={(e) => handleNavClick(e, '#hero')}
          aria-label="King Kohli Analytics Home"
        >
          <span style={{ fontSize: '1.4rem' }}>👑</span>
          <span>KOHLI</span>
          <span style={{ fontSize: '0.6rem', color: 'rgba(255,215,0,0.5)', letterSpacing: '0.2em', marginLeft: '0.25rem', alignSelf: 'flex-end', marginBottom: '4px' }}>
            ANALYTICS
          </span>
        </a>

        {/* Desktop Links */}
        <ul style={linksStyle} id="nav-links">
          {NAV_LINKS.map(({ label, href }) => (
            <li key={href}>
              <a
                href={href}
                style={getLinkStyle(href)}
                onClick={(e) => handleNavClick(e, href)}
                aria-current={activeSection === href.replace('#', '') ? 'page' : undefined}
              >
                {label}
              </a>
            </li>
          ))}
        </ul>

        {/* Hamburger */}
        <button
          style={{ ...hamburgerStyle, display: 'none' }}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
          id="hamburger-btn"
        >
          <span style={{ fontSize: '1.5rem' }}>{menuOpen ? '✕' : '☰'}</span>
        </button>
      </nav>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div
          style={{
            position: 'fixed',
            top: '64px',
            left: 0,
            right: 0,
            zIndex: 99,
            background: 'rgba(8,8,18,0.97)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(200,16,46,0.3)',
            padding: '1.5rem clamp(1.5rem, 4vw, 3.5rem)',
          }}
        >
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {NAV_LINKS.map(({ label, href }) => (
              <li key={href}>
                <a
                  href={href}
                  style={{
                    display: 'block',
                    padding: '0.75rem 1rem',
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    textDecoration: 'none',
                    color: activeSection === href.replace('#', '') ? '#C8102E' : 'rgba(240,240,248,0.8)',
                    borderLeft: activeSection === href.replace('#', '')
                      ? '3px solid #C8102E'
                      : '3px solid transparent',
                    transition: 'all 0.2s ease',
                  }}
                  onClick={(e) => handleNavClick(e, href)}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Mobile responsive styles injected */}
      <style>{`
        @media (max-width: 768px) {
          #nav-links { display: none !important; }
          #hamburger-btn { display: flex !important; }
        }
      `}</style>
    </>
  );
}
