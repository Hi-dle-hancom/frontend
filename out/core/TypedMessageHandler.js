"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypedMessageHandler = void 0;
exports.getGlobalTypedMessageHandler = getGlobalTypedMessageHandler;
exports.disposeGlobalTypedMessageHandler = disposeGlobalTypedMessageHandler;
/**
 * 타입 안전성을 보장하는 메시지 핸들러
 * VSCode 확장과 웹뷰 간의 통신을 타입 안전하게 관리
 */
class TypedMessageHandler {
    webview = null;
    webviewMessageHandlers = {};
    extensionMessageHandlers = {};
    messageQueue = [];
    isProcessingQueue = false;
    messageStats = {
        sent: 0,
        received: 0,
        failed: 0,
        retried: 0,
        averageProcessingTime: 0,
    };
    config;
    disposables = [];
    errorHandler = null;
    constructor(config = {}) {
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
        this.setupErrorHandling();
    }
    /**
     * 웹뷰 설정 및 메시지 리스너 등록
     */
    setWebview(webview) {
        this.webview = webview;
        // 기존 리스너 제거
        this.disposables.forEach((d) => d.dispose());
        this.disposables = [];
        // 새 메시지 리스너 등록
        const messageListener = webview.onDidReceiveMessage((message) => this.handleIncomingMessage(message), null, this.disposables);
        this.disposables.push(messageListener);
        if (this.config.enableLogging) {
            console.log("✅ TypedMessageHandler: 웹뷰 설정 완료");
        }
    }
    /**
     * 웹뷰에서 오는 메시지 핸들러 등록
     */
    onWebviewMessage(command, handler) {
        this.webviewMessageHandlers[command] = handler;
        if (this.config.enableLogging) {
            console.log(`📝 핸들러 등록: ${command}`);
        }
    }
    /**
     * 확장에서 웹뷰로 메시지 전송
     */
    async sendToWebview(message) {
        if (!this.webview) {
            console.error("❌ 웹뷰가 설정되지 않음");
            return false;
        }
        const startTime = Date.now();
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
            this.updateProcessingTime(Date.now() - startTime);
            if (this.config.enableLogging) {
                console.log(`📤 메시지 전송: ${message.command}`, {
                    timestamp: enrichedMessage.timestamp,
                    id: enrichedMessage.id,
                });
            }
            return true;
        }
        catch (error) {
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
    async handleIncomingMessage(message) {
        const startTime = Date.now();
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
            const typedMessage = message;
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
                await handler(typedMessage);
                this.updateProcessingTime(Date.now() - startTime);
            }
            else {
                console.warn(`⚠️ 핸들러가 등록되지 않음: ${typedMessage.command}`);
            }
        }
        catch (error) {
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
    validateMessage(message) {
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
    validateIncomingMessage(message) {
        if (!message || typeof message !== "object") {
            return {
                isValid: false,
                error: "메시지가 객체가 아닙니다.",
            };
        }
        const msg = message;
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
    validateMessageContent(message) {
        switch (message.command) {
            case "generateCode":
            case "generateCodeStreaming":
            case "generateBugFixStreaming":
                const genMsg = message;
                return (typeof genMsg.question === "string" &&
                    genMsg.question.trim().length > 0);
            case "modelSelected":
                const modelMsg = message;
                const validModels = [
                    "autocomplete",
                    "prompt",
                    "comment",
                    "error_fix",
                ];
                return validModels.includes(modelMsg.modelType);
            case "insertCode":
                const codeMsg = message;
                return typeof codeMsg.code === "string";
            case "loadHistoryItem":
            case "deleteHistoryItem":
                const historyMsg = message;
                return typeof historyMsg.index === "number" && historyMsg.index >= 0;
            default:
                return true; // 기본적으로 허용
        }
    }
    /**
     * 메시지 정제
     */
    sanitizeMessage(message) {
        const sanitized = { ...message };
        // XSS 방지를 위한 문자열 정제
        Object.keys(sanitized).forEach((key) => {
            const value = sanitized[key];
            if (typeof value === "string") {
                sanitized[key] = value
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
    enrichMessage(message) {
        return {
            ...message,
            timestamp: message.timestamp ?? Date.now(),
            id: message.id ?? this.generateMessageId(),
        };
    }
    /**
     * 메시지 ID 생성
     */
    generateMessageId() {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * 메시지 큐 여부 판단
     */
    shouldQueueMessage(message) {
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
    queueMessage(message) {
        if (this.messageQueue.length >= this.config.queueMaxSize) {
            console.warn("⚠️ 메시지 큐가 가득참 - 오래된 메시지 제거");
            this.messageQueue.shift(); // 가장 오래된 메시지 제거
        }
        const queuedMessage = {
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
    async processQueue() {
        if (this.isProcessingQueue || this.messageQueue.length === 0) {
            return;
        }
        this.isProcessingQueue = true;
        try {
            while (this.messageQueue.length > 0) {
                const queuedMessage = this.messageQueue.shift();
                try {
                    await this.webview?.postMessage(queuedMessage.message);
                    this.messageStats.sent++;
                    if (this.config.enableLogging) {
                        console.log(`📤 큐 메시지 전송: ${queuedMessage.message.command}`);
                    }
                }
                catch (error) {
                    console.error(`❌ 큐 메시지 전송 실패: ${queuedMessage.message.command}`, error);
                    // 재시도 로직
                    if (queuedMessage.retryCount < queuedMessage.maxRetries) {
                        queuedMessage.retryCount++;
                        this.messageQueue.unshift(queuedMessage); // 큐 앞쪽에 다시 추가
                        this.messageStats.retried++;
                        // 지연 후 재시도
                        await new Promise((resolve) => setTimeout(resolve, this.config.retryDelay));
                    }
                    else {
                        this.messageStats.failed++;
                    }
                }
            }
        }
        finally {
            this.isProcessingQueue = false;
        }
    }
    /**
     * 메시지 재시도
     */
    async retryMessage(message, retryCount = 0) {
        if (retryCount >= this.config.maxRetries) {
            console.error(`❌ 최대 재시도 횟수 초과: ${message.command}`);
            return false;
        }
        await new Promise((resolve) => setTimeout(resolve, this.config.retryDelay * (retryCount + 1)));
        try {
            await this.webview?.postMessage(message);
            this.messageStats.sent++;
            this.messageStats.retried++;
            if (this.config.enableLogging) {
                console.log(`🔄 재시도 성공: ${message.command} (${retryCount + 1}/${this.config.maxRetries})`);
            }
            return true;
        }
        catch (error) {
            console.error(`❌ 재시도 실패: ${message.command} (${retryCount + 1}/${this.config.maxRetries})`, error);
            return this.retryMessage(message, retryCount + 1);
        }
    }
    /**
     * 처리 시간 업데이트
     */
    updateProcessingTime(processingTime) {
        const totalMessages = this.messageStats.sent + this.messageStats.received;
        if (totalMessages > 0) {
            this.messageStats.averageProcessingTime =
                (this.messageStats.averageProcessingTime * (totalMessages - 1) +
                    processingTime) /
                    totalMessages;
        }
    }
    /**
     * 오류 처리 설정
     */
    setupErrorHandling() {
        this.errorHandler = (error) => {
            console.error("❌ TypedMessageHandler 전역 오류:", error);
            this.messageStats.failed++;
        };
    }
    /**
     * 에러 핸들러 설정
     */
    setErrorHandler(handler) {
        this.errorHandler = handler;
    }
    /**
     * 통계 조회
     */
    getStats() {
        return { ...this.messageStats };
    }
    /**
     * 큐 상태 조회
     */
    getQueueStatus() {
        return {
            size: this.messageQueue.length,
            isProcessing: this.isProcessingQueue,
        };
    }
    /**
     * 큐 초기화
     */
    clearQueue() {
        this.messageQueue = [];
        this.isProcessingQueue = false;
        if (this.config.enableLogging) {
            console.log("🧹 메시지 큐 초기화 완료");
        }
    }
    /**
     * 설정 업데이트
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        if (this.config.enableLogging) {
            console.log("⚙️ TypedMessageHandler 설정 업데이트:", newConfig);
        }
    }
    /**
     * 리소스 정리
     */
    dispose() {
        this.disposables.forEach((d) => d.dispose());
        this.disposables = [];
        this.clearQueue();
        this.webview = null;
        this.errorHandler = null;
        if (this.config.enableLogging) {
            console.log("🗑️ TypedMessageHandler 리소스 정리 완료");
        }
    }
}
exports.TypedMessageHandler = TypedMessageHandler;
/**
 * 싱글톤 인스턴스 (옵션)
 */
let globalTypedMessageHandler = null;
function getGlobalTypedMessageHandler(config) {
    if (!globalTypedMessageHandler) {
        globalTypedMessageHandler = new TypedMessageHandler(config);
    }
    return globalTypedMessageHandler;
}
function disposeGlobalTypedMessageHandler() {
    if (globalTypedMessageHandler) {
        globalTypedMessageHandler.dispose();
        globalTypedMessageHandler = null;
    }
}
//# sourceMappingURL=TypedMessageHandler.js.map