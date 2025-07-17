import { unifiedStateManager } from "./UnifiedStateManager";

/**
 * 메시지 타입 정의
 */
export interface BaseMessage {
  command: string;
  timestamp: number;
  id: string;
  metadata?: Record<string, any>;
}

export interface CodeGenerationMessage extends BaseMessage {
  command: "generateCodeStreaming" | "generateCode" | "generateBugFixStreaming";
  prompt: string;
  model_type: string;
  context?: string;
  temperature?: number;
  max_tokens?: number;
  programming_level?: string;
  explanation_detail?: string;
}

export interface StreamingMessage extends BaseMessage {
  command:
    | "streamingChunk"
    | "streamingComplete"
    | "streamingError"
    | "streamingStarted";
  chunk?: {
    type: string;
    content: string;
    sequence?: number;
    is_complete?: boolean;
  };
  error?: string;
  data?: any;
}

export interface UIMessage extends BaseMessage {
  command:
    | "modelSelected"
    | "tabSwitched"
    | "showLoading"
    | "showError"
    | "addAIResponse";
  modelType?: string;
  tab?: "response" | "history";
  message?: string;
  content?: string;
  isLoading?: boolean;
}

export type Message =
  | CodeGenerationMessage
  | StreamingMessage
  | UIMessage
  | BaseMessage;

/**
 * 메시지 컨텍스트 - 메시지 처리 중 공유되는 정보
 */
export interface MessageContext {
  message: Message;
  direction: "toWebview" | "fromWebview";
  source: "extension" | "webview" | "backend";
  target: "extension" | "webview" | "backend";
  startTime: number;
  metadata: Record<string, any>;
  abort?: () => void;
}

/**
 * 미들웨어 인터페이스
 */
export interface MessageMiddleware {
  name: string;
  priority: number; // 낮을수록 먼저 실행 (1이 가장 높은 우선순위)

  /**
   * 메시지 처리
   * @param context 메시지 컨텍스트
   * @param next 다음 미들웨어 실행 함수
   */
  process(
    context: MessageContext,
    next: () => Promise<MessageContext>
  ): Promise<MessageContext>;
}

/**
 * 메시지 파이프라인 결과
 */
export interface PipelineResult {
  success: boolean;
  context: MessageContext;
  error?: Error;
  middlewareTrace: Array<{
    name: string;
    startTime: number;
    endTime: number;
    duration: number;
    success: boolean;
    error?: string;
  }>;
}

/**
 * 헬퍼 함수들
 */
function isRecoverableError(error: any): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const recoverableErrors = [
    "network timeout",
    "connection refused",
    "temporary unavailable",
    "rate limit exceeded",
  ];

  return recoverableErrors.some((pattern) =>
    error.message.toLowerCase().includes(pattern)
  );
}

function normalizeFromWebview(message: Message): Message {
  // 필드명 통일 (question -> prompt)
  if ("question" in message && !("prompt" in message)) {
    (message as any).prompt = (message as any).question;
    delete (message as any).question;
  }

  // 모델 타입 매핑
  if ("modelType" in message && !("model_type" in message)) {
    (message as any).model_type = (message as any).modelType;
  }

  return message;
}

function normalizeToWebview(message: Message): Message {
  // UI에 적합한 형태로 변환
  if (
    message.command === "streamingChunk" &&
    "chunk" in message &&
    message.chunk
  ) {
    // 청크 데이터 구조 보장
    if (!message.chunk.sequence) {
      message.chunk = {
        type: message.chunk.type || "text",
        content: message.chunk.content || "",
        sequence: Date.now(),
        is_complete: message.chunk.is_complete ?? false,
      };
    }
  }

  return message;
}

function generateDeduplicationKey(message: Message): string {
  const baseKey = `${message.command}_${message.id || "unknown"}`;

  // 특정 명령어는 추가 식별자 포함
  if (message.command === "streamingChunk" && "chunk" in message) {
    return `${baseKey}_${message.chunk?.sequence || "unknown"}`;
  }

  return baseKey;
}

