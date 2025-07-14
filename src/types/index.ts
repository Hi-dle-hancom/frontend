/**
 * HAPA VSCode Extension - 중앙 타입 정의
 * @fileoverview 모든 타입 정의를 중앙에서 관리
 */

// ============================================================================
// CORE TYPES
// ============================================================================

/**
 * 사용자 스킬 레벨
 */
export type PythonSkillLevel =
  | "beginner"
  | "intermediate"
  | "advanced"
  | "expert";

/**
 * 코드 출력 구조
 */
export type CodeOutputStructure =
  | "minimal"
  | "standard"
  | "detailed"
  | "comprehensive";

/**
 * 설명 스타일
 */
export type ExplanationStyle =
  | "brief"
  | "standard"
  | "detailed"
  | "educational";

/**
 * 프로젝트 컨텍스트
 */
export type ProjectContext =
  | "web_development"
  | "data_science"
  | "automation"
  | "general_purpose"
  | "academic"
  | "enterprise";

/**
 * 오류 처리 선호도
 */
export type ErrorHandlingPreference =
  | "minimal"
  | "basic"
  | "comprehensive"
  | "production_ready";

/**
 * 사용자 프로필
 */
export interface UserProfile {
  pythonSkillLevel: PythonSkillLevel;
  codeOutputStructure: CodeOutputStructure;
  explanationStyle: ExplanationStyle;
  projectContext: ProjectContext;
  errorHandlingPreference: ErrorHandlingPreference;
  preferredLanguageFeatures: string[];
  isOnboardingCompleted: boolean;
}

// ============================================================================
// API TYPES
// ============================================================================

/**
 * Backend ModelType enum과 일치하는 모델 타입
 */
export enum VLLMModelType {
  CODE_COMPLETION = "code_completion",
  CODE_GENERATION = "code_generation",
  CODE_EXPLANATION = "code_explanation",
  CODE_REVIEW = "code_review",
  BUG_FIX = "bug_fix",
  CODE_OPTIMIZATION = "code_optimization",
  UNIT_TEST_GENERATION = "unit_test_generation",
  DOCUMENTATION = "documentation",
}

/**
 * API 설정
 */
export interface APIConfig {
  baseURL: string;
  timeout: number;
  apiKey: string;
  retryAttempts: number;
  retryDelay: number;
}

/**
 * 코드 생성 요청 (Backend 스키마와 완전 일치)
 */
export interface CodeGenerationRequest {
  // 핵심 요청 정보
  prompt: string; // 1-4000자
  model_type: VLLMModelType; // Backend ModelType enum과 일치
  context?: string; // 기본값: "", 최대 8000자

  // vLLM 서버 전용 매개변수
  temperature?: number; // 기본값: 0.3, 0.0-2.0
  top_p?: number; // 기본값: 0.95, 0.0-1.0
  max_tokens?: number; // 기본값: 1024, 1-4096

  // 사용자 선택 옵션
  programming_level?: "beginner" | "intermediate" | "advanced" | "expert";
  explanation_detail?: "minimal" | "standard" | "detailed" | "comprehensive";
  code_style?: "clean" | "performance" | "readable" | "pythonic";
  include_comments?: boolean; // 기본값: true
  include_docstring?: boolean; // 기본값: true
  include_type_hints?: boolean; // 기본값: true

  // 추가 메타데이터
  language?: string; // 기본값: "python"
  project_context?: string; // 기본값: "", 최대 500자
}

/**
 * 코드 생성 응답 (확장됨)
 */
export interface CodeGenerationResponse {
  success: boolean;
  generated_code: string;
  explanation?: string;
  model_used: string;
  processing_time: number;
  token_usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  error_message?: string;
  // 하위 호환성
  status?: "success" | "error";
}

/**
 * 코드 완성 요청
 */
export interface CompletionRequest {
  prefix: string;
  language: string;
  cursor_position?: number;
  file_path?: string;
  context?: string;
  trigger_character?: string;
}

/**
 * 향상된 코드 완성 항목
 */
export interface EnhancedCompletion {
  code: string;
  label: string;
  description: string;
  explanation: string;
  confidence: number;
  category:
    | "function"
    | "class"
    | "variable"
    | "import"
    | "method"
    | "property"
    | "keyword";
  expected_result?: string;
  performance_impact?: "low" | "medium" | "high";
  complexity: "simple" | "moderate" | "complex";
  related_concepts?: string[];
  documentation_url?: string;
  examples?: string[];
  insertion_text: string;
  detail?: string;
}

/**
 * 코드 완성 응답
 */
export interface CompletionResponse {
  completions: EnhancedCompletion[];
  status: "success" | "error";
  error_message?: string;
  context_analysis?: string;
  total_suggestions?: number;
}

/**
 * 에러 응답
 */
