/**
 * 구조화된 에러 처리기 - VSCode Extension
 * 에러를 카테고리별로 분류하고 사용자에게 적절한 대응 방안 제시
 */

import * as vscode from "vscode";
import { unifiedStateManager } from "../core/UnifiedStateManager";

export enum ErrorCategory {
  NETWORK = "NETWORK",
  API_KEY = "API_KEY",
  TIMEOUT = "TIMEOUT",
  VALIDATION = "VALIDATION",
  STREAMING = "STREAMING",
  MEMORY = "MEMORY",
  RATE_LIMIT = "RATE_LIMIT",
  SERVER_ERROR = "SERVER_ERROR",
  AUTHENTICATION = "AUTHENTICATION",
  PERMISSION = "PERMISSION",
  CONFIGURATION = "CONFIGURATION",
  UNKNOWN = "UNKNOWN",
}

export enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export interface ErrorInfo {
  code: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  retryable: boolean;
  userMessage: string;
  technicalMessage: string;
  suggestions: string[];
  actions: ErrorAction[];
  context?: Record<string, any>;
}

export interface ErrorAction {
  type:
    | "retry"
    | "reload"
    | "settings"
    | "contact"
    | "documentation"
    | "custom";
  label: string;
  description: string;
  handler?: () => void | Promise<void>;
  url?: string;
}

export interface ErrorContext {
  timestamp: number;
  userId?: string;
  sessionId?: string;
  operation: string;
  requestData?: any;
  systemInfo: {
    platform: string;
    vscodeVersion: string;
    extensionVersion: string;
    memory?: number;
  };
  userAgent?: string;
}

export interface ErrorEvent {
  id: string;
  error: Error;
  errorInfo: ErrorInfo;
  context: ErrorContext;
  resolved: boolean;
  resolutionTime?: number;
  resolutionMethod?: string;
}

/**
 * 에러 분류기
 */
export class ErrorClassifier {
  private errorPatterns: Record<
    ErrorCategory,
    {
      patterns: RegExp[];
      keywords: string[];
      httpCodes?: number[];
    }
  > = {
    [ErrorCategory.NETWORK]: {
      patterns: [
        /network\s+error/i,
        /connection\s+refused/i,
        /connection\s+timeout/i,
        /network\s+timeout/i,
        /dns\s+error/i,
        /socket\s+error/i,
      ],
      keywords: ["network", "connection", "timeout", "offline", "dns"],
      httpCodes: [0, -1],
    },
    [ErrorCategory.API_KEY]: {
      patterns: [
        /api\s+key/i,
        /invalid\s+key/i,
        /unauthorized/i,
        /authentication\s+failed/i,
      ],
      keywords: ["api key", "unauthorized", "authentication", "token"],
      httpCodes: [401],
    },
    [ErrorCategory.TIMEOUT]: {
      patterns: [
        /timeout/i,
        /request\s+timeout/i,
        /response\s+timeout/i,
        /operation\s+timeout/i,
      ],
      keywords: ["timeout", "exceeded", "expired"],
      httpCodes: [408, 504],
    },
    [ErrorCategory.VALIDATION]: {
      patterns: [
        /validation\s+error/i,
        /invalid\s+input/i,
        /bad\s+request/i,
        /parameter\s+error/i,
      ],
      keywords: ["validation", "invalid", "parameter", "input"],
      httpCodes: [400, 422],
    },
    [ErrorCategory.STREAMING]: {
      patterns: [
        /streaming\s+error/i,
        /chunk\s+error/i,
        /stream\s+closed/i,
        /connection\s+closed/i,
      ],
      keywords: ["streaming", "chunk", "stream", "aborted"],
    },
    [ErrorCategory.MEMORY]: {
      patterns: [
        /out\s+of\s+memory/i,
        /memory\s+error/i,
        /heap\s+error/i,
        /allocation\s+failed/i,
      ],
      keywords: ["memory", "heap", "allocation", "oom"],
    },
    [ErrorCategory.RATE_LIMIT]: {
      patterns: [
        /rate\s+limit/i,
        /too\s+many\s+requests/i,
        /quota\s+exceeded/i,
      ],
      keywords: ["rate limit", "quota", "throttle"],
      httpCodes: [429],
    },
    [ErrorCategory.SERVER_ERROR]: {
      patterns: [
        /server\s+error/i,
        /internal\s+error/i,
        /service\s+unavailable/i,
      ],
      keywords: ["server error", "internal", "unavailable"],
      httpCodes: [500, 502, 503],
    },
    [ErrorCategory.AUTHENTICATION]: {
      patterns: [
        /authentication\s+error/i,
        /login\s+failed/i,
        /access\s+denied/i,
      ],
      keywords: ["authentication", "login", "access denied"],
      httpCodes: [401, 403],
    },
    [ErrorCategory.PERMISSION]: {
      patterns: [
        /permission\s+denied/i,
        /access\s+forbidden/i,
        /insufficient\s+privileges/i,
      ],
      keywords: ["permission", "forbidden", "privileges"],
      httpCodes: [403],
    },
    [ErrorCategory.CONFIGURATION]: {
      patterns: [
        /configuration\s+error/i,
        /config\s+invalid/i,
        /settings\s+error/i,
      ],
      keywords: ["configuration", "config", "settings"],
    },
    [ErrorCategory.UNKNOWN]: {
      patterns: [],
      keywords: [],
    },
  };

