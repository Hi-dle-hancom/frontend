/**
 * HAPA Landing Page - 애플리케이션 컨텍스트
 * @fileoverview 전역 상태 관리와 공통 데이터 제공
 */

import React, { createContext, useContext, useReducer, useEffect } from "react";

// ============================================================================
// TYPES
// ============================================================================

/**
 * 테마 타입
 */
export type Theme = "light" | "dark" | "system";

/**
 * 페이지 타입
 */
export type PageType = "home" | "about" | "guide";

/**
 * 알림 타입
 */
export interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  timestamp: Date;
  autoClose?: boolean;
  duration?: number;
}

/**
 * 데모 상태
 */
export interface DemoState {
  isRunning: boolean;
  currentStep: number;
  totalSteps: number;
  input: string;
  output: string;
  loading: boolean;
  error?: string;
}

/**
 * API 상태
 */
export interface APIStatus {
  isConnected: boolean;
  isLoading: boolean;
  baseURL: string;
  lastChecked?: Date;
  version?: string;
  error?: string;
}

/**
 * 애플리케이션 상태
 */
export interface AppState {
  theme: Theme;
  currentPage: PageType;
  notifications: Notification[];
  demo: DemoState;
  api: APIStatus;
  preferences: {
    autoStartDemo: boolean;
    showNotifications: boolean;
    animationsEnabled: boolean;
  };
}

/**
 * 액션 타입
 */
export type AppAction =
  | { type: "SET_THEME"; payload: Theme }
  | { type: "SET_CURRENT_PAGE"; payload: PageType }
  | {
      type: "ADD_NOTIFICATION";
      payload: Omit<Notification, "id" | "timestamp">;
    }
  | { type: "REMOVE_NOTIFICATION"; payload: string }
  | { type: "CLEAR_NOTIFICATIONS" }
  | { type: "START_DEMO" }
  | { type: "STOP_DEMO" }
  | { type: "NEXT_DEMO_STEP" }
  | { type: "SET_DEMO_INPUT"; payload: string }
  | { type: "SET_DEMO_OUTPUT"; payload: string }
  | { type: "SET_DEMO_LOADING"; payload: boolean }
  | { type: "SET_DEMO_ERROR"; payload: string | undefined }
  | { type: "SET_API_STATUS"; payload: Partial<APIStatus> }
  | { type: "UPDATE_PREFERENCES"; payload: Partial<AppState["preferences"]> };

// ============================================================================
// INITIAL STATE
// ============================================================================

/**
 * 초기 상태
 */
const initialState: AppState = {
  theme: "system",
  currentPage: "home",
  notifications: [],
  demo: {
    isRunning: false,
    currentStep: 0,
    totalSteps: 5,
    input:
      "파이썬 함수를 만들어 주세요. 리스트에서 중복된 값을 제거하는 함수입니다.",
    output: "",
    loading: false,
  },
  api: {
    isConnected: false,
    isLoading: false,
    baseURL: "http://localhost:8000",
  },
  preferences: {
    autoStartDemo: false,
    showNotifications: true,
    animationsEnabled: true,
  },
};

// ============================================================================
// REDUCER
// ============================================================================

