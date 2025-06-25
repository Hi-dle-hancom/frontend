# 🎨 HAPA Frontend

[![React](https://img.shields.io/badge/React-19.0+-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue.svg)](https://www.typescriptlang.org/)
[![VSCode](https://img.shields.io/badge/VSCode-Extension-green.svg)](https://code.visualstudio.com/)

> **HAPA의 사용자 인터페이스 생태계**  
> VSCode 확장 프로그램과 React 웹 애플리케이션으로 구성된 다중 플랫폼 프론트엔드

## 🎯 **Frontend 개요**

HAPA Frontend는 **두 가지 독립적인 인터페이스**로 구성되어 AI 코딩 어시스턴트 서비스를 제공합니다:

1. **VSCode Extension** - 개발자의 주요 작업 환경
2. **React Landing Page** - 웹 기반 서비스 소개 및 가이드

### ✨ **주요 특징**

- 🔌 **VSCode 통합**: 개발 워크플로우에 직접 통합
- 🌐 **웹 인터페이스**: 브라우저 기반 서비스 접근
- 🎯 **타입 안전성**: TypeScript 기반 안정적 개발
- 📱 **반응형 디자인**: 다양한 화면 크기 지원
- ⚡ **실시간 스트리밍**: AI 응답 실시간 표시
- 🎨 **모던 UI/UX**: 최신 디자인 패턴 적용

## 🏗️ **아키텍처**

```
Frontend/
├── 📁 vscode-extension/         # VSCode 확장 프로그램
│   ├── 📁 src/
│   │   ├── extension.ts         # 확장 진입점
│   │   ├── 📁 providers/        # 웹뷰 및 기능 제공자
│   │   ├── 📁 services/         # 외부 서비스 연동
│   │   ├── 📁 modules/          # 핵심 기능 모듈
│   │   └── 📁 templates/        # HTML 템플릿
│   ├── package.json             # 확장 매니페스트
│   └── README.md               # 확장 문서
│
└── 📁 landing-page/            # React 웹 애플리케이션
    ├── 📁 src/
    │   ├── App.tsx             # 메인 컴포넌트
    │   ├── 📁 components/      # UI 컴포넌트
    │   ├── 📁 pages/           # 페이지 컴포넌트
    │   ├── 📁 hooks/           # 커스텀 훅
    │   └── 📁 contexts/        # 상태 관리
    ├── package.json            # 의존성 및 스크립트
    └── README.md              # 웹앱 문서
```

## 🚀 **빠른 시작**

### 전제 조건

- **Node.js 18+**
- **npm 9+ 또는 yarn 1.22+**
- **VSCode 1.85+** (VSCode 확장용)
- **Git**

### 1. VSCode Extension 개발

```bash
# 1. 프로젝트 클론
cd Frontend/vscode-extension

# 2. 의존성 설치
npm install

# 3. 확장 빌드
npm run compile

# 4. VSCode에서 테스트
# F5 키를 눌러 Extension Development Host 실행
```

### 2. React Landing Page 개발

```bash
# 1. 프로젝트 디렉토리 이동
cd Frontend/landing-page

# 2. 의존성 설치
npm install

# 3. 개발 서버 시작
npm start

# 4. 브라우저에서 확인
# http://localhost:3000 자동 열림
```

### 3. 전체 Frontend 빌드

```bash
# 프로젝트 루트에서
npm run build:frontend

# 또는 개별 빌드
cd Frontend/vscode-extension && npm run package
cd Frontend/landing-page && npm run build
```

## 🔌 **VSCode Extension**

### 주요 기능

#### 🤖 **AI 코딩 어시스턴트**

- 자연어 질문을 Python 코드로 변환
- 컨텍스트 기반 코드 자동완성
- 실시간 스트리밍 응답

#### 📝 **스마트 코드 삽입**

- 커서 위치에 코드 자동 삽입
- 다양한 삽입 모드 (즉시/확인/사이드바)
- 코드 포맷팅 자동 적용

#### ⚙️ **개인화 설정**

- 27개 온보딩 옵션으로 맞춤 설정
- 실시간 설정 동기화
- 사용자별 AI 모델 튜닝

### 확장 명령어

| 명령어                | 설명               | 단축키         |
| --------------------- | ------------------ | -------------- |
| `hapa.askQuestion`    | AI에게 질문하기    | `Ctrl+Shift+H` |
| `hapa.openSidebar`    | HAPA 사이드바 열기 | `Ctrl+Shift+P` |
| `hapa.openSettings`   | 설정 패널 열기     | -              |
| `hapa.showOnboarding` | 온보딩 가이드 보기 | -              |

### 설정 옵션

```json
{
  "hapa.apiUrl": "http://localhost:8000",
  "hapa.autoInsert": true,
  "hapa.insertMode": "cursor",
  "hapa.enableStreaming": true,
  "hapa.maxTokens": 1500,
  "hapa.temperature": 0.3
}
```

### 확장 개발 가이드

#### **개발 환경 설정**

```bash
# 의존성 설치
npm install

# TypeScript 컴파일 (watch 모드)
npm run watch

# 테스트 실행
npm test

# 확장 패키징
npm run package
```

#### **확장 구조**

```typescript
// src/extension.ts - 확장 진입점
export function activate(context: vscode.ExtensionContext) {
  // 확장 활성화 로직
  const sidebarProvider = new SidebarProvider(context.extensionUri);
  const completionProvider = new CompletionProvider();

  // 명령어 등록
  context.subscriptions.push(
    vscode.commands.registerCommand("hapa.askQuestion", askQuestion),
    vscode.window.registerWebviewViewProvider("hapa-sidebar", sidebarProvider)
  );
}
```

#### **웹뷰 Provider**

```typescript
// src/providers/SidebarProvider.ts
export class SidebarProvider implements vscode.WebviewViewProvider {
  resolveWebviewView(webviewView: vscode.WebviewView) {
    webviewView.webview.html = this.getHtmlForWebview();

    // 메시지 핸들링
    webviewView.webview.onDidReceiveMessage((data) => {
      switch (data.type) {
        case "askQuestion":
          this.handleQuestion(data.question);
          break;
      }
    });
  }
}
```

## 🌐 **React Landing Page**

### 주요 페이지

#### 🏠 **Home Page** (`/`)

- HAPA 서비스 소개
- 주요 기능 하이라이트
- 시작하기 CTA

#### 📚 **Guide Page** (`/guide`)

- 설치 가이드
- 사용법 튜토리얼
- FAQ 및 문제해결

#### ℹ️ **About Page** (`/about`)

- 서비스 상세 정보
- 기술 스택 소개
- 팀 정보

### 기술 스택

- **React 19**: 최신 React 기능 활용
- **TypeScript**: 타입 안전성 보장
- **Tailwind CSS**: 유틸리티 우선 스타일링
- **Zustand**: 경량 상태 관리
- **React Router**: 클라이언트 라우팅

### 컴포넌트 구조

```typescript
// src/App.tsx - 메인 애플리케이션
function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/guide" element={<GuidePage />} />
            <Route path="/about" element={<AboutPage />} />
          </Routes>
        </Layout>
      </Router>
    </ErrorBoundary>
  );
}
```

#### **주요 컴포넌트**

```typescript
// 레이아웃 컴포넌트
export const Layout = ({ children }: LayoutProps) => (
  <div className="min-h-screen bg-gray-50">
    <Header />
    <main>{children}</main>
    <Footer />
  </div>
);

// Thunder 데모 컴포넌트
export const ThunderDemo = () => {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const generateCode = async (question: string) => {
    setIsLoading(true);
    // AI 코드 생성 로직
  };

  return (
    <div className="demo-container">
      <input onSubmit={generateCode} />
      {isLoading ? <Spinner /> : <CodeDisplay code={code} />}
    </div>
  );
};
```

### 반응형 디자인

```css
/* Tailwind CSS 유틸리티 */
.responsive-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6;
}

.mobile-first {
  @apply text-sm md:text-base lg:text-lg;
  @apply p-4 md:p-6 lg:p-8;
}
```

### 성능 최적화

#### **코드 분할**

```typescript
// 지연 로딩
const GuidePage = lazy(() => import("./pages/GuidePage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));

// 라우터에서 Suspense 사용
<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/guide" element={<GuidePage />} />
  </Routes>
</Suspense>;
```

#### **이미지 최적화**

```typescript
// LazyImage 컴포넌트
export const LazyImage = ({ src, alt, ...props }: ImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);

  return (
    <div ref={ref} className="relative">
      {isInView && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          className={`transition-opacity ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
          {...props}
        />
      )}
    </div>
  );
};
```

## 🔄 **Backend 연동**

### API 클라이언트

```typescript
// VSCode Extension - API 클라이언트
export class ApiClient {
  private baseUrl = "http://localhost:8000";

