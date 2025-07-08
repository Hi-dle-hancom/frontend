/**
 * HAPA API Client - vLLM 멀티 LoRA 서버 통합
 * - 실시간 스트리밍 코드 생성
 * - Enhanced AI 백엔드 지원
 * - 자동 페일오버 및 재시도
 */

import axios, { AxiosResponse, AxiosError } from "axios";
import * as vscode from "vscode";

// 타입 import
export { StreamingCallbacks } from "../types/index";

// API 설정
const API_BASE_URL = "http://3.13.240.111:8000/api/v1";
const VLLM_API_TIMEOUT = 300000; // 5분

// 에러 타입 정의
interface APIError {
  message: string;
  status?: number;
  code?: string;
}

// vLLM 모델 타입 정의 (Backend와 일치하는 소문자 enum)
export enum VLLMModelType {
  CODE_COMPLETION = "code_completion", // 자동완성 → vLLM autocomplete
  CODE_GENERATION = "code_generation", // 일반 생성 → vLLM prompt
  CODE_EXPLANATION = "code_explanation", // 설명/주석 → vLLM comment
  CODE_REVIEW = "code_review", // 리뷰 → vLLM comment
  BUG_FIX = "bug_fix", // 버그 수정 → vLLM error_fix
  CODE_OPTIMIZATION = "code_optimization", // 최적화 → vLLM prompt
  UNIT_TEST_GENERATION = "unit_test_generation", // 테스트 → vLLM prompt
  DOCUMENTATION = "documentation", // 문서화 → vLLM comment
}

// 코드 생성 요청 인터페이스 (Backend 스키마와 완전 일치)
export interface CodeGenerationRequest {
  // 핵심 요청 정보
  prompt: string; // 1-4000자
  model_type?: VLLMModelType; // 기본값: code_generation
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

// 코드 생성 응답 인터페이스
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
}

// 스트리밍 청크 인터페이스 - types/index.ts와 통합
export interface StreamingChunk {
  type: "start" | "token" | "code" | "explanation" | "done" | "error";
  content: string;
  sequence: number;
  timestamp: string;
  is_complete?: boolean; // 하위 호환성을 위해 optional로 유지
}

// vLLM 서버 상태 인터페이스
export interface VLLMHealthStatus {
  status: "healthy" | "unhealthy" | "error";
  details?: any;
  error?: string;
}

// Enhanced AI 백엔드 상태 인터페이스
export interface BackendStatus {
  current_backend: string;
  backends: {
    vllm: {
      available: boolean;
      last_check?: string;
    };
    legacy: {
      available: boolean;
      last_check?: string;
    };
  };
  last_health_check: string;
}

export class HAPAAPIClient {
  private apiKey: string;
  private baseURL: string;

  constructor(apiKey: string = "") {
    this.apiKey = apiKey;
    this.baseURL = API_BASE_URL;

    // Axios 기본 설정 (Authorization 헤더 제거, X-API-Key만 사용)
    axios.defaults.timeout = VLLM_API_TIMEOUT;
    axios.defaults.headers.common["Content-Type"] = "application/json";

    // X-API-Key 헤더만 설정 (Authorization Bearer 제거)
    if (this.apiKey) {
      axios.defaults.headers.common["X-API-Key"] = this.apiKey;
    }
  }

  /**
   * vLLM 서버 상태 확인
   */
  async checkVLLMHealth(): Promise<VLLMHealthStatus> {
    try {
      const response = await axios.get(`${this.baseURL}/code/health`);
      return response.data;
    } catch (error) {
      console.error("vLLM 상태 확인 실패:", error);
      return {
        status: "error",
        error: this.handleError(error).message,
      };
    }
  }

  /**
   * Enhanced AI 백엔드 상태 확인
   */
  async getBackendStatus(): Promise<BackendStatus | null> {
    try {
      const response = await axios.get(`${this.baseURL}/code/backend/status`);
      return response.data;
    } catch (error) {
      console.error("백엔드 상태 조회 실패:", error);
      return null;
    }
  }

