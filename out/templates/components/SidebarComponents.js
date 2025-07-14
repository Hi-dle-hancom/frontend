"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SidebarComponents = void 0;
/**
 * 사이드바 HTML 컴포넌트 생성 클래스
 */
class SidebarComponents {
    /**
     * 사이드바 헤더 컴포넌트
     */
    static generateHeader() {
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
    static generateExpandedHeader() {
        return `
    <div class="sidebar-header hapa-animate-fade-in-down">
      <div class="sidebar-title">
        HAPA - Expanded View
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
    static generateQuestionSection() {
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
            코드 생성
          </button>
        </div>
      </div>
    </div>
    `;
    }
    /**
     * 응답 표시 섹션
     */
    static generateResponseSection() {
        return `
    <div class="response-section hapa-animate-fade-in-up hapa-animate-delay-400">
      <div class="response-tabs">
        <button class="tab-btn active" onclick="switchTab('response')" data-tab="response">응답</button>
        <button class="tab-btn" onclick="switchTab('history')" data-tab="history">기록</button>
      </div>
      
      <div class="tab-content">
        <div class="response-content" style="display: block;">
          <div id="response-content" class="response-display">
            <div class="test-response-content">
              <div class="response-header">
                <div class="response-title">✅ HAPA 응답</div>
                <div class="response-meta">방금 전</div>
              </div>
              <div class="response-body">
                <p>응답/기록 섹션이 정상적으로 작동하고 있습니다.</p>
                <pre class="code-block"><code># 테스트 코드 예시
def hello_world():
    print("Hello, HAPA!")
    return "응답 표시 테스트 완료"</code></pre>
              </div>
            </div>
          </div>
          <div class="response-actions" style="display: none;">
            <button id="copy-button" class="copy-button hapa-button" style="display: none;">
              📋 복사
            </button>
          </div>
          
          <div id="streamingIndicator" class="streaming-indicator" style="display: none;">
            <div class="streaming-content">
              <div class="streaming-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span id="streaming-status" class="streaming-text">HAPA가 응답을 생성하고 있습니다...</span>
            </div>
          </div>
          
          <div id="errorMessage" class="error-message" style="display: none;">
            <div class="error-content">
              <span class="error-text">오류 발생 : HTTP 401: Unauthorized</span>
            </div>
          </div>
        </div>
        
        <div class="history-content" style="display: none;">
          <div class="history-list" id="historyContent">
            <div class="test-history-item">
              <div class="history-question">
                <div class="history-meta">5분 전</div>
                <div class="question-text">Python 함수 작성 방법을 알려주세요</div>
              </div>
              <div class="history-response">
                <div class="response-preview">✅ 기본적인 Python 함수 작성 방법을 설명드렸습니다.</div>
              </div>
            </div>
            <div class="test-history-item">
              <div class="history-question">
                <div class="history-meta">10분 전</div>
                <div class="question-text">autocomplete 모델 사용법</div>
              </div>
              <div class="history-response">
                <div class="response-preview">✅ 자동완성 코드 생성 방법을 안내했습니다.</div>
              </div>
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
    static generateStatusComponents() {
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
    static generateMainContainer() {
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
    static generateExpandedMainContainer() {
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
exports.SidebarComponents = SidebarComponents;
//# sourceMappingURL=SidebarComponents.js.map