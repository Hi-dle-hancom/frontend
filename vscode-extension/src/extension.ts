// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

import { apiClient, GenerateRequest, AIResponse } from "./modules/apiClient";
import { PromptExtractor, ExtractedPrompt } from "./modules/promptExtractor";
import { TriggerDetector, TriggerEvent } from "./modules/triggerDetector";
import { CodeInserter, InsertOptions } from "./modules/inserter";

/**
 * 사이드바 대시보드 웹뷰 프로바이더 클래스
 */
class SidebarDashboardViewProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;
  private triggerDetector: TriggerDetector;

  constructor(private readonly _extensionUri: vscode.Uri) {
    // TriggerDetector 초기화 및 이벤트 리스너 설정
    this.triggerDetector = new TriggerDetector();
    this.triggerDetector.onTrigger(this.handleTriggerEvent.bind(this));
  }

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this.getSidebarDashboardHtml();

    // 웹뷰에서 Extension으로의 메시지 처리
    webviewView.webview.onDidReceiveMessage((message) => {
      switch (message.command) {
        case "alert":
          vscode.window.showInformationMessage(message.text);
          return;
        case "sendQuestion":
          this.handleAIQuestion(message.question, webviewView.webview);
          return;
        case "insertCode":
          this.insertCodeToEditor(message.code);
          return;
        case "showGuide":
          vscode.commands.executeCommand("hapa.showGuide");
          return;
        case "showSettings":
          vscode.commands.executeCommand("hapa.showSettings");
          return;
        case "openMainDashboard":
          vscode.commands.executeCommand("hapa.openDashboard");
          return;
      }
    });
  }

  private getSidebarDashboardHtml(): string {
    const htmlContent = `
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
      flex-shrink: 0;
      position: relative;
    }
    
    .request-section {
      flex: 2;
      min-height: 150px;
    }
    
    .response-section {
      flex: 1;
      min-height: 100px;
    }
    
    .resizer {
      height: 4px;
      background-color: var(--vscode-panel-border);
      cursor: row-resize;
      position: relative;
      z-index: 100;
      transition: background-color 0.2s ease;
    }
    
    .resizer:hover {
      background-color: var(--vscode-focusBorder);
    }
    
    .resizer::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 20px;
      height: 2px;
      background-color: var(--vscode-descriptionForeground);
      border-radius: 1px;
    }
    
    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 10px;
      background-color: var(--vscode-editorGroupHeader-tabsBackground);
      border-bottom: 1px solid var(--vscode-editorGroupHeader-tabsBorder);
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--vscode-tab-inactiveForeground);
    }
    
         .section-body {
       padding: 12px;
       background-color: var(--vscode-editor-background);
     }
     
     .send-btn-header {
       padding: 4px 12px;
       background: linear-gradient(135deg, #007ACC 0%, #0E639C 100%);
       color: white;
       border: none;
       border-radius: 3px;
       font-size: 10px;
       font-weight: 600;
       cursor: pointer;
       transition: all 0.2s ease;
       box-shadow: 0 2px 4px rgba(0, 122, 204, 0.3);
       margin-left: 8px;
     }
     
     .send-btn-header:hover {
       background: linear-gradient(135deg, #0E639C 0%, #1177BB 100%);
       transform: translateY(-1px);
       box-shadow: 0 4px 8px rgba(0, 122, 204, 0.4);
     }
    
         .request-textarea {
       width: 100%;
       min-height: 120px;
       padding: 8px;
       background-color: var(--vscode-editor-background);
       color: var(--vscode-editor-foreground);
       border: 1px solid var(--vscode-input-border);
       border-radius: 2px;
       font-family: var(--vscode-editor-font-family);
       font-size: 11px;
       resize: vertical;
       outline: none;
       line-height: 1.4;
     }
    
    .request-textarea:focus {
      border-color: var(--vscode-focusBorder);
      box-shadow: 0 0 0 1px var(--vscode-focusBorder);
    }
    
    .request-textarea::placeholder {
      color: var(--vscode-input-placeholderForeground);
    }
    
    .response-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      background-color: var(--vscode-editor-background);
      overflow: hidden;
    }
    
    .response-tabs {
      display: flex;
      background-color: var(--vscode-editorGroupHeader-tabsBackground);
      border-bottom: 1px solid var(--vscode-editorGroupHeader-tabsBorder);
      flex-shrink: 0;
    }
    
    .response-tab {
      padding: 6px 12px;
      font-size: 10px;
      font-weight: 500;
      background: none;
      border: none;
      color: var(--vscode-tab-inactiveForeground);
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: all 0.15s ease;
      position: relative;
    }
    
    .response-tab:hover {
      color: var(--vscode-tab-activeForeground);
      background-color: var(--vscode-tab-hoverBackground);
    }
    
    .response-tab.active {
      color: var(--vscode-tab-activeForeground);
      background-color: var(--vscode-tab-activeBackground);
      border-bottom-color: #007ACC;
    }
    
    .response-content {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
      background-color: var(--vscode-editor-background);
    }
    
    .response-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--vscode-descriptionForeground);
      text-align: center;
      padding: 20px 10px;
    }
    
    .empty-icon {
      width: 32px;
      height: 32px;
      margin-bottom: 12px;
      opacity: 0.3;
      background: linear-gradient(135deg, #007ACC, #40A9FF);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 14px;
    }
    
    .empty-title {
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 6px;
      color: var(--vscode-foreground);
    }
    
    .empty-description {
      font-size: 10px;
      line-height: 1.4;
      max-width: 200px;
    }
    
    .response-item {
      margin-bottom: 12px;
      border: 1px solid var(--vscode-panel-border);
      border-radius: 3px;
      background-color: var(--vscode-textCodeBlock-background);
      overflow: hidden;
    }
    
    .response-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 10px;
      background-color: var(--vscode-breadcrumb-background);
      border-bottom: 1px solid var(--vscode-panel-border);
    }
    
    .response-status {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    
    .status-badge {
      padding: 2px 6px;
      border-radius: 2px;
      font-size: 9px;
      font-weight: 600;
      background-color: #4CAF50;
      color: white;
    }
    
    .response-time {
      font-size: 9px;
      color: var(--vscode-descriptionForeground);
    }
    
    .response-actions {
      display: flex;
      gap: 6px;
      align-items: center;
    }
    
    .action-btn {
      padding: 3px 8px;
      font-size: 9px;
      border: none;
      border-radius: 2px;
      cursor: pointer;
      transition: all 0.15s ease;
      font-weight: 500;
    }
    
    .action-btn.primary {
      background: linear-gradient(135deg, #007ACC 0%, #0E639C 100%);
      color: white;
      box-shadow: 0 1px 2px rgba(0, 122, 204, 0.3);
    }
    
    .action-btn.primary:hover {
      background: linear-gradient(135deg, #0E639C 0%, #1177BB 100%);
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0, 122, 204, 0.4);
    }
    
    .action-btn:not(.primary) {
      background-color: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
    }
    
    .action-btn:not(.primary):hover {
      background-color: var(--vscode-button-secondaryHoverBackground);
    }
    
    .code-block {
      padding: 8px;
      background-color: var(--vscode-textPreformat-background);
      border-radius: 2px;
      font-family: var(--vscode-editor-font-family);
      font-size: 10px;
      white-space: pre-wrap;
      margin: 8px 0;
    }
    
    .explanation-text {
      padding: 8px;
      font-size: 11px;
      line-height: 1.4;
      color: var(--vscode-foreground);
    }
    
    /* 사이드바가 넓어질 때 반응형 레이아웃 */
    .wide-layout .sidebar-main {
      flex-direction: row;
      gap: 1px;
    }
    
    .wide-layout .section {
      flex: 1;
      border-bottom: none;
      border-right: 1px solid var(--vscode-panel-border);
    }
    
    .wide-layout .response-section {
      border-right: none;
    }
    
    /* 넓은 화면에서 질문 입력 영역을 섹션에 맞춰 최대로 늘리기 */
    .wide-layout .request-section .section-body {
      height: calc(100vh - 120px); /* 헤더와 여백을 제외한 최대 높이 */
    }
    
    .wide-layout .request-textarea {
      height: calc(100% - 20px); /* 패딩을 제외한 최대 높이 */
      min-height: calc(100% - 20px);
      max-height: calc(100% - 20px);
      resize: none; /* 넓은 화면에서는 수동 크기 조절 비활성화 */
    }
    
    /* 좁은 화면에서의 섹션 스타일 */
    .sidebar-main:not(.wide-layout) .section {
      display: flex;
      flex-direction: column;
    }
    
    .sidebar-main:not(.wide-layout) .section-body {
      flex: 1;
      min-height: 0;
    }
    
    /* Body 탭 전용 스타일 */
    .body-tab-active .response-content {
      display: flex;
      flex-direction: column;
      justify-content: flex-start; /* 상단 정렬 */
      padding: 12px;
    }
    
    .body-tab-active .response-item {
      flex: 1; /* 응답 박스가 섹션 크기에 맞게 늘어남 */
      margin-bottom: 0; /* 마진 제거로 공간 최대 활용 */
      display: flex;
      flex-direction: column;
      min-height: calc(100% - 24px); /* 패딩을 제외한 최대 높이 */
    }
    
    .body-tab-active .response-item .explanation-text {
      flex: 1; /* 설명 텍스트 영역도 늘어남 */
      overflow-y: auto; /* 내용이 많을 때 스크롤 */
    }
  </style>
</head>
<body>
  <div class="sidebar-container" id="sidebarContainer">
    <div class="sidebar-header">
      <div class="sidebar-title">
        <div class="sidebar-icon">H</div>
        <span>HAPA</span>
      </div>
      <div class="header-actions">
        <button class="header-btn" onclick="showGuide()">가이드</button>
        <button class="header-btn" onclick="showSettings()">설정</button>
        <button class="expand-btn" onclick="openMainDashboard()">
          <span>📱</span>
          <span>확장</span>
        </button>
        <div class="connection-status">
          <div class="status-dot"></div>
          <span>Ready</span>
        </div>
      </div>
    </div>
    
    <div class="sidebar-main" id="sidebarMain">
               <div class="section request-section">
         <div class="section-header">
           <span>REQUEST</span>
           <div class="section-controls">
             <button class="header-btn" onclick="clearInput()">CLEAR</button>
             <button class="send-btn-header" onclick="sendQuestion()">Send</button>
           </div>
         </div>
         
         <div class="section-body">
           <textarea 
             class="request-textarea" 
             id="questionInput"
             placeholder='코드 분석이나 생성 요청을 입력하세요:

예시:
- 이 함수를 더 효율적으로 만들어줘
- React 컴포넌트를 TypeScript로 변환해줘  
- 이 코드에 에러 처리를 추가해줘
- 단위 테스트를 작성해줘'
           ></textarea>
         </div>
       </div>
      
      <div class="resizer" id="resizer"></div>
      
      <div class="section response-section">
        <div class="section-header">
          <span>RESPONSE</span>
          <div class="section-controls">
            <button class="header-btn" onclick="clearResponses()">CLEAR</button>
          </div>
        </div>
        
                 <div class="response-tabs">
           <button class="response-tab active" onclick="switchTab('body')">Body</button>
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
    let currentQuestion = ''; // 현재 질문을 저장하는 전역 변수
    
    function sendQuestion() {
      const input = document.getElementById('questionInput');
      const question = input.value.trim();
      
      if (!question) {
        return;
      }
      
      // 현재 질문 저장
      currentQuestion = question;
      
      // addUserMessage(question); // REQUEST 영역 별도 생성 제거
      input.value = '';
      
      // 모의 응답 (실제로는 vscode.postMessage로 처리)
      setTimeout(() => {
        addAIResponse({
          type: 'code',
          content: 'def optimized_function(data):\\n    # 최적화된 코드\\n    return processed_data',
          explanation: '더 효율적인 알고리즘을 사용하여 성능을 개선했습니다.',
          originalQuestion: currentQuestion  // 저장된 질문 사용
        });
      }, 1000);
      
      vscode.postMessage({
        command: 'sendQuestion',
        question: question
      });
    }
    
    // 웹뷰 메시지 처리 추가
    window.addEventListener('message', event => {
      const message = event.data;
      
      switch (message.command) {
        case 'addAIResponse':
          // 실제 API 응답에 현재 질문 추가
          const response = message.response;
          if (!response.originalQuestion && currentQuestion) {
            response.originalQuestion = currentQuestion;
          }
          addAIResponse(response);
          break;
        case 'showLoading':
          // 로딩 상태 표시 (필요시 구현)
          break;
        case 'showError':
          // 에러 상태 표시 (필요시 구현)
          console.error('AI Error:', message.error);
          break;
      }
    });
    
    function addUserMessage(message) {
      const content = document.getElementById('responseContent');
      const empty = content.querySelector('.response-empty');
      if (empty) empty.style.display = 'none';
      
      const messageEl = document.createElement('div');
      messageEl.className = 'response-item';
      messageEl.innerHTML = \`
        <div class="response-header">
          <div class="response-status">
            <span class="status-badge" style="background-color: #2196F3;">REQUEST</span>
            <span class="response-time">\${new Date().toLocaleTimeString()}</span>
          </div>
          <div class="response-actions">
            <button class="action-btn" onclick="copyText(this)">Copy</button>
          </div>
        </div>
        <div class="explanation-text">\${message}</div>
      \`;
      content.appendChild(messageEl);
      content.scrollTop = content.scrollHeight;
      
      // Body 탭이 활성화된 경우 탭 상태 체크
      checkCurrentTab();
    }
    
    function addAIResponse(response) {
      const content = document.getElementById('responseContent');
      
      // 빈 상태 메시지 숨기기
      const empty = content.querySelector('.response-empty');
      if (empty) empty.style.display = 'none';
      
      const responseEl = document.createElement('div');
      responseEl.className = 'response-item';
      
      // 응답에 원래 질문 포함하여 표시
      let responseHtml = \`
        <div class="response-header">
          <div class="response-status">
            <span class="status-badge">200 OK</span>
            <span class="response-time">\${Math.floor(Math.random() * 500 + 100)}ms</span>
          </div>
          <div class="response-actions">
            <button class="action-btn" onclick="copyCode(this)">Copy</button>
            <button class="action-btn primary" onclick="insertCode(this)">Insert Code</button>
          </div>
        </div>\`;
      
      // 원래 질문이 있다면 명확하게 표시
      if (response.originalQuestion) {
        const safeQuestion = response.originalQuestion.toString().trim();
        if (safeQuestion && safeQuestion !== '' && safeQuestion !== '[object Object]') {
          responseHtml += \`
            <div class="question-display" style="
              background-color: var(--vscode-textBlockQuote-background); 
              border-left: 4px solid var(--vscode-focusBorder); 
              padding: 12px; 
              margin: 8px; 
              border-radius: 4px;
              font-style: italic;
              border-top: 1px solid var(--vscode-panel-border);
            ">
              <div style="
                font-weight: 600; 
                color: var(--vscode-focusBorder); 
                margin-bottom: 8px; 
                font-size: 11px;
              ">📝 질문</div>
              <div style="
                color: var(--vscode-foreground); 
                line-height: 1.4; 
                font-size: 11px;
                font-style: normal;
                white-space: pre-wrap;
                word-wrap: break-word;
              ">\${safeQuestion.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
            </div>\`;
        }
      }
      
      // 응답 내용 추가
      if (response.content) {
        responseHtml += \`<div class="code-block">\${response.content}</div>\`;
      }
      
      if (response.explanation) {
        responseHtml += \`<div class="explanation-text">\${response.explanation}</div>\`;
      }
      
      responseEl.innerHTML = responseHtml;
      content.appendChild(responseEl);
      content.scrollTop = content.scrollHeight;
      
      // Body 탭이 활성화된 경우 탭 상태 체크
      checkCurrentTab();
    }
    
    function checkCurrentTab() {
      const activeTab = document.querySelector('.response-tab.active');
      if (activeTab && activeTab.textContent === 'Body') {
        showBodyContent();
      }
    }
    
    function showBodyContent() {
      const content = document.getElementById('responseContent');
      const items = content.querySelectorAll('.response-item');
      const responseSection = document.querySelector('.response-section');
      
      // Body 탭 전용 CSS 클래스 추가
      if (responseSection) {
        responseSection.classList.add('body-tab-active');
      }
      
      // Body 탭에서는 가장 최근 응답만 표시하고 상단에 위치
      if (items.length > 0) {
        // 모든 응답 숨기기
        items.forEach(item => {
          item.style.display = 'none';
        });
        
        // 마지막 응답만 표시하고 상단에 위치
        const lastItem = items[items.length - 1];
        if (lastItem) {
          lastItem.style.display = 'flex'; // flex로 변경하여 CSS 스타일 적용
          lastItem.style.order = '-1'; // 상단에 위치
        }
        
        // 빈 상태 메시지 숨기기
        const empty = content.querySelector('.response-empty');
        if (empty) {
          empty.style.display = 'none';
        }
      }
    }
    
    function showHistoryContent() {
      const content = document.getElementById('responseContent');
      const items = content.querySelectorAll('.response-item');
      const responseSection = document.querySelector('.response-section');
      
      // Body 탭 전용 CSS 클래스 제거
      if (responseSection) {
        responseSection.classList.remove('body-tab-active');
      }
      
      // History 탭: 모든 대화 내역 표시하고 기본 스타일로 복원
      items.forEach(item => {
        item.style.display = 'block';
        item.style.order = ''; // order 속성 제거
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
    
    function copyText(button) {
      const textBlock = button.closest('.response-item').querySelector('.explanation-text');
      if (textBlock) {
        navigator.clipboard.writeText(textBlock.textContent);
      }
    }
    
    function switchTab(tab) {
      const tabs = document.querySelectorAll('.response-tab');
      tabs.forEach(t => t.classList.remove('active'));
      event.target.classList.add('active');
      
      if (tab === 'history') {
        showHistoryContent();
      } else {
        showBodyContent();
      }
    }
    
    function clearInput() {
      document.getElementById('questionInput').value = '';
    }
    
    function clearResponses() {
      const content = document.getElementById('responseContent');
      content.innerHTML = \`
        <div class="response-empty">
          <div class="empty-icon">⚡</div>
          <div class="empty-title">No Response</div>
          <div class="empty-description">
            Send 버튼을 클릭하여 AI 요청을 실행하세요.
          </div>
        </div>
      \`;
    }
    
    function showGuide() {
      vscode.postMessage({
        command: 'showGuide'
      });
    }
    
    function showSettings() {
      vscode.postMessage({
        command: 'showSettings'
      });
    }
    
    function openMainDashboard() {
      vscode.postMessage({
        command: 'openMainDashboard'
      });
    }
    
    // 사이드바 폭 변화 감지하여 반응형 레이아웃 적용
    function handleResize() {
      const container = document.getElementById('sidebarContainer');
      const main = document.getElementById('sidebarMain');
      const resizer = document.getElementById('resizer');
      const requestSection = document.querySelector('.request-section');
      const responseSection = document.querySelector('.response-section');
      const width = container.offsetWidth;
      
      // 기존 스타일 초기화
      if (requestSection) {
        requestSection.style.flex = '';
        requestSection.style.height = '';
      }
      if (responseSection) {
        responseSection.style.flex = '';
        responseSection.style.height = '';
      }
      
      if (width > 500) {
        container.classList.add('wide-layout');
        if (resizer) resizer.style.display = 'none';
        
        // 넓은 화면에서 섹션 스타일 적용
        if (requestSection) {
          requestSection.style.flex = '1';
        }
        if (responseSection) {
          responseSection.style.flex = '1';
        }
      } else {
        container.classList.remove('wide-layout');
        if (resizer) resizer.style.display = 'block';
        
        // 좁은 화면에서 기본 플렉스 값 설정
        if (requestSection) {
          requestSection.style.flex = '2';
        }
        if (responseSection) {
          responseSection.style.flex = '1';
        }
        
        initializeResizer();
      }
      
      // 현재 탭 상태 다시 적용
      checkCurrentTab();
    }
    
    // 크기 조절 기능 초기화
    function initializeResizer() {
      const resizer = document.getElementById('resizer');
      const requestSection = document.querySelector('.request-section');
      const responseSection = document.querySelector('.response-section');
      const requestTextarea = document.getElementById('questionInput');
      
      if (!resizer || !requestSection || !responseSection) return;
      
      let isResizing = false;
      let startY = 0;
      let startRequestHeight = 0;
      let startResponseHeight = 0;
      
      resizer.addEventListener('mousedown', (e) => {
        isResizing = true;
        startY = e.clientY;
        startRequestHeight = requestSection.offsetHeight;
        startResponseHeight = responseSection.offsetHeight;
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = 'none';
        e.preventDefault();
      });
      
      function handleMouseMove(e) {
        if (!isResizing) return;
        
        const deltaY = e.clientY - startY;
        const totalHeight = startRequestHeight + startResponseHeight;
        const newRequestHeight = Math.max(100, Math.min(totalHeight - 80, startRequestHeight + deltaY));
        const newResponseHeight = totalHeight - newRequestHeight;
        
        requestSection.style.flex = 'none';
        requestSection.style.height = newRequestHeight + 'px';
        responseSection.style.flex = 'none';
        responseSection.style.height = newResponseHeight + 'px';
        
        // 질문 입력 영역 크기도 동적 조절
        if (requestTextarea) {
          const sectionBody = requestSection.querySelector('.section-body');
          if (sectionBody) {
            const availableHeight = newRequestHeight - 60; // 헤더 높이 제외
            requestTextarea.style.minHeight = Math.max(60, availableHeight - 24) + 'px'; // 패딩 제외
            requestTextarea.style.height = Math.max(60, availableHeight - 24) + 'px';
          }
        }
      }
      
      function handleMouseUp() {
        isResizing = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = '';
      }
    }
    
    // ResizeObserver를 사용하여 사이드바 크기 변화 감지
    const resizeObserver = new ResizeObserver(entries => {
      handleResize();
    });
    
    // 초기 로드 시와 크기 변화 시 반응형 처리
    window.addEventListener('load', () => {
      handleResize();
      resizeObserver.observe(document.getElementById('sidebarContainer'));
    });
  </script>
</body>
</html>
    `;

    return htmlContent;
  }

  /**
   * TriggerDetector에서 발생한 이벤트 처리
   */
  private async handleTriggerEvent(event: TriggerEvent) {
    if (!this._view?.webview) {
      return;
    }

    try {
      // 백엔드 API 호출을 위한 요청 생성
      const request: GenerateRequest = {
        prompt: event.data.prompt,
        context: event.data.context,
        selectedCode: event.data.selectedCode,
        language: event.data.language,
        requestType:
          event.action === "analyze"
            ? "analyze"
            : event.action === "test"
            ? "test"
            : "generate",
      };

      // 로딩 상태 표시
      this._view.webview.postMessage({
        command: "showLoading",
        message: "AI가 코드를 분석하고 있습니다...",
      });

      // 실제 AI API 호출
      const response = await apiClient.generate(request);

      // 웹뷰에 응답 전송
      this._view.webview.postMessage({
        command: "addAIResponse",
        response: response,
      });
    } catch (error) {
      // 에러 처리
      this._view.webview.postMessage({
        command: "showError",
        error:
          error instanceof Error
            ? error.message
            : "알 수 없는 오류가 발생했습니다.",
      });
    }
  }

  private async handleAIQuestion(question: string, webview: vscode.Webview) {
    try {
      // 프롬프트와 컨텍스트 추출
      const extractedPrompt =
        PromptExtractor.combinePromptWithContext(question);

      // 백엔드 API 호출
      const request: GenerateRequest = {
        prompt: extractedPrompt.prompt,
        context: extractedPrompt.context,
        selectedCode: extractedPrompt.selectedCode,
        language: extractedPrompt.language,
        requestType: "generate",
      };

      // 로딩 상태 표시
      webview.postMessage({
        command: "showLoading",
        message: "AI가 응답을 생성하고 있습니다...",
      });

      // 실제 API 호출
      const response = await apiClient.generate(request);

      // 응답을 웹뷰에 전송 (원래 질문 포함)
      webview.postMessage({
        command: "addAIResponse",
        response: {
          ...response,
          originalQuestion: question, // 원래 질문 추가
        },
      });
    } catch (error) {
      // 에러 처리
      webview.postMessage({
        command: "showError",
        error:
          error instanceof Error
            ? error.message
            : "응답 생성 중 오류가 발생했습니다.",
      });
    }
  }

  private async insertCodeToEditor(code: string) {
    try {
      const success = await CodeInserter.smartInsert(code);
      if (success && this._view?.webview) {
        this._view.webview.postMessage({
          command: "insertSuccess",
          message: "코드가 성공적으로 삽입되었습니다.",
        });
      }
    } catch (error) {
      vscode.window.showErrorMessage(
        `코드 삽입 실패: ${
          error instanceof Error ? error.message : "알 수 없는 오류"
        }`
      );
    }
  }
}

