import * as vscode from "vscode";
import { BaseWebviewProvider } from "./BaseWebviewProvider";

/**
 * 사용자 설정 웹뷰 프로바이더
 */
export class SettingsProvider extends BaseWebviewProvider {
  constructor(extensionUri: vscode.Uri) {
    super(extensionUri);
  }

  protected getHtmlContent(webview: vscode.Webview): string {
    return this.generateSettingsHtml();
  }

  protected handleCustomMessage(message: any) {
    switch (message.command) {
      case "saveSettings":
        this.saveSettings(message.settings);
        break;
      case "resetSettings":
        this.resetSettings();
        break;
      case "loadSettings":
        this.loadAndSendSettings();
        break;
      case "openVSCodeSettings":
        this.openVSCodeSettings();
        break;
    }
  }

  /**
   * 설정 저장
   */
  private async saveSettings(settings: any) {
    try {
      const config = vscode.workspace.getConfiguration("hapa");

      // 사용자 프로필 설정 저장
      if (settings.userProfile) {
        for (const [key, value] of Object.entries(settings.userProfile)) {
          await config.update(
            `userProfile.${key}`,
            value,
            vscode.ConfigurationTarget.Global
          );
        }
      }

      // API 설정 저장
      if (settings.api) {
        for (const [key, value] of Object.entries(settings.api)) {
          await config.update(key, value, vscode.ConfigurationTarget.Global);
        }
      }

      // 주석 트리거 설정 저장
      if (settings.commentTrigger) {
        for (const [key, value] of Object.entries(settings.commentTrigger)) {
          await config.update(
            `commentTrigger.${key}`,
            value,
            vscode.ConfigurationTarget.Global
          );
        }
      }

      // 기능 설정 저장
      if (settings.features) {
        for (const [key, value] of Object.entries(settings.features)) {
          await config.update(key, value, vscode.ConfigurationTarget.Global);
        }
      }

      vscode.window.showInformationMessage(
        "✅ 설정이 성공적으로 저장되었습니다!"
      );

      // 웹뷰에 저장 완료 신호 전송
      if (this._view) {
        this._view.webview.postMessage({
          command: "settingsSaved",
          success: true,
        });
      }
    } catch (error) {
      const errorMessage = `설정 저장 중 오류가 발생했습니다: ${
        (error as Error).message
      }`;
      vscode.window.showErrorMessage(errorMessage);

      if (this._view) {
        this._view.webview.postMessage({
          command: "settingsSaved",
          success: false,
          error: errorMessage,
        });
      }
    }
  }

  /**
   * 설정 초기화
   */
  private async resetSettings() {
    const result = await vscode.window.showWarningMessage(
      "모든 설정을 기본값으로 초기화하시겠습니까?",
      "초기화",
      "취소"
    );

    if (result === "초기화") {
      try {
        const config = vscode.workspace.getConfiguration("hapa");

        // 사용자 프로필 기본값으로 초기화
        await config.update(
          "userProfile.pythonSkillLevel",
          "intermediate",
          vscode.ConfigurationTarget.Global
        );
        await config.update(
          "userProfile.codeOutputStructure",
          "standard",
          vscode.ConfigurationTarget.Global
        );
        await config.update(
          "userProfile.explanationStyle",
          "standard",
          vscode.ConfigurationTarget.Global
        );
        await config.update(
          "userProfile.projectContext",
          "general_purpose",
          vscode.ConfigurationTarget.Global
        );
        await config.update(
          "userProfile.errorHandlingPreference",
          "basic",
          vscode.ConfigurationTarget.Global
        );
        await config.update(
          "userProfile.preferredLanguageFeatures",
          ["type_hints", "f_strings"],
          vscode.ConfigurationTarget.Global
        );

        // 기능 설정 기본값으로 초기화
        await config.update(
          "autoComplete",
          true,
          vscode.ConfigurationTarget.Global
        );
        await config.update(
          "maxSuggestions",
          5,
          vscode.ConfigurationTarget.Global
        );
        await config.update(
          "enableLogging",
          false,
          vscode.ConfigurationTarget.Global
        );
        await config.update(
          "apiTimeout",
          30000,
          vscode.ConfigurationTarget.Global
        );

        // 주석 트리거 설정 기본값으로 초기화
        await config.update(
          "commentTrigger.resultDisplayMode",
          "sidebar",
          vscode.ConfigurationTarget.Global
        );
        await config.update(
          "commentTrigger.autoInsertDelay",
          0,
          vscode.ConfigurationTarget.Global
        );
        await config.update(
          "commentTrigger.showNotification",
          true,
          vscode.ConfigurationTarget.Global
        );

        vscode.window.showInformationMessage(
          "🔄 설정이 기본값으로 초기화되었습니다."
        );

        // 웹뷰 새로고침
        this.loadAndSendSettings();
      } catch (error) {
        vscode.window.showErrorMessage(
          `설정 초기화 중 오류가 발생했습니다: ${(error as Error).message}`
        );
      }
    }
  }

