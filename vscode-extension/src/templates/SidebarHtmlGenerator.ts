/**
 * 사이드바 HTML 콘텐츠 생성을 담당하는 클래스
 */
export class SidebarHtmlGenerator {
  static generateSidebarHtml(): string {
    return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HAPA - Sidebar Dashboard</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      background-color: var(--vscode-sideBar-background);
      color: var(--vscode-foreground);
      line-height: 1.4;
      overflow-x: hidden;
    }
    
    .sidebar-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background-color: var(--vscode-sideBar-background);
    }
    
    .sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      background-color: var(--vscode-sideBarSectionHeader-background);
      border-bottom: 1px solid var(--vscode-sideBarSectionHeader-border);
      flex-shrink: 0;
      min-height: 32px;
    }
    
    .sidebar-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      font-weight: 600;
      color: var(--vscode-sideBarTitle-foreground);
    }
    
    .sidebar-icon {
      width: 14px;
      height: 14px;
      background: linear-gradient(45deg, #007ACC, #40A9FF);
      border-radius: 2px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 8px;
      color: white;
      font-weight: bold;
    }
    
    .header-actions {
      display: flex;
      gap: 6px;
      align-items: center;
    }
    
    .header-btn {
      padding: 3px 6px;
      font-size: 10px;
      border: none;
      border-radius: 2px;
      cursor: pointer;
      background-color: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
      transition: all 0.15s ease;
    }
    
    .header-btn:hover {
      background-color: var(--vscode-button-secondaryHoverBackground);
    }
    
    .expand-btn {
      padding: 4px 8px;
      font-size: 10px;
      border: none;
      border-radius: 2px;
      cursor: pointer;
      background: linear-gradient(135deg, #007ACC 0%, #0E639C 100%);
      color: white;
      transition: all 0.15s ease;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    .expand-btn:hover {
      background: linear-gradient(135deg, #0E639C 0%, #1177BB 100%);
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0, 122, 204, 0.3);
    }
    
    .connection-status {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 10px;
      color: var(--vscode-descriptionForeground);
    }
    
    .status-dot {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background-color: #4CAF50;
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.5; }
      100% { opacity: 1; }
    }
    
    .sidebar-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background-color: var(--vscode-editor-background);
    }
    
    .section {
      background-color: var(--vscode-editor-background);
      border-bottom: 1px solid var(--vscode-panel-border);
    }
    
    .request-section {
      padding: 12px;
      border-bottom: 1px solid var(--vscode-panel-border);
      flex-shrink: 0;
    }
    
    .input-group {
      margin-bottom: 12px;
    }
    
    .input-label {
      display: block;
      font-size: 11px;
      font-weight: 500;
      color: var(--vscode-input-foreground);
      margin-bottom: 4px;
    }
    
    .question-input {
      width: 100%;
      min-height: 60px;
      padding: 8px;
      border: 1px solid var(--vscode-input-border);
      background-color: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      font-size: 12px;
      border-radius: 3px;
      resize: vertical;
    }
    
    .question-input:focus {
      outline: none;
      border-color: var(--vscode-focusBorder);
    }
    
    .action-buttons {
      display: flex;
      gap: 8px;
      margin-top: 8px;
    }
    
    .send-btn, .clear-btn {
      flex: 1;
      padding: 6px 12px;
      font-size: 11px;
      border: none;
      border-radius: 2px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.15s ease;
    }
    
    .send-btn {
      background: linear-gradient(135deg, #007ACC 0%, #0E639C 100%);
      color: white;
    }
    
    .send-btn:hover {
      background: linear-gradient(135deg, #0E639C 0%, #1177BB 100%);
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0, 122, 204, 0.3);
    }
    
    .clear-btn {
      background-color: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
    }
    
    .clear-btn:hover {
      background-color: var(--vscode-button-secondaryHoverBackground);
    }
    
    .response-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    
    .response-tabs {
      display: flex;
      border-bottom: 1px solid var(--vscode-panel-border);
      background-color: var(--vscode-sideBarSectionHeader-background);
      flex-shrink: 0;
    }
    
    .response-tab {
      flex: 1;
      padding: 8px 12px;
      font-size: 11px;
      font-weight: 500;
      border: none;
      background: transparent;
      color: var(--vscode-tab-inactiveForeground);
      cursor: pointer;
      transition: all 0.15s ease;
    }
    
    .response-tab.active {
      color: var(--vscode-tab-activeForeground);
      background-color: var(--vscode-tab-activeBackground);
      border-bottom: 2px solid var(--vscode-focusBorder);
    }
    
    .response-content {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
    }
    
    .response-empty {
      text-align: center;
      padding: 32px 16px;
      color: var(--vscode-descriptionForeground);
    }
    
    .empty-icon {
      font-size: 32px;
      margin-bottom: 12px;
      opacity: 0.5;
    }
    
    .empty-title {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    
    .empty-description {
      font-size: 11px;
      line-height: 1.4;
    }
    
    .response-item {
      margin-bottom: 16px;
      padding: 12px;
      background-color: var(--vscode-editor-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 4px;
    }
    
    .question-text {
      font-size: 12px;
      font-weight: 600;
      color: var(--vscode-foreground);
      margin-bottom: 8px;
      padding: 8px;
      background-color: var(--vscode-input-background);
      border-radius: 3px;
      border-left: 3px solid var(--vscode-focusBorder);
    }
    
    .code-block {
      background-color: var(--vscode-textCodeBlock-background);
      color: var(--vscode-editor-foreground);
      padding: 12px;
      border-radius: 3px;
      font-family: var(--vscode-editor-font-family);
      font-size: 12px;
      white-space: pre-wrap;
      overflow-x: auto;
      margin: 8px 0;
      border: 1px solid var(--vscode-panel-border);
    }
    
    .code-actions {
      display: flex;
      gap: 6px;
      margin-top: 8px;
    }
    
    .action-btn {
      padding: 4px 8px;
      font-size: 10px;
      border: none;
      border-radius: 2px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.15s ease;
    }
    
    .insert-btn {
      background: linear-gradient(135deg, #007ACC 0%, #0E639C 100%);
      color: white;
    }
    
    .insert-btn:hover {
      background: linear-gradient(135deg, #0E639C 0%, #1177BB 100%);
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0, 122, 204, 0.3);
    }
    
    .copy-btn {
      background-color: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
    }
    
    .copy-btn:hover {
      background-color: var(--vscode-button-secondaryHoverBackground);
    }
    
    .explanation {
      font-size: 12px;
      color: var(--vscode-foreground);
      line-height: 1.4;
      margin-top: 8px;
      padding: 8px;
      background-color: var(--vscode-textCodeBlock-background);
      border-radius: 3px;
      border-left: 3px solid #4CAF50;
    }
    
    .loading {
      text-align: center;
      padding: 20px;
      color: var(--vscode-descriptionForeground);
    }
    
    .loading-spinner {
      display: inline-block;
      width: 20px;
      height: 20px;
      border: 2px solid var(--vscode-progressBar-background);
      border-radius: 50%;
      border-top-color: var(--vscode-focusBorder);
      animation: spin 1s ease-in-out infinite;
      margin-bottom: 8px;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .error {
      color: var(--vscode-errorForeground);
      background-color: var(--vscode-inputValidation-errorBackground);
      border: 1px solid var(--vscode-inputValidation-errorBorder);
      padding: 8px;
      border-radius: 3px;
      font-size: 12px;
      margin: 8px 0;
    }
  </style>
</head>
<body>
  <div class="sidebar-container" id="sidebarContainer">
    <!-- 헤더 -->
    <div class="sidebar-header">
      <div class="sidebar-title">
        <div class="sidebar-icon">H</div>
        HAPA AI Assistant
      </div>
      <div class="header-actions">
        <div class="connection-status">
          <div class="status-dot"></div>
          Connected
        </div>
        <button class="expand-btn" onclick="openMainDashboard()">
          <span>↗</span>
          Expand
        </button>
      </div>
    </div>

    <!-- 메인 콘텐츠 -->
    <div class="sidebar-main">
      <!-- Request 섹션 -->
      <div class="request-section">
        <div class="input-group">
          <label class="input-label">Ask AI Assistant</label>
          <textarea 
            class="question-input" 
            id="questionInput" 
            placeholder="Python 코드 생성에 대해 질문하거나 요청사항을 입력하세요..."
          ></textarea>
        </div>
        <div class="action-buttons">
          <button class="send-btn" onclick="sendQuestion()">Send</button>
          <button class="clear-btn" onclick="clearInput()">Clear</button>
        </div>
      </div>

      <!-- Response 섹션 -->
      <div class="response-section">
        <div class="response-tabs">
          <button class="response-tab active" onclick="switchTab('response')">Response</button>
          <button class="response-tab" onclick="switchTab('history')">History</button>
        </div>
        <div class="response-content" id="responseContent">
          <div class="response-empty">
            <div class="empty-icon">⚡</div>
            <div class="empty-title">No Response</div>
            <div class="empty-description">
              Send 버튼을 클릭하여 AI 요청을 실행하세요.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    
    function sendQuestion() {
      const input = document.getElementById('questionInput');
      const question = input.value.trim();
      
      if (!question) {
        return;
      }
      
      vscode.postMessage({
        command: 'sendQuestion',
        question: question
      });
    }
    
    function insertCode(button) {
      const codeBlock = button.closest('.response-item').querySelector('.code-block');
      if (codeBlock) {
        vscode.postMessage({
          command: 'insertCode',
          code: codeBlock.textContent
        });
      }
    }
    
    function copyCode(button) {
      const codeBlock = button.closest('.response-item').querySelector('.code-block');
      if (codeBlock) {
        navigator.clipboard.writeText(codeBlock.textContent);
      }
    }
    
    function switchTab(tab) {
      const tabs = document.querySelectorAll('.response-tab');
      tabs.forEach(t => t.classList.remove('active'));
      event.target.classList.add('active');
    }
    
    function clearInput() {
      document.getElementById('questionInput').value = '';
    }
    
    function openMainDashboard() {
      vscode.postMessage({
        command: 'openMainDashboard'
      });
    }
    
    // VS Code 메시지 수신 처리
    window.addEventListener('message', event => {
      const message = event.data;
      
      switch (message.command) {
        case 'addAIResponse':
          addAIResponse(message.response);
          break;
        case 'showLoading':
          showLoading(message.message);
          break;
        case 'showError':
          showError(message.error);
          break;
        case 'insertSuccess':
          showInsertSuccess(message.message);
          break;
      }
    });
    
    function addAIResponse(response) {
      const content = document.getElementById('responseContent');
      
      // 처음 응답인 경우 empty 상태 제거
      if (content.querySelector('.response-empty')) {
        content.innerHTML = '';
      }
      
      const responseHtml = \`
        <div class="response-item">
          <div class="question-text">\${response.originalQuestion || 'AI 요청'}</div>
          <div class="code-block">\${response.generated_code || response.code || '코드가 생성되지 않았습니다.'}</div>
          <div class="code-actions">
            <button class="action-btn insert-btn" onclick="insertCode(this)">Insert</button>
            <button class="action-btn copy-btn" onclick="copyCode(this)">Copy</button>
          </div>
          \${response.explanation ? \`<div class="explanation">\${response.explanation}</div>\` : ''}
        </div>
      \`;
      
      content.insertAdjacentHTML('afterbegin', responseHtml);
    }
    
    function showLoading(message) {
      const content = document.getElementById('responseContent');
      content.innerHTML = \`
        <div class="loading">
          <div class="loading-spinner"></div>
          <div>\${message}</div>
        </div>
      \`;
    }
    
    function showError(error) {
      const content = document.getElementById('responseContent');
      content.innerHTML = \`
        <div class="error">
          오류가 발생했습니다: \${error}
        </div>
      \`;
    }
    
    function showInsertSuccess(message) {
      // 성공 메시지를 임시로 표시
      const statusDiv = document.createElement('div');
      statusDiv.className = 'insert-success';
      statusDiv.style.cssText = \`
        position: fixed;
        top: 10px;
        right: 10px;
        background: #4CAF50;
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 12px;
        z-index: 1000;
      \`;
      statusDiv.textContent = message;
      document.body.appendChild(statusDiv);
      
      setTimeout(() => {
        document.body.removeChild(statusDiv);
      }, 3000);
    }
    
    // Enter 키로 전송
    document.getElementById('questionInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendQuestion();
      }
    });
  </script>
</body>
</html>
    `;
  }
}