/**
 * 대시보드 클래스 - 전체화면 대시보드를 제공합니다.
 */
class DashboardProvider {
  private triggerDetector: TriggerDetector;

  constructor(private readonly _extensionUri: vscode.Uri) {
    // TriggerDetector 초기화 및 이벤트 리스너 설정
    this.triggerDetector = new TriggerDetector();
    this.triggerDetector.onTrigger(this.handleTriggerEvent.bind(this));
  }

  public createDashboardPanel() {
    const panel = vscode.window.createWebviewPanel(
      "hapaDashboard",
      "HAPA AI Assistant",
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [this._extensionUri],
        retainContextWhenHidden: true,
      }
    );

    panel.webview.html = this.getThunderClientHtml();

    // 웹뷰에서 Extension으로의 메시지 처리
    panel.webview.onDidReceiveMessage((message) => {
      switch (message.command) {
        case "alert":
          vscode.window.showInformationMessage(message.text);
          return;
        case "sendQuestion":
          this.handleAIQuestion(message.question, panel.webview);
          return;
        case "insertCode":
          this.insertCodeToEditor(message.code);
          return;
        case "showGuide":
          vscode.commands.executeCommand("hapa.showGuide");
          return;
        case "showSettings":
          vscode.commands.executeCommand("hapa.showSettings");
          return;
        case "openMainDashboard":
          vscode.commands.executeCommand("hapa.openDashboard");
          return;
      }
    });

