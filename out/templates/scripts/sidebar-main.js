/**
 * HAPA VSCode Extension - Sidebar Main Script
 * @fileoverview 사이드바 웹뷰의 메인 JavaScript 로직
 * 별도 파일로 분리하여 유지보수성 향상
 * 🆕 강화된 스트리밍 상태 관리 시스템
 */

// VSCode API 접근
const vscode = acquireVsCodeApi();

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

// 전역 스트리밍 변수들 (스코프 문제 해결)
let streamingTimeout = null;
let healthCheckInterval = null;
let streamingBuffer = "";
let currentStreamingContent = "";
let streamingSequence = 0;
let streamingAbortController = null;

// 성능 최적화 설정 - 더 엄격한 제한
const PERFORMANCE_LIMITS = {
  maxChunks: 200, // 300 → 200으로 추가 감소
  warningThreshold: 100, // 200 → 100으로 추가 감소
  emergencyThreshold: 150, // 250 → 150으로 추가 감소
  maxProcessingTime: 10000, // 15초 → 10초로 감소
  minChunkSize: 20, // 20자 미만 청크 제한
  maxConcurrentChunks: 5, // 10 → 5로 감소
  forceTerminateAfter: 200, // 350 → 200으로 감소
  hardLimit: 250, // 절대 한계선 추가
};

// 청크 성능 모니터링 강화
const chunkPerformanceStats = {
  totalProcessed: 0,
  totalBytes: 0,
  smallChunks: 0,
  largeChunks: 0,
  startTime: null,
  batchCount: 0,
  lastProcessTime: null,

  reset() {
    this.totalProcessed = 0;
    this.totalBytes = 0;
    this.smallChunks = 0;
    this.largeChunks = 0;
    this.startTime = performance.now();
    this.batchCount = 0;
    this.lastProcessTime = null;
  },

  shouldTerminate() {
    if (this.totalProcessed >= PERFORMANCE_LIMITS.forceTerminateAfter) {
      console.log("🛑 강제 종료: 청크 수 초과");
      return true;
    }

    if (
      this.startTime &&
      performance.now() - this.startTime > PERFORMANCE_LIMITS.maxProcessingTime
    ) {
      console.log("🛑 강제 종료: 처리 시간 초과");
      return true;
    }

    return false;
  },
};

// 청크 배치 처리 관련 변수들
let chunkBatchBuffer = [];
let batchProcessingTimer = null;

