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
exports.TelemetryService = void 0;
const vscode = __importStar(require("vscode"));
const os = __importStar(require("os"));
const EnhancedErrorService_1 = require("./EnhancedErrorService");
const MemoryManager_1 = require("./MemoryManager");
class TelemetryService {
    static getInstance() {
        if (!TelemetryService.instance) {
            TelemetryService.instance = new TelemetryService();
        }
        return TelemetryService.instance;
    }
    constructor() {
        this.errorService = EnhancedErrorService_1.EnhancedErrorService.getInstance();
        this.memoryManager = MemoryManager_1.MemoryManager.getInstance();
        // 이벤트 큐 및 배치 처리
        this.eventQueue = [];
        this.maxQueueSize = 100;
        this.batchUploadInterval = null;
        // 사용 통계
        this.usageMetrics = {
            daily: new Map(),
            weekly: new Map(),
            monthly: new Map(),
            features: new Map(),
        };
        this.userBehavior = {
            featureUsage: new Map(),
            averageSessionDuration: 0,
            totalSessions: 0,
            lastActiveDate: new Date(),
            preferredLanguages: [],
            commonErrorTypes: new Map(),
        };
        // 개인정보 보호 설정
        this.isEnabled = false;
        this.isDataCollectionConsented = false;
        this.currentSessionId = this.generateSessionId();
        this.sessionStartTime = new Date();
        this.userId = this.getOrCreateUserId();
        // 확장 프로그램 경로에 데이터 저장
        const extensionPath = vscode.extensions.getExtension("hapa.ai-assistant")?.extensionPath;
        this.dataStorePath = require("path").join(extensionPath || process.cwd(), "telemetry-data");
        this.initializeMetrics();
        this.checkConsentAndEnable();
    }
    /**
     * 텔레메트리 초기화
     */
    async initializeMetrics() {
        this.usageMetrics = {
            daily: new Map(),
            weekly: new Map(),
            monthly: new Map(),
            features: new Map(),
        };
        this.userBehavior = {
            featureUsage: new Map(),
            averageSessionDuration: 0,
            totalSessions: 0,
            lastActiveDate: new Date(),
            preferredLanguages: [],
            commonErrorTypes: new Map(),
        };
        // 저장된 데이터 복원
        await this.loadStoredData();
        // 정기적 데이터 저장 및 업로드
        this.startBatchProcessing();
    }
    /**
     * 사용자 동의 확인 및 활성화
     */
    async checkConsentAndEnable() {
        const config = vscode.workspace.getConfiguration("hapa");
        const telemetryEnabled = config.get("enableTelemetry", false);
        if (telemetryEnabled && !this.isDataCollectionConsented) {
            const consent = await vscode.window.showInformationMessage("📊 HAPA 개선을 위해 익명화된 사용 통계를 수집할 수 있나요?\n" +
                "수집되는 정보: 기능 사용 빈도, 성능 지표, 오류 통계\n" +
                "개인 정보나 코드는 수집되지 않습니다.", "동의", "거부", "자세히 보기");
            switch (consent) {
                case "동의":
                    this.isDataCollectionConsented = true;
                    this.isEnabled = true;
                    await config.update("telemetryConsented", true, vscode.ConfigurationTarget.Global);
                    this.trackEvent("telemetry_consent_granted");
                    break;
                case "거부":
                    this.isDataCollectionConsented = false;
                    this.isEnabled = false;
                    await config.update("enableTelemetry", false, vscode.ConfigurationTarget.Global);
                    break;
                case "자세히 보기":
                    vscode.env.openExternal(vscode.Uri.parse("https://hapa-docs.com/privacy-policy"));
                    break;
            }
        }
        else {
            this.isEnabled =
                telemetryEnabled && config.get("telemetryConsented", false);
        }
        console.log(`📊 텔레메트리 상태: ${this.isEnabled ? "활성화" : "비활성화"}`);
    }
    /**
     * 이벤트 추적
     */
    trackEvent(eventName, properties = {}, immediate = false) {
        if (!this.isEnabled) {
            return;
        }
        try {
            const event = {
                eventName,
                properties: {
                    ...properties,
                    ...this.getSystemInfo(),
                    sessionDuration: Date.now() - this.sessionStartTime.getTime(),
                },
                timestamp: new Date(),
                sessionId: this.currentSessionId,
                userId: this.userId,
            };
            this.eventQueue.push(event);
            // 이벤트 큐 크기 제한
            if (this.eventQueue.length > this.maxQueueSize) {
                this.eventQueue.shift(); // 가장 오래된 이벤트 제거
            }
            // 사용 통계 업데이트
            this.updateUsageMetrics(eventName, properties);
            // 즉시 처리가 필요한 경우
            if (immediate) {
                this.processBatch();
            }
            console.log(`📊 이벤트 추적: ${eventName}`);
        }
        catch (error) {
            this.errorService.logError(error, EnhancedErrorService_1.ErrorSeverity.LOW, {
                eventName,
                operation: "trackEvent",
            });
        }
    }
    /**
     * 기능 사용 추적
     */
    trackFeatureUsage(featureName, duration, success, metadata = {}) {
        if (!this.isEnabled) {
            return;
        }
        this.trackEvent("feature_usage", {
            feature: featureName,
            duration,
            success,
            ...metadata,
        });
        // 기능별 상세 통계 업데이트
        const existing = this.usageMetrics.features.get(featureName);
        if (existing) {
            existing.count++;
            existing.averageDuration = (existing.averageDuration + duration) / 2;
            existing.successRate =
                (existing.successRate * (existing.count - 1) + (success ? 1 : 0)) /
                    existing.count;
            existing.lastUsed = new Date();
        }
        else {
            this.usageMetrics.features.set(featureName, {
                count: 1,
                averageDuration: duration,
                successRate: success ? 1 : 0,
                lastUsed: new Date(),
            });
        }
        // 사용자 행동 패턴 업데이트
        const currentCount = this.userBehavior.featureUsage.get(featureName) || 0;
        this.userBehavior.featureUsage.set(featureName, currentCount + 1);
    }
    /**
     * 에러 추적
     */
    trackError(error, severity, context = {}) {
        if (!this.isEnabled) {
            return;
        }
        const errorType = error.constructor.name;
        this.trackEvent("error_occurred", {
            errorType,
            errorMessage: error.message.substring(0, 100),
            severity,
            stack: error.stack?.split("\n")[0],
            ...context,
        });
        // 일반적인 에러 타입 추적
        const currentCount = this.userBehavior.commonErrorTypes.get(errorType) || 0;
        this.userBehavior.commonErrorTypes.set(errorType, currentCount + 1);
    }
    /**
     * 성능 메트릭 추적
     */
    trackPerformance(operationName, duration, memoryUsed, metadata = {}) {
        if (!this.isEnabled) {
            return;
        }
        this.trackEvent("performance_metric", {
            operation: operationName,
            duration,
            memoryUsed,
            memoryTotal: process.memoryUsage().heapTotal,
            memoryUsedPercent: (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) *
                100,
            ...metadata,
        });
    }
    /**
     * 사용자 설정 변경 추적
     */
    trackConfigChange(configKey, oldValue, newValue) {
        if (!this.isEnabled) {
            return;
        }
        this.trackEvent("config_changed", {
            configKey,
            oldValueType: typeof oldValue,
            newValueType: typeof newValue,
            // 실제 값은 개인정보 보호를 위해 수집하지 않음
        });
    }
    /**
     * 세션 시작 추적
     */
    startSession() {
        if (!this.isEnabled) {
            return;
        }
        this.currentSessionId = this.generateSessionId();
        this.sessionStartTime = new Date();
        this.userBehavior.totalSessions++;
        this.userBehavior.lastActiveDate = new Date();
        this.trackEvent("session_start", {
            sessionNumber: this.userBehavior.totalSessions,
            systemInfo: this.getSystemInfo(),
        });
    }
    /**
     * 세션 종료 추적
     */
    endSession() {
        if (!this.isEnabled) {
            return;
        }
        const sessionDuration = Date.now() - this.sessionStartTime.getTime();
        // 평균 세션 지속시간 업데이트
        const totalSessions = this.userBehavior.totalSessions;
        this.userBehavior.averageSessionDuration =
            (this.userBehavior.averageSessionDuration * (totalSessions - 1) +
                sessionDuration) /
                totalSessions;
        this.trackEvent("session_end", {
            sessionDuration,
            eventsInSession: this.eventQueue.length,
        }, true); // 즉시 처리
        // 세션 데이터 저장
        this.saveDataToStorage();
    }
    /**
     * 사용 통계 생성
     */
    generateUsageReport() {
        const topFeatures = Array.from(this.userBehavior.featureUsage.entries())
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10);
        const topErrors = Array.from(this.userBehavior.commonErrorTypes.entries())
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5);
        const totalFeatureUsage = Array.from(this.userBehavior.featureUsage.values()).reduce((sum, count) => sum + count, 0);
        return `
=== HAPA 사용 통계 보고서 ===
📊 전체 세션 수: ${this.userBehavior.totalSessions}
⏱️ 평균 세션 시간: ${(this.userBehavior.averageSessionDuration /
            1000 /
            60).toFixed(1)}분
🎯 총 기능 사용 횟수: ${totalFeatureUsage}
📅 마지막 활동: ${this.userBehavior.lastActiveDate.toLocaleDateString()}

🔥 인기 기능 (Top 10):
${topFeatures
            .map(([feature, count], i) => `${i + 1}. ${feature}: ${count}회`)
            .join("\n")}

⚠️ 자주 발생하는 오류 (Top 5):
${topErrors
            .map(([error, count], i) => `${i + 1}. ${error}: ${count}회`)
            .join("\n")}

📈 기능별 성공률:
${Array.from(this.usageMetrics.features.entries())
            .sort(([, a], [, b]) => b.count - a.count)
            .slice(0, 5)
            .map(([feature, stats]) => `• ${feature}: ${(stats.successRate * 100).toFixed(1)}% (${stats.count}회 사용)`)
            .join("\n")}

💡 개선 제안:
${this.generateImprovementSuggestions()}
    `;
    }
    /**
     * 개선 제안 생성
     */
    generateImprovementSuggestions() {
        const suggestions = [];
        // 낮은 성공률 기능 식별
        const lowSuccessFeatures = Array.from(this.usageMetrics.features.entries())
            .filter(([, stats]) => stats.successRate < 0.8 && stats.count > 5)
            .sort(([, a], [, b]) => a.successRate - b.successRate)
            .slice(0, 3);
        if (lowSuccessFeatures.length > 0) {
            suggestions.push(`- 성공률이 낮은 기능들의 UX 개선 필요: ${lowSuccessFeatures
                .map(([name]) => name)
                .join(", ")}`);
        }
        // 자주 사용되지 않는 기능 식별
        const underusedFeatures = Array.from(this.usageMetrics.features.entries())
            .filter(([, stats]) => stats.count < 3)
            .slice(0, 3);
        if (underusedFeatures.length > 0) {
            suggestions.push(`- 사용률이 낮은 기능들의 발견 가능성 향상: ${underusedFeatures
                .map(([name]) => name)
                .join(", ")}`);
        }
        // 짧은 세션 시간
        if (this.userBehavior.averageSessionDuration < 300000) {
            // 5분 미만
            suggestions.push("- 평균 세션 시간이 짧음 - 사용자 참여도 향상 방안 필요");
        }
        // 자주 발생하는 오류
        const frequentErrors = Array.from(this.userBehavior.commonErrorTypes.entries()).filter(([, count]) => count > 5);
        if (frequentErrors.length > 0) {
            suggestions.push(`- 자주 발생하는 오류 해결 우선: ${frequentErrors
                .map(([name]) => name)
                .join(", ")}`);
        }
        return suggestions.length > 0
            ? suggestions.join("\n")
            : "- 현재 사용 패턴이 양호함";
    }
    /**
     * 개인정보 보호 준수 데이터 익명화
     */
    anonymizeData(data) {
        if (typeof data === "string") {
            // 파일 경로, 이메일, 코드 등 개인정보 제거
            return data
                .replace(/[a-zA-Z]:\\[^\\]+/g, "[PATH]") // Windows 경로
                .replace(/\/Users\/[^\/]+/g, "/Users/[USER]") // macOS 사용자 경로
                .replace(/\/home\/[^\/]+/g, "/home/[USER]") // Linux 사용자 경로
                .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[EMAIL]") // 이메일
                .replace(/\b(?:function|class|const|let|var)\s+\w+/g, "[CODE]"); // 코드 패턴
        }
        return data;
    }
    // === 내부 유틸리티 메서드들 ===
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    getOrCreateUserId() {
        const config = vscode.workspace.getConfiguration("hapa");
        let userId = config.get("telemetryUserId");
        if (!userId) {
            userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            config.update("telemetryUserId", userId, vscode.ConfigurationTarget.Global);
        }
        return userId;
    }
    getSystemInfo() {
        return {
            platform: os.platform(),
            vsCodeVersion: vscode.version,
            extensionVersion: "0.4.0",
            nodeVersion: process.version,
            totalMemory: os.totalmem(),
            availableMemory: os.freemem(),
        };
    }
    updateUsageMetrics(eventName, properties) {
        const today = new Date().toISOString().split("T")[0];
        // 일일 통계 업데이트
        const dailyCount = this.usageMetrics.daily.get(today) || 0;
        this.usageMetrics.daily.set(today, dailyCount + 1);
        // 주간 통계 업데이트 (ISO 주차)
        const weekKey = this.getISOWeek(new Date());
        const weeklyCount = this.usageMetrics.weekly.get(weekKey) || 0;
        this.usageMetrics.weekly.set(weekKey, weeklyCount + 1);
        // 월간 통계 업데이트
        const monthKey = today.substring(0, 7); // YYYY-MM
        const monthlyCount = this.usageMetrics.monthly.get(monthKey) || 0;
        this.usageMetrics.monthly.set(monthKey, monthlyCount + 1);
    }
    getISOWeek(date) {
        const year = date.getFullYear();
        const week = Math.ceil(((date.getTime() - new Date(year, 0, 1).getTime()) / 86400000 +
            new Date(year, 0, 1).getDay() +
            1) /
            7);
        return `${year}-W${week.toString().padStart(2, "0")}`;
    }
    startBatchProcessing() {
        // 5분마다 배치 처리
        this.batchUploadInterval = this.memoryManager.setInterval(() => {
            this.processBatch();
            this.saveDataToStorage();
        }, 5 * 60 * 1000);
    }
    processBatch() {
        if (this.eventQueue.length === 0) {
            return;
        }
        try {
            // 실제 서버 전송은 구현하지 않음 (로컬 저장만)
            console.log(`📊 배치 처리: ${this.eventQueue.length}개 이벤트`);
            // 이벤트 큐 정리
            this.eventQueue = [];
        }
        catch (error) {
            this.errorService.logError(error, EnhancedErrorService_1.ErrorSeverity.LOW, {
                operation: "processBatch",
                queueSize: this.eventQueue.length,
            });
        }
    }
    async saveDataToStorage() {
        try {
            const fs = require("fs");
            const path = require("path");
            // 디렉토리 생성
            if (!fs.existsSync(this.dataStorePath)) {
                fs.mkdirSync(this.dataStorePath, { recursive: true });
            }
            // 사용 통계 저장
            const metricsPath = path.join(this.dataStorePath, "usage-metrics.json");
            fs.writeFileSync(metricsPath, JSON.stringify({
                usageMetrics: {
                    daily: Array.from(this.usageMetrics.daily.entries()),
                    weekly: Array.from(this.usageMetrics.weekly.entries()),
                    monthly: Array.from(this.usageMetrics.monthly.entries()),
                    features: Array.from(this.usageMetrics.features.entries()),
                },
                userBehavior: {
                    ...this.userBehavior,
                    featureUsage: Array.from(this.userBehavior.featureUsage.entries()),
                    commonErrorTypes: Array.from(this.userBehavior.commonErrorTypes.entries()),
                },
            }, null, 2));
        }
        catch (error) {
            this.errorService.logError(error, EnhancedErrorService_1.ErrorSeverity.LOW, {
                operation: "saveDataToStorage",
            });
        }
    }
    async loadStoredData() {
        try {
            const fs = require("fs");
            const path = require("path");
            const metricsPath = path.join(this.dataStorePath, "usage-metrics.json");
            if (fs.existsSync(metricsPath)) {
                const data = JSON.parse(fs.readFileSync(metricsPath, "utf8"));
                // 사용 통계 복원
                if (data.usageMetrics) {
                    this.usageMetrics.daily = new Map(data.usageMetrics.daily || []);
                    this.usageMetrics.weekly = new Map(data.usageMetrics.weekly || []);
                    this.usageMetrics.monthly = new Map(data.usageMetrics.monthly || []);
                    this.usageMetrics.features = new Map(data.usageMetrics.features || []);
                }
                // 사용자 행동 복원
                if (data.userBehavior) {
                    this.userBehavior = {
                        ...data.userBehavior,
                        featureUsage: new Map(data.userBehavior.featureUsage || []),
                        commonErrorTypes: new Map(data.userBehavior.commonErrorTypes || []),
                        lastActiveDate: new Date(data.userBehavior.lastActiveDate || Date.now()),
                    };
                }
            }
        }
        catch (error) {
            this.errorService.logError(error, EnhancedErrorService_1.ErrorSeverity.LOW, {
                operation: "loadStoredData",
            });
        }
    }
    /**
     * 텔레메트리 활성화/비활성화
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
        const config = vscode.workspace.getConfiguration("hapa");
        config.update("enableTelemetry", enabled, vscode.ConfigurationTarget.Global);
        if (enabled && !this.isDataCollectionConsented) {
            this.checkConsentAndEnable();
        }
        this.trackEvent(enabled ? "telemetry_enabled" : "telemetry_disabled");
    }
    /**
     * 현재 통계 조회
     */
    getStatistics() {
        return {
            isEnabled: this.isEnabled,
            totalSessions: this.userBehavior.totalSessions,
            averageSessionDuration: this.userBehavior.averageSessionDuration,
            totalEvents: Array.from(this.userBehavior.featureUsage.values()).reduce((a, b) => a + b, 0),
            topFeatures: Array.from(this.userBehavior.featureUsage.entries())
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5),
            eventQueueSize: this.eventQueue.length,
        };
    }
    /**
     * 정리
     */
    cleanup() {
        // 세션 종료 추적
        this.endSession();
        // 배치 처리 중지
        if (this.batchUploadInterval) {
            this.memoryManager.clearInterval(this.batchUploadInterval);
            this.batchUploadInterval = null;
        }
        // 남은 이벤트 처리
        this.processBatch();
    }
}
exports.TelemetryService = TelemetryService;
//# sourceMappingURL=TelemetryService.js.map