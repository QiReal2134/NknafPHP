import { useEffect, useRef, useState, useCallback } from 'react';
import { globalEngine } from '../engines/ParallelRenderEngine';

interface PageTransitionProps {
  children: React.ReactNode;
  mode?: 'fade' | 'slideUp' | 'slideLeft' | 'scale' | 'blur' | 'flip' | 'zoom';
  duration?: number;
}

interface AnimationKeyframes {
  from: Record<string, string>;
  to: Record<string, string>;
  exitTo: Record<string, string>;
}

const animationPresets: Record<string, AnimationKeyframes> = {
  fade: {
    from: { opacity: '0' },
    to: { opacity: '1' },
    exitTo: { opacity: '0' },
  },
  slideUp: {
    from: { opacity: '0', transform: 'translateY(16px)' },
    to: { opacity: '1', transform: 'translateY(0)' },
    exitTo: { opacity: '0', transform: 'translateY(-8px)' },
  },
  slideLeft: {
    from: { opacity: '0', transform: 'translateX(-16px)' },
    to: { opacity: '1', transform: 'translateX(0)' },
    exitTo: { opacity: '0', transform: 'translateX(8px)' },
  },
  scale: {
    from: { opacity: '0', transform: 'scale(0.96)' },
    to: { opacity: '1', transform: 'scale(1)' },
    exitTo: { opacity: '0', transform: 'scale(0.97)' },
  },
  blur: {
    from: { opacity: '0', filter: 'blur(6px)' },
    to: { opacity: '1', filter: 'blur(0px)' },
    exitTo: { opacity: '0', filter: 'blur(4px)' },
  },
  flip: {
    from: { opacity: '0', transform: 'perspective(400px) rotateY(-12deg)' },
    to: { opacity: '1', transform: 'perspective(400px) rotateY(0deg)' },
    exitTo: { opacity: '0', transform: 'perspective(400px) rotateY(10deg)' },
  },
  zoom: {
    from: { opacity: '0', transform: 'scale(0.92) translateZ(-50px)' },
    to: { opacity: '1', transform: 'scale(1) translateZ(0)' },
    exitTo: { opacity: '0', transform: 'scale(0.95) translateZ(-30px)' },
  },
};

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeInQuad(t: number): number {
  return t * t;
}

export default function PageTransition({
  children,
  mode = 'slideUp',
  duration = 450,
}: PageTransitionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const preset = animationPresets[mode] || animationPresets.slideUp;

  const applyStyles = useCallback((element: HTMLDivElement, styles: Record<string, string>) => {
    for (const [prop, value] of Object.entries(styles)) {
      element.style.setProperty(prop, value);
    }
  }, []);

  const runEnterAnimation = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    globalEngine.promoteToGPULayer(el);

    startTimeRef.current = performance.now();

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const rawProgress = Math.min(elapsed / duration, 1);
      const progress = easeOutCubic(rawProgress);

      const currentStyles: Record<string, string> = {};
      for (const key of Object.keys(preset.from)) {
        const fromVal = parseFloat(preset.from[key].replace(/[^0-9.-]/g, '')) || 0;
        const toVal = parseFloat(preset.to[key].replace(/[^0-9.-]/g, '')) || 0;
        const unit = preset.from[key].replace(/[0-9.-]/g, '') || '';
        currentStyles[key] = `${fromVal + (toVal - fromVal) * progress}${unit}`;
      }

      applyStyles(el, currentStyles);

      if (rawProgress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        applyStyles(el, preset.to);
        setVisible(true);
        animFrameRef.current = null;
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);
  }, [duration, preset, applyStyles]);

  const handleExit = useCallback(() => {
    const el = containerRef.current;
    if (!el || exiting) return;

    setExiting(true);
    const exitDuration = 180;
    startTimeRef.current = performance.now();

    const animateExit = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const rawProgress = Math.min(elapsed / exitDuration, 1);
      const progress = easeInQuad(rawProgress);

      const currentStyles: Record<string, string> = {};
      for (const key of Object.keys(preset.to)) {
        const fromVal = parseFloat(preset.to[key].replace(/[^0-9.-]/g, '')) || 0;
        const toVal = parseFloat(preset.exitTo[key].replace(/[^0-9.-]/g, '')) || 0;
        const unit = preset.to[key].replace(/[0-9.-]/g, '') || '';
        currentStyles[key] = `${fromVal + (toVal - fromVal) * progress}${unit}`;
      }

      applyStyles(el, currentStyles);

      if (rawProgress < 1) {
        animFrameRef.current = requestAnimationFrame(animateExit);
      } else {
        animFrameRef.current = null;
      }
    };

    animFrameRef.current = requestAnimationFrame(animateExit);
  }, [exiting, preset, applyStyles]);

  useEffect(() => {
    const timer = setTimeout(runEnterAnimation, 20);
    return () => clearTimeout(timer);
  }, [runEnterAnimation]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__pageTransitionExit = handleExit;
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete window.__pageTransitionExit;
      }
    };
  }, [handleExit]);

  useEffect(() => {
    const el = containerRef.current;
    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (el) {
        globalEngine.removeFromGPULayer(el);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="page-transition-parallel"
      style={{
        contain: 'layout style paint',
        willChange: 'opacity, transform, filter',
        backfaceVisibility: 'hidden',
        ...(visible && !exiting ? {} : preset.from),
      }}
      role="region"
      aria-label="页面内容"
    >
      {children}
    </div>
  );
}

declare global {
  interface Window {
    __pageTransitionExit?: () => void;
  }
}
