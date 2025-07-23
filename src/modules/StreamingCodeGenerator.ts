/**
 * HAPA Streaming Code Generator
 * @fileoverview 실시간 스트리밍 코드 생성 전용 클래스
 */

import axios, { AxiosResponse } from "axios";
import { CodeGenerationRequest, StreamingChunk, VLLMModelType } from "../types";
import { ConfigService } from "../services/ConfigService";
import { StreamingCallbacks } from "../types";
import * as vscode from "vscode";

// API 에러 클래스 정의
export class APIError extends Error {
  public status: number;
  public code?: string;

  constructor(message: string, status: number = 500, code?: string) {
    super(message);
    this.name = "APIError";
    this.status = status;
    this.code = code;
  }
}

// 환경별 로깅 설정
const DEBUG_MODE = process.env.NODE_ENV === "development";
const PERFORMANCE_LOGGING = true;

// 타임아웃 설정
const VLLM_API_TIMEOUT = 300000; // 5분
const CONNECTION_TIMEOUT = 30000; // 30초
const CHUNK_TIMEOUT = 60000; // 60초 청크 타임아웃 (10초 → 60초로 증가)

/**
 * 스트리밍 코드 생성기 클래스
 * vLLM 서버와의 실시간 스트리밍 통신을 담당
 */
export class StreamingCodeGenerator {
  private baseURL: string;
  private apiKey: string | null;
  private configService: ConfigService;

  constructor(configService: ConfigService) {
    this.configService = configService;
    this.baseURL = this.configService.getAPIConfig().baseURL;
    this.apiKey = this.configService.getAPIConfig().apiKey;
  }

  /**
   * 요청 데이터 검증 및 정리
   */
  private validateAndSanitizeRequest(
    request: CodeGenerationRequest
  ): CodeGenerationRequest {
    if (!request.prompt || typeof request.prompt !== "string") {
      throw new APIError("유효하지 않은 프롬프트입니다.", 400);
    }

    if (request.prompt.trim().length === 0) {
      throw new APIError("프롬프트가 비어있습니다.", 400);
    }

    if (request.prompt.length > 4000) {
      throw new APIError("프롬프트가 너무 깁니다. (최대 4000자)", 400);
    }

    // 안전한 요청 객체 생성
    const safeRequest: CodeGenerationRequest = {
      ...request,
      prompt: request.prompt.trim(),
      context: request.context?.trim() || "",
      model_type: request.model_type || VLLMModelType.CODE_GENERATION,
      temperature: Math.max(0, Math.min(2, request.temperature || 0.3)),
      top_p: Math.max(0, Math.min(1, request.top_p || 0.95)),
      max_tokens: Math.max(1, Math.min(4096, request.max_tokens || 1024)),
    };

    return safeRequest;
  }