    return panel;
  }

  private getThunderClientHtml(): string {
    const htmlContent = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HAPA - Main Dashboard</title>
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
    
    .main-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background-color: var(--vscode-sideBar-background);
    }
    
    .main-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 20px;
      background-color: var(--vscode-sideBarSectionHeader-background);
      border-bottom: 1px solid var(--vscode-sideBarSectionHeader-border);
      flex-shrink: 0;
      min-height: 48px;
    }
    
    .main-title {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 16px;
      font-weight: 600;
      color: var(--vscode-sideBarTitle-foreground);
    }
    
    .main-icon {
      width: 24px;
      height: 24px;
      background: linear-gradient(45deg, #007ACC, #40A9FF);
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      color: white;
      font-weight: bold;
    }
    
    .header-actions {
      display: flex;
      gap: 12px;
      align-items: center;
    }
    
    .header-btn {
      padding: 6px 12px;
      font-size: 12px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      background-color: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
      transition: all 0.15s ease;
    }
    
    .header-btn:hover {
      background-color: var(--vscode-button-secondaryHoverBackground);
    }
    
    .connection-status {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
    }
    
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: #4CAF50;
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.5; }
      100% { opacity: 1; }
    }
    
    .main-content {
      flex: 1;
      display: flex;
      flex-direction: row;
      overflow: hidden;
      background-color: var(--vscode-editor-background);
      gap: 2px;
    }
    
    .section {
      background-color: var(--vscode-editor-background);
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    
    .request-section {
      border-right: 1px solid var(--vscode-panel-border);
    }
    
    .response-section {
      border-left: 1px solid var(--vscode-panel-border);
    }
    
    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background-color: var(--vscode-editorGroupHeader-tabsBackground);
      border-bottom: 1px solid var(--vscode-editorGroupHeader-tabsBorder);
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--vscode-tab-inactiveForeground);
    }
    
    .section-controls {
      display: flex;
      gap: 8px;
    }
    
    .section-body {
      flex: 1;
      padding: 20px;
      background-color: var(--vscode-editor-background);
      overflow-y: auto;
    }
    
    .send-btn-header {
      padding: 6px 16px;
      background: linear-gradient(135deg, #007ACC 0%, #0E639C 100%);
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 2px 4px rgba(0, 122, 204, 0.3);
    }
    
    .send-btn-header:hover {
      background: linear-gradient(135deg, #0E639C 0%, #1177BB 100%);
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0, 122, 204, 0.4);
    }
    
    .request-textarea {
      width: 100%;
      height: 100%;
      min-height: 200px;
      padding: 16px;
      background-color: var(--vscode-editor-background);
      color: var(--vscode-editor-foreground);
      border: 1px solid var(--vscode-input-border);
      border-radius: 4px;
      font-family: var(--vscode-editor-font-family);
      font-size: 13px;
      resize: none;
      outline: none;
      line-height: 1.5;
    }
    
    .request-textarea:focus {
      border-color: var(--vscode-focusBorder);
      box-shadow: 0 0 0 1px var(--vscode-focusBorder);
    }
    
    .request-textarea::placeholder {
      color: var(--vscode-input-placeholderForeground);
    }
    
    .response-tabs {
      display: flex;
      background-color: var(--vscode-editorGroupHeader-tabsBackground);
      border-bottom: 1px solid var(--vscode-editorGroupHeader-tabsBorder);
      flex-shrink: 0;
    }
    
    .response-tab {
      padding: 12px 20px;
      font-size: 12px;
      font-weight: 500;
      background: none;
      border: none;
      color: var(--vscode-tab-inactiveForeground);
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: all 0.15s ease;
      position: relative;
    }
    
    .response-tab:hover {
      color: var(--vscode-tab-activeForeground);
      background-color: var(--vscode-tab-hoverBackground);
    }
    
    .response-tab.active {
      color: var(--vscode-tab-activeForeground);
      background-color: var(--vscode-tab-activeBackground);
      border-bottom-color: #007ACC;
    }
    
    .response-content {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      background-color: var(--vscode-editor-background);
    }
    
    .response-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--vscode-descriptionForeground);
      text-align: center;
      padding: 40px 20px;
    }
    
    .empty-icon {
      width: 48px;
      height: 48px;
      margin-bottom: 20px;
      opacity: 0.3;
      background: linear-gradient(135deg, #007ACC, #40A9FF);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 20px;
    }
    
    .empty-title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 8px;
      color: var(--vscode-foreground);
    }
    
    .empty-description {
      font-size: 14px;
      line-height: 1.4;
      max-width: 300px;
    }
    
    .response-item {
      margin-bottom: 20px;
      border: 1px solid var(--vscode-panel-border);
      border-radius: 6px;
      background-color: var(--vscode-textCodeBlock-background);
      overflow: hidden;
    }
    
    .response-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background-color: var(--vscode-breadcrumb-background);
      border-bottom: 1px solid var(--vscode-panel-border);
    }
    
    .response-status {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .status-badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
      background-color: #4CAF50;
      color: white;
    }
    
    .response-time {
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
    }
    
    .response-actions {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    
    .action-btn {
      padding: 6px 12px;
      font-size: 11px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.15s ease;
      font-weight: 500;
    }
    
    .action-btn.primary {
      background: linear-gradient(135deg, #007ACC 0%, #0E639C 100%);
      color: white;
      box-shadow: 0 1px 2px rgba(0, 122, 204, 0.3);
    }
    
    .action-btn.primary:hover {
      background: linear-gradient(135deg, #0E639C 0%, #1177BB 100%);
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0, 122, 204, 0.4);
    }
    
    .action-btn:not(.primary) {
      background-color: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
    }
    
    .action-btn:not(.primary):hover {
      background-color: var(--vscode-button-secondaryHoverBackground);
    }
    
    .code-block {
      padding: 16px;
      background-color: var(--vscode-textPreformat-background);
      border-radius: 4px;
      font-family: var(--vscode-editor-font-family);
      font-size: 12px;
      white-space: pre-wrap;
      margin: 12px 0;
    }
    
    .explanation-text {
      padding: 16px;
      font-size: 13px;
      line-height: 1.5;
      color: var(--vscode-foreground);
    }
    
    /* Body 탭 전용 스타일 */
    .body-tab-active .response-content {
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      padding: 20px;
    }
    
    .body-tab-active .response-item {
      flex: 1;
      margin-bottom: 0;
      display: flex;
      flex-direction: column;
      min-height: calc(100% - 40px);
    }
    
    .body-tab-active .response-item .explanation-text {
      flex: 1;
      overflow-y: auto;
    }
  </style>
</head>
<body>
  <div class="main-container" id="mainContainer">
    <div class="main-header">
      <div class="main-title">
        <div class="main-icon">H</div>
        <span>HAPA - AI Assistant</span>
      </div>
      <div class="header-actions">
        <button class="header-btn" onclick="showGuide()">가이드</button>
        <button class="header-btn" onclick="showSettings()">설정</button>
        <div class="connection-status">
          <div class="status-dot"></div>
          <span>Ready</span>
        </div>
      </div>
    </div>
    
    <div class="main-content" id="mainContent">
      <div class="section request-section">
        <div class="section-header">
          <span>REQUEST</span>
          <div class="section-controls">
            <button class="header-btn" onclick="clearInput()">CLEAR</button>
            <button class="send-btn-header" onclick="sendQuestion()">Send</button>
          </div>
        </div>
        
        <div class="section-body">
          <textarea 
            class="request-textarea" 
            id="questionInput"
            placeholder='코드 분석이나 생성 요청을 입력하세요:

예시:
- 이 함수를 더 효율적으로 만들어줘
- React 컴포넌트를 TypeScript로 변환해줘  
- 이 코드에 에러 처리를 추가해줘
- 단위 테스트를 작성해줘'
          ></textarea>
        </div>
      </div>
      
      <div class="section response-section">
        <div class="section-header">
          <span>RESPONSE</span>
          <div class="section-controls">
            <button class="header-btn" onclick="clearResponses()">CLEAR</button>
          </div>
        </div>
        
        <div class="response-tabs">
          <button class="response-tab active" onclick="switchTab('body')">Body</button>
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
    let currentQuestion = '';
    
    function sendQuestion() {
      const input = document.getElementById('questionInput');
      const question = input.value.trim();
      
      if (!question) {
        return;
      }
      
      currentQuestion = question;
      input.value = '';
      
      // 모의 응답
      setTimeout(() => {
        addAIResponse({
          type: 'code',
          content: 'def optimized_function(data):\\n    # 최적화된 코드\\n    return processed_data',
          explanation: '더 효율적인 알고리즘을 사용하여 성능을 개선했습니다.',
          originalQuestion: currentQuestion
        });
      }, 1000);
      
      vscode.postMessage({
        command: 'sendQuestion',
        question: question
      });
    }
    
    // 웹뷰 메시지 처리
    window.addEventListener('message', event => {
      const message = event.data;
      
      switch (message.command) {
        case 'addAIResponse':
          const response = message.response;
          if (!response.originalQuestion && currentQuestion) {
            response.originalQuestion = currentQuestion;
          }
          addAIResponse(response);
          break;
        case 'showLoading':
          break;
        case 'showError':
          console.error('AI Error:', message.error);
          break;
      }
    });
    
    function addAIResponse(response) {
      const content = document.getElementById('responseContent');
      
      const empty = content.querySelector('.response-empty');
      if (empty) empty.style.display = 'none';
      
      const responseEl = document.createElement('div');
      responseEl.className = 'response-item';
      
      let responseHtml = \`
        <div class="response-header">
          <div class="response-status">
            <span class="status-badge">200 OK</span>
            <span class="response-time">\${Math.floor(Math.random() * 500 + 100)}ms</span>
          </div>
          <div class="response-actions">
            <button class="action-btn" onclick="copyCode(this)">Copy</button>
            <button class="action-btn primary" onclick="insertCode(this)">Insert Code</button>
          </div>
        </div>\`;
      
      if (response.originalQuestion) {
        const safeQuestion = response.originalQuestion.toString().trim();
        if (safeQuestion && safeQuestion !== '' && safeQuestion !== '[object Object]') {
          responseHtml += \`
            <div class="question-display" style="
              background-color: var(--vscode-textBlockQuote-background); 
              border-left: 4px solid var(--vscode-focusBorder); 
              padding: 16px; 
              margin: 12px; 
              border-radius: 6px;
              font-style: italic;
              border-top: 1px solid var(--vscode-panel-border);
            ">
              <div style="
                font-weight: 600; 
                color: var(--vscode-focusBorder); 
                margin-bottom: 8px; 
                font-size: 13px;
              ">📝 질문</div>
              <div style="
                color: var(--vscode-foreground); 
                line-height: 1.5; 
                font-size: 13px;
                font-style: normal;
                white-space: pre-wrap;
                word-wrap: break-word;
              ">\${safeQuestion.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
            </div>\`;
        }
      }
      
      if (response.content) {
        responseHtml += \`<div class="code-block">\${response.content}</div>\`;
      }
      
      if (response.explanation) {
        responseHtml += \`<div class="explanation-text">\${response.explanation}</div>\`;
      }
      
      responseEl.innerHTML = responseHtml;
      content.appendChild(responseEl);
      content.scrollTop = content.scrollHeight;
      
      checkCurrentTab();
    }
    
    function checkCurrentTab() {
      const activeTab = document.querySelector('.response-tab.active');
      if (activeTab && activeTab.textContent === 'Body') {
        showBodyContent();
      }
    }
    
    function showBodyContent() {
      const content = document.getElementById('responseContent');
      const items = content.querySelectorAll('.response-item');
      const responseSection = document.querySelector('.response-section');
      
      if (responseSection) {
        responseSection.classList.add('body-tab-active');
      }
      
      if (items.length > 0) {
        items.forEach(item => {
          item.style.display = 'none';
        });
        
        const lastItem = items[items.length - 1];
        if (lastItem) {
          lastItem.style.display = 'flex';
          lastItem.style.order = '-1';
        }
        
        const empty = content.querySelector('.response-empty');
        if (empty) {
          empty.style.display = 'none';
        }
      }
    }
    
    function showHistoryContent() {
      const content = document.getElementById('responseContent');
      const items = content.querySelectorAll('.response-item');
      const responseSection = document.querySelector('.response-section');
      
      if (responseSection) {
        responseSection.classList.remove('body-tab-active');
      }
      
      items.forEach(item => {
        item.style.display = 'block';
        item.style.order = '';
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
      
      if (tab === 'history') {
        showHistoryContent();
      } else {
        showBodyContent();
      }
    }
    
    function clearInput() {
      document.getElementById('questionInput').value = '';
    }
    
    function clearResponses() {
      const content = document.getElementById('responseContent');
      content.innerHTML = \`
        <div class="response-empty">
          <div class="empty-icon">⚡</div>
          <div class="empty-title">No Response</div>
          <div class="empty-description">
            Send 버튼을 클릭하여 AI 요청을 실행하세요.
          </div>
        </div>
      \`;
    }
    
    function showGuide() {
      vscode.postMessage({
        command: 'showGuide'
      });
    }
    
    function showSettings() {
      vscode.postMessage({
        command: 'showSettings'
      });
    }
  </script>
</body>
</html>
    `;

    return htmlContent;
  }

  /**
   * TriggerDetector에서 발생한 이벤트 처리
   */
  private async handleTriggerEvent(event: TriggerEvent) {
    // 새로운 대시보드를 열어서 처리
    vscode.commands.executeCommand("hapa.openDashboard");
  }

  private async handleAIQuestion(question: string, webview: vscode.Webview) {
    try {
      // 프롬프트와 컨텍스트 추출
      const extractedPrompt =
        PromptExtractor.combinePromptWithContext(question);

      // 백엔드 API 호출
      const request: GenerateRequest = {
        prompt: extractedPrompt.prompt,
        context: extractedPrompt.context,
        selectedCode: extractedPrompt.selectedCode,
        language: extractedPrompt.language,
        requestType: "generate",
      };

      // 로딩 상태 표시
      webview.postMessage({
        command: "showLoading",
        message: "AI가 응답을 생성하고 있습니다...",
      });

      // 실제 API 호출
      const response = await apiClient.generate(request);

      // 응답을 웹뷰에 전송 (원래 질문 포함)
      webview.postMessage({
        command: "addAIResponse",
        response: {
          ...response,
          originalQuestion: question, // 원래 질문 추가
        },
      });
    } catch (error) {
      // 에러 처리
      webview.postMessage({
        command: "showError",
        error:
          error instanceof Error
            ? error.message
            : "응답 생성 중 오류가 발생했습니다.",
      });
    }
  }

  private async insertCodeToEditor(code: string) {
    try {
      const success = await CodeInserter.smartInsert(code);
      if (success) {
        vscode.window.showInformationMessage(
          "코드가 성공적으로 삽입되었습니다."
        );
      }
    } catch (error) {
      vscode.window.showErrorMessage(
        `코드 삽입 실패: ${
          error instanceof Error ? error.message : "알 수 없는 오류"
        }`
      );
    }
  }
}

/**
 * 웹뷰 프로바이더 클래스 - 가이드 뷰를 제공합니다.
 */
class GuideViewProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
  }

  public _getHtmlForWebview(webview: vscode.Webview) {
    return `<!DOCTYPE html>
		<html lang="ko">
		<head>
		  <meta charset="UTF-8">
		  <meta name="viewport" content="width=device-width, initial-scale=1.0">
		  <title>한컴 AI 가이드</title>
		  <style>
			body {
			  font-family: var(--vscode-font-family);
			  background-color: var(--vscode-editor-background);
			  color: var(--vscode-editor-foreground);
			  padding: 20px;
			}
			.container {
			  max-width: 800px;
			  margin: 0 auto;
			}
			h1 {
			  color: var(--vscode-editor-foreground);
			  border-bottom: 1px solid var(--vscode-panel-border);
			  padding-bottom: 10px;
			}
			.step {
			  margin-bottom: 20px;
			}
			.step-number {
			  display: inline-block;
			  width: 24px;
			  height: 24px;
			  background-color: var(--vscode-button-background);
			  color: var(--vscode-button-foreground);
			  border-radius: 12px;
			  text-align: center;
			  line-height: 24px;
			  margin-right: 8px;
			}
		  </style>
		</head>
		<body>
		  <div class="container">
			<h1>한컴 AI 사용 가이드</h1>
			
			<div class="step">
			  <div class="step-number">1</div>
			  <h3>기본 설정</h3>
			  <p>명령어 팔레트(Ctrl+Shift+P)에서 "한컴 AI: 설정"을 실행하여 초기 설정을 완료하세요.</p>
			</div>
			
			<div class="step">
			  <div class="step-number">2</div>
			  <h3>코드 분석 사용하기</h3>
			  <p>코드 편집기에서 우클릭 메뉴를 통해 "한컴 AI: 코드 분석"을 선택하거나, 명령어 팔레트에서 실행하세요.</p>
			</div>
			
			<div class="step">
			  <div class="step-number">3</div>
			  <h3>테스트 생성하기</h3>
			  <p>함수나 클래스에 대한 테스트를 자동으로 생성하려면 코드를 선택한 후 우클릭 메뉴에서 "한컴 AI: 테스트 생성"을 선택하세요.</p>
			</div>
		  </div>
		</body>
		</html>`;
  }
}