/**
 * 앱 리듀서
 */
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_THEME":
      return {
        ...state,
        theme: action.payload,
      };

    case "SET_CURRENT_PAGE":
      return {
        ...state,
        currentPage: action.payload,
      };

    case "ADD_NOTIFICATION": {
      const notification: Notification = {
        ...action.payload,
        id: `notification_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        timestamp: new Date(),
      };

      return {
        ...state,
        notifications: [notification, ...state.notifications].slice(0, 10), // 최대 10개
      };
    }

    case "REMOVE_NOTIFICATION":
      return {
        ...state,
        notifications: state.notifications.filter(
          (n) => n.id !== action.payload
        ),
      };

    case "CLEAR_NOTIFICATIONS":
      return {
        ...state,
        notifications: [],
      };

    case "START_DEMO":
      return {
        ...state,
        demo: {
          ...state.demo,
          isRunning: true,
          currentStep: 0,
          loading: true,
          error: undefined,
        },
      };

    case "STOP_DEMO":
      return {
        ...state,
        demo: {
          ...state.demo,
          isRunning: false,
          loading: false,
        },
      };

    case "NEXT_DEMO_STEP":
      return {
        ...state,
        demo: {
          ...state.demo,
          currentStep: Math.min(
            state.demo.currentStep + 1,
            state.demo.totalSteps
          ),
        },
      };

    case "SET_DEMO_INPUT":
      return {
        ...state,
        demo: {
          ...state.demo,
          input: action.payload,
        },
      };

    case "SET_DEMO_OUTPUT":
      return {
        ...state,
        demo: {
          ...state.demo,
          output: action.payload,
          loading: false,
        },
      };

    case "SET_DEMO_LOADING":
      return {
        ...state,
        demo: {
          ...state.demo,
          loading: action.payload,
        },
      };

    case "SET_DEMO_ERROR":
      return {
        ...state,
        demo: {
          ...state.demo,
          error: action.payload,
          loading: false,
        },
      };

    case "SET_API_STATUS":
      return {
        ...state,
        api: {
          ...state.api,
          ...action.payload,
        },
      };

    case "UPDATE_PREFERENCES":
      return {
        ...state,
        preferences: {
          ...state.preferences,
          ...action.payload,
        },
      };

    default:
      return state;
  }
}

// ============================================================================
// CONTEXT
// ============================================================================

/**
 * 앱 컨텍스트 타입
 */
export interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;

  // 편의 함수들
  setTheme: (theme: Theme) => void;
  setCurrentPage: (page: PageType) => void;
  addNotification: (
    notification: Omit<Notification, "id" | "timestamp">
  ) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  startDemo: () => void;
  stopDemo: () => void;
  nextDemoStep: () => void;
  setDemoInput: (input: string) => void;
  setDemoOutput: (output: string) => void;
  setDemoLoading: (loading: boolean) => void;
  setDemoError: (error: string | undefined) => void;
  setAPIStatus: (status: Partial<APIStatus>) => void;
  updatePreferences: (preferences: Partial<AppState["preferences"]>) => void;
}

/**
 * 앱 컨텍스트
 */
const AppContext = createContext<AppContextType | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

/**
 * 앱 컨텍스트 프로바이더 Props
 */
interface AppProviderProps {
  children: React.ReactNode;
}

/**
 * 앱 컨텍스트 프로바이더
 */
export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // 로컬 스토리지에서 설정 로드
  useEffect(() => {
    const savedTheme = localStorage.getItem("hapa-theme") as Theme;
    if (savedTheme && ["light", "dark", "system"].includes(savedTheme)) {
      dispatch({ type: "SET_THEME", payload: savedTheme });
    }

    const savedPreferences = localStorage.getItem("hapa-preferences");
    if (savedPreferences) {
      try {
        const preferences = JSON.parse(savedPreferences);
        dispatch({ type: "UPDATE_PREFERENCES", payload: preferences });
      } catch (error) {
        console.warn("Failed to load saved preferences:", error);
      }
    }
  }, []);

  // 테마 변경 시 로컬 스토리지에 저장
  useEffect(() => {
    localStorage.setItem("hapa-theme", state.theme);

    // 시스템 테마인 경우 실제 테마 적용
    if (state.theme === "system") {
      // 테스트 환경에서 window.matchMedia가 없을 수 있으므로 안전하게 체크
      if (typeof window !== "undefined" && window.matchMedia) {
        try {
          const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
          const actualTheme = mediaQuery?.matches ? "dark" : "light";
          if (typeof document !== "undefined") {
            document.documentElement.setAttribute("data-theme", actualTheme);
          }
        } catch (error) {
          // matchMedia 접근 실패 시 기본값 사용
          if (typeof document !== "undefined") {
            document.documentElement.setAttribute("data-theme", "light");
          }
        }
      } else {
        // 테스트 환경이나 SSR 환경에서는 기본값으로 light 테마 사용
        if (typeof document !== "undefined") {
          document.documentElement.setAttribute("data-theme", "light");
        }
      }
    } else {
      if (typeof document !== "undefined") {
        document.documentElement.setAttribute("data-theme", state.theme);
      }
    }
  }, [state.theme]);

  // 설정 변경 시 로컬 스토리지에 저장
  useEffect(() => {
    localStorage.setItem("hapa-preferences", JSON.stringify(state.preferences));
  }, [state.preferences]);

  // 알림 자동 제거
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    state.notifications.forEach((notification) => {
      if (notification.autoClose !== false) {
        const duration = notification.duration || 5000;
        const timer = setTimeout(() => {
          dispatch({ type: "REMOVE_NOTIFICATION", payload: notification.id });
        }, duration);
        timers.push(timer);
      }
    });

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [state.notifications]);

  // API 상태 확인
  useEffect(() => {
    const checkAPIStatus = async () => {
      dispatch({
        type: "SET_API_STATUS",
        payload: { isLoading: true },
      });

      try {
        const response = await fetch(`${state.api.baseURL}/health`);
        const data = await response.json();

        dispatch({
          type: "SET_API_STATUS",
          payload: {
            isConnected: response.ok,
            isLoading: false,
            lastChecked: new Date(),
            version: data.version,
            error: undefined,
          },
        });
      } catch (error) {
        dispatch({
          type: "SET_API_STATUS",
          payload: {
            isConnected: false,
            isLoading: false,
            lastChecked: new Date(),
            error: error instanceof Error ? error.message : "Unknown error",
          },
        });
      }
    };

    // 초기 확인
    checkAPIStatus();

    // 주기적 확인 (30초마다)
    const interval = setInterval(checkAPIStatus, 30000);

    return () => clearInterval(interval);
  }, [state.api.baseURL]);

  // 편의 함수들
  const contextValue: AppContextType = {
    state,
    dispatch,

    setTheme: (theme: Theme) => dispatch({ type: "SET_THEME", payload: theme }),
    setCurrentPage: (page: PageType) =>
      dispatch({ type: "SET_CURRENT_PAGE", payload: page }),
    addNotification: (notification) =>
      dispatch({ type: "ADD_NOTIFICATION", payload: notification }),
    removeNotification: (id: string) =>
      dispatch({ type: "REMOVE_NOTIFICATION", payload: id }),
    clearNotifications: () => dispatch({ type: "CLEAR_NOTIFICATIONS" }),
    startDemo: () => dispatch({ type: "START_DEMO" }),
    stopDemo: () => dispatch({ type: "STOP_DEMO" }),
    nextDemoStep: () => dispatch({ type: "NEXT_DEMO_STEP" }),
    setDemoInput: (input: string) =>
      dispatch({ type: "SET_DEMO_INPUT", payload: input }),
    setDemoOutput: (output: string) =>
      dispatch({ type: "SET_DEMO_OUTPUT", payload: output }),
    setDemoLoading: (loading: boolean) =>
      dispatch({ type: "SET_DEMO_LOADING", payload: loading }),
    setDemoError: (error: string | undefined) =>
      dispatch({ type: "SET_DEMO_ERROR", payload: error }),
    setAPIStatus: (status: Partial<APIStatus>) =>
      dispatch({ type: "SET_API_STATUS", payload: status }),
    updatePreferences: (preferences) =>
      dispatch({ type: "UPDATE_PREFERENCES", payload: preferences }),
  };

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
};

// ============================================================================
// HOOK
// ============================================================================

/**
 * 앱 컨텍스트 훅
 */
export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);

  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }

  return context;
};
