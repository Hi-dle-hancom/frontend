import * as vscode from "vscode";
import { EnhancedErrorService, ErrorSeverity } from "./EnhancedErrorService";

export interface MemoryStats {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

export class MemoryManager {
  private static instance: MemoryManager;
  private errorService = EnhancedErrorService.getInstance();

  // 캐시 관리
  private caches = new Map<string, Map<string, CacheEntry<any>>>();
  private maxCacheSize = 100;
  private maxCacheAge = 30 * 60 * 1000; // 30분

  // 타이머 관리
  private timers = new Set<NodeJS.Timeout>();
  private intervals = new Set<NodeJS.Timeout>();

  // 이벤트 리스너 관리
  private eventListeners = new Map<string, vscode.Disposable[]>();

  // 웹뷰 패널 관리
  private webviewPanels = new Set<vscode.WebviewPanel>();

  // 메모리 모니터링
  private memoryCheckInterval: NodeJS.Timeout | null = null;
  private memoryThreshold = 100 * 1024 * 1024; // 100MB

  // 초기화 상태
  private initialized = false;

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  /**
   * 메모리 매니저 초기화
   */
  initialize(): void {
    this.startMemoryMonitoring();
    this.startCacheCleanup();
    // 초기화 완료
    this.initialized = true;
    // MemoryManager 초기화 완료
  }

  /**
   * 캐시 관리
   */
  setCache<T>(namespace: string, key: string, data: T): void {
    if (!this.caches.has(namespace)) {
      this.caches.set(namespace, new Map());
    }

    const cache = this.caches.get(namespace)!;

    // 캐시 크기 제한
    if (cache.size >= this.maxCacheSize) {
      this.evictOldestCache(cache);
    }

    cache.set(key, {
      data,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now(),
    });
  }

  getCache<T>(namespace: string, key: string): T | null {
    const cache = this.caches.get(namespace);
    if (!cache) {return null;}

    const entry = cache.get(key);
    if (!entry) {return null;}

    // 만료 확인
    if (Date.now() - entry.timestamp > this.maxCacheAge) {
      cache.delete(key);
      return null;
    }

    // 접근 통계 업데이트
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    return entry.data;
  }

  clearCache(namespace?: string): void {
    if (namespace) {
      this.caches.delete(namespace);
    } else {
      this.caches.clear();
    }
  }

  /**
   * 타이머 관리
   */
  setTimeout(callback: () => void, delay: number): NodeJS.Timeout {
    const timer = setTimeout(() => {
      try {
        callback();
      } catch (error) {
        this.errorService.logError(error as Error, ErrorSeverity.MEDIUM);
      } finally {
        this.timers.delete(timer);
      }
    }, delay);

    this.timers.add(timer);
    return timer;
  }

  setInterval(callback: () => void, interval: number): NodeJS.Timeout {
    const timer = setInterval(() => {
      try {
        callback();
      } catch (error) {
        this.errorService.logError(error as Error, ErrorSeverity.MEDIUM);
      }
    }, interval);

    this.intervals.add(timer);
    return timer;
  }

  clearTimeout(timer: NodeJS.Timeout): void {
    clearTimeout(timer);
    this.timers.delete(timer);
  }

  clearInterval(timer: NodeJS.Timeout): void {
    clearInterval(timer);
    this.intervals.delete(timer);
  }

  /**
   * 이벤트 리스너 관리
   */
  addEventListener(namespace: string, disposable: vscode.Disposable): void {
    if (!this.eventListeners.has(namespace)) {
      this.eventListeners.set(namespace, []);
    }

    this.eventListeners.get(namespace)!.push(disposable);
  }

