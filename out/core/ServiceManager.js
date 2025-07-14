"use strict";
/**
 * HAPA VSCode Extension - 서비스 관리자
 * @fileoverview 모든 서비스의 초기화와 생명주기를 관리
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceManager = void 0;
const EnhancedErrorService_1 = require("../services/EnhancedErrorService");
const MemoryManager_1 = require("../services/MemoryManager");
const PerformanceOptimizer_1 = require("../services/PerformanceOptimizer");
const OfflineService_1 = require("../services/OfflineService");
const ConfigValidationService_1 = require("../services/ConfigValidationService");
const LoadingService_1 = require("../services/LoadingService");
const TelemetryService_1 = require("../services/TelemetryService");
const AccessibilityService_1 = require("../services/AccessibilityService");
const ResponsiveDesignService_1 = require("../services/ResponsiveDesignService");
class ServiceManager {
    constructor() {
        this.services = new Map();
        this.initializationOrder = [
            "EnhancedErrorService",
            "MemoryManager",
            "ConfigValidationService",
            "PerformanceOptimizer",
            "LoadingService",
            "OfflineService",
            "TelemetryService",
            "AccessibilityService",
            "ResponsiveDesignService",
        ];
        this.isInitialized = false;
    }
    /**
     * 모든 서비스 초기화
     */
    async initializeAllServices() {
        if (this.isInitialized) {
            console.warn("⚠️ 서비스가 이미 초기화됨");
            return;
        }
        console.log("🚀 서비스 초기화 시작...");
        const startTime = Date.now();
        try {
            // 서비스들을 순서대로 초기화
            for (const serviceName of this.initializationOrder) {
                await this.initializeService(serviceName);
            }
            // 초기화 완료 후 상호 연결 설정
            await this.setupServiceInterconnections();
            // 헬스 체크 시작
            this.startHealthMonitoring();
            this.isInitialized = true;
            const duration = Date.now() - startTime;
            console.log(`✅ 모든 서비스 초기화 완료 (${duration}ms)`);
            console.log(`📊 초기화된 서비스: ${this.services.size}개`);
            // 초기화 완료 로깅
            this.logInitializationReport();
        }
        catch (error) {
            console.error("❌ 서비스 초기화 실패:", error);
            await this.handleInitializationFailure(error);
            throw error;
        }
    }
    /**
     * 개별 서비스 초기화
     */
    async initializeService(serviceName) {
        console.log(`🔧 ${serviceName} 초기화 중...`);
        try {
            let service;
            let requiresAsyncInit = false;
            switch (serviceName) {
                case "EnhancedErrorService":
                    service = EnhancedErrorService_1.EnhancedErrorService.getInstance();
                    break;
                case "MemoryManager":
                    service = MemoryManager_1.MemoryManager.getInstance();
                    service.initialize();
                    break;
                case "ConfigValidationService":
                    service = ConfigValidationService_1.ConfigValidationService.getInstance();
                    requiresAsyncInit = true;
                    break;
                case "PerformanceOptimizer":
                    service = PerformanceOptimizer_1.PerformanceOptimizer.getInstance();
                    break;
                case "LoadingService":
                    service = LoadingService_1.LoadingService.getInstance();
                    break;
                case "OfflineService":
                    service = OfflineService_1.OfflineService.getInstance();
                    requiresAsyncInit = true;
                    break;
                case "TelemetryService":
                    service = TelemetryService_1.TelemetryService.getInstance();
                    requiresAsyncInit = true;
                    break;
                case "AccessibilityService":
                    service = AccessibilityService_1.AccessibilityService.getInstance();
                    requiresAsyncInit = true;
                    break;
                case "ResponsiveDesignService":
                    service = ResponsiveDesignService_1.ResponsiveDesignService.getInstance();
                    requiresAsyncInit = true;
                    break;
                default:
                    throw new Error(`알 수 없는 서비스: ${serviceName}`);
            }
            // 비동기 초기화가 필요한 서비스들 처리
            if (requiresAsyncInit && service.initialize) {
                await service.initialize();
            }
            this.services.set(serviceName, service);
            console.log(`✅ ${serviceName} 초기화 완료`);
        }
        catch (error) {
            console.error(`❌ ${serviceName} 초기화 실패:`, error);
            // 중요한 서비스의 경우 전체 초기화를 중단
            if (this.isCriticalService(serviceName)) {
                throw new Error(`중요 서비스 ${serviceName} 초기화 실패: ${error}`);
            }
            // 중요하지 않은 서비스는 경고만 로그
            console.warn(`⚠️ ${serviceName} 초기화 실패했지만 계속 진행: ${error}`);
        }
    }
    /**
     * 서비스 간 상호 연결 설정
     */
    async setupServiceInterconnections() {
        console.log("🔗 서비스 간 상호 연결 설정 중...");
        try {
            // 텔레메트리 서비스에 성능 최적화 서비스 연결
            const telemetryService = this.getService("TelemetryService");
            const performanceOptimizer = this.getService("PerformanceOptimizer");
            if (telemetryService && performanceOptimizer) {
                // 성능 메트릭을 텔레메트리로 전송하는 연결 설정
                // (실제 구현은 서비스 내부에서 처리)
            }
            // 오프라인 서비스에 메모리 관리자 연결
            const offlineService = this.getService("OfflineService");
            const memoryManager = this.getService("MemoryManager");
            if (offlineService && memoryManager) {
                // 캐시 관리를 위한 연결 설정
            }
            console.log("✅ 서비스 간 상호 연결 설정 완료");
        }
        catch (error) {
            console.error("❌ 서비스 상호 연결 설정 실패:", error);
            // 연결 실패는 치명적이지 않으므로 계속 진행
        }
    }
    /**
     * 헬스 모니터링 시작
     */
    startHealthMonitoring() {
        console.log("🏥 서비스 헬스 모니터링 시작...");
        // 5분마다 헬스 체크
        setInterval(() => {
            this.performHealthCheck();
        }, 5 * 60 * 1000);
        // 초기 헬스 체크
        setTimeout(() => {
            this.performHealthCheck();
        }, 10000); // 10초 후
    }
    /**
     * 헬스 체크 수행
     */
    async performHealthCheck() {
        console.log("🔍 서비스 헬스 체크 수행 중...");
        const healthReport = [];
        for (const [serviceName, service] of this.services) {
            try {
                const status = {
                    name: serviceName,
                    initialized: !!service,
                    healthy: true,
                    lastCheck: new Date(),
                };
                // 서비스별 헬스 체크 메서드가 있으면 호출
                if (service.healthCheck) {
                    const health = await service.healthCheck();
                    status.healthy = health.healthy;
                    if (!health.healthy) {
                        status.error = health.error;
                    }
                }
                healthReport.push(status);
            }
            catch (error) {
                healthReport.push({
                    name: serviceName,
                    initialized: !!service,
                    healthy: false,
                    lastCheck: new Date(),
                    error: String(error),
                });
            }
        }
        // 문제가 있는 서비스들 리포트
        const unhealthyServices = healthReport.filter((s) => !s.healthy);
        if (unhealthyServices.length > 0) {
            console.warn("⚠️ 건강하지 않은 서비스 발견:", unhealthyServices);
            // 자동 복구 시도
            for (const service of unhealthyServices) {
                await this.attemptServiceRecovery(service.name);
            }
        }
    }
    /**
     * 서비스 복구 시도
     */
    async attemptServiceRecovery(serviceName) {
        console.log(`🔄 ${serviceName} 서비스 복구 시도 중...`);
        try {
            const service = this.services.get(serviceName);
            if (service && service.restart) {
                await service.restart();
                console.log(`✅ ${serviceName} 서비스 복구 성공`);
            }
            else {
                // 서비스 재초기화 시도
                await this.initializeService(serviceName);
                console.log(`✅ ${serviceName} 서비스 재초기화 성공`);
            }
        }
        catch (error) {
            console.error(`❌ ${serviceName} 서비스 복구 실패:`, error);
            // 에러 서비스에 보고
            const errorService = this.getService("EnhancedErrorService");
            if (errorService) {
                errorService.logError(new Error(`서비스 복구 실패: ${serviceName}`), EnhancedErrorService_1.ErrorSeverity.HIGH, { serviceName, recoveryAttempt: true });
            }
        }
    }
    /**
     * 초기화 실패 처리
     */
    async handleInitializationFailure(error) {
        console.error("🚨 서비스 초기화 전체 실패 처리 중...");
        // 이미 초기화된 서비스들 정리
        for (const [serviceName, service] of this.services) {
            try {
                if (service.cleanup) {
                    await service.cleanup();
                }
                console.log(`🧹 ${serviceName} 정리 완료`);
            }
            catch (cleanupError) {
                console.error(`❌ ${serviceName} 정리 실패:`, cleanupError);
            }
        }
        this.services.clear();
        this.isInitialized = false;
    }
    /**
     * 초기화 리포트 로깅
     */
    logInitializationReport() {
        const report = {
            totalServices: this.services.size,
            initializationOrder: this.initializationOrder,
            initializedServices: Array.from(this.services.keys()),
            timestamp: new Date().toISOString(),
        };
        console.log("📊 서비스 초기화 리포트:", report);
    }
    /**
     * 중요 서비스 여부 확인
     */
    isCriticalService(serviceName) {
        const criticalServices = [
            "EnhancedErrorService",
            "MemoryManager",
            "ConfigValidationService",
        ];
        return criticalServices.includes(serviceName);
    }
    /**
     * 특정 서비스 가져오기
     */
    getService(serviceName) {
        return this.services.get(serviceName);
    }
    /**
     * 모든 서비스 이름 목록
     */
    getServiceNames() {
        return Array.from(this.services.keys());
    }
    /**
     * 서비스 상태 정보
     */
    getServiceStatus() {
        const status = {};
        for (const [serviceName, service] of this.services) {
            status[serviceName] = !!service;
        }
        return status;
    }
    /**
     * 초기화 여부 확인
     */
    isInitializedState() {
        return this.isInitialized;
    }
    /**
     * 서비스 개수
     */
    getServiceCount() {
        return this.services.size;
    }
    /**
     * 특정 서비스 재시작
     */
    async restartService(serviceName) {
        console.log(`🔄 ${serviceName} 서비스 재시작 중...`);
        try {
            // 기존 서비스 정리
            const existingService = this.services.get(serviceName);
            if (existingService && existingService.cleanup) {
                await existingService.cleanup();
            }
            // 서비스 제거
            this.services.delete(serviceName);
            // 재초기화
            await this.initializeService(serviceName);
            console.log(`✅ ${serviceName} 서비스 재시작 완료`);
        }
        catch (error) {
            console.error(`❌ ${serviceName} 서비스 재시작 실패:`, error);
            throw error;
        }
    }
    /**
     * 모든 서비스 정리 (deactivate 시 호출)
     */
    async cleanup() {
        console.log("🔄 서비스 매니저 정리 시작...");
        try {
            // 초기화 순서의 역순으로 정리
            const cleanupOrder = [...this.initializationOrder].reverse();
            for (const serviceName of cleanupOrder) {
                const service = this.services.get(serviceName);
                if (service) {
                    try {
                        if (service.cleanup) {
                            await service.cleanup();
                        }
                        console.log(`🧹 ${serviceName} 정리 완료`);
                    }
                    catch (error) {
                        console.error(`❌ ${serviceName} 정리 실패:`, error);
                    }
                }
            }
            this.services.clear();
            this.isInitialized = false;
            console.log("✅ 서비스 매니저 정리 완료");
        }
        catch (error) {
            console.error("❌ 서비스 매니저 정리 실패:", error);
        }
    }
    /**
     * 서비스 의존성 그래프 생성 (디버깅용)
     */
    generateDependencyGraph() {
        const dependencies = {};
        // 각 서비스의 의존성 정의 (실제로는 서비스에서 제공해야 함)
        dependencies["EnhancedErrorService"] = [];
        dependencies["MemoryManager"] = ["EnhancedErrorService"];
        dependencies["ConfigValidationService"] = ["EnhancedErrorService"];
        dependencies["PerformanceOptimizer"] = [
            "EnhancedErrorService",
            "MemoryManager",
        ];
        dependencies["LoadingService"] = ["EnhancedErrorService"];
        dependencies["OfflineService"] = ["EnhancedErrorService", "MemoryManager"];
        dependencies["TelemetryService"] = [
            "EnhancedErrorService",
            "MemoryManager",
        ];
        dependencies["AccessibilityService"] = ["EnhancedErrorService"];
        dependencies["ResponsiveDesignService"] = ["EnhancedErrorService"];
        return dependencies;
    }
}
exports.ServiceManager = ServiceManager;
//# sourceMappingURL=ServiceManager.js.map