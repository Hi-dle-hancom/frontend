import { renderHook, act } from "@testing-library/react";
import { useAppStore } from "../../store/AppStore";

// 로컬 스토리지 모킹
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
});

// 초기 상태를 완전히 리셋하는 헬퍼 함수
const resetStore = () => {
  const { result } = renderHook(() => useAppStore());
  act(() => {
    // 모든 상태를 초기값으로 리셋
    result.current.reset();
  });
  return result;
};

describe("AppStore", () => {
  beforeEach(() => {
    // 각 테스트 전에 스토어 완전 리셋
    resetStore();
    // localStorage 클리어
    localStorage.clear();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test("should have correct initial state", () => {
    const { result } = renderHook(() => useAppStore());

    expect(result.current.user).toBeNull();
    expect(result.current.theme).toBe("auto");
    expect(result.current.sidebarOpen).toBe(false);
    expect(result.current.errors).toHaveLength(0);
    expect(result.current.api.isConnected).toBe(false);
  });

  test("should update user state", () => {
    const { result } = renderHook(() => useAppStore());

    const testUser = {
      id: "test-user-1",
      name: "Test User",
      email: "test@example.com",
      preferences: {
        theme: "dark" as const,
        language: "ko" as const,
        notifications: false,
        autoSave: true,
      },
    };

    act(() => {
      result.current.setUser(testUser);
    });

    expect(result.current.user).toEqual(testUser);
  });

  test("should handle user authentication", () => {
    const { result } = renderHook(() => useAppStore());

    expect(result.current.isAuthenticated).toBe(false);

    const testUser = {
      id: "auth-user",
      name: "Auth User",
      email: "auth@example.com",
      preferences: {
        theme: "light" as const,
        language: "en" as const,
        notifications: true,
        autoSave: false,
      },
    };

    act(() => {
      result.current.setUser(testUser);
      result.current.setAuthenticated(true);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(testUser);

    act(() => {
      result.current.setAuthenticated(false);
      result.current.setUser(null);
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  test("should toggle theme", () => {
    const { result } = renderHook(() => useAppStore());

    expect(result.current.theme).toBe("auto");

    act(() => {
      result.current.setTheme("dark");
    });

    expect(result.current.theme).toBe("dark");

    act(() => {
      result.current.setTheme("light");
    });

    expect(result.current.theme).toBe("light");
  });

  test("should toggle sidebar", () => {
    const { result } = renderHook(() => useAppStore());

    expect(result.current.sidebarOpen).toBe(false);

    act(() => {
      result.current.setSidebarOpen(true);
    });

    expect(result.current.sidebarOpen).toBe(true);

    act(() => {
      result.current.setSidebarOpen(false);
    });

    expect(result.current.sidebarOpen).toBe(false);
  });

  test("should manage errors", () => {
    const { result } = renderHook(() => useAppStore());

    act(() => {
      result.current.addError("Test error 1", "error");
    });

    expect(result.current.errors).toHaveLength(1);
    expect(result.current.errors[0].message).toBe("Test error 1");
    expect(result.current.errors[0].type).toBe("error");

    act(() => {
      result.current.addError("Test warning", "warning");
    });

    expect(result.current.errors).toHaveLength(2);

    const errorId = result.current.errors[0].id;
    act(() => {
      result.current.removeError(errorId);
    });

    expect(result.current.errors).toHaveLength(1);
    expect(result.current.errors[0].message).toBe("Test warning");

    act(() => {
      result.current.clearErrors();
    });

    expect(result.current.errors).toHaveLength(0);
  });

  test("should auto-remove errors after timeout", async () => {
    const { result } = renderHook(() => useAppStore());

    act(() => {
      result.current.addError("Auto remove test", "info");
    });

    expect(result.current.errors).toHaveLength(1);

    // 3초 후에 자동 제거되는지 테스트 (info 타입은 3초)
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(result.current.errors).toHaveLength(0);
  });

  test("should update API connection status", () => {
    const { result } = renderHook(() => useAppStore());

    expect(result.current.api.isConnected).toBe(false);

    act(() => {
      result.current.setApiConnected(true);
    });

    expect(result.current.api.isConnected).toBe(true);

    act(() => {
      result.current.setApiConnected(false);
    });

    expect(result.current.api.isConnected).toBe(false);
  });

  test("should update API ping with current timestamp", () => {
    const { result } = renderHook(() => useAppStore());

    act(() => {
      result.current.updateApiPing();
    });

    // lastPing이 업데이트되었는지 확인 (null이 아니어야 함)
    expect(result.current.api.lastPing).not.toBeNull();
    expect(typeof result.current.api.lastPing).toBe("number");
    expect(result.current.api.lastPing).toBeGreaterThan(0);
  });

  test("should manage error count", () => {
    const { result } = renderHook(() => useAppStore());

    expect(result.current.api.errorCount).toBe(0);

    act(() => {
      result.current.incrementErrorCount();
      result.current.incrementErrorCount();
      result.current.incrementErrorCount();
    });

    expect(result.current.api.errorCount).toBe(3);

    act(() => {
      result.current.resetErrorCount();
    });

    expect(result.current.api.errorCount).toBe(0);
  });

  test("should handle updateUserPreferences when user exists", () => {
    const { result } = renderHook(() => useAppStore());

    const testUser = {
      id: "pref-user",
      name: "Preference User",
      email: "pref@example.com",
      preferences: {
        theme: "light" as const,
        language: "en" as const,
        notifications: false,
        autoSave: true,
      },
    };

    act(() => {
      result.current.setUser(testUser);
    });

    const newPreferences = {
      theme: "dark" as const,
      notifications: true,
    };

    act(() => {
      result.current.updateUserPreferences(newPreferences);
    });

    expect(result.current.user?.preferences).toEqual({
      theme: "dark",
      language: "en",
      notifications: true,
      autoSave: true,
    });
  });

  test("should handle updateUserPreferences when user is null", () => {
    const { result } = renderHook(() => useAppStore());

    // 사용자가 null인 상태에서 테스트
    expect(result.current.user).toBeNull();

    const newPreferences = {
      theme: "dark" as const,
      notifications: true,
    };

    // 사용자가 null일 때는 아무것도 하지 않아야 함
    act(() => {
      result.current.updateUserPreferences(newPreferences);
    });

    // 여전히 null이어야 함
    expect(result.current.user).toBeNull();
  });

  test("should reset store to initial state", () => {
    const { result } = renderHook(() => useAppStore());

    // 상태 변경
    act(() => {
      result.current.setUser({
        id: "test",
        name: "Test",
        email: "test@test.com",
        preferences: {
          language: "ko",
          theme: "dark",
          notifications: true,
          autoSave: false,
        },
      });
      result.current.setAuthenticated(true);
      result.current.setLoading(true);
      result.current.setTheme("dark");
      result.current.setSidebarOpen(true);
      result.current.addError("Test error");
    });

    // 리셋
    act(() => {
      result.current.reset();
    });

    // 초기 상태로 복원되었는지 확인
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.theme).toBe("auto");
    expect(result.current.sidebarOpen).toBe(false);
    expect(result.current.errors).toEqual([]);
  });
});
