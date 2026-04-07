import { useEffect, useRef } from 'react';

interface ParallaxOptions {
  speed?: number;
  direction?: 'up' | 'down';
  disabled?: boolean;
  offset?: number;
}

const defaultOpts: Required<ParallaxOptions> = {
  speed: 0.5,
  direction: 'up',
  disabled: false,
  offset: 0,
};

export function useParallax(options: ParallaxOptions = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const opts = { ...defaultOpts, ...options };
  const currentYRef = useRef(0);
  const targetYRef = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el || opts.disabled) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    el.style.willChange = 'transform';
    el.style.backfaceVisibility = 'hidden';

    let ticking = false;
    let smoothRafId = 0;

    const computeTarget = () => {
      const rect = el.getBoundingClientRect();
      const viewHeight = window.innerHeight;
      const centerDist = rect.top + rect.height / 2 - viewHeight / 2;
      const maxMove = (viewHeight + rect.height) / 2;
      const progress = Math.max(-1, Math.min(1, centerDist / maxMove));
      const mult = opts.direction === 'up' ? -1 : 1;
      targetYRef.current = progress * opts.speed * 100 * mult + opts.offset;
    };

    const smoothUpdate = () => {
      currentYRef.current += (targetYRef.current - currentYRef.current) * 0.08;
      el.style.transform = `translate3d(0, ${currentYRef.current}px, 0)`;

      if (Math.abs(currentYRef.current - targetYRef.current) > 0.1) {
        smoothRafId = requestAnimationFrame(smoothUpdate);
      } else {
        smoothRafId = 0;
      }
    };

    const update = () => {
      computeTarget();

      if (!smoothRafId) {
        smoothRafId = requestAnimationFrame(smoothUpdate);
      }

      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    computeTarget();
    update();
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (smoothRafId) cancelAnimationFrame(smoothRafId);
      el.style.willChange = 'auto';
    };
  }, [opts.speed, opts.direction, opts.disabled, opts.offset]);

  return ref;
}
