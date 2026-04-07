import { useEffect, useRef } from 'react';

interface MagneticOptions {
  strength?: number;
  radius?: number;
  damping?: number;
  springiness?: number;
}

const defaultMagnetic: Required<MagneticOptions> = { strength: 0.35, radius: 120, damping: 0.15, springiness: 0.12 };

export function useMagnetic(options: MagneticOptions = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const { strength, radius, damping, springiness } = { ...defaultMagnetic, ...options };
  const posRef = useRef({ x: 0, y: 0 });
  const targetRef = useRef({ x: 0, y: 0 });
  const velRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    el.style.willChange = 'transform';
    el.style.transform = 'translateZ(0)';

    const onMouseMove = (e: MouseEvent) => {
      const now = performance.now();
      if (now - lastTimeRef.current < 8) return;
      lastTimeRef.current = now;

      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx, dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < radius) {
        const pull = (1 - dist / radius) * strength;
        const eased = pull * pull * (3 - 2 * pull);
        targetRef.current = { x: dx * eased, y: dy * eased };
      } else {
        targetRef.current = { x: 0, y: 0 };
      }
      if (!rafRef.current) rafRef.current = requestAnimationFrame(animate);
    };

    const onMouseLeave = () => { targetRef.current = { x: 0, y: 0 }; if (!rafRef.current) rafRef.current = requestAnimationFrame(animate); };

    const animate = () => {
      const dx = targetRef.current.x - posRef.current.x;
      const dy = targetRef.current.y - posRef.current.y;
      velRef.current.x += dx * springiness; velRef.current.y += dy * springiness;
      velRef.current.x *= (1 - damping); velRef.current.y *= (1 - damping);
      posRef.current.x += velRef.current.x; posRef.current.y += velRef.current.y;
      el.style.transform = `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0)`;

      const settled = Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05 && Math.abs(velRef.current.x) < 0.05 && Math.abs(velRef.current.y) < 0.05;
      if (!settled) { rafRef.current = requestAnimationFrame(animate); }
      else { posRef.current = { x: 0, y: 0 }; velRef.current = { x: 0, y: 0 }; el.style.transform = 'translate3d(0, 0, 0)'; rafRef.current = 0; }
    };

    document.addEventListener('mousemove', onMouseMove, { passive: true });
    el.addEventListener('mouseleave', onMouseLeave);
    return () => { document.removeEventListener('mousemove', onMouseMove); el.removeEventListener('mouseleave', onMouseLeave); if (rafRef.current) cancelAnimationFrame(rafRef.current); el.style.willChange = 'auto'; };
  }, [strength, radius, damping, springiness]);

  return ref;
}