// 강화된 스트리밍 상태 관리 객체
const streamingManager = {
  currentState: StreamingState.IDLE,
  sessionId: null,
  startTime: null,

  // 상태 전환 메서드 (동기화 강화)
  setState(newState, metadata = {}) {
    const previousState = this.currentState;
    this.currentState = newState;

    console.log(
      `🔄 스트리밍 상태 전환: ${previousState} → ${newState}`,
      metadata
    );

    // 상태별 처리
    switch (newState) {
      case StreamingState.STARTING:
        this.sessionId = metadata.sessionId || Date.now().toString();
        this.startTime = Date.now();
        break;
      case StreamingState.ACTIVE:
        if (previousState !== StreamingState.STARTING) {
          console.warn(
            `⚠️ 비정상적인 상태 전환: ${previousState} → ${newState}`
          );
        }
        break;
      case StreamingState.FINISHING:
        if (
          ![StreamingState.ACTIVE, StreamingState.STARTING].includes(
            previousState
          )
        ) {
          console.warn(
            `⚠️ 비정상적인 종료 상태 전환: ${previousState} → ${newState}`
          );
        }
        break;
      case StreamingState.COMPLETED:
      case StreamingState.ERROR:
        this.cleanup();
        break;
    }

    // 상태 변경 시 자동으로 전체 동기화 실행
    if (typeof syncAllStates === "function") {
      syncAllStates();
    }
  },

  // 상태 확인 메서드들
  isActive() {
    return [
      StreamingState.STARTING,
      StreamingState.ACTIVE,
      StreamingState.FINISHING,
    ].includes(this.currentState);
  },

  canReceiveChunks() {
    return [StreamingState.STARTING, StreamingState.ACTIVE].includes(
      this.currentState
    );
  },

  shouldIgnoreChunks() {
    return [
      StreamingState.COMPLETED,
      StreamingState.ERROR,
      StreamingState.IDLE,
    ].includes(this.currentState);
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
        const errorMessages =
          responseElement.querySelectorAll(".error-message");
        if (errorMessages.length > 0) {
          console.log(
            `🧹 ${errorMessages.length}개 에러 메시지 발견 - 정리 중`
          );
          errorMessages.forEach((errorMsg) => errorMsg.remove());
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
  set: (value) => {
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
  set: (value) => {
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
    currentStreamingContent = globalState.streamingContent || "";
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
    submitButton.textContent = isActive ? "생성 중..." : "코드 생성";
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
    allModelTabs.forEach((tab) => {
      tab.classList.remove("active");
    });

    // 2. 새로 선택된 탭 활성화
    const selectedTab = document.querySelector(
      '[data-model="' + modelType + '"]'
    );
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
    allTabBtns.forEach((btn) => btn.classList.remove("active"));

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
    autocomplete:
      "자동완성 코드 생성에 대해 질문하거나 요청사항을 입력하세요...",
    prompt:
      "프롬프트 기반 코드 생성에 대해 질문하거나 요청사항을 입력하세요...",
    comment: "코멘트 기반 코드 생성에 대해 질문하거나 요청사항을 입력하세요...",
    error_fix: "에러 수정 코드 생성에 대해 질문하거나 요청사항을 입력하세요...",
  };

  textarea.placeholder =
    placeholders[modelType] || placeholders["autocomplete"];
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

    switch (command) {
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
      case "syncHistory":
        // 히스토리 동기화 처리
        if (message.history) {
          console.log(
            "📚 히스토리 동기화:",
            JSON.parse(message.history).length,
            "개 항목"
          );
          // 히스토리 UI 업데이트 로직 추가 가능
        }
        break;
      case "initializeEmptyStates":
        // 빈 상태 초기화 처리
        console.log("🔄 빈 상태 초기화 완료");
        // 필요시 UI 초기화 로직 추가
        break;
      default:
        console.warn("⚠️ 알 수 없는 메시지 명령:", command);
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
      streamingManager.showStreamingIndicator(
        "HAPA가 코드를 생성하고 있습니다..."
      );

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
    } catch (error) {
      console.error("❌ 스트리밍 시작 처리 오류:", error);
      streamingManager.setState(StreamingState.ERROR, { error: error.message });
      syncLegacyState();
      this.recoverStreamingUI(error);
    }
  },

  async handleStreamingChunk(chunk) {
    const startTime = Date.now();

    // 성능 모니터링 - 절대 한계선 확인 (즉시 중단)
    if (chunkPerformanceStats.totalProcessed >= PERFORMANCE_LIMITS.hardLimit) {
      console.error(
        `🛑 절대 한계선 도달: ${chunkPerformanceStats.totalProcessed}개 - 강제 중단`
      );

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

      this.handleStreamingError({
        error: `성능 한계로 인한 강제 중단 (${chunkPerformanceStats.totalProcessed}개 청크)`,
      });
      return;
    }

    // 성능 모니터링 - 청크 제한 확인
    if (chunkPerformanceStats.totalProcessed >= PERFORMANCE_LIMITS.maxChunks) {
      console.warn(
        `⚠️ 청크 수 제한 도달: ${chunkPerformanceStats.totalProcessed}개`
      );

      // VSCode Extension에 중단 메시지 전송
      try {
        vscode.postMessage({
          command: "stopStreaming",
          reason: "maxChunks",
          chunkCount: chunkPerformanceStats.totalProcessed,
        });
      } catch (error) {
        console.error("❌ 중단 메시지 전송 실패:", error);
      }

      this.handleStreamingError({
        error: `청크 수가 제한(${PERFORMANCE_LIMITS.maxChunks})을 초과했습니다.`,
      });
      return;
    }

    // 경고 임계값 확인
    if (
      chunkPerformanceStats.totalProcessed >=
      PERFORMANCE_LIMITS.warningThreshold
    ) {
      console.warn(
        `⚠️ 청크 수 경고: ${chunkPerformanceStats.totalProcessed}개`
      );
    }

    console.log("📦 청크 처리 시작:", {
      chunkType: typeof chunk,
      chunkKeys: Object.keys(chunk || {}),
      hasChunkProperty: !!chunk?.chunk,
      directContent: chunk?.content,
      directText: chunk?.text,
      streamingState: streamingManager.currentState,
    });

    // 상태 확인 및 ACTIVE 전환
    if (streamingManager.currentState === StreamingState.STARTING) {
      streamingManager.setState(StreamingState.ACTIVE);
      syncLegacyState();
      // 스트리밍이 정상적으로 시작되었으므로 에러 메시지 정리
      this.clearErrorMessages();
    } else if (streamingManager.currentState === StreamingState.IDLE) {
      console.warn("⚠️ IDLE 상태에서 청크 수신됨 - ACTIVE로 전환");
      streamingManager.setState(StreamingState.ACTIVE);
      syncLegacyState();
      // 스트리밍이 재개되었으므로 에러 메시지 정리
      this.clearErrorMessages();
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

      // 콘텐츠 추출 (다양한 필드 시도)
      let content = "";
      if (chunkData?.content !== undefined && chunkData.content !== null) {
        content = String(chunkData.content);
        console.log("✅ content 필드 사용:", content.substring(0, 50) + "...");
      } else if (chunkData?.text !== undefined && chunkData.text !== null) {
        content = String(chunkData.text);
        console.log("✅ text 필드 사용:", content.substring(0, 50) + "...");
      } else {
        console.warn("⚠️ 콘텐츠가 없는 청크:", chunkData);
        return;
      }

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
      if (
        chunkPerformanceStats.totalProcessed >=
        PERFORMANCE_LIMITS.emergencyThreshold
      ) {
        console.log("🚨 긴급 제한 도달 - 처리 중단");
        this.handleStreamingError({
          error: `청크 수가 제한(${PERFORMANCE_LIMITS.emergencyThreshold})을 초과했습니다.`,
        });
        this.cleanupStreaming();
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
        /\b(def|class|import|return|if|for|while|try|except|finally|#|```)\b/.test(
          content
        );

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

        // 스트리밍 버퍼에 추가
        streamingBuffer += batchContent;
        currentStreamingContent += batchContent;

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

        batchProcessingTimer = setTimeout(() => {
          if (content.length > 0) {
            const batchContent = content;
            const batchSize = content.length;

            console.log("📊 타임아웃 배치 처리:", {
              batchSize: batchSize,
              batchLength: batchContent.length,
              reason: "타임아웃",
            });

            streamingBuffer += batchContent;
            currentStreamingContent += batchContent;

            // 배치 처리 타이머 초기화
            if (batchProcessingTimer) {
              clearTimeout(batchProcessingTimer);
              batchProcessingTimer = null;
            }
          }
        }, 100);
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
      this.handleStreamingError({ error: error.message });
    }
  },

  async handleStreamingComplete(message) {
    console.log("🏁 스트리밍 완료 처리", streamingManager.getInfo());

    // 상태를 FINISHING으로 전환
    streamingManager.setState(StreamingState.FINISHING);
    syncLegacyState();

    // 남은 배치 처리 완료
    if (chunkBatchBuffer.length > 0) {
      const remainingContent = chunkBatchBuffer.join("");
      streamingBuffer += remainingContent;
      currentStreamingContent += remainingContent;
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
      chunkPerformanceStats.totalBytes /
      Math.max(chunkPerformanceStats.totalProcessed, 1);
    const smallChunkRatio =
      (chunkPerformanceStats.smallChunks /
        Math.max(chunkPerformanceStats.totalProcessed, 1)) *
      100;
    const largeChunkRatio =
      (chunkPerformanceStats.largeChunks /
        Math.max(chunkPerformanceStats.totalProcessed, 1)) *
      100;

    console.log("📊 스트리밍 성능 통계:", {
      totalProcessed: chunkPerformanceStats.totalProcessed,
      totalBytes: chunkPerformanceStats.totalBytes,
      avgChunkSize: Math.round(avgChunkSize * 100) / 100,
      avgProcessingTime: Math.round(avgProcessingTime * 100) / 100,
      smallChunks: chunkPerformanceStats.smallChunks,
      largeChunks: chunkPerformanceStats.largeChunks,
      smallChunkRatio: Math.round(smallChunkRatio * 100) / 100,
      largeChunkRatio: Math.round(largeChunkRatio * 100) / 100,
      withinLimits:
        chunkPerformanceStats.totalProcessed < PERFORMANCE_LIMITS.maxChunks,
    });

    // 성능 경고 출력
    if (
      chunkPerformanceStats.totalProcessed >=
      PERFORMANCE_LIMITS.warningThreshold
    ) {
      console.warn("⚠️ 청크 수 경고:", chunkPerformanceStats.totalProcessed);
    }

    if (smallChunkRatio > 30) {
      console.warn("⚠️ 작은 청크 비율 높음:", smallChunkRatio + "%");
    }

    if (avgProcessingTime > 50) {
      console.warn("⚠️ 청크 처리 시간 높음:", avgProcessingTime + "ms");
    }
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
      this.displayErrorMessage(
        message.error || "스트리밍 처리 중 오류가 발생했습니다"
      );

      console.log("✅ 스트리밍 오류 처리 완료");
    } catch (handlingError) {
      console.error("❌ 스트리밍 오류 처리 실패:", handlingError);
      // 최후의 수단으로 기존 방식 사용
      this.displayErrorMessage(
        "시스템 오류가 발생했습니다. 페이지를 새로고침해주세요."
      );
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
        currentHTML:
          responseElement?.innerHTML?.substring(0, 50) + "..." || "empty",
        parentElement: responseElement?.parentElement?.className,
      });

      if (!responseElement) {
        console.error("❌ 모든 시도에도 불구하고 응답 요소를 생성할 수 없음");
        // UI 복구 시스템 활용
        await uiRecoveryManager.recoverStreamingUI(new Error("응답 요소 없음"));
        return;
      }

      // 메인 요소에 콘텐츠 렌더링
      this.renderContentToElement(responseElement, content);

      // 강제 표시 설정
      responseElement.style.display = "block";
      responseElement.style.visibility = "visible";
      responseElement.style.opacity = "1";

      // 부모 컨테이너도 표시
      const parentContainer = responseElement.closest(
        ".response-content, .tab-content"
      );
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
          const shortContent =
            content.substring(0, 200) + (content.length > 200 ? "..." : "");
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
      // 응답 탭 강제 활성화
      const responseTab = document.querySelector('[data-tab="response"]');
      const historyTab = document.querySelector('[data-tab="history"]');
      const responseContent = document.querySelector(".response-content");
      const historyContent = document.querySelector(".history-content");

      console.log("🔍 탭 상태 확인:", {
        responseTabExists: !!responseTab,
        historyTabExists: !!historyTab,
        responseContentExists: !!responseContent,
        historyContentExists: !!historyContent,
      });

      // 모든 탭 버튼 비활성화
      document
        .querySelectorAll(".tab-btn")
        .forEach((btn) => btn.classList.remove("active"));

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

    // 응답 탭 강제 활성화
    this.activateResponseTab();

    try {
      // 안전한 요소 접근
      const responseElement = await getResponseElementSafely();
      console.log("🔍 response-content 요소 최종 확인:", {
        found: !!responseElement,
        elementType: responseElement?.tagName,
        currentContent:
          responseElement?.innerHTML?.substring(0, 50) + "..." || "empty",
        isVisible: responseElement ? responseElement.offsetHeight > 0 : false,
      });

      if (!responseElement) {
        console.error(
          "❌ response-content 요소를 찾을 수 없음 - 대체 방법 시도"
        );
        this.tryAlternativeDisplay(content);
        return;
      }

      try {
        // 기존 내용 완전 제거
        responseElement.innerHTML = "";

        // 콘텐츠 정리 및 검증
        const cleanedContent = this.cleanAIResponse(content);
        if (!cleanedContent || cleanedContent.trim().length === 0) {
          console.warn("⚠️ 정리 후 빈 콘텐츠");
          responseElement.innerHTML = `
            <div class="empty-response">
              <p>❌ 응답 내용이 비어있습니다.</p>
              <p>다시 시도해주세요.</p>
            </div>
          `;
          return;
        }

        // 안전한 렌더링
        const safeContent = this.renderCodeSafely(cleanedContent);
        responseElement.innerHTML = safeContent;

        // 강제 표시 스타일 적용
        this.forceElementVisibility(responseElement);

        // 부모 컨테이너들도 표시
        this.ensureParentVisibility(responseElement);

        // 복사 버튼 활성화
        this.activateCopyButton(cleanedContent);

        // DOM 강제 업데이트
        responseElement.offsetHeight;

        // 최종 검증
        setTimeout(
          () => this.validateFinalDisplay(responseElement, cleanedContent),
          100
        );

        console.log("✅ 최종 결과 표시 완료");
      } catch (error) {
        console.error("❌ 최종 결과 표시 오류:", error);
        this.handleDisplayError(responseElement, content, error);
      }
    } catch (outerError) {
      console.error("❌ displayFinalResult 전체 오류:", outerError);
      this.emergencyUIRecovery();
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
      elements: candidates.map((el) => ({
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
        copyButton.onclick = () => this.copyToClipboard(content);
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
    const contentMatches = element.textContent.includes(
      content.substring(0, 50)
    );

    console.log("🔍 최종 표시 검증:", {
      isVisible,
      hasContent,
      contentMatches,
      elementHeight: element.offsetHeight,
      contentLength: element.innerHTML.length,
    });

    if (!isVisible || !hasContent) {
      console.error("❌ 최종 표시 검증 실패 - 긴급 복구 시도");
      this.emergencyDisplayRecovery(element, content);
    } else {
      console.log("✅ 최종 표시 검증 성공");
    }
  },

  emergencyDisplayRecovery(element, content) {
    console.log("🚨 긴급 표시 복구 시작");

    try {
      // 최소한의 안전한 표시
      element.innerHTML = `
        <div style="
          padding: 15px; 
          background: #1e1e1e; 
          color: #d4d4d4; 
          border: 2px solid #007acc; 
          border-radius: 8px; 
          font-family: 'Consolas', monospace; 
          white-space: pre-wrap; 
          word-break: break-word;
          line-height: 1.4;
          min-height: 100px;
          display: block !important;
          visibility: visible !important;
        ">
          <h4 style="color: #4fc3f7; margin: 0 0 10px 0;">🤖 HAPA AI 응답:</h4>
          <div style="background: #2d2d2d; padding: 10px; border-radius: 4px; overflow-x: auto;">
            ${this.escapeHtml(content)}
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

  // 응답 탭 활성화 함수
  activateResponseTab() {
    try {
      console.log("🔄 응답 탭 활성화 시작");

      // 모든 탭 버튼에서 active 클래스 제거
      const allTabBtns = document.querySelectorAll(".tab-btn");
      allTabBtns.forEach((btn) => {
        btn.classList.remove("active");
        console.log("📱 탭 버튼 비활성화:", btn.textContent?.trim());
      });

      // 모든 탭 컨텐츠 확인 및 설정
      const responseContent = document.querySelector(".response-content");
      const historyContent = document.querySelector(".history-content");

      console.log("🔍 탭 컨텐츠 요소 상태:", {
        responseContent: !!responseContent,
        historyContent: !!historyContent,
        responseDisplay: responseContent
          ? responseContent.style.display
          : "unknown",
        historyDisplay: historyContent
          ? historyContent.style.display
          : "unknown",
      });

      // 히스토리 탭 강제 숨김
      if (historyContent) {
        historyContent.style.display = "none";
        historyContent.style.visibility = "hidden";
        console.log("📚 히스토리 컨텐츠 숨김");
      }

      // 응답 탭 강제 표시
      if (responseContent) {
        responseContent.style.display = "block";
        responseContent.style.visibility = "visible";
        responseContent.style.opacity = "1";
        responseContent.style.position = "relative";
        responseContent.style.zIndex = "1";

        // 자식 요소들도 강제 표시
        const responseDisplay =
          responseContent.querySelector("#response-content");
        if (responseDisplay) {
          responseDisplay.style.display = "block";
          responseDisplay.style.visibility = "visible";
          responseDisplay.style.opacity = "1";
        }

        console.log("✅ 응답 컨텐츠 강제 표시");
      } else {
        console.error("❌ .response-content 요소를 찾을 수 없음");

        // 대안: 모든 response 관련 요소 강제 표시
        const allResponseEls = document.querySelectorAll(
          '[class*="response"], [id*="response"]'
        );
        console.log(
          "🔍 대안으로 모든 response 요소 표시:",
          allResponseEls.length
        );
        allResponseEls.forEach((el) => {
          if (el.id !== "response-content") {
            // 내용 요소가 아닌 컨테이너만
            el.style.display = "block";
            el.style.visibility = "visible";
          }
        });
      }

      // 응답 탭 버튼 활성화
      const responseTabBtn = document.querySelector('[data-tab="response"]');
      if (responseTabBtn) {
        responseTabBtn.classList.add("active");
        responseTabBtn.style.backgroundColor =
          "var(--vscode-button-background)";
        responseTabBtn.style.color = "var(--vscode-button-foreground)";
        console.log("✅ 응답 탭 버튼 활성화");
      } else {
        console.warn("⚠️ 응답 탭 버튼을 찾을 수 없음");

        // 대안: 모든 탭 버튼 찾아서 첫 번째 활성화
        const firstTabBtn = document.querySelector(".tab-btn");
        if (firstTabBtn) {
          firstTabBtn.classList.add("active");
          console.log("✅ 대안으로 첫 번째 탭 버튼 활성화");
        }
      }

      // 강제 리플로우 및 리페인트
      document.body.offsetHeight;

      // 최종 검증
      setTimeout(() => {
        const finalResponseContent =
          document.querySelector(".response-content");
        const finalResponseElement =
          document.getElementById("response-content");

        console.log("🔍 최종 상태 검증:", {
          responseContainer: finalResponseContent
            ? finalResponseContent.style.display
            : "not found",
          responseElement: finalResponseElement
            ? finalResponseElement.style.display
            : "not found",
          responseElementVisible: finalResponseElement
            ? finalResponseElement.offsetHeight > 0
            : false,
          responseElementContent: finalResponseElement
            ? finalResponseElement.innerHTML.length
            : 0,
        });
      }, 100);

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
      if (
        typeof streamingAbortController !== "undefined" &&
        streamingAbortController
      ) {
        streamingAbortController.abort();
        streamingAbortController = null;
        console.log("✅ streamingAbortController 정리 완료");
      }

      // 전역 버퍼 정리
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

      // 긴급 정리 - 최소한의 정리라도 수행
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
    this.displayErrorMessage(
      "다수의 오류가 발생했습니다. 페이지를 새로고침해주세요."
    );
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

    specialTokenPatterns.forEach((pattern) => {
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
      .catch((err) => {
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
      allButtons.forEach((btn) => {
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
        generateBtn.style.cssText =
          "opacity: 1 !important; cursor: pointer !important;";
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
};

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
    currentState: streamingManager
      ? streamingManager.currentState
      : "undefined",
  });

  // 추가 DOM 디버깅
  const allInputs = document.querySelectorAll("input, textarea");
  console.log(
    "🔍 페이지의 모든 입력 요소:",
    Array.from(allInputs).map((el) => ({
      tagName: el.tagName,
      id: el.id,
      value: el.value,
      placeholder: el.placeholder,
    }))
  );

  // 질문 검증 로직 개선
  if (!question || question.length < 3) {
    console.warn("⚠️ 유효하지 않은 질문 - 사용자에게 알림");
    console.warn("⚠️ 검증 실패 상세:", {
      questionExists: !!question,
      questionLength: question.length,
      minRequired: 3,
      actualQuestion: `"${question}"`,
    });

    // 알림 메시지 표시 (alert 대신 DOM 메시지 사용)
    const messageDiv = document.createElement("div");
    messageDiv.style.cssText =
      "color: red; margin: 10px 0; padding: 10px; background: #fee; border: 1px solid #fcc; border-radius: 4px;";
    messageDiv.textContent = "최소 3자 이상의 질문을 입력해주세요.";

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

  // 이미 스트리밍 중인 경우 처리
  if (streamingManager.isActive()) {
    console.warn("⚠️ 이미 스트리밍 진행 중:", streamingManager.getInfo());
    alert("현재 코드 생성이 진행 중입니다. 잠시 후 다시 시도해주세요.");
    return;
  }

  console.log("📝 질문 제출:", question);
  console.log("🎯 선택된 모델:", window.selectedModel);

  // 스트리밍 상태 초기화 (STARTING 상태는 handleStreamingStarted에서 설정)
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

  // 모델 타입 매핑
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

// DOM 요소 존재 확인
document.addEventListener("DOMContentLoaded", function () {
  console.log("🔍 DOM 요소 확인:", {
    questionInput: !!document.getElementById("questionInput"),
    responseContent: !!document.getElementById("response-content"),
    historyContent: !!document.getElementById("historyContent"),
    submitButton: !!document.getElementById("submitButton"),
    responseTab: !!document.querySelector(".tab-button[data-tab='response']"),
    historyTab: !!document.querySelector(".tab-button[data-tab='history']"),
  });
});

// 메시지 수신 디버깅 강화
window.addEventListener("message", (event) => {
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
    responseVisible:
      document.getElementById("response-content")?.style?.display !== "none",
    responseContent:
      document
        .getElementById("response-content")
        ?.innerHTML?.substring(0, 100) + "...",
  });
});

window.addEventListener("message", (event) => {
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
  console.log("🎯 HAPA 사이드바 초기화 시작");

  // 테스트용 히스토리 데이터 추가 (개발 환경에서만)
  if (window.location.href.includes("vscode-webview")) {
    setTimeout(() => {
      addTestHistoryData();
      setupEventListeners();
      console.log("✅ HAPA 사이드바 초기화 완료");
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
          question: "파이썬에서 리스트를 정렬하는 방법은?",
          response: "sorted() 함수나 .sort() 메서드를 사용할 수 있습니다.",
          timestamp: new Date(Date.now() - 3600000).toISOString(), // 1시간 전
        },
        {
          question: "Django 모델에서 데이터를 조회하는 방법",
          response:
            "Model.objects.filter()나 Model.objects.get() 메서드를 사용합니다.",
          timestamp: new Date(Date.now() - 7200000).toISOString(), // 2시간 전
        },
        {
          question: "FastAPI에서 비동기 함수 작성법",
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
          <div class="history-timestamp">${formatTimestamp(
            item.timestamp
          )}</div>
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
  modelTabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      const modelType = this.getAttribute("data-model");
      selectModelTab(modelType);
    });
  });

  // 엔터키 이벤트 리스너
  const questionInput = document.getElementById("questionInput");
  if (questionInput) {
    questionInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        submitQuestion();
      }
    });
  }

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
  tabBtns.forEach((btn) => {
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

  // 실제 구현에서는 저장된 히스토리에서 해당 항목의 전체 응답을 로드
  const responseElement = document.getElementById("response-content");
  if (responseElement) {
    responseElement.innerHTML = `
      <div style="padding: 15px; background: #1e1e1e; color: #d4d4d4; border-radius: 8px;">
        <h4 style="color: #4fc3f7; margin-bottom: 10px;">📖 히스토리에서 로드된 응답</h4>
        <p>이것은 테스트용 히스토리 항목입니다. 실제 구현에서는 저장된 전체 응답이 표시됩니다.</p>
        <pre style="background: #2d2d2d; padding: 10px; border-radius: 4px; margin-top: 10px;">
# 예시 코드
def example_function():
    print("Hello, HAPA!")
    return "success"
        </pre>
      </div>
    `;

    // 응답 탭으로 전환
    switchTab("response");
    console.log("✅ 히스토리 항목 로드 완료");
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
  const responseTab = document.querySelector(
    ".tab-button[data-tab='response']"
  );
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
      const parentContainer = responseContent.closest(
        ".response-content, .tab-content"
      );
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
        if (!responseElement) return "MISSING_ELEMENT";

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
          return tabContent
            ? getComputedStyle(tabContent).display
            : "NOT_FOUND";
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

    if (
      diagnostics.streamingState.isActive &&
      !diagnostics.elements.responseContentSafe
    ) {
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
    chunkPerformanceStats.totalBytes /
    Math.max(chunkPerformanceStats.totalProcessed, 1);
  const smallChunkRatio =
    (chunkPerformanceStats.smallChunks /
      Math.max(chunkPerformanceStats.totalProcessed, 1)) *
    100;
  const largeChunkRatio =
    (chunkPerformanceStats.largeChunks /
      Math.max(chunkPerformanceStats.totalProcessed, 1)) *
    100;

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
            chunkPerformanceStats.totalProcessed >
            PERFORMANCE_LIMITS.warningThreshold
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
          chunkPerformanceStats.totalProcessed >
          PERFORMANCE_LIMITS.warningThreshold
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

    const observer = new MutationObserver((mutations) => {
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
    const container =
      document.querySelector(".response-content") || document.body;
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
      // 전역 상태 초기화
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

      // 전역 상태 강제 초기화
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
      if (
        confirm("시스템 복구에 실패했습니다. 페이지를 새로고침하시겠습니까?")
      ) {
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
        const errorLogs = JSON.parse(
          localStorage.getItem("hapa_error_logs") || "[]"
        );
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
    safeLog("debug", "스트리밍 상태 전환 테스트 시작");

    const originalState = streamingManager.currentState;
    const testStates = [
      StreamingState.STARTING,
      StreamingState.ACTIVE,
      StreamingState.FINISHING,
      StreamingState.COMPLETED,
      StreamingState.IDLE,
    ];

    try {
      testStates.forEach((state, index) => {
        streamingManager.setState(state, { testIndex: index });
        safeLog("debug", `상태 전환 ${index + 1}: ${state}`, {
          currentState: streamingManager.currentState,
          isActive: streamingManager.isActive(),
        });
      });

      safeLog("debug", "✅ 상태 전환 테스트 완료");
      return true;
    } catch (error) {
      safeLog("error", "❌ 상태 전환 테스트 실패", error);
      return false;
    } finally {
      // 원래 상태로 복원
      streamingManager.setState(originalState);
    }
  },

  /**
   * UI 복구 시스템 테스트
   */
  async testUIRecovery() {
    safeLog("debug", "UI 복구 시스템 테스트 시작");

    try {
      const testError = new Error("테스트 오류");
      await uiRecoveryManager.recoverStreamingUI(testError);
      safeLog("debug", "✅ UI 복구 테스트 완료");
      return true;
    } catch (error) {
      safeLog("error", "❌ UI 복구 테스트 실패", error);
      return false;
    }
  },

  /**
   * 전체 시스템 테스트
   */
  async runFullTest() {
    safeLog("debug", "전체 시스템 테스트 시작");

    const results = {
      stateTransitions: this.testStateTransitions(),
      uiRecovery: await this.testUIRecovery(),
      systemDiagnosis: diagnoseSystemState(),
    };

    const success = results.stateTransitions && results.uiRecovery;
    safeLog(
      success ? "debug" : "error",
      `전체 테스트 ${success ? "성공" : "실패"}`,
      results
    );

    return results;
  },
};

/**
 * 전역 오류 핸들러 설정
 */
window.addEventListener("error", (event) => {
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
    uiRecoveryManager.recoverStreamingUI(event.error).catch((recoveryError) => {
      safeLog("error", "UI 복구 실패", recoveryError);
    });
  }
});

window.addEventListener("unhandledrejection", (event) => {
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
  safeLog(
    "debug",
    "사용 가능한 전역 함수: diagnoseSystemState, testSuite, uiRecoveryManager"
  );
}

// 초기 시스템 상태 진단 (DEBUG 모드에서만)
if (DEBUG_MODE) {
  setTimeout(() => {
    diagnoseSystemState();
  }, 1000);
}
