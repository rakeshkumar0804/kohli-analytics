import { useState, useEffect } from 'react';
import { fetchNextMatch, type NextMatchResult } from '../../api/cricketData';
import type { NextMatchInfo } from '../../types';
import './NextMatchSection.css';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function NextMatchSection() {
  const [result, setResult] = useState<NextMatchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [secTicking, setSecTicking] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadMatch() {
      try {
        const res = await fetchNextMatch();
        if (isMounted) {
          setResult(res);
          setLoading(false);
        }
      } catch (err: unknown) {
        console.error('[NextMatchSection] Exception loading match fixture:', err);
        if (isMounted) {
          setResult({
            status: 'unavailable',
            match: null,
            message: 'An unexpected error occurred while fetching fixture information.',
            reason: 'network-error',
            fetchedAt: new Date().toISOString(),
          });
          setLoading(false);
        }
      }
    }
    loadMatch();
    return () => {
      isMounted = false;
    };
  }, []);

  const matchInfo: NextMatchInfo | null = result?.match ?? null;

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

    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      setSecTicking(true);
      const timer = setTimeout(() => setSecTicking(false), 300);
      return () => clearTimeout(timer);
    }, 1000);

    return () => clearInterval(interval);
  }, [matchInfo]);

  const isAvailable = result?.status === 'available' && matchInfo && timeLeft;
  const isConfirmedEmpty = result?.status === 'confirmed-empty';

  return (
    <section id="next-match" className="next-match-section" aria-labelledby="next-match-heading">
      <div className="next-match-glow" aria-hidden="true" />

      <div className="container">
        {/* Status Banner */}
        <div className="next-match-status-banner">
          <span className="status-badge-dot" aria-hidden="true" />
          <p className="status-banner-text">
            Currently active in <strong>international ODI cricket</strong> — retired from Test (2025) & T20I (2024), building towards <strong>2027 ODI World Cup</strong>
          </p>
        </div>

        {/* Section Header */}
        <div className="next-match-header">
          <span className="section-label">FIXTURE STATUS</span>
          <h2 id="next-match-heading" className="section-title">
            NEXT <span className="text-gold">MATCH</span> STATUS
          </h2>
        </div>

        {/* Loading / Available Match / Honest Unavailable State */}
        {loading ? (
          <div className="next-match-card glass-card loading-state" role="status" aria-live="polite">
            <div className="spinner" aria-hidden="true" />
            <p>Checking verified schedule status...</p>
          </div>
        ) : isAvailable ? (
          <div className="next-match-card glass-card">
            <div className="match-meta-header">
              <span className="format-tag">ODI FIXTURE</span>
              <span className="match-name">{matchInfo.matchName}</span>
              <span className="match-venue">📍 {matchInfo.venue}</span>
            </div>

            {/* Countdown Grid */}
            <div className="countdown-grid" role="timer" aria-label="Time remaining until match">
              <div className="countdown-box">
                <span className="countdown-number">{String(timeLeft.days).padStart(2, '0')}</span>
                <span className="countdown-label">DAYS</span>
              </div>
              <span className="countdown-colon" aria-hidden="true">:</span>
              <div className="countdown-box">
                <span className="countdown-number">{String(timeLeft.hours).padStart(2, '0')}</span>
                <span className="countdown-label">HOURS</span>
              </div>
              <span className="countdown-colon" aria-hidden="true">:</span>
              <div className="countdown-box">
                <span className="countdown-number">{String(timeLeft.minutes).padStart(2, '0')}</span>
                <span className="countdown-label">MINUTES</span>
              </div>
              <span className="countdown-colon" aria-hidden="true">:</span>
              <div className={`countdown-box seconds-box ${secTicking ? 'tick-flip' : ''}`}>
                <span className="countdown-number text-gold">{String(timeLeft.seconds).padStart(2, '0')}</span>
                <span className="countdown-label">SECONDS</span>
              </div>
            </div>

            <div className="match-meta-footer">
              <span>📅 Scheduled Date: <strong>{new Date(matchInfo.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</strong></span>
            </div>
          </div>
        ) : isConfirmedEmpty ? (
          <div className="next-match-card glass-card fallback-state">
            <div className="fallback-icon" aria-hidden="true">🏏</div>
            <h3 className="fallback-title">No upcoming ODI fixtures currently scheduled</h3>
            <p className="fallback-subtext">Verified calendar contains no confirmed international fixtures for India at this time.</p>
          </div>
        ) : (
          <div className="next-match-card glass-card fallback-state">
            <div className="fallback-icon" aria-hidden="true">🛡️</div>
            <span className="format-tag" style={{ background: 'rgba(255,215,0,0.1)', borderColor: 'rgba(255,215,0,0.3)', color: 'var(--gold-primary)' }}>
              FEED STATUS
            </span>
            <h3 className="fallback-title">
              {result?.reason === 'rate-limited'
                ? 'Rate Limit Exceeded (Please Retry Shortly)'
                : result?.reason === 'missing-credentials'
                ? 'Provider Credentials Pending Server Configuration'
                : 'Live Fixture Feed Unavailable'}
            </h3>
            <p className="fallback-subtext">
              {result?.message || 'Real-time schedule data is temporarily unavailable from the upstream provider.'}
            </p>
            <div className="fixture-disclosure-box">
              <p className="fallback-note">
                <span aria-hidden="true">ℹ️</span>
                <span><strong>Active Competition Status:</strong> Virat Kohli is active in international ODI cricket preparing for the 2027 ICC World Cup.</span>
              </p>
              <p className="fallback-note" style={{ marginTop: '0.35rem', color: '#9CA3AF' }}>
                <span>Fixture feed routes through a secure server-side endpoint with bounded caching and isolated provider credentials.</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
