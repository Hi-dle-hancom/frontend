"use strict";
/**
 * HAPA VSCode Extension - 확장 관리자
 * @fileoverview 확장의 전체 생명주기와 컴포넌트들을 관리
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
const SidebarProvider_1 = require("../providers/SidebarProvider");
const GuideProvider_1 = require("../providers/GuideProvider");
const SettingsProvider_1 = require("../providers/SettingsProvider");
const OnboardingProvider_1 = require("../providers/OnboardingProvider");
const CompletionProvider_1 = require("../providers/CompletionProvider");
const ConfigService_1 = require("../services/ConfigService");
const ErrorService_1 = require("../services/ErrorService");
/**
 * 확장 관리자 클래스
 */
class ExtensionManager {
    context;
    providers = new Map();
    disposables = [];
    isActivated = false;
    constructor(context) {
        this.context = context;
    }
    /**
     * 확장 활성화
     */
    async activate() {
        if (this.isActivated) {
            console.warn("Extension is already activated");
            return;
        }
        try {
            console.log("🚀 HAPA Extension 활성화 시작...");
            // 설정 서비스 초기화
            ConfigService_1.configService.setContext(this.context);
            // 프로바이더 등록
            await this.registerProviders();
            // 명령어 등록
            this.registerCommands();
            // 이벤트 리스너 등록
            this.registerEventListeners();
            // 온보딩 확인
            await this.checkOnboarding();
            this.isActivated = true;
            console.log("✅ HAPA Extension 활성화 완료");
        }
        catch (error) {
            await ErrorService_1.ErrorService.getInstance().handleError(error instanceof Error ? error : new Error(String(error)), ErrorService_1.ErrorCategory.SYSTEM, ErrorService_1.ErrorSeverity.CRITICAL, { showToUser: true });
        }
    }
    /**
     * 확장 비활성화
     */
    async deactivate() {
        if (!this.isActivated) {
            return;
        }
        try {
            console.log("🔄 HAPA Extension 비활성화 시작...");
            // 모든 disposable 정리
            this.disposables.forEach((disposable) => disposable.dispose());
            this.disposables = [];
            // 프로바이더 정리
            this.providers.forEach((provider) => {
                if (provider.dispose) {
                    provider.dispose();
                }
            });
            this.providers.clear();
            // 서비스 정리
            ConfigService_1.configService.dispose();
            ErrorService_1.ErrorService.getInstance().clearHistory();
            this.isActivated = false;
            console.log("✅ HAPA Extension 비활성화 완료");
        }
        catch (error) {
            console.error("Extension deactivation error:", error);
        }
    }
    /**
     * 프로바이더 등록
     */
    async registerProviders() {
        const extensionUri = this.context.extensionUri;
        // 사이드바 프로바이더
        const sidebarProvider = new SidebarProvider_1.SidebarProvider(extensionUri);
        sidebarProvider.setContext(this.context);
        this.disposables.push(vscode.window.registerWebviewViewProvider("hapa-dashboard", sidebarProvider));
        this.providers.set("sidebar", sidebarProvider);
        // 가이드 프로바이더
        const guideProvider = new GuideProvider_1.GuideProvider(extensionUri);
        this.providers.set("guide", guideProvider);
        // 설정 프로바이더
        const settingsProvider = new SettingsProvider_1.SettingsProvider(extensionUri);
        this.providers.set("settings", settingsProvider);
        // 온보딩 프로바이더
        const onboardingProvider = new OnboardingProvider_1.OnboardingProvider(extensionUri);
        this.providers.set("onboarding", onboardingProvider);
        // 코드 완성 프로바이더
        const completionProvider = new CompletionProvider_1.HAPACompletionProvider();
        const inlineCompletionProvider = new CompletionProvider_1.HAPAInlineCompletionProvider();
        this.disposables.push(vscode.languages.registerCompletionItemProvider({ scheme: "file", language: "python" }, completionProvider, "."), vscode.languages.registerInlineCompletionItemProvider({ scheme: "file", language: "python" }, inlineCompletionProvider));
        this.providers.set("completion", completionProvider);
        this.providers.set("inlineCompletion", inlineCompletionProvider);
        console.log("📦 프로바이더 등록 완료");
    }
    /**
     * 명령어 등록
     */
    registerCommands() {
        const commands = [
            {
                command: "hapa.start",
                callback: () => this.showSidebar(),
                title: "HAPA 시작하기",
            },
            {
                command: "hapa.settings",
                callback: () => this.showSettings(),
                title: "HAPA 설정",
            },
            {
                command: "hapa.analyze",
                callback: () => this.analyzeCurrentFile(),
                title: "HAPA 코드 분석",
            },
            {
                command: "hapa.generateTest",
                callback: () => this.generateTestForCurrentFile(),
                title: "HAPA 테스트 생성",
            },
            {
                command: "hapa.explain",
                callback: () => this.explainCurrentFile(),
                title: "HAPA 코드 설명",
            },
            {
                command: "hapa.analyzeSelection",
                callback: () => this.analyzeSelection(),
                title: "HAPA 선택 영역 분석",
            },
            {
                command: "hapa.testSelection",
                callback: () => this.generateTestForSelection(),
                title: "HAPA 선택 영역 테스트 생성",
            },
            {
                command: "hapa.explainSelection",
                callback: () => this.explainSelection(),
                title: "HAPA 선택 영역 설명",
            },
            {
                command: "hapa.insertCode",
                callback: (code) => this.insertCode(code),
                title: "HAPA 코드 삽입",
            },
            {
                command: "hapa.openWebsite",
                callback: () => this.openWebsite(),
                title: "HAPA 웹사이트 방문",
            },
            {
                command: "hapa.openDocs",
                callback: () => this.openDocumentation(),
                title: "HAPA 문서 보기",
            },
            {
                command: "hapa.showGuide",
                callback: () => this.showGuide(),
                title: "HAPA 가이드 보기",
            },
            {
                command: "hapa.showSettings",
                callback: () => this.showSettings(),
                title: "HAPA 설정 보기",
            },
            {
                command: "hapa.showOnboarding",
                callback: () => this.showOnboarding(),
                title: "HAPA 온보딩 시작",
            },
            {
                command: "hapa.openUserSettings",
                callback: () => this.openUserSettings(),
                title: "HAPA 사용자 설정",
            },
        ];
        commands.forEach(({ command, callback }) => {
            this.disposables.push(vscode.commands.registerCommand(command, callback));
        });
        console.log(`📋 ${commands.length}개 명령어 등록 완료`);
    }
    /**
     * 이벤트 리스너 등록
     */
    registerEventListeners() {
        // 설정 변경 감지
        this.disposables.push(ConfigService_1.configService.onConfigChange(async (event) => {
            console.log(`⚙️ 설정 변경: ${event.key}`);
            await this.onConfigurationChanged(event);
        }));
        // 에디터 변경 감지
        this.disposables.push(vscode.window.onDidChangeActiveTextEditor((editor) => {
            this.onActiveEditorChanged(editor);
        }));
        // 텍스트 문서 변경 감지
        this.disposables.push(vscode.workspace.onDidChangeTextDocument((event) => {
            this.onTextDocumentChanged(event);
        }));
        console.log("👂 이벤트 리스너 등록 완료");
    }
    /**
     * 온보딩 확인
     */
    async checkOnboarding() {
        const config = ConfigService_1.configService.getExtensionConfig();
        if (!config.userProfile.isOnboardingCompleted) {
            await this.showOnboarding();
        }
    }
    /**
     * 설정 변경 처리
     */
    async onConfigurationChanged(event) {
        // API 설정 변경 시 연결 상태 확인
        if (event.key.includes("api")) {
            const sidebarProvider = this.providers.get("sidebar");
            if (sidebarProvider && sidebarProvider.updateApiStatus) {
                await sidebarProvider.updateApiStatus();
            }
        }
    }
    /**
     * 활성 에디터 변경 처리
     */
    onActiveEditorChanged(editor) {
        const sidebarProvider = this.providers.get("sidebar");
        if (sidebarProvider && sidebarProvider.updateContext) {
            sidebarProvider.updateContext();
        }
    }
    /**
     * 텍스트 문서 변경 처리
     */
    onTextDocumentChanged(event) {
        // Python 파일인 경우에만 처리
        if (event.document.languageId === "python") {
            // 트리거 감지 로직
            const sidebarProvider = this.providers.get("sidebar");
            if (sidebarProvider && sidebarProvider.detectTriggers) {
                sidebarProvider.detectTriggers(event);
            }
        }
    }
    // ============================================================================
    // COMMAND HANDLERS
    // ============================================================================
    async showSidebar() {
        await vscode.commands.executeCommand("workbench.view.extension.hapa-sidebar");
    }
    async showSettings() {
        const settingsProvider = this.providers.get("settings");
        if (settingsProvider) {
            settingsProvider.show();
        }
    }
    async showGuide() {
        const guideProvider = this.providers.get("guide");
        if (guideProvider) {
            guideProvider.show();
        }
    }
    async showOnboarding() {
        const onboardingProvider = this.providers.get("onboarding");
        if (onboardingProvider) {
            onboardingProvider.show();
        }
    }
    async analyzeCurrentFile() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage("활성화된 에디터가 없습니다.");
            return;
        }
        const sidebarProvider = this.providers.get("sidebar");
        if (sidebarProvider) {
            await sidebarProvider.analyzeCode(editor.document.getText());
        }
    }
    async generateTestForCurrentFile() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage("활성화된 에디터가 없습니다.");
            return;
        }
        const sidebarProvider = this.providers.get("sidebar");
        if (sidebarProvider) {
            await sidebarProvider.generateTest(editor.document.getText());
        }
    }
    async explainCurrentFile() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage("활성화된 에디터가 없습니다.");
            return;
        }
        const sidebarProvider = this.providers.get("sidebar");
        if (sidebarProvider) {
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
        const sidebarProvider = this.providers.get("sidebar");
        if (sidebarProvider) {
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
        const sidebarProvider = this.providers.get("sidebar");
        if (sidebarProvider) {
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
        const sidebarProvider = this.providers.get("sidebar");
        if (sidebarProvider) {
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
        await vscode.env.openExternal(vscode.Uri.parse("http://localhost:3000"));
    }
    async openDocumentation() {
        await vscode.env.openExternal(vscode.Uri.parse("http://localhost:3000/guide"));
    }
    async openUserSettings() {
        await vscode.commands.executeCommand("workbench.action.openSettings", "hapa");
    }
    // ============================================================================
    // GETTERS
    // ============================================================================
    getProvider(name) {
        return this.providers.get(name);
    }
    getContext() {
        return this.context;
    }
    isExtensionActivated() {
        return this.isActivated;
    }
    getDisposables() {
        return [...this.disposables];
    }
}
exports.ExtensionManager = ExtensionManager;
//# sourceMappingURL=ExtensionManager.js.map