  classify(error: Error, context?: ErrorContext): ErrorCategory {
    const errorMessage = error.message.toLowerCase();
    const errorStack = error.stack?.toLowerCase() || "";
    const fullText = `${errorMessage} ${errorStack}`;

    // HTTP 상태 코드 기반 분류
    if (context?.requestData?.status) {
      const statusCode = context.requestData.status;
      for (const [category, config] of Object.entries(this.errorPatterns)) {
        if (config.httpCodes?.includes(statusCode)) {
          return category as ErrorCategory;
        }
      }
    }

    // 패턴 매칭 기반 분류
    for (const [category, config] of Object.entries(this.errorPatterns)) {
      if (category === ErrorCategory.UNKNOWN) {
        continue;
      }

      // 정규식 패턴 검사
      for (const pattern of config.patterns) {
        if (pattern.test(fullText)) {
          return category as ErrorCategory;
        }
      }

      // 키워드 검사
      for (const keyword of config.keywords) {
        if (fullText.includes(keyword.toLowerCase())) {
          return category as ErrorCategory;
        }
      }
    }

    return ErrorCategory.UNKNOWN;
  }
}

/**
 * 에러 정보 생성기
 */
export class ErrorInfoGenerator {
  private errorTemplates: Record<
    ErrorCategory,
    {
      severity: ErrorSeverity;
      retryable: boolean;
      userMessageTemplate: string;
      suggestions: string[];
      actions: Omit<ErrorAction, "handler">[];
    }
  > = {
    [ErrorCategory.NETWORK]: {
      severity: ErrorSeverity.MEDIUM,
      retryable: true,
      userMessageTemplate: "네트워크 연결에 문제가 있습니다",
      suggestions: [
        "인터넷 연결을 확인해주세요",
        "VPN 사용 중인 경우 연결을 확인해주세요",
        "방화벽 설정을 확인해주세요",
        "잠시 후 다시 시도해주세요",
      ],
      actions: [
        {
          type: "retry",
          label: "다시 시도",
          description: "네트워크 연결을 다시 시도합니다",
        },
        {
          type: "settings",
          label: "네트워크 설정",
          description: "네트워크 관련 설정을 확인합니다",
        },
      ],
    },
    [ErrorCategory.API_KEY]: {
      severity: ErrorSeverity.HIGH,
      retryable: false,
      userMessageTemplate: "API 키에 문제가 있습니다",
      suggestions: [
        "API 키가 올바르게 설정되어 있는지 확인해주세요",
        "API 키가 만료되지 않았는지 확인해주세요",
        "API 키에 충분한 권한이 있는지 확인해주세요",
      ],
      actions: [
        {
          type: "settings",
          label: "API 키 설정",
          description: "API 키를 다시 설정합니다",
        },
        {
          type: "documentation",
          label: "도움말 보기",
          description: "API 키 설정 방법을 확인합니다",
          url: "https://docs.example.com/api-key-setup",
        },
      ],
    },
    [ErrorCategory.TIMEOUT]: {
      severity: ErrorSeverity.MEDIUM,
      retryable: true,
      userMessageTemplate: "요청 시간이 초과되었습니다",
      suggestions: [
        "네트워크 연결이 안정적인지 확인해주세요",
        "요청을 더 간단하게 나누어 시도해보세요",
        "잠시 후 다시 시도해주세요",
      ],
      actions: [
        {
          type: "retry",
          label: "다시 시도",
          description: "요청을 다시 시도합니다",
        },
        {
          type: "settings",
          label: "타임아웃 설정",
          description: "타임아웃 시간을 조정합니다",
        },
      ],
    },
    [ErrorCategory.VALIDATION]: {
      severity: ErrorSeverity.LOW,
      retryable: false,
      userMessageTemplate: "입력값에 문제가 있습니다",
      suggestions: [
        "입력한 내용을 다시 확인해주세요",
        "특수 문자나 긴 텍스트를 줄여보세요",
        "다른 방식으로 질문을 작성해보세요",
      ],
      actions: [
        {
          type: "custom",
          label: "입력 확인",
          description: "입력 내용을 다시 확인합니다",
        },
      ],
    },
    [ErrorCategory.STREAMING]: {
      severity: ErrorSeverity.MEDIUM,
      retryable: true,
      userMessageTemplate: "스트리밍 처리 중 오류가 발생했습니다",
      suggestions: [
        "연결이 안정적인지 확인해주세요",
        "브라우저를 새로고침해보세요",
        "다시 시도해주세요",
      ],
      actions: [
        {
          type: "retry",
          label: "다시 시도",
          description: "스트리밍을 다시 시작합니다",
        },
        {
          type: "reload",
          label: "새로고침",
          description: "확장을 새로고침합니다",
        },
      ],
    },
    [ErrorCategory.MEMORY]: {
      severity: ErrorSeverity.HIGH,
      retryable: false,
      userMessageTemplate: "메모리 부족으로 처리할 수 없습니다",
      suggestions: [
        "VSCode를 재시작해보세요",
        "다른 확장이나 탭을 닫아보세요",
        "요청을 더 작게 나누어 시도해보세요",
      ],
      actions: [
        {
          type: "reload",
          label: "확장 재시작",
          description: "VSCode 확장을 재시작합니다",
        },
        {
          type: "custom",
          label: "메모리 정리",
          description: "메모리를 정리합니다",
        },
      ],
    },
    [ErrorCategory.RATE_LIMIT]: {
      severity: ErrorSeverity.MEDIUM,
      retryable: true,
      userMessageTemplate: "요청 한도를 초과했습니다",
      suggestions: [
        "잠시 후 다시 시도해주세요",
        "요청 빈도를 줄여주세요",
        "API 플랜을 확인해주세요",
      ],
      actions: [
        {
          type: "custom",
          label: "대기 후 재시도",
          description: "잠시 대기 후 자동으로 재시도합니다",
        },
        {
          type: "documentation",
          label: "사용량 확인",
          description: "API 사용량을 확인합니다",
          url: "https://docs.example.com/rate-limits",
        },
      ],
    },
    [ErrorCategory.SERVER_ERROR]: {
      severity: ErrorSeverity.HIGH,
      retryable: true,
      userMessageTemplate: "서버에 일시적인 문제가 있습니다",
      suggestions: [
        "잠시 후 다시 시도해주세요",
        "서버 상태를 확인해주세요",
        "문제가 지속되면 지원팀에 문의해주세요",
      ],
      actions: [
        {
          type: "retry",
          label: "다시 시도",
          description: "요청을 다시 시도합니다",
        },
        {
          type: "contact",
          label: "지원팀 문의",
          description: "기술 지원팀에 문의합니다",
        },
      ],
    },
    [ErrorCategory.AUTHENTICATION]: {
      severity: ErrorSeverity.HIGH,
      retryable: false,
      userMessageTemplate: "인증에 실패했습니다",
      suggestions: [
        "로그인 정보를 확인해주세요",
        "세션이 만료되었을 수 있습니다",
        "다시 로그인해주세요",
      ],
      actions: [
        {
          type: "settings",
          label: "인증 설정",
          description: "인증 정보를 다시 설정합니다",
        },
        {
          type: "custom",
          label: "다시 로그인",
          description: "로그인을 다시 수행합니다",
        },
      ],
    },
    [ErrorCategory.PERMISSION]: {
      severity: ErrorSeverity.HIGH,
      retryable: false,
      userMessageTemplate: "권한이 부족합니다",
      suggestions: [
        "필요한 권한이 있는지 확인해주세요",
        "관리자에게 문의해주세요",
        "다른 계정으로 시도해보세요",
      ],
      actions: [
        {
          type: "contact",
          label: "관리자 문의",
          description: "시스템 관리자에게 문의합니다",
        },
        {
          type: "documentation",
          label: "권한 가이드",
          description: "필요한 권한에 대해 알아봅니다",
          url: "https://docs.example.com/permissions",
        },
      ],
    },
    [ErrorCategory.CONFIGURATION]: {
      severity: ErrorSeverity.MEDIUM,
      retryable: false,
      userMessageTemplate: "설정에 문제가 있습니다",
      suggestions: [
        "확장 설정을 확인해주세요",
        "기본값으로 재설정해보세요",
        "설정 파일을 확인해주세요",
      ],
      actions: [
        {
          type: "settings",
          label: "설정 확인",
          description: "확장 설정을 확인합니다",
        },
        {
          type: "custom",
          label: "기본값 복원",
          description: "설정을 기본값으로 복원합니다",
        },
      ],
    },
    [ErrorCategory.UNKNOWN]: {
      severity: ErrorSeverity.MEDIUM,
      retryable: true,
      userMessageTemplate: "예상치 못한 오류가 발생했습니다",
      suggestions: [
        "다시 시도해주세요",
        "VSCode를 재시작해보세요",
        "문제가 지속되면 지원팀에 문의해주세요",
      ],
      actions: [
        {
          type: "retry",
          label: "다시 시도",
          description: "작업을 다시 시도합니다",
        },
        {
          type: "reload",
          label: "확장 재시작",
          description: "확장을 재시작합니다",
        },
        {
          type: "contact",
          label: "지원팀 문의",
          description: "기술 지원팀에 문의합니다",
        },
      ],
    },
  };

