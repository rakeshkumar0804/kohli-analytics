import { useState, useEffect, useRef, useCallback } from 'react';
import type { LiveAPIStats } from '../types';
import { fetchKohliStats } from '../api/cricketData';
import { careerStats } from '../data/kohliData';

const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes

let cachedStats: LiveAPIStats | null = null;
let cacheTimestamp = 0;

export function useCricketAPI() {
  const [stats, setStats] = useState<LiveAPIStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    const now = Date.now();
    if (cachedStats && now - cacheTimestamp < CACHE_DURATION_MS) {
      setStats(cachedStats);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchKohliStats();
      cachedStats = result;
      cacheTimestamp = Date.now();
      setStats(result);
    } catch {
      setError('Failed to load live stats');
      setStats({
        matches: careerStats.overall.matches,
        runs: careerStats.overall.runs,
        centuries: careerStats.overall.centuries,
        average: careerStats.odi.average,
        strikeRate: careerStats.odi.strikeRate,
        highScore: careerStats.odi.highScore,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { stats, loading, error };
}

// ── useCountUp hook ────────────────────────────────────────────
interface UseCountUpOptions {
  target: number;
  duration?: number;
  decimals?: number;
  startOnVisible?: boolean;
}

export function useCountUp({
  target,
  duration = 2000,
  decimals = 0,
  startOnVisible = true,
}: UseCountUpOptions) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(!startOnVisible);
  const ref = useRef<HTMLElement | null>(null);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  const start = useCallback(() => {
    setHasStarted(true);
  }, []);

  useEffect(() => {
    if (!startOnVisible) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [startOnVisible]);

  useEffect(() => {
    if (!hasStarted) return;

    startTimeRef.current = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * target;
      setCount(parseFloat(current.toFixed(decimals)));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setCount(target);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [hasStarted, target, duration, decimals]);

  return { count, ref, start };
}

// ── useIntersectionObserver ─────────────────────────────────────
export function useIntersectionObserver(
  threshold = 0.2
): [React.RefObject<HTMLElement | null>, boolean] {
  const ref = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, isVisible];
}
