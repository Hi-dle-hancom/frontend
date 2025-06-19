import axios, { AxiosInstance, AxiosError } from "axios";
import * as vscode from "vscode";

/**
 * HAPA API 설정
 */
interface APIConfig {
  baseURL: string;
  timeout: number;
  apiKey?: string;
}

/**
 * API 응답 타입 정의
 */
interface CodeGenerationRequest {
  user_question: string;
  code_context?: string;
  language?: string;
  file_path?: string;
}

interface CodeGenerationResponse {
  generated_code: string;
  explanation?: string;
  status: "success" | "error";
  error_message?: string;
}

interface CompletionRequest {
  prefix: string;
  language?: string;
  cursor_position?: number;
  file_path?: string;
  context?: string;
  trigger_character?: string;
}

interface CompletionResponse {
  completions: EnhancedCompletion[];
  status: "success" | "error";
  error_message?: string;
  context_analysis?: string;
  total_suggestions?: number;
}

interface EnhancedCompletion {
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

interface ErrorResponse {
  status: string;
  error_message: string;
  error_code?: string;
  error_details?: Record<string, any>;
}

// 스트리밍 응답을 위한 인터페이스
interface StreamingChunk {
  type: "start" | "token" | "code" | "explanation" | "done" | "error";
  content: string;
  sequence: number;
  timestamp: string;
}

interface StreamingCallbacks {
  onChunk?: (chunk: StreamingChunk) => void;
  onStart?: () => void;
  onComplete?: (fullContent: string) => void;
  onError?: (error: Error) => void;
}

/**
 * HAPA API 클라이언트 클래스
 */
class HAPAAPIClient {
  private client: AxiosInstance;
  private baseURL: string;
  private config: APIConfig;

