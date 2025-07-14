/**
 * HAPA VSCode Extension - 명령어 등록 관리
 * @fileoverview 모든 VSCode 명령어의 등록과 라우팅을 관리
 */

import * as vscode from "vscode";
import { ProviderRegistry } from "./ProviderRegistry";
import { SidebarProvider } from "../providers/SidebarProvider";
import { OnboardingProvider } from "../providers/OnboardingProvider";
import { SettingsProvider } from "../providers/SettingsProvider";
import { GuideProvider } from "../providers/GuideProvider";
import { ConfigService } from "../services/ConfigService";

export interface CommandDefinition {
  command: string;
  title: string;
  handler: (...args: any[]) => Promise<void> | void;
  category?: string;
}

export interface CommandExecutionContext {
  providerRegistry: ProviderRegistry;
  extensionContext: vscode.ExtensionContext;
}

export class CommandRegistry {
  private disposables: vscode.Disposable[] = [];
  private registeredCommands: Map<string, CommandDefinition> = new Map();
  private configService: ConfigService;

  constructor(
    private context: CommandExecutionContext,
    private sidebarProvider: SidebarProvider,
    private onboardingProvider: OnboardingProvider,
    private settingsProvider: SettingsProvider,
    private guideProvider: GuideProvider
  ) {
    this.configService = ConfigService.getInstance();
  }

