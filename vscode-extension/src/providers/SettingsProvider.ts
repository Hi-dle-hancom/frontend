import * as vscode from "vscode";
import { BaseWebviewProvider } from "./BaseWebviewProvider";

/**
 * 설정 뷰를 제공하는 프로바이더 클래스
 */
export class SettingsProvider extends BaseWebviewProvider {
  protected getHtmlContent(webview: vscode.Webview): string {
    return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HAPA 설정</title>
  <style>
    body {
      font-family: var(--vscode-font-family);
      background-color: var(--vscode-editor-background);
      color: var(--vscode-editor-foreground);
      padding: 20px;
      line-height: 1.6;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
    }
    h1 {
      color: var(--vscode-editor-foreground);
      border-bottom: 2px solid var(--vscode-focusBorder);
      padding-bottom: 10px;
      margin-bottom: 30px;
    }
    .setting-section {
      background-color: var(--vscode-sideBarSectionHeader-background);
      margin-bottom: 20px;
      padding: 20px;
      border-radius: 8px;
      border: 1px solid var(--vscode-panel-border);
    }
    .setting-title {
      font-size: 16px;
      font-weight: bold;
      color: var(--vscode-editor-foreground);
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .setting-desc {
      color: var(--vscode-descriptionForeground);
      margin-bottom: 15px;
      font-size: 14px;
    }
    .setting-control {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 10px;
    }
    .setting-label {
      min-width: 120px;
      font-weight: 500;
      color: var(--vscode-editor-foreground);
    }
    .toggle-switch {
      position: relative;
      width: 50px;
      height: 24px;
      background-color: var(--vscode-input-background);
      border: 1px solid var(--vscode-input-border);
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    .toggle-switch.active {
      background: linear-gradient(135deg, #007ACC 0%, #0E639C 100%);
      border-color: var(--vscode-focusBorder);
    }
    .toggle-slider {
      position: absolute;
      top: 2px;
      left: 2px;
      width: 18px;
      height: 18px;
      background-color: white;
      border-radius: 50%;
      transition: transform 0.3s ease;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
    .toggle-switch.active .toggle-slider {
      transform: translateX(26px);
    }
    select, input {
      background-color: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border);
      padding: 6px 10px;
      border-radius: 4px;
      font-family: inherit;
    }
    select:focus, input:focus {
      outline: none;
      border-color: var(--vscode-focusBorder);
    }
    .api-key-section {
      background-color: var(--vscode-inputValidation-infoBackground);
      border: 1px solid var(--vscode-inputValidation-infoBorder);
      padding: 15px;
      border-radius: 6px;
      margin-top: 15px;
    }
    .api-key-input {
      width: 100%;
      padding: 8px 12px;
      font-family: monospace;
      margin-top: 8px;
    }
    .save-btn {
      background: linear-gradient(135deg, #007ACC 0%, #0E639C 100%);
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
      margin-top: 20px;
      transition: all 0.2s ease;
    }
    .save-btn:hover {
      background: linear-gradient(135deg, #0E639C 0%, #1177BB 100%);
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0, 122, 204, 0.3);
    }
    .reset-btn {
      background-color: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
      margin-left: 10px;
    }
    .reset-btn:hover {
      background-color: var(--vscode-button-secondaryHoverBackground);
    }
    .info-box {
      background-color: var(--vscode-textCodeBlock-background);
      border: 1px solid var(--vscode-panel-border);
      padding: 12px;
      border-radius: 6px;
      margin: 15px 0;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>⚙️ HAPA 설정</h1>
    
    <div class="setting-section">
      <div class="setting-title">🎯 기본 설정</div>
      <div class="setting-desc">HAPA AI Assistant의 기본 동작을 설정합니다.</div>
      
      <div class="setting-control">
        <label class="setting-label">코드 분석</label>
        <div class="toggle-switch active" onclick="toggleSetting(this)">
          <div class="toggle-slider"></div>
        </div>
        <span>자동 코드 분석 기능 활성화</span>
      </div>
      
      <div class="setting-control">
        <label class="setting-label">자동 완성</label>
        <div class="toggle-switch active" onclick="toggleSetting(this)">
          <div class="toggle-slider"></div>
        </div>
        <span>입력 중 자동 완성 제안 표시</span>
      </div>
      
      <div class="setting-control">
        <label class="setting-label">알림 표시</label>
        <div class="toggle-switch active" onclick="toggleSetting(this)">
          <div class="toggle-slider"></div>
        </div>
        <span>작업 완료 시 알림 메시지 표시</span>
      </div>
    </div>

    <div class="setting-section">
      <div class="setting-title">🎨 인터페이스 설정</div>
      <div class="setting-desc">사용자 인터페이스 옵션을 설정합니다.</div>
      
      <div class="setting-control">
        <label class="setting-label">테마</label>
        <select>
          <option value="system">시스템 테마 따르기</option>
          <option value="light">라이트 테마</option>
          <option value="dark">다크 테마</option>
        </select>
      </div>
      
      <div class="setting-control">
        <label class="setting-label">폰트 크기</label>
        <select>
          <option value="small">작게</option>
          <option value="medium" selected>보통</option>
          <option value="large">크게</option>
        </select>
      </div>
    </div>

    <div class="setting-section">
      <div class="setting-title">🤖 AI 모델 설정</div>
      <div class="setting-desc">AI 모델의 동작 방식을 조정합니다.</div>
      
      <div class="setting-control">
        <label class="setting-label">응답 스타일</label>
        <select>
          <option value="concise">간결한 답변</option>
          <option value="detailed" selected>상세한 설명</option>
          <option value="code-only">코드만 생성</option>
        </select>
      </div>
      
      <div class="setting-control">
        <label class="setting-label">최대 응답 길이</label>
        <input type="number" value="1000" min="100" max="5000" step="100">
        <span>글자</span>
      </div>
    </div>

    <div class="setting-section">
      <div class="setting-title">🔑 API 설정</div>
      <div class="setting-desc">백엔드 서버 연결 설정을 관리합니다.</div>
      
      <div class="setting-control">
        <label class="setting-label">서버 URL</label>
        <input type="url" value="http://localhost:8000" placeholder="http://localhost:8000">
      </div>
      
      <div class="api-key-section">
        <strong>API Key 설정</strong>
        <div class="info-box">
          HAPA 백엔드 서버에 연결하기 위한 API Key를 입력하세요. 
          API Key는 서버 관리자로부터 발급받을 수 있습니다.
        </div>
        <input type="password" class="api-key-input" placeholder="hapa_your_api_key_here">
      </div>
    </div>

    <div class="setting-section">
      <div class="setting-title">📊 개발자 옵션</div>
      <div class="setting-desc">고급 사용자를 위한 디버깅 및 로깅 옵션입니다.</div>
      
      <div class="setting-control">
        <label class="setting-label">디버그 모드</label>
        <div class="toggle-switch" onclick="toggleSetting(this)">
          <div class="toggle-slider"></div>
        </div>
        <span>상세한 로그 정보 표시</span>
      </div>
      
      <div class="setting-control">
        <label class="setting-label">성능 모니터링</label>
        <div class="toggle-switch" onclick="toggleSetting(this)">
          <div class="toggle-slider"></div>
        </div>
        <span>API 응답 시간 및 성능 지표 표시</span>
      </div>
    </div>

    <div style="text-align: right;">
      <button class="reset-btn" onclick="resetSettings()">기본값으로 되돌리기</button>
      <button class="save-btn" onclick="saveSettings()">설정 저장</button>
    </div>

    <div class="info-box" style="margin-top: 30px;">
      <strong>💡 팁:</strong> 설정 변경 사항은 즉시 적용됩니다. 
      문제가 발생하면 "기본값으로 되돌리기" 버튼을 사용하여 초기 설정으로 복원할 수 있습니다.
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    
    function toggleSetting(element) {
      element.classList.toggle('active');
    }
    
    function saveSettings() {
      // 설정 값들을 수집
      const settings = {
        codeAnalysis: document.querySelector('.setting-control:nth-child(2) .toggle-switch').classList.contains('active'),
        autoCompletion: document.querySelector('.setting-control:nth-child(3) .toggle-switch').classList.contains('active'),
        notifications: document.querySelector('.setting-control:nth-child(4) .toggle-switch').classList.contains('active'),
        theme: document.querySelector('select').value,
        fontSize: document.querySelector('select:nth-of-type(2)').value,
        responseStyle: document.querySelector('select:nth-of-type(3)').value,
        maxResponseLength: document.querySelector('input[type="number"]').value,
        serverUrl: document.querySelector('input[type="url"]').value,
        apiKey: document.querySelector('.api-key-input').value,
        debugMode: document.querySelector('.setting-control:nth-child(11) .toggle-switch').classList.contains('active'),
        performanceMonitoring: document.querySelector('.setting-control:nth-child(12) .toggle-switch').classList.contains('active')
      };
      
      // VSCode에 설정 저장 메시지 전송
      vscode.postMessage({
        command: 'saveSettings',
        settings: settings
      });
      
      // 저장 완료 표시
      showSaveSuccess();
    }
    
    function resetSettings() {
      if (confirm('모든 설정을 기본값으로 되돌리시겠습니까?')) {
        // 모든 토글을 기본 상태로
        document.querySelectorAll('.toggle-switch').forEach((toggle, index) => {
          if (index < 3) { // 처음 3개는 활성화
            toggle.classList.add('active');
          } else {
            toggle.classList.remove('active');
          }
        });
        
        // 기본값 설정
        document.querySelector('select').value = 'system';
        document.querySelector('select:nth-of-type(2)').value = 'medium';
        document.querySelector('select:nth-of-type(3)').value = 'detailed';
        document.querySelector('input[type="number"]').value = '1000';
        document.querySelector('input[type="url"]').value = 'http://localhost:8000';
        document.querySelector('.api-key-input').value = '';
        
        showResetSuccess();
      }
    }
    
    function showSaveSuccess() {
      const button = document.querySelector('.save-btn');
      const originalText = button.textContent;
      button.textContent = '✓ 저장됨';
      button.style.background = '#4CAF50';
      
      setTimeout(() => {
        button.textContent = originalText;
        button.style.background = 'linear-gradient(135deg, #007ACC 0%, #0E639C 100%)';
      }, 2000);
    }
    
    function showResetSuccess() {
      const button = document.querySelector('.reset-btn');
      const originalText = button.textContent;
      button.textContent = '✓ 초기화됨';
      
      setTimeout(() => {
        button.textContent = originalText;
      }, 2000);
    }
  </script>
</body>
</html>`;
  }

  protected setupMessageHandlers(webview: vscode.Webview) {
    super.setupMessageHandlers(webview);

    webview.onDidReceiveMessage((message) => {
      switch (message.command) {
        case "saveSettings":
          this.saveSettings(message.settings);
          return;
      }
    });
  }

  private async saveSettings(settings: any) {
    try {
      // VSCode 설정에 저장
      const config = vscode.workspace.getConfiguration("hapa");
      await config.update(
        "enableCodeAnalysis",
        settings.codeAnalysis,
        vscode.ConfigurationTarget.Global
      );
      await config.update(
        "theme",
        settings.theme,
        vscode.ConfigurationTarget.Global
      );

      vscode.window.showInformationMessage("HAPA 설정이 저장되었습니다.");
    } catch (error) {
      vscode.window.showErrorMessage("설정 저장 중 오류가 발생했습니다.");
    }
  }
}
