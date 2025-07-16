import * as vscode from "vscode";
import { ModelType, WebviewMessage, StreamingChunk } from "../types";

// TypedMessageHandler 전용 타입 정의
interface BaseMessage {
  command: string;
  timestamp?: number;
  id?: string;
}

// 웹뷰에서 확장으로 보내는 메시지 타입들
interface GenerateCodeMessage extends BaseMessage {
  command: "generateCode" | "generateCodeStreaming" | "generateBugFixStreaming";
  question: string;
  model_type: ModelType;
  retryCount?: number;
}

interface ModelSelectedMessage extends BaseMessage {
  command: "modelSelected";
  modelType: ModelType;
}

interface StopStreamingMessage extends BaseMessage {
  command: "stopStreaming";
}

interface HistoryActionMessage extends BaseMessage {
  command: "getHistory" | "clearAllHistory" | "confirmClearAllHistory";
}

interface HistoryItemMessage extends BaseMessage {
  command: "loadHistoryItem" | "deleteHistoryItem";
  index: number;
}

interface NavigationMessage extends BaseMessage {
  command: "openMainDashboard" | "openSettings" | "showHelp";
}

interface CodeActionMessage extends BaseMessage {
  command: "insertCode";
  code: string;
}

interface InfoMessage extends BaseMessage {
  command: "showInfo";
  message: string;
}

// 확장에서 웹뷰로 보내는 메시지 타입들
interface StreamingChunkMessage extends BaseMessage {
  command: "streamingChunk";
  data: StreamingChunk;
}

interface StreamingCompleteMessage extends BaseMessage {
  command: "streamingComplete";
  data: {
    finalContent: string;
    metadata?: any;
  };
}

interface StreamingErrorMessage extends BaseMessage {
  command: "streamingError";
  data: {
    error: string | Error;
    details?: any;
  };
}

interface StreamingStartedMessage extends BaseMessage {
  command: "streamingStarted";
  data: {
    timestamp: string;
  };
}

interface StreamingStoppedMessage extends BaseMessage {
  command: "streamingStopped";
}

interface SyncHistoryMessage extends BaseMessage {
  command: "syncHistory";
  history: string;
}

interface UpdateHistoryMessage extends BaseMessage {
  command: "updateHistory";
  data: any[];
}

interface ShowErrorMessage extends BaseMessage {
  command: "showError";
  message: string;
}

interface ShowStatusMessage extends BaseMessage {
  command: "showStatus";
  message: string;
}

interface ModelChangedMessage extends BaseMessage {
  command: "modelChanged";
  modelType: ModelType;
}

// 메시지 타입 합집합
type WebviewToExtensionMessage =
  | GenerateCodeMessage
  | ModelSelectedMessage
  | StopStreamingMessage
  | HistoryActionMessage
  | HistoryItemMessage
  | NavigationMessage
  | CodeActionMessage
  | InfoMessage;

type ExtensionToWebviewMessage =
  | StreamingChunkMessage
  | StreamingCompleteMessage
  | StreamingErrorMessage
  | StreamingStartedMessage
  | StreamingStoppedMessage
  | SyncHistoryMessage
  | UpdateHistoryMessage
  | ShowErrorMessage
  | ShowStatusMessage
  | ModelChangedMessage;

// 메시지 핸들러 타입
type MessageHandler<T extends BaseMessage> = (
  message: T
) => void | Promise<void>;

type WebviewMessageHandlers = {
  [K in WebviewToExtensionMessage["command"]]?: MessageHandler<
    Extract<WebviewToExtensionMessage, { command: K }>
  >;
};

type ExtensionMessageHandlers = {
  [K in ExtensionToWebviewMessage["command"]]?: MessageHandler<
    Extract<ExtensionToWebviewMessage, { command: K }>
  >;
};

// 유틸리티 타입들
interface MessageValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedMessage?: BaseMessage;
}

interface QueuedMessage {
  message: BaseMessage;
  timestamp: number;
  id: string;
  retryCount: number;
  maxRetries: number;
}

interface MessageProcessingOptions {
  enableQueue?: boolean;
  enableRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  enableValidation?: boolean;
  enableLogging?: boolean;
}

interface MessageStats {
  sent: number;
  received: number;
  failed: number;
  retried: number;
  averageProcessingTime: number;
}

interface TypedMessageHandlerConfig {
  enableQueue?: boolean;
  enableRetry?: boolean;
  enableValidation?: boolean;
  enableLogging?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  queueMaxSize?: number;
  processingTimeout?: number;
}

/**
 * 타입 안전성을 보장하는 메시지 핸들러
 * VSCode 확장과 웹뷰 간의 통신을 타입 안전하게 관리
 */
export class TypedMessageHandler {
  private webview: vscode.Webview | null = null;
  private webviewMessageHandlers: WebviewMessageHandlers = {};
  private extensionMessageHandlers: ExtensionMessageHandlers = {};

