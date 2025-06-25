import React, {
  useCallback,
  useEffect,
  useRef,
  useMemo,
  useState,
} from "react";
import { logger } from "../utils/logger";

// 타입 정의
interface PerformanceMetrics {
  renderTime: number;
  interactionTime: number;
  memoryUsage: number;
}

// 디바운스 훅
export const useDebounce = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  ) as T;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  });

  return debouncedCallback;
};

// 스로틀 훅
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastRun = useRef<number>(0);

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = now;
      }
    },
    [callback, delay]
  ) as T;

  return throttledCallback;
};

// 인터섹션 옵저버 훅 (레이지 로딩용)
export const useIntersectionObserver = (
  options: IntersectionObserverInit = {}
) => {
  const elementRef = useRef<Element | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const setElement = useCallback((element: Element | null) => {
    elementRef.current = element;
  }, []);

  const observe = useCallback(
    (callback: (isIntersecting: boolean) => void) => {
      if (!elementRef.current) return;

      observerRef.current = new IntersectionObserver(([entry]) => {
        callback(entry.isIntersecting);
      }, options);

      observerRef.current.observe(elementRef.current);

      return () => {
        if (observerRef.current) {
          observerRef.current.disconnect();
        }
      };
    },
    [options]
  );

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return { setElement, observe };
};

// 이미지 레이지 로딩 훅
export const useLazyImage = (src: string, placeholder?: string) => {
  const [imageSrc, setImageSrc] = useState(placeholder || "");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const { setElement, observe } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: "50px",
  });

  useEffect(() => {
    const unobserve = observe((isIntersecting) => {
      if (isIntersecting && !isLoaded && !isError) {
        const img = new Image();
        img.onload = () => {
          setImageSrc(src);
          setIsLoaded(true);
        };
        img.onerror = () => {
          setIsError(true);
          logger.error(`Failed to load image: ${src}`);
        };
        img.src = src;
      }
    });

    return unobserve;
  }, [src, isLoaded, isError, observe]);

  return { imageSrc, isLoaded, isError, setElement };
};

// 성능 메트릭 측정 훅
export const usePerformanceMetrics = () => {
  const startTimeRef = useRef<number>(0);
  const metricsRef = useRef<PerformanceMetrics>({
    renderTime: 0,
    interactionTime: 0,
    memoryUsage: 0,
  });

  const startMeasurement = useCallback((label: string) => {
    startTimeRef.current = performance.now();
    performance.mark(`${label}-start`);
  }, []);

  const endMeasurement = useCallback((label: string) => {
    const endTime = performance.now();
    const duration = endTime - startTimeRef.current;

    performance.mark(`${label}-end`);
    performance.measure(label, `${label}-start`, `${label}-end`);

    metricsRef.current.renderTime = duration;

    // 메모리 사용량 측정 (지원되는 브라우저에서만)
    if ("memory" in performance) {
      const memory = (performance as any).memory;
      metricsRef.current.memoryUsage = memory.usedJSHeapSize;
    }

    logger.info(`Performance metric - ${label}: ${duration.toFixed(2)}ms`);

    return duration;
  }, []);

  const getMetrics = useCallback(() => {
    return { ...metricsRef.current };
  }, []);

  return { startMeasurement, endMeasurement, getMetrics };
};

// 메모이제이션 헬퍼 훅
export const useDeepMemo = <T>(value: T, deps: React.DependencyList): T => {
  return useMemo(() => value, deps);
};

// 배치 업데이트 훅
export const useBatchedUpdates = () => {
  const batchRef = useRef<(() => void)[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const addToBatch = useCallback((update: () => void) => {
    batchRef.current.push(update);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      const updates = [...batchRef.current];
      batchRef.current = [];

      // React 18에서는 자동 배치가 되므로 그냥 실행
      updates.forEach((update) => update());
    }, 0);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { addToBatch };
};

export default {
  useDebounce,
  useThrottle,
  useIntersectionObserver,
  useLazyImage,
  usePerformanceMetrics,
  useDeepMemo,
  useBatchedUpdates,
};
