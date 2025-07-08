/**
 * 사이드바 JavaScript 로직 생성 클래스
 */
export class SidebarScripts {
  static generateJS(): string {
    return `
    // VSCode API 접근
    const vscode = acquireVsCodeApi();
    
    // 전역 변수들
    let currentStreamingContent = '';
    let isStreaming = false;
    let requestStartTime = 0;
    let streamingSequence = 0;
    
    /**
     * 질문 전송 함수
     */
    function sendQuestion() {
      const input = document.getElementById('questionInput');
      const question = input?.value?.trim();
      
      if (!question) {
        showError('질문을 입력해주세요.');
        return;
      }
      
      if (question.length > 2000) {
        showError('질문이 너무 깁니다. 2000자 이내로 입력해주세요.');
        return;
      }
      
      // 스트리밍 시작
      isStreaming = true;
      showStreamingIndicator();
      requestStartTime = Date.now();
      
      // UI 업데이트
      const sendBtn = document.getElementById('sendBtn');
      if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.innerHTML = '<span class="codicon codicon-loading codicon-modifier-spin"></span> 생성 중...';
      }
      
      // 메시지 전송
      vscode.postMessage({
        command: 'generateCode',
        question: question
      });
      
      // 히스토리에 질문 추가 (즉시)
      addQuestionToHistory(question);
    }
    
    /**
     * 스트리밍 표시기 표시
     */
    function showStreamingIndicator() {
      const indicator = document.getElementById('streamingIndicator');
      const responseDisplay = document.getElementById('responseDisplay');
      
      if (indicator && responseDisplay) {
        indicator.style.display = 'block';
        responseDisplay.innerHTML = '';
        streamingSequence = 0;
      }
    }
    
    /**
     * 스트리밍 표시기 숨기기
     */
    function hideStreamingIndicator() {
      const indicator = document.getElementById('streamingIndicator');
      if (indicator) {
        indicator.style.display = 'none';
      }
    }
    
    /**
     * 스트리밍 중단
     */
    function stopStreaming() {
      if (!isStreaming) return;
      
      vscode.postMessage({
        command: 'stopStreaming'
      });
      
      isStreaming = false;
      hideStreamingIndicator();
      
      const sendBtn = document.getElementById('sendBtn');
      if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.innerHTML = '<span class="codicon codicon-send"></span> 전송';
      }
      
      showStatus('스트리밍이 중단되었습니다.');
    }
    
    /**
     * 입력창 지우기
     */
    function clearInput() {
      const input = document.getElementById('questionInput');
      if (input) {
        input.value = '';
        updateCharCount();
      }
    }
    
    /**
     * 문자 수 업데이트
     */
    function updateCharCount() {
      const input = document.getElementById('questionInput');
      const counter = document.querySelector('.char-count');
      
      if (input && counter) {
        const length = input.value.length;
        counter.textContent = \`\${length}/2000\`;
        
        if (length > 1800) {
          counter.style.color = 'var(--vscode-errorForeground)';
        } else if (length > 1500) {
          counter.style.color = 'var(--vscode-warningForeground)';
        } else {
          counter.style.color = 'var(--vscode-descriptionForeground)';
        }
      }
    }
    
    /**
     * 빠른 프롬프트 삽입
     */
    function insertQuickPrompt(prompt) {
      const input = document.getElementById('questionInput');
      if (input) {
        input.value = prompt;
        input.focus();
        updateCharCount();
      }
    }
    
    /**
     * 히스토리에 질문 추가
     */
    function addQuestionToHistory(question) {
      const historyContent = document.getElementById('historyContent');
      if (!historyContent) return;
      
      // 빈 상태 제거
      const emptyState = historyContent.querySelector('.history-empty');
      if (emptyState) {
        emptyState.remove();
      }
      
      // 새 히스토리 아이템 생성
      const historyItem = document.createElement('div');
      historyItem.className = 'history-item';
      historyItem.innerHTML = \`
        <div class="history-question">\${escapeHtml(question)}</div>
        <div class="history-response">응답 생성 중...</div>
        <div class="history-timestamp">\${new Date().toLocaleString()}</div>
        <button class="history-delete-btn" onclick="deleteHistoryItem(this)" title="삭제">×</button>
      \`;
      
      // 맨 위에 추가
      historyContent.insertBefore(historyItem, historyContent.firstChild);
    }
    
    /**
     * 히스토리 아이템 업데이트
     */
    function updateHistoryResponse(response) {
      const historyContent = document.getElementById('historyContent');
      if (!historyContent) return;
      
      const firstItem = historyContent.querySelector('.history-item .history-response');
      if (firstItem) {
        firstItem.textContent = response.substring(0, 100) + (response.length > 100 ? '...' : '');
      }
    }
    
    /**
     * 히스토리 아이템 삭제
     */
    function deleteHistoryItem(button) {
      const item = button.closest('.history-item');
      if (item) {
        item.remove();
        
        // 히스토리가 비었는지 확인
        const historyContent = document.getElementById('historyContent');
        if (historyContent && historyContent.children.length === 0) {
          historyContent.innerHTML = \`
            <div class="history-empty">
              <div class="empty-icon">📝</div>
              <div class="empty-title">아직 대화 기록이 없어요</div>
              <div class="empty-description">질문을 시작하면 여기에 기록이 남습니다.</div>
            </div>
          \`;
        }
      }
    }
    
    /**
     * 전체 히스토리 삭제
     */
    function clearAllHistory() {
      vscode.postMessage({
        command: 'clearHistory'
      });
      
      const historyContent = document.getElementById('historyContent');
      if (historyContent) {
        historyContent.innerHTML = \`
          <div class="history-empty">
            <div class="empty-icon">📝</div>
            <div class="empty-title">아직 대화 기록이 없어요</div>
            <div class="empty-description">질문을 시작하면 여기에 기록이 남습니다.</div>
          </div>
        \`;
      }
    }
    
    /**
     * 메뉴 토글
     */
    function toggleMenu() {
      const dropdown = document.getElementById('menuDropdown');
      if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
      }
    }
    
    /**
     * 메인 대시보드 열기
     */
    function openMainDashboard() {
      vscode.postMessage({
        command: 'openMainDashboard'
      });
    }
    
    /**
     * 설정 열기
     */
    function openSettings() {
      vscode.postMessage({
        command: 'openSettings'
      });
    }
    
    /**
     * 도움말 표시
     */
    function showHelp() {
      vscode.postMessage({
        command: 'showHelp'
      });
    }
    
    /**
     * 코드 에디터에 삽입
     */
    function insertToEditor(code) {
      vscode.postMessage({
        command: 'insertCode',
        code: code
      });
    }
    
    /**
     * 코드 복사
     */
    async function copyCode(code) {
      try {
        await navigator.clipboard.writeText(code);
        showStatus('코드가 클립보드에 복사되었습니다.');
      } catch (err) {
        showError('코드 복사에 실패했습니다.');
      }
    }
    
    /**
     * 상태 메시지 표시
     */
    function showStatus(message) {
      const statusDiv = document.createElement('div');
      statusDiv.style.cssText = \`
        position: fixed;
        top: 10px;
        right: 10px;
        background: var(--vscode-infoBackground);
        color: var(--vscode-infoForeground);
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
    
    /**
     * 오류 메시지 표시
     */
    function showError(message) {
      const statusDiv = document.createElement('div');
      statusDiv.style.cssText = \`
        position: fixed;
        top: 10px;
        right: 10px;
        background: var(--vscode-errorBackground);
        color: var(--vscode-errorForeground);
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 12px;
        z-index: 1000;
      \`;
      statusDiv.textContent = message;
      document.body.appendChild(statusDiv);
      
      setTimeout(() => {
        document.body.removeChild(statusDiv);
      }, 5000);
    }
    
    /**
     * HTML 이스케이프
     */
    function escapeHtml(unsafe) {
      return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }
    
    /**
     * 마크다운을 HTML로 변환 (간단한 버전)
     */
    function markdownToHtml(markdown) {
      return markdown
        .replace(/\`\`\`([^]+?)\`\`\`/g, '<pre><code>$1</code></pre>')
        .replace(/\`([^]+?)\`/g, '<code>$1</code>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        .replace(/\\n/g, '<br>');
    }
    
    /**
     * 이어가기 버튼 기능
     */
    function continueResponse() {
      if (!currentStreamingContent) {
        showError('이어갈 응답이 없습니다.');
        return;
      }
      
      const continueBtn = document.getElementById('continueBtn');
      if (continueBtn) {
        continueBtn.disabled = true;
        continueBtn.innerHTML = '<span class="codicon codicon-loading codicon-modifier-spin"></span> 이어가는 중...';
      }
      
      isStreaming = true;
      showStreamingIndicator();
      requestStartTime = Date.now();
      
      vscode.postMessage({
        command: 'continueResponse',
        previousContent: currentStreamingContent,
        continuePrompt: "이전 응답을 계속해서 완성해주세요."
      });
    }
    
    /**
     * 메시지 수신 처리
     */
    window.addEventListener('message', event => {
      const message = event.data;
      
      switch (message.command) {
        case 'streamingChunk':
          handleStreamingChunk(message.data);
          break;
          
        case 'streamingComplete':
          handleStreamingComplete(message.data);
          break;
          
        case 'streamingError':
          handleStreamingError(message.data);
          break;
          
        case 'updateHistory':
          updateHistoryDisplay(message.data);
          break;
          
        case 'showError':
          showError(message.message);
          break;
          
        case 'showStatus':
          showStatus(message.message);
          break;
      }
    });
    
    /**
     * 스트리밍 청크 처리
     */
    function handleStreamingChunk(chunk) {
      if (!isStreaming) return;
      
      const responseDisplay = document.getElementById('responseDisplay');
      if (!responseDisplay) return;
      
      if (chunk.type === 'start') {
        hideStreamingIndicator();
        currentStreamingContent = '';
        responseDisplay.innerHTML = '<div class="streaming-content"></div>';
      } else if (chunk.type === 'token' || chunk.type === 'code') {
        currentStreamingContent += chunk.content;
        const contentDiv = responseDisplay.querySelector('.streaming-content');
        if (contentDiv) {
          contentDiv.innerHTML = markdownToHtml(currentStreamingContent);
        }
      }
    }
    
    /**
     * 스트리밍 완료 처리
     */
    function handleStreamingComplete(data) {
      isStreaming = false;
      hideStreamingIndicator();
      
      const sendBtn = document.getElementById('sendBtn');
      if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.innerHTML = '<span class="codicon codicon-send"></span> 전송';
      }
      
      // 이어가기 버튼 표시 (토큰 제한 감지 시)
      if (detectTokenLimit(currentStreamingContent)) {
        const continueBtn = document.getElementById('continueBtn');
        if (continueBtn) {
          continueBtn.style.display = 'block';
          continueBtn.disabled = false;
          continueBtn.innerHTML = '<span class="codicon codicon-play"></span> 이어가기';
        }
      }
      
      // 히스토리 업데이트
      updateHistoryResponse(currentStreamingContent);
      
      // 입력창 클리어
      clearInput();
      
      // 처리 시간 표시
      const duration = Date.now() - requestStartTime;
      showStatus(\`응답 완료 (\${(duration / 1000).toFixed(1)}초)\`);
    }
    
    /**
     * 스트리밍 오류 처리
     */
    function handleStreamingError(error) {
      isStreaming = false;
      hideStreamingIndicator();
      
      const sendBtn = document.getElementById('sendBtn');
      if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.innerHTML = '<span class="codicon codicon-send"></span> 전송';
      }
      
      showError(error.message || '응답 생성 중 오류가 발생했습니다.');
    }
    
    /**
     * 토큰 제한 감지
     */
    function detectTokenLimit(content) {
      if (!content || typeof content !== 'string') {
        return false;
      }
      
      const patterns = [
        /\\.\\.\\.\\s*$/,
        /[^.!?]\\s*$/,
        /\`\`\`[^\`]*$/,
        /def\\s+\\w+\\([^)]*$/,
        /class\\s+\\w+\\([^)]*$/
      ];
      
      const trimmedContent = content.trim();
      return patterns.some(pattern => pattern.test(trimmedContent)) || 
             (content.length > 1500 && (content.match(/\`\`\`/g) || []).length % 2 !== 0);
    }
    
    /**
     * 히스토리 표시 업데이트
     */
    function updateHistoryDisplay(history) {
      const historyContent = document.getElementById('historyContent');
      if (!historyContent) return;
      
      if (!history || history.length === 0) {
        historyContent.innerHTML = \`
          <div class="history-empty">
            <div class="empty-icon">📝</div>
            <div class="empty-title">아직 대화 기록이 없어요</div>
            <div class="empty-description">질문을 시작하면 여기에 기록이 남습니다.</div>
          </div>
        \`;
        return;
      }
      
      historyContent.innerHTML = history.map((item, index) => \`
        <div class="history-item" onclick="loadHistoryItem(\${index})">
          <div class="history-question">\${escapeHtml(item.question)}</div>
          <div class="history-response">\${escapeHtml(item.response.substring(0, 100))}\${item.response.length > 100 ? '...' : ''}</div>
          <div class="history-timestamp">\${new Date(item.timestamp).toLocaleString()}</div>
          <button class="history-delete-btn" onclick="deleteHistoryItemAtIndex(\${index})" title="삭제">×</button>
        </div>
      \`).join('');
    }
    
    /**
     * 히스토리 아이템 로드
     */
    function loadHistoryItem(index) {
      vscode.postMessage({
        command: 'loadHistoryItem',
        index: index
      });
    }
    
    /**
     * 인덱스로 히스토리 아이템 삭제
     */
    function deleteHistoryItemAtIndex(index) {
      event.stopPropagation();
      vscode.postMessage({
        command: 'deleteHistoryItem',
        index: index
      });
    }
    
    /**
     * 키보드 이벤트 설정
     */
    function setupKeyboardEvents() {
      const questionInput = document.getElementById('questionInput');
      if (questionInput && !questionInput.hasAttribute('data-keyboard-setup')) {
        questionInput.setAttribute('data-keyboard-setup', 'true');
        
        questionInput.addEventListener('input', updateCharCount);
        
        questionInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendQuestion();
          } else if (e.key === 'Enter' && e.ctrlKey) {
            e.preventDefault();
            sendQuestion();
          } else if (e.key === 'Escape') {
            clearInput();
          }
        });
      }
    }
    
    // 초기화
    document.addEventListener('DOMContentLoaded', () => {
      setupKeyboardEvents();
      updateCharCount();
    });
    
    // 즉시 실행
    setupKeyboardEvents();
    `;
  }
}
