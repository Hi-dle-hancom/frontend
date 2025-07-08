/**
 * HAPA VSCode Extension - 확장 관리자
 * @fileoverview 확장의 전체 생명주기와 컴포넌트들을 관리
 */

import * as vscode from "vscode";
import { SidebarProvider } from "../providers/SidebarProvider";
import { GuideProvider } from "../providers/GuideProvider";
import { SettingsProvider } from "../providers/SettingsProvider";
import { OnboardingProvider } from "../providers/OnboardingProvider";
import {
  HAPACompletionProvider,
  HAPAInlineCompletionProvider,
} from "../providers/CompletionProvider";
import { configService } from "../services/ConfigService";
import {
  EnhancedErrorService,
  ErrorSeverity,
} from "../services/EnhancedErrorService";
import { MemoryManager } from "../services/MemoryManager";
import { PerformanceOptimizer } from "../services/PerformanceOptimizer";
import { OfflineService } from "../services/OfflineService";
import { ConfigValidationService } from "../services/ConfigValidationService";
import { LoadingService } from "../services/LoadingService";
import { TelemetryService } from "../services/TelemetryService";
import { AccessibilityService } from "../services/AccessibilityService";
import { ResponsiveDesignService } from "../services/ResponsiveDesignService";
import { TriggerDetector, TriggerEvent } from "../modules/triggerDetector";
import { CodeInserter } from "../modules/inserter";
import { ExtensionConfig } from "../types";

/**
 * 확장 관리자 클래스
 */
export class ExtensionManager {
  private context: vscode.ExtensionContext;
  private providers: Map<string, any> = new Map();
  private disposables: vscode.Disposable[] = [];
  private isActivated = false;

  // 서비스들
  private memoryManager = MemoryManager.getInstance();
  private performanceOptimizer = PerformanceOptimizer.getInstance();
  private offlineService = OfflineService.getInstance();
  private configValidationService = ConfigValidationService.getInstance();
  private loadingService = LoadingService.getInstance();
  private telemetryService = TelemetryService.getInstance();
  private accessibilityService = AccessibilityService.getInstance();
  private responsiveDesignService = ResponsiveDesignService.getInstance();

  // 트리거 및 코드 처리
  private triggerDetector: TriggerDetector | null = null;
  private codeInserter = new CodeInserter();

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  /**
   * 확장 활성화
   */
  public async activate(): Promise<void> {
    if (this.isActivated) {
      console.warn("Extension is already activated");
      return;
    }

    try {
      console.log("🚀 HAPA Extension 활성화 시작...");

      // 서비스들 초기화
      await this.initializeServices();

      // 설정 서비스 초기화
      configService.setContext(this.context);

      // 프로바이더 등록
      await this.registerProviders();

      // 명령어 등록
      this.registerCommands();

      // 이벤트 리스너 등록
      this.registerEventListeners();

      // 트리거 설정
      this.setupTriggerDetector();

      // 온보딩 확인
      await this.checkOnboarding();

      this.isActivated = true;
      console.log("✅ HAPA Extension 활성화 완료");
    } catch (error) {
      EnhancedErrorService.getInstance().logError(
        error instanceof Error ? error : new Error(String(error)),
        ErrorSeverity.CRITICAL,
        { component: "ExtensionManager", operation: "activate" }
      );
    }
  }

  /**
   * 서비스들 초기화
   */
  private async initializeServices(): Promise<void> {
    try {
      this.memoryManager.initialize();
      console.log("📦 모든 서비스 초기화 완료");
    } catch (error) {
      EnhancedErrorService.getInstance().logError(
        error instanceof Error ? error : new Error(String(error)),
        ErrorSeverity.HIGH,
        { component: "ExtensionManager", operation: "initializeServices" }
      );
    }
  }

  /**
   * 트리거 디텍터 설정
   */
  private setupTriggerDetector(): void {
    try {
      this.triggerDetector = new TriggerDetector();

      // 트리거 이벤트 처리
      this.triggerDetector.onTrigger((event: TriggerEvent) => {
        this.handleTriggerEvent(event);
      });

      console.log("🎯 TriggerDetector 설정 완료");
    } catch (error) {
      EnhancedErrorService.getInstance().logError(
        error instanceof Error ? error : new Error(String(error)),
        ErrorSeverity.HIGH,
        { component: "TriggerDetector" }
      );
    }
  }

