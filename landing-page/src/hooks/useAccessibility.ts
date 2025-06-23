import { useEffect, useCallback, useState } from "react";
import { useAppStore } from "../store/AppStore";

// 접근성 설정 타입
interface AccessibilitySettings {
  fontSize: "small" | "medium" | "large" | "xl";
  contrast: "normal" | "high";
  motion: "normal" | "reduced";
  screenReader: boolean;
  keyboardNavigation: boolean;
}

// 키보드 네비게이션 훅
export const useKeyboardNavigation = () => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Tab 키로 포커스 표시
      if (event.key === "Tab") {
        document.body.classList.add("keyboard-navigation");
      }

      // Escape 키로 모달/드롭다운 닫기
      if (event.key === "Escape") {
        const closeButtons = document.querySelectorAll(
          "[data-close-on-escape]"
        );
        closeButtons.forEach((button) => {
          if (button instanceof HTMLElement) {
            button.click();
          }
        });
      }

      // Alt + M으로 메인 컨텐츠로 건너뛰기
      if (event.altKey && event.key === "m") {
        event.preventDefault();
        const mainContent = document.querySelector('main, [role="main"]');
        if (mainContent instanceof HTMLElement) {
          mainContent.focus();
          mainContent.scrollIntoView({ behavior: "smooth" });
        }
      }
    };

    const handleMouseDown = () => {
      document.body.classList.remove("keyboard-navigation");
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleMouseDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, []);
};

// 스크린 리더 지원 훅
export const useScreenReader = () => {
  const [isScreenReaderActive, setIsScreenReaderActive] = useState(false);

  useEffect(() => {
    // 스크린 리더 감지
    const detectScreenReader = () => {
      // 일반적인 스크린 리더 감지 방법들
      const hasAriaSupport = "speechSynthesis" in window;

      // 테스트 환경에서 window.matchMedia가 없을 수 있으므로 안전하게 체크
      let hasHighContrast = false;
      let hasReducedMotion = false;

      if (typeof window !== "undefined" && window.matchMedia) {
        try {
          const contrastQuery = window.matchMedia("(prefers-contrast: high)");
          const motionQuery = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
          );
          hasHighContrast = contrastQuery?.matches || false;
          hasReducedMotion = motionQuery?.matches || false;
        } catch (error) {
          // 테스트 환경에서 matchMedia 오류 시 기본값 사용
          hasHighContrast = false;
          hasReducedMotion = false;
        }
      }

      // 접근성 API 지원 확인
      const hasA11yAPI = "accessibility" in navigator;

      setIsScreenReaderActive(hasAriaSupport || hasHighContrast || hasA11yAPI);
    };

    detectScreenReader();

    // 미디어 쿼리 변경 감지 (브라우저 환경에서만)
    if (typeof window !== "undefined" && window.matchMedia) {
      try {
        const contrastQuery = window.matchMedia("(prefers-contrast: high)");
        const motionQuery = window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        );

        if (contrastQuery?.addEventListener && motionQuery?.addEventListener) {
          contrastQuery.addEventListener("change", detectScreenReader);
          motionQuery.addEventListener("change", detectScreenReader);

          return () => {
            contrastQuery.removeEventListener("change", detectScreenReader);
            motionQuery.removeEventListener("change", detectScreenReader);
          };
        }
      } catch (error) {
        // 테스트 환경에서 오류 시 무시
        return () => {};
      }
    }
  }, []);

  // 스크린 리더용 알림 함수
  const announceToScreenReader = useCallback(
    (message: string, priority: "polite" | "assertive" = "polite") => {
      const announcement = document.createElement("div");
      announcement.setAttribute("aria-live", priority);
      announcement.setAttribute("aria-atomic", "true");
      announcement.className = "sr-only";
      announcement.textContent = message;

      document.body.appendChild(announcement);

      // 1초 후 제거
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
    },
    []
  );

  return { isScreenReaderActive, announceToScreenReader };
};

// 포커스 관리 훅
export const useFocusManagement = () => {
  const trapFocus = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[
      focusableElements.length - 1
    ] as HTMLElement;

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          event.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          event.preventDefault();
        }
      }
    };

    container.addEventListener("keydown", handleTabKey);

    // 첫 번째 요소에 포커스
    if (firstElement) {
      firstElement.focus();
    }

    return () => {
      container.removeEventListener("keydown", handleTabKey);
    };
  }, []);

  const restoreFocus = useCallback((previousElement: HTMLElement | null) => {
    if (previousElement) {
      previousElement.focus();
    }
  }, []);

  return { trapFocus, restoreFocus };
};

// 색상 대비 체크 훅
export const useColorContrast = () => {
  const [highContrastMode, setHighContrastMode] = useState(false);

  useEffect(() => {
    // 테스트 환경에서 window.matchMedia가 없을 수 있으므로 안전하게 체크
    if (typeof window !== "undefined" && window.matchMedia) {
      try {
        const contrastQuery = window.matchMedia("(prefers-contrast: high)");

        const handleContrastChange = (e: MediaQueryListEvent) => {
          setHighContrastMode(e.matches);
          if (typeof document !== "undefined") {
            document.documentElement.classList.toggle(
              "high-contrast",
              e.matches
            );
          }
        };

        setHighContrastMode(contrastQuery?.matches || false);
        if (typeof document !== "undefined") {
          document.documentElement.classList.toggle(
            "high-contrast",
            contrastQuery?.matches || false
          );
        }

        if (contrastQuery?.addEventListener) {
          contrastQuery.addEventListener("change", handleContrastChange);

          return () => {
            contrastQuery.removeEventListener("change", handleContrastChange);
          };
        }
      } catch (error) {
        // 테스트 환경에서 오류 시 무시
        return () => {};
      }
    }
  }, []);

  return { highContrastMode };
};