  /**
   * 스트리밍 코드 생성
   */
  async generateCodeStream(
    request: CodeGenerationRequest,
    onChunk: (chunk: StreamingChunk) => void,
    onComplete?: (fullContent: string) => void,
    onError?: (error: APIError) => void
  ): Promise<void> {
    let safeRequest: CodeGenerationRequest;
    let accumulatedContent = ""; // 전체 콘텐츠 누적

    // 스코프 문제 해결을 위한 변수 선언 (핵심 수정 3-1)
    let controller: AbortController | null = null;
    let timeoutId: NodeJS.Timeout | null = null;
    let chunkTimeoutId: NodeJS.Timeout | null = null;

    // 요청 검증
    try {
      safeRequest = this.validateAndSanitizeRequest(request);
    } catch (error) {
      const apiError =
        error instanceof APIError ? error : new APIError("요청 검증 실패", 400);
      onError?.(apiError);
      return;
    }

    // 환경별 조건부 로깅 - 요청 시작
    if (DEBUG_MODE) {
      console.log("🚀 스트리밍 코드 생성 시작:", {
        model: safeRequest.model_type,
        promptLength: safeRequest.prompt.length,
        hasContext: !!safeRequest.context,
        baseURL: this.baseURL,
      });
    } else if (PERFORMANCE_LOGGING) {
      console.log(`🚀 스트리밍 시작: ${safeRequest.model_type}`);
    }

    try {
      // 🔄 AbortController로 타임아웃 관리
      controller = new AbortController();
      timeoutId = setTimeout(() => {
        if (DEBUG_MODE) {
          console.log("⏰ 스트리밍 타임아웃 - 요청 중단");
        }
        controller?.abort();
      }, VLLM_API_TIMEOUT);

      // 🌐 스트리밍 요청 전송 (JWT 토큰 지원 추가)
      const headers: any = {
        "Content-Type": "application/json",
      };

      // JWT 토큰 유효성 검사 및 자동 갱신
      const config = vscode.workspace.getConfiguration("hapa");
      let jwtToken: string | undefined = config.get<string>("auth.accessToken");
      
      // JWT 토큰 만료 체크
      if (jwtToken && this.configService.isJWTTokenExpired(jwtToken)) {
        console.warn("🔑 JWT 토큰이 만료되었습니다. 새 토큰이 필요합니다.");
        await this.configService.clearJWTToken();
        jwtToken = undefined;
      }
      
      if (jwtToken) {
        headers["Authorization"] = `Bearer ${jwtToken}`;
        if (DEBUG_MODE) {
          console.log("🔑 JWT 토큰 인증 사용:", {
            tokenPrefix: jwtToken.substring(0, 20) + "...",
            headerSet: "Authorization Bearer"
          });
        }
      } else if (this.apiKey) {
        headers["X-API-Key"] = this.apiKey;
        if (DEBUG_MODE) {
          console.log("🔑 API Key 인증 사용:", {
            apiKeyPrefix: this.apiKey.substring(0, 15) + "...",
            headerSet: "X-API-Key"
          });
        }
      } else {
        console.warn("⚠️ 인증 정보가 없습니다. JWT 토큰 또는 API Key가 필요합니다.");
      }

      // 환경별 조건부 로깅 - 요청 헤더 및 데이터
      if (DEBUG_MODE) {
        console.log("🔑 요청 헤더 및 데이터:", {
          url: `${this.baseURL}/code/generate/stream`,
          hasJwtToken: !!jwtToken,
          hasApiKey: !!this.apiKey,
          authMethod: jwtToken ? "JWT Bearer" : (this.apiKey ? "API Key" : "none"),
          headers: Object.keys(headers),
          requestData: {
            prompt: safeRequest.prompt.substring(0, 50) + "...",
            model_type: safeRequest.model_type,
            temperature: safeRequest.temperature,
            max_tokens: safeRequest.max_tokens,
          },
        });
      }

      const response = await axios.post(
        `${this.baseURL}/code/generate/stream?enhanced=true`,  // Enhanced 모드 활성화
        safeRequest,
        {
          headers,
          responseType: "stream",
          timeout: CONNECTION_TIMEOUT,
          signal: controller.signal,
          validateStatus: (status) => status < 500, // 4xx도 처리
        }
      );

      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      // 성능 로깅
      if (PERFORMANCE_LOGGING) {
        console.log(`✅ 스트리밍 연결 성공: HTTP ${response.status}`);
      }

      // 🔄 스트리밍 데이터 처리 (순서 보장 강화)
      let buffer = "";
      let chunkCount = 0;
      let lastChunkTime = Date.now();
      let isStreamComplete = false;
      let expectedSequence = 0;
      let chunkBuffer = new Map<number, StreamingChunk>();

      // 청크 타임아웃 설정
      chunkTimeoutId = setInterval(() => {
        if (Date.now() - lastChunkTime > CHUNK_TIMEOUT) {
          if (DEBUG_MODE) {
            console.warn("⏰ 청크 타임아웃 - 스트림 중단");
          }
          controller?.abort();
          if (chunkTimeoutId) {
            clearInterval(chunkTimeoutId);
            chunkTimeoutId = null;
          }
        }
      }, 5000);

      response.data.on("data", (chunk: Buffer) => {
        try {
          lastChunkTime = Date.now();
          buffer += chunk.toString();

          // 라인별 처리
          const lines = buffer.split("\n");
          buffer = lines.pop() || ""; // 마지막 불완전한 라인은 버퍼에 보관

          for (const line of lines) {
            let cleanLine = line.trim();
            if (cleanLine.startsWith("data: ")) {
              cleanLine = cleanLine.substring(6);
            }

            // **강화된 스탑 태그 감지** (업데이트된 태그 포함)
            if (
              cleanLine === "[DONE]" ||
              cleanLine.trim() === "[DONE]" ||
              cleanLine === "data: [DONE]" ||
              cleanLine.includes("[END_OF_GENERATION]") ||
              cleanLine.includes("<|EOT|>") ||
              cleanLine.includes("# --- Generation Complete ---") ||
              cleanLine.includes("</c>")
            ) {
              isStreamComplete = true;
              if (chunkTimeoutId) {
                clearInterval(chunkTimeoutId);
                chunkTimeoutId = null;
              }

              if (PERFORMANCE_LOGGING) {
                console.log(`🏁 스트리밍 완료: 총 ${chunkCount}개 청크 처리`);
              }

              // **종료 신호별 구체적 처리**
              if (cleanLine.includes("<|EOT|>")) {
                if (DEBUG_MODE) {
                  console.log("🔚 EOT 태그 감지 - 텍스트 종료");
                }
              } else if (cleanLine.includes("# --- Generation Complete ---")) {
                if (DEBUG_MODE) {
                  console.log("✅ Generation Complete 마커 감지 - 정상 완료");
                }
              } else if (cleanLine.includes("</c>")) {
                if (DEBUG_MODE) {
                  console.log("🔚 vLLM 종료 태그 감지 - 컨텍스트 종료");
                }
              } else if (cleanLine.includes("[END_OF_GENERATION]")) {
                if (DEBUG_MODE) {
                  console.log("🛑 AI 모델 종료 토큰 감지 - 조기 완료");
                }
              } else {
                if (DEBUG_MODE) {
                  console.log("🏁 정상 스트리밍 종료 신호 감지");
                }
              }

              onComplete?.(accumulatedContent); // 전체 콘텐츠를 전달
              return;
            }

            // 빈 줄이나 무의미한 데이터 건너뛰기
            if (
              !cleanLine ||
              cleanLine.trim() === "" ||
              cleanLine === "data:"
            ) {
              continue;
            }

            // 청크 파싱 및 처리 (순서 보장)
            let parsedChunk: StreamingChunk;

            try {
              const rawChunk = JSON.parse(cleanLine);

              // 백엔드 응답 형태 변환: {text: '...'} → {content: '...'}
              if (rawChunk.text !== undefined) {
                // 환경별 조건부 로깅 - 청크 변환 상세
                if (DEBUG_MODE) {
                  console.log(
                    `📦 백엔드 청크 변환: "${rawChunk.text}" → StreamingChunk`
                  );
                }

                parsedChunk = {
                  type: rawChunk.type || "code",
                  content: rawChunk.text,
                  sequence: rawChunk.sequence || chunkCount++,
                  timestamp: new Date().toISOString(),
                };
              } else {
                // 이미 올바른 형태인 경우
                parsedChunk = rawChunk;
              }
            } catch (parseError) {
              if (DEBUG_MODE) {
                console.warn("⚠️ JSON 파싱 실패, 텍스트로 처리:", cleanLine);
              }
              // JSON이 아닌 경우 텍스트 청크로 생성
              parsedChunk = {
                type: "code",
                content: cleanLine,
                sequence: chunkCount++,
                timestamp: new Date().toISOString(),
              };
            }

            // 청크 유효성 검증
            if (!parsedChunk.type || parsedChunk.content === undefined) {
              if (DEBUG_MODE) {
                console.warn("⚠️ 유효하지 않은 청크:", parsedChunk);
              }
              continue;
            }

            // 환경별 조건부 로깅 - 청크 처리 상세
            if (DEBUG_MODE) {
              console.log(`📦 청크 처리: ${parsedChunk.type} (${chunkCount})`);
            }

            onChunk(parsedChunk);
            accumulatedContent += parsedChunk.content; // 누적 콘텐츠에 추가
            chunkCount++;
          }
        } catch (dataError) {
          if (DEBUG_MODE) {
            console.error("❌ 데이터 처리 오류:", dataError);
          }
        }
      });

      response.data.on("end", () => {
        if (chunkTimeoutId) {
          clearInterval(chunkTimeoutId);
          chunkTimeoutId = null;
        }
        if (!isStreamComplete) {
          if (PERFORMANCE_LOGGING) {
            console.log("🔚 스트림 종료됨 (미완료 상태)");
          }
          onComplete?.(accumulatedContent); // 미완료 시에도 전체 콘텐츠 전달
        }
      });

      response.data.on("error", (streamError: any) => {
        if (chunkTimeoutId) {
          clearInterval(chunkTimeoutId);
          chunkTimeoutId = null;
        }
        console.error("❌ 스트림 오류:", streamError);
        onError?.(new APIError("스트림 처리 중 오류 발생", 500));
      });
    } catch (error: any) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (chunkTimeoutId) {
        clearInterval(chunkTimeoutId);
        chunkTimeoutId = null;
      }

      console.error("❌ 스트리밍 요청 실패:", error);

      let apiError: APIError;

      // Axios CancelledError 처리 (핵심 수정 3)
      if (axios.isCancel(error)) {
        console.log("🛑 요청이 취소됨 (타임아웃 또는 사용자 취소)");
        apiError = new APIError(
          "요청이 취소되었습니다.",
          408,
          "REQUEST_CANCELLED"
        );

        // 취소된 요청에 대한 정리 작업
        try {
          if (controller && !controller.signal.aborted) {
            controller.abort();
          }
        } catch (abortError) {
          console.warn("⚠️ AbortController 정리 중 오류:", abortError);
        }

        onError?.(apiError);
        return;
      }

      // AbortError 처리 (fetch API)
      if (error.name === "AbortError") {
        console.log("🛑 Fetch 요청이 중단됨");
        apiError = new APIError(
          "요청이 중단되었습니다.",
          408,
          "REQUEST_ABORTED"
        );
        onError?.(apiError);
        return;
      }

      // 네트워크 오류 처리
      if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
        console.error("⏰ 요청 타임아웃");
        apiError = new APIError(
          "응답 시간이 초과되었습니다. 더 간단한 요청으로 다시 시도해주세요.",
          408,
          "TIMEOUT_ERROR"
        );
      } else if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
        console.error("🌐 네트워크 연결 실패");
        apiError = new APIError(
          "서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.",
          503,
          "NETWORK_ERROR"
        );
      } else if (error.code === "ECONNRESET") {
        console.error("🔌 연결이 재설정됨");
        apiError = new APIError(
          "네트워크 연결이 재설정되었습니다. 다시 시도해주세요.",
          503,
          "CONNECTION_RESET"
        );
      } else if (error.response) {
        // HTTP 오류 응답 처리
        const status = error.response.status;
        const message =
          error.response.data?.detail ||
          error.response.data?.message ||
          `HTTP ${status} 오류`;

        console.error("📡 HTTP 오류:", {
          status,
          statusText: error.response.statusText,
          data: error.response.data,
        });

        // 상태 코드별 사용자 친화적 메시지
        let userMessage = message;
        if (status === 401) {
          userMessage = "API 키가 유효하지 않습니다. 설정을 확인해주세요.";
        } else if (status === 403) {
          userMessage = "접근 권한이 없습니다. API 키 권한을 확인해주세요.";
        } else if (status === 429) {
          userMessage = "요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.";
        } else if (status >= 500) {
          userMessage =
            "서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.";
        }

        apiError = new APIError(userMessage, status, `HTTP_${status}`);
      } else {
        // 기타 오류 처리
        console.error("❓ 알 수 없는 오류:", error);
        apiError = new APIError(
          error.message || "알 수 없는 오류가 발생했습니다",
          500,
          "UNKNOWN_ERROR"
        );
      }

      // 디버그 모드에서 상세 오류 정보 로깅
      if (DEBUG_MODE) {
        console.error("🔍 상세 오류 정보:", {
          name: error.name,
          message: error.message,
          code: error.code,
          response: error.response?.status,
          stack: error.stack,
        });
      }

      onError?.(apiError);
    }
  }

  /**
   * 간소화된 스트리밍 메서드 (기존 호환성)
   */
  async generateCodeStreaming(
    prompt: string,
    codeContext: string,
    callbacks: StreamingCallbacks
  ): Promise<void> {
    const request: CodeGenerationRequest = {
      prompt,
      context: codeContext,
      model_type: VLLMModelType.CODE_GENERATION,
    };

    return this.generateCodeStream(
      request,
      callbacks.onChunk || (() => {}),
      callbacks.onComplete,
      callbacks.onError
    );
  }

  /**
   * 🔧 버그 수정용 스트리밍 코드 생성
   */
  async generateBugFixStream(
    prompt: string,
    codeContext: string,
    callbacks: StreamingCallbacks
  ): Promise<void> {
    const request: CodeGenerationRequest = {
      prompt,
      context: codeContext,
      model_type: VLLMModelType.BUG_FIX,
      explanation_detail: "detailed",
      include_comments: true,
    };

    return this.generateCodeStream(
      request,
      callbacks.onChunk || (() => {}),
      callbacks.onComplete,
      callbacks.onError
    );
  }

  /**
   * 📝 코드 설명용 스트리밍
   */
  async generateExplanationStream(
    code: string,
    callbacks: StreamingCallbacks
  ): Promise<void> {
    const request: CodeGenerationRequest = {
      prompt: `다음 코드를 상세히 설명해주세요:\n\n${code}`,
      model_type: VLLMModelType.CODE_EXPLANATION,
      explanation_detail: "comprehensive",
      include_comments: true,
    };

    return this.generateCodeStream(
      request,
      callbacks.onChunk || (() => {}),
      callbacks.onComplete,
      callbacks.onError
    );
  }

  /**
   * 🧪 단위 테스트 생성용 스트리밍
   */
  async generateTestStream(
    code: string,
    callbacks: StreamingCallbacks
  ): Promise<void> {
    const request: CodeGenerationRequest = {
      prompt: `다음 코드에 대한 단위 테스트를 생성해주세요:\n\n${code}`,
      model_type: VLLMModelType.UNIT_TEST_GENERATION,
      include_docstring: true,
      include_type_hints: true,
    };

    return this.generateCodeStream(
      request,
      callbacks.onChunk || (() => {}),
      callbacks.onComplete,
      callbacks.onError
    );
  }

  /**
   * ⚡ 코드 최적화용 스트리밍
   */
  async generateOptimizationStream(
    code: string,
    callbacks: StreamingCallbacks
  ): Promise<void> {
    const request: CodeGenerationRequest = {
      prompt: `다음 코드를 성능과 가독성 측면에서 최적화해주세요:\n\n${code}`,
      model_type: VLLMModelType.CODE_OPTIMIZATION,
      code_style: "performance",
      explanation_detail: "detailed",
    };

    return this.generateCodeStream(
      request,
      callbacks.onChunk || (() => {}),
      callbacks.onComplete,
      callbacks.onError
    );
  }

  /**
   * 🔍 코드 리뷰용 스트리밍
   */
  async generateReviewStream(
    code: string,
    callbacks: StreamingCallbacks
  ): Promise<void> {
    const request: CodeGenerationRequest = {
      prompt: `다음 코드를 검토하고 개선사항을 제안해주세요:\n\n${code}`,
      model_type: VLLMModelType.CODE_REVIEW,
      explanation_detail: "comprehensive",
      code_style: "clean",
    };

    return this.generateCodeStream(
      request,
      callbacks.onChunk || (() => {}),
      callbacks.onComplete,
      callbacks.onError
    );
  }

  /**
   * 설정 업데이트
   */
  updateConfig(apiKey: string, baseURL?: string): void {
    this.apiKey = apiKey;
    if (baseURL) {
      this.baseURL = baseURL;
    }
  }

  /**
   * 현재 설정 반환
   */
  getConfig(): { apiKey: string; baseURL: string } {
    return {
      apiKey: this.apiKey || "",
      baseURL: this.baseURL,
    };
  }
}
