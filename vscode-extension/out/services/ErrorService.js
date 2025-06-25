"use strict";
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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorService = exports.ErrorSeverity = exports.ErrorCategory = void 0;
const vscode = __importStar(require("vscode"));
/**
 * 에러 카테고리 열거형
 */
var ErrorCategory;
(function (ErrorCategory) {
    ErrorCategory["API"] = "api";
    ErrorCategory["NETWORK"] = "network";
    ErrorCategory["CONFIGURATION"] = "configuration";
    ErrorCategory["USER_INPUT"] = "user_input";
    ErrorCategory["SYSTEM"] = "system";
    ErrorCategory["UNKNOWN"] = "unknown";
})(ErrorCategory = exports.ErrorCategory || (exports.ErrorCategory = {}));
/**
 * 에러 심각도 열거형
 */
var ErrorSeverity;
(function (ErrorSeverity) {
    ErrorSeverity["LOW"] = "low";
    ErrorSeverity["MEDIUM"] = "medium";
    ErrorSeverity["HIGH"] = "high";
    ErrorSeverity["CRITICAL"] = "critical";
})(ErrorSeverity = exports.ErrorSeverity || (exports.ErrorSeverity = {}));
/**
 * 에러 서비스 클래스
 */
class ErrorService {
    static instance;
    errorHistory = [];
    maxHistorySize = 100;
    constructor() { }
    /**
     * 싱글톤 인스턴스 반환
     */
    static getInstance() {
        if (!ErrorService.instance) {
            ErrorService.instance = new ErrorService();
        }
        return ErrorService.instance;
    }
    /**
     * 에러 처리 메인 메서드
     */
    async handleError(error, category = ErrorCategory.UNKNOWN, severity = ErrorSeverity.MEDIUM, options = {}) {
        const errorInfo = this.createErrorInfo(error, category, severity);
        // 히스토리에 추가
        this.addToHistory(errorInfo);
        // 콘솔 로깅
        if (options.logToConsole !== false) {
            this.logToConsole(errorInfo);
        }
        // 사용자에게 표시
        if (options.showToUser !== false) {
            await this.showToUser(errorInfo, options);
        }
        // 텔레메트리 전송
        if (options.sendTelemetry) {
            await this.sendTelemetry(errorInfo);
        }
    }
    /**
     * API 에러 처리
     */
    async handleAPIError(error, context, options = {}) {
        const category = this.determineAPIErrorCategory(error);
        const severity = this.determineAPIErrorSeverity(error);
        const enhancedOptions = {
            ...options,
            customMessage: this.getAPIErrorMessage(error),
        };
        await this.handleError(error, category, severity, enhancedOptions);
    }
    /**
     * 네트워크 에러 처리
     */
    async handleNetworkError(error, options = {}) {
        const enhancedOptions = {
            ...options,
            showRetryOption: true,
            customMessage: "네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인해주세요.",
        };
        await this.handleError(error, ErrorCategory.NETWORK, ErrorSeverity.HIGH, enhancedOptions);
    }
    /**
     * 설정 에러 처리
     */
    async handleConfigError(error, options = {}) {
        const enhancedOptions = {
            ...options,
            customMessage: "설정에 문제가 있습니다. HAPA 설정을 확인해주세요.",
            userAction: "HAPA 설정 열기",
        };
        await this.handleError(error, ErrorCategory.CONFIGURATION, ErrorSeverity.MEDIUM, enhancedOptions);
    }
    /**
     * 에러 정보 생성
     */
    createErrorInfo(error, category, severity) {
        const message = typeof error === "string" ? error : error.message;
        const originalError = typeof error === "string" ? undefined : error;
        return {
            id: this.generateErrorId(),
            message,
            category,
            severity,
            timestamp: new Date(),
            originalError,
            retryable: this.isRetryableError(category, originalError),
            stack: typeof error === "string" ? undefined : error.stack,
        };
    }
    /**
     * 에러 ID 생성
     */
    generateErrorId() {
        return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * 재시도 가능한 에러인지 확인
     */
    isRetryableError(category, error) {
        if (category === ErrorCategory.NETWORK) {
            return true;
        }
        if (category === ErrorCategory.API && error) {
            const message = error.message.toLowerCase();
            return (message.includes("timeout") ||
                message.includes("503") ||
                message.includes("502") ||
                message.includes("500"));
        }
        return false;
    }
    /**
     * API 에러 카테고리 결정
     */
    determineAPIErrorCategory(error) {
        const message = error.message.toLowerCase();
        if (message.includes("network") || message.includes("connection")) {
            return ErrorCategory.NETWORK;
        }
        if (message.includes("unauthorized") || message.includes("api key")) {
            return ErrorCategory.CONFIGURATION;
        }
        return ErrorCategory.API;
    }
    /**
     * API 에러 심각도 결정
     */
    determineAPIErrorSeverity(error) {
        const message = error.message.toLowerCase();
        if (message.includes("unauthorized") || message.includes("forbidden")) {
            return ErrorSeverity.HIGH;
        }
        if (message.includes("timeout") || message.includes("503")) {
            return ErrorSeverity.MEDIUM;
        }
        return ErrorSeverity.LOW;
    }
    /**
     * API 에러 메시지 생성
     */
    getAPIErrorMessage(error) {
        const message = error.message.toLowerCase();
        if (message.includes("unauthorized")) {
            return "API 인증에 실패했습니다. API 키를 확인해주세요.";
        }
        if (message.includes("forbidden")) {
            return "API 접근 권한이 없습니다.";
        }
        if (message.includes("timeout")) {
            return "API 요청 시간이 초과되었습니다.";
        }
        if (message.includes("429")) {
            return "API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.";
        }
        if (message.includes("500")) {
            return "서버 내부 오류가 발생했습니다.";
        }
        return `API 오류가 발생했습니다: ${error.message}`;
    }
    /**
     * 콘솔 로깅
     */
    logToConsole(errorInfo) {
        const prefix = `[HAPA ${errorInfo.severity.toUpperCase()}]`;
        const message = `${prefix} ${errorInfo.category}: ${errorInfo.message}`;
        switch (errorInfo.severity) {
            case ErrorSeverity.CRITICAL:
            case ErrorSeverity.HIGH:
                console.error(message, errorInfo.originalError);
                break;
            case ErrorSeverity.MEDIUM:
                console.warn(message, errorInfo.originalError);
                break;
            default:
                console.log(message, errorInfo.originalError);
        }
    }
    /**
     * 사용자에게 에러 표시
     */
    async showToUser(errorInfo, options) {
        const message = options.customMessage || errorInfo.message;
        const actions = [];
        if (options.userAction) {
            actions.push(options.userAction);
        }
        if (options.showRetryOption && errorInfo.retryable) {
            actions.push("다시 시도");
        }
        let result;
        switch (errorInfo.severity) {
            case ErrorSeverity.CRITICAL:
                result = await vscode.window.showErrorMessage(`심각한 오류: ${message}`, ...actions);
                break;
            case ErrorSeverity.HIGH:
                result = await vscode.window.showErrorMessage(message, ...actions);
                break;
            case ErrorSeverity.MEDIUM:
                result = await vscode.window.showWarningMessage(message, ...actions);
                break;
            case ErrorSeverity.LOW:
                result = await vscode.window.showInformationMessage(message, ...actions);
                break;
        }
        if (result) {
            await this.handleUserAction(result, errorInfo, options);
        }
    }
    /**
     * 사용자 액션 처리
     */
    async handleUserAction(action, errorInfo, options) {
        if (!action)
            return;
        if (action === "다시 시도") {
            console.log("사용자가 재시도를 요청했습니다.");
        }
        else if (action === "HAPA 설정 열기") {
            await vscode.commands.executeCommand("hapa.showSettings");
        }
        else if (action === options.userAction) {
            console.log(`사용자 액션 실행: ${action}`);
        }
    }
    /**
     * 텔레메트리 전송
     */
    async sendTelemetry(errorInfo) {
        console.log("텔레메트리 데이터:", {
            id: errorInfo.id,
            category: errorInfo.category,
            severity: errorInfo.severity,
            timestamp: errorInfo.timestamp,
        });
    }
    /**
     * 히스토리에 추가
     */
    addToHistory(errorInfo) {
        this.errorHistory.push(errorInfo);
        if (this.errorHistory.length > this.maxHistorySize) {
            this.errorHistory = this.errorHistory.slice(-this.maxHistorySize);
        }
    }
    /**
     * 에러 히스토리 조회
     */
    getErrorHistory() {
        return [...this.errorHistory];
    }
    /**
     * 에러 통계 조회
     */
    getErrorStats() {
        const stats = {
            [ErrorCategory.API]: 0,
            [ErrorCategory.NETWORK]: 0,
            [ErrorCategory.CONFIGURATION]: 0,
            [ErrorCategory.USER_INPUT]: 0,
            [ErrorCategory.SYSTEM]: 0,
            [ErrorCategory.UNKNOWN]: 0,
        };
        this.errorHistory.forEach((error) => {
            stats[error.category]++;
        });
        return stats;
    }
    /**
     * 히스토리 초기화
     */
    clearHistory() {
        this.errorHistory = [];
    }
    /**
     * 최근 에러 여부 확인
     */
    hasRecentErrors(minutes = 5) {
        const cutoff = new Date(Date.now() - minutes * 60 * 1000);
        return this.errorHistory.some((error) => error.timestamp > cutoff);
    }
}
exports.ErrorService = ErrorService;
//# sourceMappingURL=ErrorService.js.map