  private messageQueue: QueuedMessage[] = [];
  private isProcessingQueue = false;
  private messageStats: MessageStats = {
    sent: 0,
    received: 0,
    failed: 0,
    retried: 0,
    averageProcessingTime: 0,
  };

  private config: Required<TypedMessageHandlerConfig>;
  private disposables: vscode.Disposable[] = [];

  constructor(config: TypedMessageHandlerConfig = {}) {
    this.config = {
      enableQueue: config.enableQueue ?? true,
      enableRetry: config.enableRetry ?? true,
      enableValidation: config.enableValidation ?? true,
      enableLogging: config.enableLogging ?? true,
      maxRetries: config.maxRetries ?? 3,
      retryDelay: config.retryDelay ?? 1000,
      queueMaxSize: config.queueMaxSize ?? 100,
      processingTimeout: config.processingTimeout ?? 30000,
    };

    this.setupGlobalErrorHandlers();
  }

  /**
   * 웹뷰 설정 및 메시지 리스너 등록
   */
  public setWebview(webview: vscode.Webview): void {
    this.webview = webview;

    // 기존 리스너 제거
    this.disposables.forEach((d) => d.dispose());
    this.disposables = [];

    // 새 메시지 리스너 등록
    const messageListener = webview.onDidReceiveMessage(
      (message: unknown) => this.handleIncomingMessage(message),
      null,
      this.disposables
    );

    this.disposables.push(messageListener);

    if (this.config.enableLogging) {
      console.log("✅ TypedMessageHandler: 웹뷰 설정 완료");
    }
  }

  /**
   * 웹뷰에서 오는 메시지 핸들러 등록
   */
  public onWebviewMessage<T extends WebviewToExtensionMessage>(
    command: T["command"],
    handler: (message: T) => void | Promise<void>
  ): void {
    this.webviewMessageHandlers[command] = handler as any;

    if (this.config.enableLogging) {
      console.log(`📝 핸들러 등록: ${command}`);
    }
  }

  /**
   * 확장에서 웹뷰로 메시지 전송
   */
  public async sendToWebview<T extends ExtensionToWebviewMessage>(
    message: T
  ): Promise<boolean> {
    if (!this.webview) {
      console.error("❌ 웹뷰가 설정되지 않음");
      return false;
    }

    const startTime = performance.now();

    try {
      // 메시지 검증
      if (this.config.enableValidation) {
        const validation = this.validateMessage(message);
        if (!validation.isValid) {
          console.error("❌ 메시지 검증 실패:", validation.error);
          this.messageStats.failed++;
          return false;
        }
      }

      // 메시지에 타임스탬프 및 ID 추가
      const enrichedMessage = this.enrichMessage(message);

      // 큐 사용 여부 확인
      if (this.config.enableQueue && this.shouldQueueMessage(enrichedMessage)) {
        return this.queueMessage(enrichedMessage);
      }

      // 직접 전송
      await this.webview.postMessage(enrichedMessage);

      this.messageStats.sent++;
      this.updateProcessingTime(performance.now() - startTime);

      if (this.config.enableLogging) {
        console.log(`📤 메시지 전송: ${message.command}`, {
          timestamp: enrichedMessage.timestamp,
          id: enrichedMessage.id,
        });
      }

      return true;
    } catch (error) {
      console.error(`❌ 메시지 전송 실패: ${message.command}`, error);
      this.messageStats.failed++;

      // 재시도 로직
      if (this.config.enableRetry) {
        return this.retryMessage(message);
      }

      return false;
    }
  }

  /**
   * 웹뷰에서 받은 메시지 처리
   */
  private async handleIncomingMessage(message: unknown): Promise<void> {
    const startTime = performance.now();

    try {
      // 메시지 검증
      if (this.config.enableValidation) {
        const validation = this.validateIncomingMessage(message);
        if (!validation.isValid) {
          console.error("❌ 받은 메시지 검증 실패:", validation.error);
          this.messageStats.failed++;
          return;
        }
      }

      const typedMessage = message as WebviewToExtensionMessage;
      this.messageStats.received++;

      if (this.config.enableLogging) {
        console.log(`📨 메시지 수신: ${typedMessage.command}`, {
          timestamp: typedMessage.timestamp,
          id: typedMessage.id,
        });
      }

      // 핸들러 실행
      const handler = this.webviewMessageHandlers[typedMessage.command];
      if (handler) {
        // 타입 안전성을 위해 명시적 타입 캐스팅
        await (handler as MessageHandler<WebviewToExtensionMessage>)(
          typedMessage
        );
        this.updateProcessingTime(performance.now() - startTime);
      } else {
        console.warn(`⚠️ 핸들러가 등록되지 않음: ${typedMessage.command}`);
      }
    } catch (error) {
      console.error("❌ 메시지 처리 중 오류:", error);
      this.messageStats.failed++;

      // 오류를 웹뷰에 알림
      await this.sendToWebview({
        command: "showError",
        message: "메시지 처리 중 오류가 발생했습니다.",
      });
    }
  }