  removeEventListeners(namespace: string): void {
    const listeners = this.eventListeners.get(namespace);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener.dispose();
        } catch (error) {
          this.errorService.logError(
            `이벤트 리스너 제거 실패: ${error}`,
            ErrorSeverity.LOW
          );
        }
      });
      this.eventListeners.delete(namespace);
    }
  }

  /**
   * 웹뷰 패널 관리
   */
  registerWebviewPanel(panel: vscode.WebviewPanel): void {
    this.webviewPanels.add(panel);

    // 패널이 닫힐 때 자동으로 제거
    panel.onDidDispose(() => {
      this.webviewPanels.delete(panel);
    });
  }

  closeAllWebviewPanels(): void {
    this.webviewPanels.forEach((panel) => {
      try {
        panel.dispose();
      } catch (error) {
        this.errorService.logError(
          `웹뷰 패널 닫기 실패: ${error}`,
          ErrorSeverity.LOW
        );
      }
    });
    this.webviewPanels.clear();
  }

  /**
   * 메모리 통계 조회
   */
  getMemoryStats(): MemoryStats {
    const memUsage = process.memoryUsage();
    return {
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      rss: memUsage.rss,
    };
  }

  /**
   * 메모리 사용량 포맷
   */
  formatMemorySize(bytes: number): string {
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${Math.round(size * 100) / 100} ${units[unitIndex]}`;
  }

  /**
   * 강제 가비지 컬렉션
   */
  forceGarbageCollection(): void {
    try {
      if (global.gc) {
        global.gc();
        console.log("🧹 가비지 컬렉션 실행됨");
      } else {
        console.warn(
          "⚠️ 가비지 컬렉션을 사용할 수 없습니다 (--expose-gc 플래그 필요)"
        );
      }
    } catch (error) {
      this.errorService.logError(
        `가비지 컬렉션 실패: ${error}`,
        ErrorSeverity.LOW
      );
    }
  }

  /**
   * 메모리 정리
   */
  cleanup(): void {
    // 모든 타이머 정리
    this.timers.forEach((timer) => clearTimeout(timer));
    this.intervals.forEach((timer) => clearInterval(timer));
    this.timers.clear();
    this.intervals.clear();

    // 모든 이벤트 리스너 정리
    this.eventListeners.forEach((listeners, namespace) => {
      this.removeEventListeners(namespace);
    });

    // 모든 웹뷰 패널 닫기
    this.closeAllWebviewPanels();

    // 캐시 정리
    this.clearCache();

    // 메모리 모니터링 정지
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
      this.memoryCheckInterval = null;
    }

    // 가비지 컬렉션 실행
    this.forceGarbageCollection();

    console.log("🧹 MemoryManager 정리 완료");
  }

  /**
   * 메모리 사용량 보고서 생성
   */
  generateMemoryReport(): string {
    const stats = this.getMemoryStats();
    const cacheStats = this.getCacheStats();

    return `
=== HAPA 메모리 사용량 보고서 ===
📊 메모리 통계:
- Heap 사용량: ${this.formatMemorySize(
      stats.heapUsed
    )} / ${this.formatMemorySize(stats.heapTotal)}
- 외부 메모리: ${this.formatMemorySize(stats.external)}
- RSS: ${this.formatMemorySize(stats.rss)}

🗂️ 캐시 통계:
- 네임스페이스 수: ${cacheStats.namespaceCount}
- 총 캐시 항목: ${cacheStats.totalEntries}
- 평균 항목 크기: ${this.formatMemorySize(cacheStats.averageSize)}

⏱️ 리소스 현황:
- 활성 타이머: ${this.timers.size}
- 활성 인터벌: ${this.intervals.size}
- 이벤트 리스너 그룹: ${this.eventListeners.size}
- 웹뷰 패널: ${this.webviewPanels.size}

⚠️ 메모리 상태: ${stats.heapUsed > this.memoryThreshold ? "높음" : "정상"}
    `;
  }

  private startMemoryMonitoring(): void {
    this.memoryCheckInterval = this.setInterval(() => {
      const stats = this.getMemoryStats();

      if (stats.heapUsed > this.memoryThreshold) {
        this.errorService.logError(
          `메모리 사용량이 높습니다: ${this.formatMemorySize(stats.heapUsed)}`,
          ErrorSeverity.MEDIUM,
          stats
        );

        // 자동 정리 시도
        this.cleanupUnusedResources();
      }
    }, 60000); // 1분마다 확인
  }

  private startCacheCleanup(): void {
    this.setInterval(() => {
      this.cleanupExpiredCache();
    }, 5 * 60 * 1000); // 5분마다 정리
  }

  private cleanupExpiredCache(): void {
    const now = Date.now();
    let cleanedCount = 0;

    this.caches.forEach((cache, namespace) => {
      const keysToDelete: string[] = [];

      cache.forEach((entry, key) => {
        if (now - entry.timestamp > this.maxCacheAge) {
          keysToDelete.push(key);
        }
      });

      keysToDelete.forEach((key) => {
        cache.delete(key);
        cleanedCount++;
      });

      // 빈 네임스페이스 제거
      if (cache.size === 0) {
        this.caches.delete(namespace);
      }
    });

    if (cleanedCount > 0) {
      console.log(`🧹 만료된 캐시 ${cleanedCount}개 정리됨`);
    }
  }

  private evictOldestCache(cache: Map<string, CacheEntry<any>>): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    cache.forEach((entry, key) => {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    });

    if (oldestKey) {
      cache.delete(oldestKey);
    }
  }

  private cleanupUnusedResources(): void {
    // 오래된 캐시 정리
    this.cleanupExpiredCache();

    // 사용하지 않는 웹뷰 패널 찾기 및 정리
    this.webviewPanels.forEach((panel) => {
      if (panel.visible === false) {
        try {
          panel.dispose();
        } catch (error) {
          // 이미 닫힌 패널은 무시
        }
      }
    });

    // 가비지 컬렉션 실행
    this.forceGarbageCollection();
  }

  private getCacheStats(): {
    namespaceCount: number;
    totalEntries: number;
    averageSize: number;
  } {
    let totalEntries = 0;
    let totalSize = 0;

    this.caches.forEach((cache) => {
      totalEntries += cache.size;
      cache.forEach((entry) => {
        try {
          totalSize += JSON.stringify(entry.data).length;
        } catch {
          totalSize += 100; // 추정 크기
        }
      });
    });

    return {
      namespaceCount: this.caches.size,
      totalEntries,
      averageSize: totalEntries > 0 ? totalSize / totalEntries : 0,
    };
  }
}
