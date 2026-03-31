"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animates a number from 0 to `target` over `duration` ms using an ease-out cubic curve.
 * The animation starts when `start` becomes true.
 *
 * @param target   - final numeric value
 * @param duration - animation duration in ms (default 2000)
 * @param start    - trigger flag — set to true to begin
 * @param decimals - decimal places in the formatted string (default 0)
 */
export function useCountUp(
  target: number,
  duration = 2000,
  start = false,
  decimals = 0,
): string {
  const [display, setDisplay] = useState(Number(0).toFixed(decimals));
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (!start) return;

    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay((eased * target).toFixed(decimals));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration, start, decimals]);

  return display;
}
