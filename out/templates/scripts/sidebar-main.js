/**
 * HAPA VSCode Extension - Sidebar Main Script
 * @fileoverview 사이드바 웹뷰의 메인 JavaScript 로직
 * 별도 파일로 분리하여 유지보수성 향상
 * 🆕 강화된 스트리밍 상태 관리 시스템
 */

// VSCode API 접근
const vscode = acquireVsCodeApi();

// ============================================================================
// EventDeduplicator 클래스 정의
// ============================================================================

class EventDeduplicator {
  constructor() {
    this.eventCache = new Map();
    this.sessionEvents = new Map();
    this.maxCacheSize = 1000;
    this.defaultTtl = 5000; // 5초
  }

  shouldProcessEvent(eventType, eventKey, eventData = null) {
    const cacheKey = `${eventType}_${eventKey}`;
    const now = Date.now();

    if (this.eventCache.has(cacheKey)) {
      const cached = this.eventCache.get(cacheKey);

      // TTL 체크
      if (now - cached.timestamp < this.defaultTtl) {
        // 동일한 데이터인 경우 중복으로 처리
        if (cached.data === eventData) {
          return false;
        }
      }
    }

    // 캐시 크기 관리
    if (this.eventCache.size >= this.maxCacheSize) {
      const oldestKey = this.eventCache.keys().next().value;
      this.eventCache.delete(oldestKey);
    }

    // 새 이벤트 캐시
    this.eventCache.set(cacheKey, {
      timestamp: now,
      data: eventData,
    });

    return true;
  }

  clearSession(sessionId) {
    if (sessionId) {
      this.sessionEvents.delete(sessionId);
    }
  }

  reset() {
    this.eventCache.clear();
    this.sessionEvents.clear();
  }
}

// ============================================================================
// ChunkProcessingQueue 클래스 정의
// ============================================================================

class ChunkProcessingQueue {
  constructor() {
    this.chunks = [];
    this.isProcessing = false;
    this.maxQueueSize = 200;
  }

  enqueue(chunk) {
    if (this.chunks.length >= this.maxQueueSize) {
      this.chunks.shift(); // 오래된 청크 제거
    }
    this.chunks.push(chunk);
  }

  async processAll() {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    while (this.chunks.length > 0) {
      const chunk = this.chunks.shift();
      await this.processChunk(chunk);
    }
    this.isProcessing = false;
  }

  async processChunk(chunk) {
    // 청크 처리 로직은 기존 함수에서 처리
    if (typeof messageHandler !== "undefined" && messageHandler.handleStreamingChunk) {
      await messageHandler.handleStreamingChunk(chunk);
    }
  }

  clear() {
    this.chunks = [];
    this.isProcessing = false;
  }
}

// ============================================================================
// 전역 상태 변수들 및 스트리밍 상태 관리
// ============================================================================

// 스트리밍 상태 열거형
const StreamingState = {
  IDLE: "idle",
  STARTING: "starting",
  ACTIVE: "active",
  FINISHING: "finishing",
  COMPLETED: "completed",
  ERROR: "error",
};

// 허용된 상태 전환 규칙
const ALLOWED_STATE_TRANSITIONS = {
  [StreamingState.IDLE]: [StreamingState.STARTING, StreamingState.ERROR],
  [StreamingState.STARTING]: [StreamingState.ACTIVE, StreamingState.ERROR, StreamingState.IDLE],
  [StreamingState.ACTIVE]: [StreamingState.FINISHING, StreamingState.ERROR, StreamingState.IDLE],
  [StreamingState.FINISHING]: [StreamingState.COMPLETED, StreamingState.ERROR, StreamingState.IDLE],
  [StreamingState.COMPLETED]: [StreamingState.IDLE],
  [StreamingState.ERROR]: [StreamingState.IDLE],
};

// 성능 제한 상수 (최적화된 설정)
const PERFORMANCE_LIMITS = {
  maxChunks: 50, // 200 → 50 (75% 감소)
  hardLimit: 100, // 500 → 100 (80% 감소)
  warningThreshold: 30, // 100 → 30 (70% 감소)
  emergencyThreshold: 80, // 800 → 80 (90% 감소)
  maxBytes: 512 * 1024, // 1MB → 512KB (50% 감소)
  maxProcessingTime: 30000, // 백엔드 최적화 완료까지 충분한 시간 (30초)
  minChunkSize: 10, // 최소 청크 크기 (너무 작은 청크 병합)
  batchSize: 5, // 배치 처리 크기 증대
};

// 청크 성능 통계 객체
const chunkPerformanceStats = {
  totalProcessed: 0,
  totalBytes: 0,
  smallChunks: 0,
  largeChunks: 0,
  lastProcessTime: 0,
  batchCount: 0,

  reset() {
    this.totalProcessed = 0;
    this.totalBytes = 0;
    this.smallChunks = 0;
    this.largeChunks = 0;
    this.lastProcessTime = 0;
    this.batchCount = 0;
  },

  shouldTerminate() {
    return this.totalProcessed >= PERFORMANCE_LIMITS.hardLimit;
  },
};

// 전역 인스턴스들
const eventDeduplicator = new EventDeduplicator();
const chunkQueue = new ChunkProcessingQueue();

// 스트리밍 관련 전역 변수들
let streamingTimeout = null;
let batchProcessingTimer = null;
let healthCheckInterval = null;
let chunkBatchBuffer = [];
let streamingBuffer = "";
let currentStreamingContent = "";
let streamingAbortController = null;

// 강화된 스트리밍 상태 관리 객체
const streamingManager = {
  currentState: StreamingState.IDLE,
  sessionId: null,
  startTime: null,
  lastStateChange: null,
  terminationReasons: new Set(),

  // 엄격한 상태 전환 메서드
  setState(newState, metadata = {}) {
    const previousState = this.currentState;
    const now = Date.now();

    // 상태 전환 유효성 검증
    if (!this.isValidTransition(previousState, newState)) {
      console.error(`❌ 잘못된 상태 전환: ${previousState} → ${newState}`);
      console.error("허용된 전환:", ALLOWED_STATE_TRANSITIONS[previousState]);
      return false;
    }

    // 이벤트 중복 방지 검증
    const eventKey = `state_transition_${this.sessionId || "no_session"}`;
    if (
      !eventDeduplicator.shouldProcessEvent(
        "STATE_CHANGE",
        eventKey,
        `${previousState}_${newState}`
      )
    ) {
      return false;
    }

    // 상태 전환 실행
    this.currentState = newState;
    this.lastStateChange = now;

    console.log(`🔄 스트리밍 상태 전환: ${previousState} → ${newState}`, metadata);

    // 상태별 후처리
    this.handleStateTransition(previousState, newState, metadata);

    // 상태 변경 시 자동으로 전체 동기화 실행
    if (typeof syncAllStates === "function") {
      syncAllStates();
    }

    return true;
  },

  // 상태 전환 유효성 검증
  isValidTransition(fromState, toState) {
    const allowedTransitions = ALLOWED_STATE_TRANSITIONS[fromState];
    return allowedTransitions && allowedTransitions.includes(toState);
  },

  // 상태 전환 후처리
  handleStateTransition(previousState, newState, metadata) {
    switch (newState) {
      case StreamingState.STARTING:
        this.sessionId = metadata.sessionId || Date.now().toString();
        this.startTime = Date.now();
        this.terminationReasons.clear();
        chunkPerformanceStats.reset();
        eventDeduplicator.clearSession(this.sessionId);
        break;

      case StreamingState.ACTIVE:
        if (previousState === StreamingState.IDLE) {
          console.warn(`⚠️ 예상치 못한 전환: ${previousState} → ${newState} (자동 복구)`);
        }
        break;

      case StreamingState.FINISHING:
        this.addTerminationReason(metadata.reason || "normal_completion");
        break;

      case StreamingState.COMPLETED:
      case StreamingState.ERROR:
        this.cleanup();
        break;

      case StreamingState.IDLE:
        // 완전한 초기화
        this.reset();
        break;
    }
  },

  // 종료 이유 추가
  addTerminationReason(reason) {
    this.terminationReasons.add(reason);
    console.log(`📝 종료 이유 추가: ${reason}`);
  },

  // 상태 확인 메서드들
  isActive() {
    return [StreamingState.STARTING, StreamingState.ACTIVE, StreamingState.FINISHING].includes(
      this.currentState
    );
  },

  canReceiveChunks() {
    return [StreamingState.STARTING, StreamingState.ACTIVE].includes(this.currentState);
  },

  shouldIgnoreChunks() {
    return [StreamingState.COMPLETED, StreamingState.ERROR, StreamingState.IDLE].includes(
      this.currentState
    );
  },

  // 정리 메서드
  cleanup() {
    this.sessionId = null;
    this.startTime = null;
  },

  // 디버깅용 정보 반환
  getInfo() {
    return {
      state: this.currentState,
      sessionId: this.sessionId,
      startTime: this.startTime,
      isActive: this.isActive(),
      canReceiveChunks: this.canReceiveChunks(),
    };
  },

  showStreamingIndicator() {
    const statusElement = document.getElementById("streaming-status");
    if (statusElement) {
      statusElement.style.display = "block";
      statusElement.textContent = "스트리밍 중...";
    }

    const button = document.getElementById("generate-btn");
    if (button) {
      button.disabled = true;
      button.textContent = "생성 중...";
    }
  },

  hideStreamingIndicator() {
    const statusElement = document.getElementById("streaming-status");
    if (statusElement) {
      statusElement.style.display = "none";
    }

    const button = document.getElementById("generate-btn");
    if (button) {
      button.disabled = false;
      button.textContent = "생성";
    }
  },

  clearErrorMessages() {
    console.log("🧹 에러 메시지 정리 시작");

    try {
      const responseElement = document.getElementById("response-content");
      if (responseElement) {
        // 에러 메시지 DOM 확인
        const errorMessages = responseElement.querySelectorAll(".error-message");
        if (errorMessages.length > 0) {
          console.log(`🧹 ${errorMessages.length}개 에러 메시지 발견 - 정리 중`);
          errorMessages.forEach(errorMsg => errorMsg.remove());
        }

        // 에러 상태 텍스트가 포함된 경우 초기화
        if (
          responseElement.innerHTML.includes("error-message") ||
          responseElement.innerHTML.includes("오류 발생") ||
          responseElement.innerHTML.includes("다수의 오류")
        ) {
          console.log("🧹 에러 상태 HTML 초기화");
          responseElement.innerHTML =
            '<div class="streaming-placeholder">스트리밍 준비 중...</div>';
        }
      }

      // 별도 에러 표시 요소들도 정리
      const errorElement = document.getElementById("errorMessage");
      if (errorElement) {
        errorElement.style.display = "none";
        errorElement.innerHTML = "";
      }

      console.log("✅ 에러 메시지 정리 완료");
    } catch (error) {
      console.error("❌ 에러 메시지 정리 실패:", error);
    }
  },

  // 완전한 초기화 메서드 (누락된 메서드 추가)
  reset() {
    this.currentState = StreamingState.IDLE;
    this.sessionId = null;
    this.startTime = null;
    this.lastStateChange = null;
    this.terminationReasons.clear();

    // 청크 큐와 성능 통계 초기화
    if (typeof chunkQueue !== "undefined") {
      chunkQueue.clear();
    }
    if (typeof chunkPerformanceStats !== "undefined") {
      chunkPerformanceStats.reset();
    }
    if (typeof eventDeduplicator !== "undefined") {
      eventDeduplicator.reset();
    }

    console.log("🔄 스트리밍 매니저 완전 초기화 완료");
  },

  // 안전한 청크 처리 메서드 (원자적 처리)
  async processChunkSafely(chunk) {
    try {
      // 상태 검증
      if (!this.canReceiveChunks()) {
        console.warn(`⚠️ 청크 처리 불가 상태: ${this.currentState}`);
        return false;
      }

      // 성능 한계 검증
      if (chunkPerformanceStats && chunkPerformanceStats.shouldTerminate()) {
        console.warn("🛑 성능 한계로 인한 청크 처리 중단");
        this.setState(StreamingState.FINISHING, {
          reason: "performance_limit",
        });
        return false;
      }

      // 청크 내용 추출 및 처리
      const content = this.extractChunkContent(chunk);
      if (content) {
        await this.updateStreamingDisplay(content);

        // 성능 통계 업데이트
        if (chunkPerformanceStats) {
          chunkPerformanceStats.totalProcessed++;
          chunkPerformanceStats.totalBytes += content.length;

          if (content.length < PERFORMANCE_LIMITS.minChunkSize) {
            chunkPerformanceStats.smallChunks++;
          } else {
            chunkPerformanceStats.largeChunks++;
          }
        }

        return true;
      }

      return false;
    } catch (error) {
      console.error("❌ 청크 처리 중 오류:", error);
      this.setState(StreamingState.ERROR, {
        reason: "chunk_processing_error",
        error,
      });
      return false;
    }
  },

  // 청크 내용 추출 메서드
  extractChunkContent(chunk) {
    let content = "";

    if (chunk?.content !== undefined && chunk.content !== null) {
      content = String(chunk.content);
    } else if (chunk?.text !== undefined && chunk.text !== null) {
      content = String(chunk.text);
    } else if (typeof chunk === "string") {
      content = chunk;
    }

    return content.trim();
  },

  // 강화된 종료 신호 감지
  shouldFinishStreaming(chunk) {
    // AI 모델 종료 토큰 감지
    const finishTokens = ["<|im_end|>", "[DONE]", "<|endoftext|>", "###END###"];
    const content = this.extractChunkContent(chunk);

    // 명시적 종료 토큰 체크
    for (const token of finishTokens) {
      if (content.includes(token)) {
        console.log(`🏁 종료 토큰 감지: ${token}`);
        return true;
      }
    }

    // 청크의 is_complete 플래그 체크
    if (chunk?.is_complete === true || chunk?.done === true) {
      console.log("🏁 완료 플래그 감지");
      return true;
    }

    return false;
  },

  // 강화된 스트리밍 표시 업데이트
  async updateStreamingDisplay(content) {
    if (!content || typeof content !== "string") {
      return;
    }

    // ✅ 수정: 통합된 버퍼 관리 (중복 제거)
    streamingBuffer += content;
    currentStreamingContent = streamingBuffer; // 동기화

    // UI 업데이트는 messageHandler에 위임
    if (typeof messageHandler !== "undefined" && messageHandler.updateStreamingDisplay) {
      await messageHandler.updateStreamingDisplay(streamingBuffer);
    } else {
      // 폴백: 직접 DOM 업데이트
      const responseElement = document.getElementById("response-content");
      if (responseElement) {
        responseElement.innerHTML = `<pre><code>${this.escapeHtml(streamingBuffer)}</code></pre>`;
      }
    }
  },

  // HTML 이스케이프 메서드
  escapeHtml(text) {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return text.replace(/[&<>"']/g, function (m) {
      return map[m];
    });
  },
};

// 통합된 상태 관리 객체 (기존 변수들 통합)
const globalState = {
  // 스트리밍 관련
  streamingId: null,
  streamingBuffer: "",
  streamingContent: "",
  streamingSequence: 0,
  requestStartTime: 0,

  // 메시지 처리
  messageBuffer: [],
  lastMessageTime: 0,
  processingMessage: false,

  // 재시도 로직
  retryCount: 0,
  maxRetries: 3,

  // 타이머 관리
  streamingTimeout: null,
  healthCheckInterval: null,

  // 모델 선택
  selectedModel: "autocomplete",

  // 상태 동기화 메서드
  syncWithStreamingManager() {
    this.streamingId = streamingManager.sessionId;
    // streamingManager의 상태를 globalState에 반영
    if (streamingManager.isActive()) {
      this.requestStartTime = streamingManager.startTime || Date.now();
    }
  },

  // 상태 초기화
  reset() {
    this.streamingId = null;
    this.streamingBuffer = "";
    this.streamingContent = "";
    this.streamingSequence = 0;
    this.requestStartTime = 0;
    this.retryCount = 0;

    if (this.streamingTimeout) {
      clearTimeout(this.streamingTimeout);
      this.streamingTimeout = null;
    }
  },

  // 하위 호환성 getter/setter
  get isStreamingActive() {
    return streamingManager.isActive();
  },

  get currentStreamingId() {
    return this.streamingId;
  },

  set currentStreamingId(value) {
    this.streamingId = value;
  },
};

// 전역 변수 호환성 매핑 (기존 코드와의 호환성 보장)
Object.defineProperty(window, "selectedModel", {
  get: () => globalState.selectedModel,
  set: value => {
    globalState.selectedModel = value;
  },
});

// 레거시 변수들을 globalState로 리다이렉트
let isStreamingActive, currentStreamingId, isStreaming;
Object.defineProperty(window, "isStreamingActive", {
  get: () => globalState.isStreamingActive,
});

Object.defineProperty(window, "currentStreamingId", {
  get: () => globalState.currentStreamingId,
  set: value => {
    globalState.currentStreamingId = value;
  },
});

// ============================================================================
// 통합된 상태 동기화 시스템
// ============================================================================

/**
 * 레거시 상태 동기화 함수 (핵심 수정 1)
 * streamingManager와 전역 변수들 간의 동기화
 */
function syncLegacyState() {
  try {
    // streamingManager 상태를 전역 변수에 반영
    globalState.syncWithStreamingManager();

    // 전역 스트리밍 변수들을 globalState와 동기화
    streamingBuffer = globalState.streamingBuffer || "";
    currentStreamingContent = streamingBuffer; // ✅ 수정: streamingBuffer와 동기화
    streamingSequence = globalState.streamingSequence || 0;

    // 타이머 동기화
    if (globalState.streamingTimeout && !streamingTimeout) {
      streamingTimeout = globalState.streamingTimeout;
    }
    if (globalState.healthCheckInterval && !healthCheckInterval) {
      healthCheckInterval = globalState.healthCheckInterval;
    }

    console.log("🔄 레거시 상태 동기화 완료:", {
      managerState: streamingManager.currentState,
      isActive: streamingManager.isActive(),
      bufferLength: streamingBuffer.length,
      hasTimeout: !!streamingTimeout,
    });
  } catch (error) {
    console.error("❌ 레거시 상태 동기화 실패:", error);
  }
}

function syncAllStates() {
  /**
   * streamingManager와 globalState 동기화
   * 단일 진실 원천(Single Source of Truth) 유지
   */
  globalState.syncWithStreamingManager();

  // 상태 변경 이벤트 발생 시 UI 업데이트
  updateUIBasedOnState();
}

function updateUIBasedOnState() {
  /**
   * 현재 상태에 따른 UI 업데이트
   */
  const isActive = streamingManager.isActive();
  const submitButton = document.getElementById("generate-btn"); // 수정: ID 일치
  const stopButton = document.getElementById("stop-button");

  if (submitButton) {
    submitButton.disabled = isActive;
    submitButton.textContent = isActive ? "생성 중..." : "전송";
  }

  if (stopButton) {
    stopButton.style.display = isActive ? "block" : "none";
  }
}

// ============================================================================
// 핵심 UI 함수들
// ============================================================================

/**
 * 모델 탭 선택 함수
 */
function selectModelTab(modelType) {
  console.log("🎯 모델 탭 선택: " + modelType);

  try {
    // 1. 이전 선택된 탭 비활성화
    const allModelTabs = document.querySelectorAll(".model-tab");
    allModelTabs.forEach(tab => {
      tab.classList.remove("active");
    });

    // 2. 새로 선택된 탭 활성화
    const selectedTab = document.querySelector('[data-model="' + modelType + '"]');
    if (selectedTab) {
      selectedTab.classList.add("active");
      console.log("✅ 모델 탭 활성화 성공: " + modelType);
    } else {
      console.error("❌ 모델 탭을 찾을 수 없음: " + modelType);
      return;
    }

    // 3. 전역 상태 업데이트
    window.selectedModel = modelType;

    // 4. 플레이스홀더 업데이트
    updatePlaceholder(modelType);

    // 5. 상태 저장
    localStorage.setItem("selectedModel", modelType);

    // 6. SidebarProvider에 모델 변경 알림
    vscode.postMessage({
      command: "modelSelected",
      modelType: modelType,
    });

    console.log("✅ 모델 선택 완료: " + modelType);
  } catch (error) {
    console.error("❌ 모델 탭 선택 중 오류:", error);
    window.selectedModel = "autocomplete";
  }
}

/**
 * switchTab 함수 - 응답/기록 탭 전환용
 */
function switchTab(tabType) {
  console.log("🔄 탭 전환:", tabType);

  try {
    // 모든 탭 버튼 비활성화
    const allTabBtns = document.querySelectorAll(".tab-btn");
    allTabBtns.forEach(btn => btn.classList.remove("active"));

    // 모든 탭 컨텐츠 숨기기
    const responseContent = document.querySelector(".response-content");
    const historyContent = document.querySelector(".history-content");

    if (tabType === "response") {
      // 응답 탭 활성화
      if (responseContent) {
        responseContent.style.display = "block";
      }
      if (historyContent) {
        historyContent.style.display = "none";
      }

      const responseTabBtn = document.querySelector('[data-tab="response"]');
      if (responseTabBtn) {
        responseTabBtn.classList.add("active");
      }

      console.log("✅ 응답 탭 활성화");
    } else if (tabType === "history") {
      // 기록 탭 활성화
      if (responseContent) {
        responseContent.style.display = "none";
      }
      if (historyContent) {
        historyContent.style.display = "block";
      }

      const historyTabBtn = document.querySelector('[data-tab="history"]');
      if (historyTabBtn) {
        historyTabBtn.classList.add("active");
      }

      console.log("✅ 기록 탭 활성화");

      // **🆕 히스토리 탭 활성화 시 최신 데이터 요청**
      if (window.isExpandedView) {
        console.log("🔄 확장 뷰 히스토리 탭 - 최신 MongoDB 데이터 요청");
        requestLatestHistory();
      }
    }
  } catch (error) {
    console.error("❌ 탭 전환 오류:", error);
  }
}

/**
 * 플레이스홀더 업데이트 함수
 */
function updatePlaceholder(modelType) {
  const textarea = document.getElementById("questionInput");
  if (!textarea) {
    return;
  }

  const placeholders = {
    autocomplete: "자동완성 코드 생성에 대해 질문하거나 요청사항을 입력하세요...",
    prompt: "프롬프트 기반 코드 생성에 대해 질문하거나 요청사항을 입력하세요...",
    comment: "코멘트 기반 코드 생성에 대해 질문하거나 요청사항을 입력하세요...",
    error_fix: "에러 수정 코드 생성에 대해 질문하거나 요청사항을 입력하세요...",
  };

  textarea.placeholder = placeholders[modelType] || placeholders["autocomplete"];
  console.log("📝 플레이스홀더 업데이트: " + modelType);
}

// ============================================================================
// 메시지 처리 큐 시스템
// ============================================================================

