import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

// 인터페이스 정의
interface User {
  id: string;
  name: string;
  email: string;
  preferences: UserPreferences;
}

interface UserPreferences {
  theme: "light" | "dark" | "auto";
  language: "ko" | "en";
  notifications: boolean;
  autoSave: boolean;
}

interface ApiState {
  isConnected: boolean;
  lastPing: number | null;
  errorCount: number;
  baseUrl: string;
}

interface AppState {
  // 사용자 상태
  user: User | null;
  isAuthenticated: boolean;

  // UI 상태
  isLoading: boolean;
  theme: "light" | "dark" | "auto";
  sidebarOpen: boolean;

  // API 상태
  api: ApiState;

  // 에러 상태
  errors: Array<{
    id: string;
    message: string;
    timestamp: number;
    type: "error" | "warning" | "info";
  }>;

  // 액션들
  setUser: (user: User | null) => void;
  setAuthenticated: (isAuth: boolean) => void;
  setLoading: (loading: boolean) => void;
  setTheme: (theme: "light" | "dark" | "auto") => void;
  setSidebarOpen: (open: boolean) => void;

  // API 액션들
  setApiConnected: (connected: boolean) => void;
  updateApiPing: () => void;
  incrementErrorCount: () => void;
  resetErrorCount: () => void;
  setApiBaseUrl: (url: string) => void;

  // 에러 관리 액션들
  addError: (message: string, type?: "error" | "warning" | "info") => void;
  removeError: (id: string) => void;
  clearErrors: () => void;

  // 사용자 설정 액션들
  updateUserPreferences: (preferences: Partial<UserPreferences>) => void;

  // 초기화 액션
  reset: () => void;
}

// 초기 상태
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  theme: "auto" as const,
  sidebarOpen: false,
  api: {
    isConnected: false,
    lastPing: null,
    errorCount: 0,
    baseUrl: process.env.REACT_APP_API_BASE_URL || "http://localhost:8000",
  },
  errors: [],
};

// Zustand 스토어 생성
export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // 사용자 액션들
        setUser: (user) => set({ user }, false, "setUser"),

        setAuthenticated: (isAuthenticated) =>
          set({ isAuthenticated }, false, "setAuthenticated"),

        setLoading: (isLoading) => set({ isLoading }, false, "setLoading"),

        setTheme: (theme) => {
          set({ theme }, false, "setTheme");
          // 테마 변경 시 DOM에도 적용
          document.documentElement.setAttribute("data-theme", theme);
        },

        setSidebarOpen: (sidebarOpen) =>
          set({ sidebarOpen }, false, "setSidebarOpen"),

        // API 액션들
        setApiConnected: (isConnected) =>
          set(
            (state) => ({
              api: { ...state.api, isConnected },
            }),
            false,
            "setApiConnected"
          ),

        updateApiPing: () =>
          set(
            (state) => ({
              api: { ...state.api, lastPing: Date.now() },
            }),
            false,
            "updateApiPing"
          ),

        incrementErrorCount: () =>
          set(
            (state) => ({
              api: { ...state.api, errorCount: state.api.errorCount + 1 },
            }),
            false,
            "incrementErrorCount"
          ),

        resetErrorCount: () =>
          set(
            (state) => ({
              api: { ...state.api, errorCount: 0 },
            }),
            false,
            "resetErrorCount"
          ),

        setApiBaseUrl: (baseUrl) =>
          set(
            (state) => ({
              api: { ...state.api, baseUrl },
            }),
            false,
            "setApiBaseUrl"
          ),

        // 에러 관리 액션들
        addError: (message, type = "error") => {
          const id = `error-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}`;
          const newError = {
            id,
            message,
            type,
            timestamp: Date.now(),
          };

          set(
            (state) => ({
              errors: [...state.errors, newError],
            }),
            false,
            "addError"
          );

          // 5초 후 자동 제거 (info 타입은 3초)
          const timeout = type === "info" ? 3000 : 5000;
          setTimeout(() => {
            get().removeError(id);
          }, timeout);
        },

        removeError: (id) =>
          set(
            (state) => ({
              errors: state.errors.filter((error) => error.id !== id),
            }),
            false,
            "removeError"
          ),

        clearErrors: () => set({ errors: [] }, false, "clearErrors"),

        // 사용자 설정 액션들
        updateUserPreferences: (preferences) =>
          set(
            (state) => ({
              user: state.user
                ? {
                    ...state.user,
                    preferences: { ...state.user.preferences, ...preferences },
                  }
                : null,
            }),
            false,
            "updateUserPreferences"
          ),

        // 초기화
        reset: () => set(initialState, false, "reset"),
      }),
      {
        name: "hapa-app-store",
        partialize: (state) => ({
          theme: state.theme,
          sidebarOpen: state.sidebarOpen,
          user: state.user,
          api: {
            baseUrl: state.api.baseUrl,
          },
        }),
      }
    ),
    {
      name: "HAPA App Store",
    }
  )
);

// 선택자 훅들 (성능 최적화)
export const useUser = () => useAppStore((state) => state.user);
export const useAuth = () =>
  useAppStore((state) => ({
    isAuthenticated: state.isAuthenticated,
    setAuthenticated: state.setAuthenticated,
  }));
export const useTheme = () =>
  useAppStore((state) => ({
    theme: state.theme,
    setTheme: state.setTheme,
  }));
export const useLoading = () =>
  useAppStore((state) => ({
    isLoading: state.isLoading,
    setLoading: state.setLoading,
  }));
export const useApi = () => useAppStore((state) => state.api);
export const useErrors = () =>
  useAppStore((state) => ({
    errors: state.errors,
    addError: state.addError,
    removeError: state.removeError,
    clearErrors: state.clearErrors,
  }));

// 타입 내보내기
export type { User, UserPreferences, ApiState, AppState };