  generateErrorInfo(
    category: ErrorCategory,
    error: Error,
    context?: ErrorContext
  ): ErrorInfo {
    const template = this.errorTemplates[category];
    const errorCode = this.generateErrorCode(category, error);

    return {
      code: errorCode,
      category,
      severity: template.severity,
      retryable: template.retryable,
      userMessage: template.userMessageTemplate,
      technicalMessage: error.message,
      suggestions: template.suggestions,
      actions: template.actions.map((action) => ({
        ...action,
        handler: this.createActionHandler(action, error, context),
      })),
      context: context || {},
    };
  }

  private generateErrorCode(category: ErrorCategory, error: Error): string {
    const categoryCode = category.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    const errorHash = this.simpleHash(error.message).toString(16).slice(-3);

    return `${categoryCode}_${timestamp}_${errorHash}`;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // 32bit integer로 변환
    }
    return Math.abs(hash);
  }

  private createActionHandler(
    action: Omit<ErrorAction, "handler">,
    error: Error,
    context?: ErrorContext
  ): () => void | Promise<void> {
    return async () => {
      try {
        switch (action.type) {
          case "retry":
            // 재시도 로직은 호출자에서 구현
            console.log(`재시도 액션 실행: ${action.label}`);
            break;

          case "reload":
            // VSCode 확장 재시작
            await vscode.commands.executeCommand(
              "workbench.action.reloadWindow"
            );
            break;

          case "settings":
            // 설정 창 열기
            await vscode.commands.executeCommand(
              "workbench.action.openSettings",
              "@ext:hancom-ai"
            );
            break;

          case "contact":
            // 지원팀 문의 (이메일 또는 웹사이트)
            const mailto =
              "mailto:support@hancom.com?subject=HAPA 오류 보고&body=" +
              encodeURIComponent(
                `오류 코드: ${context?.operation || "N/A"}\n오류 메시지: ${
                  error.message
                }`
              );
            await vscode.env.openExternal(vscode.Uri.parse(mailto));
            break;

          case "documentation":
            // 문서 링크 열기
            if (action.url) {
              await vscode.env.openExternal(vscode.Uri.parse(action.url));
            }
            break;

          case "custom":
            // 커스텀 액션은 개별 구현
            console.log(`커스텀 액션 실행: ${action.label}`);
            break;
        }
      } catch (actionError) {
        console.error(`액션 실행 실패 (${action.type}):`, actionError);
      }
    };
  }
}