/**
 * 메시지 파이프라인 클래스
 * 메시지 처리의 모든 단계를 미들웨어로 관리하여 유연성과 확장성을 제공
 */
export class MessagePipeline {
  private middlewares: MessageMiddleware[] = [];
  private isProcessing = false;
  private processingQueue: Array<{
    context: MessageContext;
    resolve: Function;
    reject: Function;
  }> = [];
  private readonly maxQueueSize = 100;
  private messageHistory = new Map<string, number>();
  private readonly messageTTL = 60000; // 1분

  constructor() {
    this.setupDefaultMiddlewares();
  }

  /**
   * 기본 미들웨어 설정
   */
  private setupDefaultMiddlewares(): void {
    // 1. 메시지 유효성 검증 미들웨어 (최우선)
    this.addMiddleware({
      name: "ValidationMiddleware",
      priority: 1,
      async process(context, next) {
        if (!context.message) {
          throw new Error("메시지가 없습니다");
        }

        if (!context.message.command) {
          throw new Error("메시지 명령이 없습니다");
        }

        if (!context.message.id) {
          context.message.id =
            Date.now().toString() + Math.random().toString(36).substr(2, 9);
        }

        if (!context.message.timestamp) {
          context.message.timestamp = Date.now();
        }

        console.log(
          `🔍 [ValidationMiddleware] 메시지 검증 완료: ${context.message.command}`
        );
        return await next();
      },
    });

    // 2. 메시지 로깅 미들웨어
    this.addMiddleware({
      name: "LoggingMiddleware",
      priority: 2,
      async process(context, next) {
        console.log(`📨 [${context.direction}] ${context.message.command}`, {
          id: context.message.id,
          source: context.source,
          target: context.target,
          timestamp: new Date(context.message.timestamp).toISOString(),
        });

        const result = await next();

        console.log(
          `✅ [LoggingMiddleware] 메시지 처리 완료: ${context.message.command}`
        );
        return result;
      },
    });

    // 3. 상태 동기화 미들웨어
    this.addMiddleware({
      name: "StateSyncMiddleware",
      priority: 3,
      async process(context, next) {
        // 메시지 유형별 상태 업데이트
        switch (context.message.command) {
          case "modelSelected":
            if ("modelType" in context.message) {
              unifiedStateManager.setSelectedModel(context.message.modelType!);
            }
            break;

          case "streamingStarted":
            unifiedStateManager.startStreaming(context.message.id);
            break;

          case "streamingChunk":
            if ("chunk" in context.message && context.message.chunk?.content) {
              unifiedStateManager.addStreamingChunk(
                context.message.chunk.content.length
              );
            }
            break;

          case "streamingComplete":
            unifiedStateManager.completeStreaming();
            break;

          case "streamingError":
            const errorMsg =
              "error" in context.message
                ? context.message.error
                : "알 수 없는 오류";
            unifiedStateManager.errorStreaming(errorMsg || "알 수 없는 오류");
            break;

          case "showLoading":
            if ("isLoading" in context.message) {
              unifiedStateManager.setLoading(
                context.message.isLoading!,
                "message" in context.message
                  ? context.message.message
                  : undefined
              );
            }
            break;
        }

        console.log(
          `🔄 [StateSyncMiddleware] 상태 동기화 완료: ${context.message.command}`
        );
        return await next();
      },
    });

    // 4. 성능 모니터링 미들웨어
    this.addMiddleware({
      name: "PerformanceMiddleware",
      priority: 4,
      async process(context, next) {
        const startTime = Date.now();
        context.metadata.performanceStart = startTime;

        const result = await next();

        const endTime = Date.now();
        const duration = endTime - startTime;
        context.metadata.performanceDuration = duration;

        // API 상태 업데이트
        unifiedStateManager.setState("api.lastRequestTime", endTime);

        // 성능 경고
        if (duration > 5000) {
          console.warn(
            `⚠️ [PerformanceMiddleware] 느린 메시지 처리: ${context.message.command} (${duration}ms)`
          );
        }

        console.log(`⏱️ [PerformanceMiddleware] 처리 시간: ${duration}ms`);
        return result;
      },
    });

    // 5. 오류 처리 미들웨어
    this.addMiddleware({
      name: "ErrorHandlingMiddleware",
      priority: 5,
      async process(context, next) {
        try {
          return await next();
        } catch (error) {
          console.error(
            `❌ [ErrorHandlingMiddleware] 메시지 처리 오류:`,
            error
          );

          // 상태에 오류 기록
          unifiedStateManager.setState(
            "api.lastError",
            error instanceof Error ? error : new Error(String(error))
          );

          // 오류 컨텍스트에 추가
          context.metadata.error = error;
          context.metadata.errorHandled = true;

          // 복구 가능한 오류인 경우 기본값으로 처리
          if (isRecoverableError(error)) {
            console.log(
              `🔄 [ErrorHandlingMiddleware] 복구 가능한 오류로 판단, 기본 처리 실행`
            );
            return context;
          }

          throw error;
        }
      },
    });

    // 6. 메시지 변환 미들웨어
    this.addMiddleware({
      name: "TransformationMiddleware",
      priority: 6,
      async process(context, next) {
        // webview에서 extension으로 가는 메시지 변환
        if (context.direction === "fromWebview") {
          context.message = normalizeFromWebview(context.message);
        }

        // extension에서 webview로 가는 메시지 변환
        if (context.direction === "toWebview") {
          context.message = normalizeToWebview(context.message);
        }

        console.log(`🔄 [TransformationMiddleware] 메시지 변환 완료`);
        return await next();
      },
    });

    // 7. 중복 제거 미들웨어
    const pipeline = this;
    this.addMiddleware({
      name: "DeduplicationMiddleware",
      priority: 7,
      async process(context, next) {
        const key = generateDeduplicationKey(context.message);

        if (pipeline.isDuplicateMessage(key, context.message.timestamp)) {
          console.warn(
            `⚠️ [DeduplicationMiddleware] 중복 메시지 감지: ${context.message.command}`
          );
          return context; // 중복 메시지는 처리하지 않고 바로 반환
        }

        pipeline.recordMessage(key, context.message.timestamp);
        return await next();
      },
    });
  }

