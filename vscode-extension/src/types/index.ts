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
 * 코드 생성 요청
 */
export interface CodeGenerationRequest {
  user_question: string;
  code_context?: string;
  language: string;
  file_path?: string;
  userProfile?: UserProfile;
}

/**
 * 코드 생성 응답
 */
export interface CodeGenerationResponse {
  generated_code: string;
  explanation?: string;
  status: "success" | "error";
  error_message?: string;
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