/**
 * 구조화된 에러 처리기 메인 클래스
 */
export class StructuredErrorHandler {
  private classifier = new ErrorClassifier();
  private infoGenerator = new ErrorInfoGenerator();
  private errorHistory: ErrorEvent[] = [];
  private readonly maxHistorySize = 100;

  constructor() {
    // 상태 관리자에 에러 리스너 등록
    this.setupStateListeners();
  }

  private setupStateListeners(): void {
    // 통합 상태 관리자의 API 오류 감지
    unifiedStateManager.addListener(
      "api.lastError",
      (path, newValue, oldValue) => {
        if (newValue && newValue !== oldValue) {
          this.handleError(newValue, {
            timestamp: Date.now(),
            operation: "api_call",
            systemInfo: this.getSystemInfo(),
          });
        }
      }
    );
  }

  /**
   * 에러 처리 메인 메서드
   */
  async handleError(
    error: Error,
    context: Partial<ErrorContext>,
    customCategory?: ErrorCategory
  ): Promise<ErrorEvent> {
    const fullContext: ErrorContext = {
      timestamp: Date.now(),
      operation: "unknown",
      systemInfo: this.getSystemInfo(),
      ...context,
    };

    const category =
      customCategory || this.classifier.classify(error, fullContext);
    const errorInfo = this.infoGenerator.generateErrorInfo(
      category,
      error,
      fullContext
    );

    const errorEvent: ErrorEvent = {
      id: errorInfo.code,
      error,
      errorInfo,
      context: fullContext,
      resolved: false,
    };

    // 에러 히스토리에 추가
    this.addToHistory(errorEvent);

    // 상태 업데이트
    unifiedStateManager.setState("api.lastError", error);

    // 에러 표시
    await this.displayError(errorEvent);

    // 자동 복구 시도
    if (errorInfo.retryable && this.shouldAutoRetry(category)) {
      setTimeout(() => this.attemptAutoRetry(errorEvent), 2000);
    }

    console.error(`🚨 구조화된 에러 처리:`, {
      code: errorInfo.code,
      category: category,
      severity: errorInfo.severity,
      retryable: errorInfo.retryable,
      error: error.message,
      context: fullContext,
    });

    return errorEvent;
  }