const messageQueue = {
  queue: [],
  processing: false,

  add(message) {
    this.queue.push({
      ...message,
      timestamp: Date.now(),
      id: Math.random().toString(36).substr(2, 9),
    });
    this.process();
  },

  async process() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const message = this.queue.shift();
      try {
        await this.handleMessage(message);
      } catch (error) {
        console.error("❌ 메시지 처리 오류:", error);
        this.handleMessageError(message, error);
      }
    }

    this.processing = false;
  },

  async handleMessage(message) {
    const { command } = message;

    // 디버깅을 위한 메시지 구조 로그 (환경별 조건 적용)
    if (command === "streamingChunk" && window.DEBUG_MODE) {
      console.log("🔍 스트리밍 청크 메시지 구조:", {
        hasCommand: !!message.command,
        hasChunk: !!message.chunk,
        messageKeys: Object.keys(message),
        chunkKeys: message.chunk ? Object.keys(message.chunk) : null,
        streamingState: streamingManager.getInfo(),
      });
    }

    // 새로운 메시지 로깅
    if (command === "addAIResponse" || command === "ensureResponseVisible") {
      console.log(`🔍 [${command}] 메시지 구조:`, {
        hasCommand: !!message.command,
        hasResponse: !!message.response,
        hasData: !!message.data,
        messageKeys: Object.keys(message),
        responseKeys: message.response ? Object.keys(message.response) : null,
        dataKeys: message.data ? Object.keys(message.data) : null,
      });
    }

    switch (command) {
      case "addAIResponse":
        await this.handleAIResponse(message);
        break;
      case "ensureResponseVisible":
        await this.ensureResponseVisible(message);
        break;
      case "streamingChunk":
        // 청크 데이터 구조 처리
        let chunkData = null;

        if (message.chunk) {
          chunkData = message.chunk;
        } else if (message.type && message.content !== undefined) {
          chunkData = {
            type: message.type,
            content: message.content,
            sequence: message.sequence,
            timestamp: message.timestamp,
          };
        } else {
          console.error("❌ 인식할 수 없는 스트리밍 청크 구조:", message);
          this.recoverStreamingUI(new Error("스트리밍 메시지 구조 오류"));
          return;
        }

        await this.handleStreamingChunk(chunkData);
        break;
      case "streamingComplete":
        await this.handleStreamingComplete(message);
        break;
      case "streamingError":
        await this.handleStreamingError(message);
        break;
      case "streamingStarted":
        await this.handleStreamingStarted(message);
        break;
      case "showLoading":
        await this.handleShowLoading(message);
        break;
      case "showError":
        await this.handleShowError(message);
        break;
      case "syncHistory":
        // 히스토리 동기화 처리
        if (message.history) {
          console.log("📚 히스토리 동기화:", JSON.parse(message.history).length, "개 항목");
          await this.handleSyncHistory(message);
        }
        break;
      case "initializeEmptyStates":
        await this.handleInitializeEmptyStates(message);
        break;
      case "restoreResponse":
        await this.handleRestoreResponse(message);
        break;
      case "checkDOMReady":
        await this.handleCheckDOMReady(message);
        break;
      case "syncUIState":
        await this.handleSyncUIState(message);
        break;
      case "domReadyStatus":
        // DOM 준비 상태 응답은 무시 (확장 뷰에서만 처리)
        break;
      default:
        console.warn(`⚠️ 처리되지 않은 명령: ${command}`);
        break;
    }
  },

  handleMessageError(message, error) {
    console.error("❌ 메시지 처리 실패:", { message, error });

    // 스트리밍 관련 오류일 경우 UI 복구
    if (message.command && message.command.includes("streaming")) {
      this.recoverStreamingUI(error);
    }
  },

  async handleStreamingStarted(message) {
    console.log("🎬 스트리밍 시작 처리:", message);

    // 에러 메시지 정리 (새로운 스트리밍 시작 시)
    streamingManager.clearErrorMessages();

    // 상태를 STARTING으로 전환
    streamingManager.setState(StreamingState.STARTING, {
      sessionId: Date.now().toString(),
    });
    syncLegacyState();

    // 성능 통계 초기화
    this.resetPerformanceStats();

    try {
      // UI 상태 초기화
      this.resetStreamingUI();

      // 스트리밍 표시기 활성화
      streamingManager.showStreamingIndicator("HAPA가 코드를 생성하고 있습니다...");

      // 응답 탭 강제 활성화
      this.activateResponseTab();

      // 응답 컨테이너 준비 (안전한 접근)
      try {
        const responseElement = await getResponseElementSafely();
        if (responseElement) {
          responseElement.innerHTML = `
            <div class="streaming-placeholder" style="
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 40px 20px;
              text-align: center;
              color: #d4d4d4;
              background: #1e1e1e;
              border: 2px dashed #4fc3f7;
              border-radius: 8px;
              min-height: 150px;
            ">
              <div class="streaming-animation" style="margin-bottom: 16px;">
                <div class="dot dot1" style="
                  display: inline-block;
                  width: 8px;
                  height: 8px;
                  background: #4fc3f7;
                  border-radius: 50%;
                  animation: bounce 1.4s ease-in-out infinite both;
                  margin: 0 2px;
                "></div>
                <div class="dot dot2" style="
                  display: inline-block;
                  width: 8px;
                  height: 8px;
                  background: #4fc3f7;
                  border-radius: 50%;
                  animation: bounce 1.4s ease-in-out 0.16s infinite both;
                  margin: 0 2px;
                "></div>
                <div class="dot dot3" style="
                  display: inline-block;
                  width: 8px;
                  height: 8px;
                  background: #4fc3f7;
                  border-radius: 50%;
                  animation: bounce 1.4s ease-in-out 0.32s infinite both;
                  margin: 0 2px;
                "></div>
              </div>
              <p style="margin: 0; font-size: 14px; color: #4fc3f7;">🤖 AI가 응답을 생성하고 있습니다...</p>
              <p style="margin: 8px 0 0 0; font-size: 12px; color: #888; font-style: italic;">
                질문: ${message.data?.question || "코드 생성 요청"}
              </p>
            </div>
            <style>
              @keyframes bounce {
                0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
                40% { transform: scale(1); opacity: 1; }
              }
            </style>
          `;
          responseElement.style.display = "block";
          responseElement.style.visibility = "visible";
          console.log("✅ 스트리밍 시작 UI 설정 완료");
        }
      } catch (elementError) {
        console.error("❌ 응답 요소 준비 실패:", elementError);
        // UI 오류 시에도 계속 진행
      }

      // 강제 UI 업데이트 추가
      forceUpdateUI();

      // 스트리밍 타임아웃 설정 (10초로 단축)
      streamingTimeout = setTimeout(() => {
        console.warn("⏱️ 스트리밍 타임아웃 발생 (성능 최적화)");
        this.handleStreamingTimeout();
      }, PERFORMANCE_LIMITS.maxProcessingTime); // 10초

      console.log(
        `✅ 스트리밍 타임아웃 설정 완료 (${PERFORMANCE_LIMITS.maxProcessingTime / 1000}초)`
      );
    } catch (error) {
      console.error("❌ 스트리밍 시작 처리 오류:", error);
      streamingManager.setState(StreamingState.ERROR, { error: error.message });
      syncLegacyState();
      this.recoverStreamingUI(error);
    }
  },

  async handleStreamingChunk(chunk) {
    const startTime = Date.now();

    // 🚫 중복 세션 방지 - 최우선 체크
    if (
      streamingManager.currentState === StreamingState.IDLE ||
      streamingManager.currentState === StreamingState.COMPLETED
    ) {
      console.warn(
        `⚠️ 지연 청크 무시: 현재 상태 ${streamingManager.currentState} - 중복 세션 방지`
      );
      return; // 즉시 반환하여 처리 중단
    }

    // 성능 모니터링 - 절대 한계선 확인 (즉시 중단)
    if (chunkPerformanceStats.totalProcessed >= PERFORMANCE_LIMITS.hardLimit) {
      console.error(`🛑 절대 한계선 도달: ${chunkPerformanceStats.totalProcessed}개 - 강제 중단`);

      // VSCode Extension에 중단 메시지 전송
      try {
        vscode.postMessage({
          command: "forceStopStreaming",
          reason: "hardLimit",
          chunkCount: chunkPerformanceStats.totalProcessed,
        });
      } catch (error) {
        console.error("❌ 중단 메시지 전송 실패:", error);
      }

      messageQueue.handleStreamingError({
        error: `성능 한계로 인한 강제 중단 (${chunkPerformanceStats.totalProcessed}개 청크)`,
      });
      return;
    }

    // 성능 모니터링 - 청크 제한 확인 (성능 최적화된 조기 완료)
    if (chunkPerformanceStats.totalProcessed >= PERFORMANCE_LIMITS.maxChunks) {
      console.warn(`⚠️ 간단한 요청에 과도한 응답 감지 - 조기 종료`);

      // 스트리밍을 정상 완료로 처리
      streamingManager.setState(StreamingState.FINISHING, {
        reason: "performance_optimization",
        chunkCount: chunkPerformanceStats.totalProcessed,
      });

      // VSCode Extension에 완료 메시지 전송
      try {
        vscode.postMessage({
          command: "streamingComplete",
          reason: "performance_optimization",
          chunkCount: chunkPerformanceStats.totalProcessed,
          finalContent: streamingBuffer,
          success: true,
        });
      } catch (error) {
        console.error("❌ 완료 메시지 전송 실패:", error);
      }

      messageQueue.handleStreamingComplete({
        success: true,
        finalContent: streamingBuffer,
        metadata: {
          optimizedCompletion: true,
          chunkLimit: PERFORMANCE_LIMITS.maxChunks,
          actualChunks: chunkPerformanceStats.totalProcessed,
        },
      });

      // 즉시 상태를 COMPLETED로 변경하여 중복 세션 완전 차단
      streamingManager.setState(StreamingState.COMPLETED);
      return;
    }

    // 경고 임계값 확인
    if (chunkPerformanceStats.totalProcessed >= PERFORMANCE_LIMITS.warningThreshold) {
      console.warn(`⚠️ 청크 수 경고: ${chunkPerformanceStats.totalProcessed}개`);
    }

    console.log("📦 청크 처리 시작:", {
      chunkType: typeof chunk,
      chunkKeys: Object.keys(chunk || {}),
      hasChunkProperty: !!chunk?.chunk,
      directContent: chunk?.content,
      directText: chunk?.text,
      streamingState: streamingManager.getInfo(),
    });

    // 상태 확인 및 ACTIVE 전환
    if (streamingManager.currentState === StreamingState.STARTING) {
      streamingManager.setState(StreamingState.ACTIVE);
      syncLegacyState();
      // 스트리밍이 정상적으로 시작되었으므로 에러 메시지 정리
      streamingManager.clearErrorMessages();
    } else if (
      streamingManager.currentState === StreamingState.IDLE ||
      streamingManager.currentState === StreamingState.COMPLETED
    ) {
      console.warn(
        `⚠️ ${streamingManager.currentState} 상태에서 청크 수신됨 - 무시하여 중복 세션 방지`
      );
      console.log("🚫 이미 완료된 스트리밍의 지연 청크로 판단되어 무시됨");
      return; // 중복 세션 방지를 위해 청크 무시
    }

    try {
      // 청크 데이터 정규화
      let chunkData = chunk;
      if (chunk?.chunk) {
        chunkData = chunk.chunk;
        console.log("✅ chunk.chunk 구조에서 데이터 추출");
      }

      console.log("🔍 청크 데이터 상세:", {
        hasContent: !!chunkData?.content,
        hasText: !!chunkData?.text,
        contentType: typeof chunkData?.content,
        textType: typeof chunkData?.text,
        chunkType: chunkData?.type,
        isComplete: chunkData?.is_complete,
      });

      // 🎯 새로운 구조화된 청크 타입 처리
      const chunkType = chunkData?.type || "token";
      console.log(`🔍 청크 타입 감지: ${chunkType}`);

      // 구조화된 스트리밍 시작 시 UI 초기화
      if (chunkType === "explanation" || chunkType === "code") {
        if (!document.getElementById("structured-response")) {
          console.log("🎨 구조화된 UI 초기화 시작");
          realtimeDOMUpdater.createStructuredUI();
          structuredStreamingManager.reset();
        }
      }

      // 콘텐츠 추출 (다양한 필드 시도)
      let content = "";
      if (chunkData?.content !== undefined && chunkData.content !== null) {
        content = String(chunkData.content);
        console.log(`✅ content 필드 사용 (${chunkType}):`, content.substring(0, 50) + "...");
      } else if (chunkData?.text !== undefined && chunkData.text !== null) {
        content = String(chunkData.text);
        console.log(`✅ text 필드 사용 (${chunkType}):`, content.substring(0, 50) + "...");
      } else {
        console.warn("⚠️ 콘텐츠가 없는 청크:", chunkData);
        return;
      }

      // 청크 타입별 처리
      switch (chunkType) {
        case "explanation":
          structuredStreamingManager.processChunk(
            "explanation",
            content,
            chunkData?.metadata || {}
          );
          realtimeDOMUpdater.updateExplanation(content);
          realtimeDOMUpdater.updateMetadata(structuredStreamingManager.state.metadata);
          return; // 기존 로직 건너뛰기

        case "code":
          structuredStreamingManager.processChunk("code", content, chunkData?.metadata || {});
          realtimeDOMUpdater.updateCode(content, chunkData?.metadata || {});
          realtimeDOMUpdater.updateMetadata(structuredStreamingManager.state.metadata);
          realtimeDOMUpdater.showActionButtons();
          return; // 기존 로직 건너뛰기

        case "done":
          console.log("🏁 구조화된 스트리밍 완료");
          structuredStreamingManager.processChunk("done", "", chunkData?.metadata || {});
          realtimeDOMUpdater.updateMetadata(structuredStreamingManager.state.metadata);

          // 최종 상태 업데이트
          streamingManager.setState(StreamingState.COMPLETED);
          return; // 기존 로직 건너뛰기

        case "token":
          // 실시간 프리뷰용 토큰 - 기존 로직 계속 실행
          console.log(`📦 실시간 토큰: ${content.substring(0, 30)}...`);
          break;

        default:
          // 기존 방식 처리
          console.log(`📦 기존 방식 청크: ${content.substring(0, 30)}...`);
          break;
      }

      // **메타데이터 및 태그 정리 강화**
      const cleanedContent = messageQueue.cleanChunkContent(content);

      if (!cleanedContent || cleanedContent.trim().length === 0) {
        console.log("ℹ️ 정리 후 빈 콘텐츠 무시:", content.substring(0, 30));
        return;
      }

      // **🆕 혼합 콘텐츠 감지 및 즉시 차단**
      const mixedContentPatterns = [
        /Thereis\s+a\s+settings\s+menu.*from\s+__future__/i,
        /settings\s+menu.*import\s+sys/i,
        /APT_STRING.*from\s+pandas/i,
        /boolean.*string.*path.*import/i,
        /Global.*reduce_button.*from/i,
        /Gen\s+>from\s+__future__/i,
      ];

      for (const pattern of mixedContentPatterns) {
        if (pattern.test(streamingBuffer + cleanedContent)) {
          console.warn("🚫 혼합 콘텐츠 감지 - 스트리밍 중단");
          messageQueue.handleStreamingComplete({
            success: false,
            finalContent: "죄송합니다. 요청을 다시 입력해주세요.",
            reason: "mixed_content_detected",
          });
          return;
        }
      }

      // **end 태그 처리 - 태그 이전까지만 출력**
      const processedContent = messageQueue.handleEndTags(cleanedContent);
      if (processedContent === null) {
        console.log("🔚 End 태그 감지로 스트리밍 종료");
        messageQueue.handleStreamingComplete({
          success: true,
          finalContent: streamingBuffer,
          reason: "end_tag_detected",
        });
        return;
      }

      // 처리된 콘텐츠 사용
      content = processedContent;

      // 빈 콘텐츠 체크
      if (!content || content.trim().length === 0) {
        console.log("ℹ️ 빈 콘텐츠 청크 무시");
        return;
      }

      // 성능 통계 업데이트
      chunkPerformanceStats.totalProcessed++;
      chunkPerformanceStats.totalBytes += content.length;
      chunkPerformanceStats.lastProcessTime = Date.now();

      // 청크 크기 분류
      if (content.length < PERFORMANCE_LIMITS.minChunkSize) {
        chunkPerformanceStats.smallChunks++;
        console.log(`📏 작은 청크 감지: ${content.length}자`);
      } else if (content.length > 200) {
        chunkPerformanceStats.largeChunks++;
        console.log(`📏 큰 청크 감지: ${content.length}자`);
      }

      // 긴급 제한 확인
      if (chunkPerformanceStats.totalProcessed >= PERFORMANCE_LIMITS.emergencyThreshold) {
        console.log("🚨 긴급 제한 도달 - 처리 중단");
        messageQueue.handleStreamingError({
          error: `청크 수가 제한(${PERFORMANCE_LIMITS.emergencyThreshold})을 초과했습니다.`,
        });
        messageQueue.cleanupStreaming();
        return;
      }

      // 배치 처리 시도
      if (batchProcessingTimer) {
        clearTimeout(batchProcessingTimer);
        batchProcessingTimer = null;
      }

      // 적응형 배치 조건 확인
      const shouldProcessBatch =
        batchProcessingTimer ||
        Date.now() - chunkPerformanceStats.lastProcessTime > 100 ||
        /\b(def|class|import|return|if|for|while|try|except|finally|#|```)\b/.test(content);

      if (shouldProcessBatch) {
        // 배치 처리 실행
        const batchContent = content;
        const batchSize = content.length;

        console.log("📊 배치 처리 완료:", {
          batchSize: batchSize,
          batchLength: batchContent.length,
          bufferLength: streamingBuffer.length,
          currentLength: streamingBuffer.length + batchContent.length,
          processingReason: "적응형 조건 충족",
        });

        // ✅ 수정: 통합된 버퍼 관리 (중복 제거)
        streamingBuffer += batchContent;
        currentStreamingContent = streamingBuffer; // 동기화

        // 배치 처리 타이머 초기화
        if (batchProcessingTimer) {
          clearTimeout(batchProcessingTimer);
          batchProcessingTimer = null;
        }
      } else {
        // 배치 처리 타이머 설정 (디바운스)
        if (batchProcessingTimer) {
          clearTimeout(batchProcessingTimer);
        }

        // 청크 수에 따른 적응적 타임아웃 (성능 최적화)
        const adaptiveTimeout =
          chunkPerformanceStats.totalProcessed > PERFORMANCE_LIMITS.warningThreshold
            ? 30 // 청크 수가 많으면 더 빠른 병합 (100ms → 30ms)
            : 50; // 일반적인 경우 (100ms → 50ms)

        batchProcessingTimer = setTimeout(() => {
          if (content.length > 0) {
            const batchContent = content;
            const batchSize = content.length;

            console.log("📊 최적화된 배치 처리:", {
              batchSize: batchSize,
              batchLength: batchContent.length,
              timeout: adaptiveTimeout,
              totalChunks: chunkPerformanceStats.totalProcessed,
              reason: "적응적_타임아웃",
            });

            // ✅ 수정: 통합된 버퍼 관리 (중복 제거)
            streamingBuffer += batchContent;
            currentStreamingContent = streamingBuffer; // 동기화

            // 배치 처리 타이머 초기화
            if (batchProcessingTimer) {
              clearTimeout(batchProcessingTimer);
              batchProcessingTimer = null;
            }
          }
        }, adaptiveTimeout);
      }

      // 처리 시간 기록
      const processingTime = Date.now() - startTime;
      chunkPerformanceStats.batchCount++;

      // 최근 100개 처리 시간만 보관
      if (chunkPerformanceStats.batchCount > 100) {
        chunkPerformanceStats.batchCount = 100;
      }

      console.log("✅ 청크 처리 완료");

      // 강제 UI 업데이트 추가
      forceUpdateUI();
    } catch (error) {
      console.error("❌ 스트리밍 청크 처리 오류:", error);
      streamingManager.setState(StreamingState.ERROR, { error: error.message });
      syncLegacyState();
      messageQueue.handleStreamingError({ error: error.message });
    }
  },

  async handleStreamingComplete(message) {
    console.log("🏁 스트리밍 완료 처리", streamingManager.getInfo());

    // 이미 완료된 상태라면 중복 처리 방지
    if (
      streamingManager.currentState === StreamingState.IDLE ||
      streamingManager.currentState === StreamingState.COMPLETED
    ) {
      console.log("⚠️ 이미 완료된 스트리밍 - 중복 처리 방지");
      return;
    }

    // 올바른 상태 전환 순서: starting → active → finishing
    if (streamingManager.currentState === StreamingState.STARTING) {
      streamingManager.setState(StreamingState.ACTIVE);
      syncLegacyState();
    }

    // 상태를 FINISHING으로 전환
    if (streamingManager.currentState === StreamingState.ACTIVE) {
      streamingManager.setState(StreamingState.FINISHING);
    }
    syncLegacyState();

    // 남은 배치 처리 완료
    if (chunkBatchBuffer.length > 0) {
      const remainingContent = chunkBatchBuffer.join("");
      // ✅ 수정: 통합된 버퍼 관리 (중복 제거)
      streamingBuffer += remainingContent;
      currentStreamingContent = streamingBuffer; // 동기화
      chunkBatchBuffer = [];
      console.log("📦 남은 배치 처리:", remainingContent.length, "자");
    }

    // 배치 처리 타이머 정리
    if (batchProcessingTimer) {
      clearTimeout(batchProcessingTimer);
      batchProcessingTimer = null;
    }

    // 성능 통계 출력
    this.logPerformanceStats();

    try {
      // 최종 결과 표시
      if (message.finalContent) {
        this.displayFinalResult(message.finalContent);
      } else if (streamingBuffer) {
        this.displayFinalResult(streamingBuffer);
      } else {
        console.warn("⚠️ 표시할 콘텐츠가 없음");
        this.displayEmptyResult();
      }

      // UI 복구
      this.resetStreamingUI();
      this.restoreButtonState();

      // 상태를 COMPLETED로 전환
      streamingManager.setState(StreamingState.COMPLETED, {
        contentLength: streamingBuffer.length,
        duration: Date.now() - streamingManager.startTime,
      });
      syncLegacyState();

      // 스트리밍 정리
      this.cleanupStreaming();

      console.log("✅ 스트리밍 완료 처리 성공");

      // 강제 UI 업데이트 추가
      forceUpdateUI();
    } catch (error) {
      console.error("❌ 스트리밍 완료 처리 오류:", error);
      streamingManager.setState(StreamingState.ERROR, { error: error.message });
      syncLegacyState();
      this.handleStreamingError({ error: error.message });
    }
  },

  // 성능 통계 로깅
  logPerformanceStats() {
    const avgProcessingTime =
      chunkPerformanceStats.batchCount > 0
        ? chunkPerformanceStats.totalBytes / chunkPerformanceStats.batchCount
        : 0;

    const avgChunkSize =
      chunkPerformanceStats.totalBytes / Math.max(chunkPerformanceStats.totalProcessed, 1);
    const smallChunkRatio =
      (chunkPerformanceStats.smallChunks / Math.max(chunkPerformanceStats.totalProcessed, 1)) * 100;
    const largeChunkRatio =
      (chunkPerformanceStats.largeChunks / Math.max(chunkPerformanceStats.totalProcessed, 1)) * 100;

    console.log("📊 스트리밍 성능 통계:", {
      totalProcessed: chunkPerformanceStats.totalProcessed,
      totalBytes: chunkPerformanceStats.totalBytes,
      avgChunkSize: Math.round(avgChunkSize * 100) / 100,
      avgProcessingTime: Math.round(avgProcessingTime * 100) / 100,
      smallChunks: chunkPerformanceStats.smallChunks,
      largeChunks: chunkPerformanceStats.largeChunks,
      smallChunkRatio: Math.round(smallChunkRatio * 100) / 100,
      largeChunkRatio: Math.round(largeChunkRatio * 100) / 100,
      withinLimits: chunkPerformanceStats.totalProcessed < PERFORMANCE_LIMITS.maxChunks,
    });

    // 성능 경고 출력
    if (chunkPerformanceStats.totalProcessed >= PERFORMANCE_LIMITS.warningThreshold) {
      console.warn("⚠️ 청크 수 경고:", chunkPerformanceStats.totalProcessed);
    }

    if (smallChunkRatio > 30) {
      console.warn("⚠️ 작은 청크 비율 높음:", smallChunkRatio + "%");
    }

    if (avgProcessingTime > 50) {
      console.warn("⚠️ 청크 처리 시간 높음:", avgProcessingTime + "ms");
    }
  },

  /**
   * 청크 콘텐츠 메타데이터 정리 메서드 (업데이트된 스탑 태그 포함)
   */
  cleanChunkContent(content) {
    if (!content || typeof content !== "string") {
      return "";
    }

    let cleaned = content;

    // 1. **새로운 스탑 태그 패턴 정리**
    cleaned = cleaned.replace(/<\|EOT\|>/g, ""); // <|EOT|> 제거
    cleaned = cleaned.replace(/\n# --- Generation Complete ---/g, ""); // 완료 마커 제거
    cleaned = cleaned.replace(/# --- Generation Complete ---/g, ""); // 완료 마커 제거 (줄바꿈 없이)

    // 2. 기존 vLLM 메타데이터 제거
    cleaned = cleaned.replace(/<\/c>/g, ""); // </c> 태그 제거
    cleaned = cleaned.replace(/#---Gen/g, ""); // #---Gen 제거
    cleaned = cleaned.replace(/erationComplete/g, ""); // erationComplete 제거
    cleaned = cleaned.replace(/---/g, ""); // --- 구분자 제거

    // 3. 기타 End 태그 패턴 제거
    cleaned = cleaned.replace(/<\|im_end\|>/g, ""); // <|im_end|> 제거
    cleaned = cleaned.replace(/\[DONE\]/g, ""); // [DONE] 제거
    cleaned = cleaned.replace(/<\|endoftext\|>/g, ""); // <|endoftext|> 제거
    cleaned = cleaned.replace(/###END###/g, ""); // ###END### 제거
    cleaned = cleaned.replace(/<!-- END -->/g, ""); // <!-- END --> 제거
    cleaned = cleaned.replace(/\[END_OF_GENERATION\]/g, ""); // [END_OF_GENERATION] 제거
    cleaned = cleaned.replace(/\n\n# END/g, ""); // \n\n# END 제거

    // 4. 기타 메타데이터 패턴 제거
    cleaned = cleaned.replace(/GenGeneration/g, ""); // 중복 Gen 제거
    cleaned = cleaned.replace(/ComComplete/g, ""); // ComComplete 제거
    cleaned = cleaned.replace(/<\|.*?\|>/g, ""); // <|.*|> 패턴 제거 (단, 유효한 태그 제외)

    // 5. ✅ 수정: 안전한 중복 문자 정리 (기존 복잡한 정규식 제거)
    cleaned = cleaned.replace(/(.)\1{2,}/g, "$1$1"); // 3개 이상 반복 문자 → 2개로 제한
    cleaned = cleaned.replace(/print\("([^"]+)\1+"\)/g, 'print("$1")'); // print 내 중복 제거
    cleaned = cleaned.replace(/print\("([^"]*)"[^"]*"([^"]*)"\)/g, 'print("$1$2")'); // 잘못된 따옴표 중복

    // 6. 연속된 구분자 및 특수문자 정리
    cleaned = cleaned.replace(/---+/g, ""); // 연속된 --- 제거
    cleaned = cleaned.replace(/#+\s*$/gm, ""); // 줄 끝의 ### 제거
    cleaned = cleaned.replace(/\s+/g, " "); // 연속 공백을 하나로
    cleaned = cleaned.replace(/^\s*\n+/gm, ""); // 빈 줄 정리
    cleaned = cleaned.trim();

    // 7. 로깅 (변경이 있을 때만)
    if (content !== cleaned) {
      console.log("🧹 청크 정리:", {
        원본: content.substring(0, 50) + "...",
        정리됨: cleaned.substring(0, 50) + "...",
        길이변화: `${content.length} → ${cleaned.length}`,
        제거된내용: content.length - cleaned.length > 10 ? "상당량" : "소량",
      });
    }

    return cleaned;
  },

  /**
   * End 태그 처리 메서드 - 태그 이전까지만 출력 (업데이트된 스탑 태그 포함)
   */
  handleEndTags(content) {
    if (!content || typeof content !== "string") {
      return content;
    }

    // **업데이트된 End 태그들 정의** (우선순위 순서)
    const endTags = [
      // 새로운 주요 스탑 태그들
      "<|EOT|>", // End of Text (최우선)
      "\n# --- Generation Complete ---", // 완료 마커 (줄바꿈 포함)
      "# --- Generation Complete ---", // 완료 마커 (줄바꿈 없이)

      // 기존 vLLM 스탑 태그들
      "</c>",
      "<|im_end|>",
      "[DONE]",
      "<|endoftext|>",

      // 기타 완료 신호들
      "###END###",
      "GenerationComplete",
      "#---GenerationComplete",
      "---GenerationComplete---",

      // 추가 패턴들
      "<!-- END -->",
      "[END_OF_GENERATION]",
      "\n\n# END",
    ];

    // End 태그 감지 (우선순위대로 검사)
    for (let i = 0; i < endTags.length; i++) {
      const endTag = endTags[i];
      const endIndex = content.indexOf(endTag);

      if (endIndex !== -1) {
        console.log(`🔚 End 태그 감지: "${endTag}" (위치: ${endIndex}, 우선순위: ${i + 1})`);

        // 태그 이전까지만 추출
        let beforeTag = content.substring(0, endIndex);

        // 특별 처리: 줄바꿈이 포함된 태그의 경우 추가 정리
        if (endTag.startsWith("\n")) {
          // 이미 줄바꿈 전까지 자른 상태이므로 trailing whitespace만 제거
          beforeTag = beforeTag.trimEnd();
        } else {
          beforeTag = beforeTag.trim();
        }

        if (beforeTag.length > 0) {
          console.log("✂️ 태그 이전 내용:", {
            감지된태그: endTag,
            원본길이: content.length,
            처리된길이: beforeTag.length,
            미리보기: beforeTag.substring(0, 50) + "...",
            완전한내용: beforeTag.length <= 100 ? beforeTag : beforeTag.substring(0, 100) + "...",
          });
          return beforeTag;
        } else {
          // 태그 이전에 유효한 내용이 없으면 스트리밍 종료 신호
          console.log(`⚠️ End 태그 "${endTag}" 이전에 유효한 내용 없음 - 스트리밍 종료`);
          return null;
        }
      }
    }

    // End 태그가 없으면 원본 반환
    return content;
  },

  // 성능 통계 초기화
  resetPerformanceStats() {
    chunkPerformanceStats.totalProcessed = 0;
    chunkPerformanceStats.totalBytes = 0;
    chunkPerformanceStats.smallChunks = 0;
    chunkPerformanceStats.largeChunks = 0;
    chunkPerformanceStats.lastProcessTime = 0;
    chunkPerformanceStats.batchCount = 0;
    chunkBatchBuffer = [];

    if (batchProcessingTimer) {
      clearTimeout(batchProcessingTimer);
      batchProcessingTimer = null;
    }

    console.log("📊 성능 통계 초기화 완료");
  },

  async handleStreamingError(message) {
    console.error("❌ 스트리밍 오류 처리:", message);

    // 상태를 ERROR로 전환
    streamingManager.setState(StreamingState.ERROR, {
      error: message.error || "알 수 없는 오류",
    });
    syncLegacyState();

    try {
      // 강화된 UI 복구 시스템 사용 (핵심 수정 5)
      const error = new Error(message.error || "스트리밍 오류");
      await uiRecoveryManager.recoverStreamingUI(error);

      // 오류 메시지 표시 (복구 후)
      this.displayErrorMessage(message.error || "스트리밍 처리 중 오류가 발생했습니다");

      console.log("✅ 스트리밍 오류 처리 완료");
    } catch (handlingError) {
      console.error("❌ 스트리밍 오류 처리 실패:", handlingError);
      // 최후의 수단으로 기존 방식 사용
      this.displayErrorMessage("시스템 오류가 발생했습니다. 페이지를 새로고침해주세요.");
      this.emergencyUIRestore();
    }
  },

  async updateStreamingDisplay(content) {
    console.log("🖥️ UI 업데이트 시도:", {
      contentLength: content?.length || 0,
      contentPreview: content?.substring(0, 100) + "..." || "empty",
      contentType: typeof content,
    });

    try {
      // 안전한 요소 접근
      const responseElement = await getResponseElementSafely();

      console.log("🔍 response-content 요소 상태:", {
        elementExists: !!responseElement,
        elementTagName: responseElement?.tagName,
        currentDisplay: responseElement?.style?.display,
        currentVisibility: responseElement?.style?.visibility,
        currentHTML: responseElement?.innerHTML?.substring(0, 50) + "..." || "empty",
        parentElement: responseElement?.parentElement?.className,
      });

      if (!responseElement) {
        console.error("❌ 모든 시도에도 불구하고 응답 요소를 생성할 수 없음");
        // UI 복구 시스템 활용
        await uiRecoveryManager.recoverStreamingUI(new Error("응답 요소 없음"));
        return;
      }

      // 메인 요소에 콘텐츠 렌더링 (전달받은 콘텐츠 사용)
      this.renderContentToElement(responseElement, content);

      // 강제 표시 설정
      responseElement.style.display = "block";
      responseElement.style.visibility = "visible";
      responseElement.style.opacity = "1";

      // 부모 컨테이너도 표시
      const parentContainer = responseElement.closest(".response-content, .tab-content");
      if (parentContainer) {
        parentContainer.style.display = "block";
        parentContainer.style.visibility = "visible";
        console.log("✅ 부모 컨테이너도 표시됨");
      }

      // 응답 탭 활성화 확인
      this.ensureResponseTabVisible();

      // 스크롤 하단으로 이동
      responseElement.scrollTop = responseElement.scrollHeight;

      console.log("✅ UI 업데이트 완료:", {
        elementVisible: responseElement.offsetHeight > 0,
        contentSet: responseElement.innerHTML.length > 0,
        scrollHeight: responseElement.scrollHeight,
      });
    } catch (error) {
      console.error("❌ UI 업데이트 오류:", error);

      // UI 복구 시스템 활용
      try {
        await uiRecoveryManager.recoverStreamingUI(error);
      } catch (recoveryError) {
        console.error("❌ UI 복구도 실패:", recoveryError);

        // 최후의 수단: 경고창으로 표시
        if (content && content.length > 10) {
          const shortContent = content.substring(0, 200) + (content.length > 200 ? "..." : "");
          console.log("🚨 UI 업데이트 실패 - 콘솔에 내용 표시:", shortContent);
        }
      }
    }
  },

  renderContentToElement(element, content) {
    if (!element || !content) {
      return;
    }

    try {
      // 코드 블록으로 렌더링
      const renderedContent = this.renderCodeSafely(content);
      element.innerHTML = renderedContent;

      console.log("✅ 콘텐츠 렌더링 성공:", {
        targetElement: element.id || element.className,
        renderedLength: element.innerHTML.length,
        contentPreview: element.innerHTML.substring(0, 100) + "...",
      });
    } catch (error) {
      console.error("❌ 콘텐츠 렌더링 실패:", error);

      // 폴백: 안전한 텍스트 표시
      element.innerHTML = `<pre style="white-space: pre-wrap; word-wrap: break-word; font-family: 'Consolas', 'Monaco', monospace; font-size: 12px; line-height: 1.4; padding: 8px; background: #1e1e1e; color: #d4d4d4; border-radius: 4px; overflow-x: auto;">${this.escapeHtml(
        content
      )}</pre>`;
      console.log("🔄 폴백 텍스트 렌더링 완료");
    }
  },

  ensureResponseTabVisible() {
    try {
      console.log("🔍 응답 탭 표시 보장 시작");

      // 단일 소스 진실 원칙에 따라 switchTab 함수 사용
      if (typeof switchTab === "function") {
        switchTab("response");
        console.log("✅ switchTab 함수 통해 응답 탭 활성화");
      } else {
        console.warn("⚠️ switchTab 함수 없음, 대안 로직 사용");

        // switchTab이 없는 경우에만 직접 조작
        const responseTab = document.querySelector('[data-tab="response"]');
        const responseContent = document.querySelector(".response-content");
        const historyContent = document.querySelector(".history-content");

        // 모든 탭 버튼 비활성화
        document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));

        // 응답 탭 활성화
        if (responseTab) {
          responseTab.classList.add("active");
        }

        // 콘텐츠 표시/숨김
        if (responseContent) {
          responseContent.style.display = "block";
          responseContent.style.visibility = "visible";
        }
        if (historyContent) {
          historyContent.style.display = "none";
        }
      }

      console.log("✅ 응답 탭 표시 보장 완료");
    } catch (error) {
      console.error("❌ 응답 탭 표시 보장 실패:", error);
    }
  },

  async displayFinalResult(content) {
    console.log("🎯 최종 결과 표시 시작:", {
      contentLength: content?.length || 0,
      contentPreview: content?.substring(0, 100) + "..." || "empty",
      contentType: typeof content,
    });

    // **최종 콘텐츠 정리**
    let cleanedContent = content;
    if (content && typeof content === "string") {
      cleanedContent = messageQueue.cleanChunkContent(content);
      cleanedContent = messageQueue.handleEndTags(cleanedContent) || cleanedContent;

      console.log("🧹 최종 콘텐츠 정리:", {
        원본길이: content.length,
        정리된길이: cleanedContent.length,
        정리된내용: cleanedContent.substring(0, 50) + "...",
      });
    }

    // 응답 탭 강제 활성화
    this.activateResponseTab();

    try {
      // 안전한 요소 접근
      const responseElement = await getResponseElementSafely();
      console.log("🔍 response-content 요소 최종 확인:", {
        found: !!responseElement,
        elementType: responseElement?.tagName,
        currentContent: responseElement?.innerHTML?.substring(0, 50) + "..." || "empty",
        isVisible: responseElement ? responseElement.offsetHeight > 0 : false,
      });

      if (!responseElement) {
        console.error("❌ response-content 요소를 찾을 수 없음 - 대체 방법 시도");
        this.tryAlternativeDisplay(content);
        return;
      }

      try {
        // 기존 내용 완전 제거 - 더 강력한 방법
        responseElement.innerHTML = "";
        responseElement.textContent = "";

        // 모든 자식 요소 제거
        while (responseElement.firstChild) {
          responseElement.removeChild(responseElement.firstChild);
        }

        // 이미 위에서 정리된 cleanedContent 사용 (이중 정리 방지)
        if (!cleanedContent || cleanedContent.trim().length === 0) {
          console.warn("⚠️ 정리 후 빈 콘텐츠");
          cleanedContent = "# 응답 내용이 비어있습니다.\n# 다시 시도해주세요.";
        }

        // 직접 HTML 생성 (안전한 방법)
        const safeContent = messageQueue.createSafeHTML(cleanedContent);
        responseElement.innerHTML = safeContent;

        // 강제 표시 스타일 적용
        messageQueue.forceElementVisibility(responseElement);

        // 부모 컨테이너들도 표시
        messageQueue.ensureParentVisibility(responseElement);

        // 복사 버튼 활성화
        messageQueue.activateCopyButton(cleanedContent);

        // DOM 강제 업데이트
        responseElement.offsetHeight;

        // 강제 UI 업데이트 호출
        forceUpdateUI();

        // 최종 검증
        setTimeout(() => messageQueue.validateFinalDisplay(responseElement, cleanedContent), 100);

        console.log("✅ 최종 결과 표시 완료");
      } catch (error) {
        console.error("❌ 최종 결과 표시 오류:", error);
        messageQueue.handleDisplayError(responseElement, content, error);
      }
    } catch (outerError) {
      console.error("❌ displayFinalResult 전체 오류:", outerError);
      messageQueue.emergencyUIRecovery();
    }
  },

  tryAlternativeDisplay(content) {
    console.log("🔄 대체 표시 방법 시도");

    // 모든 가능한 응답 요소 검색
    const candidates = [
      document.querySelector("#response-content"),
      document.querySelector(".response-display"),
      document.querySelector(".response-content"),
      document.querySelector("[class*='response']"),
      document.querySelector(".tab-content .response-content"),
    ].filter(Boolean);

    console.log("🔍 대체 요소 후보:", {
      count: candidates.length,
      elements: candidates.map(el => ({
        id: el.id,
        className: el.className,
        tagName: el.tagName,
      })),
    });

    if (candidates.length > 0) {
      const target = candidates[0];
      target.innerHTML = `<pre style="white-space: pre-wrap; font-family: monospace; padding: 10px; background: #1e1e1e; color: #d4d4d4; border-radius: 4px;">${this.escapeHtml(
        content
      )}</pre>`;
      this.forceElementVisibility(target);
      console.log("✅ 대체 요소에 표시 완료");
    } else {
      console.error("❌ 표시할 요소를 찾을 수 없음");
      alert("응답을 표시할 수 없습니다. 페이지를 새로고침해주세요.");
    }
  },

  forceElementVisibility(element) {
    if (!element) {
      return;
    }

    element.style.display = "block";
    element.style.visibility = "visible";
    element.style.opacity = "1";
    element.style.position = "relative";
    element.style.zIndex = "1";
    element.style.minHeight = "50px";
    element.style.maxHeight = "none";
    element.style.overflow = "auto";

    console.log("✅ 요소 강제 표시 완료:", {
      display: element.style.display,
      visibility: element.style.visibility,
      opacity: element.style.opacity,
    });
  },

  ensureParentVisibility(element) {
    let parent = element.parentElement;
    let level = 0;

    while (parent && level < 5) {
      if (parent.style) {
        if (parent.style.display === "none") {
          parent.style.display = "block";
          console.log(`✅ 부모 요소 ${level} 표시 복구: ${parent.className}`);
        }
        if (parent.style.visibility === "hidden") {
          parent.style.visibility = "visible";
        }
      }
      parent = parent.parentElement;
      level++;
    }
  },

  activateCopyButton(content) {
    try {
      const copyButton = document.getElementById("copy-button");
      if (copyButton) {
        copyButton.style.display = "block";
        copyButton.onclick = () => messageQueue.copyToClipboard(content);
        console.log("📋 복사 버튼 활성화 완료");
      }

      const responseActions = document.querySelector(".response-actions");
      if (responseActions) {
        responseActions.style.display = "block";
      }
    } catch (error) {
      console.error("❌ 복사 버튼 활성화 실패:", error);
    }
  },

  validateFinalDisplay(element, content) {
    const isVisible = element.offsetHeight > 0;
    const hasContent = element.innerHTML.length > 0;
    const contentMatches = element.textContent.includes(content.substring(0, 50));

    console.log("🔍 최종 표시 검증:", {
      isVisible,
      hasContent,
      contentMatches,
      elementHeight: element.offsetHeight,
      contentLength: element.innerHTML.length,
    });

    if (!isVisible || !hasContent) {
      console.error("❌ 최종 표시 검증 실패 - 긴급 복구 시도");
      this.emergencyDisplayRecovery(element, cleanedContent);
    } else {
      console.log("✅ 최종 표시 검증 성공");
    }
  },

  emergencyDisplayRecovery(element, content) {
    console.log("🚨 긴급 표시 복구 시작");

    try {
      // 최소한의 안전한 표시 - 기록 탭과 동일한 카드 스타일
      element.innerHTML = `
        <div class="unified-history-card" style="
          padding: 0; 
          background: var(--hapa-input-background); 
          color: var(--hapa-input-foreground); 
          border: 1px solid var(--hapa-input-border); 
          border-radius: 8px; 
          font-family: var(--vscode-font-family); 
          min-height: 100px;
          display: block !important;
          visibility: visible !important;
        ">
          <!-- 응답 섹션 - 기록 탭과 동일한 구조 -->
          <div class="response-section" style="padding: 12px 16px;">
            <div class="section-header" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
              <div class="section-label" style="display: flex; align-items: center; gap: 6px;">
                <span class="label-icon" style="font-size: 12px;">🤖</span>
                <span class="label-text" style="font-size: 10px; font-weight: 600; color: var(--hapa-primary); text-transform: uppercase; letter-spacing: 0.5px;">HAPA 응답</span>
              </div>
              <button onclick="copyToClipboard('${this.escapeForAttribute(content)}')" class="copy-button" style="
                background: var(--hapa-button-background);
                border: 1px solid var(--hapa-button-border);
                color: var(--hapa-button-foreground);
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 10px;
                cursor: pointer;
              ">📋 복사</button>
            </div>
            <div class="section-content">
              <div style="background: #2d2d2d; padding: 10px; border-radius: 4px; overflow-x: auto; font-size: 11px; line-height: 1.4;">
                ${this.escapeHtml(content)}
              </div>
            </div>
          </div>
        </div>
      `;

      // 강제 표시
      element.style.cssText = `
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        position: relative !important;
        z-index: 999 !important;
        min-height: 100px !important;
      `;

      console.log("🔧 긴급 복구 완료");
    } catch (error) {
      console.error("❌ 긴급 복구도 실패:", error);
    }
  },

  /**
   * 안전한 HTML 생성 메서드 - 기록 탭과 동일한 카드 스타일
   */
  createSafeHTML(content) {
    try {
      // HTML 이스케이프 처리
      const escapedContent = this.escapeHtml(content);

      // 기록 탭과 동일한 카드 스타일로 생성
      return `
        <div class="unified-history-card" style="
          width: 100%;
          background: var(--hapa-input-background);
          color: var(--hapa-input-foreground);
          border: 1px solid var(--hapa-input-border);
          border-radius: 8px;
          font-family: var(--vscode-font-family);
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
          min-height: 100px;
          margin-bottom: 16px;
          overflow: hidden;
          transition: all var(--hapa-duration-normal) var(--hapa-ease-out);
        ">
          <!-- 응답 섹션 - 기록 탭과 완전히 동일한 구조 -->
          <div class="response-section" style="padding: 12px 16px;">
            <div class="section-header" style="
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-bottom: 10px;
            ">
              <div class="section-label" style="
                display: flex;
                align-items: center;
                gap: 6px;
              ">
                <span class="label-icon" style="font-size: 12px;">🤖</span>
                <span class="label-text" style="
                  font-size: 10px;
                  font-weight: 600;
                  color: var(--hapa-primary);
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                ">HAPA 응답</span>
              </div>
              <div class="section-time" style="
                font-size: 9px;
                color: var(--hapa-description-foreground);
                font-weight: 500;
                white-space: nowrap;
              ">${new Date().toLocaleTimeString()}</div>
            </div>
            <div class="section-content">
              <div class="content-text" style="
                font-size: 11px;
                color: var(--hapa-input-foreground);
                line-height: 1.4;
                word-wrap: break-word;
              ">
                <pre style="
                  margin: 0;
                  padding: 12px;
                  background: #2d2d2d;
                  border-radius: 6px;
                  white-space: pre-wrap;
                  word-wrap: break-word;
                  overflow-x: auto;
                  border: 1px solid #404040;
                  color: #e6edf3;
                  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
                  font-size: 11px;
                  line-height: 1.4;
                "><code>${escapedContent}</code></pre>
              </div>
            </div>
            <!-- 복사 버튼을 하단에 배치 -->
            <div style="
              margin-top: 12px;
              display: flex;
              justify-content: flex-end;
              gap: 8px;
            ">
              <button onclick="copyToClipboard('${this.escapeForAttribute(content)}')" class="copy-button" style="
                background: var(--hapa-button-background);
                border: 1px solid var(--hapa-button-border);
                color: var(--hapa-button-foreground);
                padding: 6px 12px;
                border-radius: 4px;
                font-size: 11px;
                cursor: pointer;
                transition: all var(--hapa-duration-normal) var(--hapa-ease-out);
              ">📋 복사</button>
            </div>
          </div>
        </div>
      `;
    } catch (error) {
      console.error("❌ 안전한 HTML 생성 실패:", error);
      // 폴백: 가장 기본적인 HTML
      return `<pre style="
        font-family: monospace;
        white-space: pre-wrap;
        padding: 10px;
        background: #1e1e1e;
        color: #d4d4d4;
        border-radius: 4px;
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
             ">${this.escapeHtml(content)}</pre>`;
    }
  },

  handleDisplayError(element, content, error) {
    console.error("❌ 표시 오류 처리:", error);

    if (element) {
      element.innerHTML = `
        <div style="padding: 15px; background: #2d1b1b; color: #ff6b6b; border: 1px solid #ff6b6b; border-radius: 4px;">
          <h4>⚠️ 표시 오류 발생</h4>
          <p>응답을 표시하는 중 오류가 발생했습니다:</p>
          <pre style="background: #1a1a1a; padding: 8px; border-radius: 4px; font-size: 11px;">${this.escapeHtml(
            error.message
          )}</pre>
          <details style="margin-top: 10px;">
            <summary style="cursor: pointer; color: #4fc3f7;">원본 응답 보기</summary>
            <pre style="background: #1a1a1a; padding: 8px; border-radius: 4px; margin-top: 5px; white-space: pre-wrap; font-size: 11px;">${this.escapeHtml(
              content
            )}</pre>
          </details>
        </div>
      `;
      this.forceElementVisibility(element);
    }
  },

  // 응답 탭 활성화 함수 (개선된 버전 - switchTab 사용)
  activateResponseTab() {
    try {
      console.log("🔄 응답 탭 활성화 시작");

      // 기존 switchTab 함수 사용하여 중복 코드 제거
      if (typeof switchTab === "function") {
        switchTab("response");
      } else {
        console.warn("⚠️ switchTab 함수를 찾을 수 없어 대안 방식 사용");

        // switchTab 함수가 없는 경우 기본 로직
        const allTabBtns = document.querySelectorAll(".tab-btn");
        allTabBtns.forEach(btn => btn.classList.remove("active"));

        const responseContent = document.querySelector(".response-content");
        const historyContent = document.querySelector(".history-content");

        if (responseContent) {
          responseContent.style.display = "block";
          responseContent.style.visibility = "visible";
        }
        if (historyContent) {
          historyContent.style.display = "none";
        }

        const responseTabBtn = document.querySelector('[data-tab="response"]');
        if (responseTabBtn) {
          responseTabBtn.classList.add("active");
        }
      }

      // 추가 강제 표시 로직 (응답 컨텐츠용)
      const responseElement = document.getElementById("response-content");
      if (responseElement) {
        this.forceElementVisibility(responseElement);
      }

      console.log("✅ 응답 탭 활성화 완료");
    } catch (error) {
      console.error("❌ 응답 탭 활성화 오류:", error);
    }
  },

  displayErrorMessage(message) {
    const responseElement = document.getElementById("response-content");
    if (responseElement) {
      responseElement.innerHTML = `
        <div class="error-message">
          <h4>❌ 오류 발생</h4>
          <p>${this.escapeHtml(message)}</p>
          <button onclick="location.reload()">페이지 새로고침</button>
        </div>
      `;
    }
  },

  cleanupStreaming() {
    console.log("🧹 스트리밍 상태 정리 시작");

    try {
      // 전역 타이머 정리 (안전한 참조)
      if (typeof streamingTimeout !== "undefined" && streamingTimeout) {
        clearTimeout(streamingTimeout);
        streamingTimeout = null;
        console.log("✅ streamingTimeout 정리 완료");
      }

      // 전역 헬스 체크 정리
      if (typeof healthCheckInterval !== "undefined" && healthCheckInterval) {
        clearInterval(healthCheckInterval);
        healthCheckInterval = null;
        console.log("✅ healthCheckInterval 정리 완료");
      }

      // globalState의 타이머들도 정리
      if (globalState.streamingTimeout) {
        clearTimeout(globalState.streamingTimeout);
        globalState.streamingTimeout = null;
        console.log("✅ globalState.streamingTimeout 정리 완료");
      }

      if (globalState.healthCheckInterval) {
        clearInterval(globalState.healthCheckInterval);
        globalState.healthCheckInterval = null;
        console.log("✅ globalState.healthCheckInterval 정리 완료");
      }

      // AbortController 정리
      if (typeof streamingAbortController !== "undefined" && streamingAbortController) {
        streamingAbortController.abort();
        streamingAbortController = null;
        console.log("✅ streamingAbortController 정리 완료");
      }

      // ✅ 수정: 전역 버퍼 정리 (동기화)
      streamingBuffer = "";
      currentStreamingContent = "";
      streamingSequence = 0;

      // globalState 버퍼 정리
      globalState.reset();

      // 상태가 아직 IDLE이 아닌 경우에만 IDLE로 전환
      if (streamingManager.currentState !== StreamingState.IDLE) {
        streamingManager.setState(StreamingState.IDLE, {
          reason: "cleanup",
          timestamp: Date.now(),
        });

        // 동기화 실행
        try {
          syncLegacyState();
        } catch (syncError) {
          console.warn("⚠️ 정리 중 동기화 실패:", syncError);
        }
      }

      console.log("✅ 스트리밍 상태 정리 완료");
    } catch (error) {
      console.error("❌ 스트리밍 정리 중 오류:", error);

      // ✅ 수정: 긴급 정리 - 최소한의 정리라도 수행 (동기화)
      try {
        streamingBuffer = "";
        currentStreamingContent = "";
        streamingSequence = 0;
        streamingManager.currentState = StreamingState.IDLE;
        console.log("🚨 긴급 정리 완료");
      } catch (emergencyError) {
        console.error("❌ 긴급 정리도 실패:", emergencyError);
      }
    }
  },

  resetStreamingUI() {
    console.log("🔄 UI 상태 복구 실행");

    const button = document.getElementById("generate-btn");
    const spinner = document.getElementById("loading-spinner");
    const statusElement = document.getElementById("streaming-status");

    console.log("🔍 UI 요소 상태:", {
      button: !!button,
      buttonText: button?.textContent,
      buttonDisabled: button?.disabled,
      spinner: !!spinner,
      spinnerDisplay: spinner?.style?.display,
      statusElement: !!statusElement,
    });

    if (button) {
      button.disabled = false;
      button.textContent = "코드 생성";
      console.log("✅ 버튼 상태 복구 완료");
    } else {
      console.error("❌ generate-btn 요소를 찾을 수 없음");
    }

    if (spinner) {
      spinner.style.display = "none";
      console.log("✅ 스피너 숨김 완료");
    }

    if (statusElement) {
      statusElement.style.display = "none";
      console.log("✅ 상태 요소 숨김 완료");
    }
  },

  recoverStreamingUI(error) {
    console.log("🔧 스트리밍 UI 복구 중...");

    this.cleanupStreaming();
    this.resetStreamingUI();
    this.displayErrorMessage("다수의 오류가 발생했습니다. 페이지를 새로고침해주세요.");
  },

  startHealthCheck() {
    if (healthCheckInterval) {
      clearInterval(healthCheckInterval);
    }

    healthCheckInterval = setInterval(() => {
      if (streamingManager.isActive()) {
        console.log("💗 헬스 체크: 스트리밍 활성");
      }
    }, 30000); // 30초마다
  },

  handleStreamingTimeout() {
    console.warn("⏱️ 스트리밍 타임아웃 처리");

    this.handleStreamingError({
      message: "요청 시간이 초과되었습니다. 다시 시도해주세요.",
    });
  },

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  },

  /**
   * AI 응답 후처리 - 특수 토큰 제거 및 HTML 안전 처리
   */
  cleanAIResponse(text) {
    if (!text) {
      return "";
    }

    let cleaned = text;

    // 1. AI 모델 특수 토큰 제거
    const specialTokenPatterns = [
      /<\|im_end[^>]*\|>/gi, // <|im_end="function"|> 등
      /<\|im_start[^>]*\|>/gi, // <|im_start="assistant"|> 등
      /<\|[^>]*\|>/gi, // 기타 특수 토큰
      /\[INST\]|\[\/INST\]/gi, // 명령 토큰
      /<s>|<\/s>/gi, // 시작/종료 토큰
      /<unk>|<pad>|<eos>|<bos>/gi, // 특수 토큰들
    ];

    specialTokenPatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, "");
    });

    // 2. 중복 공백 및 줄바꿈 정리
    cleaned = cleaned.replace(/\n\s*\n\s*\n/g, "\n\n"); // 3개 이상 줄바꿈 → 2개
    cleaned = cleaned.replace(/ +/g, " "); // 여러 공백 → 단일 공백
    cleaned = cleaned.trim();

    // 3. 기본적인 문법 수정 시도
    cleaned = this.fixBasicSyntaxErrors(cleaned);

    return cleaned;
  },

  /**
   * 기본적인 Python 문법 오류 수정
   */
  fixBasicSyntaxErrors(code) {
    if (!code) {
      return "";
    }

    let fixed = code;

    // 1. 따옴표 불일치 수정 (간단한 경우만)
    // print(Hello") → print("Hello")
    fixed = fixed.replace(/print\(([^"']*?)\"\)/g, 'print("$1")');
    fixed = fixed.replace(/print\(([^"']*?)'\)/g, "print('$1')");

    // 2. 기본적인 문자열 따옴표 짝 맞추기
    // "Hello → "Hello"
    fixed = fixed.replace(/(\w+)\"/g, '"$1"');
    fixed = fixed.replace(/\"(\w+)/g, '"$1"');

    // 3. return 문 정리
    fixed = fixed.replace(/returnNone/g, "return None");
    fixed = fixed.replace(/return(\w+)/g, "return $1");

    return fixed;
  },

  /**
   * 코드 블록 안전 렌더링
   */
  renderCodeSafely(code) {
    if (!code) {
      return "";
    }

    try {
      // 1. AI 응답 정리
      const cleanedCode = this.cleanAIResponse(code);

      // 2. HTML 엔티티 처리
      const safeCode = this.escapeHtml(cleanedCode);

      // 3. 코드 하이라이팅을 위한 기본 구조
      return `<pre><code class="language-python">${safeCode}</code></pre>`;
    } catch (error) {
      console.error("❌ renderCodeSafely 내부 오류:", error);
      // 최종 폴백
      return `<pre><code>${this.escapeHtml(code)}</code></pre>`;
    }
  },

  copyToClipboard(text) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        console.log("📋 클립보드에 복사됨");
        // 임시 성공 메시지 표시
        const copyButton = document.getElementById("copy-button");
        if (copyButton) {
          const originalText = copyButton.textContent;
          copyButton.textContent = "복사됨!";
          setTimeout(() => {
            copyButton.textContent = originalText;
          }, 2000);
        }
      })
      .catch(err => {
        console.error("❌ 클립보드 복사 실패:", err);
      });
  },

  restoreButtonState() {
    try {
      const generateBtn = document.getElementById("generate-btn");
      if (generateBtn) {
        generateBtn.disabled = false;
        generateBtn.textContent = "코드 생성";
        generateBtn.style.opacity = "1";
        generateBtn.style.cursor = "pointer";
        console.log("✅ 코드 생성 버튼 상태 복구 완료");
      }

      // 다른 버튼들도 복구
      const allButtons = document.querySelectorAll("button[disabled]");
      allButtons.forEach(btn => {
        if (btn.id !== "generate-btn") {
          btn.disabled = false;
          console.log(`✅ 버튼 복구: ${btn.id || btn.className}`);
        }
      });
    } catch (error) {
      console.error("❌ 버튼 상태 복구 실패:", error);
    }
  },

  displayEmptyResult() {
    const responseElement = document.getElementById("response-content");
    if (responseElement) {
      responseElement.innerHTML = `
        <div class="empty-result">
          <div style="text-align: center; padding: 30px; color: #888;">
            <div style="font-size: 48px; margin-bottom: 16px;">🤔</div>
            <h3 style="color: #ccc; margin-bottom: 8px;">응답이 비어있습니다</h3>
            <p>AI가 응답을 생성했지만 내용이 없습니다.</p>
            <p>다른 질문으로 다시 시도해보세요.</p>
          </div>
        </div>
      `;
      this.forceElementVisibility(responseElement);
      this.activateResponseTab();
    }
  },

  emergencyUIRecovery() {
    console.log("🚨 긴급 UI 복구 시작");

    try {
      // 버튼 강제 복구
      const generateBtn = document.getElementById("generate-btn");
      if (generateBtn) {
        generateBtn.disabled = false;
        generateBtn.textContent = "코드 생성";
        generateBtn.style.cssText = "opacity: 1 !important; cursor: pointer !important;";
      }

      // 스트리밍 표시기 숨김
      const streamingIndicator = document.getElementById("streamingIndicator");
      if (streamingIndicator) {
        streamingIndicator.style.display = "none";
      }

      // 오류 메시지 표시
      const responseElement = document.getElementById("response-content");
      if (responseElement) {
        responseElement.innerHTML = `
          <div style="padding: 20px; text-align: center; background: #2d1b1b; border: 1px solid #ff6b6b; border-radius: 8px; color: #ff6b6b;">
            <h3>⚠️ 시스템 오류</h3>
            <p>예상치 못한 오류가 발생했습니다.</p>
            <p>페이지를 새로고침한 후 다시 시도해주세요.</p>
            <button onclick="location.reload()" style="margin-top: 10px; padding: 8px 16px; background: #ff6b6b; color: white; border: none; border-radius: 4px; cursor: pointer;">
              페이지 새로고침
            </button>
          </div>
        `;
        this.forceElementVisibility(responseElement);
      }

      console.log("🔧 긴급 UI 복구 완료");
    } catch (error) {
      console.error("❌ 긴급 UI 복구도 실패:", error);
      alert("시스템 오류가 발생했습니다. 페이지를 새로고침해주세요.");
    }
  },

  /**
   * AI 응답 처리 (새로운 메서드)
   */
  async handleAIResponse(message) {
    console.log("🤖 AI 응답 처리 시작:", {
      hasResponse: !!message.response,
      responseKeys: message.response ? Object.keys(message.response) : null,
    });

    try {
      const response = message.response;
      if (!response || !response.generated_code) {
        console.error("❌ 유효하지 않은 AI 응답:", response);
        await this.handleShowError({
          error: "응답 데이터가 유효하지 않습니다.",
        });
        return;
      }

      // 응답 탭 활성화
      this.activateResponseTab();

      // 응답 요소 안전하게 가져오기
      const responseElement = await getResponseElementSafely();
      if (!responseElement) {
        console.error("❌ 응답 요소를 찾을 수 없음");
        return;
      }

      // 응답 내용 렌더링
      const renderedContent = this.renderAIResponse(response);
      responseElement.innerHTML = renderedContent;

      // 요소 강제 표시
      this.forceElementVisibility(responseElement);

      // 부모 컨테이너들 표시
      this.ensureParentVisibility(responseElement);

      // 복사 버튼 활성화
      this.activateCopyButton(response.generated_code);

      console.log("✅ AI 응답 표시 완료");
    } catch (error) {
      console.error("❌ AI 응답 처리 오류:", error);
      await this.handleShowError({
        error: "응답 처리 중 오류가 발생했습니다.",
      });
    }
  },

  /**
   * 응답 가시성 확인 (새로운 메서드)
   */
  async ensureResponseVisible(message) {
    console.log("👁️ 응답 가시성 확인 시작");

    try {
      const data = message.data || message.response;
      if (!data || !data.generated_code) {
        console.warn("⚠️ 가시성 확인할 데이터가 없음");
        return;
      }

      // 응답 요소 확인
      const responseElement = await getResponseElementSafely();
      if (!responseElement) {
        console.error("❌ 응답 요소를 찾을 수 없어 재생성 시도");

        // 응답 재처리 시도
        await this.handleAIResponse({ response: data });
        return;
      }

      // 내용이 비어있는지 확인
      if (
        !responseElement.innerHTML.trim() ||
        responseElement.innerHTML.includes("응답을 기다리는 중")
      ) {
        console.warn("⚠️ 응답 내용이 비어있음, 재렌더링 시도");

        const renderedContent = this.renderAIResponse(data);
        responseElement.innerHTML = renderedContent;
        this.forceElementVisibility(responseElement);
      }

      // 가시성 검증
      const isVisible = responseElement.offsetHeight > 0 && responseElement.offsetWidth > 0;
      console.log("📊 가시성 검증 결과:", {
        isVisible,
        offsetHeight: responseElement.offsetHeight,
        offsetWidth: responseElement.offsetWidth,
        display: responseElement.style.display,
        visibility: responseElement.style.visibility,
      });

      if (!isVisible) {
        console.warn("⚠️ 응답이 보이지 않음, 강제 표시");
        this.forceElementVisibility(responseElement);
        this.ensureParentVisibility(responseElement);
      }

      // 응답 탭 활성화
      this.activateResponseTab();
    } catch (error) {
      console.error("❌ 응답 가시성 확인 오류:", error);
    }
  },

  /**
   * 로딩 상태 처리 (새로운 메서드)
   */
  async handleShowLoading(message) {
    console.log("⏳ 로딩 상태 표시:", message.message);

    try {
      const responseElement = await getResponseElementSafely();
      if (!responseElement) {
        console.error("❌ 로딩 표시할 요소를 찾을 수 없음");
        return;
      }

      // 로딩 UI 표시
      responseElement.innerHTML = `
        <div class="loading-response">
          <div class="loading-animation">
            <div class="spinner"></div>
          </div>
          <p>${message.message || "AI가 응답을 생성하고 있습니다..."}</p>
        </div>
      `;

      this.forceElementVisibility(responseElement);
      this.activateResponseTab();
    } catch (error) {
      console.error("❌ 로딩 상태 표시 오류:", error);
    }
  },

  /**
   * 에러 상태 처리 (새로운 메서드)
   */
  async handleShowError(message) {
    console.log("❌ 에러 상태 표시:", message.error);

    try {
      const responseElement = await getResponseElementSafely();
      if (!responseElement) {
        console.error("❌ 에러 표시할 요소를 찾을 수 없음");
        return;
      }

      // 에러 UI 표시
      responseElement.innerHTML = `
        <div class="error-response">
          <div class="error-icon">⚠️</div>
          <div class="error-message">
            <h3>오류 발생</h3>
            <p>${message.error || "알 수 없는 오류가 발생했습니다."}</p>
            <button onclick="location.reload()" class="retry-button">다시 시도</button>
          </div>
        </div>
      `;

      this.forceElementVisibility(responseElement);
      this.activateResponseTab();
    } catch (error) {
      console.error("❌ 에러 상태 표시 오류:", error);
    }
  },

  /**
   * AI 응답 렌더링 - 기록 탭과 동일한 카드 스타일
   */
  renderAIResponse(response) {
    const timestamp = new Date().toLocaleTimeString();
    const hasExplanation = response.explanation && response.explanation.trim() !== "";
    const hasCode = response.generated_code && response.generated_code.trim() !== "";

    // 주요 콘텐츠 결정 (코드가 있으면 코드, 없으면 설명)
    const mainContent = hasCode
      ? response.generated_code
      : hasExplanation
        ? response.explanation
        : "응답 내용이 없습니다.";
    const contentType = hasCode ? "코드" : "설명";

    return `
      <div class="unified-history-card" style="
        width: 100%;
        background: var(--hapa-input-background);
        color: var(--hapa-input-foreground);
        border: 1px solid var(--hapa-input-border);
        border-radius: 8px;
        font-family: var(--vscode-font-family);
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        min-height: 100px;
        margin-bottom: 16px;
        overflow: hidden;
        transition: all var(--hapa-duration-normal) var(--hapa-ease-out);
      ">
        <!-- 응답 섹션 - 기록 탭과 완전히 동일한 구조 -->
        <div class="response-section" style="padding: 12px 16px;">
          <div class="section-header" style="
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 10px;
          ">
            <div class="section-label" style="
              display: flex;
              align-items: center;
              gap: 6px;
            ">
              <span class="label-icon" style="font-size: 12px;">🤖</span>
              <span class="label-text" style="
                font-size: 10px;
                font-weight: 600;
                color: var(--hapa-primary);
                text-transform: uppercase;
                letter-spacing: 0.5px;
              ">AI 응답</span>
            </div>
            <div class="section-time" style="
              font-size: 9px;
              color: var(--hapa-description-foreground);
              font-weight: 500;
              white-space: nowrap;
            ">${timestamp}</div>
          </div>
          <div class="section-content">
            <div class="content-text" style="
              font-size: 11px;
              color: var(--hapa-input-foreground);
              line-height: 1.4;
              word-wrap: break-word;
            ">
              ${
                hasCode
                  ? `
                <pre style="
                  margin: 0;
                  padding: 12px;
                  background: #2d2d2d;
                  border-radius: 6px;
                  white-space: pre-wrap;
                  word-wrap: break-word;
                  overflow-x: auto;
                  border: 1px solid #404040;
                  color: #e6edf3;
                  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
                  font-size: 11px;
                  line-height: 1.4;
                "><code>${this.escapeHtml(response.generated_code)}</code></pre>
              `
                  : `
                <div style="
                  padding: 12px;
                  background: var(--hapa-input-background);
                  border-radius: 6px;
                  border: 1px solid var(--hapa-input-border);
                  font-size: 11px;
                  line-height: 1.4;
                ">${this.escapeHtml(mainContent)}</div>
              `
              }
            </div>
          </div>
          <!-- 복사 버튼을 하단에 배치 -->
          <div style="
            margin-top: 12px;
            display: flex;
            justify-content: flex-end;
            gap: 8px;
          ">
            <button onclick="copyToClipboard('${this.escapeForAttribute(mainContent)}')" class="copy-button" style="
              background: var(--hapa-button-background);
              border: 1px solid var(--hapa-button-border);
              color: var(--hapa-button-foreground);
              padding: 6px 12px;
              border-radius: 4px;
              font-size: 11px;
              cursor: pointer;
              transition: all var(--hapa-duration-normal) var(--hapa-ease-out);
            ">📋 복사</button>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * 설명 섹션 렌더링
   */
  renderExplanationSection(explanation) {
    return `
      <div class="explanation-section">
        <div class="section-header">
          <h4 class="section-title">📝 설명</h4>
        </div>
        <div class="explanation-content">
          ${this.formatExplanationText(explanation)}
        </div>
      </div>
    `;
  },

  /**
   * 코드 섹션 렌더링
   */
  renderCodeSection(code, metadata) {
    const languageClass = this.detectLanguageClass(code);
    const highlightedCode = this.applySyntaxHighlighting(code, metadata.language);
    return `
      <div class="code-section">
        <div class="section-header">
          <h4 class="section-title">💻 코드</h4>
          <div class="code-info">
            <span class="language-tag">${metadata.language}</span>
            <span class="lines-count">${metadata.linesCount}줄</span>
          </div>
        </div>
        <div class="code-container">
          <pre class="code-block"><code class="${languageClass}">${highlightedCode}</code></pre>
        </div>
      </div>
    `;
  },

  /**
   * 메타데이터 섹션 렌더링
   */
  renderMetadataSection(metadata, timestamp) {
    return `
      <div class="metadata-section">
        <div class="meta-items">
          <span class="meta-item">
            <i class="meta-icon">🕒</i>
            <span class="meta-text">${timestamp}</span>
          </span>
          <span class="meta-item">
            <i class="meta-icon">📊</i>
            <span class="meta-text">${metadata.charCount}자</span>
          </span>
          ${
            metadata.processingTime
              ? `
            <span class="meta-item">
              <i class="meta-icon">⚡</i>
              <span class="meta-text">${metadata.processingTime}ms</span>
            </span>
          `
              : ""
          }
        </div>
      </div>
    `;
  },

  /**
   * 액션 버튼 섹션 렌더링
   */
  renderActionButtons(code) {
    return `
      <div class="action-section">
        <button onclick="copyToClipboard('${this.escapeForAttribute(
          code
        )}')" class="action-button copy-button">
          <i class="button-icon">📋</i>
          <span class="button-text">복사</span>
        </button>
        <button onclick="insertCode('${this.escapeForAttribute(
          code
        )}')" class="action-button insert-button">
          <i class="button-icon">📝</i>
          <span class="button-text">삽입</span>
        </button>
      </div>
    `;
  },

  /**
   * 응답 메타데이터 생성
   */
  generateResponseMetadata(response) {
    const code = response.generated_code || "";
    return {
      charCount: code.length,
      linesCount: code.split("\n").length,
      language: this.detectLanguage(code),
      processingTime: response.processingTime || response.processing_time || null,
    };
  },

  /**
   * 설명 텍스트 포맷팅
   */
  formatExplanationText(explanation) {
    if (!explanation) {
      return "";
    }

    // 마크다운 스타일 텍스트 처리
    return explanation
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`(.*?)`/g, '<code class="inline-code">$1</code>')
      .replace(/\n\n/g, "</p><p>")
      .replace(/^\s*/, "<p>")
      .replace(/\s*$/, "</p>");
  },

  /**
   * 언어 감지
   */
  detectLanguage(code) {
    if (!code) {
      return "text";
    }

    if (code.includes("def ") || code.includes("import ") || code.includes("print(")) {
      return "Python";
    }
    if (code.includes("function ") || code.includes("const ") || code.includes("console.log")) {
      return "JavaScript";
    }
    if (code.includes("SELECT ") || code.includes("INSERT ") || code.includes("UPDATE ")) {
      return "SQL";
    }
    return "Code";
  },

  /**
   * CSS 클래스용 언어 감지
   */
  detectLanguageClass(code) {
    const language = this.detectLanguage(code).toLowerCase();
    return `language-${language}`;
  },

  /**
   * 부모 컨테이너 표시 (새로운 메서드)
   */
  ensureParentVisibility(element) {
    if (!element) {
      return;
    }

    let parent = element.parentElement;
    while (parent && parent !== document.body) {
      if (
        parent.classList.contains("response-content") ||
        parent.classList.contains("tab-content") ||
        parent.classList.contains("response-section")
      ) {
        this.forceElementVisibility(parent);
      }
      parent = parent.parentElement;
    }
  },

  /**
   * 복사 버튼 활성화 (새로운 메서드)
   */

  /**
   * HTML 이스케이프 (새로운 메서드)
   */
  escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  },

  /**
   * 속성용 이스케이프 (새로운 메서드)
   */
  escapeForAttribute(unsafe) {
    return unsafe
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;")
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r");
  },

  /**
   * 간단한 Syntax Highlighting 적용
   */
  applySyntaxHighlighting(code, language) {
    if (!code || !language) {
      return this.escapeHtml(code);
    }

    const normalizedLanguage = language.toLowerCase();
    let highlightedCode = this.escapeHtml(code);

    switch (normalizedLanguage) {
      case "python":
        highlightedCode = this.highlightPython(highlightedCode);
        break;
      case "javascript":
        highlightedCode = this.highlightJavaScript(highlightedCode);
        break;
      case "sql":
        highlightedCode = this.highlightSQL(highlightedCode);
        break;
      default:
        highlightedCode = this.highlightGeneric(highlightedCode);
        break;
    }

    return highlightedCode;
  },

  /**
   * Python 코드 하이라이팅
   */
  highlightPython(code) {
    return (
      code
        // Python 키워드
        .replace(
          /\b(def|class|if|elif|else|while|for|try|except|finally|with|import|from|as|return|yield|lambda|and|or|not|in|is|None|True|False|pass|break|continue|global|nonlocal|async|await)\b/g,
          '<span class="keyword">$1</span>'
        )
        // 내장 함수
        .replace(
          /\b(print|len|range|enumerate|zip|map|filter|sorted|sum|max|min|abs|round|type|str|int|float|bool|list|tuple|dict|set)\b(?=\s*\()/g,
          '<span class="builtin">$1</span>'
        )
        // 함수 정의
        .replace(
          /def\s+<span class="keyword">def<\/span>\s+(\w+)/g,
          'def <span class="function">$1</span>'
        )
        .replace(/def\s+(\w+)/g, 'def <span class="function">$1</span>')
        // 문자열 (작은따옴표)
        .replace(/'([^'\\]|\\.)*'/g, '<span class="string">$&</span>')
        // 문자열 (큰따옴표)
        .replace(/"([^"\\]|\\.)*"/g, '<span class="string">$&</span>')
        // 숫자
        .replace(/\b\d+\.?\d*\b/g, '<span class="number">$&</span>')
        // 주석
        .replace(/#.*/g, '<span class="comment">$&</span>')
    );
  },

  /**
   * JavaScript 코드 하이라이팅
   */
  highlightJavaScript(code) {
    return (
      code
        // JavaScript 키워드
        .replace(
          /\b(function|var|let|const|if|else|while|for|try|catch|finally|return|break|continue|switch|case|default|class|extends|constructor|static|async|await|import|export|from|as|new|this|super|typeof|instanceof|in|of|delete|void|null|undefined|true|false)\b/g,
          '<span class="keyword">$1</span>'
        )
        // 함수 선언
        .replace(
          /function\s+<span class="keyword">function<\/span>\s+(\w+)/g,
          'function <span class="function">$1</span>'
        )
        .replace(/function\s+(\w+)/g, 'function <span class="function">$1</span>')
        // 화살표 함수
        .replace(/(\w+)\s*=>\s*/g, '<span class="function">$1</span> => ')
        // 문자열 (작은따옴표)
        .replace(/'([^'\\]|\\.)*'/g, '<span class="string">$&</span>')
        // 문자열 (큰따옴표)
        .replace(/"([^"\\]|\\.)*"/g, '<span class="string">$&</span>')
        // 템플릿 리터럴
        .replace(/`([^`\\]|\\.)*`/g, '<span class="string">$&</span>')
        // 숫자
        .replace(/\b\d+\.?\d*\b/g, '<span class="number">$&</span>')
        // 주석 (한 줄)
        .replace(/\/\/.*/g, '<span class="comment">$&</span>')
        // 주석 (여러 줄)
        .replace(/\/\*[\s\S]*?\*\//g, '<span class="comment">$&</span>')
    );
  },

  /**
   * SQL 코드 하이라이팅
   */
  highlightSQL(code) {
    return (
      code
        // SQL 키워드
        .replace(
          /\b(SELECT|FROM|WHERE|JOIN|INNER|LEFT|RIGHT|FULL|OUTER|ON|GROUP|BY|ORDER|HAVING|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|DATABASE|INDEX|ALTER|DROP|PRIMARY|KEY|FOREIGN|REFERENCES|NOT|NULL|UNIQUE|DEFAULT|AUTO_INCREMENT|VARCHAR|INT|INTEGER|BIGINT|FLOAT|DOUBLE|DECIMAL|DATE|TIME|DATETIME|TIMESTAMP|TEXT|BLOB|TRUE|FALSE)\b/gi,
          '<span class="keyword">$&</span>'
        )
        // 문자열
        .replace(/'([^'\\]|\\.)*'/g, '<span class="string">$&</span>')
        .replace(/"([^"\\]|\\.)*"/g, '<span class="string">$&</span>')
        // 숫자
        .replace(/\b\d+\.?\d*\b/g, '<span class="number">$&</span>')
        // 주석
        .replace(/--.*$/gm, '<span class="comment">$&</span>')
        .replace(/\/\*[\s\S]*?\*\//g, '<span class="comment">$&</span>')
    );
  },

  /**
   * 일반 코드 하이라이팅
   */
  highlightGeneric(code) {
    return (
      code
        // 일반적인 키워드들
        .replace(
          /\b(if|else|while|for|function|class|return|import|export|var|let|const|def|try|catch|finally|switch|case|break|continue)\b/g,
          '<span class="keyword">$1</span>'
        )
        // 문자열
        .replace(/'([^'\\]|\\.)*'/g, '<span class="string">$&</span>')
        .replace(/"([^"\\]|\\.)*"/g, '<span class="string">$&</span>')
        // 숫자
        .replace(/\b\d+\.?\d*\b/g, '<span class="number">$&</span>')
        // 주석 패턴들
        .replace(/#.*/g, '<span class="comment">$&</span>')
        .replace(/\/\/.*/g, '<span class="comment">$&</span>')
        .replace(/\/\*[\s\S]*?\*\//g, '<span class="comment">$&</span>')
    );
  },

  // 빈 상태 초기화 처리 (개선된 DOM 타이밍 및 가시성 처리)
  async handleInitializeEmptyStates(message) {
    console.log("🎯 빈 상태 초기화 요청 처리");
    console.log("🎯 메시지 내용:", message);

    try {
      // DOM 준비 대기 (더 강력한 대기 로직)
      await this.waitForDOMReady();

      // 응답 컨테이너 찾기 (재시도 로직 포함)
      const responseContent = await this.getResponseElementWithRetry();
      if (!responseContent) {
        console.error("❌ response-content 요소를 찾을 수 없음 (재시도 후에도)");
        return;
      }

      console.log("🔍 현재 response-content 내용:", {
        innerHTML: responseContent.innerHTML.substring(0, 200),
        hasEmptyState: !!responseContent.querySelector(".claude-empty-state"),
        display: responseContent.style.display,
        visibility: responseContent.style.visibility,
        opacity: responseContent.style.opacity,
        offsetHeight: responseContent.offsetHeight,
        offsetWidth: responseContent.offsetWidth,
      });

      // 응답 컨테이너 강제 표시
      messageQueue.forceElementVisibility(responseContent);

      // 기본 빈 상태 HTML 확인 - 이미 HTML에 있으므로 단순히 표시만 확인
      let emptyState = responseContent.querySelector(".claude-empty-state");
      if (emptyState) {
        messageQueue.forceElementVisibility(emptyState);
        console.log("✅ 기존 빈 상태 요소 강제 표시");
      } else {
        console.warn("⚠️ 빈 상태 요소가 없어서 새로 생성");
        const emptyStateHtml = `
          <div class="claude-empty-state">
            <div class="empty-icon">💭</div>
            <div class="empty-message">질문을 입력하고 전송 버튼을 눌러보세요</div>
            <div class="empty-submessage">HAPA가 맞춤형 코드를 생성해드립니다</div>
          </div>
        `;
        responseContent.innerHTML = emptyStateHtml;
        emptyState = responseContent.querySelector(".claude-empty-state");
      }

      // 기타 상태 요소들 숨기기
      const streamingIndicator = document.getElementById("streamingIndicator");
      const errorMessage = document.getElementById("errorMessage");

      if (streamingIndicator) {
        streamingIndicator.style.display = "none";
      }
      if (errorMessage) {
        errorMessage.style.display = "none";
      }

      // 응답 탭 활성화 및 부모 요소들 표시
      messageQueue.activateResponseTab();
      messageQueue.ensureParentVisibility(responseContent);

      // DOM 강제 레이아웃 재계산
      responseContent.offsetHeight;
      if (emptyState) {
        emptyState.offsetHeight;
      }

      // 최종 상태 검증 (더 긴 대기)
      await new Promise(resolve => setTimeout(resolve, 200));

      const finalCheck = {
        responseContentVisible: responseContent.offsetHeight > 0,
        emptyStateVisible: emptyState ? emptyState.offsetHeight > 0 : false,
        responseContentHTML: responseContent.innerHTML.substring(0, 100),
        responseContentStyles: {
          display: responseContent.style.display,
          visibility: responseContent.style.visibility,
          opacity: responseContent.style.opacity,
        },
      };
      console.log("🔍 최종 빈 상태 검증:", finalCheck);

      if (!finalCheck.responseContentVisible || !finalCheck.emptyStateVisible) {
        console.warn("⚠️ 빈 상태가 여전히 보이지 않음, 긴급 복구 시도");
        await this.emergencyEmptyStateRecovery(responseContent);
      }

      console.log("✅ 빈 상태 초기화 완료");
    } catch (error) {
      console.error("❌ 빈 상태 초기화 실패:", error);
      // 실패 시 긴급 복구 시도
      this.emergencyEmptyStateRecovery(document.getElementById("response-content"));
    }
  },

  // DOM 준비 대기 (개선된 버전)
  async waitForDOMReady() {
    if (document.readyState === "complete") {
      // DOM이 준비되었어도 스타일과 레이아웃 적용을 위해 짧은 대기
      await new Promise(resolve => setTimeout(resolve, 50));
      return;
    }

    return new Promise(resolve => {
      const timeout = setTimeout(() => {
        console.warn("⚠️ DOM 준비 타임아웃, 강제 진행");
        resolve();
      }, 3000); // 3초 타임아웃

      const checkReady = () => {
        if (document.readyState === "complete") {
          clearTimeout(timeout);
          // 추가 대기로 레이아웃 완료 보장
          setTimeout(resolve, 100);
        } else {
          setTimeout(checkReady, 10);
        }
      };
      checkReady();
    });
  },

  // 응답 요소 재시도 로직 (개선된 버전)
  async getResponseElementWithRetry() {
    for (let i = 0; i < 15; i++) {
      const element = document.getElementById("response-content");
      if (element) {
        // 요소가 실제로 렌더링되고 접근 가능한지 확인
        if (element.offsetParent !== null || element.offsetHeight > 0 || element.offsetWidth > 0) {
          return element;
        }
        // 요소는 있지만 아직 렌더링되지 않은 경우
        console.log(`🔄 요소 발견했지만 렌더링 대기 중... (시도 ${i + 1}/15)`);
      }

      // 점진적으로 대기 시간 증가
      const waitTime = Math.min(50 + i * 10, 200);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    // 최후의 수단: 요소가 있기만 하면 반환
    const element = document.getElementById("response-content");
    if (element) {
      console.warn("⚠️ 요소를 찾았지만 렌더링 상태 불확실");
      return element;
    }

    return null;
  },

  // 긴급 빈 상태 복구
  async emergencyEmptyStateRecovery(responseContent) {
    console.log("🚨 긴급 빈 상태 복구 시작");

    if (!responseContent) {
      responseContent = document.getElementById("response-content");
    }

    if (!responseContent) {
      console.error("❌ 긴급 복구도 실패: response-content 요소 없음");
      return;
    }

    // 강제 HTML 재설정
    responseContent.innerHTML = `
      <div class="claude-empty-state" style="display: block !important; visibility: visible !important; opacity: 1 !important;">
        <div class="empty-icon">💭</div>
        <div class="empty-message">질문을 입력하고 전송 버튼을 눌러보세요</div>
        <div class="empty-submessage">HAPA가 맞춤형 코드를 생성해드립니다</div>
      </div>
    `;

    // 강제 스타일 적용
    responseContent.style.cssText = `
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
      position: relative !important;
      z-index: 1 !important;
      min-height: 200px !important;
      background: var(--vscode-editor-background) !important;
    `;

    // 부모 요소들도 강제 표시
    let parent = responseContent.parentElement;
    while (parent && parent !== document.body) {
      parent.style.display = "block";
      parent.style.visibility = "visible";
      parent.style.opacity = "1";
      parent = parent.parentElement;
    }

    console.log("✅ 긴급 빈 상태 복구 완료");
  },

  // 응답 상태 복원 처리
  async handleRestoreResponse(message) {
    console.log("🔄 응답 상태 복원 시작");
    console.log("🔄 복원할 응답 데이터:", message.response);

    try {
      const response = message.response;
      if (!response || !response.generated_code) {
        console.warn("⚠️ 복원할 응답 데이터가 유효하지 않음");
        // 복원 실패 시 빈 상태로 fallback
        return this.handleInitializeEmptyStates({});
      }

      // 응답 컨테이너 찾기
      const responseContent = document.getElementById("response-content");
      if (!responseContent) {
        console.warn("⚠️ response-content 요소를 찾을 수 없음");
        return;
      }

      // 응답 탭 활성화
      messageQueue.activateResponseTab();

      // 응답 렌더링
      const renderedContent = messageQueue.renderAIResponse(response);
      responseContent.innerHTML = renderedContent;

      // 강제 표시
      messageQueue.forceElementVisibility(responseContent);
      messageQueue.ensureParentVisibility(responseContent);

      // 복사 버튼 활성화
      messageQueue.activateCopyButton(response.generated_code);

      // 스트리밍 관련 요소들 숨기기
      const streamingIndicator = document.getElementById("streamingIndicator");
      const errorMessage = document.getElementById("errorMessage");

      if (streamingIndicator) {
        streamingIndicator.style.display = "none";
      }
      if (errorMessage) {
        errorMessage.style.display = "none";
      }

      console.log("✅ 응답 상태 복원 완료");
    } catch (error) {
      console.error("❌ 응답 상태 복원 실패:", error);
      // 복원 실패 시 빈 상태로 fallback
      this.handleInitializeEmptyStates({});
    }
  },

  // 히스토리 동기화 처리 (개선)
  async handleSyncHistory(message) {
    console.log("📚 히스토리 동기화 시작");

    try {
      const historyData = JSON.parse(message.history);
      const metadata = message.metadata || {};

      console.log("📚 히스토리 데이터:", {
        count: historyData.length,
        source: metadata.source,
        timestamp: metadata.timestamp,
        isExpandedView: window.isExpandedView,
      });

      // 히스토리 컨테이너 찾기 (재시도 메커니즘 포함)
      const historyContainer = await this.waitForElement("historyContent", 5000);
      if (!historyContainer) {
        console.warn("⚠️ 히스토리 컨테이너를 찾을 수 없음");

        // 확장 뷰에서 컨테이너를 찾지 못한 경우 강제로 다시 요청
        if (window.isExpandedView) {
          console.log("🔄 확장 뷰에서 컨테이너를 찾지 못함 - 1초 후 재시도");
          setTimeout(() => {
            requestLatestHistory();
          }, 1000);
        }
        return;
      }

      // 기존 히스토리와 비교하여 변경사항 확인
      const currentHistoryHTML = historyContainer.innerHTML;
      const isEmptyOrLoading =
        currentHistoryHTML.includes("히스토리를 불러오는 중") ||
        currentHistoryHTML.includes("아직 질문 기록이 없습니다") ||
        currentHistoryHTML.includes("MongoDB에서 최신 기록을 불러오는 중");

      // 확장 뷰에서는 항상 최신 데이터로 업데이트 (강제)
      const forceUpdate = window.isExpandedView || isEmptyOrLoading;

      // 히스토리 항목이 있는지 확인
      if (!historyData || historyData.length === 0) {
        console.log("📚 히스토리가 비어있음");
        historyContainer.innerHTML = `
          <div class="empty-history">
            <div class="empty-history-icon">📝</div>
            <div class="empty-history-message">아직 질문 기록이 없습니다</div>
            <div class="empty-history-submessage">질문을 하면 여기에 기록이 표시됩니다</div>
          </div>
        `;
        return;
      }

      // 히스토리 HTML 생성 (개선된 버전)
      const historyHTML = this.generateHistoryHTML(historyData);

      // 애니메이션 효과와 함께 업데이트
      if (isEmptyOrLoading) {
        // 빈 상태에서 데이터 로드 시 페이드인 효과
        historyContainer.style.opacity = "0";
        historyContainer.innerHTML = historyHTML;

        // 페이드인 애니메이션
        requestAnimationFrame(() => {
          historyContainer.style.transition = "opacity 0.3s ease-in-out";
          historyContainer.style.opacity = "1";
        });
      } else {
        // 기존 데이터 업데이트 시 부드러운 전환
        historyContainer.innerHTML = historyHTML;
      }

      // 스크롤 위치 복원 (새로운 항목이 추가된 경우 최상단으로)
      if (metadata.source === "newItem") {
        historyContainer.scrollTop = 0;
      }

      console.log("✅ 히스토리 동기화 완료:", historyData.length, "개 항목");

      // 동기화 완료 이벤트 발생
      this.dispatchHistorySyncEvent(historyData.length);
    } catch (error) {
      console.error("❌ 히스토리 동기화 실패:", error);

      // 에러 시 기본 메시지 표시
      const historyContainer = document.getElementById("historyContent");
      if (historyContainer) {
        historyContainer.innerHTML = `
          <div class="empty-history">
            <div class="empty-history-icon">⚠️</div>
            <div class="empty-history-message">히스토리를 불러올 수 없습니다</div>
            <div class="empty-history-submessage">
              <button onclick="refreshHistory()" class="retry-btn">🔄 다시 시도</button>
            </div>
          </div>
        `;
      }
    }
  },

  /**
   * 요소가 DOM에 나타날 때까지 대기 (신규 추가)
   */
  async waitForElement(elementId, timeout = 5000) {
    return new Promise(resolve => {
      const startTime = Date.now();

      const checkElement = () => {
        const element = document.getElementById(elementId);

        if (element) {
          console.log(`✅ 요소 '${elementId}' 찾음 (${Date.now() - startTime}ms)`);
          resolve(element);
          return;
        }

        if (Date.now() - startTime > timeout) {
          console.warn(`⚠️ 요소 '${elementId}' 타임아웃 (${timeout}ms)`);
          resolve(null);
          return;
        }

        // 50ms 후 재시도
        setTimeout(checkElement, 50);
      };

      checkElement();
    });
  },

  /**
   * 히스토리 HTML 생성 (개선된 버전)
   */
  generateHistoryHTML(historyData) {
    // **🆕 데이터 검증 및 필터링**
    const validHistoryData = this.filterValidHistoryData(historyData);

    if (!validHistoryData || validHistoryData.length === 0) {
      return `
        <div class="empty-history">
          <div class="empty-history-icon">📝</div>
          <div class="empty-history-message">사용 가능한 기록이 없습니다</div>
          <div class="empty-history-submessage">질문을 하면 여기에 기록이 표시됩니다</div>
        </div>
      `;
    }

    // 히스토리 항목들 (질문 입력창과 완전히 동일한 스타일)
    const historyItems = validHistoryData
      .map((item, index) => {
        // **🆕 안전한 타임스탬프 처리**
        const timestamp = this.formatTimestampSafely(item.timestamp);

        // **🆕 질문과 응답 텍스트 처리 개선**
        const questionText = this.cleanAndTruncateText(item.question, 120);
        const responseText = this.cleanAndTruncateText(item.response, 120);

        // **🆕 응답 상태 확인**
        const hasResponse = item.response && item.response.trim().length > 0;
        const isValidResponse = hasResponse && !this.isCorruptedResponse(item.response);

        return `
        <div class="history-item unified-history-card" 
             data-index="${index}" 
             data-timestamp="${item.timestamp}"
             onclick="loadHistoryItem(${index})">
             
          <!-- 질문 섹션 -->
          <div class="question-section">
            <div class="section-header">
              <div class="section-label">
                <span class="label-icon">❓</span>
                <span class="label-text">질문</span>
              </div>
              <div class="section-time">${timestamp}</div>
            </div>
            <div class="section-content">
              <div class="content-text" title="${this.escapeHtml(item.question)}">
                ${this.escapeHtml(questionText)}
              </div>
            </div>
          </div>
          
          <!-- 응답 섹션 -->
          <div class="response-section">
            <div class="section-header">
              <div class="section-label">
                <span class="label-icon">${isValidResponse ? "🤖" : "⚠️"}</span>
                <span class="label-text">AI 응답</span>
              </div>
            </div>
            <div class="section-content">
              <div class="content-text" title="${this.escapeHtml(item.response || "")}">
                ${
                  isValidResponse
                    ? this.escapeHtml(responseText)
                    : hasResponse
                      ? '<span class="error-text">응답에 오류가 있습니다</span>'
                      : '<span class="pending-text">응답을 기다리는 중...</span>'
                }
              </div>
            </div>
          </div>
        </div>
      `;
      })
      .join("");

    return `<div class="history-items-container">${historyItems}</div>`;
  },

  /**
   * 🆕 히스토리 데이터 검증 및 필터링
   */
  filterValidHistoryData(historyData) {
    if (!Array.isArray(historyData)) {
      console.warn("⚠️ 히스토리 데이터가 배열이 아님:", typeof historyData);
      return [];
    }

    return historyData
      .filter(item => {
        // 필수 필드 확인
        if (!item || !item.question || typeof item.question !== "string") {
          console.log("🗑️ 필수 필드 누락된 항목 제거:", item);
          return false;
        }

        // 손상된 질문 필터링
        if (this.isCorruptedResponse(item.question)) {
          console.log("🗑️ 손상된 질문 제거:", item.question.substring(0, 50));
          return false;
        }

        // 너무 짧은 질문 필터링
        if (item.question.trim().length < 3) {
          console.log("🗑️ 너무 짧은 질문 제거:", item.question);
          return false;
        }

        // 테스트 데이터 필터링 (선택적)
        if (item.question.includes("(예시)") && window.location.href.includes("production")) {
          console.log("🗑️ 프로덕션 환경에서 예시 데이터 제거");
          return false;
        }

        return true;
      })
      .slice(0, 50); // 최대 50개로 제한
  },

  /**
   * 🆕 손상된 응답 감지
   */
  isCorruptedResponse(text) {
    if (!text || typeof text !== "string") return false;

    const corruptedPatterns = [
      /Thereis\s+a\s+settings\s+menu/i,
      /from\s+__future__\s+import.*settings/i,
      /APT_STRING.*import/i,
      /boolean.*string.*path.*import/i,
      /Global.*reduce_button/i,
      /Gen\s+references:/i,
      /pandas\._libs/i,
      /timestamp_format_regex/i,
    ];

    return corruptedPatterns.some(pattern => pattern.test(text));
  },

  /**
   * 🆕 텍스트 정리 및 잘라내기
   */
  cleanAndTruncateText(text, maxLength = 100) {
    if (!text || typeof text !== "string") return "";

    // 불필요한 공백 및 특수문자 정리
    let cleaned = text
      .replace(/\s+/g, " ") // 연속 공백 정리
      .replace(/^\s+|\s+$/g, "") // 앞뒤 공백 제거
      .replace(/[\r\n\t]/g, " "); // 줄바꿈 등을 공백으로 변환

    // 길이 제한
    if (cleaned.length > maxLength) {
      cleaned = cleaned.substring(0, maxLength) + "...";
    }

    return cleaned;
  },

  /**
   * 🆕 안전한 타임스탬프 포맷팅 (정확한 시간 표시)
   */
  formatTimestampSafely(timestamp) {
    try {
      if (!timestamp) return "시간 정보 없음";

      // 다양한 타임스탬프 형식 지원
      let date;

      if (typeof timestamp === "string") {
        // ISO 형식 확인
        if (timestamp.includes("T") || timestamp.includes("Z")) {
          date = new Date(timestamp);
        }
        // 한국어 로케일 형식 확인
        else if (timestamp.includes("년") || timestamp.includes("월") || timestamp.includes("일")) {
          // 한국어 날짜 파싱 시도
          const koreanDatePattern =
            /(\d{4}).*?(\d{1,2}).*?(\d{1,2}).*?(\d{1,2}):(\d{1,2}):(\d{1,2})/;
          const match = timestamp.match(koreanDatePattern);
          if (match) {
            const [, year, month, day, hour, minute, second] = match;
            date = new Date(year, month - 1, day, hour, minute, second);
          } else {
            date = new Date(timestamp);
          }
        }
        // 기타 형식
        else {
          date = new Date(timestamp);
        }
      } else if (typeof timestamp === "number") {
        date = new Date(timestamp);
      } else {
        date = new Date(timestamp);
      }

      // 유효성 확인
      if (isNaN(date.getTime())) {
        console.warn("⚠️ 잘못된 타임스탬프:", timestamp);
        return "날짜 오류";
      }

      // **🆕 정확한 시간 표시 우선, 상대적 시간은 보조**
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      // 오늘 날짜인지 확인
      const isToday = date.toDateString() === now.toDateString();

      if (isToday) {
        // 오늘이면 시간만 표시 + 상대적 시간
        const timeStr = date.toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });

        if (diffMinutes < 1) {
          return `${timeStr} (방금 전)`;
        } else if (diffMinutes < 60) {
          return `${timeStr} (${diffMinutes}분 전)`;
        } else if (diffHours < 24) {
          return `${timeStr} (${diffHours}시간 전)`;
        } else {
          return timeStr;
        }
      } else {
        // 다른 날이면 날짜 + 시간 표시
        if (diffDays < 7) {
          // 일주일 이내면 상대적 날짜도 표시
          const dateTimeStr = date.toLocaleString("ko-KR", {
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          });
          return `${dateTimeStr} (${diffDays}일 전)`;
        } else {
          // 일주일 이후면 정확한 날짜/시간만 표시
          return date.toLocaleString("ko-KR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          });
        }
      }
    } catch (error) {
      console.error("❌ 타임스탬프 포맷팅 오류:", error, "원본:", timestamp);
      return "시간 정보 오류";
    }
  },

  /**
   * 히스토리 동기화 이벤트 발생 (신규 추가)
   */
  dispatchHistorySyncEvent(itemCount) {
    const event = new CustomEvent("historySynced", {
      detail: {
        itemCount: itemCount,
        timestamp: Date.now(),
        source: window.isExpandedView ? "expandedView" : "sidebar",
      },
    });

    window.dispatchEvent(event);
  },

  /**
   * DOM 준비 상태 확인 (신규 추가)
   */
  async handleCheckDOMReady(message) {
    console.log("🔍 DOM 준비 상태 확인:", message.retryCount);

    const historyContainer = document.getElementById("historyContent");
    const responseContainer = document.getElementById("response-content");

    const isReady = historyContainer && responseContainer;

    console.log(`📋 DOM 상태:`, {
      historyContainer: !!historyContainer,
      responseContainer: !!responseContainer,
      isReady: isReady,
    });

    // 준비 완료 응답 전송
    vscode.postMessage({
      command: "domReadyStatus",
      isReady: isReady,
      retryCount: message.retryCount,
    });
  },

  /**
   * UI 상태 동기화 (신규 추가)
   */
  async handleSyncUIState(message) {
    console.log("🎨 UI 상태 동기화:", message.uiState);

    try {
      const { activeTab, selectedModel } = message.uiState;

      // 탭 상태 동기화
      if (activeTab) {
        switchTab(activeTab);
      }

      // 모델 선택 상태 동기화
      if (selectedModel && window.selectedModel !== selectedModel) {
        window.selectedModel = selectedModel;

        // 모델 탭 UI 업데이트
        const modelTabs = document.querySelectorAll(".model-tab");
        modelTabs.forEach(tab => {
          tab.classList.remove("active");
          if (tab.getAttribute("data-model") === selectedModel) {
            tab.classList.add("active");
          }
        });
      }

      console.log("✅ UI 상태 동기화 완료");
    } catch (error) {
      console.error("❌ UI 상태 동기화 실패:", error);
    }
  },
};

// ============================================================================
// 히스토리 관련 전역 함수들
// ============================================================================

/**
 * 히스토리 새로고침 (DB에서 다시 로드)
 */
function refreshHistory() {
  console.log("🔄 히스토리 새로고침 요청");

  // 새로고침 버튼 비활성화
  const refreshBtn = document.querySelector(".history-refresh-btn");
  if (refreshBtn) {
    refreshBtn.disabled = true;
    refreshBtn.textContent = "🔄 새로고침 중...";
  }

  // VSCode 확장에 새로고침 메시지 전송
  vscode.postMessage({
    command: "refreshHistory",
  });

  // 3초 후 버튼 복원
  setTimeout(() => {
    if (refreshBtn) {
      refreshBtn.disabled = false;
      refreshBtn.textContent = "🔄 새로고침";
    }
  }, 3000);
}

/**
 * 히스토리 항목 복원
 */
function restoreHistoryItem(timestamp) {
  console.log("🔄 히스토리 항목 복원:", timestamp);
  // 복원 기능 구현 (향후 확장)
  vscode.postMessage({
    command: "restoreHistoryItem",
    timestamp: timestamp,
  });
}

/**
 * 최신 히스토리 요청 (확장 뷰 전용)
 */
function requestLatestHistory() {
  console.log("📊 최신 히스토리 데이터 요청 (MongoDB)");

  try {
    // 1. 히스토리 컨테이너에 로딩 표시
    const historyContainer = document.getElementById("historyContent");
    if (historyContainer) {
      historyContainer.innerHTML = `
        <div class="history-loading">
          <div class="loading-spinner">🔄</div>
          <div class="loading-message">MongoDB에서 최신 기록을 불러오는 중...</div>
        </div>
      `;
    }

    // 2. VSCode Extension에 최신 히스토리 요청
    vscode.postMessage({
      command: "refreshHistory",
    });

    // 3. 동시에 직접 히스토리 요청도 보냄 (이중 보장)
    setTimeout(() => {
      vscode.postMessage({
        command: "getHistory",
      });
    }, 100);

    console.log("✅ 히스토리 요청 메시지 전송 완료");
  } catch (error) {
    console.error("❌ 히스토리 요청 실패:", error);

    // 오류 시 폴백 메시지 표시
    const historyContainer = document.getElementById("historyContent");
    if (historyContainer) {
      historyContainer.innerHTML = `
        <div class="history-error">
          <div class="error-icon">⚠️</div>
          <div class="error-message">히스토리를 불러올 수 없습니다</div>
          <button onclick="requestLatestHistory()" class="retry-btn">다시 시도</button>
        </div>
      `;
    }
  }
}

/**
 * 히스토리 항목 삭제
 */
function deleteHistoryItem(timestamp) {
  console.log("🗑️ 히스토리 항목 삭제:", timestamp);
  // 삭제 기능 구현 (향후 확장)
  vscode.postMessage({
    command: "deleteHistoryItem",
    timestamp: timestamp,
  });
}

// ============================================================================
// 주요 이벤트 핸들러들
// ============================================================================

/**
 * 질문 제출 처리 (상태 관리 강화)
 */
function submitQuestion() {
  console.log("🔍 submitQuestion 호출 - DOM 상태 확인 시작");

  // DOM 요소 확인 - 올바른 ID 사용
  const questionInput = document.getElementById("questionInput");
  console.log("📝 입력 필드 확인:", {
    elementExists: !!questionInput,
    elementType: questionInput ? questionInput.tagName : "null",
    elementId: questionInput ? questionInput.id : "null",
    hasValue: questionInput ? !!questionInput.value : false,
    rawValue: questionInput ? questionInput.value : "null",
    valueLength: questionInput ? questionInput.value.length : 0,
  });

  const question = questionInput ? questionInput.value.trim() : "";
  console.log("🎯 질문 처리 결과:", {
    hasInput: !!questionInput,
    rawValue: questionInput ? `"${questionInput.value}"` : "null",
    trimmedValue: `"${question}"`,
    questionLength: question.length,
    isEmpty: !question,
    isTooShort: question.length < 3,
    currentState: streamingManager ? streamingManager.currentState : "undefined",
  });

  // 추가 DOM 디버깅
  const allInputs = document.querySelectorAll("input, textarea");
  console.log(
    "🔍 페이지의 모든 입력 요소:",
    Array.from(allInputs).map(el => ({
      tagName: el.tagName,
      id: el.id,
      value: el.value,
      placeholder: el.placeholder,
    }))
  );

  // 질문 검증 로직 개선 (더 관대한 검증)
  if (!question || question.trim().length === 0) {
    console.warn("⚠️ 빈 질문 - 사용자에게 알림");
    console.warn("⚠️ 검증 실패 상세:", {
      questionExists: !!question,
      questionLength: question.length,
      trimmedLength: question.trim().length,
      actualQuestion: `"${question}"`,
    });

    // 알림 메시지 표시 (alert 대신 DOM 메시지 사용)
    const messageDiv = document.createElement("div");
    messageDiv.style.cssText =
      "color: red; margin: 10px 0; padding: 10px; background: #fee; border: 1px solid #fcc; border-radius: 4px;";
    messageDiv.textContent = "질문을 입력해주세요.";

    const formElement = questionInput
      ? questionInput.closest("form") || questionInput.parentElement
      : null;
    if (formElement) {
      formElement.appendChild(messageDiv);

      // 3초 후 메시지 제거
      setTimeout(() => {
        if (messageDiv.parentNode) {
          messageDiv.parentNode.removeChild(messageDiv);
        }
      }, 3000);
    }

    return;
  }

  console.log("✅ 질문 검증 통과:", {
    question: question,
    length: question.length,
    trimmedLength: question.trim().length,
  });

  // 이미 스트리밍 중인 경우 처리
  if (streamingManager.isActive()) {
    console.warn("⚠️ 이미 스트리밍 진행 중:", streamingManager.getInfo());
    alert("현재 코드 생성이 진행 중입니다. 잠시 후 다시 시도해주세요.");
    return;
  }

  console.log("📝 질문 제출:", question);
  console.log("🎯 선택된 모델:", window.selectedModel);

  // 이전 에러 메시지 정리 (새로운 요청 시작 시)
  streamingManager.clearErrorMessages();

  // ✅ 수정: 스트리밍 상태 초기화 (STARTING 상태는 handleStreamingStarted에서 설정)
  requestStartTime = Date.now();
  currentStreamingContent = "";
  streamingSequence = 0;

  // 버튼 상태 변경
  const generateBtn = document.getElementById("generate-btn");
  if (generateBtn) {
    generateBtn.disabled = true;
    generateBtn.textContent = "생성 중...";
    console.log("✅ 생성 버튼 비활성화됨");
  }

  // 모델 타입 매핑 - Backend ModelType과 완전 일치
  const modelMapping = {
    autocomplete: "code_completion",
    prompt: "code_generation",
    comment: "code_explanation",
    error_fix: "bug_fix",
    review: "code_review",
    optimize: "code_optimization",
    test: "unit_test_generation",
    docs: "documentation",
  };

  const selectedModel = window.selectedModel || "prompt";
  const mappedModelType = modelMapping[selectedModel] || "code_generation";

  // 전송할 메시지 구조 정의
  const messageToSend = {
    command: "generateCodeStreaming",
    prompt: question,
    model_type: mappedModelType,
    timestamp: Date.now(),
  };

  console.log("📤 VSCode Extension으로 전송할 메시지:", {
    command: messageToSend.command,
    promptLength: messageToSend.prompt.length,
    modelType: messageToSend.model_type,
    timestamp: messageToSend.timestamp,
    fullMessage: messageToSend,
  });

  try {
    // VSCode Extension으로 메시지 전송
    vscode.postMessage(messageToSend);
    console.log("✅ VSCode Extension으로 메시지 전송 성공");

    // 입력 필드 정리
    if (questionInput) {
      questionInput.value = "";
      console.log("✅ 입력 필드 정리 완료");
    }

    // UI 상태 초기화
    console.log("🔄 UI 상태 초기화 시작");

    // 응답 탭 활성화
    switchTab("response");

    // 스트리밍 표시 준비
    const responseElement = document.getElementById("response-content");
    if (responseElement) {
      responseElement.innerHTML = `
        <div class="waiting-response">
          <div class="loading-animation">
            <div class="spinner"></div>
          </div>
          <p>질문을 전송했습니다. AI 응답을 기다리는 중...</p>
        </div>
      `;
      responseElement.style.display = "block";
      console.log("✅ 응답 대기 UI 설정 완료");
    }
  } catch (error) {
    console.error("❌ 메시지 전송 실패:", error);

    // 버튼 상태 복구
    if (generateBtn) {
      generateBtn.disabled = false;
      generateBtn.textContent = "코드 생성";
    }

    alert("메시지 전송에 실패했습니다. 다시 시도해주세요.");
  }
}

/**
 * 레거시 호환성을 위한 질문 제출 핸들러
 * HTML에서 호출되는 handleQuestionSubmit 함수
 */
function handleQuestionSubmit() {
  console.log("🔄 handleQuestionSubmit 호출됨 (submitQuestion으로 리다이렉트)");
  return submitQuestion();
}

/**
 * Enter 키 처리
 */
function handleKeyPress(event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    submitQuestion();
  }
}

/**
 * 페이지 새로고침
 */
function refreshPage() {
  messageQueue.cleanupStreaming();
  location.reload();
}

/**
 * 설정 페이지 열기
 */
function openSettings() {
  console.log("⚙️ 설정 버튼 클릭됨");
  try {
    vscode.postMessage({
      command: "openSettings",
    });
    console.log("✅ 설정 메시지 전송 성공");
  } catch (error) {
    console.error("❌ 설정 메시지 전송 실패:", error);
    alert("설정을 열 수 없습니다. 다시 시도해주세요.");
  }
}

/**
 * 메인 대시보드 (확장 뷰) 열기
 */
function openMainDashboard() {
  console.log("↗ 확장 버튼 클릭됨");
  try {
    vscode.postMessage({
      command: "openMainDashboard",
    });
    console.log("✅ 확장 메시지 전송 성공");
  } catch (error) {
    console.error("❌ 확장 메시지 전송 실패:", error);
    alert("확장 뷰를 열 수 없습니다. 다시 시도해주세요.");
  }
}

/**
 * 도움말 표시
 */
function showHelp() {
  console.log("❓ 도움말 버튼 클릭됨");
  try {
    vscode.postMessage({
      command: "showHelp",
    });
    console.log("✅ 도움말 메시지 전송 성공");
  } catch (error) {
    console.error("❌ 도움말 메시지 전송 실패:", error);
    alert("도움말을 표시할 수 없습니다. 다시 시도해주세요.");
  }
}

// ============================================================================
// VSCode 메시지 리스너
// ============================================================================

// 페이지 로드 즉시 디버깅 시작
console.log("🎯 HAPA 사이드바 스크립트 로드됨", {
  timestamp: new Date().toISOString(),
  location: window.location.href,
  readyState: document.readyState,
});

// VSCode API 사용 가능 여부 확인
try {
  const vscode = acquireVsCodeApi();
  console.log("✅ VSCode API 연결 성공", {
    hasPostMessage: typeof vscode.postMessage === "function",
    hasGetState: typeof vscode.getState === "function",
    hasSetState: typeof vscode.setState === "function",
  });
} catch (error) {
  console.error("❌ VSCode API 연결 실패:", error);
}

// DOM 요소 존재 확인 및 자동 확장 기능 설정
document.addEventListener("DOMContentLoaded", function () {
  console.log("🔍 DOM 요소 확인:", {
    questionInput: !!document.getElementById("questionInput"),
    responseContent: !!document.getElementById("response-content"),
    historyContent: !!document.getElementById("historyContent"),
    submitButton: !!document.getElementById("submitButton"),
    responseTab: !!document.querySelector(".tab-button[data-tab='response']"),
    historyTab: !!document.querySelector(".tab-button[data-tab='history']"),
  });

  // **🆕 질문 입력창 자동 확장 기능 설정**
  setupQuestionInputAutoResize();
});

/**
 * 🆕 개선된 질문 입력창 자동 확장 기능 설정
 */
function setupQuestionInputAutoResize() {
  const questionInput = document.getElementById("questionInput");
  if (!questionInput) {
    console.warn("⚠️ 질문 입력창을 찾을 수 없어 자동 확장 기능을 설정할 수 없습니다");
    return;
  }

  console.log("🔧 개선된 질문 입력창 자동 확장 기능 설정 중...");

  // 이전 이벤트 리스너 제거 (중복 방지)
  const existingListeners = questionInput.getAttribute("data-auto-resize");
  if (existingListeners) {
    console.log("🔄 기존 자동 크기 조절 리스너 제거");
    questionInput.removeEventListener("input", autoResize);
    questionInput.removeEventListener("paste", handlePaste);
    questionInput.removeEventListener("keydown", handleKeydown);
  }

  // 최소/최대 높이 설정
  const MIN_HEIGHT = 60;
  const MAX_HEIGHT = 400; // 증가된 최대 높이
  const LINE_HEIGHT = 20; // 예상 줄 높이

  // 개선된 자동 크기 조절 함수
  function autoResize() {
    try {
      // CSS 스타일 강제 적용 (중요도 높임)
      questionInput.style.setProperty("height", "auto", "important");
      questionInput.style.setProperty("overflow-y", "hidden", "important");

      // 스크롤 높이 계산 (패딩 포함)
      const scrollHeight = questionInput.scrollHeight;
      const computedStyle = window.getComputedStyle(questionInput);
      const paddingTop = parseInt(computedStyle.paddingTop) || 0;
      const paddingBottom = parseInt(computedStyle.paddingBottom) || 0;
      const borderTop = parseInt(computedStyle.borderTopWidth) || 0;
      const borderBottom = parseInt(computedStyle.borderBottomWidth) || 0;

      // 실제 콘텐츠 높이 계산
      const contentHeight = scrollHeight + paddingTop + paddingBottom + borderTop + borderBottom;

      // 새 높이 계산 (범위 제한)
      const newHeight = Math.min(Math.max(contentHeight, MIN_HEIGHT), MAX_HEIGHT);

      // 높이 적용
      questionInput.style.setProperty("height", newHeight + "px", "important");

      // 최대 높이 초과 시 스크롤 표시
      if (contentHeight > MAX_HEIGHT) {
        questionInput.style.setProperty("overflow-y", "auto", "important");
      } else {
        questionInput.style.setProperty("overflow-y", "hidden", "important");
      }

      console.log("📏 개선된 질문 입력창 크기 조절:", {
        scrollHeight: scrollHeight,
        contentHeight: contentHeight,
        newHeight: newHeight,
        hasScroll: contentHeight > MAX_HEIGHT,
        padding: { top: paddingTop, bottom: paddingBottom },
        border: { top: borderTop, bottom: borderBottom },
      });
    } catch (error) {
      console.error("❌ 자동 크기 조절 실패:", error);
    }
  }

  // 붙여넣기 이벤트 핸들러
  function handlePaste(e) {
    console.log("📋 텍스트 붙여넣기 감지");
    // 붙여넣기 후 DOM 업데이트 대기
    setTimeout(autoResize, 50);
  }

  // 키보드 이벤트 핸들러
  function handleKeydown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      // Enter 키로 질문 전송
      e.preventDefault();
      console.log("📤 Enter 키로 질문 전송 실행");

      // submitQuestion 함수 호출 (이벤트 리스너 통합)
      if (typeof submitQuestion === "function") {
        submitQuestion();
      } else {
        console.error("❌ submitQuestion 함수를 찾을 수 없습니다");
      }

      // 전송 후 입력창 크기 초기화
      setTimeout(() => {
        questionInput.style.setProperty("height", MIN_HEIGHT + "px", "important");
        questionInput.style.setProperty("overflow-y", "hidden", "important");
        // 주의: value 초기화는 submitQuestion에서 처리되므로 여기서는 하지 않음
      }, 100);
    } else if (e.key === "Enter" && e.shiftKey) {
      // Shift+Enter로 줄바꿈 추가 (기본 동작 허용)
      console.log("↩️ Shift+Enter로 줄바꿈 추가");
      // 줄바꿈 후 크기 조절
      setTimeout(autoResize, 10);
    } else {
      // 다른 키 입력 시 크기 조절
      setTimeout(autoResize, 10);
    }
  }

  // 입력 이벤트 핸들러
  function handleInput(e) {
    console.log("⌨️ 텍스트 입력 감지:", {
      contentLength: questionInput.value.length,
      lines: questionInput.value.split("\n").length,
    });

    // 즉시 크기 조절
    autoResize();

    // 내용이 비어있으면 최소 크기로 초기화
    if (questionInput.value.trim().length === 0) {
      setTimeout(() => {
        questionInput.style.setProperty("height", MIN_HEIGHT + "px", "important");
        questionInput.style.setProperty("overflow-y", "hidden", "important");
      }, 50);
    }
  }

  // 이벤트 리스너 등록
  questionInput.addEventListener("input", handleInput);
  questionInput.addEventListener("paste", handlePaste);
  questionInput.addEventListener("keydown", handleKeydown);

  // 포커스/블러 이벤트도 추가
  questionInput.addEventListener("focus", autoResize);
  questionInput.addEventListener("blur", autoResize);

  // 중복 방지 마킹
  questionInput.setAttribute("data-auto-resize", "true");

  // 초기 크기 설정 (약간의 지연)
  setTimeout(() => {
    questionInput.style.setProperty("height", MIN_HEIGHT + "px", "important");
    autoResize();
  }, 100);

  console.log("✅ 개선된 질문 입력창 자동 확장 기능 설정 완료");
}