  /**
   * 현재 설정 로드 및 웹뷰로 전송
   */
  private loadAndSendSettings() {
    const config = vscode.workspace.getConfiguration("hapa");

    const currentSettings = {
      userProfile: {
        pythonSkillLevel: config.get("userProfile.pythonSkillLevel"),
        codeOutputStructure: config.get("userProfile.codeOutputStructure"),
        explanationStyle: config.get("userProfile.explanationStyle"),
        projectContext: config.get("userProfile.projectContext"),
        errorHandlingPreference: config.get(
          "userProfile.errorHandlingPreference"
        ),
        preferredLanguageFeatures: config.get(
          "userProfile.preferredLanguageFeatures"
        ),
      },
      api: {
        apiBaseURL: config.get("apiBaseURL"),
        apiKey: config.get("apiKey"),
        apiTimeout: config.get("apiTimeout"),
      },
      commentTrigger: {
        resultDisplayMode: config.get("commentTrigger.resultDisplayMode"),
        autoInsertDelay: config.get("commentTrigger.autoInsertDelay"),
        showNotification: config.get("commentTrigger.showNotification"),
      },
      features: {
        autoComplete: config.get("autoComplete"),
        maxSuggestions: config.get("maxSuggestions"),
        enableLogging: config.get("enableLogging"),
        enableCodeAnalysis: config.get("enableCodeAnalysis"),
      },
    };

    if (this._view) {
      this._view.webview.postMessage({
        command: "settingsLoaded",
        settings: currentSettings,
      });
    }
  }

  /**
   * VSCode 설정 페이지 열기
   */
  private openVSCodeSettings() {
    vscode.commands.executeCommand("workbench.action.openSettings", "hapa");
  }

  /**
   * 설정 HTML 생성
   */
  private generateSettingsHtml(): string {
    return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HAPA 설정</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      background-color: var(--vscode-editor-background);
      color: var(--vscode-foreground);
      line-height: 1.6;
      padding: 20px;
    }
    
    .settings-container {
      max-width: 800px;
      margin: 0 auto;
    }
    
