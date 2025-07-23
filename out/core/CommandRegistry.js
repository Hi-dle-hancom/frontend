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
exports.CommandRegistry = void 0;
const vscode = __importStar(require("vscode"));
const ConfigService_1 = require("../services/ConfigService");
class CommandRegistry {
    context;
    sidebarProvider;
    onboardingProvider;
    settingsProvider;
    guideProvider;
    disposables = [];
    registeredCommands = new Map();
    configService;
    constructor(context, sidebarProvider, onboardingProvider, settingsProvider, guideProvider) {
        this.context = context;
        this.sidebarProvider = sidebarProvider;
        this.onboardingProvider = onboardingProvider;
        this.settingsProvider = settingsProvider;
        this.guideProvider = guideProvider;
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
        try {
            // ConfigService 초기화 확인
            await this.configService.update("userProfile.isOnboardingCompleted", false, true);
            await this.configService.update("userProfile.pythonSkillLevel", "intermediate", true);
            await this.configService.update("userProfile.codeOutputStructure", "standard", true);
            await this.configService.update("userProfile.explanationStyle", "standard", true);
            await this.configService.update("userProfile.projectContext", "general_purpose", true);
            await this.configService.update("userProfile.errorHandlingPreference", "basic", true);
            const selection = await vscode.window.showInformationMessage("온보딩 설정이 초기화되었습니다. 이제 온보딩을 다시 시작할 수 있습니다.", "온보딩 시작하기");
            if (selection === "온보딩 시작하기") {
                await this.showOnboarding();
            }
        }
        catch (error) {
            console.error("❌ 온보딩 초기화 실패:", error);
            vscode.window.showErrorMessage("온보딩 설정 초기화 중 오류가 발생했습니다.");
        }
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
        try {
            const { PerformanceOptimizer } = await Promise.resolve().then(() => __importStar(require("../services/PerformanceOptimizer")));
            const report = PerformanceOptimizer.getInstance().generatePerformanceReport();
            vscode.window.showInformationMessage(`HAPA 성능 보고서: ${report}`);
        }
        catch (error) {
            console.error("❌ 성능 보고서 생성 실패:", error);
            vscode.window.showErrorMessage("성능 보고서를 생성할 수 없습니다.");
        }
    }
    async showOfflineStatus() {
        try {
            const { OfflineService } = await Promise.resolve().then(() => __importStar(require("../services/OfflineService")));
            const status = OfflineService.getInstance().getStatus();
            vscode.window.showInformationMessage(`HAPA 오프라인 상태: ${status.isOnline ? "온라인" : "오프라인"}`);
        }
        catch (error) {
            console.error("❌ 오프라인 상태 확인 실패:", error);
            vscode.window.showErrorMessage("오프라인 상태를 확인할 수 없습니다.");
        }
    }
    async validateConfigs() {
        try {
            const { ConfigValidationService } = await Promise.resolve().then(() => __importStar(require("../services/ConfigValidationService")));
            const isValid = ConfigValidationService.getInstance().validateAllConfigs();
            vscode.window.showInformationMessage(`HAPA 설정 검증: ${isValid ? "유효" : "오류 발견"}`);
        }
        catch (error) {
            console.error("❌ 설정 검증 실패:", error);
            vscode.window.showErrorMessage("설정을 검증할 수 없습니다.");
        }
    }
    async clearOfflineCache() {
        try {
            const { OfflineService } = await Promise.resolve().then(() => __importStar(require("../services/OfflineService")));
            OfflineService.getInstance().clearCache();
            vscode.window.showInformationMessage("HAPA 오프라인 캐시가 삭제되었습니다.");
        }
        catch (error) {
            console.error("❌ 오프라인 캐시 삭제 실패:", error);
            vscode.window.showErrorMessage("오프라인 캐시를 삭제할 수 없습니다.");
        }
    }
    async resetPerformanceMetrics() {
        try {
            const { PerformanceOptimizer } = await Promise.resolve().then(() => __importStar(require("../services/PerformanceOptimizer")));
            PerformanceOptimizer.getInstance().clearMetrics();
            vscode.window.showInformationMessage("HAPA 성능 메트릭이 초기화되었습니다.");
        }
        catch (error) {
            console.error("❌ 성능 메트릭 초기화 실패:", error);
            vscode.window.showErrorMessage("성능 메트릭을 초기화할 수 없습니다.");
        }
    }
    async showUsageReport() {
        try {
            const { TelemetryService } = await Promise.resolve().then(() => __importStar(require("../services/TelemetryService")));
            const report = TelemetryService.getInstance().generateUsageReport();
            vscode.window.showInformationMessage(`HAPA 사용 통계: ${report}`);
        }
        catch (error) {
            console.error("❌ 사용 통계 생성 실패:", error);
            vscode.window.showErrorMessage("사용 통계를 생성할 수 없습니다.");
        }
    }
    async showTelemetryStats() {
        try {
            const { TelemetryService } = await Promise.resolve().then(() => __importStar(require("../services/TelemetryService")));
            const stats = TelemetryService.getInstance().getStatistics();
            vscode.window.showInformationMessage(`HAPA 텔레메트리: ${JSON.stringify(stats)}`);
        }
        catch (error) {
            console.error("❌ 텔레메트리 상태 확인 실패:", error);
            vscode.window.showErrorMessage("텔레메트리 상태를 확인할 수 없습니다.");
        }
    }
    async toggleTelemetry() {
        try {
            const { TelemetryService } = await Promise.resolve().then(() => __importStar(require("../services/TelemetryService")));
            const telemetryService = TelemetryService.getInstance();
            const stats = telemetryService.getStatistics();
            const currentState = stats.isEnabled || false;
            telemetryService.setEnabled(!currentState);
            vscode.window.showInformationMessage("HAPA 텔레메트리 설정이 변경되었습니다.");
        }
        catch (error) {
            console.error("❌ 텔레메트리 설정 변경 실패:", error);
            vscode.window.showErrorMessage("텔레메트리 설정을 변경할 수 없습니다.");
        }
    }
    // 접근성 핸들러들
    async showAccessibilityReport() {
        try {
            const { AccessibilityService } = await Promise.resolve().then(() => __importStar(require("../services/AccessibilityService")));
            const report = AccessibilityService.getInstance().generateAccessibilityReport();
            vscode.window.showInformationMessage(`HAPA 접근성 보고서: ${report}`);
        }
        catch (error) {
            console.error("❌ 접근성 보고서 생성 실패:", error);
            vscode.window.showErrorMessage("접근성 보고서를 생성할 수 없습니다.");
        }
    }
    async announceStatus() {
        try {
            const { AccessibilityService } = await Promise.resolve().then(() => __importStar(require("../services/AccessibilityService")));
            AccessibilityService.getInstance().announceCurrentStatus();
        }
        catch (error) {
            console.error("❌ 상태 안내 실패:", error);
            vscode.window.showErrorMessage("상태를 안내할 수 없습니다.");
        }
    }
    async readSelection() {
        try {
            const { AccessibilityService } = await Promise.resolve().then(() => __importStar(require("../services/AccessibilityService")));
            AccessibilityService.getInstance().readSelection();
        }
        catch (error) {
            console.error("❌ 선택 텍스트 읽기 실패:", error);
            vscode.window.showErrorMessage("선택된 텍스트를 읽을 수 없습니다.");
        }
    }
    async increaseFontSize() {
        try {
            const { AccessibilityService } = await Promise.resolve().then(() => __importStar(require("../services/AccessibilityService")));
            AccessibilityService.getInstance().adjustFontSize(2);
        }
        catch (error) {
            console.error("❌ 폰트 크기 증가 실패:", error);
            vscode.window.showErrorMessage("폰트 크기를 조정할 수 없습니다.");
        }
    }
    async decreaseFontSize() {
        try {
            const { AccessibilityService } = await Promise.resolve().then(() => __importStar(require("../services/AccessibilityService")));
            AccessibilityService.getInstance().adjustFontSize(-2);
        }
        catch (error) {
            console.error("❌ 폰트 크기 감소 실패:", error);
            vscode.window.showErrorMessage("폰트 크기를 조정할 수 없습니다.");
        }
    }
    async toggleHighContrast() {
        try {
            const { AccessibilityService } = await Promise.resolve().then(() => __importStar(require("../services/AccessibilityService")));
            AccessibilityService.getInstance().toggleFeature("high-contrast");
        }
        catch (error) {
            console.error("❌ 고대비 모드 토글 실패:", error);
            vscode.window.showErrorMessage("고대비 모드를 변경할 수 없습니다.");
        }
    }
    async toggleKeyboardNavigation() {
        try {
            const { AccessibilityService } = await Promise.resolve().then(() => __importStar(require("../services/AccessibilityService")));
            AccessibilityService.getInstance().toggleFeature("keyboard-navigation");
        }
        catch (error) {
            console.error("❌ 키보드 네비게이션 토글 실패:", error);
            vscode.window.showErrorMessage("키보드 네비게이션을 변경할 수 없습니다.");
        }
    }
    async toggleScreenReader() {
        try {
            const { AccessibilityService } = await Promise.resolve().then(() => __importStar(require("../services/AccessibilityService")));
            AccessibilityService.getInstance().toggleFeature("screen-reader");
        }
        catch (error) {
            console.error("❌ 스크린 리더 모드 토글 실패:", error);
            vscode.window.showErrorMessage("스크린 리더 모드를 변경할 수 없습니다.");
        }
    }
    // 반응형 디자인 핸들러들
    async showResponsiveReport() {
        try {
            const { ResponsiveDesignService } = await Promise.resolve().then(() => __importStar(require("../services/ResponsiveDesignService")));
            const report = ResponsiveDesignService.getInstance().generateResponsiveReport();
            vscode.window.showInformationMessage(`HAPA 반응형 보고서: ${report}`);
        }
        catch (error) {
            console.error("❌ 반응형 보고서 생성 실패:", error);
            vscode.window.showErrorMessage("반응형 보고서를 생성할 수 없습니다.");
        }
    }
    async showResponsiveCSS() {
        try {
            const { ResponsiveDesignService } = await Promise.resolve().then(() => __importStar(require("../services/ResponsiveDesignService")));
            const css = ResponsiveDesignService.getInstance().generateResponsiveCSS();
            vscode.window.showInformationMessage(`HAPA 반응형 CSS: ${css}`);
        }
        catch (error) {
            console.error("❌ 반응형 CSS 생성 실패:", error);
            vscode.window.showErrorMessage("반응형 CSS를 생성할 수 없습니다.");
        }
    }
    async toggleResponsive() {
        try {
            const { ResponsiveDesignService } = await Promise.resolve().then(() => __importStar(require("../services/ResponsiveDesignService")));
            const service = ResponsiveDesignService.getInstance();
            const currentState = service.getCurrentState();
            service.setResponsiveEnabled(!currentState.isEnabled);
            vscode.window.showInformationMessage("HAPA 반응형 디자인이 토글되었습니다.");
        }
        catch (error) {
            console.error("❌ 반응형 디자인 토글 실패:", error);
            vscode.window.showErrorMessage("반응형 디자인을 변경할 수 없습니다.");
        }
    }
    async setBreakpointMobile() {
        try {
            const { ResponsiveDesignService } = await Promise.resolve().then(() => __importStar(require("../services/ResponsiveDesignService")));
            ResponsiveDesignService.getInstance().setBreakpoint("mobile");
        }
        catch (error) {
            console.error("❌ 모바일 브레이크포인트 설정 실패:", error);
            vscode.window.showErrorMessage("모바일 브레이크포인트를 설정할 수 없습니다.");
        }
    }
    async setBreakpointTablet() {
        try {
            const { ResponsiveDesignService } = await Promise.resolve().then(() => __importStar(require("../services/ResponsiveDesignService")));
            ResponsiveDesignService.getInstance().setBreakpoint("tablet");
        }
        catch (error) {
            console.error("❌ 태블릿 브레이크포인트 설정 실패:", error);
            vscode.window.showErrorMessage("태블릿 브레이크포인트를 설정할 수 없습니다.");
        }
    }
    async setBreakpointDesktop() {
        try {
            const { ResponsiveDesignService } = await Promise.resolve().then(() => __importStar(require("../services/ResponsiveDesignService")));
            ResponsiveDesignService.getInstance().setBreakpoint("medium");
        }
        catch (error) {
            console.error("❌ 데스크톱 브레이크포인트 설정 실패:", error);
            vscode.window.showErrorMessage("데스크톱 브레이크포인트를 설정할 수 없습니다.");
        }
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