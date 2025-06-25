/**
 * HAPA Landing Page - 핵심 유틸리티 함수
 * @fileoverview 실제로 사용되는 핵심 유틸리티 함수들만 포함
 */

// ============================================================================
// TYPE UTILITIES
// ============================================================================

/**
 * Omit 타입 (TypeScript 내장 타입과 호환)
 */
export type OmitType<T, K extends keyof T> = Omit<T, K>;

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * 이메일 형식 검증
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * URL 형식 검증
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// ASYNC UTILITIES
// ============================================================================

/**
 * 재시도 가능한 함수 실행
 */
export async function retry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return retry(fn, retries - 1, delayMs);
    }
    throw error;
  }
}

/**
 * 지연 실행
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// STORAGE UTILITIES
// ============================================================================

/**
 * 로컬 스토리지 안전 접근
 */
export const storage = {
  get<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  set(key: string, value: any): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },

  remove(key: string): boolean {
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },

  clear(): boolean {
    try {
      localStorage.clear();
      return true;
    } catch {
      return false;
    }
  },
};

// ============================================================================
// ARRAY UTILITIES (실제 사용되는 것들만)
// ============================================================================

/**
 * 배열에서 중복 제거
 */
export function unique<T>(array: T[]): T[] {
  return Array.from(new Set(array));
}

// ============================================================================
// RANDOM UTILITIES (실제 사용되는 것들만)
// ============================================================================

/**
 * 랜덤 ID 생성
 */
export function generateId(length = 8): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