  async generateCode(
    request: CodeGenerationRequest
  ): Promise<CodeGenerationResponse> {
    const response = await fetch(`${this.baseUrl}/api/v1/generate-code`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": this.apiKey,
      },
      body: JSON.stringify(request),
    });

    return response.json();
  }

  // 스트리밍 응답 처리
  async *streamCode(request: CodeGenerationRequest) {
    const response = await fetch(
      `${this.baseUrl}/api/v1/generate-code/stream`,
      {
        method: "POST",
        headers: {
          /* ... */
        },
        body: JSON.stringify(request),
      }
    );

    const reader = response.body?.getReader();
    if (!reader) return;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = new TextDecoder().decode(value);
      yield JSON.parse(chunk);
    }
  }
}
```

### 인증 관리

```typescript
// 사용자 인증 상태 관리
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const login = async (email: string, password: string) => {
    const response = await fetch("http://localhost:8001/login", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `username=${email}&password=${password}`,
    });

    const data = await response.json();
    setToken(data.access_token);
    setUser(data.user);
  };

  return { user, token, login };
};
```

## 🧪 **테스트**

### VSCode Extension 테스트

```bash
# 단위 테스트
npm test

# 통합 테스트 (VSCode Test Runner)
npm run test:integration

# 확장 로드 테스트
npm run test:extension
```

### React App 테스트

```bash
# Jest 테스트 실행
npm test

