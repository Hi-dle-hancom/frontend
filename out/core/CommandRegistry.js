"use strict";
/**
 * HAPA VSCode Extension - 명령어 등록 관리
 * @fileoverview 모든 VSCode 명령어의 등록과 라우팅을 관리
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
exports.CommandRegistry = void 0;
const vscode = __importStar(require("vscode"));
const ConfigService_1 = require("../services/ConfigService");
class CommandRegistry {
    constructor(context, sidebarProvider, onboardingProvider, settingsProvider, guideProvider) {
        this.context = context;
        this.sidebarProvider = sidebarProvider;
        this.onboardingProvider = onboardingProvider;
        this.settingsProvider = settingsProvider;
        this.guideProvider = guideProvider;
        this.disposables = [];
        this.registeredCommands = new Map();
        this.configService = ConfigService_1.ConfigService.getInstance();
    }
    /**
     * 모든 명령어 등록
     */
    registerAllCommands() {
        console.log("📋 명령어 등록 시작...");
        try {
            // 기본 명령어들
            this.registerBasicCommands();
            // 코드 분석 명령어들
            this.registerAnalysisCommands();
            // 설정 관련 명령어들
            this.registerSettingsCommands();
            // 고급 기능 명령어들
            this.registerAdvancedCommands();
            // 접근성 명령어들
            this.registerAccessibilityCommands();
            // 반응형 디자인 명령어들
            this.registerResponsiveCommands();
            console.log(`✅ 총 ${this.registeredCommands.size}개 명령어 등록 완료`);
            return this.disposables;
        }
        catch (error) {
            console.error("❌ 명령어 등록 실패:", error);
            throw error;
        }
    }
    /**
     * 기본 명령어들 등록
     */
    registerBasicCommands() {
        const basicCommands = [
            {
                command: "hapa.start",
                title: "HAPA: 시작하기",
                handler: () => this.showSidebar(),
                category: "basic",
            },
            {
                command: "hapa.settings",
                title: "HAPA: 설정",
                handler: () => this.showSettings(),
                category: "basic",
            },
            {
                command: "hapa.showGuide",
                title: "HAPA: 가이드 보기",
                handler: () => this.showGuide(),
                category: "basic",
            },
            {
                command: "hapa.showOnboarding",
                title: "HAPA: 온보딩 시작",
                handler: () => this.showOnboarding(),
                category: "basic",
            },
            {
                command: "hapa.resetOnboarding",
                title: "HAPA: 온보딩 초기화 (테스트용)",
                handler: () => this.resetOnboarding(),
                category: "basic",
            },
            {
                command: "hapa.openWebsite",
                title: "HAPA: 웹사이트 방문",
                handler: () => this.openWebsite(),
                category: "basic",
            },
            {
                command: "hapa.openDocs",
                title: "HAPA: 문서 보기",
                handler: () => this.openDocumentation(),
                category: "basic",
            },
            {
                command: "hapa.openUserSettings",
                title: "HAPA: 사용자 설정",
                handler: () => this.openUserSettings(),
                category: "basic",
            },
        ];
        this.registerCommands(basicCommands);
    }
    /**
     * 코드 분석 명령어들 등록
     */
    registerAnalysisCommands() {
        const analysisCommands = [
            {
                command: "hapa.analyze",
                title: "HAPA: 코드 분석",
                handler: () => this.analyzeCurrentFile(),
                category: "analysis",
            },
            {
                command: "hapa.generateTest",
                title: "HAPA: 테스트 생성",
                handler: () => this.generateTestForCurrentFile(),
                category: "analysis",
            },
            {
                command: "hapa.explain",
                title: "HAPA: 코드 설명",
                handler: () => this.explainCurrentFile(),
                category: "analysis",
            },
            {
                command: "hapa.analyzeSelection",
                title: "HAPA: 선택 영역 분석",
                handler: () => this.analyzeSelection(),
                category: "analysis",
            },
            {
                command: "hapa.testSelection",
                title: "HAPA: 선택 영역 테스트 생성",
                handler: () => this.generateTestForSelection(),
                category: "analysis",
            },
            {
                command: "hapa.explainSelection",
                title: "HAPA: 선택 영역 설명",
                handler: () => this.explainSelection(),
                category: "analysis",
            },
            {
                command: "hapa.insertCode",
                title: "HAPA: 코드 삽입",
                handler: (code) => this.insertCode(code),
                category: "analysis",
            },
        ];
        this.registerCommands(analysisCommands);
    }
    /**
     * 설정 관련 명령어들 등록
     */
    registerSettingsCommands() {
        const settingsCommands = [
            {
                command: "hapa.showSettings",
                title: "HAPA: 설정 보기",
                handler: () => this.showSettings(),
                category: "settings",
            },
            {
                command: "hapa.showUsageReport",
                title: "HAPA: 사용 통계 보고서",
                handler: () => this.showUsageReport(),
                category: "settings",
            },
            {
                command: "hapa.showTelemetryStats",
                title: "HAPA: 텔레메트리 상태",
                handler: () => this.showTelemetryStats(),
                category: "settings",
            },
            {
                command: "hapa.toggleTelemetry",
                title: "HAPA: 텔레메트리 토글",
                handler: () => this.toggleTelemetry(),
                category: "settings",
            },
        ];
        this.registerCommands(settingsCommands);
    }
    /**
     * 고급 기능 명령어들 등록
     */
    registerAdvancedCommands() {
        const advancedCommands = [
            {
                command: "hapa.showPerformanceReport",
                title: "HAPA: 성능 보고서",
                handler: () => this.showPerformanceReport(),
                category: "advanced",
            },
            {
                command: "hapa.showOfflineStatus",
                title: "HAPA: 오프라인 상태",
                handler: () => this.showOfflineStatus(),
                category: "advanced",
            },
            {
                command: "hapa.validateConfigs",
                title: "HAPA: 설정 검증",
                handler: () => this.validateConfigs(),
                category: "advanced",
            },
            {
                command: "hapa.clearOfflineCache",
                title: "HAPA: 오프라인 캐시 삭제",
                handler: () => this.clearOfflineCache(),
                category: "advanced",
            },
            {
                command: "hapa.resetPerformanceMetrics",
                title: "HAPA: 성능 메트릭 초기화",
                handler: () => this.resetPerformanceMetrics(),
                category: "advanced",
            },
        ];
        this.registerCommands(advancedCommands);
    }
    /**
     * 접근성 명령어들 등록
     */
    registerAccessibilityCommands() {
        const accessibilityCommands = [
            {
                command: "hapa.showAccessibilityReport",
                title: "HAPA: 접근성 보고서",
                handler: () => this.showAccessibilityReport(),
                category: "accessibility",
            },
            {
                command: "hapa.announceStatus",
                title: "HAPA: 현재 상태 안내",
                handler: () => this.announceStatus(),
                category: "accessibility",
            },
            {
                command: "hapa.readSelection",
                title: "HAPA: 선택 텍스트 읽기",
                handler: () => this.readSelection(),
                category: "accessibility",
            },
            {
                command: "hapa.increaseFontSize",
                title: "HAPA: 폰트 크기 증가",
                handler: () => this.increaseFontSize(),
                category: "accessibility",
            },
            {
                command: "hapa.decreaseFontSize",
                title: "HAPA: 폰트 크기 감소",
                handler: () => this.decreaseFontSize(),
                category: "accessibility",
            },
            {
                command: "hapa.toggleHighContrast",
                title: "HAPA: 고대비 모드 토글",
                handler: () => this.toggleHighContrast(),
                category: "accessibility",
            },
            {
                command: "hapa.toggleKeyboardNavigation",
                title: "HAPA: 키보드 네비게이션 토글",
                handler: () => this.toggleKeyboardNavigation(),
                category: "accessibility",
            },
            {
                command: "hapa.toggleScreenReader",
                title: "HAPA: 스크린 리더 모드 토글",
                handler: () => this.toggleScreenReader(),
                category: "accessibility",
            },
        ];
        this.registerCommands(accessibilityCommands);
    }
    /**
     * 반응형 디자인 명령어들 등록
     */
    registerResponsiveCommands() {
        const responsiveCommands = [
            {
                command: "hapa.showResponsiveReport",
                title: "HAPA: 반응형 디자인 보고서",
                handler: () => this.showResponsiveReport(),
                category: "responsive",
            },
            {
                command: "hapa.showResponsiveCSS",
                title: "HAPA: 반응형 CSS 보기",
                handler: () => this.showResponsiveCSS(),
                category: "responsive",
            },
            {
                command: "hapa.toggleResponsive",
                title: "HAPA: 반응형 디자인 토글",
                handler: () => this.toggleResponsive(),
                category: "responsive",
            },
            {
                command: "hapa.setBreakpointMobile",
                title: "HAPA: 모바일 브레이크포인트 설정",
                handler: () => this.setBreakpointMobile(),
                category: "responsive",
            },
            {
                command: "hapa.setBreakpointTablet",
                title: "HAPA: 태블릿 브레이크포인트 설정",
                handler: () => this.setBreakpointTablet(),
                category: "responsive",
            },
            {
                command: "hapa.setBreakpointDesktop",
                title: "HAPA: 데스크톱 브레이크포인트 설정",
                handler: () => this.setBreakpointDesktop(),
                category: "responsive",
            },
        ];
        this.registerCommands(responsiveCommands);
    }
    /**
     * 명령어 배열을 등록하는 헬퍼 메서드
     */
    registerCommands(commands) {
        commands.forEach((cmd) => {
            const disposable = vscode.commands.registerCommand(cmd.command, cmd.handler);
            this.disposables.push(disposable);
            this.registeredCommands.set(cmd.command, cmd);
        });
    }
    // =============================================================================
    // 명령어 핸들러 메서드들
    // =============================================================================
    async showSidebar() {
        await vscode.commands.executeCommand("workbench.view.extension.hapa-sidebar");
    }
    async showSettings() {
        const settingsProvider = this.context.providerRegistry.getProvider("settings");
        if (settingsProvider &&
            typeof settingsProvider.show === "function") {
            settingsProvider.show();
        }
    }
    async showGuide() {
        const guideProvider = this.context.providerRegistry.getProvider("guide");
        if (guideProvider && typeof guideProvider.show === "function") {
            guideProvider.show();
        }
    }
    async showOnboarding() {
        const onboardingProvider = this.context.providerRegistry.getProvider("onboarding");
        if (onboardingProvider &&
            typeof onboardingProvider.show === "function") {
            await onboardingProvider.show();
        }
    }
    async resetOnboarding() {
        // ConfigService를 통해 온보딩 설정 초기화
        const { configService } = await Promise.resolve().then(() => __importStar(require("../services/ConfigService")));
        await configService.update("userProfile.isOnboardingCompleted", false, true);
        await configService.update("userProfile.pythonSkillLevel", "intermediate", true);
        await configService.update("userProfile.codeOutputStructure", "standard", true);
        await configService.update("userProfile.explanationStyle", "standard", true);
        await configService.update("userProfile.projectContext", "general_purpose", true);
        await configService.update("userProfile.errorHandlingPreference", "basic", true);
        vscode.window
            .showInformationMessage("온보딩 설정이 초기화되었습니다. 이제 온보딩을 다시 시작할 수 있습니다.", "온보딩 시작하기")
            .then((selection) => {
            if (selection === "온보딩 시작하기") {
                this.showOnboarding();
            }
        });
    }
    async analyzeCurrentFile() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage("활성화된 에디터가 없습니다.");
            return;
        }
        const sidebarProvider = this.context.providerRegistry.getProvider("sidebar");
        if (sidebarProvider &&
            typeof sidebarProvider.analyzeCode === "function") {
            await sidebarProvider.analyzeCode(editor.document.getText());
        }
    }
    async generateTestForCurrentFile() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage("활성화된 에디터가 없습니다.");
            return;
        }
        const sidebarProvider = this.context.providerRegistry.getProvider("sidebar");
        if (sidebarProvider &&
            typeof sidebarProvider.generateTest === "function") {
            await sidebarProvider.generateTest(editor.document.getText());
        }
    }
    async explainCurrentFile() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage("활성화된 에디터가 없습니다.");
            return;
        }
        const sidebarProvider = this.context.providerRegistry.getProvider("sidebar");
        if (sidebarProvider &&
            typeof sidebarProvider.explainCode === "function") {
            await sidebarProvider.explainCode(editor.document.getText());
        }
    }
    async analyzeSelection() {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.selection.isEmpty) {
            vscode.window.showWarningMessage("선택된 텍스트가 없습니다.");
            return;
        }
        const selectedText = editor.document.getText(editor.selection);
        const sidebarProvider = this.context.providerRegistry.getProvider("sidebar");
        if (sidebarProvider &&
            typeof sidebarProvider.analyzeCode === "function") {
            await sidebarProvider.analyzeCode(selectedText);
        }
    }
    async generateTestForSelection() {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.selection.isEmpty) {
            vscode.window.showWarningMessage("선택된 텍스트가 없습니다.");
            return;
        }
        const selectedText = editor.document.getText(editor.selection);
        const sidebarProvider = this.context.providerRegistry.getProvider("sidebar");
        if (sidebarProvider &&
            typeof sidebarProvider.generateTest === "function") {
            await sidebarProvider.generateTest(selectedText);
        }
    }
    async explainSelection() {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.selection.isEmpty) {
            vscode.window.showWarningMessage("선택된 텍스트가 없습니다.");
            return;
        }
        const selectedText = editor.document.getText(editor.selection);
        const sidebarProvider = this.context.providerRegistry.getProvider("sidebar");
        if (sidebarProvider &&
            typeof sidebarProvider.explainCode === "function") {
            await sidebarProvider.explainCode(selectedText);
        }
    }
    async insertCode(code) {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage("활성화된 에디터가 없습니다.");
            return;
        }
        await editor.edit((editBuilder) => {
            editBuilder.insert(editor.selection.active, code);
        });
    }
    async openWebsite() {
        // 설정에서 웹사이트 URL 가져오기 (기본값: 로컬 개발 서버)
        const websiteUrl = this.configService.get("websiteURL", "http://localhost:3000");
        await vscode.env.openExternal(vscode.Uri.parse(websiteUrl));
    }
    async openDocumentation() {
        // 설정에서 문서 URL 가져오기 (기본값: 로컬 개발 서버)
        const docUrl = this.configService.get("documentationURL", "http://localhost:3000/guide");
        await vscode.env.openExternal(vscode.Uri.parse(docUrl));
    }
    async openUserSettings() {
        await vscode.commands.executeCommand("workbench.action.openSettings", "hapa");
    }
    // 고급 기능 핸들러들
    async showPerformanceReport() {
        const { PerformanceOptimizer } = await Promise.resolve().then(() => __importStar(require("../services/PerformanceOptimizer")));
        const report = PerformanceOptimizer.getInstance().generatePerformanceReport();
        vscode.window.showInformationMessage(`HAPA 성능 보고서: ${report}`);
    }
    async showOfflineStatus() {
        const { OfflineService } = await Promise.resolve().then(() => __importStar(require("../services/OfflineService")));
        const status = OfflineService.getInstance().getStatus();
        vscode.window.showInformationMessage(`HAPA 오프라인 상태: ${status.isOnline ? "온라인" : "오프라인"}`);
    }
    async validateConfigs() {
        const { ConfigValidationService } = await Promise.resolve().then(() => __importStar(require("../services/ConfigValidationService")));
        const isValid = ConfigValidationService.getInstance().validateAllConfigs();
        vscode.window.showInformationMessage(`HAPA 설정 검증: ${isValid ? "유효" : "오류 발견"}`);
    }
    async clearOfflineCache() {
        const { OfflineService } = await Promise.resolve().then(() => __importStar(require("../services/OfflineService")));
        OfflineService.getInstance().clearCache();
        vscode.window.showInformationMessage("HAPA 오프라인 캐시가 삭제되었습니다.");
    }
    async resetPerformanceMetrics() {
        const { PerformanceOptimizer } = await Promise.resolve().then(() => __importStar(require("../services/PerformanceOptimizer")));
        PerformanceOptimizer.getInstance().clearMetrics();
        vscode.window.showInformationMessage("HAPA 성능 메트릭이 초기화되었습니다.");
    }
    async showUsageReport() {
        const { TelemetryService } = await Promise.resolve().then(() => __importStar(require("../services/TelemetryService")));
        const report = TelemetryService.getInstance().generateUsageReport();
        vscode.window.showInformationMessage(`HAPA 사용 통계: ${report}`);
    }
    async showTelemetryStats() {
        const { TelemetryService } = await Promise.resolve().then(() => __importStar(require("../services/TelemetryService")));
        const stats = TelemetryService.getInstance().getStatistics();
        vscode.window.showInformationMessage(`HAPA 텔레메트리: ${JSON.stringify(stats)}`);
    }
    async toggleTelemetry() {
        const { TelemetryService } = await Promise.resolve().then(() => __importStar(require("../services/TelemetryService")));
        const telemetryService = TelemetryService.getInstance();
        const stats = telemetryService.getStatistics();
        const currentState = stats.isEnabled || false;
        telemetryService.setEnabled(!currentState);
        vscode.window.showInformationMessage("HAPA 텔레메트리 설정이 변경되었습니다.");
    }
    // 접근성 핸들러들
    async showAccessibilityReport() {
        const { AccessibilityService } = await Promise.resolve().then(() => __importStar(require("../services/AccessibilityService")));
        const report = AccessibilityService.getInstance().generateAccessibilityReport();
        vscode.window.showInformationMessage(`HAPA 접근성 보고서: ${report}`);
    }
    async announceStatus() {
        const { AccessibilityService } = await Promise.resolve().then(() => __importStar(require("../services/AccessibilityService")));
        AccessibilityService.getInstance().announceCurrentStatus();
    }
    async readSelection() {
        const { AccessibilityService } = await Promise.resolve().then(() => __importStar(require("../services/AccessibilityService")));
        AccessibilityService.getInstance().readSelection();
    }
    async increaseFontSize() {
        const { AccessibilityService } = await Promise.resolve().then(() => __importStar(require("../services/AccessibilityService")));
        AccessibilityService.getInstance().adjustFontSize(2);
    }
    async decreaseFontSize() {
        const { AccessibilityService } = await Promise.resolve().then(() => __importStar(require("../services/AccessibilityService")));
        AccessibilityService.getInstance().adjustFontSize(-2);
    }
    async toggleHighContrast() {
        const { AccessibilityService } = await Promise.resolve().then(() => __importStar(require("../services/AccessibilityService")));
        AccessibilityService.getInstance().toggleFeature("high-contrast");
    }
    async toggleKeyboardNavigation() {
        const { AccessibilityService } = await Promise.resolve().then(() => __importStar(require("../services/AccessibilityService")));
        AccessibilityService.getInstance().toggleFeature("keyboard-navigation");
    }
    async toggleScreenReader() {
        const { AccessibilityService } = await Promise.resolve().then(() => __importStar(require("../services/AccessibilityService")));
        AccessibilityService.getInstance().toggleFeature("screen-reader");
    }
    // 반응형 디자인 핸들러들
    async showResponsiveReport() {
        const { ResponsiveDesignService } = await Promise.resolve().then(() => __importStar(require("../services/ResponsiveDesignService")));
        const report = ResponsiveDesignService.getInstance().generateResponsiveReport();
        vscode.window.showInformationMessage(`HAPA 반응형 보고서: ${report}`);
    }
    async showResponsiveCSS() {
        const { ResponsiveDesignService } = await Promise.resolve().then(() => __importStar(require("../services/ResponsiveDesignService")));
        const css = ResponsiveDesignService.getInstance().generateResponsiveCSS();
        vscode.window.showInformationMessage(`HAPA 반응형 CSS: ${css}`);
    }
    async toggleResponsive() {
        const { ResponsiveDesignService } = await Promise.resolve().then(() => __importStar(require("../services/ResponsiveDesignService")));
        const service = ResponsiveDesignService.getInstance();
        const currentState = service.getCurrentState();
        service.setResponsiveEnabled(!currentState.isEnabled);
        vscode.window.showInformationMessage("HAPA 반응형 디자인이 토글되었습니다.");
    }
    async setBreakpointMobile() {
        const { ResponsiveDesignService } = await Promise.resolve().then(() => __importStar(require("../services/ResponsiveDesignService")));
        ResponsiveDesignService.getInstance().setBreakpoint("mobile");
    }
    async setBreakpointTablet() {
        const { ResponsiveDesignService } = await Promise.resolve().then(() => __importStar(require("../services/ResponsiveDesignService")));
        ResponsiveDesignService.getInstance().setBreakpoint("tablet");
    }
    async setBreakpointDesktop() {
        const { ResponsiveDesignService } = await Promise.resolve().then(() => __importStar(require("../services/ResponsiveDesignService")));
        ResponsiveDesignService.getInstance().setBreakpoint("medium");
    }
    // =============================================================================
    // 유틸리티 메서드들
    // =============================================================================
    /**
     * 등록된 명령어 목록 가져오기
     */
    getRegisteredCommands() {
        return Array.from(this.registeredCommands.keys());
    }
    /**
     * 카테고리별 명령어 가져오기
     */
    getCommandsByCategory(category) {
        return Array.from(this.registeredCommands.values())
            .filter((cmd) => cmd.category === category)
            .map((cmd) => cmd.command);
    }
    /**
     * 정리 (deactivate 시 호출)
     */
    dispose() {
        console.log("🔄 명령어 정리 시작...");
        this.disposables.forEach((disposable) => disposable.dispose());
        this.disposables = [];
        this.registeredCommands.clear();
        console.log("✅ 명령어 정리 완료");
    }
}
exports.CommandRegistry = CommandRegistry;
//# sourceMappingURL=CommandRegistry.js.map