  /**
   * 트리거 이벤트 처리
   */
  private async handleTriggerEvent(event: TriggerEvent): Promise<void> {
    try {
      const sidebarProvider = this.providers.get("sidebar");
      if (sidebarProvider && sidebarProvider.handleTriggerEvent) {
        await sidebarProvider.handleTriggerEvent(event);
      }
    } catch (error) {
      EnhancedErrorService.getInstance().logError(
        error instanceof Error ? error : new Error(String(error)),
        ErrorSeverity.MEDIUM,
        { event: event.type }
      );
    }
  }

  // 성능 및 모니터링 관련 메서드들
  private async showPerformanceReport(): Promise<void> {
    const report = this.performanceOptimizer.generatePerformanceReport();
    vscode.window.showInformationMessage(`HAPA 성능 보고서: ${report}`);
  }

  private async showOfflineStatus(): Promise<void> {
    const status = this.offlineService.getStatus();
    vscode.window.showInformationMessage(
      `HAPA 오프라인 상태: ${status.isOnline ? "온라인" : "오프라인"}`
    );
  }

  private async validateConfigs(): Promise<void> {
    const isValid = this.configValidationService.validateAllConfigs();
    vscode.window.showInformationMessage(
      `HAPA 설정 검증: ${isValid ? "유효" : "오류 발견"}`
    );
  }

  private async clearOfflineCache(): Promise<void> {
    this.offlineService.clearCache();
    vscode.window.showInformationMessage(
      "HAPA 오프라인 캐시가 삭제되었습니다."
    );
  }

  private async resetPerformanceMetrics(): Promise<void> {
    this.performanceOptimizer.clearMetrics();
    vscode.window.showInformationMessage(
      "HAPA 성능 메트릭이 초기화되었습니다."
    );
  }

  // 텔레메트리 관련 메서드들
  private async showUsageReport(): Promise<void> {
    const report = this.telemetryService.generateUsageReport();
    vscode.window.showInformationMessage(`HAPA 사용 통계: ${report}`);
  }

  private async showTelemetryStats(): Promise<void> {
    const stats = this.telemetryService.getStatistics();
    vscode.window.showInformationMessage(
      `HAPA 텔레메트리: ${JSON.stringify(stats)}`
    );
  }

  private async toggleTelemetry(): Promise<void> {
    const stats = this.telemetryService.getStatistics();
    const currentState = stats.isEnabled || false;
    this.telemetryService.setEnabled(!currentState);
    vscode.window.showInformationMessage(
      "HAPA 텔레메트리 설정이 변경되었습니다."
    );
  }

  // 접근성 관련 메서드들
  private async showAccessibilityReport(): Promise<void> {
    const report = this.accessibilityService.generateAccessibilityReport();
    vscode.window.showInformationMessage(`HAPA 접근성 보고서: ${report}`);
  }

  // 반응형 디자인 관련 메서드들
  private async showResponsiveReport(): Promise<void> {
    const report = this.responsiveDesignService.generateResponsiveReport();
    vscode.window.showInformationMessage(`HAPA 반응형 보고서: ${report}`);
  }

  private async showResponsiveCSS(): Promise<void> {
    const css = this.responsiveDesignService.generateResponsiveCSS();
    vscode.window.showInformationMessage(`HAPA 반응형 CSS: ${css}`);
  }

  private async toggleResponsive(): Promise<void> {
    const currentState = this.responsiveDesignService.getCurrentState();
    this.responsiveDesignService.setResponsiveEnabled(!currentState.isEnabled);
    vscode.window.showInformationMessage(
      "HAPA 반응형 디자인이 토글되었습니다."
    );
  }