// 메시지 수신 디버깅 강화
window.addEventListener("message", event => {
  console.log("📨 웹뷰 메시지 수신:", {
    command: event.data?.command,
    messageKeys: Object.keys(event.data || {}),
    origin: event.origin,
    timestamp: Date.now(),
    fullData: event.data,
  });

  // DOM 상태도 함께 로그
  console.log("🔍 현재 DOM 상태:", {
    responseElement: !!document.getElementById("response-content"),
    responseVisible: document.getElementById("response-content")?.style?.display !== "none",
    responseContent:
      document.getElementById("response-content")?.innerHTML?.substring(0, 100) + "...",
  });
});

window.addEventListener("message", event => {
  const message = event.data;

  try {
    // 메시지 큐에 추가
    messageQueue.add(message);
  } catch (error) {
    console.error("❌ 메시지 처리 실패:", error);
    messageQueue.recoverStreamingUI(error);
  }
});

// ============================================================================
// 초기화 및 테스트 데이터 설정
// ============================================================================

// 페이지 로드 시 초기화
document.addEventListener("DOMContentLoaded", function () {
  console.log("🎯 HAPA 초기화 시작");
  console.log("🔍 환경 확인:", {
    isExpandedView: window.isExpandedView,
    location: window.location.href,
  });

  // 테스트용 히스토리 데이터 추가 (개발 환경에서만)
  if (window.location.href.includes("vscode-webview")) {
    setTimeout(() => {
      addTestHistoryData();
      setupEventListeners();

      // **🆕 질문 입력창 자동 확장 기능 설정 (중요!)**
      setupQuestionInputAutoResize();

      // **🆕 확장 뷰인 경우 자동으로 최신 히스토리 요청**
      if (window.isExpandedView) {
        console.log("🔄 확장 뷰 감지 - 자동 히스토리 로드 시작");
        setTimeout(() => {
          requestLatestHistory();
        }, 1000); // DOM이 완전히 로드된 후 실행
      }

      console.log("✅ HAPA 초기화 완료 (확장 뷰:", window.isExpandedView, ")");
    }, 500);
  }
});