  /**
   * 사용 가능한 모델 목록 조회
   */
  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await axios.get(`${this.baseURL}/code/models`);
      return response.data.available_models || [];
    } catch (error) {
      console.error("모델 목록 조회 실패:", error);
      return [];
    }
  }

  /**
   * 실시간 스트리밍 코드 생성
   */
  async generateCodeStream(
    request: CodeGenerationRequest,
    onChunk: (chunk: StreamingChunk) => void,
    onComplete?: () => void,
    onError?: (error: APIError) => void
  ): Promise<void> {
    try {
      // API 키 확인 및 업데이트
      const config = vscode.workspace.getConfiguration("hapa");
      const currentApiKey = config.get<string>(
        "apiKey",
        "hapa_demo_20241228_secure_key_for_testing"
      );

      if (currentApiKey && currentApiKey !== this.apiKey) {
        this.updateConfig(currentApiKey);
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      };

      // X-API-Key 헤더만 추가
      if (this.apiKey) {
        headers["X-API-Key"] = this.apiKey;
      }

      console.log("🔑 API 요청 헤더:", {
        hasApiKey: !!this.apiKey,
        keyPrefix: this.apiKey ? this.apiKey.substring(0, 10) + "..." : "없음",
        url: `${this.baseURL}/code/generate/stream`,
      });

      const response = await fetch(`${this.baseURL}/code/generate/stream`, {
        method: "POST",
        headers,
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("스트리밍 응답을 읽을 수 없습니다");
      }

      let accumulated_content = "";
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim();

              if (data === "[DONE]") {
                // 스트리밍 완료
                onChunk({
                  type: "done",
                  content: accumulated_content,
                  sequence: Date.now(),
                  timestamp: new Date().toISOString(),
                  is_complete: true,
                });
                onComplete?.();
                return;
              }

              if (data) {
                // JSON 형태의 응답인지 확인하고 파싱 시도
                let contentToAdd = data;
                try {
                  // JSON 형태인지 확인 ({"text": "실제코드"} 구조)
                  if (typeof data === "string" && data.trim().startsWith("{")) {
                    const parsedData = JSON.parse(data);
                    if (parsedData.text) {
                      contentToAdd = parsedData.text;
                      console.log(
                        "✅ 스트리밍 데이터에서 JSON text 필드 추출 성공"
                      );
                    } else if (typeof parsedData === "string") {
                      contentToAdd = parsedData;
                    }
                  }
                } catch (parseError) {
                  console.log(
                    "ℹ️ 스트리밍 JSON 파싱 불가, 원본 사용:",
                    parseError
                  );
                  // JSON 파싱에 실패하면 원본 그대로 사용
                }

                accumulated_content += contentToAdd;
                onChunk({
                  type: "token",
                  content: contentToAdd,
                  sequence: Date.now(),
                  timestamp: new Date().toISOString(),
                  is_complete: false,
                });
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error("스트리밍 코드 생성 실패:", error);
      const apiError = this.handleError(error);
      onError?.(apiError);
    }
  }

  /**
   * 동기식 코드 생성 (스트리밍 없음)
   */
  async generateCode(
    request: CodeGenerationRequest
  ): Promise<CodeGenerationResponse> {
    try {
      // VSCode 설정에서 최신 API 키 가져오기
      const vscode = (await import("vscode")).default;
      const config = vscode.workspace.getConfiguration("hapa");
      const currentApiKey = config.get<string>(
        "apiKey",
        "hapa_demo_20241228_secure_key_for_testing"
      );

      if (currentApiKey && currentApiKey !== this.apiKey) {
        this.updateConfig(currentApiKey);
      }

      // 🔍 요청 헤더 설정 (X-API-Key만 사용)
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      // X-API-Key 헤더만 추가
      if (this.apiKey) {
        headers["X-API-Key"] = this.apiKey;
      }

      // 🔍 요청 데이터 상세 로깅 (422 오류 디버깅용)
      console.log("🚀 동기식 코드 생성 요청 - 상세 디버깅:", {
        url: `${this.baseURL}/code/generate`,
        headers: {
          "Content-Type": headers["Content-Type"],
          "X-API-Key": headers["X-API-Key"]
            ? headers["X-API-Key"].substring(0, 20) + "..."
            : "없음",
        },
        request_data: {
          prompt: request.prompt,
          prompt_length: request.prompt?.length || 0,
          model_type: request.model_type,
          context: request.context,
          temperature: request.temperature,
          top_p: request.top_p,
          max_tokens: request.max_tokens,
          programming_level: request.programming_level,
          explanation_detail: request.explanation_detail,
          code_style: request.code_style,
          include_comments: request.include_comments,
          include_docstring: request.include_docstring,
          include_type_hints: request.include_type_hints,
          language: request.language,
          project_context: request.project_context,
        },
      });

      const response = await axios.post(
        `${this.baseURL}/code/generate`,
        request,
        { headers }
      );

      console.log("📡 API 응답 상태:", {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data_type: typeof response.data,
        response_data: response.data,
      });

      if (response.status === 200) {
        console.log("✅ 코드 생성 성공:", {
          success: response.data.success,
          code_length: response.data.generated_code?.length || 0,
        });
        return response.data;
      } else {
        console.error("❌ API 오류 응답 - 상세 정보:", {
          status: response.status,
          statusText: response.statusText,
          data: response.data,
          url: `${this.baseURL}/code/generate`,
          sent_request: JSON.stringify(request, null, 2),
        });

        return {
          success: false,
          generated_code: "",
          error_message:
            response.data?.detail ||
            `HTTP ${response.status}: ${response.statusText}`,
          model_used: "unknown",
          processing_time: 0,
        };
      }
    } catch (error) {
      console.error("❌ 코드 생성 실패:", error);

      if (axios.isAxiosError(error)) {
        if (error.response) {
          console.error("🚨 서버 응답 오류 - 상세 디버깅:", {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data,
            url: error.config?.url,
            method: error.config?.method,
            headers: error.config?.headers,
            sent_data: error.config?.data,
          });

          // 422 Validation Error 특별 처리
          if (error.response.status === 422 && error.response.data?.details) {
            console.error("🔍 422 Validation Error 상세 분석:", {
              validation_errors: error.response.data.details,
              error_count: error.response.data.details?.length || 0,
              timestamp: error.response.data.timestamp,
              path: error.response.data.path,
            });

            // 각 validation 오류별로 상세 로그
            if (Array.isArray(error.response.data.details)) {
              error.response.data.details.forEach(
                (detail: any, index: number) => {
                  console.error(`❌ Validation Error #${index + 1}:`, {
                    field: detail.loc?.join(".") || "unknown",
                    error_type: detail.type,
                    message: detail.msg,
                    input_value: detail.input,
                    context: detail.ctx,
                  });
                }
              );
            }
          }

          return {
            success: false,
            generated_code: "",
            error_message: `서버 오류 (${error.response.status}): ${
              error.response.data?.detail ||
              error.response.data?.message ||
              error.response.statusText
            }`,
            model_used: "unknown",
            processing_time: 0,
          };
        } else if (error.request) {
          console.error("네트워크 연결 오류:", error.message);
          return {
            success: false,
            generated_code: "",
            error_message:
              "서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.",
            model_used: "unknown",
            processing_time: 0,
          };
        }
      }

      return {
        success: false,
        generated_code: "",
        error_message: this.handleError(error).message,
        model_used: "unknown",
        processing_time: 0,
      };
    }
  }

  /**
   * 백엔드 수동 전환
   */
  async switchBackend(
    backendType: "vllm" | "legacy" | "auto"
  ): Promise<boolean> {
    try {
      const response = await axios.post(`${this.baseURL}/code/backend/switch`, {
        backend_type: backendType,
      });
      return response.data.success || false;
    } catch (error) {
      console.error("백엔드 전환 실패:", error);
      return false;
    }
  }

  /**
   * vLLM 연동 테스트
   */
  async testVLLMIntegration(): Promise<{
    success: boolean;
    details?: any;
    error?: string;
  }> {
    try {
      const response = await axios.post(`${this.baseURL}/code/test`, {
        test_prompt: "Hello World 함수를 만들어주세요",
      });

      return {
        success: true,
        details: response.data,
      };
    } catch (error) {
      console.error("vLLM 연동 테스트 실패:", error);
      return {
        success: false,
        error: this.handleError(error).message,
      };
    }
  }

  /**
   * 레거시 API 호환성 - 기존 코드와의 호환을 위해 유지
   */
  async generateCompletion(
    prompt: string,
    language: string = "python"
  ): Promise<CodeGenerationResponse> {
    return this.generateCode({
      prompt: prompt,
      model_type: VLLMModelType.CODE_GENERATION,
      language: language,
      programming_level: "intermediate",
      explanation_detail: "standard",
    });
  }

  /**
   * 코드 자동완성 (autocomplete 모델 사용)
   */
  async generateAutoComplete(
    prefix: string,
    language: string = "python"
  ): Promise<CodeGenerationResponse> {
    return this.generateCode({
      prompt: prefix,
      model_type: VLLMModelType.CODE_COMPLETION,
      language: language,
      max_tokens: 64, // 자동완성은 짧게
      temperature: 0.1, // 자동완성은 낮은 창의성
    });
  }

  /**
   * 에러 처리 헬퍼
   */
  private handleError(error: any): APIError {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      if (axiosError.response) {
        // 서버 응답이 있는 경우
        const data = axiosError.response.data as any;
        const status = axiosError.response.status;

        // 구체적인 HTTP 상태 코드별 처리
        switch (status) {
          case 404:
            return {
              message:
                "요청한 API 엔드포인트를 찾을 수 없습니다. 백엔드 서버 설정을 확인해주세요.",
              status: status,
              code: "ENDPOINT_NOT_FOUND",
            };
          case 401:
            return {
              message:
                "API 키가 유효하지 않습니다. 설정에서 API 키를 확인해주세요.",
              status: status,
              code: "UNAUTHORIZED",
            };
          case 403:
            return {
              message: "API 접근 권한이 없습니다. 관리자에게 문의하세요.",
              status: status,
              code: "FORBIDDEN",
            };
          case 429:
            return {
              message: "요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.",
              status: status,
              code: "RATE_LIMITED",
            };
          case 500:
            return {
              message:
                "서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
              status: status,
              code: "INTERNAL_SERVER_ERROR",
            };
          case 502:
          case 503:
          case 504:
            return {
              message:
                "서버가 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.",
              status: status,
              code: "SERVICE_UNAVAILABLE",
            };
          default:
            return {
              message:
                data?.message ||
                data?.detail ||
                `HTTP ${status} 오류가 발생했습니다`,
              status: status,
              code: data?.error_code || "API_ERROR",
            };
        }
      } else if (axiosError.request) {
        // 네트워크 오류 - 더 구체적인 처리
        if (axiosError.code === "ECONNREFUSED") {
          return {
            message:
              "HAPA 백엔드 서버(http://3.13.240.111:8000)에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.",
            code: "CONNECTION_REFUSED",
          };
        } else if (axiosError.code === "ENOTFOUND") {
          return {
            message:
              "서버 주소를 찾을 수 없습니다. 네트워크 연결을 확인해주세요.",
            code: "DNS_ERROR",
          };
        } else if (axiosError.code === "ETIMEDOUT") {
          return {
            message:
              "요청 시간이 초과되었습니다. 네트워크 상태를 확인하거나 잠시 후 다시 시도해주세요.",
            code: "TIMEOUT_ERROR",
          };
        } else {
          return {
            message:
              "네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인해주세요.",
            code: "NETWORK_ERROR",
          };
        }
      }
    }

    // 일반 오류
    return {
      message: error?.message || "알 수 없는 오류가 발생했습니다.",
      code: "UNKNOWN_ERROR",
    };
  }

  /**
   * 설정 업데이트
   */
  updateConfig(apiKey?: string, baseURL?: string) {
    if (apiKey !== undefined) {
      this.apiKey = apiKey;
      if (apiKey) {
        axios.defaults.headers.common["X-API-Key"] = this.apiKey;
      } else {
        delete axios.defaults.headers.common["X-API-Key"];
      }
    }

    if (baseURL !== undefined) {
      this.baseURL = baseURL;
    }
  }

  /**
   * 현재 설정 정보
   */
  getConfig() {
    return {
      baseURL: this.baseURL,
      hasApiKey: !!this.apiKey,
      timeout: axios.defaults.timeout,
    };
  }

  /**
   * 실시간 스트리밍 코드 생성 (기존 메서드의 별칭)
   */
  async generateCodeStreaming(
    prompt: string,
    codeContext: string,
    callbacks: {
      onChunk?: (chunk: any) => void;
      onComplete?: () => void;
      onError?: (error: any) => void;
    }
  ): Promise<void> {
    const request: CodeGenerationRequest = {
      prompt: prompt,
      context: codeContext,
      model_type: VLLMModelType.CODE_GENERATION,
      language: "python",
    };

    return this.generateCodeStream(
      request,
      callbacks.onChunk || (() => {}),
      callbacks.onComplete,
      callbacks.onError
    );
  }

  /**
   * 코드 자동완성
   */
  async completeCode(request: {
    prefix: string;
    language: string;
    cursor_position?: number;
    file_path?: string;
    context?: string;
  }): Promise<{
    completions: Array<{
      code: string;
      label: string;
      description: string;
      confidence: number;
    }>;
    status: string;
  }> {
    try {
      const completionRequest: CodeGenerationRequest = {
        prompt: request.prefix,
        context: request.context,
        model_type: VLLMModelType.CODE_COMPLETION,
        language: request.language || "python",
      };

      const response = await this.generateCode(completionRequest);

      return {
        completions: [
          {
            code: response.generated_code,
            label: "AI Completion",
            description: response.explanation || "AI generated completion",
            confidence: 0.8,
          },
        ],
        status: response.success ? "success" : "error",
      };
    } catch (error) {
      console.error("코드 완성 실패:", error);
      return {
        completions: [],
        status: "error",
      };
    }
  }

  /**
   * 에이전트 목록 조회
   */
  async listAgents(): Promise<{
    agents: Array<{
      id: string;
      name: string;
      description: string;
      specialization: string;
    }>;
    status: string;
  }> {
    try {
      const response = await axios.get(`${this.baseURL}/custom/agents`);
      return response.data;
    } catch (error) {
      console.error("에이전트 목록 조회 실패:", error);
      return {
        agents: [
          {
            id: "default_web_developer",
            name: "웹 개발자 AI",
            description: "FastAPI, Django, Flask 전문",
            specialization: "web_development",
          },
          {
            id: "default_data_scientist",
            name: "데이터 사이언티스트 AI",
            description: "pandas, numpy, ML 전문",
            specialization: "data_science",
          },
        ],
        status: "success",
      };
    }
  }

  /**
   * 에이전트 역할 조회
   */
  async getAgentRoles(): Promise<{
    roles: Array<{
      role: string;
      description: string;
      examples: string[];
    }>;
    status: string;
  }> {
    try {
      const response = await axios.get(`${this.baseURL}/custom/agents/roles`);
      return response.data;
    } catch (error) {
      console.error("에이전트 역할 조회 실패:", error);
      return {
        roles: [
          {
            role: "웹 개발자",
            description: "웹 애플리케이션 개발",
            examples: ["FastAPI REST API", "Django 모델", "Flask 라우터"],
          },
          {
            role: "데이터 분석가",
            description: "데이터 분석 및 시각화",
            examples: ["pandas 데이터 처리", "matplotlib 차트", "numpy 연산"],
          },
        ],
        status: "success",
      };
    }
  }

  /**
   * 에이전트로 코드 생성
   */
  async generateCodeWithAgent(request: {
    agent_id: string;
    user_question: string;
    code_context?: string;
    language?: string;
  }): Promise<CodeGenerationResponse> {
    try {
      const response = await axios.post(
        `${this.baseURL}/custom/agents/generate`,
        {
          agent_id: request.agent_id,
          prompt: request.user_question,
          context: request.code_context,
          language: request.language || "python",
        }
      );
      return response.data;
    } catch (error) {
      console.error("에이전트 코드 생성 실패:", error);
      return {
        success: false,
        generated_code: "",
        model_used: "error",
        processing_time: 0,
        error_message: this.handleError(error).message,
      };
    }
  }

  /**
   * 에이전트 생성
   */
  async createAgent(agentData: {
    name: string;
    description: string;
    specialization: string;
    prompt_template?: string;
  }): Promise<{
    id: string;
    name: string;
    status: string;
  }> {
    try {
      const response = await axios.post(
        `${this.baseURL}/custom/agents`,
        agentData
      );
      return response.data;
    } catch (error) {
      console.error("에이전트 생성 실패:", error);
      return {
        id: "",
        name: agentData.name,
        status: "error",
      };
    }
  }

  /**
   * 개인화된 코드 생성
   */
  async generatePersonalizedCode(request: {
    user_question: string;
    code_context?: string;
    language?: string;
    userProfile?: any;
  }): Promise<CodeGenerationResponse> {
    try {
      const codeRequest: CodeGenerationRequest = {
        prompt: request.user_question,
        context: request.code_context,
        model_type: VLLMModelType.CODE_GENERATION,
        language: request.language || "python",
        programming_level:
          request.userProfile?.pythonSkillLevel || "intermediate",
      };

      return await this.generateCode(codeRequest);
    } catch (error) {
      console.error("개인화 코드 생성 실패:", error);
      return {
        success: false,
        generated_code: "",
        model_used: "error",
        processing_time: 0,
        error_message: this.handleError(error).message,
      };
    }
  }
}

