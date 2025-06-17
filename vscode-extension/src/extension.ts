import * as vscode from "vscode";

import { SidebarProvider } from "./providers/SidebarProvider";
import { GuideProvider } from "./providers/GuideProvider";
import { SettingsProvider } from "./providers/SettingsProvider";
import { CodeInserter } from "./modules/inserter";

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
 * Command 핸들러들을 관리하는 클래스
 */
class CommandManager {
  constructor(
    private dashboardProvider: MainDashboardProvider,
    private extensionUri: vscode.Uri
  ) {}

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
 * 확장 프로그램 활성화
 */
export function activate(context: vscode.ExtensionContext) {
  console.log("🚀 HAPA Extension 활성화됨");

  // 프로바이더들 초기화
  const sidebarProvider = new SidebarProvider(context.extensionUri);
  const guideProvider = new GuideProvider(context.extensionUri);
  const settingsProvider = new SettingsProvider(context.extensionUri);
  const dashboardProvider = new MainDashboardProvider(context.extensionUri);

  // 명령어 관리자 초기화
  const commandManager = new CommandManager(
    dashboardProvider,
    context.extensionUri
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
    ...commandManager.registerCommands(),
  ];

  // 컨텍스트에 추가
  context.subscriptions.push(...disposables);

  // 웰컴 메시지
  vscode.window.showInformationMessage(
    "🎉 HAPA AI Assistant 준비완료! Activity Bar에서 HAPA를 클릭하세요."
  );
}

/**
 * 확장 프로그램 비활성화
 */
export function deactivate() {
  console.log("HAPA Extension 비활성화됨");
}