function addTestHistoryData() {
  try {
    console.log("📚 테스트 히스토리 데이터 추가");

    const historyContent = document.getElementById("historyContent");
    if (historyContent) {
      const testHistoryItems = [
        {
          question: "(예시) 파이썬에서 리스트를 정렬하는 방법은?",
          response: "sorted() 함수나 .sort() 메서드를 사용할 수 있습니다.",
          timestamp: new Date(Date.now() - 3600000).toISOString(), // 1시간 전
        },
        {
          question: "(예시) Django 모델에서 데이터를 조회하는 방법",
          response: "Model.objects.filter()나 Model.objects.get() 메서드를 사용합니다.",
          timestamp: new Date(Date.now() - 7200000).toISOString(), // 2시간 전
        },
        {
          question: "(예시) FastAPI에서 비동기 함수 작성법",
          response: "async def 키워드로 함수를 정의하고 await를 사용합니다.",
          timestamp: new Date(Date.now() - 10800000).toISOString(), // 3시간 전
        },
      ];

      const historyHTML = testHistoryItems
        .map(
          (item, index) => `
        <div class="history-item" onclick="loadHistoryItem(${index})">
          <div class="history-question">${item.question}</div>
          <div class="history-response">${item.response}</div>
          <div class="history-timestamp">${formatTimestamp(item.timestamp)}</div>
        </div>
      `
        )
        .join("");

      historyContent.innerHTML = historyHTML;
      console.log("✅ 테스트 히스토리 데이터 추가 완료");
    }
  } catch (error) {
    console.error("❌ 테스트 히스토리 데이터 추가 실패:", error);
  }
}