// 기본 인스턴스 생성
export const apiClient = new HAPAAPIClient();

// VSCode 설정에서 API Key 로드
export function initializeAPIClient(): void {
  const config = vscode.workspace.getConfiguration("hapa");
  const apiKey = config.get<string>("apiKey", "");
  const serverUrl = config.get<string>("apiBaseURL", API_BASE_URL);

  console.log("🔧 API 클라이언트 초기화:", {
    serverUrl,
    hasApiKey: !!apiKey,
    keyPrefix: apiKey ? apiKey.substring(0, 10) + "..." : "없음",
  });

  apiClient.updateConfig(apiKey, serverUrl);

  // 기본 데모 키가 없으면 설정
  if (!apiKey) {
    const demoKey = "hapa_demo_20241228_secure_key_for_testing";
    console.log(
      "⚠️ API 키가 없어 데모 키를 사용합니다:",
      demoKey.substring(0, 10) + "..."
    );
    apiClient.updateConfig(demoKey, serverUrl);
  }

  console.log("🚀 HAPA API Client 초기화 완료:", {
    serverUrl,
    hasApiKey: !!apiKey,
    vllmSupport: true,
  });
}

// 설정 변경 감지
export function watchConfigChanges(): vscode.Disposable {
  return vscode.workspace.onDidChangeConfiguration((event) => {
    if (event.affectsConfiguration("hapa")) {
      console.log("📝 HAPA 설정 변경 감지 - API Client 재초기화");
      initializeAPIClient();
    }
  });
}
