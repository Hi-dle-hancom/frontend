import * as vscode from "vscode";
import { EnhancedErrorService, ErrorSeverity } from "./EnhancedErrorService";
import { MemoryManager } from "./MemoryManager";

export interface PerformanceMetrics {
  functionName: string;
  executionTime: number;
  memoryUsage: number;
  callCount: number;
  lastCalled: Date;
}

export interface DebouncedFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void;
  cancel(): void;
  flush(): void;
  pending(): boolean;
}

export interface ThrottledFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void;
  cancel(): void;
  flush(): void;
}

export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private errorService = EnhancedErrorService.getInstance();
  private memoryManager = MemoryManager.getInstance();

  // 성능 메트릭 저장
  private performanceMetrics = new Map<string, PerformanceMetrics>();
  private maxMetricsSize = 1000;

  // 디바운스/스로틀 함수들 관리
  private activeDebouncers = new Map<string, NodeJS.Timeout>();
  private activeThrottlers = new Map<
    string,
    { lastCall: number; timer?: NodeJS.Timeout }
  >();

  // DOM 업데이트 큐
  private domUpdateQueue: Array<() => void> = [];
  private domUpdateScheduled = false;

  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  /**
   * 고급 디바운싱 - 선행/후행 엣지 지원
   */
  debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number,
    options: {
      leading?: boolean;
      trailing?: boolean;
      maxWait?: number;
      key?: string;
    } = {}
  ): DebouncedFunction<T> {
    const {
      leading = false,
      trailing = true,
      maxWait,
      key = func.name || "anonymous",
    } = options;

    let timeoutId: NodeJS.Timeout | null = null;
    let maxTimeoutId: NodeJS.Timeout | null = null;
    let lastCallTime = 0;
    let lastInvokeTime = 0;
    let lastArgs: Parameters<T>;
    let result: ReturnType<T>;

    const invokeFunc = (time: number) => {
      const args = lastArgs;
      lastInvokeTime = time;

      try {
        result = func.apply(this, args);
        this.recordPerformanceMetric(key, () => result);
        return result;
      } catch (error) {
        this.errorService.logError(error as Error, ErrorSeverity.MEDIUM, {
          function: key,
          args,
        });
        throw error;
      }
    };

    const leadingEdge = (time: number) => {
      lastInvokeTime = time;
      timeoutId = this.memoryManager.setTimeout(timerExpired, delay);
      return leading ? invokeFunc(time) : result;
    };

    const remainingWait = (time: number) => {
      const timeSinceLastCall = time - lastCallTime;
      const timeSinceLastInvoke = time - lastInvokeTime;
      const timeWaiting = delay - timeSinceLastCall;

      return maxWait !== undefined
        ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
        : timeWaiting;
    };

    const shouldInvoke = (time: number) => {
      const timeSinceLastCall = time - lastCallTime;
      const timeSinceLastInvoke = time - lastInvokeTime;

      return (
        lastCallTime === 0 ||
        timeSinceLastCall >= delay ||
        timeSinceLastCall < 0 ||
        (maxWait !== undefined && timeSinceLastInvoke >= maxWait)
      );
    };

    const timerExpired = () => {
      const time = Date.now();
      if (shouldInvoke(time)) {
        return trailingEdge(time);
      }
      timeoutId = this.memoryManager.setTimeout(
        timerExpired,
        remainingWait(time)
      );
    };

    const trailingEdge = (time: number) => {
      timeoutId = null;

      if (trailing && lastArgs) {
        return invokeFunc(time);
      }
      lastArgs = undefined as any;
      return result;
    };

    const cancel = () => {
      if (timeoutId !== null) {
        this.memoryManager.clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (maxTimeoutId !== null) {
        this.memoryManager.clearTimeout(maxTimeoutId);
        maxTimeoutId = null;
      }
      lastInvokeTime = 0;
      lastCallTime = 0;
      lastArgs = undefined as any;
    };

    const flush = () => {
      return timeoutId === null ? result : trailingEdge(Date.now());
    };

    const pending = () => {
      return timeoutId !== null;
    };

    const debounced = function (this: any, ...args: Parameters<T>) {
      const time = Date.now();
      const isInvoking = shouldInvoke(time);

      lastArgs = args;
      lastCallTime = time;

      if (isInvoking) {
        if (timeoutId === null) {
          return leadingEdge(lastCallTime);
        }
        if (maxWait !== undefined) {
          timeoutId = this.memoryManager.setTimeout(timerExpired, delay);
          return invokeFunc(lastCallTime);
        }
      }
      if (timeoutId === null) {
        timeoutId = this.memoryManager.setTimeout(timerExpired, delay);
      }
      return result;
    };

    // 메서드 바인딩
    (debounced as any).cancel = cancel;
    (debounced as any).flush = flush;
    (debounced as any).pending = pending;

    // 활성 디바운서 추가
    this.activeDebouncers.set(key, timeoutId as any);

    return debounced as unknown as DebouncedFunction<T>;
  }

  /**
   * 고급 스로틀링 - 선행/후행 엣지 지원
   */
  throttle<T extends (...args: any[]) => any>(
    func: T,
    wait: number,
    options: {
      leading?: boolean;
      trailing?: boolean;
      key?: string;
    } = {}
  ): ThrottledFunction<T> {
    const {
      leading = true,
      trailing = true,
      key = func.name || "anonymous",
    } = options;

    return this.debounce(func, wait, {
      leading,
      trailing,
      maxWait: wait,
      key,
    }) as ThrottledFunction<T>;
  }

  /**
   * 배치 DOM 업데이트 최적화
   */
  batchDOMUpdate(updateFunction: () => void): void {
    this.domUpdateQueue.push(updateFunction);

    if (!this.domUpdateScheduled) {
      this.domUpdateScheduled = true;

      // requestAnimationFrame 대신 setTimeout 사용 (Node.js 환경)
      this.memoryManager.setTimeout(() => {
        this.flushDOMUpdates();
      }, 0);
    }
  }

  /**
   * DOM 업데이트 큐 실행
   */
  private flushDOMUpdates(): void {
    const startTime = Date.now();

    try {
      while (this.domUpdateQueue.length > 0) {
        const updateFn = this.domUpdateQueue.shift();
        if (updateFn) {
          updateFn();
        }
      }
    } catch (error) {
      this.errorService.logError(error as Error, ErrorSeverity.MEDIUM, {
        queueLength: this.domUpdateQueue.length,
      });
    } finally {
      this.domUpdateScheduled = false;

      const executionTime = Date.now() - startTime;
      this.recordPerformanceMetric("domBatchUpdate", () => executionTime);
    }
  }

  /**
   * 성능 메트릭 기록
   */
  recordPerformanceMetric<T>(
    functionName: string,
    func: () => T,
    context?: any
  ): T {
    const startTime = Date.now();
    const startMemory = process.memoryUsage().heapUsed;

    try {
      const result = func();

      const executionTime = Date.now() - startTime;
      const memoryUsage = process.memoryUsage().heapUsed - startMemory;

      this.updateMetrics(functionName, executionTime, memoryUsage);

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.updateMetrics(functionName, executionTime, 0);

      this.errorService.logError(error as Error, ErrorSeverity.HIGH, {
        function: functionName,
        context,
        executionTime,
      });

      throw error;
    }
  }

  /**
   * 비동기 성능 메트릭 기록
   */
  async recordAsyncPerformanceMetric<T>(
    functionName: string,
    func: () => Promise<T>,
    context?: any
  ): Promise<T> {
    const startTime = Date.now();
    const startMemory = process.memoryUsage().heapUsed;

    try {
      const result = await func();

      const executionTime = Date.now() - startTime;
      const memoryUsage = process.memoryUsage().heapUsed - startMemory;

      this.updateMetrics(functionName, executionTime, memoryUsage);

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.updateMetrics(functionName, executionTime, 0);

      this.errorService.logError(error as Error, ErrorSeverity.HIGH, {
        function: functionName,
        context,
        executionTime,
      });

      throw error;
    }
  }

  /**
   * 메트릭 업데이트
   */
  private updateMetrics(
    functionName: string,
    executionTime: number,
    memoryUsage: number
  ): void {
    const existing = this.performanceMetrics.get(functionName);

    if (existing) {
      existing.executionTime = (existing.executionTime + executionTime) / 2; // 평균
      existing.memoryUsage = (existing.memoryUsage + memoryUsage) / 2; // 평균
      existing.callCount++;
      existing.lastCalled = new Date();
    } else {
      this.performanceMetrics.set(functionName, {
        functionName,
        executionTime,
        memoryUsage,
        callCount: 1,
        lastCalled: new Date(),
      });
    }

    // 메트릭 크기 제한
    if (this.performanceMetrics.size > this.maxMetricsSize) {
      const oldestKey = Array.from(this.performanceMetrics.keys())[0];
      this.performanceMetrics.delete(oldestKey);
    }
  }

  /**
   * 성능 병목 지점 분석
   */
  analyzeBottlenecks(): {
    slowFunctions: PerformanceMetrics[];
    memoryHeavyFunctions: PerformanceMetrics[];
    frequentlyCalledFunctions: PerformanceMetrics[];
  } {
    const metrics = Array.from(this.performanceMetrics.values());

    return {
      slowFunctions: metrics
        .filter((m) => m.executionTime > 100) // 100ms 이상
        .sort((a, b) => b.executionTime - a.executionTime)
        .slice(0, 10),

      memoryHeavyFunctions: metrics
        .filter((m) => m.memoryUsage > 1024 * 1024) // 1MB 이상
        .sort((a, b) => b.memoryUsage - a.memoryUsage)
        .slice(0, 10),

      frequentlyCalledFunctions: metrics
        .filter((m) => m.callCount > 100)
        .sort((a, b) => b.callCount - a.callCount)
        .slice(0, 10),
    };
  }

  /**
   * 성능 보고서 생성
   */
  generatePerformanceReport(): string {
    const bottlenecks = this.analyzeBottlenecks();
    const totalMetrics = this.performanceMetrics.size;

    let report = `
=== HAPA 성능 분석 보고서 ===
📊 전체 함수 수: ${totalMetrics}

🐌 느린 함수들 (Top 10):
${bottlenecks.slowFunctions
  .map(
    (m, i) =>
      `${i + 1}. ${m.functionName}: ${m.executionTime.toFixed(2)}ms (호출: ${
        m.callCount
      }회)`
  )
  .join("\n")}

🧠 메모리 사용량이 많은 함수들 (Top 10):
${bottlenecks.memoryHeavyFunctions
  .map(
    (m, i) =>
      `${i + 1}. ${m.functionName}: ${(m.memoryUsage / 1024 / 1024).toFixed(
        2
      )}MB (호출: ${m.callCount}회)`
  )
  .join("\n")}

🔄 자주 호출되는 함수들 (Top 10):
${bottlenecks.frequentlyCalledFunctions
  .map(
    (m, i) =>
      `${i + 1}. ${m.functionName}: ${
        m.callCount
      }회 (평균: ${m.executionTime.toFixed(2)}ms)`
  )
  .join("\n")}

💡 최적화 권장사항:
`;

    // 자동 최적화 권장사항
    if (bottlenecks.slowFunctions.length > 0) {
      report += `- 느린 함수들을 비동기 처리나 워커 스레드로 이동 고려\n`;
    }
    if (bottlenecks.memoryHeavyFunctions.length > 0) {
      report += `- 메모리 사용량이 많은 함수들의 캐싱 전략 검토\n`;
    }
    if (bottlenecks.frequentlyCalledFunctions.length > 0) {
      report += `- 자주 호출되는 함수들의 디바운싱/스로틀링 적용 고려\n`;
    }

    return report;
  }

  /**
   * 성능 메트릭 조회
   */
  getPerformanceMetrics(): Map<string, PerformanceMetrics> {
    return new Map(this.performanceMetrics);
  }

  /**
   * 특정 함수의 성능 메트릭 조회
   */
  getFunctionMetrics(functionName: string): PerformanceMetrics | undefined {
    return this.performanceMetrics.get(functionName);
  }

  /**
   * 성능 메트릭 초기화
   */
  clearMetrics(): void {
    this.performanceMetrics.clear();
  }

  /**
   * 모든 활성 디바운서/스로틀러 정리
   */
  cleanup(): void {
    // 활성 디바운서 정리
    this.activeDebouncers.forEach((timeoutId, key) => {
      if (timeoutId) {
        this.memoryManager.clearTimeout(timeoutId);
      }
    });
    this.activeDebouncers.clear();

    // 활성 스로틀러 정리
    this.activeThrottlers.forEach((throttler, key) => {
      if (throttler.timer) {
        this.memoryManager.clearTimeout(throttler.timer);
      }
    });
    this.activeThrottlers.clear();

    // DOM 업데이트 큐 정리
    this.domUpdateQueue = [];
    this.domUpdateScheduled = false;

    // 메트릭 정리
    this.clearMetrics();
  }
}
