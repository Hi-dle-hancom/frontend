# HAPA Frontend 🎨

**HAPA Frontend**는 사용자가 AI 코딩 어시스턴트와 상호작용할 수 있는 두 가지 인터페이스를 제공합니다: **VSCode 확장 프로그램**과 **React 웹 인터페이스**. 개발자들이 선호하는 환경에서 원활하게 HAPA 서비스를 이용할 수 있도록 설계되었습니다.

## 📋 목차

- [프로젝트 구조](#-프로젝트-구조)
- [VSCode 확장 프로그램](#-vscode-확장-프로그램)
- [React 웹 인터페이스](#-react-웹-인터페이스)
- [빠른 시작](#-빠른-시작)
- [개발 환경 설정](#-개발-환경-설정)
- [배포](#-배포)
- [기술 스택](#-기술-스택)
- [문제 해결](#-문제-해결)

## 📂 프로젝트 구조

```
Frontend/
├── vscode-extension/           # VSCode 확장 프로그램
│   ├── src/                   # TypeScript 소스 코드
│   │   ├── extension.ts       # 메인 확장 진입점
│   │   ├── core/             # 핵심 매니저 클래스
│   │   ├── modules/          # 기능별 모듈
│   │   │   ├── apiClient.ts  # Backend API 통신
│   │   │   ├── inserter.ts   # 코드 삽입 기능
│   │   │   ├── promptExtractor.ts # 프롬프트 추출
│   │   │   └── triggerDetector.ts # 트리거 감지
│   │   ├── providers/        # VSCode Webview 프로바이더
│   │   │   ├── BaseWebviewProvider.ts
│   │   │   ├── CompletionProvider.ts
│   │   │   ├── GuideProvider.ts
│   │   │   ├── OnboardingProvider.ts
│   │   │   ├── SettingsProvider.ts
│   │   │   └── SidebarProvider.ts
│   │   ├── services/         # 서비스 레이어
│   │   │   ├── ConfigService.ts
│   │   │   └── ErrorService.ts
│   │   ├── styles/          # CSS 스타일
│   │   ├── templates/       # HTML 템플릿 생성기
│   │   ├── test/           # 테스트 파일
│   │   └── types/          # TypeScript 타입 정의
│   ├── media/              # 확장 아이콘 및 리소스
│   ├── package.json        # 확장 매니페스트
│   ├── tsconfig.json       # TypeScript 설정
│   └── webpack.config.js   # 빌드 설정
├── landing-page/           # React 웹 인터페이스
│   ├── src/               # React 소스 코드
│   │   ├── components/    # React 컴포넌트
│   │   │   ├── layout/   # 레이아웃 컴포넌트
│   │   │   ├── pages/    # 페이지 컴포넌트
│   │   │   └── ui/       # UI 컴포넌트
│   │   ├── contexts/     # React Context
│   │   ├── styles/       # 스타일 파일
│   │   └── utils/        # 유틸리티 함수
│   ├── public/           # 정적 파일
│   ├── package.json      # React 앱 설정
│   ├── tailwind.config.js # Tailwind CSS 설정
│   └── postcss.config.js # PostCSS 설정
├── docs/                 # 프론트엔드 문서
│   ├── extension_development_survey.md
│   ├── web_interface_tech_stack.md
│   └── README.md         # 이 파일
├── IMMEDIATE_FIXES_SUMMARY.md
└── README_REFACTORING.md
```

## 🔌 VSCode 확장 프로그램

### 🎯 주요 기능

#### **🤖 AI 어시스턴트 통합**

- **사이드바 대시보드**: Activity Bar에 HAPA 아이콘으로 접근
- **실시간 AI 대화**: 자연어로 코딩 질문 및 코드 생성 요청
- **스트리밍 응답**: 토큰 단위 실시간 코드 생성 경험

#### **⚡ 스마트 코드 자동완성**

- **인라인 자동완성**: 타이핑 중 실시간 코드 제안
- **컨텍스트 인식**: 현재 파일과 프로젝트 맥락 이해
- **다중 제안**: 여러 완성 옵션 제공

#### **🔍 코드 분석 및 도구**

- **컨텍스트 메뉴 통합**: 우클릭으로 AI 기능 접근
- **선택 영역 분석**: 코드 설명, 개선점 제안, 테스트 생성
- **주석 트리거**: `# TODO: 함수 만들기` 형태로 코드 생성

#### **⚙️ 개인화 설정**

- **온보딩 플로우**: 처음 사용자 설정 가이드
- **스킬 레벨 설정**: 초급자 → 전문가 맞춤 응답
- **프로젝트 컨텍스트**: 웹 개발, 데이터 사이언스 등 분야별 최적화

#### **📊 사용자 경험**

- **히스토리 관리**: 이전 AI 대화 내역 저장
- **설정 백업**: 클라우드 동기화 지원
- **성능 최적화**: 빠른 응답 시간과 낮은 리소스 사용

### 🛠️ 설치 및 개발

#### **개발 환경 설정**

```bash
# 프로젝트 클론
git clone https://github.com/hancom/hapa-frontend.git
cd Frontend/vscode-extension

# 의존성 설치
npm install

# TypeScript 컴파일
npm run compile

# 실시간 컴파일 (개발용)
npm run watch
```

#### **VSCode에서 디버깅**

```bash
# VSCode로 확장 디렉토리 열기
code .

# F5 키를 눌러 확장 프로그램 테스트 실행
# 새로운 VSCode 창에서 확장 기능 테스트 가능
```

#### **확장 패키징**

```bash
# VSIX 파일 생성
npm run package

# 결과: hapa-0.4.0.vsix 파일 생성
```

### 🔧 주요 모듈 상세

#### **apiClient.ts** - Backend API 통신

```typescript
// 코드 생성 요청
const response = await apiClient.generateCode({
  userQuestion: "피보나치 함수 만들어줘",
  codeContext: currentFileContent,
  filePath: activeDocument.fileName,
});

// 자동완성 요청
const completions = await apiClient.getCompletions({
  prefix: currentLineText,
  cursorPosition: cursor.character,
});
```

#### **triggerDetector.ts** - 주석 트리거 감지

```typescript
// 주석에서 트리거 감지 예시
// "# TODO: 이메일 유효성 검사 함수"
// "# GENERATE: 데이터베이스 연결 클래스"
// "# AI: 파일 업로드 기능"
```

#### **inserter.ts** - 생성된 코드 삽입

```typescript
// 코드 삽입 옵션
- 즉시 삽입 (immediate_insert)
- 사이드바 표시 (sidebar)
- 확인 후 삽입 (confirm_insert)
- 인라인 미리보기 (inline_preview)
```

### ⚙️ 확장 설정

#### **사용자 설정 (settings.json)**

```json
{
  "hapa.apiBaseURL": "http://localhost:8000/api/v1",
  "hapa.apiKey": "hapa_demo_20241228_secure_key_for_testing",
  "hapa.autoComplete": true,
  "hapa.maxSuggestions": 5,
  "hapa.userProfile.pythonSkillLevel": "intermediate",
  "hapa.userProfile.projectContext": "web_development",
  "hapa.commentTrigger.resultDisplayMode": "sidebar",
  "hapa.commentTrigger.showNotification": true
}
```

#### **개인화 프로필 옵션**

- **pythonSkillLevel**: `beginner` | `intermediate` | `advanced` | `expert`
- **projectContext**: `web_development` | `data_science` | `automation` | `general_purpose`
- **codeOutputStructure**: `minimal` | `standard` | `detailed` | `comprehensive`
- **explanationStyle**: `brief` | `standard` | `detailed` | `educational`

## 🌐 React 웹 인터페이스

### 🎯 주요 기능

#### **🏠 랜딩 페이지**

- **제품 소개**: HAPA의 핵심 기능 및 가치 제안
- **라이브 데모**: 실제 확장 프로그램 기능 미리보기
- **다운로드 링크**: VSCode 확장 다운로드 및 설치 가이드

#### **📱 반응형 디자인**

- **모바일 최적화**: 스마트폰, 태블릿 완벽 지원
- **VSCode 테마**: 확장 프로그램과 동일한 디자인 언어
- **다크/라이트 모드**: 사용자 환경설정 연동

#### **🎮 인터랙티브 요소**

- **코드 에디터 시뮬레이션**: Monaco Editor 기반 라이브 데모
- **애니메이션 효과**: 부드러운 UI/UX 전환
- **성능 최적화**: 빠른 로딩과 부드러운 스크롤

### 🛠️ 설치 및 개발

#### **개발 환경 설정**

```bash
# 웹앱 디렉토리로 이동
cd Frontend/landing-page

# 의존성 설치
npm install

# 개발 서버 시작
npm start
```

**✅ 성공!** 개발 서버가 시작되면:

- **웹 인터페이스**: http://localhost:3000
- **자동 새로고침**: 코드 변경시 실시간 반영

#### **프로덕션 빌드**

```bash
# 프로덕션 빌드 생성
npm run build

# 빌드 결과: build/ 디렉토리
# 웹 서버에 배포 가능한 정적 파일들
```

### 🎨 디자인 시스템

#### **색상 팔레트**

```css
:root {
  /* Primary Colors */
  --vscode-blue: #007acc;
  --vscode-dark-blue: #0e639c;

  /* Background Colors */
  --bg-dark: #1e1e1e;
  --bg-sidebar: #252526;
  --bg-editor: #1e1e1e;

  /* Text Colors */
  --text-primary: #cccccc;
  --text-secondary: #9cdcfe;
  --text-muted: #6a9955;
}
```

#### **타이포그래피**

- **Primary Font**: 'Segoe UI', system-ui, sans-serif
- **Code Font**: 'Cascadia Code', 'Fira Code', monospace
- **크기 시스템**: rem 기반 (1rem = 16px)

#### **간격 시스템**

```css
/* Tailwind CSS 기반 */
.spacing-xs {
  margin: 0.25rem;
} /* 4px */
.spacing-sm {
  margin: 0.5rem;
} /* 8px */
.spacing-md {
  margin: 1rem;
} /* 16px */
.spacing-lg {
  margin: 1.5rem;
} /* 24px */
.spacing-xl {
  margin: 2rem;
} /* 32px */
```

## 🚀 빠른 시작

### 1. 전체 프로젝트 클론

```bash
git clone https://github.com/hancom/hapa-frontend.git
cd Frontend
```

### 2. VSCode 확장 개발

```bash
# VSCode 확장 디렉토리로 이동
cd vscode-extension

# 의존성 설치
npm install

# 개발 빌드
npm run compile

# VSCode에서 F5로 디버깅 시작
code .
```

### 3. React 웹앱 개발

```bash
# 웹앱 디렉토리로 이동 (새 터미널)
cd landing-page

# 의존성 설치
npm install

# 개발 서버 시작
npm start
```

### 4. Backend 서버 연결

```bash
# Backend 서버가 실행 중이어야 함
# http://localhost:8000

# 확장에서 API 연결 테스트
curl -H "X-API-Key: hapa_demo_20241228_secure_key_for_testing" \
     http://localhost:8000/health
```

## 🔧 개발 환경 설정

### 시스템 요구사항

#### **최소 요구사항**

- **Node.js**: 18.0 이상
- **npm**: 9.0 이상
- **VSCode**: 1.80.0 이상
- **RAM**: 최소 4GB (권장 8GB)

#### **권장 요구사항**

- **OS**: Windows 10+, macOS 12+, Ubuntu 20.04+
- **Node.js**: 20.x LTS
- **VSCode Extensions**: TypeScript, ESLint, Prettier

### 개발 도구 설정

#### **VSCode 설정 (workspace)**

```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.suggest.autoImports": true,
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.exclude": {
    "**/node_modules": true,
    "**/out": true,
    "**/.vscode-test": true
  }
}
```

#### **환경 변수 설정**

```bash
# VSCode 확장 개발용
export VSCODE_EXTENSION_DEV=true
export HAPA_API_URL=http://localhost:8000/api/v1
export HAPA_API_KEY=hapa_demo_20241228_secure_key_for_testing

# React 웹앱 개발용 (.env 파일)
REACT_APP_API_URL=http://localhost:8000/api/v1
REACT_APP_VERSION=0.4.0
REACT_APP_ENVIRONMENT=development
```

### 코드 품질 도구

#### **ESLint 설정 (vscode-extension)**

```json
{
  "extends": ["@typescript-eslint/recommended", "prettier"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "no-console": "warn"
  }
}
```

#### **Prettier 설정**

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": false,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

## 🧪 테스트

### VSCode 확장 테스트

```bash
cd vscode-extension

# 단위 테스트 실행
npm test

# 통합 테스트 실행
npm run test:integration

# 테스트 커버리지
npm run test:coverage
```

### React 웹앱 테스트

```bash
cd landing-page

# 단위 테스트
npm test

# 스냅샷 테스트 업데이트
npm test -- --updateSnapshot

# E2E 테스트 (Cypress)
npm run cypress:open
```

### 테스트 시나리오

#### **VSCode 확장 기능 테스트**

1. **확장 활성화**: VSCode 시작시 정상 로드
2. **API 연결**: Backend 서버와 통신 확인
3. **코드 생성**: AI 코드 생성 기능 동작
4. **자동완성**: 인라인 자동완성 제안
5. **UI 인터랙션**: 사이드바, 설정 패널 동작

#### **웹앱 기능 테스트**

1. **페이지 로딩**: 모든 페이지 정상 렌더링
2. **반응형 디자인**: 다양한 화면 크기 지원
3. **라이브 데모**: 코드 에디터 시뮬레이션
4. **네비게이션**: 페이지 간 이동 기능
5. **성능**: 로딩 시간 및 런타임 성능

## 🐳 배포

### VSCode 확장 배포

#### **VSCode Marketplace 게시**

```bash
# vsce 도구 설치
npm install -g vsce

# 확장 패키징
cd vscode-extension
vsce package

# Marketplace에 게시
vsce publish
```

#### **수동 설치용 VSIX 파일**

```bash
# VSIX 파일 생성
vsce package

# 생성된 파일: hapa-0.4.0.vsix
# VSCode에서 "Install from VSIX" 로 설치 가능
```

### React 웹앱 배포

#### **정적 파일 배포**

```bash
cd landing-page

# 프로덕션 빌드
npm run build

# 결과: build/ 디렉토리
# 웹 서버(Nginx, Apache, Vercel 등)에 배포
```

#### **Docker 배포**

```bash
# Dockerfile 예시
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### **Vercel 배포 (추천)**

```bash
# Vercel CLI 설치
npm install -g vercel

# 배포
cd landing-page
vercel --prod

# 결과: https://hapa-landing.vercel.app
```

## 🛠️ 기술 스택

### VSCode 확장

| 기술                     | 버전  | 목적                      |
| ------------------------ | ----- | ------------------------- |
| **TypeScript**           | 4.9+  | 타입 안전성과 개발자 경험 |
| **VSCode Extension API** | 1.80+ | 확장 프로그램 기능        |
| **Webpack**              | 5.0+  | 번들링 및 최적화          |
| **ESLint**               | 8.0+  | 코드 품질 관리            |
| **Prettier**             | 2.0+  | 코드 포맷팅               |
| **Mocha**                | 10.0+ | 테스트 프레임워크         |

### React 웹앱

| 기술                 | 버전  | 목적                     |
| -------------------- | ----- | ------------------------ |
| **React**            | 19.1+ | UI 라이브러리            |
| **TypeScript**       | 4.9+  | 타입 안전성              |
| **Tailwind CSS**     | 3.3+  | 유틸리티 기반 스타일링   |
| **React Router**     | 7.6+  | 클라이언트 사이드 라우팅 |
| **Create React App** | 5.0+  | 개발 환경 설정           |
| **Jest**             | 29.0+ | 테스트 프레임워크        |
| **Testing Library**  | 16.3+ | React 컴포넌트 테스트    |

### 공통 도구

| 도구                   | 용도             |
| ---------------------- | ---------------- |
| **Git**                | 버전 관리        |
| **GitHub Actions**     | CI/CD 파이프라인 |
| **Docker**             | 컨테이너화       |
| **Vercel**             | 웹앱 배포        |
| **VSCode Marketplace** | 확장 배포        |

## 🐛 문제 해결

### 자주 발생하는 문제

#### **1. VSCode 확장 활성화 실패**

```bash
# 확장 로그 확인
개발자 도구 > 콘솔 탭에서 에러 메시지 확인

# 의존성 재설치
cd vscode-extension
rm -rf node_modules package-lock.json
npm install
npm run compile
```

#### **2. Backend API 연결 오류**

```bash
# Backend 서버 상태 확인
curl http://localhost:8000/health

# API Key 확인
curl -H "X-API-Key: hapa_demo_20241228_secure_key_for_testing" \
     http://localhost:8000/api/v1/code/generate

# 확장 설정에서 API URL 확인
```

#### **3. React 웹앱 빌드 실패**

```bash
# Node.js 버전 확인
node --version  # 18+ 필요

# 캐시 클리어
cd landing-page
rm -rf node_modules package-lock.json
npm install

# TypeScript 에러 확인
npm run type-check
```

#### **4. 확장 패키징 오류**

```bash
# vsce 도구 업데이트
npm install -g vsce@latest

# package.json 검증
vsce ls

# 패키징 재시도
vsce package --verbose
```

#### **5. 웹앱 성능 이슈**

```bash
# 번들 크기 분석
npm run build
npm install -g serve
serve -s build

# Lighthouse 성능 측정
# Chrome DevTools > Lighthouse 탭 사용
```

### 디버깅 팁

#### **1. VSCode 확장 디버깅**

```typescript
// 개발자 콘솔에 로그 출력
console.log("[HAPA] Extension activated");

// VSCode 출력 채널 사용
const outputChannel = vscode.window.createOutputChannel("HAPA");
outputChannel.appendLine("Debug message");
outputChannel.show();
```

#### **2. React 컴포넌트 디버깅**

```typescript
// React DevTools 사용
// Chrome 확장: React Developer Tools

// 컨솔 로그
console.log("[HAPA] Component rendered:", props);

// 성능 프로파일링
import { Profiler } from "react";

function onRenderCallback(id: string, phase: string, actualDuration: number) {
  console.log(`[HAPA] ${id} ${phase} took ${actualDuration}ms`);
}
```

#### **3. 네트워크 요청 디버깅**

```typescript
// API 호출 로깅
const response = await fetch(url, {
  method: "POST",
  headers: { "X-API-Key": apiKey },
  body: JSON.stringify(data),
});

console.log("API Response:", response.status, await response.json());
```

### 지원 및 문의

- **GitHub Issues**: 버그 리포트 및 기능 요청
- **Discord**: 실시간 커뮤니티 지원 (준비중)
- **문서**: `/docs` 디렉토리의 상세 가이드
- **VSCode Marketplace**: 확장 리뷰 및 평점

---

## 📚 관련 문서

- **[확장 개발 가이드](docs/extension_development_survey.md)**: VSCode 확장 개발 상세
- **[웹 인터페이스 기술 스택](docs/web_interface_tech_stack.md)**: React 앱 기술 문서
- **[리팩토링 가이드](README_REFACTORING.md)**: 코드 개선 방향
- **[즉시 수정 사항](IMMEDIATE_FIXES_SUMMARY.md)**: 알려진 이슈 및 해결책

---

**버전**: v0.4.0  
**상태**: 프로덕션 준비 완료  
**VSCode 확장**: Marketplace 게시 준비  
**웹 인터페이스**: Vercel 배포 준비  
**최종 업데이트**: 2024년 12월 28일