/**
 * 웹뷰 프로바이더 클래스 - 설정 뷰를 제공합니다.
 */
class SettingsViewProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // 웹뷰에서 Extension으로의 메시지 처리
    webviewView.webview.onDidReceiveMessage((message) => {
      switch (message.command) {
        case "updateSetting":
          vscode.workspace
            .getConfiguration("hapa")
            .update(
              message.key,
              message.value,
              vscode.ConfigurationTarget.Global
            );
          return;
      }
    });
  }

  public _getHtmlForWebview(webview: vscode.Webview) {
    const config = vscode.workspace.getConfiguration("hapa");

    return `<!DOCTYPE html>
		<html lang="ko">
		<head>
		  <meta charset="UTF-8">
		  <meta name="viewport" content="width=device-width, initial-scale=1.0">
		  <title>한컴 AI 설정</title>
		  <style>
			body {
			  font-family: var(--vscode-font-family);
			  background-color: var(--vscode-editor-background);
			  color: var(--vscode-editor-foreground);
			  padding: 20px;
			}
			.container {
			  max-width: 800px;
			  margin: 0 auto;
			}
			h1 {
			  color: var(--vscode-editor-foreground);
			  border-bottom: 1px solid var(--vscode-panel-border);
			  padding-bottom: 10px;
			}
			.setting-item {
			  margin-bottom: 16px;
			}
			.setting-label {
			  display: block;
			  margin-bottom: 8px;
			}
			select, input {
			  background-color: var(--vscode-input-background);
			  color: var(--vscode-input-foreground);
			  border: 1px solid var(--vscode-input-border);
			  padding: 6px 8px;
			  border-radius: 4px;
			  width: 100%;
			}
		  </style>
		</head>
		<body>
		  <div class="container">
			<h1>한컴 AI 설정</h1>
			
			<div class="setting-item">
			  <label class="setting-label">
				<input 
				  type="checkbox" 
				  id="enableCodeAnalysis" 
				  ${config.get("enableCodeAnalysis") ? "checked" : ""}
				  onchange="updateSetting('enableCodeAnalysis', this.checked)"
				>
				코드 분석 기능 활성화
			  </label>
			</div>
			
			<div class="setting-item">
			  <label class="setting-label">테마</label>
			  <select 
				id="theme" 
				onchange="updateSetting('theme', this.value)"
			  >
				<option value="light" ${
          config.get("theme") === "light" ? "selected" : ""
        }>라이트</option>
				<option value="dark" ${
          config.get("theme") === "dark" ? "selected" : ""
        }>다크</option>
				<option value="system" ${
          config.get("theme") === "system" ? "selected" : ""
        }>시스템</option>
			  </select>
			</div>
		  </div>
		  <script>
			const vscode = acquireVsCodeApi();
			
			function updateSetting(key, value) {
			  vscode.postMessage({
				command: 'updateSetting',
				key: key,
				value: value
			  });
			}
		  </script>
		</body>
		</html>`;
  }
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // 모듈 인스턴스들 생성
  const triggerDetector = new TriggerDetector();
  console.log("한컴 AI Extension이 활성화되었습니다!");

  // 웹뷰 프로바이더 등록
  const sidebarDashboardProvider = new SidebarDashboardViewProvider(
    context.extensionUri
  );
  const dashboardProvider = new DashboardProvider(context.extensionUri);
  const guideProvider = new GuideViewProvider(context.extensionUri);
  const settingsProvider = new SettingsViewProvider(context.extensionUri);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "hapa-dashboard",
      sidebarDashboardProvider
    )
  );

  // 명령어 등록
  context.subscriptions.push(
    vscode.commands.registerCommand("hapa.start", () => {
      vscode.window.showInformationMessage("HAPA가 시작되었습니다!");
    }),

    vscode.commands.registerCommand("hapa.settings", () => {
      vscode.commands.executeCommand("workbench.view.extension.hapa-sidebar");
      vscode.commands.executeCommand("hapa-settings.focus");
    }),

    // 실제 TriggerDetector와 연동된 명령어들
    vscode.commands.registerCommand("hapa.analyze", () => {
      triggerDetector.handleCommand("hapa.analyze");
    }),

    vscode.commands.registerCommand("hapa.generateTest", () => {
      triggerDetector.handleCommand("hapa.generateTest");
    }),

    // 새로운 명령어들 추가
    vscode.commands.registerCommand("hapa.explain", () => {
      triggerDetector.handleCommand("hapa.explain");
    }),

    vscode.commands.registerCommand("hapa.analyzeSelection", () => {
      triggerDetector.handleContextMenu("analyze");
    }),

    vscode.commands.registerCommand("hapa.testSelection", () => {
      triggerDetector.handleContextMenu("test");
    }),

    vscode.commands.registerCommand("hapa.explainSelection", () => {
      triggerDetector.handleContextMenu("explain");
    }),

    vscode.commands.registerCommand("hapa.insertCode", async (code: string) => {
      await CodeInserter.smartInsert(code);
    }),

    // 웹사이트로 이동하는 명령어 추가
    vscode.commands.registerCommand("hapa.openWebsite", () => {
      vscode.env.openExternal(vscode.Uri.parse("https://hancom-ai.com"));
    }),

    // 문서 페이지로 이동하는 명령어 추가
    vscode.commands.registerCommand("hapa.openDocs", () => {
      vscode.env.openExternal(vscode.Uri.parse("https://hancom-ai.com/guide"));
    }),

    // 대시보드 열기 명령 추가
    vscode.commands.registerCommand("hapa.openDashboard", () => {
      dashboardProvider.createDashboardPanel();
    }),

    // 가이드와 설정을 별도 패널로 표시하는 명령어들 추가
    vscode.commands.registerCommand("hapa.showGuide", () => {
      const panel = vscode.window.createWebviewPanel(
        "hapaGuide",
        "HAPA 가이드",
        vscode.ViewColumn.One,
        {
          enableScripts: true,
          localResourceRoots: [context.extensionUri],
        }
      );
      panel.webview.html = guideProvider._getHtmlForWebview(panel.webview);
    }),

    vscode.commands.registerCommand("hapa.showSettings", () => {
      const panel = vscode.window.createWebviewPanel(
        "hapaSettings",
        "HAPA 설정",
        vscode.ViewColumn.One,
        {
          enableScripts: true,
          localResourceRoots: [context.extensionUri],
        }
      );
      panel.webview.html = settingsProvider._getHtmlForWebview(panel.webview);

      // 설정 패널에서 메시지를 처리하도록 설정
      panel.webview.onDidReceiveMessage((message) => {
        switch (message.command) {
          case "updateSetting":
            vscode.workspace
              .getConfiguration("hapa")
              .update(
                message.key,
                message.value,
                vscode.ConfigurationTarget.Global
              );
            return;
        }
      });
    })
  );

  // 상태 바에 한컴 AI 아이콘 추가
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBarItem.text = "$(star) 한컴 AI";
  statusBarItem.tooltip = "한컴 AI 메뉴 열기";
  statusBarItem.command = "hapa.start";
  statusBarItem.show();

  context.subscriptions.push(statusBarItem);
}

// This method is called when your extension is deactivated
export function deactivate() {
  console.log("한컴 AI Extension이 비활성화되었습니다.");
}
