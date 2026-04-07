type FrameCallback = (timestamp: number, delta: number) => void;

interface AnimationTask {
  id: string;
  callback: FrameCallback;
  priority: PriorityLevel;
  enabled: boolean;
  createdAt: number;
}

const PriorityLevel = {
  CRITICAL: 0,
  HIGH: 1,
  NORMAL: 2,
  LOW: 3,
  IDLE: 4,
} as const;
type PriorityLevel = typeof PriorityLevel[keyof typeof PriorityLevel];

interface EngineConfig {
  targetFPS?: number;
  autoStart?: boolean;
  useWorker?: boolean;
  enableGPUAcceleration?: boolean;
}

interface PerformanceMetrics {
  currentFPS: number;
  avgFPS: number;
  frameTime: number;
  droppedFrames: number;
  totalFrames: number;
}

class ParallelRenderEngine {
  private rafId: number | null = null;
  private running = false;
  private tasks: Map<string, AnimationTask> = new Map();
  private lastTimestamp = 0;
  private frameInterval: number;
  private config: Required<EngineConfig>;
  private metrics: PerformanceMetrics = {
    currentFPS: 0,
    avgFPS: 0,
    frameTime: 0,
    droppedFrames: 0,
    totalFrames: 0,
  };
  private fpsHistory: number[] = [];
  private maxHistorySize = 60;
  private batchedUpdates: Set<() => void> = new Set();
  private layoutPending = false;
  private styleCache: Map<HTMLElement, CSSStyleDeclaration> = new Map();
  private gpuLayerElements: Set<HTMLElement> = new Set();

  constructor(config: EngineConfig = {}) {
    this.config = {
      targetFPS: config.targetFPS ?? 120,
      autoStart: config.autoStart ?? true,
      useWorker: config.useWorker ?? false,
      enableGPUAcceleration: config.enableGPUAcceleration ?? true,
    };
    this.frameInterval = 1000 / this.config.targetFPS;

    if (this.config.autoStart && typeof window !== 'undefined') {
      this.start();
    }
  }

  start(): void {
    if (this.running || typeof window === 'undefined') return;
    this.running = true;
    this.lastTimestamp = performance.now();
    this.rafId = requestAnimationFrame(this.tick.bind(this));
  }

  stop(): void {
    if (!this.running) return;
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  isRunning(): boolean {
    return this.running;
  }

  register(
    id: string,
    callback: FrameCallback,
    priority: PriorityLevel = PriorityLevel.NORMAL
  ): () => void {
    if (this.tasks.has(id)) {
      console.warn(`[ParallelRenderEngine] Task "${id}" already exists, replacing.`);
      this.unregister(id);
    }

    const task: AnimationTask = {
      id,
      callback,
      priority,
      enabled: true,
      createdAt: performance.now(),
    };

    this.tasks.set(id, task);

    return () => this.unregister(id);
  }

  unregister(id: string): void {
    this.tasks.delete(id);
  }

  setPriority(id: string, priority: PriorityLevel): void {
    const task = this.tasks.get(id);
    if (task) {
      task.priority = priority;
    }
  }

  setEnabled(id: string, enabled: boolean): void {
    const task = this.tasks.get(id);
    if (task) {
      task.enabled = enabled;
    }
  }

  scheduleBatchUpdate(updateFn: () => void): void {
    this.batchedUpdates.add(updateFn);
    if (!this.layoutPending) {
      this.layoutPending = true;
      queueMicrotask(() => this.flushBatchedUpdates());
    }
  }

  promoteToGPULayer(element: HTMLElement): void {
    if (this.config.enableGPUAcceleration && !this.gpuLayerElements.has(element)) {
      element.style.willChange = 'transform, opacity';
      element.style.transform = 'translateZ(0)';
      this.gpuLayerElements.add(element);
    }
  }

  removeFromGPULayer(element: HTMLElement): void {
    if (this.gpuLayerElements.has(element)) {
      element.style.willChange = 'auto';
      element.style.transform = '';
      this.gpuLayerElements.delete(element);
    }
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  getTaskCount(): number {
    return this.tasks.size;
  }

  getActiveTaskCount(): number {
    let count = 0;
    for (const task of this.tasks.values()) {
      if (task.enabled) count++;
    }
    return count;
  }

  private tick(timestamp: number): void {
    if (!this.running) return;

    const delta = timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;

    this.updateMetrics(timestamp, delta);

    if (delta >= this.frameInterval * 1.5) {
      this.metrics.droppedFrames++;
    }

    this.executeTasks(timestamp, delta);

    this.rafId = requestAnimationFrame(this.tick.bind(this));
  }

  private executeTasks(timestamp: number, delta: number): void {
    const sortedTasks = Array.from(this.tasks.values())
      .filter((t) => t.enabled)
      .sort((a, b) => a.priority - b.priority);

    for (const task of sortedTasks) {
      try {
        task.callback(timestamp, delta);
      } catch (err) {
        console.error(`[ParallelRenderEngine] Error in task "${task.id}":`, err);
      }
    }
  }

  private updateMetrics(_timestamp: number, delta: number): void {
    this.metrics.totalFrames++;
    this.metrics.frameTime = delta;

    const fps = delta > 0 ? 1000 / delta : 0;
    this.fpsHistory.push(fps);
    if (this.fpsHistory.length > this.maxHistorySize) {
      this.fpsHistory.shift();
    }

    this.metrics.currentFPS = fps;
    this.metrics.avgFPS =
      this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
  }

  private flushBatchedUpdates(): void {
    this.layoutPending = false;
    for (const update of this.batchedUpdates) {
      try {
        update();
      } catch (err) {
        console.error('[ParallelRenderEngine] Batch update error:', err);
      }
    }
    this.batchedUpdates.clear();
  }

  destroy(): void {
    this.stop();
    this.tasks.clear();
    this.batchedUpdates.clear();
    this.styleCache.clear();
    this.gpuLayerElements.clear();
    this.fpsHistory.length = 0;
  }
}

const globalEngine = new ParallelRenderEngine({
  targetFPS: 120,
  autoStart: true,
  enableGPUAcceleration: true,
});

export { ParallelRenderEngine, globalEngine, PriorityLevel };
export type { EngineConfig, FrameCallback, AnimationTask, PerformanceMetrics };
