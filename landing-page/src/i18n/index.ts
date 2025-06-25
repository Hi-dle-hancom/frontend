// 간단한 i18n 시스템 구현

export type Language = "ko" | "en";

// 번역 키 타입 정의
export interface Translations {
  common: {
    loading: string;
    error: string;
    success: string;
    cancel: string;
    confirm: string;
    save: string;
    edit: string;
    delete: string;
    close: string;
    open: string;
    search: string;
    clear: string;
    back: string;
    next: string;
    previous: string;
    finish: string;
    retry: string;
    copy: string;
    download: string;
    upload: string;
    settings: string;
    help: string;
    about: string;
    contact: string;
    privacy: string;
    terms: string;
    language: string;
    theme: string;
    version: string;
  };
  navigation: {
    home: string;
    about: string;
    guide: string;
    features: string;
    download: string;
    documentation: string;
    support: string;
    api: string;
    blog: string;
    community: string;
  };
  home: {
    title: string;
    subtitle: string;
    description: string;
    hero: {
      title: string;
      subtitle: string;
      description: string;
      installButton: string;
      docsButton: string;
      statusText: string;
    };
    demo: {
      title: string;
      subtitle: string;
      fullscreen: string;
      tutorial: string;
      placeholder: string;
      send: string;
      streaming: string;
      stop: string;
      clear: string;
      export: string;
      tabs: {
        body: string;
        headers: string;
        test: string;
        history: string;
      };
    };
    features: {
      title: string;
      subtitle: string;
      items: {
        quickStart: {
          title: string;
          description: string;
        };
        integration: {
          title: string;
          description: string;
        };
        intelligent: {
          title: string;
          description: string;
        };
        realtime: {
          title: string;
          description: string;
        };
        quality: {
          title: string;
          description: string;
        };
        secure: {
          title: string;
          description: string;
        };
      };
    };
    footer: {
      description: string;
      links: {
        product: string;
        company: string;
        resources: string;
        legal: string;
      };
      copyright: string;
    };
  };
  accessibility: {
    skipToMain: string;
    screenReaderOnly: string;
    keyboardNavigation: string;
    highContrast: string;
    reducedMotion: string;
    fontSize: {
      small: string;
      medium: string;
      large: string;
      xl: string;
    };
    announcements: {
      pageLoaded: string;
      errorOccurred: string;
      formSubmitted: string;
      settingsChanged: string;
    };
  };
  errors: {
    generic: string;
    network: string;
    notFound: string;
    unauthorized: string;
    forbidden: string;
    serverError: string;
    timeout: string;
    validation: string;
  };
}