function setupEventListeners() {
  console.log("🔧 이벤트 리스너 설정");

  // 모델 탭 이벤트 리스너
  const modelTabs = document.querySelectorAll(".model-tab");
  modelTabs.forEach(tab => {
    tab.addEventListener("click", function () {
      const modelType = this.getAttribute("data-model");
      selectModelTab(modelType);
    });
  });

  // 엔터키 이벤트는 자동 크기 조절 함수에서 처리됨 (중복 방지)
  console.log("ℹ️ 질문 입력창 Enter 키 이벤트는 자동 크기 조절 함수에서 처리됩니다");

  // 코드 생성 버튼 이벤트 리스너 (중복 방지)
  const generateBtn = document.getElementById("generate-btn");
  if (generateBtn) {
    generateBtn.addEventListener("click", function (e) {
      e.preventDefault();
      submitQuestion();
    });
    console.log("✅ 코드 생성 버튼 이벤트 리스너 설정 완료");
  }

  // 탭 버튼 이벤트 리스너
  const tabBtns = document.querySelectorAll(".tab-btn");
  tabBtns.forEach(btn => {
    btn.addEventListener("click", function () {
      const tabType = this.getAttribute("data-tab");
      if (tabType) {
        switchTab(tabType);
      }
    });
  });

  // 헤더 버튼 이벤트 리스너 (onclick 속성 보완)
  const settingsBtn = document.querySelector(".settings-btn");
  if (settingsBtn) {
    settingsBtn.addEventListener("click", function (e) {
      e.preventDefault();
      openSettings();
    });
    console.log("✅ 설정 버튼 이벤트 리스너 설정 완료");
  }

  const helpBtn = document.querySelector(".help-btn");
  if (helpBtn) {
    helpBtn.addEventListener("click", function (e) {
      e.preventDefault();
      showHelp();
    });
    console.log("✅ 도움말 버튼 이벤트 리스너 설정 완료");
  }

  const expandBtn = document.querySelector(".expand-btn");
  if (expandBtn) {
    expandBtn.addEventListener("click", function (e) {
      e.preventDefault();
      openMainDashboard();
    });
    console.log("✅ 확장 버튼 이벤트 리스너 설정 완료");
  }

  console.log("✅ 이벤트 리스너 설정 완료");
}

