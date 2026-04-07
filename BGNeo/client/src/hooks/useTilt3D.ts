import { useEffect, useRef } from 'react';

interface Tilt3DOptions {
  maxTilt?: number;
  perspective?: number;
  speed?: number;
  glare?: boolean;
  glareMaxOpacity?: number;
  smoothness?: number;
}

const defaultTilt: Required<Tilt3DOptions> = { maxTilt: 15, perspective: 800, speed: 400, glare: true, glareMaxOpacity: 0.15, smoothness: 0.08 };

export function useTilt3D(options: Tilt3DOptions = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const { maxTilt, perspective, speed, glare, glareMaxOpacity, smoothness } = { ...defaultTilt, ...options };
  const glareElRef = useRef<HTMLDivElement | null>(null);
  const currentTiltRef = useRef({ x: 0, y: 0 });
  const targetTiltRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    el.style.perspective = `${perspective}px`;
    el.style.transformStyle = 'preserve-3d';
    el.style.willChange = 'transform';

    if (glare && !glareElRef.current) {
      const glareEl = document.createElement('div');
      glareEl.className = 'tilt-glare';
      glareEl.style.cssText = `position:absolute;inset:-2px;border-radius:inherit;pointer-events:none;background:radial-gradient(circle at center, rgba(255,255,255,${glareMaxOpacity}), transparent 70%);opacity:0;transition:opacity ${speed}ms ease-out;z-index:1;will-change:opacity;`;
      el.insertBefore(glareEl, el.firstChild);
      glareElRef.current = glareEl;
    }

    let lastMouseX = 0, lastMouseY = 0;

    const onMove = (e: MouseEvent) => { lastMouseX = e.clientX; lastMouseY = e.clientY; if (!rafRef.current) rafRef.current = requestAnimationFrame(animate); };

    const animate = () => {
      const rect = el.getBoundingClientRect();
      const x = lastMouseX - rect.left, y = lastMouseY - rect.top;
      const cx = rect.width / 2, cy = rect.height / 2;
      targetTiltRef.current = { x: ((y - cy) / cy) * -maxTilt, y: ((x - cx) / cx) * maxTilt };
      currentTiltRef.current.x += (targetTiltRef.current.x - currentTiltRef.current.x) * (1 - smoothness);
      currentTiltRef.current.y += (targetTiltRef.current.y - currentTiltRef.current.y) * (1 - smoothness);
      el.style.transform = `rotateX(${currentTiltRef.current.x}deg) rotateY(${currentTiltRef.current.y}deg) translateZ(0)`;

      if (glareElRef.current) {
        glareElRef.current.style.backgroundImage = `radial-gradient(circle at ${(x / rect.width) * 100}% ${(y / rect.height) * 100}%, rgba(255,255,255,${glareMaxOpacity}), transparent 70%)`;
        glareElRef.current.style.opacity = '1';
      }

      const settled = Math.abs(currentTiltRef.current.x - targetTiltRef.current.x) < 0.01 && Math.abs(currentTiltRef.current.y - targetTiltRef.current.y) < 0.01;
      if (!settled) rafRef.current = requestAnimationFrame(animate);
      else rafRef.current = 0;
    };

    const onLeave = () => {
      targetTiltRef.current = { x: 0, y: 0 };
      const settleAnimate = () => {
        currentTiltRef.current.x += (targetTiltRef.current.x - currentTiltRef.current.x) * (1 - smoothness);
        currentTiltRef.current.y += (targetTiltRef.current.y - currentTiltRef.current.y) * (1 - smoothness);
        el.style.transform = `rotateX(${currentTiltRef.current.x}deg) rotateY(${currentTiltRef.current.y}deg)`;
        if (Math.abs(currentTiltRef.current.x) > 0.01 || Math.abs(currentTiltRef.current.y) > 0.01) rafRef.current = requestAnimationFrame(settleAnimate);
        else { el.style.transform = 'rotateX(0) rotateY(0)'; if (glareElRef.current) glareElRef.current.style.opacity = '0'; rafRef.current = 0; }
      };
      rafRef.current = requestAnimationFrame(settleAnimate);
    };

    el.addEventListener('mousemove', onMove, { passive: true });
    el.addEventListener('mouseleave', onLeave);
    return () => { el.removeEventListener('mousemove', onMove); el.removeEventListener('mouseleave', onLeave); if (rafRef.current) cancelAnimationFrame(rafRef.current); el.style.willChange = 'auto'; };
  }, [maxTilt, perspective, speed, glare, glareMaxOpacity, smoothness]);

  return ref;
}
