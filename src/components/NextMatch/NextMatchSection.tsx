import { useState, useEffect } from 'react';
import { fetchNextMatch } from '../../api/cricketData';
import type { NextMatchInfo } from '../../types';
import './NextMatchSection.css';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function NextMatchSection() {
  const [matchInfo, setMatchInfo] = useState<NextMatchInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [secTicking, setSecTicking] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadMatch() {
      try {
        const data = await fetchNextMatch();
        if (isMounted) {
          setMatchInfo(data);
          setLoading(false);
        }
      } catch {
        if (isMounted) {
          setMatchInfo(null);
          setLoading(false);
        }
      }
    }
    loadMatch();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (!matchInfo?.date) return;

    const targetDate = new Date(matchInfo.date);
    if (isNaN(targetDate.getTime())) return;

    function calculateTimeLeft(): TimeLeft | null {
      const now = new Date().getTime();
      const difference = targetDate.getTime() - now;

      if (difference <= 0) return null;

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      setSecTicking(true);
      setTimeout(() => setSecTicking(false), 300);
    }, 1000);

    return () => clearInterval(interval);
  }, [matchInfo]);

  const hasUpcomingMatch = matchInfo && timeLeft;

  return (
    <section id="next-match" className="next-match-section">
      <div className="next-match-glow" aria-hidden="true" />

      <div className="container">
        {/* Status Line */}
        <div className="next-match-status-banner">
          <span className="status-badge-dot" />
          <p className="status-banner-text">
            Currently active in <strong>international ODI cricket</strong> — retired from Test (2025) & T20I (2024), building towards <strong>2027 ODI World Cup</strong>
          </p>
        </div>

        {/* Section Header */}
        <div className="next-match-header">
          <span className="section-label">UPCOMING FIXTURE</span>
          <h2 className="section-title">
            NEXT <span className="text-gold">MATCH</span> COUNTDOWN
          </h2>
        </div>

        {/* Loading / Match Card / Fallback */}
        {loading ? (
          <div className="next-match-card glass-card loading-state">
            <div className="spinner" />
            <p>Checking CricketData schedule...</p>
          </div>
        ) : hasUpcomingMatch ? (
          <div className="next-match-card glass-card">
            <div className="match-meta-header">
              <span className="format-tag">ODI MATCH</span>
              <span className="match-name">{matchInfo.matchName}</span>
              <span className="match-venue">📍 {matchInfo.venue}</span>
            </div>

            {/* Countdown Grid */}
            <div className="countdown-grid">
              <div className="countdown-box">
                <span className="countdown-number">{String(timeLeft.days).padStart(2, '0')}</span>
                <span className="countdown-label">DAYS</span>
              </div>
              <span className="countdown-colon">:</span>
              <div className="countdown-box">
                <span className="countdown-number">{String(timeLeft.hours).padStart(2, '0')}</span>
                <span className="countdown-label">HOURS</span>
              </div>
              <span className="countdown-colon">:</span>
              <div className="countdown-box">
                <span className="countdown-number">{String(timeLeft.minutes).padStart(2, '0')}</span>
                <span className="countdown-label">MINUTES</span>
              </div>
              <span className="countdown-colon">:</span>
              <div className={`countdown-box seconds-box ${secTicking ? 'tick-flip' : ''}`}>
                <span className="countdown-number text-gold">{String(timeLeft.seconds).padStart(2, '0')}</span>
                <span className="countdown-label">SECONDS</span>
              </div>
            </div>

            <div className="match-meta-footer">
              <span>📅 Scheduled Date: <strong>{new Date(matchInfo.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</strong></span>
            </div>
          </div>
        ) : (
          <div className="next-match-card glass-card fallback-state">
            <div className="fallback-icon">🏏</div>
            <h3 className="fallback-title">No upcoming match scheduled yet</h3>
            <p className="fallback-subtext">Check back soon for India's next ODI series fixture schedule</p>
            <p className="fallback-note" style={{ fontSize: '0.82rem', color: '#9CA3AF', marginTop: '0.55rem', fontFamily: 'Rajdhani, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.85rem' }}>ℹ️</span>
              <span>Match countdown activates automatically 7–10 days before a scheduled fixture goes live.</span>
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