  /**
   * 메시지 검증
   */
  private validateMessage(message: BaseMessage): MessageValidationResult {
    // 기본 구조 검증
    if (!message || typeof message !== "object") {
      return {
        isValid: false,
        error: "메시지가 객체가 아닙니다.",
      };
    }

    if (!message.command || typeof message.command !== "string") {
      return {
        isValid: false,
        error: "command 필드가 필요합니다.",
      };
    }

    // 메시지별 세부 검증
    if (!this.validateMessageContent(message)) {
      return {
        isValid: false,
        error: "메시지 내용이 유효하지 않습니다.",
      };
    }

    return {
      isValid: true,
      sanitizedMessage: this.sanitizeMessage(message),
    };
  }

  /**
   * 받은 메시지 검증
   */
  private validateIncomingMessage(message: unknown): MessageValidationResult {
    if (!message || typeof message !== "object") {
      return {
        isValid: false,
        error: "메시지가 객체가 아닙니다.",
      };
    }

    const msg = message as Record<string, unknown>;

    if (!msg.command || typeof msg.command !== "string") {
      return {
        isValid: false,
        error: "command 필드가 필요합니다.",
      };
    }

    // 알려진 명령인지 확인
    const knownCommands = [
      "generateCode",
      "generateCodeStreaming",
      "generateBugFixStreaming",
      "modelSelected",
      "stopStreaming",
      "getHistory",
      "clearAllHistory",
      "confirmClearAllHistory",
      "loadHistoryItem",
      "deleteHistoryItem",
      "openMainDashboard",
      "openSettings",
      "showHelp",
      "insertCode",
      "showInfo",
    ];

    if (!knownCommands.includes(msg.command)) {
      return {
        isValid: false,
        error: `알 수 없는 명령: ${msg.command}`,
      };
    }

    return { isValid: true };
  }

  /**
   * 메시지 내용 검증
   */
  private validateMessageContent(message: BaseMessage): boolean {
    switch (message.command) {
      case "generateCode":
      case "generateCodeStreaming":
      case "generateBugFixStreaming":
        const genMsg = message as any;
        return (
          typeof genMsg.question === "string" &&
          genMsg.question.trim().length > 0
        );

      case "modelSelected":
        const modelMsg = message as any;
        const validModels: ModelType[] = [
          "autocomplete",
          "prompt",
          "comment",
          "error_fix",
        ];
        return validModels.includes(modelMsg.modelType);

      case "insertCode":
        const codeMsg = message as any;
        return typeof codeMsg.code === "string";

      case "loadHistoryItem":
      case "deleteHistoryItem":
        const historyMsg = message as any;
        return typeof historyMsg.index === "number" && historyMsg.index >= 0;

      default:
        return true; // 기본적으로 허용
    }
  }

  /**
   * 메시지 정제
   */
  private sanitizeMessage(message: BaseMessage): BaseMessage {
    const sanitized = { ...message };

    // XSS 방지를 위한 문자열 정제
    Object.keys(sanitized).forEach((key) => {
      const value = (sanitized as any)[key];
      if (typeof value === "string") {
        (sanitized as any)[key] = value
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
          .replace(/javascript:/gi, "")
          .replace(/on\w+\s*=/gi, "");
      }
    });

    return sanitized;
  }

  /**
   * 메시지 강화 (타임스탬프, ID 추가)
   */
  private enrichMessage(message: BaseMessage): BaseMessage {
    return {
      ...message,
      timestamp: message.timestamp ?? Date.now(),
      id: message.id ?? this.generateMessageId(),
    };
  }

  /**
   * 메시지 ID 생성
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 메시지 큐 여부 판단
   */
  private shouldQueueMessage(message: BaseMessage): boolean {
    // 스트리밍 메시지는 큐에 넣지 않음 (실시간 처리 필요)
    const immediateCommands = [
      "streamingChunk",
      "streamingComplete",
      "streamingError",
      "streamingStarted",
    ];
    return !immediateCommands.includes(message.command);
  }

  /**
   * 메시지 큐에 추가
   */
  private queueMessage(message: BaseMessage): boolean {
    if (this.messageQueue.length >= this.config.queueMaxSize) {
      console.warn("⚠️ 메시지 큐가 가득참 - 오래된 메시지 제거");
      this.messageQueue.shift(); // 가장 오래된 메시지 제거
    }

    const queuedMessage: QueuedMessage = {
      message,
      timestamp: Date.now(),
      id: message.id || this.generateMessageId(),
      retryCount: 0,
      maxRetries: this.config.maxRetries,
    };

    this.messageQueue.push(queuedMessage);
    this.processQueue();

    return true;
  }