  /**
   * 에러 표시
   */
  private async displayError(errorEvent: ErrorEvent): Promise<void> {
    const { errorInfo } = errorEvent;

    // 심각도에 따른 다른 표시 방법
    switch (errorInfo.severity) {
      case ErrorSeverity.CRITICAL:
        // 모달 창으로 표시
        const criticalChoice = await vscode.window.showErrorMessage(
          `🚨 ${errorInfo.userMessage}`,
          { modal: true },
          ...errorInfo.actions.map((action) => action.label)
        );
        if (criticalChoice) {
          await this.executeAction(criticalChoice, errorEvent);
        }
        break;

      case ErrorSeverity.HIGH:
        // 에러 메시지로 표시
        const highChoice = await vscode.window.showErrorMessage(
          `❌ ${errorInfo.userMessage}`,
          ...errorInfo.actions.slice(0, 3).map((action) => action.label)
        );
        if (highChoice) {
          await this.executeAction(highChoice, errorEvent);
        }
        break;

      case ErrorSeverity.MEDIUM:
        // 경고 메시지로 표시
        const mediumChoice = await vscode.window.showWarningMessage(
          `⚠️ ${errorInfo.userMessage}`,
          ...errorInfo.actions.slice(0, 2).map((action) => action.label)
        );
        if (mediumChoice) {
          await this.executeAction(mediumChoice, errorEvent);
        }
        break;

      case ErrorSeverity.LOW:
        // 정보 메시지로 표시
        const lowChoice = await vscode.window.showInformationMessage(
          `ℹ️ ${errorInfo.userMessage}`,
          ...errorInfo.actions.slice(0, 1).map((action) => action.label)
        );
        if (lowChoice) {
          await this.executeAction(lowChoice, errorEvent);
        }
        break;
    }
  }