function loadHistoryItem(index) {
  console.log("📖 히스토리 항목 로드:", index);

  try {
    // VSCode 확장에 히스토리 항목 로드 요청
    vscode.postMessage({
      command: "loadHistoryItem",
      index: index,
    });

    // 로딩 상태 표시
    const responseElement = document.getElementById("response-content");
    if (responseElement) {
      responseElement.innerHTML = `
        <div class="history-loading-state">
          <div class="loading-header">
            <div class="loading-icon">📖</div>
            <div class="loading-title">히스토리 로드 중...</div>
          </div>
          <div class="loading-content">
            <div class="loading-spinner">🔄</div>
            <div class="loading-message">선택한 대화 기록을 불러오고 있습니다</div>
          </div>
        </div>
        <style>
          .history-loading-state {
            padding: 20px;
            text-align: center;
            background: var(--hapa-input-background);
            border: 1px solid var(--hapa-input-border);
            border-radius: 8px;
            color: var(--hapa-input-foreground);
          }
          
          .loading-header {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            margin-bottom: 20px;
          }
          
          .loading-icon {
            font-size: 24px;
          }
          
          .loading-title {
            font-size: 16px;
            font-weight: 600;
            color: var(--hapa-primary);
          }
          
          .loading-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
          }
          
          .loading-spinner {
            font-size: 20px;
            animation: spin 1s linear infinite;
          }
          
          .loading-message {
            font-size: 12px;
            color: var(--hapa-description-foreground);
          }
          
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        </style>
      `;

      // 응답 탭으로 전환
      switchTab("response");
      console.log("✅ 히스토리 항목 로드 요청 전송");
    }
  } catch (error) {
    console.error("❌ 히스토리 항목 로드 실패:", error);

    // 오류 상태 표시
    const responseElement = document.getElementById("response-content");
    if (responseElement) {
      responseElement.innerHTML = `
        <div class="history-error-state">
          <div class="error-icon">⚠️</div>
          <div class="error-title">히스토리 로드 실패</div>
          <div class="error-message">선택한 기록을 불러올 수 없습니다</div>
          <button onclick="loadHistoryItem(${index})" class="retry-btn">
            🔄 다시 시도
          </button>
        </div>
        <style>
          .history-error-state {
            padding: 40px 20px;
            text-align: center;
            background: var(--hapa-input-background);
            border: 1px solid var(--hapa-error-foreground);
            border-radius: 8px;
            color: var(--hapa-error-foreground);
          }
          
          .error-icon {
            font-size: 32px;
            margin-bottom: 12px;
          }
          
          .error-title {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 8px;
          }
          
          .error-message {
            font-size: 12px;
            margin-bottom: 16px;
            color: var(--hapa-description-foreground);
          }
          
          .retry-btn {
            padding: 8px 16px;
            background: var(--hapa-button-background);
            border: 1px solid var(--hapa-button-border);
            color: var(--hapa-button-foreground);
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
          }
          
          .retry-btn:hover {
            background: var(--hapa-button-hover-background);
          }
        </style>
      `;
    }
  }
}

function formatTimestamp(timestamp) {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) {
      // 1분 미만
      return "방금 전";
    } else if (diff < 3600000) {
      // 1시간 미만
      return `${Math.floor(diff / 60000)}분 전`;
    } else if (diff < 86400000) {
      // 24시간 미만
      return `${Math.floor(diff / 3600000)}시간 전`;
    } else {
      return date.toLocaleDateString();
    }
  } catch (error) {
    return "알 수 없음";
  }
}

