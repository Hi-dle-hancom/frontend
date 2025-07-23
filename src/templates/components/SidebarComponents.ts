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
        HAPA
      </div>
      <div class="header-actions hapa-animate-fade-in-right hapa-animate-delay-100">
        <div class="connection-status">
          <div class="status-dot"></div>
          Connected
        </div>
        <button class="expand-btn hapa-button hapa-hover-lift" onclick="openMainDashboard()">
          <span>↗</span>
        </button>
        <button class="header-action-btn settings-btn hapa-button hapa-hover-lift" onclick="openSettings()" title="설정">
          <span>⚙️</span>
        </button>
        <button class="header-action-btn help-btn hapa-button hapa-hover-lift" onclick="showHelp()" title="도움말">
          <span>❓</span>
        </button>
      </div>
    </div>
    `;
  }

  /**
   * 확장 뷰용 헤더 컴포넌트 (확장 버튼 제거)
   */
  static generateExpandedHeader(): string {
    return `
    <div class="sidebar-header hapa-animate-fade-in-down">
      <div class="sidebar-title">
        HAPA
      </div>
      <div class="header-actions hapa-animate-fade-in-right hapa-animate-delay-100">
        <div class="connection-status">
          <div class="status-dot"></div>
          Connected
        </div>
        <button class="header-action-btn settings-btn hapa-button hapa-hover-lift" onclick="openSettings()" title="설정">
          <span>⚙️</span>
        </button>
        <button class="header-action-btn help-btn hapa-button hapa-hover-lift" onclick="showHelp()" title="도움말">
          <span>❓</span>
        </button>
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
      <div class="model-tabs-section">
        <div class="model-tabs">
          <button 
            class="model-tab active" 
            data-model="autocomplete" 
            onclick="selectModelTab('autocomplete')"
            title="자동완성 코드를 생성합니다">
            autocomplete
          </button>
          <button 
            class="model-tab" 
            data-model="prompt" 
            onclick="selectModelTab('prompt')"
            title="프롬프트 기반 코드를 생성합니다">
            prompt
          </button>
          <button 
            class="model-tab" 
            data-model="comment" 
            onclick="selectModelTab('comment')"
            title="코멘트 기반 코드를 생성합니다">
            comment
          </button>
          <button 
            class="model-tab" 
            data-model="error_fix" 
            onclick="selectModelTab('error_fix')"
            title="에러를 수정하는 코드를 생성합니다">
            error_fix
          </button>
        </div>
      </div>
      
      <div class="question-form">
        <div class="input-container">
          <textarea 
            id="questionInput" 
            class="question-input" 
            placeholder="자동완성 코드 생성에 대해 질문하거나 요청사항을 입력하세요..."
            rows="3"
            maxlength="2000"></textarea>
        </div>
        
        <div class="action-buttons">
          <button id="generate-btn" class="send-btn hapa-button hapa-hover-lift" onclick="submitQuestion()">
            전송
          </button>
        </div>
      </div>
    </div>
    `;
  }

  /**
   * 응답 표시 섹션 (클로드 스타일)
   */
  static generateResponseSection(): string {
    return `
    <div class="response-section hapa-animate-fade-in-up hapa-animate-delay-400">
      <div class="response-tabs">
        <button class="tab-btn active" onclick="switchTab('response')" data-tab="response">응답</button>
        <button class="tab-btn" onclick="switchTab('history')" data-tab="history">기록</button>
      </div>
      
      <div class="tab-content">
        <!-- 응답 탭 컨텐츠 -->
        <div class="response-content" style="display: block;">
          <!-- 클로드 스타일 응답 컨테이너 -->
          <div id="response-content" class="claude-style-response">
            <!-- 기본 초기 상태 (빈 응답) -->
            <div class="claude-empty-state">
              <div class="empty-icon">💭</div>
              <div class="empty-message">질문을 입력하고 전송 버튼을 눌러보세요.</div>
              <div class="empty-submessage">HAPA가 맞춤형 코드를 생성해드립니다.</div>
            </div>
          </div>
          
          <!-- 스트리밍 인디케이터 (개선된 디자인) -->
          <div id="streamingIndicator" class="claude-streaming-indicator" style="display: none;">
            <div class="claude-response-container">
              <div class="claude-response-header">
                <div class="claude-response-meta">
                  <span class="claude-timestamp">생성 중...</span>
                </div>
              </div>
              <div class="claude-response-body">
                <div class="claude-streaming-content">
                  <div class="claude-streaming-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <span id="streaming-status" class="claude-streaming-text">AI가 응답을 생성하고 있습니다...</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 에러 메시지 (클로드 스타일) -->
          <div id="errorMessage" class="claude-error-message" style="display: none;">
            <div class="claude-response-container error">
              <div class="claude-response-header">
                <div class="claude-ai-avatar error">⚠️</div>
                <div class="claude-response-meta">
                  <span class="claude-model-name">오류 발생</span>
                  <span class="claude-timestamp" id="error-timestamp"></span>
                </div>
              </div>
              <div class="claude-response-body">
                <div class="claude-error-content">
                  <span class="claude-error-text">요청 처리 중 오류가 발생했습니다</span>
                  <div class="claude-error-details" id="error-details"></div>
                </div>
              </div>
              <div class="claude-response-actions">
                <button class="claude-action-btn retry-btn" onclick="retryLastRequest()">
                  <span class="claude-btn-icon">🔄</span> 다시 시도
                </button>
              </div>
            </div>
          </div>

          <!-- 기존 호환성을 위한 숨겨진 요소들 -->
          <div class="response-actions" style="display: none;">
            <button id="copy-button" class="copy-button hapa-button" style="display: none;">
              복사
            </button>
          </div>
        </div>
        
        <!-- 히스토리 탭 컨텐츠 -->
        <div class="history-content" style="display: none;">
          <div class="history-list" id="historyContent">
            <!-- 히스토리 항목들이 JavaScript에서 동적으로 생성됩니다 -->
            <div class="empty-history">
              <div class="empty-history-icon">📝</div>
              <div class="empty-history-message">히스토리를 불러오는 중...</div>
              <div class="empty-history-submessage">잠시만 기다려주세요</div>
            </div>
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
        <div id="loading-spinner" class="loading-spinner"></div>
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
      ${this.generateStatusComponents()}
    </div>
    `;
  }

  /**
   * 확장 뷰용 메인 컨테이너 구조 (좌우 레이아웃)
   */
  static generateExpandedMainContainer(): string {
    return `
    <div class="expanded-container hapa-animate-fade-in" id="expandedContainer">
      ${this.generateExpandedHeader()}
      <div class="expanded-content">
        <div class="left-panel">
          ${this.generateQuestionSection()}
        </div>
        <div class="right-panel">
          ${this.generateResponseSection()}
        </div>
      </div>
      ${this.generateStatusComponents()}
    </div>
    `;
  }
}