  /**
   * 미들웨어 추가
   */
  public addMiddleware(middleware: MessageMiddleware): void {
    this.middlewares.push(middleware);
    this.middlewares.sort((a, b) => a.priority - b.priority);
    console.log(
      `🔧 미들웨어 추가: ${middleware.name} (우선순위: ${middleware.priority})`
    );
  }

  /**
   * 미들웨어 제거
   */
  public removeMiddleware(name: string): boolean {
    const index = this.middlewares.findIndex((m) => m.name === name);
    if (index > -1) {
      this.middlewares.splice(index, 1);
      console.log(`🗑️ 미들웨어 제거: ${name}`);
      return true;
    }
    return false;
  }

  /**
   * 메시지 처리 실행
   */
  public async process(
    message: Message,
    direction: "toWebview" | "fromWebview",
    source: string,
    target: string
  ): Promise<PipelineResult> {
    const context: MessageContext = {
      message,
      direction,
      source: source as "extension" | "webview" | "backend",
      target: target as "extension" | "webview" | "backend", 
      startTime: Date.now(),
      metadata: {},
    };

    const trace: PipelineResult["middlewareTrace"] = [];

    try {
      // 큐 크기 확인
      if (this.processingQueue.length >= this.maxQueueSize) {
        throw new Error("메시지 처리 큐가 가득참");
      }

      // 비동기 큐 처리
      if (this.isProcessing) {
        return await this.enqueueMessage(context);
      }

      this.isProcessing = true;
      const result = await this.executeMiddlewares(context, 0, trace);

      return {
        success: true,
        context: result,
        middlewareTrace: trace,
      };
    } catch (error) {
      console.error("❌ 메시지 파이프라인 처리 실패:", error);

      return {
        success: false,
        context,
        error: error instanceof Error ? error : new Error(String(error)),
        middlewareTrace: trace,
      };
    } finally {
      this.isProcessing = false;
      this.processQueue();
    }
  }