// ============================================================================
// 전역 함수 노출 (HTML에서 호출용)
// ============================================================================

window.selectModelTab = selectModelTab;
window.submitQuestion = submitQuestion;
window.handleKeyPress = handleKeyPress;
window.refreshPage = refreshPage;
window.openSettings = openSettings;
window.openMainDashboard = openMainDashboard;
window.showHelp = showHelp;
window.switchTab = switchTab;

// ============================================================================
// 강제 UI 업데이트 및 디버깅 함수들
// ============================================================================

function forceUpdateUI() {
  console.log("🔧 강제 UI 업데이트 시작");

  // 응답 탭 강제 활성화
  const responseTab = document.querySelector(".tab-button[data-tab='response']");
  if (responseTab) {
    responseTab.click();
    console.log("✅ 응답 탭 강제 클릭");
  }

  // 응답 콘텐츠 영역 강제 표시
  const responseContent = document.getElementById("response-content");
  if (responseContent) {
    responseContent.style.display = "block";
    responseContent.style.visibility = "visible";
    responseContent.style.opacity = "1";
    responseContent.style.height = "auto";
    responseContent.style.overflow = "auto";
    console.log("✅ 응답 콘텐츠 강제 표시");

    // **중요: 누적된 스트리밍 버퍼 내용을 UI에 업데이트**
    if (streamingBuffer && streamingBuffer.trim().length > 0) {
      try {
        // 스트리밍 버퍼 내용을 안전하게 렌더링
        const cleanedBuffer = messageQueue.cleanChunkContent(streamingBuffer);
        const processedBuffer = messageQueue.handleEndTags(cleanedBuffer);

        if (processedBuffer && processedBuffer.trim().length > 0) {
          const renderedContent = messageQueue.renderCodeSafely(processedBuffer);
          responseContent.innerHTML = renderedContent;
          console.log("✅ 스트리밍 버퍼 내용 UI 반영 완료:", {
            originalLength: streamingBuffer.length,
            cleanedLength: cleanedBuffer.length,
            processedLength: processedBuffer.length,
            rendered: true,
          });
        }
      } catch (error) {
        console.error("❌ 스트리밍 버퍼 UI 반영 오류:", error);
        // 폴백: 원본 내용을 안전하게 표시
        responseContent.innerHTML = `<pre style="white-space: pre-wrap; word-wrap: break-word; font-family: 'Consolas', 'Monaco', monospace; font-size: 12px; line-height: 1.4; padding: 8px; background: #1e1e1e; color: #d4d4d4; border-radius: 4px; overflow-x: auto;">${messageQueue.escapeHtml(
          streamingBuffer
        )}</pre>`;
        console.log("🔄 폴백으로 원본 버퍼 내용 표시");
      }
    }
  }

  // 부모 컨테이너들도 확인
  const tabContents = document.querySelectorAll(".tab-content");
  tabContents.forEach((content, index) => {
    if (content.id === "response") {
      content.style.display = "block";
      content.style.visibility = "visible";
      console.log(`✅ 응답 탭 콘텐츠 ${index} 강제 표시`);
    }
  });
}

async function showTestContent() {
  console.log("🧪 테스트 콘텐츠 표시 시작");

  try {
    // 안전한 요소 접근
    const responseContent = await getResponseElementSafely();

    if (responseContent) {
      const testContent = `
        <div style="
          padding: 20px; 
          background: linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%); 
          border: 2px solid #4fc3f7; 
          border-radius: 12px; 
          margin: 10px 0;
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(79, 195, 247, 0.3);
        ">
          <h3 style="color: #4fc3f7; margin: 0 0 16px 0; font-size: 18px;">
            🧪 HAPA 테스트 응답 (UI 표시 확인)
          </h3>
          
          <div style="
            background: #0d1117; 
            padding: 16px; 
            border-radius: 8px; 
            border-left: 4px solid #4fc3f7;
            margin: 12px 0;
          ">
            <pre style="
              margin: 0; 
              color: #e6edf3; 
              font-family: 'Consolas', 'Monaco', 'Courier New', monospace; 
              font-size: 13px; 
              line-height: 1.4;
            "><code># Python 예제
print("Hello, HAPA! 🤖")
def greet(name):
    return f"안녕하세요, {name}님!"

# JavaScript 예제  
console.log("Hello, World! 🌍");
const message = "HAPA가 정상 작동 중입니다!";

# Shell 예제
echo "Hello, Terminal! 💻"</code></pre>
          </div>
          
          <div style="
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 12px; 
            margin-top: 16px;
            font-size: 12px;
          ">
            <div>
              <p style="margin: 4px 0; color: #7dd3fc;">
                <strong>📅 생성 시간:</strong> ${new Date().toLocaleString()}
              </p>
              <p style="margin: 4px 0; color: #7dd3fc;">
                <strong>🎯 상태:</strong> 테스트 모드 - UI 표시 확인
              </p>
            </div>
            <div>
              <p style="margin: 4px 0; color: #7dd3fc;">
                <strong>⚡ 요소 ID:</strong> ${responseContent.id}
              </p>
              <p style="margin: 4px 0; color: #7dd3fc;">
                <strong>📐 크기:</strong> ${responseContent.offsetWidth}x${
                  responseContent.offsetHeight
                }px
              </p>
            </div>
          </div>
          
          <div style="
            margin-top: 16px; 
            padding: 12px; 
            background: rgba(79, 195, 247, 0.1); 
            border-radius: 6px;
            font-size: 11px;
            color: #94a3b8;
          ">
            💡 <strong>테스트 성공!</strong> 이 메시지가 보인다면 HAPA UI가 정상적으로 작동하고 있습니다.
            <br>실제 AI 응답도 이 위치에 표시됩니다.
          </div>
        </div>
      `;

      // 콘텐츠 설정
      responseContent.innerHTML = testContent;

      // 강제 스타일 적용
      responseContent.style.display = "block";
      responseContent.style.visibility = "visible";
      responseContent.style.opacity = "1";
      responseContent.style.minHeight = "300px";

      // 부모 컨테이너들도 표시
      const parentContainer = responseContent.closest(".response-content, .tab-content");
      if (parentContainer) {
        parentContainer.style.display = "block";
        parentContainer.style.visibility = "visible";
      }

      console.log("✅ 테스트 콘텐츠 삽입 완료:", {
        elementId: responseContent.id,
        parentElement: responseContent.parentElement?.className,
        dimensions: `${responseContent.offsetWidth}x${responseContent.offsetHeight}`,
        isVisible: responseContent.offsetHeight > 0,
      });

      // 응답 탭도 활성화
      forceUpdateUI();

      // 성공 확인을 위한 추가 검증
      setTimeout(() => {
        console.log("🔍 테스트 콘텐츠 표시 후 검증:", {
          contentLength: responseContent.innerHTML.length,
          isVisible: responseContent.offsetHeight > 0,
          computedDisplay: getComputedStyle(responseContent).display,
          computedVisibility: getComputedStyle(responseContent).visibility,
        });
      }, 500);
    } else {
      console.error("❌ getResponseElementSafely() 실패");
      alert("❌ 응답 요소를 생성할 수 없습니다. 페이지를 새로고침해주세요.");
    }
  } catch (error) {
    console.error("❌ 테스트 콘텐츠 표시 실패:", error);
    alert(`테스트 실패: ${error.message}`);
  }
}

async function debugCurrentState() {
  console.log("🔍 현재 UI 상태 전체 진단 시작...");

  try {
    // 안전한 응답 요소 접근
    const responseElement = await getResponseElementSafely();

    const diagnostics = {
      // 타임스탬프
      timestamp: new Date().toISOString(),

      // DOM 요소들 존재 여부
      elements: {
        responseContent: !!document.getElementById("response-content"),
        responseContentSafe: !!responseElement,
        historyContent: !!document.getElementById("historyContent"),
        questionInput: !!document.getElementById("questionInput"),
        submitButton: !!document.getElementById("submitButton"),
        responseContainer: !!document.querySelector(".response-content"),
        tabContent: !!document.querySelector(".tab-content"),
      },

      // 응답 콘텐츠 상세 상태
      responseState: (() => {
        if (!responseElement) {
          return "MISSING_ELEMENT";
        }

        const computedStyle = getComputedStyle(responseElement);

        return {
          // 기본 속성
          id: responseElement.id,
          className: responseElement.className,
          tagName: responseElement.tagName,

          // 스타일 상태
          display: {
            inline: responseElement.style.display,
            computed: computedStyle.display,
          },
          visibility: {
            inline: responseElement.style.visibility,
            computed: computedStyle.visibility,
          },
          opacity: {
            inline: responseElement.style.opacity,
            computed: computedStyle.opacity,
          },

          // 크기와 위치
          dimensions: {
            width: computedStyle.width,
            height: computedStyle.height,
            offsetWidth: responseElement.offsetWidth,
            offsetHeight: responseElement.offsetHeight,
          },

          // 내용
          content: {
            innerHTML: responseElement.innerHTML.substring(0, 150) + "...",
            textContent: responseElement.textContent.substring(0, 150) + "...",
            childElementCount: responseElement.childElementCount,
          },

          // DOM 트리 위치
          hierarchy: {
            parentElement: responseElement.parentElement?.tagName,
            parentClass: responseElement.parentElement?.className,
            nextSibling: responseElement.nextElementSibling?.tagName,
            previousSibling: responseElement.previousElementSibling?.tagName,
          },
        };
      })(),

      // 탭 상태
      tabState: {
        activeTab: (() => {
          const activeTab = document.querySelector(".tab-btn.active");
          return activeTab ? activeTab.getAttribute("data-tab") : "NONE";
        })(),
        responseTabExists: !!document.querySelector('[data-tab="response"]'),
        historyTabExists: !!document.querySelector('[data-tab="history"]'),
        tabContentVisible: (() => {
          const tabContent = document.querySelector(".tab-content");
          return tabContent ? getComputedStyle(tabContent).display : "NOT_FOUND";
        })(),
      },

      // 스트리밍 상태
      streamingState: {
        managerState: streamingManager.currentState,
        isActive: streamingManager.isActive(),
        canReceiveChunks: streamingManager.canReceiveChunks(),
        shouldIgnoreChunks: streamingManager.shouldIgnoreChunks(),
        buffer: {
          length: streamingBuffer.length,
          preview: streamingBuffer.substring(0, 100) + "...",
        },
        currentContent: {
          length: currentStreamingContent.length,
          preview: currentStreamingContent.substring(0, 100) + "...",
        },
      },

      // 메시지 큐 상태
      messageQueueState: {
        queueLength: messageQueue.queue ? messageQueue.queue.length : "UNKNOWN",
        isProcessing: messageQueue.isProcessing || false,
      },

      // 성능 정보
      performance: {
        documentReadyState: document.readyState,
        windowLoaded: document.readyState === "complete",
        userAgent: navigator.userAgent.substring(0, 50) + "...",
      },
    };

    console.log("📊 상세 진단 결과:", diagnostics);

    // 문제 감지 및 권장사항
    const issues = [];
    const recommendations = [];

    if (!diagnostics.elements.responseContentSafe) {
      issues.push("❌ 응답 요소를 찾을 수 없음");
      recommendations.push("💡 forceUpdateUI() 또는 showTestContent() 실행");
    }

    if (
      diagnostics.responseState !== "MISSING_ELEMENT" &&
      diagnostics.responseState.dimensions.offsetHeight === 0
    ) {
      issues.push("❌ 응답 요소가 화면에 보이지 않음");
      recommendations.push("💡 CSS display/visibility 속성 확인");
    }

    if (diagnostics.tabState.activeTab !== "response") {
      issues.push("⚠️ 응답 탭이 활성화되지 않음");
      recommendations.push("💡 switchTab('response') 실행");
    }

    if (diagnostics.streamingState.isActive && !diagnostics.elements.responseContentSafe) {
      issues.push("🚨 스트리밍 활성 상태이지만 응답 요소 없음");
      recommendations.push("🔧 긴급 UI 복구 필요");
    }

    if (issues.length > 0) {
      console.warn("🚨 발견된 문제점들:", issues);
      console.info("💡 권장 해결방법:", recommendations);
    } else {
      console.log("✅ UI 상태 정상");
    }

    return diagnostics;
  } catch (error) {
    console.error("❌ 진단 실행 중 오류:", error);
    return { error: error.message, timestamp: new Date().toISOString() };
  }
}

// 성능 모니터링 대시보드 표시
function showPerformanceDashboard() {
  const avgProcessingTime =
    chunkPerformanceStats.batchCount > 0
      ? chunkPerformanceStats.totalBytes / chunkPerformanceStats.batchCount
      : 0;

  const avgChunkSize =
    chunkPerformanceStats.totalBytes / Math.max(chunkPerformanceStats.totalProcessed, 1);
  const smallChunkRatio =
    (chunkPerformanceStats.smallChunks / Math.max(chunkPerformanceStats.totalProcessed, 1)) * 100;
  const largeChunkRatio =
    (chunkPerformanceStats.largeChunks / Math.max(chunkPerformanceStats.totalProcessed, 1)) * 100;

  const dashboardHTML = `
    <div class="performance-dashboard" style="
      background: #f5f5f5;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 16px;
      margin: 16px 0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    ">
      <h3 style="margin: 0 0 12px 0; color: #333;">📊 스트리밍 성능 대시보드</h3>
      
      <div class="performance-grid" style="
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 12px;
        margin-bottom: 16px;
      ">
        <div class="performance-card" style="
          background: white;
          padding: 12px;
          border-radius: 6px;
          border: 1px solid #e0e0e0;
        ">
          <h4 style="margin: 0 0 8px 0; color: #555; font-size: 12px; text-transform: uppercase;">총 청크 수</h4>
          <div style="font-size: 24px; font-weight: bold; color: ${
            chunkPerformanceStats.totalProcessed > PERFORMANCE_LIMITS.warningThreshold
              ? "#ff4444"
              : "#4CAF50"
          };">
            ${chunkPerformanceStats.totalProcessed}
          </div>
        </div>
        
        <div class="performance-card" style="
          background: white;
          padding: 12px;
          border-radius: 6px;
          border: 1px solid #e0e0e0;
        ">
          <h4 style="margin: 0 0 8px 0; color: #555; font-size: 12px; text-transform: uppercase;">평균 청크 크기</h4>
          <div style="font-size: 24px; font-weight: bold; color: #2196F3;">
            ${Math.round(avgChunkSize * 100) / 100}자
          </div>
        </div>
        
        <div class="performance-card" style="
          background: white;
          padding: 12px;
          border-radius: 6px;
          border: 1px solid #e0e0e0;
        ">
          <h4 style="margin: 0 0 8px 0; color: #555; font-size: 12px; text-transform: uppercase;">평균 처리 시간</h4>
          <div style="font-size: 24px; font-weight: bold; color: ${
            avgProcessingTime > 50 ? "#ff4444" : "#4CAF50"
          };">
            ${Math.round(avgProcessingTime * 100) / 100}ms
          </div>
        </div>
        
        <div class="performance-card" style="
          background: white;
          padding: 12px;
          border-radius: 6px;
          border: 1px solid #e0e0e0;
        ">
          <h4 style="margin: 0 0 8px 0; color: #555; font-size: 12px; text-transform: uppercase;">작은 청크 비율</h4>
          <div style="font-size: 24px; font-weight: bold; color: ${
            smallChunkRatio > 30 ? "#ff4444" : "#4CAF50"
          };">
            ${Math.round(smallChunkRatio * 100) / 100}%
          </div>
        </div>
      </div>
      
      <div class="performance-warnings" style="margin-top: 16px;">
        ${
          chunkPerformanceStats.totalProcessed > PERFORMANCE_LIMITS.warningThreshold
            ? '<div style="color: #ff4444; font-weight: bold;">⚠️ 청크 수가 경고 임계값을 초과했습니다!</div>'
            : ""
        }
        ${
          smallChunkRatio > 30
            ? '<div style="color: #ff4444; font-weight: bold;">⚠️ 작은 청크 비율이 높습니다!</div>'
            : ""
        }
        ${
          avgProcessingTime > 50
            ? '<div style="color: #ff4444; font-weight: bold;">⚠️ 청크 처리 시간이 높습니다!</div>'
            : ""
        }
      </div>
      
      <div class="performance-actions" style="margin-top: 16px;">
        <button onclick="messageQueue.resetPerformanceStats()" style="
          background: #2196F3;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          margin-right: 8px;
        ">통계 초기화</button>
        
        <button onclick="this.parentElement.parentElement.remove()" style="
          background: #666;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
        ">닫기</button>
      </div>
    </div>
  `;

  const responseElement = document.getElementById("response-content");
  if (responseElement) {
    responseElement.innerHTML = dashboardHTML + responseElement.innerHTML;
  }
}

// 디버깅용 전역 함수들을 window에 등록
window.forceUpdateUI = forceUpdateUI;
window.showTestContent = showTestContent;
window.debugCurrentState = debugCurrentState;
window.showPerformanceDashboard = showPerformanceDashboard;

// ============================================================================
// 환경별 설정
// ============================================================================

// 개발 환경 감지 및 디버그 모드 설정
window.DEBUG_MODE = false; // 운영환경에서는 false로 설정

