import SmoothScrollWrapper from './components/Layout/SmoothScrollWrapper';
import Navbar from './components/Layout/Navbar';
import Hero from './components/Hero/Hero';
import NextMatchSection from './components/NextMatch/NextMatchSection';
import ClutchSection from './components/ClutchIndex/ClutchSection';
import CaptaincySection from './components/CaptaincyMyth/CaptaincySection';
import EraSection from './components/EraEngine/EraSection';
import PressureSection from './components/PressureMap/PressureSection';
import ChaseSection from './components/ChaseMaster/ChaseSection';
import LegendsSection from './components/LegendsShowdown/LegendsSection';
import WorldSection from './components/WorldMap/WorldSection';
import BonusSection from './components/Bonus/BonusSection';

export default function App() {
  return (
    <SmoothScrollWrapper>
      <div className="app-container">
        <Navbar />
        <main>
          <Hero />
          <NextMatchSection />
          <ClutchSection />
          <CaptaincySection />
          <EraSection />
          <PressureSection />
          <ChaseSection />
          <LegendsSection />
          <WorldSection />
          <BonusSection />
        </main>

        <footer style={{
          padding: '3rem var(--section-pad-x)',
          borderTop: '1px solid var(--border-subtle)',
          textAlign: 'center',
          background: 'var(--bg-base)',
          color: 'var(--text-muted)',
          fontSize: '0.85rem'
        }}>
          <p style={{ marginBottom: '0.5rem' }}>
            <span style={{ color: 'var(--gold-primary)', fontFamily: 'Bebas Neue', fontSize: '1.2rem', letterSpacing: '0.05em' }}>👑 KING KOHLI — THE ANALYTICS STORY</span>
          </p>
          <p>Portfolio-grade Data Engineering & Visualization Project. Sourced from CricketData API & Cricsheet dataset.</p>
        </footer>
      </div>
    </SmoothScrollWrapper>
  );
}
