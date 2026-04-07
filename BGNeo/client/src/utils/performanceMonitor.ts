/**
 * 性能监控工具
 * 收集和报告核心 web 性能指标
 */

// 性能指标类型
export interface PerformanceMetrics {
  fcp: number; // 首次内容绘制
  lcp: number; // 最大内容绘制
  ttfb: number; // 首字节时间
}

// 性能指标收集器
class PerformanceMonitor {
  private metrics: Partial<PerformanceMetrics> = {};
  private isInitialized = false;

  /**
   * 初始化性能监控
   */
  initialize(): void {
    if (this.isInitialized) return;

    // 使用 Performance API 收集基本指标
    if ('performance' in window) {
      // 监听页面加载完成
      window.addEventListener('load', () => {
        this.collectMetrics();
      });
    }

    this.isInitialized = true;
    console.log('性能监控已初始化');
  }

  /**
   * 收集性能指标
   */
  private collectMetrics(): void {
    if (!('performance' in window)) return;

    try {
      const entries = performance.getEntriesByType('navigation');
      if (entries.length > 0) {
        const navEntry = entries[0] as PerformanceNavigationTiming;
        
        // 计算 TTFB
        const ttfb = navEntry.responseStart - navEntry.requestStart;
        this.metrics.ttfb = ttfb;
        this.reportMetric('TTFB', ttfb);
      }

      // 监听 FCP
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              const fcp = entry.startTime;
              this.metrics.fcp = fcp;
              this.reportMetric('FCP', fcp);
            }
            if (entry.name === 'largest-contentful-paint') {
              const lcp = entry.startTime;
              this.metrics.lcp = lcp;
              this.reportMetric('LCP', lcp);
            }
          }
        });

        observer.observe({ type: 'paint', buffered: true });
      }
    } catch (error) {
      console.warn('收集性能指标失败:', error);
    }
  }

  /**
   * 报告性能指标
   * @param name 指标名称
   * @param value 指标值
   */
  private reportMetric(name: string, value: number): void {
    // 在开发环境下打印到控制台
    if (import.meta.env.DEV) {
      console.log(`[Performance] ${name}: ${value.toFixed(2)}ms`);
    }

    // 生产环境下可以发送到 analytics 服务
    // if (import.meta.env.PROD) {
    //   sendToAnalytics(name, value);
    // }
  }

  /**
   * 获取当前收集的性能指标
   */
  getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  /**
   * 重置性能指标
   */
  reset(): void {
    this.metrics = {};
  }
}

// 导出单例实例
export const performanceMonitor = new PerformanceMonitor();

export default performanceMonitor;