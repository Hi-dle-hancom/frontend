# 🎨 HAPA Frontend Applications

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19+-blue.svg)](https://react.dev/)
[![VSCode](https://img.shields.io/badge/VSCode-API-blue.svg)](https://code.visualstudio.com/api)
[![Tailwind](https://img.shields.io/badge/Tailwind-3.0+-blue.svg)](https://tailwindcss.com/)

> **HAPA의 사용자 인터페이스 컬렉션**  
> VSCode 확장과 React 웹 애플리케이션으로 구성된 프론트엔드 생태계

## 🎯 **개요**

HAPA Frontend는 두 가지 핵심 사용자 인터페이스를 제공합니다:

1. **VSCode Extension**: 개발자 워크플로우에 완전히 통합된 에디터 확장
2. **React Web App**: 브라우저 기반 랜딩 페이지 및 데모 인터페이스

## 📂 **프로젝트 구조**

```
Frontend/
├── 📁 vscode-extension/        # VSCode 확장 프로그램
│   ├── src/                         # TypeScript 소스코드
│   │   ├── extension.ts            # 확장 진입점
│   │   ├── core/                   # 핵심 관리자
│   │   ├── providers/              # 웹뷰 프로바이더
│   │   ├── services/               # 비즈니스 로직
│   │   ├── modules/                # 기능 모듈
│   │   ├── templates/              # HTML 템플릿
│   │   ├── styles/                 # CSS 스타일
│   │   └── types/                  # TypeScript 타입
│   ├── package.json                # 확장 메타데이터
│   └── tsconfig.json               # TypeScript 설정
├── 📁 landing-page/                 # React 웹 애플리케이션
│   ├── src/                        # React 소스코드
│   │   ├── App.tsx                 # 메인 컴포넌트
│   │   ├── components/             # UI 컴포넌트
│   │   ├── contexts/               # React Context
│   │   ├── hooks/                  # 커스텀 훅
│   │   ├── store/                  # 상태 관리
│   │   ├── styles/                 # CSS 파일
│   │   └── utils/                  # 유틸리티
│   ├── public/                     # 정적 자산
│   ├── package.json                # React 의존성
│   └── tailwind.config.js          # Tailwind 설정
└── README.md                       # 이 파일
```

---

# 🔌 VSCode Extension

## ✨ **주요 기능**

- 🤖 **AI 대화 인터페이스**: 사이드바에서 자연어로 코딩 질문
- ⚡ **실시간 자동완성**: 타이핑하면서 즉시 코드 제안
- 🎯 **컨텍스트 기반 생성**: 현재 파일과 프로젝트 맥락 이해
- 📊 **개인화 설정**: 스킬 레벨별 맞춤 코드 생성
- 🌐 **오프라인 지원**: 네트워크 없이도 기본 기능 사용
- 📝 **히스토리 관리**: 이전 대화 및 생성 결과 저장
- 🔧 **설정 동기화**: VSCode 설정과 완전 통합

## 🚀 **설치 및 실행**

### 개발 환경 설정

```bash
# 1. 프로젝트 클론
git clone [repository-url]
cd Frontend/vscode-extension copy

# 2. 의존성 설치
npm install

# 3. TypeScript 컴파일
npm run compile

# 4. VSCode에서 실행
# F5를 눌러 Extension Development Host 실행
```

### 패키징 및 설치

```bash
# 1. VSIX 패키지 생성
npm install -g vsce
vsce package

# 2. 로컬 설치
code --install-extension hapa-0.4.0.vsix

# 3. 마켓플레이스 발행
vsce publish
```

## 🏗️ **아키텍처**

### 핵심 컴포넌트

```typescript
// ExtensionManager - 전체 확장 생명주기 관리
class ExtensionManager {
  private providers: Map<string, BaseWebviewProvider>;
  private services: ServiceContainer;

  async activate(context: vscode.ExtensionContext) {
    // 프로바이더와 서비스 초기화
  }
}

// BaseWebviewProvider - 웹뷰 공통 기능
abstract class BaseWebviewProvider {
  protected webview: vscode.Webview;
  protected context: vscode.ExtensionContext;

  abstract getHtmlContent(): string;
  abstract handleMessage(message: WebviewMessage): void;
}
```

### 주요 서비스

| 서비스                   | 역할                     | 파일 위치                              |
| ------------------------ | ------------------------ | -------------------------------------- |
| **ConfigService**        | 설정 관리 및 검증        | `src/services/ConfigService.ts`        |
| **ErrorService**         | 오류 처리 및 로깅        | `src/services/EnhancedErrorService.ts` |
| **OfflineService**       | 오프라인 큐 및 캐시 관리 | `src/services/OfflineService.ts`       |
| **TelemetryService**     | 사용량 분석              | `src/services/TelemetryService.ts`     |
| **AccessibilityService** | 접근성 지원              | `src/services/AccessibilityService.ts` |

### 프로바이더 구조

```typescript
// 사이드바 메인 인터페이스
class SidebarProvider extends BaseWebviewProvider {
  // AI 대화, 설정, 히스토리 통합 관리
}

// 온보딩 프로세스
class OnboardingProvider extends BaseWebviewProvider {
  // 사용자 프로필 설정 및 튜토리얼
}

// 코드 완성 제공
class CompletionProvider implements vscode.CompletionItemProvider {
  // 실시간 자동완성 로직
}
```

## 🔧 **설정**

### extension.json 주요 설정

```json
{
  "hapa.apiBaseURL": "http://localhost:8000/api/v1",
  "hapa.apiKey": "your-api-key",
  "hapa.enableCodeAnalysis": true,
  "hapa.autoComplete": true,
  "hapa.maxSuggestions": 5,
  "hapa.theme": "system",
  "hapa.commentTrigger": {
    "enabled": true,
    "resultDisplayMode": "sidebar",
    "autoInsertDelay": 2000
  }
}
```

### 사용자 프로필 설정

```typescript
interface UserProfile {
  pythonSkillLevel: "beginner" | "intermediate" | "advanced" | "expert";
  codeOutputStructure: "minimal" | "standard" | "detailed" | "comprehensive";
  explanationStyle: "brief" | "standard" | "detailed" | "educational";
  projectContext:
    | "web_development"
    | "data_science"
    | "automation"
    | "general_purpose";
}
```

## 📡 **API 통신**

### API 클라이언트

```typescript
// API 요청 예시
const apiClient = new HAPAAPIClient();

// 코드 생성
const response = await apiClient.generateCode({
  user_question: "리스트 정렬 함수",
  code_context: editor.document.getText(),
  language: "python",
  user_profile: userProfile,
});

// 스트리밍 응답
await apiClient.generateCodeStreaming("Flask 웹앱 만들기", currentCode, {
  onChunk: (chunk) => updateUI(chunk),
  onComplete: (code) => insertCode(code),
});
```

### 오프라인 지원

```typescript
// 오프라인 큐 시스템
class OfflineService {
  addToQueue(type: "completion" | "analysis" | "generation", payload: any) {
    // 네트워크 복구 시 자동 처리
  }

  getCachedResponse(requestPayload: any): any | null {
    // 캐시된 응답 반환
  }
}
```

## 🧪 **테스트**

```bash
# 단위 테스트
npm test

# 통합 테스트
npm run test:integration

# 커버리지 리포트
npm run test:coverage

# E2E 테스트 (VSCode 환경)
npm run test:e2e
```

---

# 🌐 React Web Application

## ✨ **주요 기능**

- 🏠 **랜딩 페이지**: HAPA 소개 및 기능 설명
- 🎮 **라이브 데모**: 브라우저에서 직접 AI 코딩 체험
- 📊 **사용자 대시보드**: 개인 통계 및 설정 관리
- 🎨 **반응형 디자인**: 모든 디바이스에서 최적화된 UI
- ♿ **접근성 지원**: WCAG 2.1 AA 준수
- 🌙 **다크 모드**: 시스템 설정 따라 자동 전환

## 🚀 **설치 및 실행**

### 개발 환경

```bash
# 1. 디렉토리 이동
cd Frontend/landing-page

# 2. 의존성 설치
npm install

# 3. 개발 서버 시작
npm start

# 4. 브라우저에서 확인
# http://localhost:3000
```

### 프로덕션 빌드

```bash
# 1. 빌드 생성
npm run build

# 2. 정적 파일 서빙
npm install -g serve
serve -s build

# 3. Docker 빌드
docker build -t hapa-frontend .
docker run -p 3000:80 hapa-frontend
```

## 🏗️ **아키텍처**

### 컴포넌트 구조

```
src/components/
├── 📁 layout/                  # 레이아웃 컴포넌트
│   ├── Header.tsx             # 네비게이션 헤더
│   ├── Footer.tsx             # 푸터
│   └── Layout.tsx             # 메인 레이아웃
├── 📁 pages/                  # 페이지 컴포넌트
│   ├── HomePage.tsx           # 메인 랜딩 페이지
│   ├── AboutPage.tsx          # 소개 페이지
│   └── GuidePage.tsx          # 사용법 가이드
├── 📁 ui/                     # UI 컴포넌트
│   ├── ThunderButton.tsx      # 커스텀 버튼
│   ├── ThunderCard.tsx        # 카드 컴포넌트
│   ├── ThunderDemo.tsx        # 데모 인터페이스
│   └── LazyImage.tsx          # 지연 로딩 이미지
└── ErrorBoundary.tsx          # 에러 경계
```

### 상태 관리

```typescript
// AppStore - Zustand 기반 전역 상태
interface AppState {
  theme: "light" | "dark" | "system";
  user: User | null;
  isLoading: boolean;
  error: string | null;

  setTheme: (theme: AppState["theme"]) => void;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const useAppStore = create<AppState>((set) => ({
  theme: "system",
  user: null,
  isLoading: false,
  error: null,

  setTheme: (theme) => set({ theme }),
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));
```

### 커스텀 훅

```typescript
// 성능 최적화 훅
export const useDebounce = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
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
};

// 접근성 훅
export const useAccessibility = () => {
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState("medium");

  // 접근성 설정 관리
};
```

## 🎨 **스타일링**

### Tailwind CSS 설정

```javascript
// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        thunder: {
          50: "#f0f9ff",
          500: "#0ea5e9",
          900: "#0c4a6e",
        },
      },
      animation: {
        fadeIn: "fadeIn 0.5s ease-in-out",
        slideUp: "slideUp 0.3s ease-out",
      },
    },
  },
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/typography")],
};
```

### 테마 시스템

```css
/* styles/thunderClient.css */
.theme-light {
  --color-primary: #0ea5e9;
  --color-background: #ffffff;
  --color-text: #1f2937;
}

.theme-dark {
  --color-primary: #38bdf8;
  --color-background: #111827;
  --color-text: #f9fafb;
}

.theme-high-contrast {
  --color-primary: #000000;
  --color-background: #ffffff;
  --color-text: #000000;
}
```

## 🧪 **테스트**

### 테스트 구조

```bash
# Jest + Testing Library
npm test

# 개별 컴포넌트 테스트
npm test HomePage.test.tsx

# 커버리지 리포트
npm test -- --coverage

# E2E 테스트 (Playwright)
npm run test:e2e
```

### 테스트 예시

```typescript
// HomePage.test.tsx
import { render, screen } from "@testing-library/react";
import { HomePage } from "../HomePage";

describe("HomePage", () => {
  test("renders hero section", () => {
    render(<HomePage />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("HAPA");
    expect(screen.getByText(/AI 코딩 어시스턴트/)).toBeInTheDocument();
  });

  test("demo button works", async () => {
    const user = userEvent.setup();
    render(<HomePage />);

    const demoButton = screen.getByRole("button", { name: /데모 시작/ });
    await user.click(demoButton);

    expect(screen.getByTestId("demo-interface")).toBeVisible();
  });
});
```

## 🚀 **배포**

### Vercel 배포

```bash
# 1. Vercel CLI 설치
npm install -g vercel

# 2. 프로젝트 배포
vercel

# 3. 환경 변수 설정
vercel env add REACT_APP_API_URL
```

### Docker 배포

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### GitHub Pages 배포

```bash
# 1. gh-pages 설치
npm install --save-dev gh-pages

# 2. package.json에 스크립트 추가
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d build"
}

# 3. 배포 실행
npm run deploy
```

---

# 🔧 공통 개발 도구

## 📦 **의존성 관리**

### VSCode Extension

```json
{
  "dependencies": {
    "axios": "^1.6.2",
    "vscode": "^1.85.0"
  },
  "devDependencies": {
    "@types/node": "^20.x",
    "@types/vscode": "^1.85.0",
    "typescript": "^5.3.0",
    "eslint": "^8.56.0"
  }
}
```

### React Web App

```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "zustand": "^4.4.7",
    "tailwindcss": "^3.4.0"
  },
  "devDependencies": {
    "@testing-library/react": "^14.1.2",
    "@testing-library/jest-dom": "^6.1.5",
    "playwright": "^1.40.0"
  }
}
```

## 🔍 **코드 품질**

### ESLint 설정

```javascript
// eslint.config.mjs
export default [
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/exhaustive-deps": "error",
    },
  },
];
```

### Prettier 설정

```json
{
  "semi": false,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 80
}
```

## 🐛 **트러블슈팅**

### VSCode Extension

```bash
# 1. 개발 호스트에서 콘솔 확인
# Ctrl+Shift+P > "Developer: Reload Window"

# 2. 확장 로그 확인
# Help > Toggle Developer Tools > Console

# 3. 패키징 오류
vsce package --debug
```

### React App

```bash
# 1. 빌드 오류 해결
rm -rf node_modules package-lock.json
npm install

# 2. 타입 오류 확인
npm run type-check

# 3. 메모리 부족 오류
export NODE_OPTIONS="--max_old_space_size=4096"
npm run build
```

## 📚 **추가 리소스**

### VSCode Extension

- [VSCode Extension API](https://code.visualstudio.com/api)
- [Webview API Guide](https://code.visualstudio.com/api/extension-guides/webview)
- [Extension Marketplace](https://marketplace.visualstudio.com/)

### React

- [React 19 Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

---

## 🤝 **기여하기**

1. **포크** 후 feature 브랜치 생성
2. **개발 가이드라인** 준수
3. **테스트 작성** 및 통과 확인
4. **Pull Request** 생성

### 커밋 컨벤션

```
feat(extension): 새로운 자동완성 기능 추가
fix(web): 다크모드 토글 버그 수정
docs(readme): 설치 가이드 업데이트
style(css): 버튼 스타일 개선
test(unit): HomePage 컴포넌트 테스트 추가
```

---

**개발팀**: 한컴AI Frontend Team  
**버전**: v0.4.0  
**문의**: frontend-dev@hancom.com
