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
import { TriggerDetector } from "./modules/triggerDetector";
import { apiClient } from "./modules/apiClient";

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
    // this.setupTriggerDetector(); // TODO: 구현 예정
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
        vscode.commands.executeCommand("workbench.action.openSettings", "hapa");
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
    ];
  }

  private showGuidePanel() {
    const panel = vscode.window.createWebviewPanel(
      "hapaGuide",
      "HAPA 가이드",
      vscode.ViewColumn.One,
      { enableScripts: true }
    );
    const provider = new GuideProvider(this.extensionUri);
    panel.webview.html = provider["getHtmlContent"](panel.webview);
  }

  private showSettingsPanel() {
    const panel = vscode.window.createWebviewPanel(
      "hapaSettings",
      "HAPA 설정",
      vscode.ViewColumn.One,
      { enableScripts: true }
    );
    const provider = new SettingsProvider(this.extensionUri);
    panel.webview.html = provider["getHtmlContent"](panel.webview);
    provider["setupMessageHandlers"](panel.webview);
  }

  private showOnboardingPanel() {
    const panel = vscode.window.createWebviewPanel(
      "hapaOnboarding",
      "HAPA 온보딩",
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );
    const provider = new OnboardingProvider(this.extensionUri);
    panel.webview.html = provider["getHtmlContent"](panel.webview);
    provider["setupMessageHandlers"](panel.webview);
  }

  private handleCodeSelection(action: string) {
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

    vscode.window.showInformationMessage(`선택된 코드를 ${action} 중입니다...`);
    // 실제 처리는 사이드바 프로바이더로 위임
  }

  private async insertCode(code: string) {
    try {
      const success = await CodeInserter.smartInsert(code);
      if (success) {
        vscode.window.showInformationMessage("코드가 삽입되었습니다.");
      }
    } catch (error) {
      vscode.window.showErrorMessage(`코드 삽입 실패: ${error}`);
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
  console.log("🚀 HAPA Extension 활성화됨");

  // 프로바이더들 초기화
  const sidebarProvider = new SidebarProvider(context.extensionUri);
  sidebarProvider.setContext(context); // context 설정 추가
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
  const disposables = [
    vscode.window.registerWebviewViewProvider(
      "hapa-dashboard",
      sidebarProvider
    ),
    vscode.window.registerWebviewViewProvider("hapa-guide", guideProvider),
    vscode.window.registerWebviewViewProvider(
      "hapa-settings",
      settingsProvider
    ),

    // 자동 완성 프로바이더 등록
    vscode.languages.registerCompletionItemProvider(
      { language: "python", scheme: "file" },
      completionProvider,
      ".",
      "(",
      "[",
      '"',
      "'",
      " "
    ),
    vscode.languages.registerInlineCompletionItemProvider(
      { language: "python", scheme: "file" },
      inlineCompletionProvider
    ),

    ...commandManager.registerCommands(),
  ];

  // 컨텍스트에 추가
  context.subscriptions.push(...disposables);

  // 웰컴 메시지
  vscode.window.showInformationMessage(
    "🎉 HAPA AI Assistant 준비완료! Activity Bar에서 HAPA를 클릭하세요."
  );

  // 온보딩 체크 (2초 후 실행하여 Extension 초기화 완료 후 진행)
  setTimeout(() => {
    checkAndStartOnboarding(commandManager);
  }, 2000);
}

/**
 * 확장 프로그램 비활성화
 */
export function deactivate() {
  console.log("HAPA Extension 비활성화됨");
}