// 한국어 번역
const koTranslations: Translations = {
  common: {
    loading: "로딩 중...",
    error: "오류",
    success: "성공",
    cancel: "취소",
    confirm: "확인",
    save: "저장",
    edit: "편집",
    delete: "삭제",
    close: "닫기",
    open: "열기",
    search: "검색",
    clear: "지우기",
    back: "이전",
    next: "다음",
    previous: "이전",
    finish: "완료",
    retry: "다시 시도",
    copy: "복사",
    download: "다운로드",
    upload: "업로드",
    settings: "설정",
    help: "도움말",
    about: "소개",
    contact: "연락처",
    privacy: "개인정보처리방침",
    terms: "이용약관",
    language: "언어",
    theme: "테마",
    version: "버전",
  },
  navigation: {
    home: "홈",
    about: "소개",
    guide: "가이드",
    features: "기능",
    download: "다운로드",
    documentation: "문서",
    support: "지원",
    api: "API",
    blog: "블로그",
    community: "커뮤니티",
  },
  home: {
    title: "HAPA - Hancom AI Python Assistant",
    subtitle: "VS Code Extension으로 제공하는 차세대 AI 코딩 도구",
    description:
      "지능형 코드 생성, 실시간 코드 완성, 코드 품질 검증을 통해 개발 생산성을 향상시키세요.",
    hero: {
      title: "HAPA AI Assistant",
      subtitle: "VSCode Extension으로 제공하는",
      description: "차세대 AI 코딩 도구",
      installButton: "⚡ 확장 프로그램 설치",
      docsButton: "📖 문서 보기",
      statusText: "VS Code Extension v0.4.0 · 백엔드 API 연결됨",
    },
    demo: {
      title: "LIVE DEMO",
      subtitle: "실시간 AI 코드 생성을 체험해보세요",
      fullscreen: "전체화면",
      tutorial: "튜토리얼",
      placeholder:
        '예시: "Python에서 피보나치 수열을 효율적으로 구현하는 방법을 알려주세요"',
      send: "전송",
      streaming: "스트리밍 중...",
      stop: "중지",
      clear: "지우기",
      export: "내보내기",
      tabs: {
        body: "응답",
        headers: "헤더",
        test: "테스트 결과",
        history: "기록",
      },
    },
    features: {
      title: "주요 기능",
      subtitle: "HAPA가 제공하는 강력한 AI 코딩 지원 기능들",
      items: {
        quickStart: {
          title: "즉시 사용",
          description:
            "VSCode Extension처럼 설치 후 바로 사용 가능. 복잡한 설정 없이 AI 코딩 지원을 받으세요.",
        },
        integration: {
          title: "VS Code 통합",
          description:
            "사이드바에서 바로 접근. 코딩 워크플로우를 방해하지 않는 깔끔한 인터페이스.",
        },
        intelligent: {
          title: "지능형 코드 생성",
          description:
            "고급 AI 모델을 활용한 정확하고 효율적인 Python 코드 생성.",
        },
        realtime: {
          title: "실시간 코드 완성",
          description:
            "타이핑과 동시에 제공되는 스마트한 코드 제안 및 자동 완성.",
        },
        quality: {
          title: "코드 품질 검증",
          description:
            "생성된 코드의 품질과 성능을 자동으로 분석하고 개선 제안.",
        },
        secure: {
          title: "보안 및 프라이버시",
          description:
            "로컬 처리와 암호화된 통신으로 코드 보안 및 개인정보 보호.",
        },
      },
    },
    footer: {
      description:
        "HAPA는 한컴에서 개발한 AI 기반 Python 코딩 어시스턴트입니다.",
      links: {
        product: "제품",
        company: "회사",
        resources: "리소스",
        legal: "법적 고지",
      },
      copyright: "© 2024 한컴. All rights reserved.",
    },
  },
  accessibility: {
    skipToMain: "메인 콘텐츠로 건너뛰기",
    screenReaderOnly: "스크린 리더 전용",
    keyboardNavigation: "키보드 네비게이션 활성화됨",
    highContrast: "고대비 모드",
    reducedMotion: "모션 감소 모드",
    fontSize: {
      small: "작은 글씨",
      medium: "보통 글씨",
      large: "큰 글씨",
      xl: "매우 큰 글씨",
    },
    announcements: {
      pageLoaded: "페이지가 로드되었습니다",
      errorOccurred: "오류가 발생했습니다",
      formSubmitted: "양식이 제출되었습니다",
      settingsChanged: "설정이 변경되었습니다",
    },
  },
  errors: {
    generic: "알 수 없는 오류가 발생했습니다",
    network: "네트워크 연결을 확인해주세요",
    notFound: "요청한 페이지를 찾을 수 없습니다",
    unauthorized: "인증이 필요합니다",
    forbidden: "접근 권한이 없습니다",
    serverError: "서버 오류가 발생했습니다",
    timeout: "요청 시간이 초과되었습니다",
    validation: "입력 값을 확인해주세요",
  },
};

