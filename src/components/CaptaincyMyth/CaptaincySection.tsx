import { useState, useEffect } from 'react';
import { useCountUp, useIntersectionObserver } from '../../hooks';
import './CaptaincySection.css';

interface IndianCaptain {
  name: string;
  winRate: number;
  tests: number;
  wins: number;
  isKohli?: boolean;
}

const INDIAN_CAPTAINS: IndianCaptain[] = [
  { name: 'Virat Kohli', winRate: 58.82, tests: 68, wins: 40, isKohli: true },
  { name: 'Rahul Dravid', winRate: 48.00, tests: 25, wins: 12 },
  { name: 'MS Dhoni', winRate: 45.00, tests: 60, wins: 27 },
  { name: 'S. Ganguly', winRate: 42.86, tests: 49, wins: 21 },
];

const CAPTAINCY_STATS = [
  {
    num: 68,
    unit: 'Tests',
    title: 'Tests Captained',
    desc: '40 Wins · 17 Losses · 11 Draws',
    decimals: 0,
  },
  {
    num: 58.82,
    unit: '%',
    title: 'Test Win Rate',
    desc: "India's most successful Test captain of all time",
    decimals: 2,
    highlight: true,
  },
  {
    num: 42,
    unit: 'Months',
    title: 'World No. 1 Test Team',
    desc: 'Consecutive months at top spot (Oct 2016 – Mar 2020)',
    decimals: 0,
  },
  {
    num: 1,
    unit: 'st',
    title: 'Series Win in Australia',
    desc: 'First Asian captain to win a Test series Down Under (2018/19)',
    decimals: 0,
    isFirst: true,
  },
  {
    num: 9,
    unit: 'Series',
    title: 'Consecutive Series Wins',
    desc: "2015–2017 — equaled Ricky Ponting's global record",
    decimals: 0,
  },
  {
    num: 15,
    unit: 'Wins',
    title: 'Overseas Test Wins',
    desc: 'Most away Test victories by any Indian skipper in history',
    decimals: 0,
  },
];