  /**
   * 메시지 큐 처리
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.messageQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      while (this.messageQueue.length > 0) {
        const queuedMessage = this.messageQueue.shift()!;

        try {
          await this.webview?.postMessage(queuedMessage.message);
          this.messageStats.sent++;

          if (this.config.enableLogging) {
            console.log(`📤 큐 메시지 전송: ${queuedMessage.message.command}`);
          }
        } catch (error) {
          console.error(
            `❌ 큐 메시지 전송 실패: ${queuedMessage.message.command}`,
            error
          );

          // 재시도 로직
          if (queuedMessage.retryCount < queuedMessage.maxRetries) {
            queuedMessage.retryCount++;
            this.messageQueue.unshift(queuedMessage); // 큐 앞쪽에 다시 추가
            this.messageStats.retried++;

            // 지연 후 재시도
            await new Promise((resolve) =>
              setTimeout(resolve, this.config.retryDelay)
            );
          } else {
            this.messageStats.failed++;
          }
        }
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  /**
   * 메시지 재시도
   */
  private async retryMessage(
    message: BaseMessage,
    retryCount = 0
  ): Promise<boolean> {
    if (retryCount >= this.config.maxRetries) {
      console.error(`❌ 최대 재시도 횟수 초과: ${message.command}`);
      return false;
    }

    await new Promise((resolve) =>
      setTimeout(resolve, this.config.retryDelay * (retryCount + 1))
    );

    try {
      await this.webview?.postMessage(message);
      this.messageStats.sent++;
      this.messageStats.retried++;

      if (this.config.enableLogging) {
        console.log(
          `🔄 재시도 성공: ${message.command} (${retryCount + 1}/${
            this.config.maxRetries
          })`
        );
      }

      return true;
    } catch (error) {
      console.error(
        `❌ 재시도 실패: ${message.command} (${retryCount + 1}/${
          this.config.maxRetries
        })`,
        error
      );
      return this.retryMessage(message, retryCount + 1);
    }
  }

  /**
   * 처리 시간 업데이트
   */
  private updateProcessingTime(processingTime: number): void {
    const totalMessages = this.messageStats.sent + this.messageStats.received;
    this.messageStats.averageProcessingTime =
      (this.messageStats.averageProcessingTime * (totalMessages - 1) +
        processingTime) /
      totalMessages;
  }

  /**
   * 전역 오류 핸들러 설정
   */
  private setupGlobalErrorHandlers(): void {
    process.on("uncaughtException", (error) => {
      console.error("❌ TypedMessageHandler 전역 오류:", error);
      this.messageStats.failed++;
    });

    process.on("unhandledRejection", (reason) => {
      console.error(
        "❌ TypedMessageHandler 처리되지 않은 Promise 거부:",
        reason
      );
      this.messageStats.failed++;
    });
  }

  /**
   * 통계 조회
   */
  public getStats(): MessageStats {
    return { ...this.messageStats };
  }

  /**
   * 큐 상태 조회
   */
  public getQueueStatus(): { size: number; isProcessing: boolean } {
    return {
      size: this.messageQueue.length,
      isProcessing: this.isProcessingQueue,
    };
  }

  /**
   * 큐 초기화
   */
  public clearQueue(): void {
    this.messageQueue = [];
    this.isProcessingQueue = false;

    if (this.config.enableLogging) {
      console.log("🧹 메시지 큐 초기화 완료");
    }
  }

  /**
   * 설정 업데이트
   */
  public updateConfig(newConfig: Partial<TypedMessageHandlerConfig>): void {
    this.config = { ...this.config, ...newConfig };

    if (this.config.enableLogging) {
      console.log("⚙️ TypedMessageHandler 설정 업데이트:", newConfig);
    }
  }

  /**
   * 리소스 정리
   */
  public dispose(): void {
    this.disposables.forEach((d) => d.dispose());
    this.disposables = [];
    this.clearQueue();
    this.webview = null;

    if (this.config.enableLogging) {
      console.log("🗑️ TypedMessageHandler 리소스 정리 완료");
    }
  }
}

/**
 * 싱글톤 인스턴스 (옵션)
 */
let globalTypedMessageHandler: TypedMessageHandler | null = null;

export function getGlobalTypedMessageHandler(
  config?: TypedMessageHandlerConfig
): TypedMessageHandler {
  if (!globalTypedMessageHandler) {
    globalTypedMessageHandler = new TypedMessageHandler(config);
  }
  return globalTypedMessageHandler;
}

export function disposeGlobalTypedMessageHandler(): void {
  if (globalTypedMessageHandler) {
    globalTypedMessageHandler.dispose();
    globalTypedMessageHandler = null;
  }
}
