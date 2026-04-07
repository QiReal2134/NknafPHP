import { useRef, useEffect, useCallback, useState } from 'react';
import { globalEngine, PriorityLevel } from '../engines/ParallelRenderEngine';
import { scheduler, Easing, type EasingFunction } from '../engines/AnimationScheduler';

interface UseParallelAnimationOptions {
  duration?: number;
  delay?: number;
  easing?: string | EasingFunction;
  priority?: PriorityLevel;
  autoStart?: boolean;
  loop?: boolean;
}

interface UseParallelAnimationReturn {
  ref: React.RefCallback<HTMLElement>;
  progress: number;
  isPlaying: boolean;
  play: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  seek: (progress: number) => void;
  animationId: string | null;
}

function useParallelAnimation(
  properties: Record<string, (progress: number) => string>,
  options: UseParallelAnimationOptions = {}
): UseParallelAnimationReturn {
  const {
    duration = 500,
    delay = 0,
    easing = 'easeOutCubic',
    priority = PriorityLevel.HIGH,
    autoStart = true,
    loop = false,
  } = options;

  const elementRef = useRef<HTMLElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const animIdRef = useRef<string | null>(null);

  const resolveEasing = (e: string | EasingFunction): EasingFunction => {
    if (typeof e === 'function') return e;
    return (Easing as Record<string, EasingFunction>)[e] || Easing.easeOutCubic;
  };

  const applyProperties = useCallback((el: HTMLElement, prog: number) => {
    for (const [prop, getter] of Object.entries(properties)) {
      try {
        el.style.setProperty(prop, getter(prog));
      } catch (err) {
        console.warn(`[useParallelAnimation] Failed to set property "${prop}":`, err);
      }
    }
  }, [properties]);

  const startAnimation = useCallback(() => {
    const el = elementRef.current;
    if (!el) return;

    if (animIdRef.current) {
      scheduler.cancel(animIdRef.current);
    }

    const id = scheduler.create(el, {}, {
      duration,
      delay,
      easing: resolveEasing(easing),
      priority,
      onUpdate: (prog) => {
        setProgress(prog);
        applyProperties(el, prog);
      },
      onComplete: () => {
        setIsPlaying(false);
        if (loop) {
          setTimeout(() => startAnimation(), 0);
        }
      },
    });

    animIdRef.current = id;
    setIsPlaying(true);
  }, [duration, delay, easing, priority, loop, properties, applyProperties, resolveEasing]);

  const play = useCallback(() => {
    if (animIdRef.current) {
      scheduler.resume(animIdRef.current);
      setIsPlaying(true);
    } else {
      startAnimation();
    }
  }, [startAnimation]);

  const pause = useCallback(() => {
    if (animIdRef.current) {
      scheduler.pause(animIdRef.current);
      setIsPlaying(false);
    }
  }, []);

  const resume = useCallback(() => {
    play();
  }, [play]);

  const reset = useCallback(() => {
    if (animIdRef.current) {
      scheduler.cancel(animIdRef.current);
      animIdRef.current = null;
    }
    setProgress(0);
    setIsPlaying(false);
    const el = elementRef.current;
    if (el) {
      applyProperties(el, 0);
    }
  }, [applyProperties]);

  const seek = useCallback((prog: number) => {
    const clampedProg = Math.max(0, Math.min(1, prog));
    setProgress(clampedProg);
    const el = elementRef.current;
    if (el) {
      applyProperties(el, clampedProg);
    }
  }, [applyProperties]);

  useEffect(() => {
    return () => {
      if (animIdRef.current) {
        scheduler.cancel(animIdRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (autoStart && elementRef.current && !animIdRef.current) {
      startAnimation();
    }
  }, [autoStart, startAnimation]);

  const setRef: React.RefCallback<HTMLElement> = useCallback((node) => {
    elementRef.current = node;
    if (node) {
      globalEngine.promoteToGPULayer(node);
    }
  }, []);

  return {
    ref: setRef,
    progress,
    isPlaying,
    play,
    pause,
    resume,
    reset,
    seek,
    animationId: animIdRef.current,
  };
}

interface UseStaggerChildrenOptions {
  staggerDelay?: number;
  duration?: number;
  easing?: string | EasingFunction;
  threshold?: number;
  triggerOnce?: boolean;
}

function useStaggerChildren(options: UseStaggerChildrenOptions = {}): {
  containerRef: React.RefCallback<HTMLElement>;
  isVisible: boolean;
} {
  const {
    staggerDelay = 80,
    duration = 500,
    easing = 'easeOutCubic',
    threshold = 0.1,
    triggerOnce = true,
  } = options;

  const containerRef = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const hasTriggered = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            hasTriggered.current = true;
            observer.disconnect();
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold }
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, [threshold, triggerOnce]);

  useEffect(() => {
    if (!isVisible || !containerRef.current) return;

    const children = Array.from(containerRef.current.children) as HTMLElement[];
    children.forEach((child, index) => {
      child.style.opacity = '0';
      child.style.transform = 'translateY(20px)';
      child.style.willChange = 'opacity, transform';

      setTimeout(() => {
        const easingFn = typeof easing === 'string' ? (Easing as any)[easing] : easing;
        const easedProgressFn = easingFn || ((t: number) => 1 - Math.pow(1 - t, 3));
        let startTime: number | null = null;

        function animate(timestamp: number) {
          if (!startTime) startTime = timestamp;
          const elapsed = timestamp - startTime;
          const rawProgress = Math.min(elapsed / duration, 1);
          const prog = easedProgressFn(rawProgress);

          child.style.opacity = String(prog);
          child.style.transform = `translateY(${20 * (1 - prog)}px)`;

          if (rawProgress < 1) {
            requestAnimationFrame(animate);
          } else {
            child.style.willChange = 'auto';
          }
        }

        requestAnimationFrame(animate);
      }, staggerDelay * index);
    });
  }, [isVisible, staggerDelay, duration, easing]);

  const setContainerRef: React.RefCallback<HTMLElement> = useCallback((node) => {
    containerRef.current = node;
    if (node) {
      globalEngine.promoteToGPULayer(node);
    }
  }, []);

  return { containerRef: setContainerRef, isVisible };
}

export { useParallelAnimation, useStaggerChildren };
export type { UseParallelAnimationOptions, UseParallelAnimationReturn, UseStaggerChildrenOptions };