function StatCard({ stat, isVisible, delay }: { stat: typeof CAPTAINCY_STATS[0]; isVisible: boolean; delay: number }) {
  const { count, ref } = useCountUp({
    target: stat.num,
    duration: 2000,
    decimals: stat.decimals,
    startOnVisible: false,
  });

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`captaincy-stat-card glass-card ${stat.highlight ? 'highlight-card' : ''} ${isVisible ? 'animate-in' : ''}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="stat-number-wrapper">
        <span className={`stat-number ${stat.highlight ? 'text-gold' : 'text-primary'}`}>
          {stat.isFirst ? '1st' : stat.decimals > 0 ? (isVisible ? count.toFixed(stat.decimals) : '0.00') : (isVisible ? Math.round(count) : 0)}
        </span>
        {!stat.isFirst && <span className="stat-unit">{stat.unit}</span>}
      </div>
      <h4 className="stat-card-title">{stat.title}</h4>
      <p className="stat-card-desc">{stat.desc}</p>
    </div>
  );
}

export default function CaptaincySection() {
  const [sectionRef, isVisible] = useIntersectionObserver(0.15);
  const [currentBeat, setCurrentBeat] = useState<1 | 2 | 3 | 4>(1);

  useEffect(() => {
    if (!isVisible) {
      setCurrentBeat(1);
      return;
    }

    // Beat timing orchestration:
    // Beat 1: Show uploaded photo + "THE NARRATIVE"
    // Beat 2: Strike through "THE NARRATIVE" -> "THE NUMBERS" (photo begins fading)
    // Beat 3: Reveal Stat cards grid + comparison bars (photo fully faded)
    // Beat 4: Reveal Payoff quote
    const timer1 = setTimeout(() => setCurrentBeat(2), 1500);
    const timer2 = setTimeout(() => setCurrentBeat(3), 2600);
    const timer3 = setTimeout(() => setCurrentBeat(4), 5000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [isVisible]);

  return (
    <section id="captaincy-myth" className="captaincy-section" ref={sectionRef as React.RefObject<HTMLElement>}>
      {/* ── Beat 1 Image Background Overlay (fades out in Beat 2/3) ── */}
      <div
        className={`captaincy-hero-bg ${currentBeat >= 2 ? 'bg-faded' : ''}`}
        style={{ backgroundImage: `url('/assets/kohli_captain.png')` }}
        aria-hidden="true"
      >
        <div className="captaincy-hero-vignette" />
      </div>

      {/* Background Glow */}
      <div className="captaincy-bg-glow" aria-hidden="true" />

      <div className="container relative-z">
        {/* Header Badge */}
        <div className="section-label center-label">
          <span>THE CAPTAINCY MYTH</span>
        </div>

        {/* ── Beat 1 & Beat 2: Narrative to Numbers Flip ── */}
        <div className="beat-narrative-container">
          <div className={`narrative-heading-wrapper ${currentBeat >= 2 ? 'beat-turn-active' : ''}`}>
            <h2 className="narrative-heading strike-text">
              THE <span className="strikethrough-word">NARRATIVE</span>
            </h2>
            <h2 className="narrative-heading numbers-text text-gold">
              THE <span className="glow-gold">NUMBERS</span>
            </h2>
          </div>

          <p className="narrative-subtext">
            {currentBeat < 2 ? (
              'Written off as a failed captain after India\'s 2022 T20 World Cup exit.'
            ) : (
              'The media engineered a myth. The hard data tells an entirely different story.'
            )}
          </p>
        </div>

        {/* ── Beat 3: The Rebuttal Data Grid ── */}
        <div className={`rebuttal-container ${currentBeat >= 3 ? 'rebuttal-visible' : ''}`}>
          <div className="captaincy-grid">
            {CAPTAINCY_STATS.map((stat, idx) => (
              <StatCard key={stat.title} stat={stat} isVisible={currentBeat >= 3} delay={idx * 100} />
            ))}
          </div>

          {/* Comparison Bar Chart */}
          <div className="captaincy-comparison-box glass-card">
            <div className="comparison-header">
              <h3>India's Test Captains — Win Percentage</h3>
              <span className="comparison-subtitle">Minimum 20 Tests Captained</span>
            </div>

            <div className="comparison-bars-list">
              {INDIAN_CAPTAINS.map((cap, i) => (
                <div key={cap.name} className="cap-bar-row">
                  <span className={`cap-name ${cap.isKohli ? 'cap-name--kohli' : ''}`}>
                    {cap.isKohli && '👑 '}{cap.name}
                  </span>
                  <div className="cap-bar-track">
                    <div
                      className={`cap-bar-fill ${cap.isKohli ? 'cap-bar-fill--kohli' : ''}`}
                      style={{
                        width: currentBeat >= 3 ? `${(cap.winRate / 65) * 100}%` : '0%',
                        transitionDelay: `${i * 150 + 300}ms`,
                      }}
                    >
                      <span className="cap-bar-val">{cap.winRate}%</span>
                    </div>
                  </div>
                  <span className="cap-record">({cap.wins}W / {cap.tests}T)</span>
                </div>
              ))}
            </div>
          </div>

          {/* Credibility Honest Small Print Line */}
          <div className="honest-disclaimer">
            <span>ℹ️</span>
            <p>
              No ICC trophy as captain — runner-up at 2017 Champions Trophy and 2021 WTC final — but statistically India's most dominant Test era.
            </p>
          </div>
        </div>

        {/* ── Beat 4: The Payoff ── */}
        <div className={`payoff-container ${currentBeat >= 4 ? 'payoff-visible' : ''}`}>
          <div className="payoff-divider" />
          <h3 className="payoff-headline">
            "The numbers don't fail. <span className="text-red">Perception does.</span>"
          </h3>
          <p className="payoff-subtext">Scroll down to explore the arc of his career eras ↓</p>
        </div>
      </div>
    </section>
  );
}
