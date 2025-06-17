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
}

interface CompletionResponse {
  completions: string[];
  status: "success" | "error";
  error_message?: string;
}

interface ErrorResponse {
  status: string;
  error_message: string;
  error_code?: string;
  error_details?: Record<string, any>;
}

/**
 * HAPA API 클라이언트 클래스
 */
class HAPAAPIClient {
  private client: AxiosInstance;
  private config: APIConfig;

  constructor() {
    // 설정 로드
    this.config = this.loadConfig();

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
   * 코드 생성 요청
   */
  async generateCode(
    request: CodeGenerationRequest
  ): Promise<CodeGenerationResponse> {
    try {
      const response = await this.client.post<CodeGenerationResponse>(
        "/code/generate",
        request
      );
      return response.data;
    } catch (error) {
      // 오류 상황에서도 일관된 응답 형식 반환
      return {
        generated_code: "",
        status: "error",
        error_message:
          error instanceof Error
            ? error.message
            : "알 수 없는 오류가 발생했습니다.",
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
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "피드백 제출에 실패했습니다.",
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
};