  /**
   * 미들웨어 실행
   */
  private async executeMiddlewares(
    context: MessageContext,
    index: number,
    trace: PipelineResult["middlewareTrace"]
  ): Promise<MessageContext> {
    if (index >= this.middlewares.length) {
      return context;
    }

    const middleware = this.middlewares[index];
    const startTime = Date.now();

    try {
      const result = await middleware.process(context, async () => {
        return await this.executeMiddlewares(context, index + 1, trace);
      });

      const endTime = Date.now();
      trace.push({
        name: middleware.name,
        startTime,
        endTime,
        duration: endTime - startTime,
        success: true,
      });

      return result;
    } catch (error) {
      const endTime = Date.now();
      trace.push({
        name: middleware.name,
        startTime,
        endTime,
        duration: endTime - startTime,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  }

  /**
   * 메시지 큐에 추가
   */
  private async enqueueMessage(
    context: MessageContext
  ): Promise<PipelineResult> {
    return new Promise((resolve, reject) => {
      this.processingQueue.push({ context, resolve, reject });
    });
  }

  /**
   * 큐 처리
   */
  private async processQueue(): Promise<void> {
    while (this.processingQueue.length > 0 && !this.isProcessing) {
      const { context, resolve, reject } = this.processingQueue.shift()!;

      try {
        this.isProcessing = true;
        const trace: PipelineResult["middlewareTrace"] = [];
        const result = await this.executeMiddlewares(context, 0, trace);

        resolve({
          success: true,
          context: result,
          middlewareTrace: trace,
        });
      } catch (error) {
        reject({
          success: false,
          context,
          error: error instanceof Error ? error : new Error(String(error)),
          middlewareTrace: [],
        });
      } finally {
        this.isProcessing = false;
      }
    }
  }

  /**
   * 중복 메시지 확인
   */
  private isDuplicateMessage(key: string, timestamp: number): boolean {
    const lastTime = this.messageHistory.get(key);
    if (!lastTime) {
      return false;
    }

    // TTL 만료된 메시지는 제거
    if (timestamp - lastTime > this.messageTTL) {
      this.messageHistory.delete(key);
      return false;
    }

    return true;
  }

  /**
   * 메시지 기록
   */
  private recordMessage(key: string, timestamp: number): void {
    this.messageHistory.set(key, timestamp);

    // 주기적으로 만료된 메시지 정리
    if (this.messageHistory.size > 1000) {
      this.cleanupExpiredMessages(timestamp);
    }
  }

  /**
   * 만료된 메시지 정리
   */
  private cleanupExpiredMessages(currentTime: number): void {
    for (const [key, timestamp] of this.messageHistory.entries()) {
      if (currentTime - timestamp > this.messageTTL) {
        this.messageHistory.delete(key);
      }
    }
  }

  /**
   * 파이프라인 상태 조회
   */
  public getStatus(): {
    isProcessing: boolean;
    queueSize: number;
    middlewareCount: number;
    messageHistorySize: number;
  } {
    return {
      isProcessing: this.isProcessing,
      queueSize: this.processingQueue.length,
      middlewareCount: this.middlewares.length,
      messageHistorySize: this.messageHistory.size,
    };
  }

  /**
   * 미들웨어 목록 조회
   */
  public getMiddlewares(): Array<{ name: string; priority: number }> {
    return this.middlewares.map((m) => ({
      name: m.name,
      priority: m.priority,
    }));
  }

  /**
   * 파이프라인 리셋
   */
  public reset(): void {
    this.processingQueue.length = 0;
    this.messageHistory.clear();
    this.isProcessing = false;
    console.log("🔄 메시지 파이프라인 리셋 완료");
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
export const messagePipeline = new MessagePipeline();