# 커버리지 포함
npm test -- --coverage

# E2E 테스트 (Playwright)
npm run test:e2e
```

### 테스트 예시

```typescript
// VSCode Extension 테스트
describe("HAPA Extension", () => {
  test("should activate extension", async () => {
    const extension = vscode.extensions.getExtension("hancom.hapa");
    expect(extension).toBeDefined();

    await extension?.activate();
    expect(extension?.isActive).toBe(true);
  });

  test("should register commands", async () => {
    const commands = await vscode.commands.getCommands();
    expect(commands).toContain("hapa.askQuestion");
  });
});

// React 컴포넌트 테스트
describe("ThunderDemo Component", () => {
  test("renders code generation interface", () => {
    render(<ThunderDemo />);
    expect(
      screen.getByPlaceholderText("질문을 입력하세요")
    ).toBeInTheDocument();
  });

  test("generates code on submit", async () => {
    render(<ThunderDemo />);
    const input = screen.getByRole("textbox");
    const button = screen.getByRole("button", { name: /생성/i });

    fireEvent.change(input, { target: { value: "리스트 정렬하기" } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/def sort_list/)).toBeInTheDocument();
    });
  });
});
```

## 🚀 **빌드 및 배포**

### VSCode Extension 빌드

```bash
# 개발 빌드
npm run compile

# 프로덕션 빌드 (.vsix 패키지)
npm run package

# Marketplace 게시
npx vsce publish
```

### React App 빌드

```bash
# 프로덕션 빌드
npm run build

# 빌드 결과물 미리보기
npm run preview

# Docker 이미지 빌드
docker build -t hapa-landing-page .
```

### Docker 배포

```dockerfile
# Frontend/landing-page/Dockerfile
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

### CI/CD Pipeline

```yaml
# .github/workflows/frontend.yml
name: Frontend CI/CD

on:
  push:
    branches: [main, develop]
    paths: ["Frontend/**"]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: "npm"

      - name: Install dependencies
        run: npm ci
        working-directory: Frontend/landing-page

      - name: Run tests
        run: npm test -- --coverage
        working-directory: Frontend/landing-page

      - name: Build application
        run: npm run build
        working-directory: Frontend/landing-page

  extension:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18

      - name: Install dependencies
        run: npm ci
        working-directory: Frontend/vscode-extension

      - name: Compile extension
        run: npm run compile
        working-directory: Frontend/vscode-extension

      - name: Package extension
        run: npm run package
        working-directory: Frontend/vscode-extension
```