// 모션 감소 설정 훅
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // 테스트 환경에서 window.matchMedia가 없을 수 있으므로 안전하게 체크
    if (typeof window !== "undefined" && window.matchMedia) {
      try {
        const motionQuery = window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        );

        const handleMotionChange = (e: MediaQueryListEvent) => {
          setPrefersReducedMotion(e.matches);
          if (typeof document !== "undefined") {
            document.documentElement.classList.toggle(
              "reduce-motion",
              e.matches
            );
          }
        };

        setPrefersReducedMotion(motionQuery?.matches || false);
        if (typeof document !== "undefined") {
          document.documentElement.classList.toggle(
            "reduce-motion",
            motionQuery?.matches || false
          );
        }

        if (motionQuery?.addEventListener) {
          motionQuery.addEventListener("change", handleMotionChange);

          return () => {
            motionQuery.removeEventListener("change", handleMotionChange);
          };
        }
      } catch (error) {
        // 테스트 환경에서 오류 시 무시
        return () => {};
      }
    }
  }, []);

  return { prefersReducedMotion };
};

// 폰트 크기 조절 훅
export const useFontSize = () => {
  const [fontSize, setFontSize] = useState<"small" | "medium" | "large" | "xl">(
    "medium"
  );

  const updateFontSize = useCallback(
    (size: "small" | "medium" | "large" | "xl") => {
      setFontSize(size);
      document.documentElement.setAttribute("data-font-size", size);

      // CSS 변수로 폰트 크기 적용
      const sizeMap = {
        small: "0.875rem",
        medium: "1rem",
        large: "1.125rem",
        xl: "1.25rem",
      };

      document.documentElement.style.setProperty(
        "--base-font-size",
        sizeMap[size]
      );
    },
    []
  );

  useEffect(() => {
    // 저장된 폰트 크기 복원
    const savedSize = localStorage.getItem("fontSize") as
      | "small"
      | "medium"
      | "large"
      | "xl";
    if (savedSize) {
      updateFontSize(savedSize);
    }
  }, [updateFontSize]);

  const saveFontSize = useCallback(
    (size: "small" | "medium" | "large" | "xl") => {
      localStorage.setItem("fontSize", size);
      updateFontSize(size);
    },
    [updateFontSize]
  );

  return { fontSize, setFontSize: saveFontSize };
};

// 메인 접근성 훅
export const useAccessibility = () => {
  const { announceToScreenReader, isScreenReaderActive } = useScreenReader();
  const { trapFocus, restoreFocus } = useFocusManagement();
  const { highContrastMode } = useColorContrast();
  const { prefersReducedMotion } = useReducedMotion();
  const { fontSize, setFontSize } = useFontSize();
  const addError = useAppStore((state) => state.addError);

  // 키보드 네비게이션 활성화
  useKeyboardNavigation();

  // 접근성 설정 변경 알림
  const notifyAccessibilityChange = useCallback(
    (message: string) => {
      announceToScreenReader(message, "polite");
      addError(message, "info");
    },
    [announceToScreenReader, addError]
  );

  // 접근성 검사 함수
  const checkAccessibility = useCallback(() => {
    const issues: string[] = [];

    // 이미지 alt 속성 검사
    const images = document.querySelectorAll("img:not([alt])");
    if (images.length > 0) {
      issues.push(`${images.length}개의 이미지에 alt 속성이 누락되었습니다.`);
    }

    // 버튼 레이블 검사
    const unlabeledButtons = document.querySelectorAll(
      "button:not([aria-label]):not([aria-labelledby])"
    );
    const emptyButtons = Array.from(unlabeledButtons).filter(
      (btn) => !btn.textContent?.trim()
    );
    if (emptyButtons.length > 0) {
      issues.push(`${emptyButtons.length}개의 버튼에 레이블이 누락되었습니다.`);
    }

    // 폼 레이블 검사
    const unlabeledInputs = document.querySelectorAll(
      "input:not([aria-label]):not([aria-labelledby])"
    );
    const inputsWithoutLabels = Array.from(unlabeledInputs).filter((input) => {
      const id = input.getAttribute("id");
      return !id || !document.querySelector(`label[for="${id}"]`);
    });
    if (inputsWithoutLabels.length > 0) {
      issues.push(
        `${inputsWithoutLabels.length}개의 입력 필드에 레이블이 누락되었습니다.`
      );
    }

    return issues;
  }, []);

  return {
    // 상태
    isScreenReaderActive,
    highContrastMode,
    prefersReducedMotion,
    fontSize,

    // 함수들
    announceToScreenReader,
    trapFocus,
    restoreFocus,
    setFontSize,
    notifyAccessibilityChange,
    checkAccessibility,
  };
};

export default useAccessibility;