// DOM 안전 접근 헬퍼 함수 추가
function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver(mutations => {
      const element = document.querySelector(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element ${selector} not found within ${timeout}ms`));
    }, timeout);
  });
}

// 응답 요소 안전 접근 함수
async function getResponseElementSafely() {
  try {
    // 먼저 즉시 확인
    let element = document.getElementById("response-content");
    if (element) {
      return element;
    }

    // DOM이 완전히 로드될 때까지 기다림
    element = await waitForElement("#response-content", 3000);
    return element;
  } catch (error) {
    console.warn("⚠️ response-content 요소를 기다리는 중 오류:", error);

    // 대체 요소 검색
    const alternatives = [
      ".response-display",
      ".response-content #response-content",
      "[class*='response']",
      ".tab-content .response-content",
    ];

    for (const selector of alternatives) {
      const fallback = document.querySelector(selector);
      if (fallback) {
        console.log(`✅ 대체 요소 발견: ${selector}`);
        return fallback;
      }
    }

    // 최후의 수단: 동적 생성
    console.log("🔧 응답 요소 동적 생성");
    const container = document.querySelector(".response-content") || document.body;
    const newElement = document.createElement("div");
    newElement.id = "response-content";
    newElement.className = "response-display";
    newElement.style.cssText = `
      width: 100%;
      min-height: 200px;
      padding: 16px;
      border: 1px solid #3c3c3c;
      border-radius: 8px;
      background: #1e1e1e;
      color: #d4d4d4;
      font-family: 'Consolas', 'Monaco', monospace;
      white-space: pre-wrap;
      word-wrap: break-word;
      overflow-y: auto;
      display: block !important;
      visibility: visible !important;
    `;
    container.appendChild(newElement);
    return newElement;
  }
}

// ============================================================================
// 강화된 UI 상태 관리 시스템 (핵심 수정 4)
// ============================================================================

/**
 * UI 상태 복구 관리자
 * 스트리밍 오류 시 UI를 안전하게 복구
 */
const uiRecoveryManager = {
  // UI 복구 플래그
  isRecovering: false,
  recoveryAttempts: 0,
  maxRecoveryAttempts: 3,

  /**
   * 스트리밍 UI 복구 실행
   */
  async recoverStreamingUI(error = null) {
    if (this.isRecovering) {
      console.log("🔄 이미 UI 복구 중...");
      return;
    }

    this.isRecovering = true;
    this.recoveryAttempts++;

    console.log(
      `🔧 스트리밍 UI 복구 시작 (시도 ${this.recoveryAttempts}/${this.maxRecoveryAttempts})`,
      {
        error: error?.message,
        currentState: streamingManager.currentState,
      }
    );

    try {
      // 1. 타이머 및 리소스 정리
      await this.cleanupResources();

      // 2. UI 요소 복구
      await this.restoreUIElements();

      // 3. 상태 초기화
      await this.resetStates();

      // 4. 이벤트 리스너 재설정
      await this.resetEventListeners();

      console.log("✅ 스트리밍 UI 복구 완료");
      this.recoveryAttempts = 0;
    } catch (recoveryError) {
      console.error("❌ UI 복구 실패:", recoveryError);

      if (this.recoveryAttempts < this.maxRecoveryAttempts) {
        console.log("🔄 UI 복구 재시도...");
        setTimeout(() => {
          this.isRecovering = false;
          this.recoverStreamingUI(error);
        }, 1000);
      } else {
        console.error("❌ 최대 복구 시도 횟수 초과 - 긴급 복구 실행");
        await this.emergencyRecovery();
      }
    } finally {
      this.isRecovering = false;
    }
  },

  /**
   * 리소스 정리
   */
  async cleanupResources() {
    try {
      // 모든 타이머 정리
      if (streamingTimeout) {
        clearTimeout(streamingTimeout);
        streamingTimeout = null;
      }

      if (healthCheckInterval) {
        clearInterval(healthCheckInterval);
        healthCheckInterval = null;
      }

      if (globalState.streamingTimeout) {
        clearTimeout(globalState.streamingTimeout);
        globalState.streamingTimeout = null;
      }

      if (globalState.healthCheckInterval) {
        clearInterval(globalState.healthCheckInterval);
        globalState.healthCheckInterval = null;
      }

      // AbortController 정리
      if (streamingAbortController) {
        try {
          streamingAbortController.abort();
        } catch (abortError) {
          console.warn("⚠️ AbortController 정리 중 오류:", abortError);
        }
        streamingAbortController = null;
      }

      console.log("✅ 리소스 정리 완료");
    } catch (error) {
      console.error("❌ 리소스 정리 실패:", error);
      throw error;
    }
  },

  /**
   * UI 요소 복구
   */
  async restoreUIElements() {
    try {
      // 버튼 상태 복구
      const generateBtn = document.getElementById("generate-btn");
      if (generateBtn) {
        generateBtn.disabled = false;
        generateBtn.textContent = "코드 생성";
        generateBtn.style.backgroundColor = "";
        generateBtn.style.cursor = "pointer";
      }

      // 로딩 스피너 숨김
      const loadingSpinner = document.getElementById("loading-spinner");
      if (loadingSpinner) {
        loadingSpinner.style.display = "none";
      }

      // 스트리밍 표시기 숨김
      const streamingIndicator = document.getElementById("streamingIndicator");
      if (streamingIndicator) {
        streamingIndicator.style.display = "none";
      }

      // 상태 표시 요소 정리
      const statusElement = document.getElementById("streaming-status");
      if (statusElement) {
        statusElement.textContent = "";
        statusElement.style.display = "none";
      }

      // 입력 필드 활성화
      const questionInput = document.getElementById("questionInput");
      if (questionInput) {
        questionInput.disabled = false;
        questionInput.style.backgroundColor = "";
      }

      console.log("✅ UI 요소 복구 완료");
    } catch (error) {
      console.error("❌ UI 요소 복구 실패:", error);
      throw error;
    }
  },

  /**
   * 상태 초기화
   */
  async resetStates() {
    try {
      // ✅ 수정: 전역 상태 초기화 (동기화)
      streamingBuffer = "";
      currentStreamingContent = "";
      streamingSequence = 0;

      // globalState 초기화
      globalState.reset();

      // streamingManager 상태 초기화
      streamingManager.setState(StreamingState.IDLE, {
        reason: "ui_recovery",
        timestamp: Date.now(),
      });

      // 레거시 상태 동기화
      syncLegacyState();

      console.log("✅ 상태 초기화 완료");
    } catch (error) {
      console.error("❌ 상태 초기화 실패:", error);
      throw error;
    }
  },

  /**
   * 이벤트 리스너 재설정
   */
  async resetEventListeners() {
    try {
      // 버튼 이벤트 리스너 확인 및 재설정
      const generateBtn = document.getElementById("generate-btn");
      if (generateBtn) {
        // 기존 이벤트 리스너 제거 후 재설정
        const newBtn = generateBtn.cloneNode(true);
        generateBtn.parentNode?.replaceChild(newBtn, generateBtn);

        // 새로운 이벤트 리스너 추가
        newBtn.addEventListener("click", submitQuestion);
      }

      console.log("✅ 이벤트 리스너 재설정 완료");
    } catch (error) {
      console.error("❌ 이벤트 리스너 재설정 실패:", error);
      // 이벤트 리스너 재설정 실패는 치명적이지 않으므로 계속 진행
    }
  },

  /**
   * 긴급 복구 (최후의 수단)
   */
  async emergencyRecovery() {
    try {
      console.log("🚨 긴급 UI 복구 실행");

      // 모든 타이머 강제 정리
      for (let i = 1; i < 10000; i++) {
        clearTimeout(i);
        clearInterval(i);
      }

      // ✅ 수정: 전역 상태 강제 초기화 (동기화)
      streamingBuffer = "";
      currentStreamingContent = "";
      streamingSequence = 0;
      streamingTimeout = null;
      healthCheckInterval = null;
      streamingAbortController = null;

      // streamingManager 강제 초기화
      streamingManager.currentState = StreamingState.IDLE;
      streamingManager.sessionId = null;
      streamingManager.startTime = null;

      // globalState 강제 초기화
      globalState.streamingId = null;
      globalState.streamingBuffer = "";
      globalState.streamingContent = "";
      globalState.streamingSequence = 0;
      globalState.requestStartTime = 0;
      globalState.retryCount = 0;
      globalState.streamingTimeout = null;
      globalState.healthCheckInterval = null;

      // UI 강제 복구
      const responseElement = document.getElementById("response-content");
      if (responseElement) {
        responseElement.innerHTML = `
          <div style="padding: 20px; text-align: center; background: #2d1b1b; border: 1px solid #ff6b6b; border-radius: 8px; color: #ff6b6b;">
            <h3>⚠️ 시스템 복구 완료</h3>
            <p>일시적인 오류가 발생하여 시스템을 복구했습니다.</p>
            <p>이제 다시 정상적으로 사용할 수 있습니다.</p>
          </div>
        `;
      }

      console.log("✅ 긴급 UI 복구 완료");
      this.recoveryAttempts = 0;
    } catch (error) {
      console.error("❌ 긴급 복구도 실패:", error);
      // 최후의 수단으로 페이지 새로고침 제안
      if (confirm("시스템 복구에 실패했습니다. 페이지를 새로고침하시겠습니까?")) {
        location.reload();
      }
    }
  },
};

// ============================================================================
// 디버깅 및 테스트 기능 (핵심 수정 6)
// ============================================================================

/**
 * 환경별 로깅 설정
 */
const DEBUG_MODE =
  typeof window !== "undefined" &&
  (window.location?.href?.includes("debug=true") ||
    localStorage.getItem("hapa_debug_mode") === "true");

const LOGGING_CONFIG = {
  enableConsoleLog: DEBUG_MODE,
  enableErrorReporting: true,
  logLevel: DEBUG_MODE ? "debug" : "warn", // 운영 환경에서는 warn 이상만 로그
  maxLogEntries: 100,
};

/**
 * 안전한 로깅 함수
 */
function safeLog(level, message, data = null) {
  try {
    if (!LOGGING_CONFIG.enableConsoleLog && level === "debug") {
      return; // 디버그 모드가 아니면 debug 로그 생략
    }

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data,
      userAgent: navigator.userAgent,
      url: window.location?.href,
    };

    // 콘솔 출력
    if (level === "error") {
      console.error(`[${timestamp}] ${message}`, data);
    } else if (level === "warn") {
      console.warn(`[${timestamp}] ${message}`, data);
    } else if (level === "debug" && DEBUG_MODE) {
      console.log(`[${timestamp}] 🔍 ${message}`, data);
    } else {
      console.log(`[${timestamp}] ${message}`, data);
    }

    // 로컬 스토리지에 오류 로그 저장 (최대 100개)
    if (level === "error" && LOGGING_CONFIG.enableErrorReporting) {
      try {
        const errorLogs = JSON.parse(localStorage.getItem("hapa_error_logs") || "[]");
        errorLogs.push(logEntry);

        // 최대 항목 수 제한
        if (errorLogs.length > LOGGING_CONFIG.maxLogEntries) {
          errorLogs.splice(0, errorLogs.length - LOGGING_CONFIG.maxLogEntries);
        }

        localStorage.setItem("hapa_error_logs", JSON.stringify(errorLogs));
      } catch (storageError) {
        console.warn("로그 저장 실패:", storageError);
      }
    }
  } catch (loggingError) {
    // 로깅 시스템 자체의 오류는 기본 console.error로 출력
    console.error("로깅 시스템 오류:", loggingError);
  }
}

/**
 * 시스템 상태 진단 함수
 */
function diagnoseSystemState() {
  const diagnosis = {
    timestamp: Date.now(),
    streamingManager: {
      state: streamingManager.currentState,
      isActive: streamingManager.isActive(),
      sessionId: streamingManager.sessionId,
      startTime: streamingManager.startTime,
    },
    globalState: {
      streamingId: globalState.streamingId,
      bufferLength: globalState.streamingBuffer?.length || 0,
      hasTimeout: !!globalState.streamingTimeout,
      retryCount: globalState.retryCount,
    },
    globalVariables: {
      streamingTimeout: !!streamingTimeout,
      healthCheckInterval: !!healthCheckInterval,
      streamingBuffer: streamingBuffer?.length || 0,
      currentStreamingContent: currentStreamingContent?.length || 0,
    },
    uiElements: {
      generateBtn: !!document.getElementById("generate-btn"),
      responseElement: !!document.getElementById("response-content"),
      questionInput: !!document.getElementById("questionInput"),
      loadingSpinner: !!document.getElementById("loading-spinner"),
    },
    browser: {
      userAgent: navigator.userAgent,
      url: window.location?.href,
      timestamp: new Date().toISOString(),
    },
  };

  safeLog("debug", "시스템 상태 진단", diagnosis);
  return diagnosis;
}

/**
 * 테스트 기능들
 */
const testSuite = {
  /**
   * 스트리밍 상태 전환 테스트
   */
  testStateTransitions() {
    console.log("🧪 상태 전환 테스트 시작");
    const testResults = [];

    // 테스트 케이스들
    const testCases = [
      {
        name: "정상 스트리밍 플로우",
        transitions: [
          { from: "idle", to: "starting", shouldSucceed: true },
          { from: "starting", to: "active", shouldSucceed: true },
          { from: "active", to: "finishing", shouldSucceed: true },
          { from: "finishing", to: "completed", shouldSucceed: true },
          { from: "completed", to: "idle", shouldSucceed: true },
        ],
      },
      {
        name: "오류 처리 플로우",
        transitions: [
          { from: "idle", to: "starting", shouldSucceed: true },
          { from: "starting", to: "error", shouldSucceed: true },
          { from: "error", to: "idle", shouldSucceed: true },
        ],
      },
      {
        name: "잘못된 전환들",
        transitions: [
          { from: "idle", to: "active", shouldSucceed: false },
          { from: "idle", to: "finishing", shouldSucceed: false },
          { from: "active", to: "starting", shouldSucceed: false },
          { from: "completed", to: "active", shouldSucceed: false },
        ],
      },
    ];

    // 각 테스트 케이스 실행
    for (const testCase of testCases) {
      console.log(`\n🔬 테스트: ${testCase.name}`);

      for (const transition of testCase.transitions) {
        // 상태 설정
        streamingManager.currentState = StreamingState[transition.from.toUpperCase()];

        // 전환 시도
        const result = streamingManager.setState(StreamingState[transition.to.toUpperCase()], {
          test: true,
        });

        // 결과 검증
        const passed = result === transition.shouldSucceed;
        testResults.push({
          test: `${transition.from} → ${transition.to}`,
          expected: transition.shouldSucceed,
          actual: result,
          passed,
        });

        console.log(
          `  ${passed ? "✅" : "❌"} ${transition.from} → ${
            transition.to
          }: 기대=${transition.shouldSucceed}, 실제=${result}`
        );
      }
    }

    // 결과 요약
    const passedCount = testResults.filter(r => r.passed).length;
    const totalCount = testResults.length;

    console.log(`\n🎯 테스트 완료: ${passedCount}/${totalCount} 통과`);

    if (passedCount === totalCount) {
      console.log("✅ 모든 상태 전환 테스트 통과!");
    } else {
      console.warn(
        "⚠️ 일부 테스트 실패:",
        testResults.filter(r => !r.passed)
      );
    }

    // 상태 초기화
    streamingManager.reset();

    return { passed: passedCount, total: totalCount, details: testResults };
  },

  async testUIRecovery() {
    console.log("🧪 UI 복구 테스트 시작");

    try {
      // 1. 오류 상태 시뮬레이션
      const responseElement = document.getElementById("response-content");
      if (responseElement) {
        responseElement.innerHTML = '<div class="error-message">테스트 에러 메시지</div>';
      }

      // 2. 상태 복구 실행
      await uiRecoveryManager.recoverStreamingUI(new Error("테스트 에러"));

      // 3. 복구 결과 검증
      const hasError = responseElement && responseElement.innerHTML.includes("error-message");

      console.log(`🔍 UI 복구 테스트 결과: ${hasError ? "실패" : "성공"}`);

      return !hasError;
    } catch (error) {
      console.error("❌ UI 복구 테스트 실패:", error);
      return false;
    }
  },

  async runFullTest() {
    console.log("🚀 전체 시스템 테스트 시작");

    const results = {
      stateTransitions: this.testStateTransitions(),
      uiRecovery: await this.testUIRecovery(),
      timestamp: new Date().toISOString(),
    };

    console.log("📊 전체 테스트 결과:", results);

    return results;
  },

  // 강화된 종료 처리 시스템
  async handleTermination(reason = "unknown") {
    console.log(`🏁 스트리밍 종료 처리 시작: ${reason}`);

    // 종료 이유 기록
    streamingManager.addTerminationReason(reason);

    // 상태 전환
    if (streamingManager.currentState !== StreamingState.FINISHING) {
      streamingManager.setState(StreamingState.FINISHING, { reason });
    }

    try {
      // 1. 청크 큐 정리
      if (typeof chunkQueue !== "undefined") {
        chunkQueue.clear();
      }

      // 2. 타이머 정리
      if (streamingTimeout) {
        clearTimeout(streamingTimeout);
        streamingTimeout = null;
      }

      if (healthCheckInterval) {
        clearInterval(healthCheckInterval);
        healthCheckInterval = null;
      }

      // 3. AbortController 정리
      if (streamingAbortController) {
        streamingAbortController.abort();
        streamingAbortController = null;
      }

      // 4. UI 정리
      this.resetStreamingUI();

      // 5. 성능 통계 로깅
      this.logPerformanceStats();

      // 6. 최종 상태 전환
      streamingManager.setState(StreamingState.COMPLETED, { reason });

      console.log("✅ 스트리밍 종료 처리 완료");
    } catch (error) {
      console.error("❌ 종료 처리 중 오류:", error);
      streamingManager.setState(StreamingState.ERROR, {
        reason: "termination_error",
        error,
      });
    }
  },
};

/**
 * 전역 오류 핸들러 설정
 */
window.addEventListener("error", event => {
  safeLog("error", "전역 JavaScript 오류", {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error?.stack,
  });

  // 스트리밍 관련 오류인 경우 UI 복구 시도
  if (
    event.message?.includes("streaming") ||
    event.message?.includes("스트리밍") ||
    streamingManager.isActive()
  ) {
    safeLog("debug", "스트리밍 관련 전역 오류 감지 - UI 복구 시도");
    uiRecoveryManager.recoverStreamingUI(event.error).catch(recoveryError => {
      safeLog("error", "UI 복구 실패", recoveryError);
    });
  }
});

window.addEventListener("unhandledrejection", event => {
  safeLog("error", "처리되지 않은 Promise 거부", {
    reason: event.reason,
    promise: event.promise,
  });

  // Promise 거부를 적절히 처리했음을 표시
  event.preventDefault();
});

/**
 * 디버그 모드 토글 함수 (개발자 도구에서 사용)
 */
window.toggleHapaDebugMode = function () {
  const currentMode = localStorage.getItem("hapa_debug_mode") === "true";
  const newMode = !currentMode;

  localStorage.setItem("hapa_debug_mode", newMode.toString());
  LOGGING_CONFIG.enableConsoleLog = newMode;
  LOGGING_CONFIG.logLevel = newMode ? "debug" : "warn";

  safeLog("debug", `디버그 모드 ${newMode ? "활성화" : "비활성화"}됨`);

  if (newMode) {
    console.log("🔧 HAPA 디버그 모드가 활성화되었습니다.");
    console.log("📋 사용 가능한 명령어:");
    console.log("  - diagnoseSystemState(): 시스템 상태 진단");
    console.log("  - testSuite.runFullTest(): 전체 시스템 테스트");
    console.log("  - uiRecoveryManager.recoverStreamingUI(): UI 복구");
  }

  return newMode;
};

/**
 * 개발자 도구에서 사용할 수 있는 전역 함수들
 */
if (DEBUG_MODE) {
  window.diagnoseSystemState = diagnoseSystemState;
  window.testSuite = testSuite;
  window.uiRecoveryManager = uiRecoveryManager;
  window.streamingManager = streamingManager;
  window.globalState = globalState;

  safeLog("debug", "🔧 HAPA 디버그 도구가 활성화되었습니다.");
  safeLog("debug", "사용 가능한 전역 함수: diagnoseSystemState, testSuite, uiRecoveryManager");
}

// 초기 시스템 상태 진단 (DEBUG 모드에서만)
if (DEBUG_MODE) {
  setTimeout(() => {
    diagnoseSystemState();
  }, 1000);
}

// 유틸리티 함수들

/**
 * 클립보드 복사 함수
 */
function copyToClipboard(text) {
  try {
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          console.log("✅ 클립보드 복사 성공");
          showNotification("클립보드에 복사되었습니다.", "success");
        })
        .catch(err => {
          console.error("❌ 클립보드 복사 실패:", err);
          fallbackCopyToClipboard(text);
        });
    } else {
      fallbackCopyToClipboard(text);
    }
  } catch (error) {
    console.error("❌ 클립보드 복사 오류:", error);
    fallbackCopyToClipboard(text);
  }
}

/**
 * 대체 클립보드 복사 함수
 */
function fallbackCopyToClipboard(text) {
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);

    if (successful) {
      console.log("✅ 대체 클립보드 복사 성공");
      showNotification("클립보드에 복사되었습니다.", "success");
    } else {
      console.error("❌ 대체 클립보드 복사 실패");
      showNotification("클립보드 복사에 실패했습니다.", "error");
    }
  } catch (error) {
    console.error("❌ 대체 클립보드 복사 오류:", error);
    showNotification("클립보드 복사에 실패했습니다.", "error");
  }
}

/**
 * 코드 삽입 함수
 */
function insertCode(code) {
  try {
    console.log("📝 코드 삽입 시도:", {
      codeLength: code.length,
      codePreview: code.substring(0, 50) + "...",
    });

    // VSCode Extension으로 코드 삽입 요청
    vscode.postMessage({
      command: "insertCode",
      code: code,
    });

    showNotification("코드가 편집기에 삽입되었습니다.", "success");
  } catch (error) {
    console.error("❌ 코드 삽입 오류:", error);
    showNotification("코드 삽입에 실패했습니다.", "error");
  }
}

/**
 * 알림 표시 함수
 */
function showNotification(message, type = "info") {
  try {
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 16px;
      border-radius: 4px;
      color: white;
      z-index: 1000;
      font-size: 14px;
      max-width: 300px;
      word-wrap: break-word;
      animation: slideIn 0.3s ease-out;
    `;

    // 타입별 배경색
    switch (type) {
      case "success":
        notification.style.backgroundColor = "#4caf50";
        break;
      case "error":
        notification.style.backgroundColor = "#f44336";
        break;
      case "warning":
        notification.style.backgroundColor = "#ff9800";
        break;
      default:
        notification.style.backgroundColor = "#2196f3";
    }

    document.body.appendChild(notification);

    // 3초 후 자동 제거
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = "slideOut 0.3s ease-in";
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }
    }, 3000);
  } catch (error) {
    console.error("❌ 알림 표시 오류:", error);
  }
}

// CSS 애니메이션 추가
const style = document.createElement("style");
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
  
  .notification {
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    border-left: 4px solid rgba(255,255,255,0.5);
  }
`;
document.head.appendChild(style);

// ============================================================================
// 구조화된 응답 시스템
// ============================================================================

/**
 * 구조화된 스트리밍 상태 관리자
 * 설명과 코드를 분리하여 관리
 */
const structuredStreamingManager = {
  // 분리된 콘텐츠 상태
  state: {
    explanation: {
      content: "",
      isComplete: false,
      chunks: [],
      lastUpdate: 0,
    },
    code: {
      content: "",
      isComplete: false,
      chunks: [],
      lastUpdate: 0,
    },
    metadata: {
      parsing_confidence: 0,
      total_chunks: 0,
      complexity: "simple",
      has_explanation: false,
      has_code: false,
    },
  },

  // 상태 초기화
  reset() {
    this.state.explanation = {
      content: "",
      isComplete: false,
      chunks: [],
      lastUpdate: 0,
    };
    this.state.code = {
      content: "",
      isComplete: false,
      chunks: [],
      lastUpdate: 0,
    };
    this.state.metadata = {
      parsing_confidence: 0,
      total_chunks: 0,
      complexity: "simple",
      has_explanation: false,
      has_code: false,
    };
    console.log("✨ 구조화된 스트리밍 상태 초기화");
  },

  // 청크 타입별 처리
  processChunk(chunkType, content, metadata = {}) {
    const timestamp = Date.now();
    this.state.metadata.total_chunks++;

    switch (chunkType) {
      case "explanation":
        this.state.explanation.content = content;
        this.state.explanation.chunks.push({
          content,
          timestamp,
          metadata,
        });
        this.state.explanation.lastUpdate = timestamp;
        this.state.explanation.isComplete = metadata.is_complete || false;
        this.state.metadata.has_explanation = true;
        break;

      case "code":
        this.state.code.content = content;
        this.state.code.chunks.push({
          content,
          timestamp,
          metadata,
        });
        this.state.code.lastUpdate = timestamp;
        this.state.code.isComplete = metadata.is_complete || false;
        this.state.metadata.has_code = true;
        break;

      case "token":
        // 실시간 프리뷰용 토큰 (실제 상태는 업데이트하지 않음)
        break;

      case "done":
        this.state.explanation.isComplete = true;
        this.state.code.isComplete = true;
        if (metadata.parsing_confidence) {
          this.state.metadata.parsing_confidence = metadata.parsing_confidence;
        }
        break;
    }

    // 복잡도 및 메타데이터 업데이트
    if (metadata.complexity) {
      this.state.metadata.complexity = metadata.complexity;
    }
    if (metadata.parsing_confidence) {
      this.state.metadata.parsing_confidence = metadata.parsing_confidence;
    }

    console.log(`📦 구조화된 청크 처리: ${chunkType}`, {
      contentLength: content.length,
      hasExplanation: this.state.metadata.has_explanation,
      hasCode: this.state.metadata.has_code,
      totalChunks: this.state.metadata.total_chunks,
    });

    return this.state;
  },

  // 현재 상태 조회
  getState() {
    return { ...this.state };
  },

  // 완성도 확인
  isComplete() {
    return this.state.explanation.isComplete && this.state.code.isComplete;
  },

  // UI 업데이트용 데이터 생성
  generateUIData() {
    return {
      explanation: this.state.explanation.content,
      generated_code: this.state.code.content,
      metadata: {
        ...this.state.metadata,
        generatedAt: new Date().toISOString(),
        charCount: this.state.code.content.length,
        explanationLength: this.state.explanation.content.length,
      },
      success: true,
      processingTime:
        this.state.code.lastUpdate -
        (this.state.explanation.lastUpdate || this.state.code.lastUpdate),
    };
  },
};

/**
 * 실시간 DOM 업데이트 관리자
 */
const realtimeDOMUpdater = {
  // DOM 요소 캐시
  elements: {
    responseContainer: null,
    explanationSection: null,
    codeSection: null,
    metadataSection: null,
  },

  // 요소 초기화
  initializeElements() {
    this.elements.responseContainer =
      document.querySelector(".response-content") || document.querySelector("#response-tab");
    console.log("🎯 DOM 요소 초기화:", {
      hasResponseContainer: !!this.elements.responseContainer,
    });
  },

  // 구조화된 UI 생성
  createStructuredUI() {
    if (!this.elements.responseContainer) {
      this.initializeElements();
    }

    if (!this.elements.responseContainer) {
      console.error("❌ 응답 컨테이너를 찾을 수 없음");
      return;
    }

    // 기존 내용 정리
    this.elements.responseContainer.innerHTML = "";

    // 구조화된 HTML 생성
    const structuredHTML = `
      <div class="ai-response-container structured-response" id="structured-response">
        <div class="explanation-section" id="explanation-section" style="display: none;">
          <div class="section-header">
            <h4 class="section-title">📝 설명</h4>
          </div>
          <div class="explanation-content" id="explanation-content">
            <div class="loading-placeholder">설명을 생성하고 있습니다...</div>
          </div>
        </div>
        <div class="code-section" id="code-section" style="display: none;">
          <div class="section-header">
            <h4 class="section-title">💻 코드</h4>
            <div class="code-info" id="code-info">
              <span class="language-tag" id="language-tag">Python</span>
              <span class="lines-count" id="lines-count">0줄</span>
            </div>
          </div>
          <div class="code-container">
            <pre class="code-block"><code class="language-python" id="code-content"><div class="loading-placeholder">코드를 생성하고 있습니다...</div></code></pre>
          </div>
        </div>
        <div class="metadata-section" id="metadata-section" style="display: none;">
          <div class="meta-items">
            <span class="meta-item">
              <i class="meta-icon">🕒</i>
              <span class="meta-text" id="timestamp">생성 중...</span>
            </span>
            <span class="meta-item">
              <i class="meta-icon">📊</i>
              <span class="meta-text" id="char-count">0자</span>
            </span>
            <span class="meta-item">
              <i class="meta-icon">🎯</i>
              <span class="meta-text" id="confidence-score">신뢰도: 계산 중...</span>
            </span>
          </div>
        </div>
        <div class="action-section" id="action-section" style="display: none;">
          <button onclick="copyStructuredCode()" class="action-button copy-button">
            <i class="button-icon">📋</i>
            <span class="button-text">복사</span>
          </button>
          <button onclick="insertStructuredCode()" class="action-button insert-button">
            <i class="button-icon">📝</i>
            <span class="button-text">삽입</span>
          </button>
        </div>
      </div>
    `;

    this.elements.responseContainer.innerHTML = structuredHTML;

    // 요소 캐시 업데이트
    this.elements.explanationSection = document.getElementById("explanation-section");
    this.elements.codeSection = document.getElementById("code-section");
    this.elements.metadataSection = document.getElementById("metadata-section");

    console.log("✨ 구조화된 UI 생성 완료");
  },

  // 설명 섹션 업데이트
  updateExplanation(content) {
    const explanationContent = document.getElementById("explanation-content");
    const explanationSection = document.getElementById("explanation-section");

    if (explanationContent && explanationSection) {
      if (content && content.trim()) {
        // 마크다운 스타일 포맷팅 적용
        const formattedContent = this.formatExplanationText(content);
        explanationContent.innerHTML = formattedContent;
        explanationSection.style.display = "block";
        console.log("📝 설명 섹션 업데이트:", content.substring(0, 50) + "...");
      } else {
        explanationSection.style.display = "none";
      }
    }
  },

  // 코드 섹션 업데이트
  updateCode(content, metadata = {}) {
    const codeContent = document.getElementById("code-content");
    const codeSection = document.getElementById("code-section");
    const languageTag = document.getElementById("language-tag");
    const linesCount = document.getElementById("lines-count");

    if (codeContent && codeSection) {
      if (content && content.trim()) {
        // 구문 강조 적용
        const highlightedCode = messageQueue.applySyntaxHighlighting(content, "Python");
        codeContent.innerHTML = highlightedCode;

        // 메타데이터 업데이트
        if (languageTag) {
          languageTag.textContent = "Python";
        }
        if (linesCount) {
          linesCount.textContent = `${content.split("\n").length}줄`;
        }

        codeSection.style.display = "block";
        console.log("💻 코드 섹션 업데이트:", content.substring(0, 50) + "...");
      } else {
        codeSection.style.display = "none";
      }
    }
  },

  // 메타데이터 섹션 업데이트
  updateMetadata(metadata) {
    const metadataSection = document.getElementById("metadata-section");
    const timestamp = document.getElementById("timestamp");
    const charCount = document.getElementById("char-count");
    const confidenceScore = document.getElementById("confidence-score");

    if (metadataSection) {
      if (timestamp) {
        timestamp.textContent = new Date().toLocaleTimeString();
      }
      if (charCount && metadata.charCount) {
        charCount.textContent = `${metadata.charCount}자`;
      }
      if (confidenceScore && metadata.parsing_confidence) {
        const confidence = Math.round(metadata.parsing_confidence * 100);
        confidenceScore.textContent = `신뢰도: ${confidence}%`;
      }

      metadataSection.style.display = "block";
    }
  },

  // 액션 버튼 표시
  showActionButtons() {
    const actionSection = document.getElementById("action-section");
    if (actionSection) {
      actionSection.style.display = "flex";
    }
  },

  // 마크다운 스타일 텍스트 포맷팅
  formatExplanationText(text) {
    if (!text) {
      return "";
    }

    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`(.*?)`/g, '<code class="inline-code">$1</code>')
      .replace(/\n\n/g, "</p><p>")
      .replace(/^\s*/, "<p>")
      .replace(/\s*$/, "</p>");
  },
};

// 전역 함수들 (액션 버튼용)
function copyStructuredCode() {
  const state = structuredStreamingManager.getState();
  if (state.code.content) {
    copyToClipboard(state.code.content);
    console.log("📋 구조화된 코드 복사 완료");
  }
}

function insertStructuredCode() {
  const state = structuredStreamingManager.getState();
  if (state.code.content) {
    insertCode(state.code.content);
    console.log("📝 구조화된 코드 삽입 완료");
  }
}

// 히스토리 동기화 이벤트 리스너 (전역)
window.addEventListener("historySynced", event => {
  console.log("📚 히스토리 동기화 완료");
});

// 히스토리 동기화 확인 함수
function checkHistorySync() {
  vscode.postMessage({
    command: "checkHistorySync",
  });
}