  /**
   * 액션 실행
   */
  private async executeAction(
    actionLabel: string,
    errorEvent: ErrorEvent
  ): Promise<void> {
    const action = errorEvent.errorInfo.actions.find(
      (a) => a.label === actionLabel
    );
    if (action?.handler) {
      try {
        await action.handler();
        this.markAsResolved(errorEvent.id, `user_action:${action.type}`);
      } catch (actionError) {
        console.error(`액션 실행 실패:`, actionError);
      }
    }
  }

  /**
   * 자동 재시도 여부 판단
   */
  private shouldAutoRetry(category: ErrorCategory): boolean {
    const autoRetryCategories = [
      ErrorCategory.NETWORK,
      ErrorCategory.TIMEOUT,
      ErrorCategory.SERVER_ERROR,
    ];

    return autoRetryCategories.includes(category);
  }

  /**
   * 자동 복구 시도
   */
  private async attemptAutoRetry(errorEvent: ErrorEvent): Promise<void> {
    const recentErrors = this.errorHistory
      .filter((e) => e.errorInfo.category === errorEvent.errorInfo.category)
      .filter((e) => Date.now() - e.context.timestamp < 60000).length; // 1분 이내

    // 같은 카테고리 에러가 3회 이상 발생하면 자동 재시도 중단
    if (recentErrors >= 3) {
      console.log(
        `자동 재시도 중단: ${errorEvent.errorInfo.category} (${recentErrors}회 연속 실패)`
      );
      return;
    }

    console.log(`자동 복구 시도: ${errorEvent.errorInfo.category}`);

    // 재시도 로직은 호출자에서 구현해야 함
    // 여기서는 상태만 업데이트
    unifiedStateManager.setState("api.isConnected", false);

    setTimeout(() => {
      unifiedStateManager.setState("api.isConnected", true);
    }, 1000);
  }

  /**
   * 에러 해결 표시
   */
  markAsResolved(errorId: string, resolutionMethod: string): void {
    const errorEvent = this.errorHistory.find((e) => e.id === errorId);
    if (errorEvent) {
      errorEvent.resolved = true;
      errorEvent.resolutionTime = Date.now();
      errorEvent.resolutionMethod = resolutionMethod;

      console.log(`✅ 에러 해결: ${errorId} (${resolutionMethod})`);
    }
  }

