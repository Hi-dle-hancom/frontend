# HAPA VSCode Extension - 아키텍처 분석

## 📋 목차

1. [개요](#개요)
2. [전체 아키텍처](#전체-아키텍처)
3. [핵심 레이어](#핵심-레이어)
4. [주요 컴포넌트](#주요-컴포넌트)
5. [데이터 플로우](#데이터-플로우)
6. [설계 패턴](#설계-패턴)
7. [성능 최적화](#성능-최적화)
8. [확장성](#확장성)

## 🎯 개요

HAPA(Hancom AI Python Assistant)는 VSCode를 위한 고급 AI 코딩 어시스턴트 확장 프로그램입니다. 개인화된 온보딩부터 지능형 코드 생성까지, 사용자 중심의 Python 개발 경험을 제공합니다.

### 🚀 핵심 특징

- **개인화 온보딩**: 사용자 스킬 레벨과 선호도에 맞춘 맞춤형 설정
- **지능형 코드 생성**: 컨텍스트 인식 AI 기반 코드 생성
- **스트리밍 응답**: 실시간 코드 생성 및 표시
- **접근성 최적화**: WCAG 2.1 준수 접근성 기능
- **성능 최적화**: 메모리 관리 및 성능 모니터링
- **오프라인 지원**: 네트워크 상태에 따른 동적 대응

## 🏗️ 전체 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                        VSCode API                          │
├─────────────────────────────────────────────────────────────┤
│                  Extension Entry Point                     │
│                     extension.ts                           │
├─────────────────────────────────────────────────────────────┤
│                   Extension Manager                        │
│               ExtensionManager.ts (핵심)                    │
├─────────────────────────────────────────────────────────────┤
│  Providers Layer        │    Services Layer                │
│  ┌─────────────────┐   │    ┌─────────────────────────┐    │
│  │ SidebarProvider │   │    │ ConfigService           │    │
│  │ OnboardingProv. │   │    │ MemoryManager           │    │
│  │ SettingsProvider│   │    │ PerformanceOptimizer    │    │
│  │ GuideProvider   │   │    │ EnhancedErrorService    │    │
│  │ CompletionProv. │   │    │ TelemetryService        │    │
│  └─────────────────┘   │    │ AccessibilityService    │    │
├─────────────────────────┼────│ ResponsiveDesignService │    │
│    Modules Layer        │    │ OfflineService          │    │
│  ┌─────────────────┐   │    └─────────────────────────┘    │
│  │ apiClient       │   │                                   │
│  │ triggerDetector │   │                                   │
│  │ promptExtractor │   │                                   │
│  │ inserter        │   │                                   │
│  └─────────────────┘   │                                   │
├─────────────────────────┼───────────────────────────────────┤
│                  Template System                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ SidebarComponents │ SidebarStyles │ SidebarScripts  │   │
│  │                  SidebarHtmlGenerator              │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 🎭 핵심 레이어

### 1. **Entry Point Layer**

- **extension.ts** (51줄)
  - VSCode 확장 진입점
  - ExtensionManager 초기화 및 라이프사이클 관리
  - 간단하고 명확한 구조

### 2. **Management Layer**

- **ExtensionManager.ts** (핵심 클래스)
  - 모든 서비스와 프로바이더 초기화
  - 명령어 등록 및 라우팅
  - 생명주기 관리
  - 오류 처리 및 복구

### 3. **Providers Layer** (웹뷰 기반)

- **SidebarProvider**: 메인 AI 어시스턴트 인터페이스
  - 실시간 스트리밍 코드 생성
  - 질문/답변 히스토리 관리
  - 코드 삽입 및 편집기 통합
- **OnboardingProvider**: 사용자 온보딩

  - 6단계 개인화 설정
  - PostgreSQL 데이터베이스 연동
  - API 키 자동 발급
  - 설정 검증 및 저장

- **SettingsProvider**: 설정 관리

  - 실시간 설정 검증
  - 내보내기/가져오기 기능
  - 진단 및 문제 해결

- **GuideProvider**: 사용법 가이드

  - 인터랙티브 튜토리얼
  - 단계별 사용법 안내

- **CompletionProvider**: 코드 자동완성
  - VSCode IntelliSense 통합
  - 컨텍스트 인식 제안
  - 신뢰도 기반 필터링

### 4. **Services Layer** (싱글톤 패턴)

- **ConfigService**: 설정 관리

  - 중앙집중화된 설정 관리
  - 실시간 검증 및 변경 감지
  - 내보내기/가져오기 지원

- **MemoryManager**: 메모리 및 리소스 관리

  - 캐시 관리 (LRU 정책)
  - 타이머 및 이벤트 리스너 추적
  - 메모리 사용량 모니터링
  - 가비지 컬렉션 최적화

- **PerformanceOptimizer**: 성능 최적화

  - 고급 디바운싱/스로틀링
  - 배치 DOM 업데이트
  - 성능 메트릭 수집
  - 병목지점 분석

- **EnhancedErrorService**: 향상된 에러 처리

  - 구조화된 에러 로깅
  - 자동 복구 메커니즘
  - 사용자 친화적 오류 메시지

- **TelemetryService**: 사용 통계

  - 익명화된 사용 패턴 수집
  - 성능 지표 추적
  - 개인정보 보호 준수

- **AccessibilityService**: 접근성

  - WCAG 2.1 가이드라인 준수
  - 스크린 리더 지원
  - 키보드 네비게이션
  - 고대비 모드

- **ResponsiveDesignService**: 반응형 디자인

  - 동적 브레이크포인트 조정
  - 디바이스별 최적화
  - 레이아웃 자동 조정

- **OfflineService**: 오프라인 지원
  - 요청 큐잉
  - 로컬 캐싱
  - 자동 재연결

### 5. **Modules Layer**

- **apiClient.ts**: Backend API 통신

  - vLLM 서버 통합
  - 스트리밍 응답 처리
  - 자동 재시도 로직
  - 에러 복구

- **triggerDetector.ts**: 트리거 이벤트 감지

  - 주석 기반 트리거
  - 선택 영역 감지
  - 컨텍스트 메뉴 처리
  - 키보드 단축키

- **promptExtractor.ts**: 컨텍스트 추출

  - 지능형 코드 분석
  - 주석 의도 파악
  - 함수/클래스 컨텍스트 추출
  - 언어별 패턴 인식

- **inserter.ts**: 코드 삽입
  - 스마트 코드 삽입
  - 들여쓰기 자동 조정
  - 충돌 방지

### 6. **Template System** (분할 구조)

- **SidebarComponents.ts**: UI 컴포넌트

  - 재사용 가능한 UI 컴포넌트
  - 모듈화된 구조

- **SidebarStyles.ts**: CSS 스타일

  - VSCode 테마 통합
  - 반응형 디자인
  - 접근성 고려

- **SidebarScripts.ts**: JavaScript 로직

  - 클라이언트 사이드 로직
  - 이벤트 처리
  - 상태 관리

- **SidebarHtmlGenerator.ts**: 조합기 (40줄)
  - 분할된 컴포넌트 조합
  - 간단한 HTML 생성

## 📊 데이터 플로우

### 1. **사용자 온보딩 플로우**

```
사용자 입력 → OnboardingProvider → 데이터 검증 → API 키 발급 →
PostgreSQL 저장 → 로컬 설정 저장 → 완료 알림
```

### 2. **코드 생성 플로우**

```
사용자 질문 → SidebarProvider → promptExtractor → apiClient →
vLLM 서버 → 스트리밍 응답 → 실시간 UI 업데이트 → 코드 삽입
```

### 3. **자동완성 플로우**

```
타이핑 감지 → CompletionProvider → 컨텍스트 분석 → API 호출 →
제안 필터링 → VSCode IntelliSense 통합
```

## 🎨 설계 패턴

### 1. **Singleton Pattern**

모든 서비스 클래스에서 사용:

```typescript
export class ConfigService {
  private static instance: ConfigService;

  static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }
}
```

### 2. **Observer Pattern**

설정 변경 감지 및 이벤트 처리:

```typescript
export interface EventEmitter<T = unknown> {
  on(event: string, handler: EventHandler<T>): Unsubscribe;
  emit(event: string, data: T): void;
}
```

### 3. **Factory Pattern**

웹뷰 프로바이더 생성:

```typescript
export class BaseWebviewProvider {
  protected createWebviewPanel(): vscode.WebviewPanel {
    // 공통 웹뷰 생성 로직
  }
}
```

### 4. **Strategy Pattern**

다양한 응답 모드 처리:

```typescript
type ResponseMode =
  | "immediate_insert"
  | "sidebar"
  | "confirm_insert"
  | "inline_preview";
```

## ⚡ 성능 최적화

### 1. **메모리 최적화**

- LRU 캐시 정책
- 자동 가비지 컬렉션
- 메모리 사용량 모니터링
- 리소스 추적 및 정리

### 2. **네트워크 최적화**

- 요청 디바운싱
- 자동 재시도 로직
- 응답 캐싱
- 스트리밍 처리

### 3. **UI 최적화**

- 배치 DOM 업데이트
- 가상 스크롤링 (대용량 리스트)
- CSS 애니메이션 최적화
- 레이지 로딩

### 4. **성능 모니터링**

```typescript
recordPerformanceMetric<T>(
  functionName: string,
  func: () => T,
  context?: any
): T {
  const startTime = Date.now();
  const startMemory = process.memoryUsage().heapUsed;

  try {
    const result = func();
    const executionTime = Date.now() - startTime;
    const memoryUsage = process.memoryUsage().heapUsed - startMemory;

    this.updateMetrics(functionName, executionTime, memoryUsage);
    return result;
  } catch (error) {
    // 에러 처리
  }
}
```

## 🔧 확장성

### 1. **모듈화 아키텍처**

- 각 레이어가 독립적으로 확장 가능
- 플러그인 형태의 프로바이더 추가
- 서비스 의존성 주입

### 2. **설정 기반 확장**

- JSON 스키마 기반 설정 검증
- 동적 설정 로드
- 다국어 지원 준비

### 3. **API 확장성**

- RESTful API 설계
- 버전 관리
- 하위 호환성 보장

### 4. **테마 및 UI 확장**

- CSS 변수 기반 테마 시스템
- 컴포넌트 기반 UI
- 접근성 확장

## 📝 타입 시스템

HAPA는 강력한 TypeScript 타입 시스템을 사용합니다:

```typescript
// 사용자 프로필 타입
export interface UserProfile {
  pythonSkillLevel: PythonSkillLevel;
  codeOutputStructure: CodeOutputStructure;
  explanationStyle: ExplanationStyle;
  projectContext: ProjectContext;
  errorHandlingPreference: ErrorHandlingPreference;
  preferredLanguageFeatures: string[];
  isOnboardingCompleted: boolean;
}

// API 요청/응답 타입
export interface CodeGenerationRequest {
  prompt: string;
  model_type?: string;
  context?: string;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  programming_level?: "beginner" | "intermediate" | "advanced" | "expert";
  explanation_detail?: "minimal" | "standard" | "detailed" | "comprehensive";
}

export interface CodeGenerationResponse {
  generated_code: string;
  explanation?: string;
  status: "success" | "error";
  error_message?: string;
}
```

## 🔐 보안 및 개인정보

### 1. **데이터 보호**

- API 키 암호화 저장
- 민감 정보 마스킹
- 로컬 데이터 암호화

### 2. **네트워크 보안**

- HTTPS 강제
- 요청 검증
- 타임아웃 설정

### 3. **사용자 동의**

- 명시적 텔레메트리 동의
- 데이터 수집 투명성
- 옵트아웃 기능

## 📈 확장 계획

### 1. **언어 지원 확장**

- JavaScript/TypeScript 지원
- Java, C++ 추가
- 다국어 UI

### 2. **AI 기능 향상**

- 더 정확한 컨텍스트 이해
- 프로젝트 전체 분석
- 코드 리팩토링 제안

### 3. **협업 기능**

- 팀 설정 공유
- 코드 리뷰 통합
- 버전 관리 시스템 연동

### 4. **통합 확장**

- GitHub Copilot 연동
- 기타 AI 도구 통합
- CI/CD 파이프라인 연동

---

이 아키텍처는 확장성, 유지보수성, 성능을 고려하여 설계되었으며, 향후 기능 추가와 개선이 용이하도록 구성되어 있습니다.
