import { useCallback, useEffect, useRef, useState } from 'react';

interface SpringConfig {
  stiffness?: number;
  damping?: number;
  mass?: number;
  precision?: number;
}

const defaultSpring: Required<SpringConfig> = { stiffness: 170, damping: 26, mass: 1, precision: 0.01 };

export function useSpringAnimation(targetValue: number, config: SpringConfig = {}, immediate = false) {
  const { stiffness, damping, mass, precision } = { ...defaultSpring, ...config };
  const [current, setCurrent] = useState(targetValue);
  const velRef = useRef(0);
  const targetRef = useRef(targetValue);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    targetRef.current = targetValue;
    if (immediate) { setCurrent(targetValue); velRef.current = 0; return; }

    let pos = current, vel = velRef.current, animating = true;

    const step = () => {
      if (!animating) return;
      const springF = -stiffness * (pos - targetRef.current);
      const dampF = -damping * vel;
      vel += (springF + dampF) / mass / 60;
      pos += vel / 60;

      if (Math.abs(pos - targetRef.current) > precision || Math.abs(vel) > precision) {
        setCurrent(pos); velRef.current = vel; rafRef.current = requestAnimationFrame(step);
      } else {
        setCurrent(targetRef.current); velRef.current = 0; rafRef.current = 0;
      }
    };

    rafRef.current = requestAnimationFrame(step);
    return () => { animating = false; if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [targetValue, stiffness, damping, mass, precision, immediate]);

  const reset = useCallback((val: number) => { setCurrent(val); velRef.current = 0; targetRef.current = val; }, []);
  return [current, reset] as const;
}
