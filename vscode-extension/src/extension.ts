import * as vscode from "vscode";

import { SidebarProvider } from "./providers/SidebarProvider";
import { GuideProvider } from "./providers/GuideProvider";
import { SettingsProvider } from "./providers/SettingsProvider";
import { OnboardingProvider } from "./providers/OnboardingProvider";
import {
  HAPACompletionProvider,
  HAPAInlineCompletionProvider,
} from "./providers/CompletionProvider";
import { CodeInserter } from "./modules/inserter";
import { TriggerDetector, TriggerEvent } from "./modules/triggerDetector";
import { apiClient } from "./modules/apiClient";
import {
  EnhancedErrorService,
  ErrorSeverity,
} from "./services/EnhancedErrorService";
import { MemoryManager } from "./services/MemoryManager";
import { PerformanceOptimizer } from "./services/PerformanceOptimizer";
import { OfflineService } from "./services/OfflineService";
import { ConfigValidationService } from "./services/ConfigValidationService";
import { LoadingService } from "./services/LoadingService";
import { TelemetryService } from "./services/TelemetryService";
import { AccessibilityService } from "./services/AccessibilityService";
import { ResponsiveDesignService } from "./services/ResponsiveDesignService";

/**
 * 메인 대시보드 패널을 관리하는 클래스
 */
class MainDashboardProvider {
  constructor(private readonly extensionUri: vscode.Uri) {}

  createPanel(): vscode.WebviewPanel {
    const panel = vscode.window.createWebviewPanel(
      "hapaDashboard",
      "HAPA AI Assistant",
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [this.extensionUri],
        retainContextWhenHidden: true,
      }
    );

    panel.webview.html = this.getHtml();
    this.setupMessageHandlers(panel.webview);

