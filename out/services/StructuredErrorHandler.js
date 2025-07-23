"use strict";
/**
 * 구조화된 에러 처리기 - VSCode Extension
 * 에러를 카테고리별로 분류하고 사용자에게 적절한 대응 방안 제시
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.structuredErrorHandler = exports.StructuredErrorHandler = exports.ErrorInfoGenerator = exports.ErrorClassifier = exports.ErrorSeverity = exports.ErrorCategory = void 0;
const vscode = __importStar(require("vscode"));
const UnifiedStateManager_1 = require("../core/UnifiedStateManager");
var ErrorCategory;
(function (ErrorCategory) {
    ErrorCategory["NETWORK"] = "NETWORK";
    ErrorCategory["API_KEY"] = "API_KEY";
    ErrorCategory["TIMEOUT"] = "TIMEOUT";
    ErrorCategory["VALIDATION"] = "VALIDATION";
    ErrorCategory["STREAMING"] = "STREAMING";
    ErrorCategory["MEMORY"] = "MEMORY";
    ErrorCategory["RATE_LIMIT"] = "RATE_LIMIT";
    ErrorCategory["SERVER_ERROR"] = "SERVER_ERROR";
    ErrorCategory["AUTHENTICATION"] = "AUTHENTICATION";
    ErrorCategory["PERMISSION"] = "PERMISSION";
    ErrorCategory["CONFIGURATION"] = "CONFIGURATION";
    ErrorCategory["UNKNOWN"] = "UNKNOWN";
})(ErrorCategory || (exports.ErrorCategory = ErrorCategory = {}));
var ErrorSeverity;
(function (ErrorSeverity) {
    ErrorSeverity["LOW"] = "low";
    ErrorSeverity["MEDIUM"] = "medium";
    ErrorSeverity["HIGH"] = "high";
    ErrorSeverity["CRITICAL"] = "critical";
})(ErrorSeverity || (exports.ErrorSeverity = ErrorSeverity = {}));
/**
 * 에러 분류기
 */