    .header {
      background: linear-gradient(135deg, #007ACC 0%, #40A9FF 100%);
      color: white;
      padding: 24px;
      border-radius: 8px 8px 0 0;
      text-align: center;
    }
    
    .header h1 {
      font-size: 28px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    
    .header p {
      opacity: 0.9;
      font-size: 16px;
    }
    
    .settings-content {
      background-color: var(--vscode-editor-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 0 0 8px 8px;
      padding: 32px;
    }
    
    .setting-section {
      margin-bottom: 40px;
      padding-bottom: 32px;
      border-bottom: 1px solid var(--vscode-panel-border);
    }
    
    .setting-section:last-child {
      border-bottom: none;
      margin-bottom: 0;
    }
    
    .section-title {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 16px;
      color: var(--vscode-foreground);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .section-description {
      color: var(--vscode-descriptionForeground);
      margin-bottom: 24px;
      font-size: 14px;
    }
    
    .form-group {
      margin-bottom: 20px;
    }
    
    .form-label {
      display: block;
      font-weight: 500;
      margin-bottom: 8px;
      color: var(--vscode-input-foreground);
    }
    
    .form-description {
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
      margin-bottom: 8px;
    }
    
    .form-control {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid var(--vscode-input-border);
      background-color: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border-radius: 4px;
      font-size: 14px;
    }
    
    .form-control:focus {
      outline: none;
      border-color: var(--vscode-focusBorder);
    }
    
    .form-select {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid var(--vscode-input-border);
      background-color: var(--vscode-dropdown-background);
      color: var(--vscode-dropdown-foreground);
      border-radius: 4px;
      font-size: 14px;
    }
    
    .checkbox-group {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 8px;
    }
    
    .checkbox-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background-color: var(--vscode-input-background);
      border: 1px solid var(--vscode-input-border);
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .checkbox-item:hover {
      background-color: var(--vscode-list-hoverBackground);
    }
    
    .checkbox-item.checked {
      background-color: rgba(0, 122, 204, 0.1);
      border-color: #007ACC;
    }
    
    .checkbox-item input[type="checkbox"] {
      margin: 0;
    }
    
    .radio-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 8px;
    }
    
    .radio-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background-color: var(--vscode-input-background);
      border: 1px solid var(--vscode-input-border);
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .radio-item:hover {
      background-color: var(--vscode-list-hoverBackground);
    }
    
    .radio-item.checked {
      background-color: rgba(0, 122, 204, 0.1);
      border-color: #007ACC;
    }
    
    .radio-item input[type="radio"] {
      margin: 0;
    }
    
    .actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px 0;
      border-top: 1px solid var(--vscode-panel-border);
      margin-top: 32px;
    }
    
    .button-group {
      display: flex;
      gap: 12px;
    }
    
    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .btn-primary {
      background: linear-gradient(135deg, #007ACC 0%, #0E639C 100%);
      color: white;
    }
    
    .btn-primary:hover {
      background: linear-gradient(135deg, #0E639C 0%, #1177BB 100%);
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 122, 204, 0.3);
    }
    
    .btn-secondary {
      background-color: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
      border: 1px solid var(--vscode-input-border);
    }
    
    .btn-secondary:hover {
      background-color: var(--vscode-button-secondaryHoverBackground);
    }
    
    .btn-danger {
      background-color: var(--vscode-errorForeground);
      color: white;
    }
    
    .btn-danger:hover {
      opacity: 0.9;
      transform: translateY(-1px);
    }
    
    .info-link {
      color: var(--vscode-textLink-foreground);
      text-decoration: none;
      font-size: 14px;
    }
    
    .info-link:hover {
      text-decoration: underline;
    }
    
    .loading {
      text-align: center;
      padding: 40px;
      color: var(--vscode-descriptionForeground);
    }
    
    .success-message {
      background-color: rgba(76, 175, 80, 0.1);
      border: 1px solid #4CAF50;
      color: #4CAF50;
      padding: 12px;
      border-radius: 4px;
      margin-bottom: 16px;
      display: none;
    }
    
    .error-message {
      background-color: var(--vscode-inputValidation-errorBackground);
      border: 1px solid var(--vscode-inputValidation-errorBorder);
      color: var(--vscode-errorForeground);
      padding: 12px;
      border-radius: 4px;
      margin-bottom: 16px;
      display: none;
    }
  </style>
</head>
<body>
  <div class="settings-container">
    <div class="header">
      <h1>⚙️ HAPA 설정</h1>
      <p>맞춤형 AI 어시스턴트를 위한 개인화 설정</p>
    </div>
    
    <div class="settings-content">
      <div class="success-message" id="successMessage"></div>
      <div class="error-message" id="errorMessage"></div>
      
      <div class="loading" id="loadingIndicator">
        설정을 불러오는 중...
      </div>
      
      <div id="settingsForm" style="display: none;">
        <!-- 사용자 프로필 설정 -->
        <div class="setting-section">
          <h2 class="section-title">👤 사용자 프로필</h2>
          <p class="section-description">AI가 당신에게 맞는 코드와 설명을 제공하도록 설정합니다.</p>
          
          <div class="form-group">
            <label class="form-label">Python 스킬 수준</label>
            <p class="form-description">당신의 Python 경험 수준을 선택하세요</p>
            <select class="form-select" id="pythonSkillLevel">
              <option value="beginner">🌱 초급자 - 기본 문법 학습 중</option>
              <option value="intermediate">🔧 중급자 - 일반적인 프로그래밍 가능</option>
              <option value="advanced">⚡ 고급자 - 복잡한 프로젝트 개발 가능</option>
              <option value="expert">🚀 전문가 - 최적화 및 아키텍처 설계</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">코드 출력 구조</label>
            <p class="form-description">AI가 생성하는 코드의 상세도를 설정합니다</p>
            <select class="form-select" id="codeOutputStructure">
              <option value="minimal">✨ 최소한 - 핵심 로직만 간결하게</option>
              <option value="standard">📝 표준 - 일반적인 코드 + 기본 주석</option>
              <option value="detailed">🔍 상세 - 자세한 주석 + 예외 처리</option>
              <option value="comprehensive">📚 포괄적 - 문서화 + 테스트 + 최적화</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">설명 스타일</label>
            <p class="form-description">AI 설명의 상세도와 스타일을 선택합니다</p>
            <select class="form-select" id="explanationStyle">
              <option value="brief">⚡ 간단한 설명 - 핵심 내용만</option>
              <option value="standard">📖 표준 설명 - 코드 + 간단한 설명</option>
              <option value="detailed">🔍 상세 설명 - 개념 + 이유 + 활용법</option>
              <option value="educational">🎓 교육적 설명 - 단계별 + 예시 + 관련 개념</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">주요 개발 분야</label>
            <p class="form-description">당신의 주요 Python 개발 분야를 선택하세요</p>
            <select class="form-select" id="projectContext">
              <option value="web_development">🌐 웹 개발 - Django, Flask, FastAPI</option>
              <option value="data_science">📊 데이터 사이언스 - NumPy, Pandas, ML</option>
              <option value="automation">🤖 자동화 - 스크립팅, 업무 자동화</option>
              <option value="general_purpose">🔧 범용 개발 - 다양한 목적</option>
              <option value="academic">🎓 학술/연구 - 알고리즘, 연구 프로젝트</option>
              <option value="enterprise">🏢 기업용 개발 - 대규모, 안정성 중시</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">선호하는 Python 기능</label>
            <p class="form-description">AI가 우선적으로 사용할 Python 기능들을 선택하세요 (복수 선택 가능)</p>
            <div class="checkbox-group" id="languageFeatures">
              <div class="checkbox-item" data-value="type_hints">
                <input type="checkbox" id="type_hints">
                <label for="type_hints">타입 힌트</label>
              </div>
              <div class="checkbox-item" data-value="dataclasses">
                <input type="checkbox" id="dataclasses">
                <label for="dataclasses">데이터클래스</label>
              </div>
              <div class="checkbox-item" data-value="async_await">
                <input type="checkbox" id="async_await">
                <label for="async_await">비동기 프로그래밍</label>
              </div>
              <div class="checkbox-item" data-value="comprehensions">
                <input type="checkbox" id="comprehensions">
                <label for="comprehensions">컴프리헨션</label>
              </div>
              <div class="checkbox-item" data-value="generators">
                <input type="checkbox" id="generators">
                <label for="generators">제너레이터</label>
              </div>
              <div class="checkbox-item" data-value="decorators">
                <input type="checkbox" id="decorators">
                <label for="decorators">데코레이터</label>
              </div>
              <div class="checkbox-item" data-value="context_managers">
                <input type="checkbox" id="context_managers">
                <label for="context_managers">컨텍스트 매니저</label>
              </div>
              <div class="checkbox-item" data-value="f_strings">
                <input type="checkbox" id="f_strings">
                <label for="f_strings">f-strings</label>
              </div>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">오류 처리 선호도</label>
            <p class="form-description">생성되는 코드의 오류 처리 수준을 설정합니다</p>
            <select class="form-select" id="errorHandlingPreference">
              <option value="minimal">최소한의 오류 처리</option>
              <option value="basic">기본적인 try-catch</option>
              <option value="comprehensive">포괄적인 예외 처리</option>
              <option value="production_ready">프로덕션 수준 오류 처리</option>
            </select>
          </div>
        </div>
        
        <!-- API 설정 -->
        <div class="setting-section">
          <h2 class="section-title">🔌 API 설정</h2>
          <p class="section-description">HAPA 백엔드 서버와의 연결을 설정합니다.</p>
          
          <div class="form-group">
            <label class="form-label">API 서버 주소</label>
            <p class="form-description">HAPA 백엔드 API 서버의 URL을 입력하세요</p>
            <input type="text" class="form-control" id="apiBaseURL" placeholder="http://localhost:8000/api/v1">
          </div>
          
          <div class="form-group">
            <label class="form-label">API 키</label>
            <p class="form-description">HAPA API 접근을 위한 인증 키를 입력하세요</p>
            <input type="password" class="form-control" id="apiKey" placeholder="API 키를 입력하세요">
          </div>
          
          <div class="form-group">
            <label class="form-label">API 타임아웃 (밀리초)</label>
            <p class="form-description">API 요청 타임아웃 시간을 설정합니다</p>
            <input type="number" class="form-control" id="apiTimeout" min="5000" max="60000" step="1000">
          </div>
        </div>
        
        <!-- 주석 트리거 설정 -->
        <div class="setting-section">
          <h2 class="section-title">⚡ 주석 트리거 워크플로우</h2>
          <p class="section-description">주석으로 코드를 요청할 때의 결과 표시 방식을 설정합니다.</p>
          
          <div class="form-group">
            <label class="form-label">결과 표시 방식</label>
            <p class="form-description">주석 트리거 시 AI 응답을 어떻게 표시할지 선택하세요</p>
            <select class="form-select" id="commentTriggerResultDisplayMode">
              <option value="immediate_insert">⚡ 즉시 삽입 - 코드를 커서 위치에 바로 삽입</option>
              <option value="sidebar">📋 사이드바 표시 - 사이드바에 결과를 표시하고 검토 후 삽입</option>
              <option value="confirm_insert">✅ 확인 후 삽입 - 코드를 미리보고 확인 대화상자에서 삽입 여부 선택</option>
              <option value="inline_preview">👁️ 인라인 미리보기 - 에디터에서 코드를 미리보고 키보드로 선택</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">즉시 삽입 지연 시간 (밀리초)</label>
            <p class="form-description">즉시 삽입 모드에서 코드 삽입 전 대기 시간 (0은 즉시 삽입)</p>
            <input type="number" class="form-control" id="commentTriggerAutoInsertDelay" min="0" max="5000" step="100">
          </div>
          
          <div class="form-group">
            <div class="checkbox-item">
              <input type="checkbox" id="commentTriggerShowNotification">
              <label for="commentTriggerShowNotification">주석 트리거 실행 시 알림 표시</label>
            </div>
          </div>
        </div>
        
        <!-- 자동 완성 설정 -->
        <div class="setting-section">
          <h2 class="section-title">⚡ 자동 완성 설정</h2>
          <p class="section-description">AI 기반 자동 완성 기능을 세밀하게 조정합니다.</p>
          
          <div class="form-group">
            <div class="checkbox-item">
              <input type="checkbox" id="autoComplete">
              <label for="autoComplete">자동 완성 기능 활성화</label>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">제안 최대 개수</label>
            <p class="form-description">한 번에 표시할 자동 완성 제안의 최대 개수</p>
            <input type="number" class="form-control" id="autoCompleteMaxSuggestions" min="1" max="10">
          </div>
          
          <div class="form-group">
            <label class="form-label">신뢰도 임계값</label>
            <p class="form-description">이 값보다 높은 신뢰도의 제안만 표시합니다 (0.1-1.0)</p>
            <input type="range" class="form-control" id="autoCompleteConfidenceThreshold" min="0.1" max="1" step="0.1">
            <span id="confidenceValue">0.3</span>
          </div>
          
          <div class="form-group">
            <div class="checkbox-item">
              <input type="checkbox" id="autoCompleteEnableInlineCompletion">
              <label for="autoCompleteEnableInlineCompletion">인라인 완성 활성화 (GitHub Copilot 스타일)</label>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">응답 지연 시간 (ms)</label>
            <p class="form-description">자동 완성 요청을 보내기 전 대기 시간</p>
            <input type="number" class="form-control" id="autoCompleteDebounceDelay" min="100" max="1000" step="50">
          </div>
          
          <div class="form-group">
            <div class="checkbox-item">
              <input type="checkbox" id="autoCompleteShowExplanations">
              <label for="autoCompleteShowExplanations">AI 설명 표시</label>
            </div>
          </div>
          
          <div class="form-group">
            <div class="checkbox-item">
              <input type="checkbox" id="autoCompleteEnableContextAnalysis">
              <label for="autoCompleteEnableContextAnalysis">컨텍스트 분석 활성화</label>
            </div>
          </div>
        </div>

        <!-- 기타 기능 설정 -->
        <div class="setting-section">
          <h2 class="section-title">🛠️ 기타 기능 설정</h2>
          <p class="section-description">HAPA 확장 프로그램의 추가 기능들을 설정합니다.</p>
          
          <div class="form-group">
            <div class="checkbox-item">
              <input type="checkbox" id="enableCodeAnalysis">
              <label for="enableCodeAnalysis">코드 분석 기능 활성화</label>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">최대 자동완성 제안 수 (기존)</label>
            <p class="form-description">기존 자동완성 시 표시할 최대 제안 개수</p>
            <input type="number" class="form-control" id="maxSuggestions" min="1" max="10">
          </div>
          
          <div class="form-group">
            <div class="checkbox-item">
              <input type="checkbox" id="enableLogging">
              <label for="enableLogging">디버그 로깅 활성화</label>
            </div>
          </div>
        </div>
      </div>
      
      <div class="actions">
        <div>
          <a href="#" class="info-link" onclick="openVSCodeSettings()">
            VSCode 설정에서 편집하기 →
          </a>
        </div>
        
        <div class="button-group">
          <button class="btn btn-danger" onclick="resetSettings()">기본값으로 초기화</button>
          <button class="btn btn-secondary" onclick="loadSettings()">새로고침</button>
          <button class="btn btn-primary" onclick="saveSettings()">설정 저장</button>
        </div>
      </div>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    let currentSettings = {};
    
    // 페이지 로드 시 설정 불러오기
    window.addEventListener('load', function() {
      loadSettings();
    });
    
    function loadSettings() {
      vscode.postMessage({
        command: 'loadSettings'
      });
    }
    
    function saveSettings() {
      const settings = {
        userProfile: {
          pythonSkillLevel: document.getElementById('pythonSkillLevel').value,
          codeOutputStructure: document.getElementById('codeOutputStructure').value,
          explanationStyle: document.getElementById('explanationStyle').value,
          projectContext: document.getElementById('projectContext').value,
          errorHandlingPreference: document.getElementById('errorHandlingPreference').value,
          preferredLanguageFeatures: getSelectedLanguageFeatures()
        },
        api: {
          apiBaseURL: document.getElementById('apiBaseURL').value,
          apiKey: document.getElementById('apiKey').value,
          apiTimeout: parseInt(document.getElementById('apiTimeout').value)
        },
        commentTrigger: {
          resultDisplayMode: document.getElementById('commentTriggerResultDisplayMode').value,
          autoInsertDelay: parseInt(document.getElementById('commentTriggerAutoInsertDelay').value),
          showNotification: document.getElementById('commentTriggerShowNotification').checked
        },
        autoComplete: {
          enabled: document.getElementById('autoComplete').checked,
          maxSuggestions: parseInt(document.getElementById('autoCompleteMaxSuggestions').value),
          confidenceThreshold: parseFloat(document.getElementById('autoCompleteConfidenceThreshold').value),
          enableInlineCompletion: document.getElementById('autoCompleteEnableInlineCompletion').checked,
          debounceDelay: parseInt(document.getElementById('autoCompleteDebounceDelay').value),
          showExplanations: document.getElementById('autoCompleteShowExplanations').checked,
          enableContextAnalysis: document.getElementById('autoCompleteEnableContextAnalysis').checked
        },
        features: {
          enableCodeAnalysis: document.getElementById('enableCodeAnalysis').checked,
          maxSuggestions: parseInt(document.getElementById('maxSuggestions').value),
          enableLogging: document.getElementById('enableLogging').checked
        }
      };
      
      vscode.postMessage({
        command: 'saveSettings',
        settings: settings
      });
    }
    
    function resetSettings() {
      vscode.postMessage({
        command: 'resetSettings'
      });
    }
    
    function openVSCodeSettings() {
      vscode.postMessage({
        command: 'openVSCodeSettings'
      });
    }
    
    function getSelectedLanguageFeatures() {
      const features = [];
      document.querySelectorAll('#languageFeatures input[type="checkbox"]:checked').forEach(function(checkbox) {
        features.push(checkbox.id);
      });
      return features;
    }
    
    function populateSettings(settings) {
      // 사용자 프로필 설정
      if (settings.userProfile) {
        document.getElementById('pythonSkillLevel').value = settings.userProfile.pythonSkillLevel || 'intermediate';
        document.getElementById('codeOutputStructure').value = settings.userProfile.codeOutputStructure || 'standard';
        document.getElementById('explanationStyle').value = settings.userProfile.explanationStyle || 'standard';
        document.getElementById('projectContext').value = settings.userProfile.projectContext || 'general_purpose';
        document.getElementById('errorHandlingPreference').value = settings.userProfile.errorHandlingPreference || 'basic';
        
        // 언어 기능 체크박스 설정
        const features = settings.userProfile.preferredLanguageFeatures || ['type_hints', 'f_strings'];
        document.querySelectorAll('#languageFeatures input[type="checkbox"]').forEach(function(checkbox) {
          checkbox.checked = features.includes(checkbox.id);
          checkbox.parentElement.classList.toggle('checked', checkbox.checked);
        });
      }
      
      // API 설정
      if (settings.api) {
        document.getElementById('apiBaseURL').value = settings.api.apiBaseURL || 'http://localhost:8000/api/v1';
        document.getElementById('apiKey').value = settings.api.apiKey || '';
        document.getElementById('apiTimeout').value = settings.api.apiTimeout || 30000;
      }
      
      // 주석 트리거 설정
      if (settings.commentTrigger) {
        document.getElementById('commentTriggerResultDisplayMode').value = settings.commentTrigger.resultDisplayMode || 'sidebar';
        document.getElementById('commentTriggerAutoInsertDelay').value = settings.commentTrigger.autoInsertDelay || 0;
        document.getElementById('commentTriggerShowNotification').checked = settings.commentTrigger.showNotification !== false;
      }
      
      // 자동 완성 설정
      if (settings.autoComplete) {
        document.getElementById('autoComplete').checked = settings.autoComplete.enabled !== false;
        document.getElementById('autoCompleteMaxSuggestions').value = settings.autoComplete.maxSuggestions || 5;
        document.getElementById('autoCompleteConfidenceThreshold').value = settings.autoComplete.confidenceThreshold || 0.3;
        document.getElementById('confidenceValue').textContent = settings.autoComplete.confidenceThreshold || 0.3;
        document.getElementById('autoCompleteEnableInlineCompletion').checked = settings.autoComplete.enableInlineCompletion !== false;
        document.getElementById('autoCompleteDebounceDelay').value = settings.autoComplete.debounceDelay || 300;
        document.getElementById('autoCompleteShowExplanations').checked = settings.autoComplete.showExplanations !== false;
        document.getElementById('autoCompleteEnableContextAnalysis').checked = settings.autoComplete.enableContextAnalysis !== false;
      }
      
      // 기능 설정
      if (settings.features) {
        document.getElementById('enableCodeAnalysis').checked = settings.features.enableCodeAnalysis !== false;
        document.getElementById('maxSuggestions').value = settings.features.maxSuggestions || 5;
        document.getElementById('enableLogging').checked = settings.features.enableLogging === true;
      }
      
      // 체크박스 스타일 업데이트
      document.querySelectorAll('.checkbox-item input[type="checkbox"]').forEach(function(checkbox) {
        checkbox.parentElement.classList.toggle('checked', checkbox.checked);
      });
      
      // 신뢰도 슬라이더 업데이트 이벤트
      document.getElementById('autoCompleteConfidenceThreshold').addEventListener('input', function() {
        document.getElementById('confidenceValue').textContent = this.value;
      });
    }
    
    function showMessage(message, isError = false) {
      const successEl = document.getElementById('successMessage');
      const errorEl = document.getElementById('errorMessage');
      
      if (isError) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
        successEl.style.display = 'none';
      } else {
        successEl.textContent = message;
        successEl.style.display = 'block';
        errorEl.style.display = 'none';
      }
      
      // 3초 후 메시지 숨기기
      setTimeout(function() {
        successEl.style.display = 'none';
        errorEl.style.display = 'none';
      }, 3000);
    }
    
    // 체크박스 클릭 이벤트
    document.addEventListener('click', function(event) {
      if (event.target.type === 'checkbox') {
        event.target.parentElement.classList.toggle('checked', event.target.checked);
      }
    });
    
    // VSCode 메시지 수신
    window.addEventListener('message', function(event) {
      const message = event.data;
      
      switch (message.command) {
        case 'settingsLoaded':
          currentSettings = message.settings;
          populateSettings(message.settings);
          document.getElementById('loadingIndicator').style.display = 'none';
          document.getElementById('settingsForm').style.display = 'block';
          break;
          
        case 'settingsSaved':
          if (message.success) {
            showMessage('✅ 설정이 성공적으로 저장되었습니다!');
          } else {
            showMessage('❌ ' + (message.error || '설정 저장에 실패했습니다.'), true);
          }
          break;
      }
    });
  </script>
</body>
</html>`;
  }
}
