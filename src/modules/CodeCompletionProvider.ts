/**
 * HAPA Code Completion Provider
 * @fileoverview 코드 자동완성 및 인라인 완성 전용 클래스
 */

import axios, { AxiosError } from "axios";
import {
  VLLMModelType,
  CodeGenerationRequest,
  CodeGenerationResponse,
} from "./apiClient";
import { ConfigService } from "../services/ConfigService";
import * as vscode from "vscode";

// 코드 완성 요청 인터페이스
export interface CodeCompletionRequest {
  prefix: string;
  language: string;
  cursor_position?: number;
  file_path?: string;
  context?: string;
}

// 코드 완성 응답 인터페이스
export interface CodeCompletionResponse {
  completions: Array<{
    code: string;
    label: string;
    description: string;
    confidence: number;
  }>;
  status: string;
}

// API 에러 인터페이스
interface APIError {
  message: string;
  status?: number;
  code?: string;
}

export class CodeCompletionProvider {
  private apiKey: string;
  private baseURL: string;
  private configService: ConfigService;

  constructor(apiKey: string = "", baseURL: string = "") {
    this.configService = ConfigService.getInstance();

    // ConfigService에서 동적으로 설정 로드
    const apiConfig = this.configService.getAPIConfig();
    this.apiKey = apiKey || apiConfig.apiKey;
    this.baseURL = baseURL || apiConfig.baseURL;
  }

  /**
   * 🔥 표준 코드 생성 (non-streaming)
   */
  async generateCode(
    request: CodeGenerationRequest
  ): Promise<CodeGenerationResponse> {
    console.log("🚀 코드 생성 요청:", request);

    // 요청 검증
    if (!request.prompt?.trim()) {
      throw new Error("빈 프롬프트는 허용되지 않습니다.");
    }

    // 안전한 기본값 설정
    const safeRequest: CodeGenerationRequest = {
      prompt: request.prompt.trim(),
      model_type: request.model_type || VLLMModelType.CODE_GENERATION,
      context: (request.context || "").slice(0, 8000), // 8000자 제한

      // vLLM 매개변수
      temperature: Math.max(0.0, Math.min(2.0, request.temperature || 0.3)),
      top_p: Math.max(0.0, Math.min(1.0, request.top_p || 0.95)),
      max_tokens: Math.max(1, Math.min(4096, request.max_tokens || 1024)),

      // 사용자 옵션 기본값
      programming_level: request.programming_level || "intermediate",
      explanation_detail: request.explanation_detail || "standard",
      code_style: request.code_style || "pythonic",
      include_comments: request.include_comments !== false,
      include_docstring: request.include_docstring !== false,
      include_type_hints: request.include_type_hints !== false,

      // 메타데이터
      language: request.language || "python",
      project_context: (request.project_context || "").slice(0, 500),
    };

    try {
      console.log("📡 코드 생성 요청 전송 중...");
      const response = await axios.post(
        `${this.baseURL}/code/generate`,
        safeRequest,
        {
          headers: {
            "Content-Type": "application/json",
            ...(this.apiKey && { "X-API-Key": this.apiKey }),
          },
          timeout: 30000, // 30초 타임아웃
          validateStatus: (status) => status < 500,
        }
      );

      console.log(`✅ 코드 생성 완료: HTTP ${response.status}`);
      return response.data;
    } catch (error) {
      console.error("❌ 코드 생성 실패:", error);
      throw this.handleError(error);
    }
  }

  /**
   * 💨 자동완성 (prefix 기반)
   */
  async generateCompletion(
    prompt: string,
    language: string = "python"
  ): Promise<CodeGenerationResponse> {
    const request: CodeGenerationRequest = {
      prompt,
      model_type: VLLMModelType.CODE_COMPLETION,
      language,
      max_tokens: 512, // 자동완성은 짧게
      temperature: 0.2, // 낮은 온도로 일관성 확보
      include_comments: false, // 자동완성에는 주석 제외
      include_docstring: false,
    };

    return this.generateCode(request);
  }