  /**
   * 확장 비활성화
   */
  public async deactivate(): Promise<void> {
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
      configService.dispose();
      EnhancedErrorService.getInstance().clearErrorLog();

      // 모든 서비스들 정리
      this.memoryManager.cleanup();
      this.performanceOptimizer.cleanup();
      this.offlineService.cleanup();
      this.configValidationService.cleanup();
      this.loadingService.cleanup();
      this.telemetryService.cleanup();
      this.accessibilityService.cleanup();
      this.responsiveDesignService.cleanup();

      // 트리거 디텍터 정리
      if (this.triggerDetector) {
        this.triggerDetector = null;
      }

      this.isActivated = false;
      console.log("✅ HAPA Extension 비활성화 완료");
    } catch (error) {
      console.error("Extension deactivation error:", error);
    }
  }

  /**
   * 프로바이더 등록
   */
  private async registerProviders(): Promise<void> {
    const extensionUri = this.context.extensionUri;

    // 사이드바 프로바이더
    const sidebarProvider = new SidebarProvider(extensionUri);
    sidebarProvider.setContext(this.context);

    this.disposables.push(
      vscode.window.registerWebviewViewProvider(
        "hapa-dashboard",
        sidebarProvider
      )
    );
    this.providers.set("sidebar", sidebarProvider);

    // 가이드 프로바이더
    const guideProvider = new GuideProvider(extensionUri);
    this.providers.set("guide", guideProvider);

    // 설정 프로바이더
    const settingsProvider = new SettingsProvider(extensionUri);
    this.providers.set("settings", settingsProvider);

    // 온보딩 프로바이더
    const onboardingProvider = new OnboardingProvider(extensionUri);
    this.providers.set("onboarding", onboardingProvider);

    // 코드 완성 프로바이더
    const completionProvider = new HAPACompletionProvider();
    const inlineCompletionProvider = new HAPAInlineCompletionProvider();

    this.disposables.push(
      vscode.languages.registerCompletionItemProvider(
        { scheme: "file", language: "python" },
        completionProvider,
        "."
      ),
      vscode.languages.registerInlineCompletionItemProvider(
        { scheme: "file", language: "python" },
        inlineCompletionProvider
      )
    );

    this.providers.set("completion", completionProvider);
    this.providers.set("inlineCompletion", inlineCompletionProvider);

    console.log("📦 프로바이더 등록 완료");
  }

  /**
   * 명령어 등록
   */
  private registerCommands(): void {
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
        callback: (code: string) => this.insertCode(code),
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

    // 추가 고급 명령어들
    const advancedCommands = [
      // 성능 및 모니터링 명령어
      {
        command: "hapa.showPerformanceReport",
        callback: () => this.showPerformanceReport(),
        title: "HAPA 성능 보고서",
      },
      {
        command: "hapa.showOfflineStatus",
        callback: () => this.showOfflineStatus(),
        title: "HAPA 오프라인 상태",
      },
      {
        command: "hapa.validateConfigs",
        callback: () => this.validateConfigs(),
        title: "HAPA 설정 검증",
      },
      {
        command: "hapa.clearOfflineCache",
        callback: () => this.clearOfflineCache(),
        title: "HAPA 오프라인 캐시 삭제",
      },
      {
        command: "hapa.resetPerformanceMetrics",
        callback: () => this.resetPerformanceMetrics(),
        title: "HAPA 성능 메트릭 초기화",
      },

      // 텔레메트리 명령어
      {
        command: "hapa.showUsageReport",
        callback: () => this.showUsageReport(),
        title: "HAPA 사용 통계 보고서",
      },
      {
        command: "hapa.showTelemetryStats",
        callback: () => this.showTelemetryStats(),
        title: "HAPA 텔레메트리 상태",
      },
      {
        command: "hapa.toggleTelemetry",
        callback: () => this.toggleTelemetry(),
        title: "HAPA 텔레메트리 토글",
      },

      // 접근성 명령어
      {
        command: "hapa.showAccessibilityReport",
        callback: () => this.showAccessibilityReport(),
        title: "HAPA 접근성 보고서",
      },
      {
        command: "hapa.announceStatus",
        callback: () => this.accessibilityService.announceCurrentStatus(),
        title: "HAPA 현재 상태 안내",
      },
      {
        command: "hapa.readSelection",
        callback: () => this.accessibilityService.readSelection(),
        title: "HAPA 선택 텍스트 읽기",
      },
      {
        command: "hapa.increaseFontSize",
        callback: () => this.accessibilityService.adjustFontSize(2),
        title: "HAPA 폰트 크기 증가",
      },
      {
        command: "hapa.decreaseFontSize",
        callback: () => this.accessibilityService.adjustFontSize(-2),
        title: "HAPA 폰트 크기 감소",
      },
      {
        command: "hapa.toggleHighContrast",
        callback: () =>
          this.accessibilityService.toggleFeature("high-contrast"),
        title: "HAPA 고대비 모드 토글",
      },
      {
        command: "hapa.toggleKeyboardNavigation",
        callback: () =>
          this.accessibilityService.toggleFeature("keyboard-navigation"),
        title: "HAPA 키보드 네비게이션 토글",
      },
      {
        command: "hapa.toggleScreenReader",
        callback: () =>
          this.accessibilityService.toggleFeature("screen-reader"),
        title: "HAPA 스크린 리더 모드 토글",
      },

      // 반응형 디자인 명령어
      {
        command: "hapa.showResponsiveReport",
        callback: () => this.showResponsiveReport(),
        title: "HAPA 반응형 디자인 보고서",
      },
      {
        command: "hapa.showResponsiveCSS",
        callback: () => this.showResponsiveCSS(),
        title: "HAPA 반응형 CSS 보기",
      },
      {
        command: "hapa.toggleResponsive",
        callback: () => this.toggleResponsive(),
        title: "HAPA 반응형 디자인 토글",
      },
      {
        command: "hapa.setBreakpointMobile",
        callback: () => this.responsiveDesignService.setBreakpoint("mobile"),
        title: "HAPA 모바일 브레이크포인트 설정",
      },
      {
        command: "hapa.setBreakpointTablet",
        callback: () => this.responsiveDesignService.setBreakpoint("tablet"),
        title: "HAPA 태블릿 브레이크포인트 설정",
      },
      {
        command: "hapa.setBreakpointDesktop",
        callback: () => this.responsiveDesignService.setBreakpoint("medium"),
        title: "HAPA 데스크톱 브레이크포인트 설정",
      },
    ];

    // 모든 명령어 등록
    const allCommands = [...commands, ...advancedCommands];
    allCommands.forEach(({ command, callback }) => {
      this.disposables.push(vscode.commands.registerCommand(command, callback));
    });

    console.log(`📋 ${allCommands.length}개 명령어 등록 완료`);
  }

  /**
   * 이벤트 리스너 등록
   */
  private registerEventListeners(): void {
    // 설정 변경 감지
    this.disposables.push(
      configService.onConfigChange(async (event) => {
        console.log(`⚙️ 설정 변경: ${event.key}`);
        await this.onConfigurationChanged(event);
      })
    );

    // 에디터 변경 감지
    this.disposables.push(
      vscode.window.onDidChangeActiveTextEditor((editor) => {
        this.onActiveEditorChanged(editor);
      })
    );

    // 텍스트 문서 변경 감지
    this.disposables.push(
      vscode.workspace.onDidChangeTextDocument((event) => {
        this.onTextDocumentChanged(event);
      })
    );

    console.log("👂 이벤트 리스너 등록 완료");
  }

  /**
   * 온보딩 확인
   */
  private async checkOnboarding(): Promise<void> {
    const config = configService.getExtensionConfig();

    if (!config.userProfile.isOnboardingCompleted) {
      await this.showOnboarding();
    }
  }

  /**
   * 설정 변경 처리
   */
  private async onConfigurationChanged(event: any): Promise<void> {
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
  private onActiveEditorChanged(editor: vscode.TextEditor | undefined): void {
    const sidebarProvider = this.providers.get("sidebar");
    if (sidebarProvider && sidebarProvider.updateContext) {
      sidebarProvider.updateContext();
    }
  }

  /**
   * 텍스트 문서 변경 처리
   */
  private onTextDocumentChanged(event: vscode.TextDocumentChangeEvent): void {
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

  private async showSidebar(): Promise<void> {
    await vscode.commands.executeCommand(
      "workbench.view.extension.hapa-sidebar"
    );
  }

  private async showSettings(): Promise<void> {
    const settingsProvider = this.providers.get("settings");
    if (settingsProvider) {
      settingsProvider.show();
    }
  }

  private async showGuide(): Promise<void> {
    const guideProvider = this.providers.get("guide");
    if (guideProvider) {
      guideProvider.show();
    }
  }

  private async showOnboarding(): Promise<void> {
    const onboardingProvider = this.providers.get("onboarding");
    if (onboardingProvider) {
      onboardingProvider.show();
    }
  }

  private async analyzeCurrentFile(): Promise<void> {
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

  private async generateTestForCurrentFile(): Promise<void> {
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

  private async explainCurrentFile(): Promise<void> {
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

  private async analyzeSelection(): Promise<void> {
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

  private async generateTestForSelection(): Promise<void> {
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

  private async explainSelection(): Promise<void> {
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

  private async insertCode(code: string): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage("활성화된 에디터가 없습니다.");
      return;
    }

    await editor.edit((editBuilder) => {
      editBuilder.insert(editor.selection.active, code);
    });
  }

  private async openWebsite(): Promise<void> {
    await vscode.env.openExternal(vscode.Uri.parse("http://localhost:3000"));
  }

  private async openDocumentation(): Promise<void> {
    await vscode.env.openExternal(
      vscode.Uri.parse("http://localhost:3000/guide")
    );
  }

  private async openUserSettings(): Promise<void> {
    await vscode.commands.executeCommand(
      "workbench.action.openSettings",
      "hapa"
    );
  }

  // ============================================================================
  // GETTERS
  // ============================================================================

  public getProvider<T>(name: string): T | undefined {
    return this.providers.get(name) as T;
  }

  public getContext(): vscode.ExtensionContext {
    return this.context;
  }

  public isExtensionActivated(): boolean {
    return this.isActivated;
  }

  public getDisposables(): vscode.Disposable[] {
    return [...this.disposables];
  }
}