  /**
   * 에러 히스토리에 추가
   */
  private addToHistory(errorEvent: ErrorEvent): void {
    this.errorHistory.unshift(errorEvent);

    // 히스토리 크기 제한
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(0, this.maxHistorySize);
    }
  }

  /**
   * 시스템 정보 수집
   */
  private getSystemInfo(): ErrorContext["systemInfo"] {
    return {
      platform: process.platform,
      vscodeVersion: vscode.version,
      extensionVersion:
        vscode.extensions.getExtension("hancom-ai.hapa")?.packageJSON
          ?.version || "unknown",
      memory: this.getMemoryUsage(),
    };
  }

  /**
   * 메모리 사용량 측정
   */
  private getMemoryUsage(): number {
    try {
      if (process.memoryUsage) {
        const usage = process.memoryUsage();
        return Math.round(usage.heapUsed / 1024 / 1024); // MB 단위
      }
      return 0;
    } catch {
      return 0;
    }
  }

  /**
   * 에러 통계 조회
   */
  getErrorStatistics(): {
    totalErrors: number;
    resolvedErrors: number;
    categoryStats: Record<ErrorCategory, number>;
    severityStats: Record<ErrorSeverity, number>;
    recentErrors: number;
    resolutionRate: number;
  } {
    const now = Date.now();
    const recentErrors = this.errorHistory.filter(
      (e) => now - e.context.timestamp < 24 * 60 * 60 * 1000
    ); // 24시간

    const categoryStats = {} as Record<ErrorCategory, number>;
    const severityStats = {} as Record<ErrorSeverity, number>;

    for (const category of Object.values(ErrorCategory)) {
      categoryStats[category] = 0;
    }

    for (const severity of Object.values(ErrorSeverity)) {
      severityStats[severity] = 0;
    }

    this.errorHistory.forEach((error) => {
      categoryStats[error.errorInfo.category]++;
      severityStats[error.errorInfo.severity]++;
    });

    const resolvedCount = this.errorHistory.filter((e) => e.resolved).length;

    return {
      totalErrors: this.errorHistory.length,
      resolvedErrors: resolvedCount,
      categoryStats,
      severityStats,
      recentErrors: recentErrors.length,
      resolutionRate:
        this.errorHistory.length > 0
          ? resolvedCount / this.errorHistory.length
          : 0,
    };
  }

  /**
   * 에러 히스토리 조회
   */
  getErrorHistory(limit?: number): ErrorEvent[] {
    return limit ? this.errorHistory.slice(0, limit) : [...this.errorHistory];
  }

  /**
   * 에러 진단
   */
  diagnoseSystem(): {
    status: "healthy" | "warning" | "critical";
    issues: string[];
    recommendations: string[];
    stats: {
      totalErrors: number;
      resolvedErrors: number;
      categoryStats: Record<ErrorCategory, number>;
      severityStats: Record<ErrorSeverity, number>;
      recentErrors: number;
      resolutionRate: number;
    };
  } {
    const stats = this.getErrorStatistics();
    const issues: string[] = [];
    const recommendations: string[] = [];

    // 문제 감지
    if (stats.recentErrors > 10) {
      issues.push(`최근 24시간 동안 ${stats.recentErrors}개의 에러 발생`);
      recommendations.push("시스템 안정성을 확인해주세요");
    }

    if (stats.resolutionRate < 0.7) {
      issues.push(
        `에러 해결률이 낮음 (${Math.round(stats.resolutionRate * 100)}%)`
      );
      recommendations.push("에러 대응 방안을 검토해주세요");
    }

    if (stats.categoryStats[ErrorCategory.NETWORK] > 5) {
      issues.push("네트워크 에러가 빈번함");
      recommendations.push("네트워크 연결을 확인해주세요");
    }

    if (stats.severityStats[ErrorSeverity.CRITICAL] > 0) {
      issues.push("치명적 에러 발생");
      recommendations.push("즉시 시스템을 점검해주세요");
    }

    // 상태 판단
    let status: "healthy" | "warning" | "critical" = "healthy";
    if (
      stats.severityStats[ErrorSeverity.CRITICAL] > 0 ||
      stats.recentErrors > 20
    ) {
      status = "critical";
    } else if (issues.length > 0) {
      status = "warning";
    }

    return {
      status,
      issues,
      recommendations,
      stats,
    };
  }

  /**
   * 에러 핸들러 리셋
   */
  reset(): void {
    this.errorHistory = [];
    console.log("🔄 구조화된 에러 핸들러 리셋 완료");
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
export const structuredErrorHandler = new StructuredErrorHandler();
