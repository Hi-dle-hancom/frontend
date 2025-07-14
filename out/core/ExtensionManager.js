"use strict";
/**
 * HAPA VSCode Extension - 확장 관리자 (리팩토링됨)
 * @fileoverview 확장의 전체 생명주기를 관리하는 중앙 컨트롤러
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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtensionManager = void 0;
const vscode = __importStar(require("vscode"));
const ProviderRegistry_1 = require("./ProviderRegistry");
const CommandRegistry_1 = require("./CommandRegistry");
const ServiceManager_1 = require("./ServiceManager");
const ConfigService_1 = require("../services/ConfigService");
const EnhancedErrorService_1 = require("../services/EnhancedErrorService");
const triggerDetector_1 = require("../modules/triggerDetector");
const inserter_1 = require("../modules/inserter");
/**
 * 리팩토링된 확장 관리자 클래스
 * - 단일 책임 원칙을 적용하여 각 관리자들에게 책임 위임
 * - 간소화된 구조로 유지보수성 향상
 */
class ExtensionManager {
    constructor(context) {
        // 활성화 상태
        this.isActivated = false;
        // 트리거 및 코드 처리
        this.triggerDetector = null;
        // 이벤트 리스너 disposables
        this.eventDisposables = [];
        this.context = context;
        this.extensionUri = context.extensionUri;
        this.codeInserter = new inserter_1.CodeInserter();
        // 매니저들 초기화
        this.serviceManager = new ServiceManager_1.ServiceManager();
        this.providerRegistry = new ProviderRegistry_1.ProviderRegistry(this.extensionUri);
        // CommandRegistry는 프로바이더들이 등록된 후에 초기화될 예정
        // (registerProviders 메서드에서 초기화)
    }
    /**
     * 🚀 확장 활성화 (메인 엔트리포인트)
     */
    async activate() {
        if (this.isActivated) {
            console.warn("⚠️ Extension is already activated");
            return;
        }
        console.log("🚀 HAPA Extension 활성화 시작...");
        const activationStartTime = Date.now();
        try {
            // 1단계: 서비스 초기화
            await this.initializeServices();
            // 2단계: 설정 서비스 설정
            this.initializeConfigService();
            // 3단계: 프로바이더 등록
            await this.registerProviders();
            // 4단계: 명령어 등록
            this.registerCommands();
            // 5단계: 이벤트 리스너 등록
            this.registerEventListeners();
            // 6단계: 트리거 디텍터 설정
            this.setupTriggerDetector();
            // 7단계: 온보딩 확인
            await this.checkOnboarding();
            // 활성화 완료
            this.isActivated = true;
            const activationTime = Date.now() - activationStartTime;
            console.log(`✅ HAPA Extension 활성화 완료 (${activationTime}ms)`);
            this.logActivationSummary();
        }
        catch (error) {
            const errorService = EnhancedErrorService_1.EnhancedErrorService.getInstance();
            errorService.logError(error instanceof Error ? error : new Error(String(error)), EnhancedErrorService_1.ErrorSeverity.CRITICAL, { component: "ExtensionManager", operation: "activate" });
            // 부분적 정리
            await this.handleActivationFailure();
            throw error;
        }
    }
    /**
     * 🔧 1단계: 서비스 초기화
     */
    async initializeServices() {
        console.log("🔧 서비스 초기화 시작...");
        try {
            await this.serviceManager.initializeAllServices();
            console.log("✅ 서비스 초기화 완료");
        }
        catch (error) {
            console.error("❌ 서비스 초기화 실패:", error);
            throw new Error(`서비스 초기화 실패: ${error}`);
        }
    }
    /**
     * ⚙️ 2단계: 설정 서비스 설정
     */
    initializeConfigService() {
        console.log("⚙️ 설정 서비스 초기화 중...");
        try {
            ConfigService_1.configService.setContext(this.context);
            console.log("✅ 설정 서비스 초기화 완료");
        }
        catch (error) {
            console.error("❌ 설정 서비스 초기화 실패:", error);
            throw new Error(`설정 서비스 초기화 실패: ${error}`);
        }
    }
    /**
     * 📦 3단계: 프로바이더 등록
     */
    async registerProviders() {
        console.log("📦 프로바이더 등록 시작...");
        try {
            await this.providerRegistry.registerAllProviders(this.context);
            // 프로바이더들의 disposable을 context에 추가
            const providerDisposables = this.providerRegistry.getDisposables();
            this.context.subscriptions.push(...providerDisposables);
            // 이제 프로바이더들이 등록되었으므로 CommandRegistry 초기화
            await this.initializeCommandRegistry();
            console.log("✅ 프로바이더 등록 완료");
        }
        catch (error) {
            console.error("❌ 프로바이더 등록 실패:", error);
            throw new Error(`프로바이더 등록 실패: ${error}`);
        }
    }
    /**
     * 📋 3.5단계: CommandRegistry 초기화
     */
    async initializeCommandRegistry() {
        console.log("🔧 CommandRegistry 초기화 시작...");
        try {
            // 프로바이더들 가져오기
            const sidebarProvider = this.providerRegistry.getProvider("sidebar");
            const onboardingProvider = this.providerRegistry.getProvider("onboarding");
            const settingsProvider = this.providerRegistry.getProvider("settings");
            const guideProvider = this.providerRegistry.getProvider("guide");
            if (!sidebarProvider ||
                !onboardingProvider ||
                !settingsProvider ||
                !guideProvider) {
                throw new Error("필수 프로바이더들이 등록되지 않았습니다");
            }
            // CommandRegistry 초기화
            this.commandRegistry = new CommandRegistry_1.CommandRegistry({
                providerRegistry: this.providerRegistry,
                extensionContext: this.context,
            }, sidebarProvider, onboardingProvider, settingsProvider, guideProvider);
            console.log("✅ CommandRegistry 초기화 완료");
        }
        catch (error) {
            console.error("❌ CommandRegistry 초기화 실패:", error);
            throw new Error(`CommandRegistry 초기화 실패: ${error}`);
        }
    }
    /**
     * 📋 4단계: 명령어 등록
     */
    registerCommands() {
        console.log("📋 명령어 등록 시작...");
        try {
            if (!this.commandRegistry) {
                throw new Error("CommandRegistry가 초기화되지 않았습니다");
            }
            const commandDisposables = this.commandRegistry.registerAllCommands();
            // 명령어들의 disposable을 context에 추가
            this.context.subscriptions.push(...commandDisposables);
            console.log("✅ 명령어 등록 완료");
        }
        catch (error) {
            console.error("❌ 명령어 등록 실패:", error);
            throw new Error(`명령어 등록 실패: ${error}`);
        }
    }
    /**
     * 🎧 5단계: 이벤트 리스너 등록
     */
    registerEventListeners() {
        console.log("🎧 이벤트 리스너 등록 시작...");
        try {
            // 설정 변경 이벤트
            const configChangeDisposable = vscode.workspace.onDidChangeConfiguration((event) => this.onConfigurationChanged(event));
            // 활성 에디터 변경 이벤트
            const editorChangeDisposable = vscode.window.onDidChangeActiveTextEditor((editor) => this.onActiveEditorChanged(editor));
            // 텍스트 문서 변경 이벤트
            const textChangeDisposable = vscode.workspace.onDidChangeTextDocument((event) => this.onTextDocumentChanged(event));
            // 창 상태 변경 이벤트
            const windowStateDisposable = vscode.window.onDidChangeWindowState((state) => this.onWindowStateChanged(state));
            this.eventDisposables = [
                configChangeDisposable,
                editorChangeDisposable,
                textChangeDisposable,
                windowStateDisposable,
            ];
            // context에 추가
            this.context.subscriptions.push(...this.eventDisposables);
            console.log("✅ 이벤트 리스너 등록 완료");
        }
        catch (error) {
            console.error("❌ 이벤트 리스너 등록 실패:", error);
            throw new Error(`이벤트 리스너 등록 실패: ${error}`);
        }
    }
    /**
     * 🎯 6단계: 트리거 디텍터 설정
     */
    setupTriggerDetector() {
        console.log("🎯 트리거 디텍터 설정 시작...");
        try {
            this.triggerDetector = new triggerDetector_1.TriggerDetector();
            // 트리거 이벤트 처리
            this.triggerDetector.onTrigger((event) => {
                this.handleTriggerEvent(event);
            });
            console.log("✅ 트리거 디텍터 설정 완료");
        }
        catch (error) {
            console.error("❌ 트리거 디텍터 설정 실패:", error);
            // 트리거 디텍터는 중요하지만 확장 전체를 중단시키지 않음
            const errorService = EnhancedErrorService_1.EnhancedErrorService.getInstance();
            errorService.logError(error instanceof Error ? error : new Error(String(error)), EnhancedErrorService_1.ErrorSeverity.HIGH, { component: "TriggerDetector" });
        }
    }
    /**
     * 🏁 7단계: 온보딩 확인
     */
    async checkOnboarding() {
        console.log("🏁 온보딩 확인 시작...");
        try {
            const isOnboardingCompleted = ConfigService_1.configService.get("userProfile.isOnboardingCompleted", false);
            if (!isOnboardingCompleted) {
                console.log("🎓 온보딩이 필요함 - 온보딩 프로바이더 표시");
                // 온보딩 프로바이더 가져오기
                const onboardingProvider = this.providerRegistry.getProvider("onboarding");
                if (onboardingProvider) {
                    // 메서드 존재성 검증 후 호출
                    if (this.hasMethod(onboardingProvider, 'show')) {
                        // 2초 후 온보딩 표시 (다른 초기화가 완료된 후)
                        setTimeout(() => {
                            onboardingProvider.show();
                        }, 2000);
                    }
                    else {
                        console.warn("⚠️ OnboardingProvider에 show 메서드가 없습니다. resolveWebviewView를 통해 표시됩니다.");
                        // show 메서드가 없는 경우 대안: 명령어를 통한 온보딩 시작
                        setTimeout(() => {
                            vscode.commands.executeCommand("hapa.showOnboarding");
                        }, 2000);
                    }
                }
            }
            else {
                console.log("✅ 온보딩이 이미 완료됨");
            }
            console.log("✅ 온보딩 확인 완료");
        }
        catch (error) {
            console.error("❌ 온보딩 확인 실패:", error);
            // 온보딩 확인 실패는 치명적이지 않음
        }
    }
    /**
     * 🎯 트리거 이벤트 처리
     */
    async handleTriggerEvent(event) {
        try {
            const sidebarProvider = this.providerRegistry.getProvider("sidebar");
            // 트리거 이벤트 처리 로직 (메서드가 private이므로 직접 호출 대신 로깅)
            if (sidebarProvider) {
                console.log(`🎯 트리거 이벤트 감지: ${event.type}`);
                // TODO: SidebarProvider에 public 메서드 추가 필요
            }
        }
        catch (error) {
            const errorService = EnhancedErrorService_1.EnhancedErrorService.getInstance();
            errorService.logError(error instanceof Error ? error : new Error(String(error)), EnhancedErrorService_1.ErrorSeverity.MEDIUM, { event: event.type, component: "TriggerEventHandler" });
        }
    }
    // =============================================================================
    // 이벤트 핸들러들
    // =============================================================================
    /**
     * 설정 변경 이벤트 처리
     */
    async onConfigurationChanged(event) {
        if (event.affectsConfiguration("hapa")) {
            console.log("🔄 HAPA 설정 변경 감지");
            try {
                // 설정 검증
                const configValidationService = this.serviceManager.getService("ConfigValidationService");
                if (configValidationService && this.hasMethod(configValidationService, 'validateAllConfigs')) {
                    configValidationService.validateAllConfigs();
                }
                // 프로바이더들에게 설정 변경 알림 (메서드가 존재하는 경우에만)
                const sidebarProvider = this.providerRegistry.getProvider("sidebar");
                if (sidebarProvider) {
                    // onConfigurationChanged 메서드가 존재하지 않으므로 제거
                    console.log("✅ SidebarProvider 설정 변경 알림 (메서드 없음)");
                }
                console.log("✅ 설정 변경 처리 완료");
            }
            catch (error) {
                console.error("❌ 설정 변경 처리 실패:", error);
            }
        }
    }
    /**
     * 활성 에디터 변경 이벤트 처리
     */
    onActiveEditorChanged(editor) {
        try {
            // 성능 메트릭 수집
            const performanceOptimizer = this.serviceManager.getService("PerformanceOptimizer");
            if (performanceOptimizer && this.hasMethod(performanceOptimizer, 'recordEditorChange')) {
                performanceOptimizer.recordEditorChange(!!editor);
            }
            // 접근성 서비스에 알림
            const accessibilityService = this.serviceManager.getService("AccessibilityService");
            if (accessibilityService && this.hasMethod(accessibilityService, 'handleEditorChange')) {
                accessibilityService.handleEditorChange(editor);
            }
        }
        catch (error) {
            console.error("❌ 활성 에디터 변경 처리 실패:", error);
        }
    }
    /**
     * 텍스트 문서 변경 이벤트 처리
     */
    onTextDocumentChanged(event) {
        try {
            // 트리거 디텍터에 변경 사항 전달 (메서드가 존재하지 않으므로 제거)
            if (this.triggerDetector) {
                // onTextChanged 메서드가 존재하지 않으므로 로그만 남김
                console.log("🔄 텍스트 변경 감지:", event.contentChanges.length, "개 변경사항");
            }
            // 성능 메트릭 수집
            const performanceOptimizer = this.serviceManager.getService("PerformanceOptimizer");
            if (performanceOptimizer && this.hasMethod(performanceOptimizer, 'recordTextChange')) {
                performanceOptimizer.recordTextChange(event.contentChanges.length);
            }
        }
        catch (error) {
            console.error("❌ 텍스트 문서 변경 처리 실패:", error);
        }
    }
    /**
     * 창 상태 변경 이벤트 처리
     */
    onWindowStateChanged(state) {
        try {
            // 텔레메트리 서비스에 창 상태 전달
            const telemetryService = this.serviceManager.getService("TelemetryService");
            if (telemetryService && this.hasMethod(telemetryService, 'recordWindowState')) {
                telemetryService.recordWindowState(state);
            }
            // 오프라인 서비스에 포커스 상태 전달
            const offlineService = this.serviceManager.getService("OfflineService");
            if (offlineService && this.hasMethod(offlineService, 'handleWindowFocus')) {
                offlineService.handleWindowFocus(state.focused);
            }
        }
        catch (error) {
            console.error("❌ 창 상태 변경 처리 실패:", error);
        }
    }
    // =============================================================================
    // 유틸리티 메서드들
    // =============================================================================
    /**
     * 객체에 특정 메서드가 존재하는지 안전하게 확인
     */
    hasMethod(obj, methodName) {
        try {
            return obj && typeof obj[methodName] === "function";
        }
        catch (error) {
            console.warn(`⚠️ 메서드 존재성 확인 중 오류: ${methodName}`, error);
            return false;
        }
    }
    /**
     * 활성화 요약 로깅
     */
    logActivationSummary() {
        const summary = {
            services: this.serviceManager.getServiceCount(),
            providers: this.providerRegistry.getProviderCount(),
            commands: this.commandRegistry.getRegisteredCommands().length,
            eventListeners: this.eventDisposables.length,
            isActivated: this.isActivated,
            timestamp: new Date().toISOString(),
        };
        console.log("📊 활성화 요약:", summary);
    }
    /**
     * 활성화 실패 처리
     */
    async handleActivationFailure() {
        console.error("🚨 확장 활성화 실패 - 부분 정리 시작");
        try {
            // 이벤트 리스너 정리
            this.eventDisposables.forEach((disposable) => disposable.dispose());
            this.eventDisposables = [];
            // 서비스 정리
            await this.serviceManager.cleanup();
            // 프로바이더 정리
            this.providerRegistry.dispose();
            // 명령어 정리
            this.commandRegistry.dispose();
            console.log("✅ 부분 정리 완료");
        }
        catch (cleanupError) {
            console.error("❌ 부분 정리 실패:", cleanupError);
        }
    }
    // =============================================================================
    // 확장 비활성화
    // =============================================================================
    /**
     * 🔄 확장 비활성화
     */
    async deactivate() {
        if (!this.isActivated) {
            console.warn("⚠️ Extension is not activated");
            return;
        }
        console.log("🔄 HAPA Extension 비활성화 시작...");
        const deactivationStartTime = Date.now();
        try {
            // 트리거 디텍터 정리
            if (this.triggerDetector) {
                if (this.hasMethod(this.triggerDetector, 'dispose')) {
                    this.triggerDetector.dispose();
                }
                this.triggerDetector = null;
            }
            // 이벤트 리스너 정리
            this.eventDisposables.forEach((disposable) => disposable.dispose());
            this.eventDisposables = [];
            // 명령어 정리
            this.commandRegistry.dispose();
            // 프로바이더 정리
            this.providerRegistry.dispose();
            // 서비스 정리
            await this.serviceManager.cleanup();
            this.isActivated = false;
            const deactivationTime = Date.now() - deactivationStartTime;
            console.log(`✅ HAPA Extension 비활성화 완료 (${deactivationTime}ms)`);
        }
        catch (error) {
            console.error("❌ 확장 비활성화 실패:", error);
            const errorService = EnhancedErrorService_1.EnhancedErrorService.getInstance();
            errorService.logError(error instanceof Error ? error : new Error(String(error)), EnhancedErrorService_1.ErrorSeverity.HIGH, { component: "ExtensionManager", operation: "deactivate" });
        }
    }
    // =============================================================================
    // 공개 API 메서드들
    // =============================================================================
    /**
     * 특정 프로바이더 가져오기
     */
    getProvider(name) {
        return this.providerRegistry.getProvider(name);
    }
    /**
     * 특정 서비스 가져오기
     */
    getService(name) {
        return this.serviceManager.getService(name);
    }
    /**
     * 확장 컨텍스트 가져오기
     */
    getContext() {
        return this.context;
    }
    /**
     * 활성화 상태 확인
     */
    isExtensionActivated() {
        return this.isActivated;
    }
    /**
     * 확장 상태 정보
     */
    getExtensionStatus() {
        return {
            isActivated: this.isActivated,
            serviceStatus: this.serviceManager.getServiceStatus(),
            providerStatus: this.providerRegistry.getProviderStatus(),
            registeredCommands: this.commandRegistry.getRegisteredCommands().length,
            activeEventListeners: this.eventDisposables.length,
        };
    }
    /**
     * 코드 삽입기 가져오기
     */
    getCodeInserter() {
        return this.codeInserter;
    }
    /**
     * 특정 서비스 재시작
     */
    async restartService(serviceName) {
        await this.serviceManager.restartService(serviceName);
    }
    /**
     * 확장 상태 보고서 생성 (디버깅용)
     */
    generateStatusReport() {
        return {
            extension: {
                isActivated: this.isActivated,
                activationTime: new Date().toISOString(),
            },
            services: {
                count: this.serviceManager.getServiceCount(),
                names: this.serviceManager.getServiceNames(),
                status: this.serviceManager.getServiceStatus(),
                dependencies: this.serviceManager.generateDependencyGraph(),
            },
            providers: {
                count: this.providerRegistry.getProviderCount(),
                ids: this.providerRegistry.getProviderIds(),
                status: this.providerRegistry.getProviderStatus(),
            },
            commands: {
                total: this.commandRegistry.getRegisteredCommands().length,
                byCategory: {
                    basic: this.commandRegistry.getCommandsByCategory("basic").length,
                    analysis: this.commandRegistry.getCommandsByCategory("analysis").length,
                    settings: this.commandRegistry.getCommandsByCategory("settings").length,
                    advanced: this.commandRegistry.getCommandsByCategory("advanced").length,
                    accessibility: this.commandRegistry.getCommandsByCategory("accessibility").length,
                    responsive: this.commandRegistry.getCommandsByCategory("responsive").length,
                },
            },
            events: {
                activeListeners: this.eventDisposables.length,
            },
        };
    }
}
exports.ExtensionManager = ExtensionManager;
//# sourceMappingURL=ExtensionManager.js.map