## 📱 **사용자 가이드**

### VSCode Extension 사용법

#### **1. 설치**

1. VSCode Extensions 마켓플레이스에서 "HAPA" 검색
2. "Install" 클릭
3. VSCode 재시작

#### **2. 기본 사용**

1. `Ctrl+Shift+H`로 질문 창 열기
2. 자연어로 원하는 코드 설명
3. 생성된 코드 검토 후 삽입

#### **3. 고급 설정**

1. `Ctrl+Shift+P` → "HAPA: Open Settings"
2. 개인화 옵션 27개 설정
3. AI 모델 동작 방식 조정

### 웹 인터페이스 사용법

#### **1. 서비스 소개** (`http://localhost:3000`)

- HAPA 주요 기능 탐색
- 실시간 데모 체험
- 설치 가이드 확인

#### **2. 온라인 코드 생성**

- 브라우저에서 직접 코드 생성
- VSCode 없이도 HAPA 기능 사용
- 생성된 코드 복사 및 다운로드

## 🛠️ **개발 가이드**

### 개발 환경 설정

```bash
# 1. 저장소 클론
git clone https://github.com/hancom/hapa-frontend.git
cd Frontend

# 2. 의존성 설치 (모든 서브프로젝트)
npm run install:all

# 3. 개발 서버 시작
npm run dev:all

# 4. 테스트 실행
npm run test:all
```

### 코딩 규칙

#### **TypeScript 스타일**

```typescript
// 인터페이스 정의
interface CodeGenerationRequest {
  userQuestion: string;
  codeContext?: string;
  language: "python";
  userProfile: UserProfile;
}

// 함수형 컴포넌트
export const CodeEditor: React.FC<CodeEditorProps> = ({
  initialCode,
  onChange,
}) => {
  const [code, setCode] = useState(initialCode);

  const handleChange = useCallback(
    (newCode: string) => {
      setCode(newCode);
      onChange?.(newCode);
    },
    [onChange]
  );

  return (
    <textarea
      value={code}
      onChange={(e) => handleChange(e.target.value)}
      className="font-mono text-sm"
    />
  );
};
```

#### **CSS/Tailwind 규칙**

```css
/* 컴포넌트별 스타일 모듈화 */
.thunder-demo {
  @apply flex flex-col space-y-4 p-6 bg-white rounded-lg shadow-lg;
}

.code-output {
  @apply bg-gray-900 text-green-400 p-4 rounded font-mono text-sm overflow-x-auto;
}

/* 반응형 우선 설계 */
.responsive-button {
  @apply px-4 py-2 text-sm md:px-6 md:py-3 md:text-base;
  @apply bg-blue-500 hover:bg-blue-600 text-white rounded;
  @apply transition-colors duration-200;
}
```

### 기여 가이드

1. **Feature 브랜치** 생성: `git checkout -b feature/new-component`
2. **변경사항 구현** 및 테스트 작성
3. **Linting 통과**: `npm run lint:fix`
4. **테스트 통과**: `npm test`
5. **Pull Request** 생성

## 📊 **성능 메트릭**

### 웹앱 성능 목표

- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **Time to Interactive**: < 3.5s

### VSCode Extension 성능

- **확장 활성화 시간**: < 200ms
- **코드 생성 응답 시간**: < 3s
- **메모리 사용량**: < 50MB

## 📚 **추가 리소스**

### 문서

- **[VSCode Extension API](https://code.visualstudio.com/api)**: 확장 개발 가이드
- **[React 19 문서](https://react.dev/)**: React 최신 기능
- **[Tailwind CSS](https://tailwindcss.com/)**: 스타일링 가이드
- **[TypeScript 핸드북](https://www.typescriptlang.org/docs/)**: 타입 시스템

### 코드 예시

- **[Extension Development Samples](https://github.com/microsoft/vscode-extension-samples)**
- **[React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)**

## 🤝 **기여자**

- **Frontend Lead**: UI/UX 설계 및 구현
- **Extension Developer**: VSCode 확장 개발
- **Web Developer**: React 웹앱 개발
- **QA Engineer**: 테스트 및 품질 보증

## 📄 **라이선스**

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

---

**개발팀**: 하이들 (Hi-dle) Team  
**문의**: frontend@hapa.dev  
**문서 버전**: v1.0.0