class ErrorClassifier {
    errorPatterns = {
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
    classify(error, context) {
        const errorMessage = error.message.toLowerCase();
        const errorStack = error.stack?.toLowerCase() || "";
        const fullText = `${errorMessage} ${errorStack}`;
        // HTTP 상태 코드 기반 분류
        if (context?.requestData?.status) {
            const statusCode = context.requestData.status;
            for (const [category, config] of Object.entries(this.errorPatterns)) {
                if (config.httpCodes?.includes(statusCode)) {
                    return category;
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
                    return category;
                }
            }
            // 키워드 검사
            for (const keyword of config.keywords) {
                if (fullText.includes(keyword.toLowerCase())) {
                    return category;
                }
            }
        }
        return ErrorCategory.UNKNOWN;
    }
}
exports.ErrorClassifier = ErrorClassifier;
/**
 * 에러 정보 생성기
 */
class ErrorInfoGenerator {
    errorTemplates = {
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
    generateErrorInfo(category, error, context) {
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
    generateErrorCode(category, error) {
        const categoryCode = category.substring(0, 3).toUpperCase();
        const timestamp = Date.now().toString().slice(-6);
        const errorHash = this.simpleHash(error.message).toString(16).slice(-3);
        return `${categoryCode}_${timestamp}_${errorHash}`;
    }
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash; // 32bit integer로 변환
        }
        return Math.abs(hash);
    }
    createActionHandler(action, error, context) {
        return async () => {
            try {
                switch (action.type) {
                    case "retry":
                        // 재시도 로직은 호출자에서 구현
                        console.log(`재시도 액션 실행: ${action.label}`);
                        break;
                    case "reload":
                        // VSCode 확장 재시작
                        await vscode.commands.executeCommand("workbench.action.reloadWindow");
                        break;
                    case "settings":
                        // 설정 창 열기
                        await vscode.commands.executeCommand("workbench.action.openSettings", "@ext:hancom-ai");
                        break;
                    case "contact":
                        // 지원팀 문의 (이메일 또는 웹사이트)
                        const mailto = "mailto:support@hancom.com?subject=HAPA 오류 보고&body=" +
                            encodeURIComponent(`오류 코드: ${context?.operation || "N/A"}\n오류 메시지: ${error.message}`);
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
            }
            catch (actionError) {
                console.error(`액션 실행 실패 (${action.type}):`, actionError);
            }
        };
    }
}
exports.ErrorInfoGenerator = ErrorInfoGenerator;
/**
 * 구조화된 에러 처리기 메인 클래스
 */
class StructuredErrorHandler {
    classifier = new ErrorClassifier();
    infoGenerator = new ErrorInfoGenerator();
    errorHistory = [];
    maxHistorySize = 100;
    constructor() {
        // 상태 관리자에 에러 리스너 등록
        this.setupStateListeners();
    }
    setupStateListeners() {
        // 통합 상태 관리자의 API 오류 감지
        UnifiedStateManager_1.unifiedStateManager.addListener("api.lastError", (path, newValue, oldValue) => {
            if (newValue && newValue !== oldValue) {
                this.handleError(newValue, {
                    timestamp: Date.now(),
                    operation: "api_call",
                    systemInfo: this.getSystemInfo(),
                });
            }
        });
    }
    /**
     * 에러 처리 메인 메서드
     */
    async handleError(error, context, customCategory) {
        const fullContext = {
            timestamp: Date.now(),
            operation: "unknown",
            systemInfo: this.getSystemInfo(),
            ...context,
        };
        const category = customCategory || this.classifier.classify(error, fullContext);
        const errorInfo = this.infoGenerator.generateErrorInfo(category, error, fullContext);
        const errorEvent = {
            id: errorInfo.code,
            error,
            errorInfo,
            context: fullContext,
            resolved: false,
        };
        // 에러 히스토리에 추가
        this.addToHistory(errorEvent);
        // 상태 업데이트
        UnifiedStateManager_1.unifiedStateManager.setState("api.lastError", error);
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
    async displayError(errorEvent) {
        const { errorInfo } = errorEvent;
        // 심각도에 따른 다른 표시 방법
        switch (errorInfo.severity) {
            case ErrorSeverity.CRITICAL:
                // 모달 창으로 표시
                const criticalChoice = await vscode.window.showErrorMessage(`🚨 ${errorInfo.userMessage}`, { modal: true }, ...errorInfo.actions.map((action) => action.label));
                if (criticalChoice) {
                    await this.executeAction(criticalChoice, errorEvent);
                }
                break;
            case ErrorSeverity.HIGH:
                // 에러 메시지로 표시
                const highChoice = await vscode.window.showErrorMessage(`❌ ${errorInfo.userMessage}`, ...errorInfo.actions.slice(0, 3).map((action) => action.label));
                if (highChoice) {
                    await this.executeAction(highChoice, errorEvent);
                }
                break;
            case ErrorSeverity.MEDIUM:
                // 경고 메시지로 표시
                const mediumChoice = await vscode.window.showWarningMessage(`⚠️ ${errorInfo.userMessage}`, ...errorInfo.actions.slice(0, 2).map((action) => action.label));
                if (mediumChoice) {
                    await this.executeAction(mediumChoice, errorEvent);
                }
                break;
            case ErrorSeverity.LOW:
                // 정보 메시지로 표시
                const lowChoice = await vscode.window.showInformationMessage(`ℹ️ ${errorInfo.userMessage}`, ...errorInfo.actions.slice(0, 1).map((action) => action.label));
                if (lowChoice) {
                    await this.executeAction(lowChoice, errorEvent);
                }
                break;
        }
    }
    /**
     * 액션 실행
     */
    async executeAction(actionLabel, errorEvent) {
        const action = errorEvent.errorInfo.actions.find((a) => a.label === actionLabel);
        if (action?.handler) {
            try {
                await action.handler();
                this.markAsResolved(errorEvent.id, `user_action:${action.type}`);
            }
            catch (actionError) {
                console.error(`액션 실행 실패:`, actionError);
            }
        }
    }
    /**
     * 자동 재시도 여부 판단
     */
    shouldAutoRetry(category) {
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
    async attemptAutoRetry(errorEvent) {
        const recentErrors = this.errorHistory
            .filter((e) => e.errorInfo.category === errorEvent.errorInfo.category)
            .filter((e) => Date.now() - e.context.timestamp < 60000).length; // 1분 이내
        // 같은 카테고리 에러가 3회 이상 발생하면 자동 재시도 중단
        if (recentErrors >= 3) {
            console.log(`자동 재시도 중단: ${errorEvent.errorInfo.category} (${recentErrors}회 연속 실패)`);
            return;
        }
        console.log(`자동 복구 시도: ${errorEvent.errorInfo.category}`);
        // 재시도 로직은 호출자에서 구현해야 함
        // 여기서는 상태만 업데이트
        UnifiedStateManager_1.unifiedStateManager.setState("api.isConnected", false);
        setTimeout(() => {
            UnifiedStateManager_1.unifiedStateManager.setState("api.isConnected", true);
        }, 1000);
    }
    /**
     * 에러 해결 표시
     */
    markAsResolved(errorId, resolutionMethod) {
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
    addToHistory(errorEvent) {
        this.errorHistory.unshift(errorEvent);
        // 히스토리 크기 제한
        if (this.errorHistory.length > this.maxHistorySize) {
            this.errorHistory = this.errorHistory.slice(0, this.maxHistorySize);
        }
    }
    /**
     * 시스템 정보 수집
     */
    getSystemInfo() {
        return {
            platform: process.platform,
            vscodeVersion: vscode.version,
            extensionVersion: vscode.extensions.getExtension("hancom-ai.hapa")?.packageJSON
                ?.version || "unknown",
            memory: this.getMemoryUsage(),
        };
    }
    /**
     * 메모리 사용량 측정
     */
    getMemoryUsage() {
        try {
            if (process.memoryUsage) {
                const usage = process.memoryUsage();
                return Math.round(usage.heapUsed / 1024 / 1024); // MB 단위
            }
            return 0;
        }
        catch {
            return 0;
        }
    }
    /**
     * 에러 통계 조회
     */
    getErrorStatistics() {
        const now = Date.now();
        const recentErrors = this.errorHistory.filter((e) => now - e.context.timestamp < 24 * 60 * 60 * 1000); // 24시간
        const categoryStats = {};
        const severityStats = {};
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
            resolutionRate: this.errorHistory.length > 0
                ? resolvedCount / this.errorHistory.length
                : 0,
        };
    }
    /**
     * 에러 히스토리 조회
     */
    getErrorHistory(limit) {
        return limit ? this.errorHistory.slice(0, limit) : [...this.errorHistory];
    }
    /**
     * 에러 진단
     */
    diagnoseSystem() {
        const stats = this.getErrorStatistics();
        const issues = [];
        const recommendations = [];
        // 문제 감지
        if (stats.recentErrors > 10) {
            issues.push(`최근 24시간 동안 ${stats.recentErrors}개의 에러 발생`);
            recommendations.push("시스템 안정성을 확인해주세요");
        }
        if (stats.resolutionRate < 0.7) {
            issues.push(`에러 해결률이 낮음 (${Math.round(stats.resolutionRate * 100)}%)`);
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
        let status = "healthy";
        if (stats.severityStats[ErrorSeverity.CRITICAL] > 0 ||
            stats.recentErrors > 20) {
            status = "critical";
        }
        else if (issues.length > 0) {
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
    reset() {
        this.errorHistory = [];
        console.log("🔄 구조화된 에러 핸들러 리셋 완료");
    }
}
exports.StructuredErrorHandler = StructuredErrorHandler;
// 싱글톤 인스턴스 생성 및 내보내기
exports.structuredErrorHandler = new StructuredErrorHandler();
//# sourceMappingURL=StructuredErrorHandler.js.map