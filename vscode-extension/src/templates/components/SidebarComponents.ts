/**
 * 사이드바 HTML 컴포넌트 생성 클래스
 */
export class SidebarComponents {
  /**
   * 사이드바 헤더 컴포넌트
   */
  static generateHeader(): string {
    return `
    <div class="sidebar-header hapa-animate-fade-in-down">
      <div class="sidebar-title">
        <div class="sidebar-icon hapa-hover-scale">H</div>
        HAPA
      </div>
      <div class="header-actions hapa-animate-fade-in-right hapa-animate-delay-100">
        <div class="connection-status">
          <div class="status-dot"></div>
          Connected
        </div>
        <button class="expand-btn hapa-button hapa-hover-lift" onclick="openMainDashboard()">
          <span>↗</span>
          Expand
        </button>
        <div class="menu-container" style="position: relative;">
          <button class="menu-btn hapa-button hapa-hover-lift" onclick="toggleMenu()" title="메뉴">
            <span>⋯</span>
          </button>
          <div class="menu-dropdown" id="menuDropdown">
            <button class="menu-item" onclick="clearAllHistory()">
              <span>🗑️</span>
              기록 전체 삭제
            </button>
            <div class="menu-separator"></div>
            <button class="menu-item" onclick="openSettings()">
              <span>⚙️</span>
              설정
            </button>
            <button class="menu-item" onclick="showHelp()">
              <span>❓</span>
              도움말
            </button>
          </div>
        </div>
      </div>
    </div>
    `;
  }

  /**
   * 질문 입력 섹션
   */
  static generateQuestionSection(): string {
    return `
    <div class="request-section hapa-animate-fade-in-up hapa-animate-delay-200">
      <div class="section-header">
        <div class="section-title">질문하기</div>
        <div class="section-subtitle">AI 어시스턴트에게 무엇이든 물어보세요</div>
      </div>
      
      <div class="question-form">
        <div class="input-container">
          <textarea 
            id="questionInput" 
            class="question-input" 
            placeholder="Python 코드 생성, 버그 수정, 코드 설명 등을 요청해보세요..."
            rows="3"
            maxlength="2000">
          </textarea>
          <div class="input-footer">
            <div class="input-info">
              <span class="char-count">0/2000</span>
              <span class="input-tip">Enter: 전송, Shift+Enter: 줄바꿈</span>
            </div>
          </div>
        </div>
        
        <div class="action-buttons">
          <button id="sendBtn" class="send-btn hapa-button hapa-hover-lift" onclick="sendQuestion()">
            <span class="codicon codicon-send"></span>
            전송
          </button>
          <button class="clear-btn hapa-button hapa-hover-lift" onclick="clearInput()">
            <span class="codicon codicon-clear-all"></span>
            지우기
          </button>
        </div>
      </div>
      
      <div class="quick-actions hapa-animate-fade-in hapa-animate-delay-300">
        <div class="quick-title">빠른 액션</div>
        <div class="quick-buttons">
          <button class="quick-btn" onclick="insertQuickPrompt('코드 최적화')">
            <span>⚡</span>코드 최적화
          </button>
          <button class="quick-btn" onclick="insertQuickPrompt('버그 찾기')">
            <span>🐛</span>버그 찾기
          </button>
          <button class="quick-btn" onclick="insertQuickPrompt('코드 설명')">
            <span>📚</span>코드 설명
          </button>
          <button class="quick-btn" onclick="insertQuickPrompt('테스트 코드')">
            <span>🧪</span>테스트 코드
          </button>
        </div>
      </div>
    </div>
    `;
  }

  /**
   * 응답 표시 섹션
   */
  static generateResponseSection(): string {
    return `
    <div class="response-section hapa-animate-fade-in-up hapa-animate-delay-400">
      <div class="section-header">
        <div class="section-title">응답</div>
        <div class="response-actions">
          <button id="stopBtn" class="stop-btn hapa-button" onclick="stopStreaming()" style="display: none;">
            <span class="codicon codicon-primitive-square"></span>
            중단
          </button>
          <button id="continueBtn" class="continue-btn hapa-button" onclick="continueResponse()" style="display: none;">
            <span class="codicon codicon-play"></span>
            이어가기
          </button>
        </div>
      </div>
      
      <div id="responseDisplay" class="response-display">
        <div class="empty-state">
          <div class="empty-icon">💭</div>
          <div class="empty-title">질문을 기다리고 있어요</div>
          <div class="empty-description">
            위의 입력창에 질문을 입력하거나 빠른 액션을 선택해보세요.
          </div>
        </div>
      </div>
      
      <div id="streamingIndicator" class="streaming-indicator" style="display: none;">
        <div class="streaming-content">
          <div class="streaming-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <span class="streaming-text">AI가 응답을 생성하고 있습니다...</span>
        </div>
      </div>
    </div>
    `;
  }

  /**
   * 히스토리 섹션
   */
  static generateHistorySection(): string {
    return `
    <div class="history-section hapa-animate-fade-in-up hapa-animate-delay-500">
      <div class="section-header">
        <div class="section-title">대화 기록</div>
        <div class="history-actions">
          <button class="history-clear-btn hapa-button" onclick="clearAllHistory()" title="전체 삭제">
            <span class="codicon codicon-trash"></span>
          </button>
        </div>
      </div>
      
      <div id="historyContent" class="history-content">
        <div class="history-empty">
          <div class="empty-icon">📝</div>
          <div class="empty-title">아직 대화 기록이 없어요</div>
          <div class="empty-description">
            질문을 시작하면 여기에 기록이 남습니다.
          </div>
        </div>
      </div>
    </div>
    `;
  }

  /**
   * 상태 표시 컴포넌트들
   */
  static generateStatusComponents(): string {
    return `
    <div id="codeContextIndicator" class="code-context-indicator">
      <div class="context-icon">📝</div>
      <div class="context-content">
        <div class="context-message">코드 맥락 감지 중...</div>
        <div class="context-details"></div>
      </div>
    </div>
    
    <div id="loadingOverlay" class="loading-overlay" style="display: none;">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <div class="loading-message">처리 중...</div>
      </div>
    </div>
    `;
  }

  /**
   * 메인 컨테이너 구조
   */
  static generateMainContainer(): string {
    return `
    <div class="sidebar-container hapa-animate-fade-in" id="sidebarContainer">
      ${this.generateHeader()}
      ${this.generateQuestionSection()}
      ${this.generateResponseSection()}
      ${this.generateHistorySection()}
      ${this.generateStatusComponents()}
    </div>
    `;
  }
}