  constructor() {
    // 설정 로드
    this.config = this.loadConfig();
    this.baseURL = this.config.baseURL;

    // Axios 인스턴스 생성
    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "HAPA-VSCode-Extension/0.4.0",
      },
    });

    // 요청 인터셉터
    this.client.interceptors.request.use(
      (config) => {
        // API Key 추가
        if (this.config.apiKey) {
          config.headers["X-API-Key"] = this.config.apiKey;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 응답 인터셉터
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        const errorMessage = this.handleAPIError(error);
        return Promise.reject(new Error(errorMessage));
      }
    );
  }

  /**
   * 설정 로드
   */
  private loadConfig(): APIConfig {
    const config = vscode.workspace.getConfiguration("hapa");

    return {
      baseURL: config.get("apiBaseURL", "http://localhost:8000/api/v1"),
      timeout: config.get("apiTimeout", 30000),
      apiKey: config.get("apiKey", "hapa_demo_20241228_secure_key_for_testing"),
    };
  }

  /**
   * API 오류 처리
   */
  private handleAPIError(error: AxiosError): string {
    if (error.response) {
      const data = error.response.data as ErrorResponse;

      switch (error.response.status) {
        case 401:
          return "API 인증에 실패했습니다. API Key를 확인해주세요.";
        case 403:
          return "API 권한이 부족합니다.";
        case 429:
          return "API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.";
        case 422:
          return `요청 데이터가 올바르지 않습니다: ${data.error_message}`;
        case 500:
          return "서버 내부 오류가 발생했습니다.";
        default:
          return (
            data.error_message ||
            `API 오류가 발생했습니다 (${error.response.status})`
          );
      }
    } else if (error.request) {
      return "API 서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.";
    } else {
      return `요청 처리 중 오류가 발생했습니다: ${error.message}`;
    }
  }

  /**
   * 서버 상태 확인
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.client.get("/health");
      return response.status === 200;
    } catch (error) {
      console.error("Health check failed:", error);
      return false;
    }
  }

  /**
   * 사용자 프로필 정보 가져오기
   */
  private getUserProfile() {
    const config = vscode.workspace.getConfiguration("hapa");
    return {
      pythonSkillLevel: config.get(
        "userProfile.pythonSkillLevel",
        "intermediate"
      ),
      codeOutputStructure: config.get(
        "userProfile.codeOutputStructure",
        "standard"
      ),
      explanationStyle: config.get("userProfile.explanationStyle", "standard"),
      projectContext: config.get(
        "userProfile.projectContext",
        "general_purpose"
      ),
      errorHandlingPreference: config.get(
        "userProfile.errorHandlingPreference",
        "basic"
      ),
      preferredLanguageFeatures: config.get(
        "userProfile.preferredLanguageFeatures",
        ["type_hints", "f_strings"]
      ),
    };
  }

  /**
   * 코드 생성 요청
   */
  async generateCode(
    request: CodeGenerationRequest
  ): Promise<CodeGenerationResponse> {
    try {
      // 사용자 프로필 정보 추가
      const userProfile = this.getUserProfile();
      const enhancedRequest = {
        ...request,
        userProfile: userProfile,
      };

      const response = await this.client.post<CodeGenerationResponse>(
        "/code/generate",
        enhancedRequest
      );
      return response.data;
    } catch (error) {
      // 오류 상황에서도 일관된 응답 형식 반환
      let errorMessage = "알 수 없는 오류가 발생했습니다.";

      if (error instanceof Error) {
        // 네트워크 오류
        if (
          error.message.includes("ECONNREFUSED") ||
          error.message.includes("Network Error")
        ) {
          errorMessage =
            "🔗 API 서버에 연결할 수 없습니다.\n설정에서 API 서버 주소를 확인해주세요.\n\n현재 설정: " +
            this.baseURL;
        }
        // 타임아웃 오류
        else if (error.message.includes("timeout")) {
          errorMessage =
            "⏱️ 요청 시간이 초과되었습니다.\n잠시 후 다시 시도하거나 더 간단한 질문을 해보세요.";
        }
        // 인증 오류
        else if (
          error.message.includes("401") ||
          error.message.includes("Unauthorized")
        ) {
          errorMessage =
            "🔐 API 인증에 실패했습니다.\n설정에서 API 키를 확인해주세요.";
        }
        // 서버 오류
        else if (
          error.message.includes("500") ||
          error.message.includes("Internal Server Error")
        ) {
          errorMessage =
            "🛠️ 서버에 일시적인 문제가 발생했습니다.\n잠시 후 다시 시도해주세요.";
        }
        // 요청 형식 오류
        else if (
          error.message.includes("400") ||
          error.message.includes("Bad Request")
        ) {
          errorMessage =
            "📝 요청 형식에 문제가 있습니다.\n질문을 다시 작성해보세요.";
        }
        // 기타 오류
        else {
          errorMessage = `❌ 오류 발생: ${error.message}\n\n문제가 지속되면 확장 프로그램을 재시작해보세요.`;
        }
      }

      return {
        generated_code: "",
        status: "error",
        error_message: errorMessage,
      };
    }
  }

  /**
   * 코드 자동완성 요청
   */
  async completeCode(request: CompletionRequest): Promise<CompletionResponse> {
    try {
      const response = await this.client.post<CompletionResponse>(
        "/code/complete",
        request
      );
      return response.data;
    } catch (error) {
      return {
        completions: [],
        status: "error",
        error_message:
          error instanceof Error
            ? error.message
            : "알 수 없는 오류가 발생했습니다.",
      };
    }
  }

  /**
   * 피드백 제출
   */
  async submitFeedback(feedback: {
    type: "positive" | "negative";
    comment?: string;
    code_snippet?: string;
    user_question?: string;
  }): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await this.client.post("/feedback/submit", feedback);
      return { success: true, message: "피드백이 성공적으로 제출되었습니다." };
    } catch (error) {
      let errorMessage = "피드백 제출에 실패했습니다.";

      if (error instanceof Error) {
        if (
          error.message.includes("ECONNREFUSED") ||
          error.message.includes("Network Error")
        ) {
          errorMessage =
            "🔗 서버에 연결할 수 없어 피드백을 전송하지 못했습니다.";
        } else if (error.message.includes("timeout")) {
          errorMessage =
            "⏱️ 피드백 전송 시간이 초과되었습니다. 다시 시도해주세요.";
        } else {
          errorMessage = `❌ 피드백 전송 오류: ${error.message}`;
        }
      }

      return {
        success: false,
        message: errorMessage,
      };
    }
  }

  /**
   * 설정 업데이트
   */
  updateConfig(newConfig: Partial<APIConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Axios 인스턴스 설정 업데이트
    this.client.defaults.baseURL = this.config.baseURL;
    this.client.defaults.timeout = this.config.timeout;
  }

  /**
   * API Key 설정
   */
  setAPIKey(apiKey: string): void {
    this.config.apiKey = apiKey;

    // VSCode 설정에 저장
    const config = vscode.workspace.getConfiguration("hapa");
    config.update("apiKey", apiKey, vscode.ConfigurationTarget.Global);
  }

  /**
   * 현재 설정 반환
   */
  getConfig(): APIConfig {
    return { ...this.config };
  }

  /**
   * 스트리밍 방식으로 코드 생성 요청
   */
  async generateCodeStreaming(
    userQuestion: string,
    codeContext?: string,
    callbacks?: StreamingCallbacks
  ): Promise<void> {
    const config = vscode.workspace.getConfiguration("hapa");
    const apiKey = config.get<string>("apiKey");
    const baseURL = config.get<string>("apiBaseURL", "http://localhost:8000");
    const timeout = config.get<number>("apiTimeout", 30000);

    if (!apiKey) {
      const error = new Error(
        "API 키가 설정되지 않았습니다. 설정에서 API 키를 입력해주세요."
      );
      callbacks?.onError?.(error);
      throw error;
    }

    const url = `${baseURL}/api/v1/code-generation/stream-generate`;
    // 사용자 프로필 정보 추가
    const userProfile = this.getUserProfile();
    const requestBody = {
      user_question: userQuestion,
      code_context: codeContext,
      language: "python",
      stream: true,
      userProfile: userProfile,
    };

    try {
      callbacks?.onStart?.();

      // AbortController로 타임아웃 제어
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
          Accept: "text/event-stream",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      if (!response.body) {
        throw new Error("응답 본문이 없습니다.");
      }

      // SSE 스트림 처리
      await this.processSSEStream(response.body, callbacks);
    } catch (error) {
      console.error("스트리밍 API 요청 실패:", error);

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          const timeoutError = new Error(
            `API 요청이 ${timeout}ms 후 타임아웃되었습니다.`
          );
          callbacks?.onError?.(timeoutError);
          throw timeoutError;
        } else {
          callbacks?.onError?.(error);
          throw error;
        }
      } else {
        const unknownError = new Error("알 수 없는 오류가 발생했습니다.");
        callbacks?.onError?.(unknownError);
        throw unknownError;
      }
    }
  }

  /**
   * Server-Sent Events 스트림 처리
   */
  private async processSSEStream(
    stream: ReadableStream<Uint8Array>,
    callbacks?: StreamingCallbacks
  ): Promise<void> {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let fullContent = "";

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        // 바이트를 문자열로 디코딩
        buffer += decoder.decode(value, { stream: true });

        // SSE 이벤트들을 파싱
        const events = this.parseSSEEvents(buffer);

        for (const event of events.parsed) {
          try {
            const chunk: StreamingChunk = JSON.parse(event);

            // 콜백 호출
            callbacks?.onChunk?.(chunk);

            // 전체 컨텐츠 누적 (에러가 아닌 경우에만)
            if (chunk.type !== "error" && chunk.type !== "start") {
              fullContent += chunk.content;
            }

            // 완료 또는 에러 시 처리
            if (chunk.type === "done") {
              callbacks?.onComplete?.(fullContent);
              return;
            } else if (chunk.type === "error") {
              callbacks?.onError?.(new Error(chunk.content));
              return;
            }
          } catch (parseError) {
            console.warn("SSE 이벤트 파싱 실패:", event, parseError);
          }
        }

        // 처리되지 않은 부분을 버퍼에 보관
        buffer = events.remaining;
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * SSE 이벤트 파싱
   */
  private parseSSEEvents(data: string): {
    parsed: string[];
    remaining: string;
  } {
    const lines = data.split("\n");
    const events: string[] = [];
    let currentEvent = "";
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      if (line.startsWith("data: ")) {
        currentEvent = line.substring(6); // 'data: ' 제거
        i++;

        // 다음 줄이 빈 줄인지 확인 (SSE 이벤트 종료)
        if (i < lines.length && lines[i] === "") {
          events.push(currentEvent);
          currentEvent = "";
          i++;
        } else {
          // 아직 완성되지 않은 이벤트
          break;
        }
      } else if (line === "") {
        // 빈 줄은 건너뛰기
        i++;
      } else {
        // 처리되지 않은 라인
        break;
      }
    }

    // 남은 데이터 계산
    const remaining = lines.slice(i).join("\n");

    return { parsed: events, remaining };
  }
}

// 싱글톤 인스턴스
export const apiClient = new HAPAAPIClient();

// 타입 내보내기
export type {
  APIConfig,
  CodeGenerationRequest,
  CodeGenerationResponse,
  CompletionRequest,
  CompletionResponse,
  ErrorResponse,
  StreamingChunk,
  StreamingCallbacks,
};