  /**
   * ⚡ 자동완성 (향상된 버전)
   */
  async generateAutoComplete(
    prefix: string,
    language: string = "python"
  ): Promise<CodeGenerationResponse> {
    const request: CodeGenerationRequest = {
      prompt: `다음 코드를 자동완성해주세요:\n\n${prefix}`,
      model_type: VLLMModelType.CODE_COMPLETION,
      language,
      max_tokens: 256,
      temperature: 0.1, // 매우 낮은 온도
      top_p: 0.9,
      include_comments: false,
      include_docstring: false,
      include_type_hints: true,
    };

    return this.generateCode(request);
  }

  /**
   * 🎯 정밀 코드 완성 (고급 기능)
   */
  async completeCode(
    request: CodeCompletionRequest
  ): Promise<CodeCompletionResponse> {
    console.log("🎯 정밀 코드 완성 요청:", request);

    try {
      const response = await axios.post(
        `${this.baseURL}/code/complete`,
        {
          prefix: request.prefix,
          language: request.language,
          cursor_position: request.cursor_position,
          file_path: request.file_path,
          context: request.context,
        },
        {
          headers: {
            "Content-Type": "application/json",
            ...(this.apiKey && { "X-API-Key": this.apiKey }),
          },
          timeout: 15000, // 15초 타임아웃 (빠른 응답)
        }
      );

      console.log("✅ 정밀 코드 완성 성공");
      return response.data;
    } catch (error) {
      console.error("❌ 정밀 코드 완성 실패:", error);

      // 실패 시 fallback으로 일반 자동완성 시도
      try {
        console.log("🔄 fallback 자동완성 시도...");
        const fallbackResponse = await this.generateAutoComplete(
          request.prefix,
          request.language
        );

        // 응답 형식 변환
        return {
          completions: [
            {
              code: fallbackResponse.generated_code,
              label: "자동완성",
              description: fallbackResponse.explanation || "AI 생성 코드",
              confidence: 0.8,
            },
          ],
          status: "success_fallback",
        };
      } catch (fallbackError) {
        throw this.handleError(error);
      }
    }
  }

  /**
   * 🔮 인라인 코드 완성 (VS Code IntelliSense 스타일)
   */
  async generateInlineCompletion(
    prefix: string,
    suffix: string = "",
    language: string = "python"
  ): Promise<{ completions: string[] }> {
    console.log("🔮 인라인 코드 완성 요청");

    try {
      const prompt = suffix
        ? `다음 코드의 빈 부분을 채워주세요:\n\n${prefix}[CURSOR]${suffix}`
        : `다음 코드를 완성해주세요:\n\n${prefix}`;

      const request: CodeGenerationRequest = {
        prompt,
        model_type: VLLMModelType.CODE_COMPLETION,
        language,
        max_tokens: 128, // 인라인은 매우 짧게
        temperature: 0.1,
        top_p: 0.8,
        include_comments: false,
        include_docstring: false,
      };

      const response = await this.generateCode(request);

      // 생성된 코드를 여러 옵션으로 분할 (줄바꿈 기준)
      const completions = response.generated_code
        .split("\n")
        .filter((line) => line.trim())
        .slice(0, 3); // 최대 3개 옵션

      return { completions };
    } catch (error) {
      console.error("❌ 인라인 코드 완성 실패:", error);
      return { completions: [] };
    }
  }

  /**
   * 🧠 컨텍스트 기반 스마트 완성
   */
  async generateSmartCompletion(
    prefix: string,
    fileContext: string,
    language: string = "python"
  ): Promise<CodeCompletionResponse> {
    console.log("🧠 스마트 완성 요청");

    const contextualPrompt = `
파일 컨텍스트:
${fileContext.slice(0, 2000)}

완성할 코드:
${prefix}

위 컨텍스트를 고려하여 가장 적절한 코드 완성을 제공해주세요.
`;

    try {
      const request: CodeGenerationRequest = {
        prompt: contextualPrompt,
        model_type: VLLMModelType.CODE_COMPLETION,
        language,
        context: fileContext.slice(0, 4000),
        max_tokens: 512,
        temperature: 0.2,
        include_type_hints: true,
        programming_level: "intermediate",
      };

      const response = await this.generateCode(request);

      return {
        completions: [
          {
            code: response.generated_code,
            label: "스마트 완성",
            description: response.explanation || "컨텍스트 기반 AI 완성",
            confidence: 0.9,
          },
        ],
        status: "success",
      };
    } catch (error) {
      console.error("❌ 스마트 완성 실패:", error);
      throw this.handleError(error);
    }
  }

