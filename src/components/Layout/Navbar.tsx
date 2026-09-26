import { useState, useEffect } from 'react';

const NAV_LINKS = [
  { label: 'Next Match',   href: '#next-match' },
  { label: 'Pressure Performance', href: '#clutch-index' },
  { label: 'Captaincy',    href: '#captaincy-myth' },
  { label: 'Era Engine',   href: '#era-engine' },
  { label: 'Pressure Map', href: '#pressure-map' },
  { label: 'Chase Master', href: '#chase-master' },
  { label: 'Defining Innings', href: '#defining-innings' },
  { label: 'Legends',      href: '#legends-showdown' },
  { label: 'IPL & Domestic', href: '#ipl-domestic' },
  { label: 'Timeline',     href: '#career-timeline' },
];

const SECTION_IDS = [
  'next-match',
  'clutch-index',
  'captaincy-myth',
  'era-engine',
  'pressure-map',
  'chase-master',
  'defining-innings',
  'legends-showdown',
  'ipl-domestic',
  'career-timeline',
];

export default function Navbar() {
  const [activeSection, setActiveSection] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setScrolled(scrollY > 40);

      // Scroll spy: determine which section currently spans the reading area
      const offset = 140; // Pixels below fixed header
      let current = '';

      for (const id of SECTION_IDS) {
        const el = document.getElementById(id);
        if (el) {
          const top = el.offsetTop - offset;
          const bottom = top + el.offsetHeight;
          if (scrollY >= top && scrollY < bottom) {
            current = id;
            break;
          }
        }
      }

      if (current) {
        setActiveSection(current);
      } else if (scrollY < 200) {
        setActiveSection('');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
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
    padding: '0 clamp(1.25rem, 4vw, 3.5rem)',
    height: '68px',
    background: scrolled
      ? 'rgba(8, 9, 17, 0.82)'
      : 'transparent',
    backdropFilter: scrolled ? 'blur(24px) saturate(180%)' : 'none',
    borderBottom: scrolled
      ? '1px solid rgba(255,255,255,0.08)'
      : '1px solid transparent',
    boxShadow: scrolled
      ? '0 10px 30px -10px rgba(0, 0, 0, 0.5)'
      : 'none',
    transition: 'all 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
  };

  const logoStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    textDecoration: 'none',
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: '1.55rem',
    letterSpacing: '0.06em',
    color: '#FBBF24',
    filter: 'drop-shadow(0 0 12px rgba(251,191,36,0.35))',
    cursor: 'pointer',
    transition: 'transform 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
  };

  const linksStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
    listStyle: 'none',
  };

  const getLinkStyle = (href: string): React.CSSProperties => {
    const id = href.replace('#', '');
    const isActive = activeSection === id;
    return {
      padding: '0.42rem 0.88rem',
      borderRadius: '2rem',
      fontFamily: "'Rajdhani', sans-serif",
      fontSize: '0.86rem',
      fontWeight: 700,
      letterSpacing: '0.07em',
      textTransform: 'uppercase',
      textDecoration: 'none',
      color: isActive ? '#fff' : 'rgba(244,245,249,0.7)',
      background: isActive
        ? 'linear-gradient(135deg, #FF3358 0%, #E02042 100%)'
        : 'transparent',
      boxShadow: isActive ? '0 4px 18px rgba(224,32,66,0.38)' : 'none',
      transition: 'all 0.28s cubic-bezier(0.22, 1, 0.36, 1)',
      cursor: 'pointer',
    };
  };

  const hamburgerStyle: React.CSSProperties = {
    display: 'none',
    background: 'none',
    border: 'none',
    color: 'rgba(244,245,249,0.85)',
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
          <span style={{ fontSize: '0.62rem', color: 'rgba(251,191,36,0.6)', letterSpacing: '0.22em', marginLeft: '0.25rem', alignSelf: 'flex-end', marginBottom: '4px', fontWeight: 700 }}>
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
            top: '68px',
            left: 0,
            right: 0,
            zIndex: 99,
            background: 'rgba(10,12,22,0.96)',
            backdropFilter: 'blur(24px) saturate(180%)',
            borderBottom: '1px solid rgba(224,32,66,0.25)',
            padding: '1.5rem clamp(1.5rem, 4vw, 3.5rem)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
          }}
        >
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {NAV_LINKS.map(({ label, href }) => (
              <li key={href}>
                <a
                  href={href}
                  style={{
                    display: 'block',
                    padding: '0.75rem 1rem',
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    textDecoration: 'none',
                    color: activeSection === href.replace('#', '') ? '#FBBF24' : 'rgba(244,245,249,0.85)',
                    background: activeSection === href.replace('#', '') ? 'rgba(251,191,36,0.08)' : 'transparent',
                    borderLeft: activeSection === href.replace('#', '')
                      ? '3px solid #FBBF24'
                      : '3px solid transparent',
                    borderRadius: '0 0.5rem 0.5rem 0',
                    transition: 'all 0.25s ease',
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
