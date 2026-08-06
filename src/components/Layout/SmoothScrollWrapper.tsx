import { useEffect, useRef, type ReactNode } from 'react';
import ReactLenis from 'lenis/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface SmoothScrollWrapperProps {
  children: ReactNode;
}

/**
 * Wraps the app with Lenis smooth scroll, synced to GSAP's RAF loop.
 * This prevents the dual-RAF stutter when using both Lenis and GSAP ScrollTrigger.
 */
export default function SmoothScrollWrapper({ children }: SmoothScrollWrapperProps) {
  const lenisRef = useRef<any>(null);

  useEffect(() => {
    function update(time: number) {
      lenisRef.current?.lenis?.raf(time * 1000);
    }
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(update);
    };
  }, []);

  return (
    <ReactLenis
      root
      ref={lenisRef}
      options={{
        autoRaf: false,
        lerp: 0.08,
        duration: 1.2,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        touchMultiplier: 2,
        infinite: false,
      }}
    >
      {children}
    </ReactLenis>
  );
}
