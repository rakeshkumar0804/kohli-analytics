import { lazy, Suspense } from 'react';
import SmoothScrollWrapper from './components/Layout/SmoothScrollWrapper';
import Navbar from './components/Layout/Navbar';
import Hero from './components/Hero/Hero';
import NextMatchSection from './components/NextMatch/NextMatchSection';
import ErrorBoundary from './components/Common/ErrorBoundary';
import { DATA_VERIFIED_ON_FORMATTED } from './data/dataSources';

// ── Heavy Below-The-Fold Components (Code-Split with React.lazy) ──
const ClutchSection = lazy(() => import('./components/ClutchIndex/ClutchSection'));
const CaptaincySection = lazy(() => import('./components/CaptaincyMyth/CaptaincySection'));
const EraSection = lazy(() => import('./components/EraEngine/EraSection'));
const PressureSection = lazy(() => import('./components/PressureMap/PressureSection'));
const ChaseSection = lazy(() => import('./components/ChaseMaster/ChaseSection'));
const DefiningInningsSection = lazy(() => import('./components/DefiningInnings/DefiningInningsSection'));
const LegendsSection = lazy(() => import('./components/LegendsShowdown/LegendsSection'));
const IPLSection = lazy(() => import('./components/IPL/IPLSection'));
const CareerTimelineSection = lazy(() => import('./components/Timeline/CareerTimelineSection'));
const WorldSection = lazy(() => import('./components/WorldMap/WorldSection'));
const BonusSection = lazy(() => import('./components/Bonus/BonusSection'));

function SectionSkeleton({ label }: { label: string }) {
  return (
    <div className="section-skeleton-loader" role="status" aria-live="polite">
      <div className="section-skeleton-spinner" aria-hidden="true" />
      <p className="section-skeleton-text">Loading {label}...</p>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary fallbackTitle="Application Rendering Error">
      <SmoothScrollWrapper>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <div className="app-container">
          <Navbar />
          <main id="main-content">
            <Hero />
            <NextMatchSection />

            <Suspense fallback={<SectionSkeleton label="Clutch Index Analytics" />}>
              <ErrorBoundary fallbackTitle="Clutch Index Error">
                <ClutchSection />
              </ErrorBoundary>
            </Suspense>

            <Suspense fallback={<SectionSkeleton label="Captaincy Analytics" />}>
              <ErrorBoundary fallbackTitle="Captaincy Analytics Error">
                <CaptaincySection />
              </ErrorBoundary>
            </Suspense>

            <Suspense fallback={<SectionSkeleton label="Era Engine" />}>
              <ErrorBoundary fallbackTitle="Era Engine Error">
                <EraSection />
              </ErrorBoundary>
            </Suspense>

            <Suspense fallback={<SectionSkeleton label="Pressure Map" />}>
              <ErrorBoundary fallbackTitle="Pressure Map Error">
                <PressureSection />
              </ErrorBoundary>
            </Suspense>

            <Suspense fallback={<SectionSkeleton label="Chase Master Analytics" />}>
              <ErrorBoundary fallbackTitle="Chase Master Error">
                <ChaseSection />
              </ErrorBoundary>
            </Suspense>

            <Suspense fallback={<SectionSkeleton label="Defining Innings Gallery" />}>
              <ErrorBoundary fallbackTitle="Defining Innings Error">
                <DefiningInningsSection />
              </ErrorBoundary>
            </Suspense>

            <Suspense fallback={<SectionSkeleton label="Legends Comparison" />}>
              <ErrorBoundary fallbackTitle="Legends Comparison Error">
                <LegendsSection />
              </ErrorBoundary>
            </Suspense>

            <Suspense fallback={<SectionSkeleton label="IPL & Domestic Analytics" />}>
              <ErrorBoundary fallbackTitle="IPL Analytics Error">
                <IPLSection />
              </ErrorBoundary>
            </Suspense>

            <Suspense fallback={<SectionSkeleton label="Career Timeline" />}>
              <ErrorBoundary fallbackTitle="Career Timeline Error">
                <CareerTimelineSection />
              </ErrorBoundary>
            </Suspense>

            <Suspense fallback={<SectionSkeleton label="World Dominance Map" />}>
              <ErrorBoundary fallbackTitle="World Map Error">
                <WorldSection />
              </ErrorBoundary>
            </Suspense>

            <Suspense fallback={<SectionSkeleton label="Career Milestones & Quiz" />}>
              <ErrorBoundary fallbackTitle="Interactive Bonus Error">
                <BonusSection />
              </ErrorBoundary>
            </Suspense>
          </main>

          <footer
            style={{
              padding: '3rem var(--section-pad-x)',
              borderTop: '1px solid var(--border-subtle)',
              textAlign: 'center',
              background: 'var(--bg-base)',
              color: 'var(--text-muted)',
              fontSize: '0.85rem',
            }}
          >
            <p style={{ marginBottom: '0.5rem' }}>
              <span
                style={{
                  color: 'var(--gold-primary)',
                  fontFamily: 'Bebas Neue',
                  fontSize: '1.2rem',
                  letterSpacing: '0.05em',
                }}
              >
                👑 KING KOHLI — THE ANALYTICS STORY
              </span>
            </p>
            <p>
              Portfolio-grade Data Engineering & Visualization Project. Sourced from Cricsheet open ball-by-ball archive & verified career baselines.
            </p>
            <p style={{ marginTop: '0.4rem', fontSize: '0.78rem', color: '#9CA3AF' }}>
              Data verification snapshot: {DATA_VERIFIED_ON_FORMATTED} · Verified delivery coverage: 412/419 limited-overs innings (98.33%)
            </p>
            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <a
                href="/data-dictionary.json"
                download="virat-kohli-data-dictionary.json"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.4rem 0.9rem',
                  borderRadius: '2rem',
                  border: '1px solid var(--border-gold)',
                  background: 'rgba(255, 215, 0, 0.08)',
                  color: 'var(--gold-primary)',
                  textDecoration: 'none',
                  fontFamily: 'var(--font-heading)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                📥 Download Data Dictionary (JSON)
              </a>
            </div>
          </footer>

        </div>
      </SmoothScrollWrapper>
    </ErrorBoundary>
  );
}
