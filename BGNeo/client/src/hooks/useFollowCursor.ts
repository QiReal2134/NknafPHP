import { useEffect, useRef } from 'react';

interface FollowCursorOptions {
  intensity?: number;
  smoothing?: number;
  invertX?: boolean;
  invertY?: boolean;
  springMass?: number;
  springStiffness?: number;
}

const defaultFollow: Required<FollowCursorOptions> = { intensity: 20, smoothing: 0.12, invertX: false, invertY: false, springMass: 1, springStiffness: 150 };

export function useFollowCursor(options: FollowCursorOptions = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const { intensity, invertX, invertY, springMass, springStiffness } = { ...defaultFollow, ...options };
  const posRef = useRef({ x: 0, y: 0 });
  const targetRef = useRef({ x: 0, y: 0 });
  const velRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    el.style.willChange = 'transform';

    const onMouseMove = (e: MouseEvent) => {
      const now = performance.now();
      if (now - lastTimeRef.current < 6) return;
      lastTimeRef.current = now;

      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx, dy = e.clientY - cy;

      targetRef.current = { x: (invertX ? -dx : dx) * intensity * 0.01, y: (invertY ? -dy : dy) * intensity * 0.01 };
      if (!rafRef.current) rafRef.current = requestAnimationFrame(animate);
    };

    const onMouseLeave = () => { targetRef.current = { x: 0, y: 0 }; if (!rafRef.current) rafRef.current = requestAnimationFrame(animate); };

    const animate = () => {
      const springForceX = -springStiffness * (posRef.current.x - targetRef.current.x);
      const springForceY = -springStiffness * (posRef.current.y - targetRef.current.y);
      const dampForceX = -springStiffness * 0.25 * velRef.current.x;
      const dampForceY = -springStiffness * 0.25 * velRef.current.y;

      velRef.current.x += (springForceX + dampForceX) / springMass / 60;
      velRef.current.y += (springForceY + dampForceY) / springMass / 60;
      posRef.current.x += velRef.current.x; posRef.current.y += velRef.current.y;
      el.style.transform = `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0)`;

      const settled = Math.abs(posRef.current.x - targetRef.current.x) > 0.02 || Math.abs(posRef.current.y - targetRef.current.y) > 0.02 || Math.abs(velRef.current.x) > 0.02 || Math.abs(velRef.current.y) > 0.02;
      if (settled) { rafRef.current = requestAnimationFrame(animate); }
      else { posRef.current = { x: targetRef.current.x, y: targetRef.current.y }; velRef.current = { x: 0, y: 0 }; rafRef.current = 0; }
    };

    el.addEventListener('mousemove', onMouseMove, { passive: true });
    el.addEventListener('mouseleave', onMouseLeave);
    return () => { el.removeEventListener('mousemove', onMouseMove); el.removeEventListener('mouseleave', onMouseLeave); if (rafRef.current) cancelAnimationFrame(rafRef.current); el.style.willChange = 'auto'; };
  }, [intensity, invertX, invertY, springMass, springStiffness]);

  return ref;
}