    return panel;
  }

  private getHtml(): string {
    return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HAPA Dashboard</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--vscode-font-family);
      background-color: var(--vscode-editor-background);
      color: var(--vscode-editor-foreground);
      padding: 20px;
    }
    .container { max-width: 1000px; margin: 0 auto; }
    h1 {
      background: linear-gradient(45deg, #007ACC, #40A9FF);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      font-size: 28px;
      margin-bottom: 20px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }
    .card {
      background: var(--vscode-sideBarSectionHeader-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 8px;
      padding: 20px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .card:hover {
      border-color: var(--vscode-focusBorder);
      transform: translateY(-2px);
    }
    .card-icon { font-size: 32px; margin-bottom: 12px; }
    .card-title { font-size: 18px; font-weight: bold; margin-bottom: 8px; }
    .card-desc { color: var(--vscode-descriptionForeground); }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚀 HAPA AI Assistant</h1>
    <div class="grid">
      <div class="card" onclick="showFeature('generation')">
        <div class="card-icon">🎯</div>
        <div class="card-title">코드 생성</div>
        <div class="card-desc">자연어로 Python 코드를 생성합니다</div>
      </div>
      <div class="card" onclick="showFeature('completion')">
        <div class="card-icon">⚡</div>
        <div class="card-title">자동 완성</div>
        <div class="card-desc">코드 입력을 지능적으로 완성합니다</div>
      </div>
      <div class="card" onclick="showFeature('analysis')">
        <div class="card-icon">📊</div>
        <div class="card-title">코드 분석</div>
        <div class="card-desc">코드 품질과 개선점을 분석합니다</div>
      </div>
      <div class="card" onclick="showFeature('test')">
        <div class="card-icon">🧪</div>
        <div class="card-title">테스트 생성</div>
        <div class="card-desc">자동으로 테스트 코드를 생성합니다</div>
      </div>
    </div>
  </div>
  
  <script>
    const vscode = acquireVsCodeApi();
    
    function showFeature(feature) {
      vscode.postMessage({
        command: 'showFeature',
        feature: feature
      });
    }
  </script>
</body>
</html>`;
  }

  private setupMessageHandlers(webview: vscode.Webview) {
    webview.onDidReceiveMessage((message) => {
      switch (message.command) {
        case "showFeature":
          vscode.window.showInformationMessage(
            `${message.feature} 기능을 사이드바에서 사용해보세요!`
          );
          break;
      }
    });
  }
}

/**
 * 주석 트리거 결과 처리 클래스
 */
class CommentTriggerHandler {
  constructor(
    private sidebarProvider: SidebarProvider,
    private codeInserter: CodeInserter
  ) {}

  /**
   * 주석 트리거에서 생성된 코드를 설정에 따라 처리
   * : 설정 기반 워크플로우 분기
   */
  async handleGeneratedCode(code: string, explanation?: string): Promise<void> {
    const config = vscode.workspace.getConfiguration("hapa");
    const displayMode = config.get(
      "commentTrigger.resultDisplayMode"
    ) as string;
    const autoInsertDelay = config.get(
      "commentTrigger.autoInsertDelay",
      0
    ) as number;
    const showNotification = config.get(
      "commentTrigger.showNotification",
      true
    ) as boolean;

    if (showNotification) {
      vscode.window.showInformationMessage(
        "⚡ 주석 트리거로 코드가 생성되었습니다!"
      );
    }

    switch (displayMode) {
      case "immediate_insert":
        await this.handleImmediateInsert(code, autoInsertDelay);
        break;

      case "sidebar":
        await this.handleSidebarDisplay(code, explanation);
        break;

      case "confirm_insert":
        await this.handleConfirmInsert(code, explanation);
        break;

      case "inline_preview":
        await this.handleInlinePreview(code, explanation);
        break;

      default:
        await this.handleSidebarDisplay(code, explanation);
    }
  }

  /**
   * 즉시 삽입 모드
   * : 지연 시간 설정 지원
   */
  private async handleImmediateInsert(
    code: string,
    delay: number
  ): Promise<void> {
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    await CodeInserter.insertAtCursor(code);

    if (
      vscode.workspace
        .getConfiguration("hapa")
        .get("commentTrigger.showNotification")
    ) {
      vscode.window.showInformationMessage("✅ 코드가 삽입되었습니다!");
    }
  }

  /**
   * 사이드바 표시 모드
   */
  private async handleSidebarDisplay(
    code: string,
    explanation?: string
  ): Promise<void> {
    // 사이드바에 결과 표시 (메시지 전송)
    if (this.sidebarProvider["_view"]) {
      this.sidebarProvider["_view"].webview.postMessage({
        command: "addAIResponse",
        response: {
          generated_code: code,
          explanation: explanation,
          status: "success",
        },
      });
    }

    // 사이드바 포커스
    vscode.commands.executeCommand("workbench.view.extension.hapa-sidebar");
  }

  /**
   * 확인 후 삽입 모드
   * : 전용 미리보기 패널 구현
   */
  private async handleConfirmInsert(
    code: string,
    explanation?: string
  ): Promise<void> {
    const previewPanel = vscode.window.createWebviewPanel(
      "hapaCodePreview",
      "코드 미리보기",
      vscode.ViewColumn.Beside,
      { enableScripts: true }
    );

    previewPanel.webview.html = this.generatePreviewHtml(code, explanation);

    previewPanel.webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case "insertCode":
          await CodeInserter.insertAtCursor(code);
          previewPanel.dispose();
          vscode.window.showInformationMessage("✅ 코드가 삽입되었습니다!");
          break;

        case "copyCode":
          await vscode.env.clipboard.writeText(code);
          vscode.window.showInformationMessage(
            "📋 코드가 클립보드에 복사되었습니다!"
          );
          break;

        case "cancel":
          previewPanel.dispose();
          break;
      }
    });
  }

  /**
   * 인라인 미리보기 모드
   */
  private async handleInlinePreview(
    code: string,
    explanation?: string
  ): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      await this.handleSidebarDisplay(code, explanation);
      return;
    }

    // 현재 커서 위치에 코드를 임시로 표시 (인라인 힌트 사용)
    const position = editor.selection.active;
    const decorationType = vscode.window.createTextEditorDecorationType({
      after: {
        contentText: " 💡 코드 생성됨 (Tab: 삽입, Esc: 취소)",
        color: "#007ACC",
        fontStyle: "italic",
      },
      backgroundColor: "rgba(0, 122, 204, 0.1)",
      border: "1px solid #007ACC",
    });

    editor.setDecorations(decorationType, [
      new vscode.Range(position, position),
    ]);

    // 키보드 이벤트 리스너 등록
    const disposable = vscode.workspace.onDidChangeTextDocument(
      async (event) => {
        if (event.document === editor.document) {
          const change = event.contentChanges[0];
          if (change && change.text === "\t") {
            // Tab 키로 삽입
            await CodeInserter.insertAtCursor(code);
            decorationType.dispose();
            disposable.dispose();
            vscode.window.showInformationMessage("✅ 코드가 삽입되었습니다!");
          }
        }
      }
    );

    // 5초 후 자동으로 제거
    setTimeout(() => {
      decorationType.dispose();
      disposable.dispose();
    }, 5000);
  }

  /**
   * 미리보기 HTML 생성
   */
  private generatePreviewHtml(code: string, explanation?: string): string {
    return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>코드 미리보기</title>
  <style>
    body {
      font-family: var(--vscode-font-family);
      background-color: var(--vscode-editor-background);
      color: var(--vscode-foreground);
      padding: 20px;
      margin: 0;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      background: linear-gradient(135deg, #007ACC 0%, #40A9FF 100%);
      color: white;
      padding: 16px;
      border-radius: 8px 8px 0 0;
      text-align: center;
    }
    .content {
      background-color: var(--vscode-editor-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 0 0 8px 8px;
      padding: 20px;
    }
    .code-block {
      background-color: var(--vscode-textCodeBlock-background);
      border: 1px solid var(--vscode-widget-border);
      border-radius: 4px;
      padding: 12px;
      margin: 12px 0;
      font-family: var(--vscode-editor-font-family);
      font-size: var(--vscode-editor-font-size);
      white-space: pre-wrap;
      overflow-x: auto;
    }
    .explanation {
      background-color: rgba(76, 175, 80, 0.1);
      border-left: 4px solid #4CAF50;
      padding: 12px;
      margin: 12px 0;
      border-radius: 0 4px 4px 0;
    }
    .actions {
      display: flex;
      gap: 12px;
      justify-content: center;
      margin-top: 20px;
    }
    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s ease;
    }
    .btn-primary {
      background: linear-gradient(135deg, #007ACC 0%, #40A9FF 100%);
      color: white;
    }
    .btn-secondary {
      background-color: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
    }
    .btn-danger {
      background-color: #f44336;
      color: white;
    }
    .btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>⚡ 생성된 코드 미리보기</h2>
    </div>
    <div class="content">
      <div class="code-block">${this.escapeHtml(code)}</div>
      ${
        explanation
          ? `<div class="explanation"><strong>설명:</strong><br>${this.escapeHtml(
              explanation
            )}</div>`
          : ""
      }
      
      <div class="actions">
        <button class="btn btn-primary" onclick="insertCode()">✅ 삽입</button>
        <button class="btn btn-secondary" onclick="copyCode()">📋 복사</button>
        <button class="btn btn-danger" onclick="cancel()">❌ 취소</button>
      </div>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    
    function insertCode() {
      vscode.postMessage({ command: 'insertCode' });
    }
    
    function copyCode() {
      vscode.postMessage({ command: 'copyCode' });
    }
    
    function cancel() {
      vscode.postMessage({ command: 'cancel' });
    }
  </script>
</body>
</html>`;
  }

  private escapeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}

/**
 * Command 핸들러들을 관리하는 클래스
 */
class CommandManager {
  private triggerHandler: CommentTriggerHandler;
  private triggerDetector: TriggerDetector | null = null;
  private errorService = EnhancedErrorService.getInstance();
  private memoryManager = MemoryManager.getInstance();
  private performanceOptimizer = PerformanceOptimizer.getInstance();
  private offlineService = OfflineService.getInstance();
  private configValidationService = ConfigValidationService.getInstance();
  private loadingService = LoadingService.getInstance();
  private telemetryService = TelemetryService.getInstance();
  private accessibilityService = AccessibilityService.getInstance();
  private responsiveDesignService = ResponsiveDesignService.getInstance();

  constructor(
    private dashboardProvider: MainDashboardProvider,
    private extensionUri: vscode.Uri,
    private sidebarProvider: SidebarProvider
  ) {
    const codeInserter = new CodeInserter();
    this.triggerHandler = new CommentTriggerHandler(
      sidebarProvider,
      codeInserter
    );
    this.setupTriggerDetector();
  }

  private setupTriggerDetector(): void {
    try {
      this.triggerDetector = new TriggerDetector();

      // 트리거 이벤트 처리
      this.triggerDetector.onTrigger((event: TriggerEvent) => {
        this.handleTriggerEvent(event);
      });

      this.errorService.logError(
        "TriggerDetector 설정 완료",
        ErrorSeverity.LOW
      );
    } catch (error) {
      this.errorService.logError(
        error as Error,
        ErrorSeverity.HIGH,
        { component: "TriggerDetector" },
        true
      );
    }
  }

  private async handleTriggerEvent(event: TriggerEvent): Promise<void> {
    try {
      // 트리거 이벤트를 사이드바로 전달
      const message = {
        type: "triggerEvent",
        data: {
          type: event.type,
          action: event.action,
          prompt: event.data.prompt || "",
          context: event.data.context || {},
          metadata: event.data.language
            ? { language: event.data.language }
            : {},
        },
      };

      // SidebarProvider에 메시지 전송 (웹뷰가 준비된 후)
      this.memoryManager.setTimeout(() => {
        if (this.sidebarProvider) {
          // 사이드바가 표시되지 않은 경우 표시
          vscode.commands.executeCommand(
            "workbench.view.extension.hapa-sidebar"
          );
        }
      }, 100);
    } catch (error) {
      this.errorService.logError(
        error as Error,
        ErrorSeverity.MEDIUM,
        { event: event.type, action: event.action },
        true
      );
    }
  }

  registerCommands(): vscode.Disposable[] {
    return [
      vscode.commands.registerCommand("hapa.start", () => {
        vscode.window.showInformationMessage("🚀 HAPA AI Assistant 시작!");
      }),

      vscode.commands.registerCommand("hapa.openDashboard", () => {
        this.dashboardProvider.createPanel();
      }),

      vscode.commands.registerCommand("hapa.showGuide", () => {
        this.showGuidePanel();
      }),

      vscode.commands.registerCommand("hapa.showSettings", () => {
        this.showSettingsPanel();
      }),

      vscode.commands.registerCommand("hapa.settings", () => {
        this.showSettingsPanel();
      }),

      vscode.commands.registerCommand("hapa.analyzeSelection", () => {
        this.handleCodeSelection("분석");
      }),

      vscode.commands.registerCommand("hapa.testSelection", () => {
        this.handleCodeSelection("테스트 생성");
      }),

      vscode.commands.registerCommand("hapa.explainSelection", () => {
        this.handleCodeSelection("설명");
      }),

      vscode.commands.registerCommand("hapa.openWebsite", () => {
        vscode.env.openExternal(vscode.Uri.parse("http://localhost:3000"));
      }),

      vscode.commands.registerCommand(
        "hapa.insertCode",
        async (code: string) => {
          await this.insertCode(code);
        }
      ),

      vscode.commands.registerCommand("hapa.showOnboarding", () => {
        this.showOnboardingPanel();
      }),

      vscode.commands.registerCommand("hapa.openUserSettings", () => {
        this.showSettingsPanel();
      }),

      // 자동 완성 관련 명령어
      vscode.commands.registerCommand(
        "hapa.openDocumentation",
        (url: string) => {
          vscode.env.openExternal(vscode.Uri.parse(url));
        }
      ),

      vscode.commands.registerCommand(
        "hapa.showCompletionExplanation",
        (explanation: string) => {
          vscode.window.showInformationMessage(
            `🤖 AI 추천 이유: ${explanation}`,
            { modal: false }
          );
        }
      ),

      vscode.commands.registerCommand("hapa.toggleAutoComplete", () => {
        const config = vscode.workspace.getConfiguration("hapa");
        const current = config.get("autoComplete", true);
        config.update(
          "autoComplete",
          !current,
          vscode.ConfigurationTarget.Global
        );
        vscode.window.showInformationMessage(
          `자동 완성이 ${!current ? "활성화" : "비활성화"}되었습니다.`
        );
      }),

      // 새로운 MEDIUM 우선순위 명령어들
      vscode.commands.registerCommand("hapa.showPerformanceReport", () => {
        const report = this.performanceOptimizer.generatePerformanceReport();
        this.showReportInWebview("성능 분석 보고서", report);
      }),

      vscode.commands.registerCommand("hapa.showOfflineStatus", () => {
        const status = this.offlineService.getStatus();
        const statusText = `
🌐 온라인 상태: ${status.isOnline ? "🟢 온라인" : "🔴 오프라인"}
⏰ 마지막 확인: ${status.lastOnlineCheck.toLocaleTimeString()}
📋 대기 중인 요청: ${status.pendingRequests}개
💾 캐시된 응답: ${status.cachedResponses}개
📊 캐시 크기: ${(status.queueSize / 1024 / 1024).toFixed(2)}MB
        `;
        vscode.window.showInformationMessage(statusText, { modal: true });
      }),

      vscode.commands.registerCommand("hapa.validateConfigs", () => {
        const report = this.configValidationService.generateConfigReport();
        this.showReportInWebview("설정 검증 보고서", report);
      }),

      vscode.commands.registerCommand("hapa.clearOfflineCache", async () => {
        const action = await vscode.window.showWarningMessage(
          "오프라인 캐시를 모두 삭제하시겠습니까?",
          "삭제",
          "취소"
        );
        if (action === "삭제") {
          this.offlineService.clearCache();
          vscode.window.showInformationMessage(
            "✅ 오프라인 캐시가 정리되었습니다."
          );
        }
      }),

      vscode.commands.registerCommand(
        "hapa.resetPerformanceMetrics",
        async () => {
          const action = await vscode.window.showWarningMessage(
            "성능 메트릭을 초기화하시겠습니까?",
            "초기화",
            "취소"
          );
          if (action === "초기화") {
            this.performanceOptimizer.clearMetrics();
            vscode.window.showInformationMessage(
              "✅ 성능 메트릭이 초기화되었습니다."
            );
          }
        }
      ),

      vscode.commands.registerCommand("hapa.showLoadingStats", () => {
        const stats = this.loadingService.getStatistics();
        const statsText = `
📊 로딩 작업 통계
🎯 총 작업 수: ${stats.totalTasks}개
✅ 완료: ${stats.completedTasks}개
🚫 취소: ${stats.cancelledTasks}개
⏱️ 평균 지속시간: ${stats.averageDuration.toFixed(0)}ms
📈 성공률: ${
          stats.totalTasks > 0
            ? ((stats.completedTasks / stats.totalTasks) * 100).toFixed(1)
            : 0
        }%
        `;
        vscode.window.showInformationMessage(statsText, { modal: true });
      }),

      vscode.commands.registerCommand("hapa.forceOnlineCheck", async () => {
        const wasOnline = this.offlineService.getStatus().isOnline;
        const isOnline = await this.offlineService.checkOnlineStatus();
        vscode.window.showInformationMessage(
          `${isOnline ? "🟢" : "🔴"} ${isOnline ? "온라인" : "오프라인"} 상태${
            wasOnline !== isOnline ? " (상태 변경됨)" : ""
          }`
        );
      }),

      // LOW Priority Services Commands
      // Telemetry Commands
      vscode.commands.registerCommand("hapa.showUsageReport", () => {
        const report = this.telemetryService.generateUsageReport();
        this.showReportInWebview("📊 HAPA 사용 통계 보고서", report);
      }),
      vscode.commands.registerCommand("hapa.showTelemetryStats", () => {
        const stats = this.telemetryService.getStatistics();
        const statsText = `
=== 텔레메트리 현재 상태 ===
📊 활성화: ${stats.isEnabled ? "예" : "아니오"}
🏃 총 세션: ${stats.totalSessions}회
⏱️ 평균 세션: ${(stats.averageSessionDuration / 1000 / 60).toFixed(1)}분
🎯 총 이벤트: ${stats.totalEvents}개
📋 큐 크기: ${stats.eventQueueSize}개

🔥 인기 기능 (Top 5):
${stats.topFeatures
  .map(([name, count], i) => `${i + 1}. ${name}: ${count}회`)
  .join("\n")}
        `;
        this.showReportInWebview("📊 텔레메트리 상태", statsText);
      }),
      vscode.commands.registerCommand("hapa.toggleTelemetry", () => {
        const currentEnabled = this.telemetryService.getStatistics().isEnabled;
        this.telemetryService.setEnabled(!currentEnabled);
        vscode.window.showInformationMessage(
          `📊 텔레메트리가 ${
            !currentEnabled ? "활성화" : "비활성화"
          }되었습니다.`
        );
      }),

      // Accessibility Commands
      vscode.commands.registerCommand("hapa.showAccessibilityReport", () => {
        const report = this.accessibilityService.generateAccessibilityReport();
        this.showReportInWebview("♿ HAPA 접근성 상태 보고서", report);
      }),
      vscode.commands.registerCommand("hapa.announceStatus", () => {
        this.accessibilityService.announceCurrentStatus();
      }),
      vscode.commands.registerCommand("hapa.readSelection", () => {
        this.accessibilityService.readSelection();
      }),
      vscode.commands.registerCommand("hapa.increaseFontSize", () => {
        this.accessibilityService.adjustFontSize(2);
      }),
      vscode.commands.registerCommand("hapa.decreaseFontSize", () => {
        this.accessibilityService.adjustFontSize(-2);
      }),
      vscode.commands.registerCommand("hapa.toggleHighContrast", () => {
        this.accessibilityService.toggleFeature("high-contrast");
      }),
      vscode.commands.registerCommand("hapa.toggleKeyboardNavigation", () => {
        this.accessibilityService.toggleFeature("keyboard-navigation");
      }),
      vscode.commands.registerCommand("hapa.toggleScreenReader", () => {
        this.accessibilityService.toggleFeature("screen-reader");
      }),

      // Responsive Design Commands
      vscode.commands.registerCommand("hapa.showResponsiveReport", () => {
        const report = this.responsiveDesignService.generateResponsiveReport();
        this.showReportInWebview("📱 HAPA 반응형 디자인 보고서", report);
      }),
      vscode.commands.registerCommand("hapa.showResponsiveCSS", () => {
        const css = this.responsiveDesignService.generateResponsiveCSS();
        this.showReportInTextDocument("HAPA 반응형 CSS", css);
      }),
      vscode.commands.registerCommand("hapa.toggleResponsive", () => {
        const currentState = this.responsiveDesignService.getCurrentState();
        this.responsiveDesignService.setResponsiveEnabled(
          !currentState.isEnabled
        );
      }),
      vscode.commands.registerCommand("hapa.setBreakpointMobile", () => {
        this.responsiveDesignService.setBreakpoint("mobile");
      }),
      vscode.commands.registerCommand("hapa.setBreakpointTablet", () => {
        this.responsiveDesignService.setBreakpoint("tablet");
      }),
      vscode.commands.registerCommand("hapa.setBreakpointDesktop", () => {
        this.responsiveDesignService.setBreakpoint("medium");
      }),
    ];
  }

  private showGuidePanel() {
    try {
      const panel = vscode.window.createWebviewPanel(
        "hapaGuide",
        "HAPA 가이드",
        vscode.ViewColumn.One,
        { enableScripts: true }
      );

      // 메모리 매니저에 패널 등록
      this.memoryManager.registerWebviewPanel(panel);

      const provider = new GuideProvider(this.extensionUri);
      panel.webview.html = provider["getHtmlContent"](panel.webview);
    } catch (error) {
      this.errorService.logError(error as Error, ErrorSeverity.MEDIUM, {
        panel: "guide",
      });
    }
  }

  private showSettingsPanel() {
    try {
      const panel = vscode.window.createWebviewPanel(
        "hapaSettings",
        "HAPA 설정",
        vscode.ViewColumn.One,
        { enableScripts: true }
      );

      // 메모리 매니저에 패널 등록
      this.memoryManager.registerWebviewPanel(panel);

      const provider = new SettingsProvider(this.extensionUri);
      panel.webview.html = provider.getPublicHtmlContent(panel.webview);
      provider.setupPublicHandlers(panel.webview);
    } catch (error) {
      this.errorService.logError(error as Error, ErrorSeverity.MEDIUM, {
        panel: "settings",
      });
      vscode.window.showErrorMessage(
        `설정 패널 로드 실패: ${
          error instanceof Error ? error.message : "알 수 없는 오류"
        }`
      );
    }
  }

  private showOnboardingPanel() {
    try {
      const panel = vscode.window.createWebviewPanel(
        "hapaOnboarding",
        "HAPA 온보딩",
        vscode.ViewColumn.One,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
        }
      );

      // 메모리 매니저에 패널 등록
      this.memoryManager.registerWebviewPanel(panel);

      const provider = new OnboardingProvider(this.extensionUri);
      panel.webview.html = provider.getPublicHtmlContent(panel.webview);
      provider.setupPublicHandlers(panel.webview);
    } catch (error) {
      this.errorService.logError(error as Error, ErrorSeverity.MEDIUM, {
        panel: "onboarding",
      });
      vscode.window.showErrorMessage(
        `온보딩 패널 로드 실패: ${
          error instanceof Error ? error.message : "알 수 없는 오류"
        }`
      );
    }
  }

  private handleCodeSelection(action: string) {
    try {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage("활성화된 에디터가 없습니다.");
        return;
      }

      const selection = editor.document.getText(editor.selection);
      if (!selection) {
        vscode.window.showWarningMessage("코드를 선택해주세요.");
        return;
      }

      vscode.window.showInformationMessage(
        `선택된 코드를 ${action} 중입니다...`
      );

      // 트리거 디텍터를 통해 처리
      if (this.triggerDetector) {
        this.triggerDetector.handleCommand(`hapa.${action.toLowerCase()}`);
      }
    } catch (error) {
      this.errorService.logError(error as Error, ErrorSeverity.MEDIUM, {
        action,
        hasSelection: !!vscode.window.activeTextEditor?.selection,
      });
    }
  }

  private async insertCode(code: string) {
    try {
      const success = await CodeInserter.smartInsert(code);
      if (success) {
        vscode.window.showInformationMessage("코드가 삽입되었습니다.");
      } else {
        throw new Error("코드 삽입 실패");
      }
    } catch (error) {
      this.errorService.logError(
        error as Error,
        ErrorSeverity.HIGH,
        { codeLength: code.length },
        true
      );
    }
  }

  /**
   * 보고서를 웹뷰에 표시하는 유틸리티 메서드
   */
  private showReportInWebview(title: string, content: string): void {
    try {
      const panel = vscode.window.createWebviewPanel(
        "hapaReport",
        title,
        vscode.ViewColumn.One,
        { enableScripts: true }
      );

      // 메모리 매니저에 패널 등록
      this.memoryManager.registerWebviewPanel(panel);

      panel.webview.html = this.generateReportHtml(title, content);
    } catch (error) {
      this.errorService.logError(error as Error, ErrorSeverity.MEDIUM, {
        operation: "showReportInWebview",
        title,
      });
      // 대체 방법으로 텍스트 문서에 표시
      this.showReportInTextDocument(title, content);
    }
  }

  /**
   * 보고서 HTML 생성
   */
  private generateReportHtml(title: string, content: string): string {
    return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--vscode-font-family);
      background-color: var(--vscode-editor-background);
      color: var(--vscode-editor-foreground);
      padding: 20px;
      line-height: 1.6;
    }
    .container { max-width: 800px; margin: 0 auto; }
    h1 {
      background: linear-gradient(45deg, #007ACC, #40A9FF);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      font-size: 24px;
      margin-bottom: 20px;
      border-bottom: 2px solid var(--vscode-panel-border);
      padding-bottom: 10px;
    }
    .content {
      background: var(--vscode-sideBarSectionHeader-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 8px;
      padding: 20px;
      white-space: pre-wrap;
      font-family: var(--vscode-editor-font-family);
      font-size: var(--vscode-editor-font-size);
    }
    .refresh-btn {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
      margin-bottom: 20px;
    }
    .refresh-btn:hover {
      background: var(--vscode-button-hoverBackground);
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 ${title}</h1>
    <button class="refresh-btn" onclick="location.reload()">🔄 새로고침</button>
    <div class="content">${content}</div>
  </div>
</body>
</html>`;
  }

  /**
   * 텍스트 문서에 보고서 표시 (웹뷰 실패 시 대체)
   */
  private async showReportInTextDocument(
    title: string,
    content: string
  ): Promise<void> {
    try {
      const document = await vscode.workspace.openTextDocument({
        content: `${title}\n${"=".repeat(title.length)}\n\n${content}`,
        language: "plaintext",
      });
      await vscode.window.showTextDocument(document);
    } catch (error) {
      // 최종 대체: 출력 채널 사용
      const outputChannel = vscode.window.createOutputChannel(title);
      outputChannel.appendLine(content);
      outputChannel.show();
    }
  }

  /**
   * 리소스 정리
   */
  dispose(): void {
    try {
      // 트리거 디텍터 정리
      if (this.triggerDetector) {
        this.triggerDetector = null;
      }

      // 모든 서비스들 정리
      this.memoryManager.cleanup();
      this.performanceOptimizer.cleanup();
      this.offlineService.cleanup();
      this.configValidationService.cleanup();
      this.loadingService.cleanup();
      this.telemetryService.cleanup();
      this.accessibilityService.cleanup();
      this.responsiveDesignService.cleanup();

      this.errorService.logError("CommandManager 정리 완료", ErrorSeverity.LOW);
    } catch (error) {
      vscode.window.showErrorMessage(
        "확장 프로그램 정리 중 오류가 발생했습니다."
      );
    }
  }
}

/**
 * 온보딩 상태를 확인하고 필요시 온보딩을 시작하는 함수
 */
async function checkAndStartOnboarding(commandManager: CommandManager) {
  const config = vscode.workspace.getConfiguration("hapa");
  const isOnboardingCompleted = config.get(
    "userProfile.isOnboardingCompleted",
    false
  );

  if (!isOnboardingCompleted) {
    // 온보딩이 완료되지 않은 경우 사용자에게 물어보고 시작
    const result = await vscode.window.showInformationMessage(
      "👋 HAPA에 오신 것을 환영합니다! 맞춤형 AI 어시스턴트 설정을 위한 온보딩을 진행하시겠습니까?",
      "온보딩 시작",
      "나중에",
      "건너뛰기"
    );

    if (result === "온보딩 시작") {
      vscode.commands.executeCommand("hapa.showOnboarding");
    } else if (result === "건너뛰기") {
      // 온보딩을 건너뛰는 경우 완료 상태로 표시
      await config.update(
        "userProfile.isOnboardingCompleted",
        true,
        vscode.ConfigurationTarget.Global
      );
      vscode.window.showInformationMessage(
        "온보딩을 건너뛰었습니다. 설정은 언제든 변경할 수 있습니다."
      );
    }
  }
}

/**
 * 확장 프로그램 활성화
 */
export function activate(context: vscode.ExtensionContext) {
  try {
    // Extension 활성화 로그는 VSCode 개발자 콘솔용으로 유지

    // 강화된 서비스들 초기화
    const errorService = EnhancedErrorService.getInstance();
    const memoryManager = MemoryManager.getInstance();
    memoryManager.initialize();

    // 프로바이더들 초기화
    const sidebarProvider = new SidebarProvider(context.extensionUri);
    sidebarProvider.setContext(context);
    const guideProvider = new GuideProvider(context.extensionUri);
    const settingsProvider = new SettingsProvider(context.extensionUri);
    const dashboardProvider = new MainDashboardProvider(context.extensionUri);

    // 자동 완성 프로바이더 초기화
    const completionProvider = new HAPACompletionProvider();
    const inlineCompletionProvider = new HAPAInlineCompletionProvider();

    // 명령어 관리자 초기화
    const commandManager = new CommandManager(
      dashboardProvider,
      context.extensionUri,
      sidebarProvider
    );

    // 뷰 프로바이더 등록
    const sidebarDisposable = vscode.window.registerWebviewViewProvider(
      "hapa-dashboard",
      sidebarProvider
    );
    const guideDisposable = vscode.window.registerWebviewViewProvider(
      "hapa-guide",
      guideProvider
    );
    const settingsDisposable = vscode.window.registerWebviewViewProvider(
      "hapa-settings",
      settingsProvider
    );

    // 자동 완성 프로바이더 등록
    const completionDisposable =
      vscode.languages.registerCompletionItemProvider(
        { language: "python", scheme: "file" },
        completionProvider,
        ".",
        "(",
        "[",
        '"',
        "'",
        " "
      );
    const inlineCompletionDisposable =
      vscode.languages.registerInlineCompletionItemProvider(
        { language: "python", scheme: "file" },
        inlineCompletionProvider
      );

    // 명령어들 등록
    const commands = commandManager.registerCommands();

    // 추가 명령어들
    const additionalCommands = [
      // 에러 관리 명령어
      vscode.commands.registerCommand("hapa.showErrorLog", () => {
        errorService.getRecentErrors(50);
      }),

      vscode.commands.registerCommand("hapa.clearErrorLog", () => {
        errorService.clearErrorLog();
        vscode.window.showInformationMessage("에러 로그가 정리되었습니다.");
      }),

      // 메모리 관리 명령어
      vscode.commands.registerCommand("hapa.showMemoryReport", () => {
        const report = memoryManager.generateMemoryReport();
        vscode.window.showInformationMessage(
          "메모리 보고서가 출력 패널에 표시됩니다."
        );
        console.log(report);
      }),

      vscode.commands.registerCommand("hapa.forceGarbageCollection", () => {
        memoryManager.forceGarbageCollection();
        vscode.window.showInformationMessage("가비지 컬렉션이 실행되었습니다.");
      }),

      // 재시도 명령어
      vscode.commands.registerCommand("hapa.retryLastRequest", async () => {
        const retryableErrors = errorService.getRetryableErrors();
        if (retryableErrors.length > 0) {
          vscode.window.showInformationMessage("마지막 요청을 재시도합니다...");
          // 실제 재시도 로직은 각 모듈에서 구현
        } else {
          vscode.window.showInformationMessage(
            "재시도할 수 있는 요청이 없습니다."
          );
        }
      }),
    ];

    // 모든 disposable들을 컨텍스트에 추가
    context.subscriptions.push(
      sidebarDisposable,
      guideDisposable,
      settingsDisposable,
      completionDisposable,
      inlineCompletionDisposable,
      ...commands,
      ...additionalCommands
    );

    // 메모리 매니저에 이벤트 리스너 등록
    memoryManager.addEventListener("extension", sidebarDisposable);
    memoryManager.addEventListener("extension", guideDisposable);
    memoryManager.addEventListener("extension", settingsDisposable);
    memoryManager.addEventListener("extension", completionDisposable);
    memoryManager.addEventListener("extension", inlineCompletionDisposable);
    commands.forEach((cmd, index) => {
      memoryManager.addEventListener("extension", cmd);
    });

    // 온보딩 확인
    checkAndStartOnboarding(commandManager);

    errorService.logError("HAPA Extension 활성화 완료", ErrorSeverity.LOW);
  } catch (error) {
    const errorService = EnhancedErrorService.getInstance();
    errorService.logError(error as Error, ErrorSeverity.CRITICAL, {
      phase: "activation",
    });

    vscode.window.showErrorMessage(
      "HAPA Extension 활성화 중 오류가 발생했습니다. 자세한 내용은 개발자 도구를 확인해주세요."
    );
  }
}

/**
 * 확장 프로그램 비활성화
 */
export function deactivate() {
  try {
    const memoryManager = MemoryManager.getInstance();
    const errorService = EnhancedErrorService.getInstance();

    memoryManager.cleanup();
    errorService.logError("HAPA Extension 비활성화 완료", ErrorSeverity.LOW);

    console.log("👋 HAPA Extension 비활성화됨");
  } catch (error) {
    console.error("HAPA Extension 비활성화 중 오류:", error);
  }
}