// 영어 번역
const enTranslations: Translations = {
  common: {
    loading: "Loading...",
    error: "Error",
    success: "Success",
    cancel: "Cancel",
    confirm: "Confirm",
    save: "Save",
    edit: "Edit",
    delete: "Delete",
    close: "Close",
    open: "Open",
    search: "Search",
    clear: "Clear",
    back: "Back",
    next: "Next",
    previous: "Previous",
    finish: "Finish",
    retry: "Retry",
    copy: "Copy",
    download: "Download",
    upload: "Upload",
    settings: "Settings",
    help: "Help",
    about: "About",
    contact: "Contact",
    privacy: "Privacy Policy",
    terms: "Terms of Service",
    language: "Language",
    theme: "Theme",
    version: "Version",
  },
  navigation: {
    home: "Home",
    about: "About",
    guide: "Guide",
    features: "Features",
    download: "Download",
    documentation: "Documentation",
    support: "Support",
    api: "API",
    blog: "Blog",
    community: "Community",
  },
  home: {
    title: "HAPA - Hancom AI Python Assistant",
    subtitle: "Next-Generation AI Coding Tool as VS Code Extension",
    description:
      "Enhance your development productivity with intelligent code generation, real-time code completion, and code quality validation.",
    hero: {
      title: "HAPA AI Assistant",
      subtitle: "Provided as VSCode Extension",
      description: "Next-Generation AI Coding Tool",
      installButton: "⚡ Install Extension",
      docsButton: "📖 View Documentation",
      statusText: "VS Code Extension v0.4.0 · Backend API Connected",
    },
    demo: {
      title: "LIVE DEMO",
      subtitle: "Experience real-time AI code generation",
      fullscreen: "Fullscreen",
      tutorial: "Tutorial",
      placeholder:
        'Example: "Show me how to efficiently implement Fibonacci sequence in Python"',
      send: "Send",
      streaming: "Streaming...",
      stop: "Stop",
      clear: "Clear",
      export: "Export",
      tabs: {
        body: "Response",
        headers: "Headers",
        test: "Test Results",
        history: "History",
      },
    },
    features: {
      title: "Key Features",
      subtitle: "Powerful AI coding support features provided by HAPA",
      items: {
        quickStart: {
          title: "Quick Start",
          description:
            "Ready to use immediately after installation like VSCode Extension. Get AI coding support without complex setup.",
        },
        integration: {
          title: "VS Code Integration",
          description:
            "Direct access from sidebar. Clean interface that doesn't interrupt your coding workflow.",
        },
        intelligent: {
          title: "Intelligent Code Generation",
          description:
            "Accurate and efficient Python code generation using advanced AI models.",
        },
        realtime: {
          title: "Real-time Code Completion",
          description:
            "Smart code suggestions and auto-completion provided simultaneously with typing.",
        },
        quality: {
          title: "Code Quality Validation",
          description:
            "Automatically analyze quality and performance of generated code with improvement suggestions.",
        },
        secure: {
          title: "Security & Privacy",
          description:
            "Code security and privacy protection through local processing and encrypted communication.",
        },
      },
    },
    footer: {
      description:
        "HAPA is an AI-powered Python coding assistant developed by Hancom.",
      links: {
        product: "Product",
        company: "Company",
        resources: "Resources",
        legal: "Legal",
      },
      copyright: "© 2024 Hancom. All rights reserved.",
    },
  },
  accessibility: {
    skipToMain: "Skip to main content",
    screenReaderOnly: "Screen reader only",
    keyboardNavigation: "Keyboard navigation enabled",
    highContrast: "High contrast mode",
    reducedMotion: "Reduced motion mode",
    fontSize: {
      small: "Small font",
      medium: "Medium font",
      large: "Large font",
      xl: "Extra large font",
    },
    announcements: {
      pageLoaded: "Page loaded",
      errorOccurred: "An error occurred",
      formSubmitted: "Form submitted",
      settingsChanged: "Settings changed",
    },
  },
  errors: {
    generic: "An unknown error occurred",
    network: "Please check your network connection",
    notFound: "The requested page was not found",
    unauthorized: "Authentication required",
    forbidden: "Access denied",
    serverError: "A server error occurred",
    timeout: "Request timeout",
    validation: "Please check your input",
  },
};

// 번역 데이터
const translations = {
  ko: koTranslations,
  en: enTranslations,
};

// 현재 언어 상태
let currentLanguage: Language = "ko";

// 브라우저 언어 감지
export const detectBrowserLanguage = (): Language => {
  const browserLang = navigator.language.split("-")[0];
  return browserLang === "ko" || browserLang === "en"
    ? (browserLang as Language)
    : "ko";
};

// 언어 설정
export const setLanguage = (lang: Language): void => {
  currentLanguage = lang;
  localStorage.setItem("language", lang);
  document.documentElement.lang = lang;
};

// 현재 언어 가져오기
export const getCurrentLanguage = (): Language => {
  return currentLanguage;
};

// 번역 함수
export const t = (key: string): string => {
  const keys = key.split(".");
  let value: any = translations[currentLanguage];

  for (const k of keys) {
    if (value && typeof value === "object" && k in value) {
      value = value[k];
    } else {
      // 키를 찾을 수 없는 경우 키 자체를 반환
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
  }

  return typeof value === "string" ? value : key;
};

// 언어 초기화
export const initializeLanguage = (): void => {
  const savedLang = localStorage.getItem("language") as Language;
  const defaultLang = savedLang || detectBrowserLanguage();
  setLanguage(defaultLang);
};

// 지원되는 언어 목록
export const supportedLanguages = [
  { code: "ko", name: "한국어", nativeName: "한국어" },
  { code: "en", name: "English", nativeName: "English" },
] as const;

// 번역 데이터 내보내기
export { translations };
