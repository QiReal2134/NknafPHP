import { globalEngine, PriorityLevel } from './ParallelRenderEngine';

interface AnimationConfig {
  duration: number;
  delay?: number;
  easing?: (t: number) => number;
  onStart?: () => void;
  onComplete?: () => void;
  onUpdate?: (progress: number) => void;
}

interface ScheduledAnimation {
  id: string;
  element: HTMLElement;
  config: AnimationConfig;
  startTime: number;
  pausedAt?: number;
  pausedProgress?: number;
  state: 'running' | 'paused' | 'completed' | 'cancelled';
  currentProgress: number;
  priority: PriorityLevel;
}

type EasingFunction = (t: number) => number;

const Easing: Record<string, EasingFunction> = {
  linear: (t) => t,
  easeInQuad: (t) => t * t,
  easeOutQuad: (t) => t * (2 - t),
  easeInOutQuad: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  easeInCubic: (t) => t * t * t,
  easeOutCubic: (t) => --t * t * t + 1,
  easeInOutCubic: (t) =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  easeOutExpo: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  easeInOutExpo: (t) => {
    if (t === 0 || t === 1) return t;
    return t < 0.5
      ? Math.pow(2, 20 * t - 10) / 2
      : (2 - Math.pow(2, -20 * t + 10)) / 2;
  },
  easeOutBack: (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  easeOutElastic: (t) => {
    if (t === 0 || t === 1) return t;
    const c4 = (2 * Math.PI) / 3;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
  spring: (t) => {
    return 1 -
      Math.cos((t * 4.5 * Math.PI) * (1 - t)) *
      Math.exp(-t * 5);
  },
};

class AnimationScheduler {
  private animations: Map<string, ScheduledAnimation> = new Map();
  private taskId: string | null = null;
  private reducedMotion = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.reducedMotion = mediaQuery.matches;
      mediaQuery.addEventListener('change', (e) => {
        this.reducedMotion = e.matches;
      });

      this.taskId = `scheduler_${Date.now()}`;
      globalEngine.register(this.taskId, this.onFrame.bind(this), PriorityLevel.CRITICAL);
    }
  }

  create(
    element: HTMLElement,
    _properties: Record<string, string>,
    config: AnimationConfig & { id?: string; priority?: PriorityLevel }
  ): string {
    const id = config.id || `anim_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const easing = typeof config.easing === 'function'
      ? config.easing
      : Easing.linear;

    if (true) {
      globalEngine.promoteToGPULayer(element);
    }

    const anim: ScheduledAnimation = {
      id,
      element,
      config: { ...config, easing },
      startTime: performance.now() + (config.delay || 0),
      state: 'running',
      currentProgress: 0,
      priority: config.priority ?? PriorityLevel.HIGH,
    };

    this.animations.set(id, anim);

    if (config.onStart) {
      config.onStart();
    }

    return id;
  }

  createParallel(
    elements: HTMLElement[],
    propertyGetter: (el: HTMLElement, index: number) => Record<string, string>,
    config: AnimationConfig & { staggerDelay?: number; priority?: PriorityLevel }
  ): string[] {
    const ids: string[] = [];
    const stagger = config.staggerDelay || 0;

    elements.forEach((element, index) => {
      const props = propertyGetter(element, index);
      const delayedConfig = {
        ...config,
        delay: (config.delay || 0) + stagger * index,
      };
      ids.push(this.create(element, props, delayedConfig));
    });

    return ids;
  }

  pause(id: string): void {
    const anim = this.animations.get(id);
    if (anim && anim.state === 'running') {
      anim.pausedAt = performance.now();
      anim.state = 'paused';
    }
  }

  resume(id: string): void {
    const anim = this.animations.get(id);
    if (anim && anim.state === 'paused') {
      const pauseDuration = performance.now() - (anim.pausedAt || 0);
      anim.startTime += pauseDuration;
      anim.state = 'running';
      anim.pausedAt = undefined;
    }
  }

  cancel(id: string): void {
    const anim = this.animations.get(id);
    if (anim) {
      anim.state = 'cancelled';
      globalEngine.removeFromGPULayer(anim.element);
      this.animations.delete(id);
    }
  }

  cancelAll(): void {
    for (const [id] of this.animations) {
      this.cancel(id);
    }
  }

  getState(id: string): ScheduledAnimation['state'] | undefined {
    return this.animations.get(id)?.state;
  }

  getProgress(id: string): number {
    return this.animations.get(id)?.currentProgress ?? 0;
  }

  getActiveCount(): number {
    let count = 0;
    for (const anim of this.animations.values()) {
      if (anim.state === 'running') count++;
    }
    return count;
  }

  setEasing(name: string, fn: EasingFunction): void {
    Easing[name] = fn;
  }

  getEasing(name: string): EasingFunction | undefined {
    return Easing[name];
  }

  private onFrame(_timestamp: number): void {
    const now = performance.now();

    for (const [id, anim] of this.animations) {
      if (anim.state !== 'running') continue;

      const elapsed = now - anim.startTime;
      let rawProgress = Math.min(elapsed / anim.config.duration, 1);

      if (this.reducedMotion) {
        rawProgress = 1;
      }

      const easedProgress = (anim.config.easing || Easing.linear)(rawProgress);
      anim.currentProgress = easedProgress;

      if (anim.config.onUpdate) {
        anim.config.onUpdate(easedProgress);
      }

      if (rawProgress >= 1) {
        anim.state = 'completed';
        anim.currentProgress = 1;

        if (anim.config.onComplete) {
          anim.config.onComplete();
        }

        globalEngine.removeFromGPULayer(anim.element);
        this.animations.delete(id);
      }
    }
  }

  destroy(): void {
    if (this.taskId) {
      globalEngine.unregister(this.taskId);
    }
    this.cancelAll();
  }
}

const scheduler = new AnimationScheduler();

export { AnimationScheduler, scheduler, Easing, PriorityLevel };
export type { AnimationConfig, ScheduledAnimation, EasingFunction };