  /**
   * 🎨 함수 시그니처 완성
   */
  async generateFunctionCompletion(
    functionName: string,
    context: string = "",
    language: string = "python"
  ): Promise<CodeCompletionResponse> {
    const prompt = `
다음 함수의 완전한 구현을 생성해주세요:

함수명: ${functionName}
컨텍스트: ${context}

적절한 매개변수, 반환 타입, 독스트링, 그리고 기본 구현을 포함해주세요.
`;

    try {
      const request: CodeGenerationRequest = {
        prompt,
        model_type: VLLMModelType.CODE_GENERATION,
        language,
        include_docstring: true,
        include_type_hints: true,
        include_comments: true,
        explanation_detail: "standard",
      };

      const response = await this.generateCode(request);

      return {
        completions: [
          {
            code: response.generated_code,
            label: "함수 구현",
            description: response.explanation || "완전한 함수 구현",
            confidence: 0.85,
          },
        ],
        status: "success",
      };
    } catch (error) {
      console.error("❌ 함수 완성 실패:", error);
      throw this.handleError(error);
    }
  }

  /**
   * 🔧 클래스 메서드 완성
   */
  async generateMethodCompletion(
    className: string,
    methodName: string,
    classContext: string = "",
    language: string = "python"
  ): Promise<CodeCompletionResponse> {
    const prompt = `
클래스 컨텍스트:
${classContext}

클래스 ${className}의 ${methodName} 메서드를 구현해주세요.
클래스의 구조와 목적에 맞는 적절한 메서드를 생성해주세요.
`;

    try {
      const request: CodeGenerationRequest = {
        prompt,
        model_type: VLLMModelType.CODE_GENERATION,
        language,
        context: classContext,
        include_docstring: true,
        include_type_hints: true,
        code_style: "clean",
      };

      const response = await this.generateCode(request);

      return {
        completions: [
          {
            code: response.generated_code,
            label: "메서드 구현",
            description: response.explanation || "클래스 메서드 구현",
            confidence: 0.8,
          },
        ],
        status: "success",
      };
    } catch (error) {
      console.error("❌ 메서드 완성 실패:", error);
      throw this.handleError(error);
    }
  }

  /**
   * ❌ 에러 처리 유틸리티
   */
  private handleError(error: any): APIError {
    console.error("🔍 에러 분석:", error);

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      if (axiosError.code === "ECONNABORTED") {
        return {
          message: "요청 시간이 초과되었습니다. 나중에 다시 시도해주세요.",
          code: "TIMEOUT",
        };
      }

      if (axiosError.code === "ECONNREFUSED") {
        return {
          message: "서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.",
          code: "CONNECTION_REFUSED",
        };
      }

      if (axiosError.response) {
        const status = axiosError.response.status;
        const data = axiosError.response.data as any;

        switch (status) {
          case 400:
            return {
              message: data?.detail || "잘못된 요청입니다.",
              status,
              code: "BAD_REQUEST",
            };
          case 401:
            return {
              message: "API 키가 유효하지 않습니다.",
              status,
              code: "UNAUTHORIZED",
            };
          case 429:
            return {
              message: "요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.",
              status,
              code: "RATE_LIMIT",
            };
          case 500:
            return {
              message: "서버 내부 오류가 발생했습니다.",
              status,
              code: "INTERNAL_ERROR",
            };
          default:
            return {
              message: data?.detail || `서버 오류 (${status})`,
              status,
              code: "SERVER_ERROR",
            };
        }
      }
    }

    return {
      message: error?.message || "알 수 없는 오류가 발생했습니다.",
      code: "UNKNOWN_ERROR",
    };
  }

  /**
   * ⚙️ 설정 업데이트
   */
  updateConfig(apiKey?: string, baseURL?: string): void {
    if (apiKey !== undefined) {
      this.apiKey = apiKey;
    }
    if (baseURL !== undefined) {
      this.baseURL = baseURL;
    }

    console.log("🔧 CodeCompletionProvider 설정 업데이트됨");
  }

  /**
   * 📋 현재 설정 조회
   */
  getConfig(): { apiKey: string; baseURL: string } {
    return {
      apiKey: this.apiKey,
      baseURL: this.baseURL,
    };
  }
}