  /**
   * 모든 명령어 등록
   */
  public registerAllCommands(): vscode.Disposable[] {
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
    } catch (error) {
      console.error("❌ 명령어 등록 실패:", error);
      throw error;
    }
  }

  /**
   * 기본 명령어들 등록
   */
  private registerBasicCommands(): void {
    const basicCommands: CommandDefinition[] = [
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
  private registerAnalysisCommands(): void {
    const analysisCommands: CommandDefinition[] = [
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
        handler: (code: string) => this.insertCode(code),
        category: "analysis",
      },
    ];

    this.registerCommands(analysisCommands);
  }

  /**
   * 설정 관련 명령어들 등록
   */
  private registerSettingsCommands(): void {
    const settingsCommands: CommandDefinition[] = [
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
  private registerAdvancedCommands(): void {
    const advancedCommands: CommandDefinition[] = [
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
  private registerAccessibilityCommands(): void {
    const accessibilityCommands: CommandDefinition[] = [
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
  private registerResponsiveCommands(): void {
    const responsiveCommands: CommandDefinition[] = [
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
  private registerCommands(commands: CommandDefinition[]): void {
    commands.forEach((cmd) => {
      const disposable = vscode.commands.registerCommand(
        cmd.command,
        cmd.handler
      );
      this.disposables.push(disposable);
      this.registeredCommands.set(cmd.command, cmd);
    });
  }

  // =============================================================================
  // 명령어 핸들러 메서드들
  // =============================================================================

  private async showSidebar(): Promise<void> {
    await vscode.commands.executeCommand(
      "workbench.view.extension.hapa-sidebar"
    );
  }

  private async showSettings(): Promise<void> {
    const settingsProvider =
      this.context.providerRegistry.getProvider("settings");
    if (
      settingsProvider &&
      typeof (settingsProvider as any).show === "function"
    ) {
      (settingsProvider as any).show();
    }
  }

  private async showGuide(): Promise<void> {
    const guideProvider = this.context.providerRegistry.getProvider("guide");
    if (guideProvider && typeof (guideProvider as any).show === "function") {
      (guideProvider as any).show();
    }
  }

  private async showOnboarding(): Promise<void> {
    const onboardingProvider =
      this.context.providerRegistry.getProvider("onboarding");
    if (
      onboardingProvider &&
      typeof (onboardingProvider as any).show === "function"
    ) {
      await (onboardingProvider as any).show();
    }
  }

  private async resetOnboarding(): Promise<void> {
    // ConfigService를 통해 온보딩 설정 초기화
    const { configService } = await import("../services/ConfigService");

    await configService.update(
      "userProfile.isOnboardingCompleted",
      false,
      true
    );
    await configService.update(
      "userProfile.pythonSkillLevel",
      "intermediate",
      true
    );
    await configService.update(
      "userProfile.codeOutputStructure",
      "standard",
      true
    );
    await configService.update(
      "userProfile.explanationStyle",
      "standard",
      true
    );
    await configService.update(
      "userProfile.projectContext",
      "general_purpose",
      true
    );
    await configService.update(
      "userProfile.errorHandlingPreference",
      "basic",
      true
    );

    vscode.window
      .showInformationMessage(
        "온보딩 설정이 초기화되었습니다. 이제 온보딩을 다시 시작할 수 있습니다.",
        "온보딩 시작하기"
      )
      .then((selection) => {
        if (selection === "온보딩 시작하기") {
          this.showOnboarding();
        }
      });
  }

  private async analyzeCurrentFile(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage("활성화된 에디터가 없습니다.");
      return;
    }

    const sidebarProvider =
      this.context.providerRegistry.getProvider("sidebar");
    if (
      sidebarProvider &&
      typeof (sidebarProvider as any).analyzeCode === "function"
    ) {
      await (sidebarProvider as any).analyzeCode(editor.document.getText());
    }
  }

  private async generateTestForCurrentFile(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage("활성화된 에디터가 없습니다.");
      return;
    }

    const sidebarProvider =
      this.context.providerRegistry.getProvider("sidebar");
    if (
      sidebarProvider &&
      typeof (sidebarProvider as any).generateTest === "function"
    ) {
      await (sidebarProvider as any).generateTest(editor.document.getText());
    }
  }

  private async explainCurrentFile(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage("활성화된 에디터가 없습니다.");
      return;
    }

    const sidebarProvider =
      this.context.providerRegistry.getProvider("sidebar");
    if (
      sidebarProvider &&
      typeof (sidebarProvider as any).explainCode === "function"
    ) {
      await (sidebarProvider as any).explainCode(editor.document.getText());
    }
  }

  private async analyzeSelection(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.selection.isEmpty) {
      vscode.window.showWarningMessage("선택된 텍스트가 없습니다.");
      return;
    }

    const selectedText = editor.document.getText(editor.selection);
    const sidebarProvider =
      this.context.providerRegistry.getProvider("sidebar");
    if (
      sidebarProvider &&
      typeof (sidebarProvider as any).analyzeCode === "function"
    ) {
      await (sidebarProvider as any).analyzeCode(selectedText);
    }
  }

  private async generateTestForSelection(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.selection.isEmpty) {
      vscode.window.showWarningMessage("선택된 텍스트가 없습니다.");
      return;
    }

    const selectedText = editor.document.getText(editor.selection);
    const sidebarProvider =
      this.context.providerRegistry.getProvider("sidebar");
    if (
      sidebarProvider &&
      typeof (sidebarProvider as any).generateTest === "function"
    ) {
      await (sidebarProvider as any).generateTest(selectedText);
    }
  }

  private async explainSelection(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.selection.isEmpty) {
      vscode.window.showWarningMessage("선택된 텍스트가 없습니다.");
      return;
    }

    const selectedText = editor.document.getText(editor.selection);
    const sidebarProvider =
      this.context.providerRegistry.getProvider("sidebar");
    if (
      sidebarProvider &&
      typeof (sidebarProvider as any).explainCode === "function"
    ) {
      await (sidebarProvider as any).explainCode(selectedText);
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
    // 설정에서 웹사이트 URL 가져오기 (기본값: 로컬 개발 서버)
    const websiteUrl = this.configService.get(
      "websiteURL",
      "http://localhost:3000"
    );
    await vscode.env.openExternal(vscode.Uri.parse(websiteUrl));
  }

  private async openDocumentation(): Promise<void> {
    // 설정에서 문서 URL 가져오기 (기본값: 로컬 개발 서버)
    const docUrl = this.configService.get(
      "documentationURL",
      "http://localhost:3000/guide"
    );
    await vscode.env.openExternal(vscode.Uri.parse(docUrl));
  }

  private async openUserSettings(): Promise<void> {
    await vscode.commands.executeCommand(
      "workbench.action.openSettings",
      "hapa"
    );
  }

  // 고급 기능 핸들러들
  private async showPerformanceReport(): Promise<void> {
    const { PerformanceOptimizer } = await import(
      "../services/PerformanceOptimizer"
    );
    const report =
      PerformanceOptimizer.getInstance().generatePerformanceReport();
    vscode.window.showInformationMessage(`HAPA 성능 보고서: ${report}`);
  }

  private async showOfflineStatus(): Promise<void> {
    const { OfflineService } = await import("../services/OfflineService");
    const status = OfflineService.getInstance().getStatus();
    vscode.window.showInformationMessage(
      `HAPA 오프라인 상태: ${status.isOnline ? "온라인" : "오프라인"}`
    );
  }

  private async validateConfigs(): Promise<void> {
    const { ConfigValidationService } = await import(
      "../services/ConfigValidationService"
    );
    const isValid = ConfigValidationService.getInstance().validateAllConfigs();
    vscode.window.showInformationMessage(
      `HAPA 설정 검증: ${isValid ? "유효" : "오류 발견"}`
    );
  }

  private async clearOfflineCache(): Promise<void> {
    const { OfflineService } = await import("../services/OfflineService");
    OfflineService.getInstance().clearCache();
    vscode.window.showInformationMessage(
      "HAPA 오프라인 캐시가 삭제되었습니다."
    );
  }

  private async resetPerformanceMetrics(): Promise<void> {
    const { PerformanceOptimizer } = await import(
      "../services/PerformanceOptimizer"
    );
    PerformanceOptimizer.getInstance().clearMetrics();
    vscode.window.showInformationMessage(
      "HAPA 성능 메트릭이 초기화되었습니다."
    );
  }

  private async showUsageReport(): Promise<void> {
    const { TelemetryService } = await import("../services/TelemetryService");
    const report = TelemetryService.getInstance().generateUsageReport();
    vscode.window.showInformationMessage(`HAPA 사용 통계: ${report}`);
  }

  private async showTelemetryStats(): Promise<void> {
    const { TelemetryService } = await import("../services/TelemetryService");
    const stats = TelemetryService.getInstance().getStatistics();
    vscode.window.showInformationMessage(
      `HAPA 텔레메트리: ${JSON.stringify(stats)}`
    );
  }

  private async toggleTelemetry(): Promise<void> {
    const { TelemetryService } = await import("../services/TelemetryService");
    const telemetryService = TelemetryService.getInstance();
    const stats = telemetryService.getStatistics();
    const currentState = stats.isEnabled || false;
    telemetryService.setEnabled(!currentState);
    vscode.window.showInformationMessage(
      "HAPA 텔레메트리 설정이 변경되었습니다."
    );
  }

  // 접근성 핸들러들
  private async showAccessibilityReport(): Promise<void> {
    const { AccessibilityService } = await import(
      "../services/AccessibilityService"
    );
    const report =
      AccessibilityService.getInstance().generateAccessibilityReport();
    vscode.window.showInformationMessage(`HAPA 접근성 보고서: ${report}`);
  }

  private async announceStatus(): Promise<void> {
    const { AccessibilityService } = await import(
      "../services/AccessibilityService"
    );
    AccessibilityService.getInstance().announceCurrentStatus();
  }

  private async readSelection(): Promise<void> {
    const { AccessibilityService } = await import(
      "../services/AccessibilityService"
    );
    AccessibilityService.getInstance().readSelection();
  }

  private async increaseFontSize(): Promise<void> {
    const { AccessibilityService } = await import(
      "../services/AccessibilityService"
    );
    AccessibilityService.getInstance().adjustFontSize(2);
  }

  private async decreaseFontSize(): Promise<void> {
    const { AccessibilityService } = await import(
      "../services/AccessibilityService"
    );
    AccessibilityService.getInstance().adjustFontSize(-2);
  }

  private async toggleHighContrast(): Promise<void> {
    const { AccessibilityService } = await import(
      "../services/AccessibilityService"
    );
    AccessibilityService.getInstance().toggleFeature("high-contrast");
  }

  private async toggleKeyboardNavigation(): Promise<void> {
    const { AccessibilityService } = await import(
      "../services/AccessibilityService"
    );
    AccessibilityService.getInstance().toggleFeature("keyboard-navigation");
  }

  private async toggleScreenReader(): Promise<void> {
    const { AccessibilityService } = await import(
      "../services/AccessibilityService"
    );
    AccessibilityService.getInstance().toggleFeature("screen-reader");
  }

  // 반응형 디자인 핸들러들
  private async showResponsiveReport(): Promise<void> {
    const { ResponsiveDesignService } = await import(
      "../services/ResponsiveDesignService"
    );
    const report =
      ResponsiveDesignService.getInstance().generateResponsiveReport();
    vscode.window.showInformationMessage(`HAPA 반응형 보고서: ${report}`);
  }

  private async showResponsiveCSS(): Promise<void> {
    const { ResponsiveDesignService } = await import(
      "../services/ResponsiveDesignService"
    );
    const css = ResponsiveDesignService.getInstance().generateResponsiveCSS();
    vscode.window.showInformationMessage(`HAPA 반응형 CSS: ${css}`);
  }

  private async toggleResponsive(): Promise<void> {
    const { ResponsiveDesignService } = await import(
      "../services/ResponsiveDesignService"
    );
    const service = ResponsiveDesignService.getInstance();
    const currentState = service.getCurrentState();
    service.setResponsiveEnabled(!currentState.isEnabled);
    vscode.window.showInformationMessage(
      "HAPA 반응형 디자인이 토글되었습니다."
    );
  }

  private async setBreakpointMobile(): Promise<void> {
    const { ResponsiveDesignService } = await import(
      "../services/ResponsiveDesignService"
    );
    ResponsiveDesignService.getInstance().setBreakpoint("mobile");
  }

  private async setBreakpointTablet(): Promise<void> {
    const { ResponsiveDesignService } = await import(
      "../services/ResponsiveDesignService"
    );
    ResponsiveDesignService.getInstance().setBreakpoint("tablet");
  }

  private async setBreakpointDesktop(): Promise<void> {
    const { ResponsiveDesignService } = await import(
      "../services/ResponsiveDesignService"
    );
    ResponsiveDesignService.getInstance().setBreakpoint("medium");
  }

  // =============================================================================
  // 유틸리티 메서드들
  // =============================================================================

  /**
   * 등록된 명령어 목록 가져오기
   */
  public getRegisteredCommands(): string[] {
    return Array.from(this.registeredCommands.keys());
  }

  /**
   * 카테고리별 명령어 가져오기
   */
  public getCommandsByCategory(category: string): string[] {
    return Array.from(this.registeredCommands.values())
      .filter((cmd) => cmd.category === category)
      .map((cmd) => cmd.command);
  }

  /**
   * 정리 (deactivate 시 호출)
   */
  public dispose(): void {
    console.log("🔄 명령어 정리 시작...");

    this.disposables.forEach((disposable) => disposable.dispose());
    this.disposables = [];
    this.registeredCommands.clear();

    console.log("✅ 명령어 정리 완료");
  }
}