export interface ErrorResponse {
  status: string;
  error_message: string;
  error_code?: string;
  error_details?: Record<string, string | number | boolean | null>;
}

// ============================================================================
// STREAMING TYPES
// ============================================================================

/**
 * 스트리밍 청크
 */
export interface StreamingChunk {
  type: "start" | "token" | "code" | "explanation" | "done" | "error";
  content: string;
  sequence: number;
  timestamp: string;
  is_complete?: boolean; // 하위 호환성을 위해 optional로 유지
}

/**
 * 스트리밍 콜백
 */
export interface StreamingCallbacks {
  onChunk?: (chunk: StreamingChunk) => void;
  onStart?: () => void;
  onComplete?: (fullContent: string) => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: number) => void;
}

// ============================================================================
// UI TYPES
// ============================================================================

/**
 * 메시지 타입
 */
export type MessageType = "info" | "warning" | "error" | "success";

/**
 * 웹뷰 메시지 데이터 타입
 */
export type WebviewMessageData =
  | string
  | number
  | boolean
  | null
  | Record<string, unknown>
  | Array<unknown>;

/**
 * 웹뷰 메시지
 */
export interface WebviewMessage {
  command: string;
  data?: WebviewMessageData;
  timestamp?: string;
  messageId?: string;
}

/**
 * 히스토리 항목
 */
export interface HistoryItem {
  id: string;
  question: string;
  response: string;
  timestamp: string;
  success: boolean;
  duration?: number;
  tokens?: number;
}

/**
 * 트리거 이벤트
 */
export interface TriggerEvent {
  type: "comment" | "selection" | "shortcut";
  content: string;
  context?: string;
  position?: {
    line: number;
    character: number;
  };
}

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

/**
 * 확장 설정
 */
export interface ExtensionConfig {
  enableCodeAnalysis: boolean;
  theme: "light" | "dark" | "system";
  apiBaseURL: string;
  apiKey: string;
  apiTimeout: number;
  autoComplete: boolean;
  maxSuggestions: number;
  enableLogging: boolean;
  userProfile: UserProfile;
  commentTrigger: {
    enabled: boolean;
    resultDisplayMode:
      | "immediate_insert"
      | "sidebar"
      | "confirm_insert"
      | "inline_preview";
    autoInsertDelay: number;
    showNotification: boolean;
  };
}

// ============================================================================
// PROVIDER TYPES
// ============================================================================

/**
 * 프로바이더 상태
 */
export interface ProviderState {
  isLoading: boolean;
  isConnected: boolean;
  lastError?: string;
  lastActivity?: Date;
}

/**
 * 웹뷰 프로바이더 옵션
 */
export interface WebviewProviderOptions {
  enableScripts: boolean;
  retainContextWhenHidden: boolean;
  enableForms: boolean;
  enableCommandUris: boolean;
}

// ============================================================================
// EVENT TYPES
// ============================================================================

/**
 * 이벤트 핸들러
 */
export type EventHandler<T = unknown> = (data: T) => void | Promise<void>;

/**
 * 이벤트 구독 해제 함수
 */
export type Unsubscribe = () => void;

/**
 * 이벤트 에미터 인터페이스
 */
export interface EventEmitter<T = unknown> {
  on(event: string, handler: EventHandler<T>): Unsubscribe;
  emit(event: string, data: T): void;
  off(event: string, handler: EventHandler<T>): void;
  removeAllListeners(event?: string): void;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * 선택적 속성을 가진 타입
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * 필수 속성을 가진 타입
 */
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * 성공/실패 결과 타입
 */
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * 비동기 상태 타입
 */
export type AsyncState<T> = {
  data?: T;
  loading: boolean;
  error?: string;
};

export interface ConfigValidationResult {
  isValid: boolean;
  errors: ConfigValidationError[];
  warnings: ConfigValidationError[];
  suggestions: ConfigValidationError[];
  autoFixAvailable: boolean;
}

export interface ConfigValidationError {
  field: string;
  message: string;
  suggestion: string;
  autoFix: boolean;
}

export interface ConfigDiagnostics {
  timestamp: Date;
  overallHealth: "good" | "warning" | "error";
  issues: DiagnosticIssue[];
  recommendations: DiagnosticRecommendation[];
  performanceMetrics: Record<string, any>;
  compatibilityChecks: Record<string, any>;
}

export interface DiagnosticIssue {
  severity: "error" | "warning" | "info";
  category: "connectivity" | "configuration" | "compatibility" | "system";
  message: string;
  solution: string;
}

export interface DiagnosticRecommendation {
  type: "info" | "optimization" | "security";
  message: string;
  action: string;
}

/**
 * 모델 타입 정의
 */
export type ModelType = "autocomplete" | "prompt" | "comment" | "error_fix";
