import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { EnhancedErrorService, ErrorSeverity } from "./EnhancedErrorService";
import { MemoryManager } from "./MemoryManager";

export interface OfflineRequest {
  id: string;
  type: "completion" | "analysis" | "generation";
  payload: any;
  timestamp: Date;
  retryCount: number;
  priority: "low" | "medium" | "high";
}

export interface CachedResponse {
  id: string;
  requestHash: string;
  response: any;
  timestamp: Date;
  expiresAt: Date;
  size: number;
}

export interface OfflineStatus {
  isOnline: boolean;
  lastOnlineCheck: Date;
  pendingRequests: number;
  cachedResponses: number;
  queueSize: number;
}

export class OfflineService {
  private static instance: OfflineService;
  private errorService = EnhancedErrorService.getInstance();
  private memoryManager = MemoryManager.getInstance();

  // 오프라인 상태 관리
  private isOnline = true;
  private onlineCheckInterval: NodeJS.Timeout | null = null;
  private lastOnlineCheck = new Date();

  // 요청 큐 관리
  private pendingRequests: OfflineRequest[] = [];
  private maxQueueSize = 1000;

  // 로컬 캐시 관리
  private responseCache: Map<string, CachedResponse> = new Map();
  private maxCacheSize = 100 * 1024 * 1024; // 100MB
  private currentCacheSize = 0;

  // 파일 시스템 경로
  private cacheDir: string;
  private queueFile: string;

  // 이벤트 리스너
  private onlineStatusListeners: ((isOnline: boolean) => void)[] = [];

  static getInstance(): OfflineService {
    if (!OfflineService.instance) {
      OfflineService.instance = new OfflineService();
    }
    return OfflineService.instance;
  }

  constructor() {
    // 캐시 디렉토리 설정
    const extensionPath =
      vscode.extensions.getExtension("hapa.ai-assistant")?.extensionPath;
    this.cacheDir = path.join(extensionPath || process.cwd(), "offline-cache");
    this.queueFile = path.join(this.cacheDir, "pending-queue.json");

    this.initializeOfflineService();
  }

  /**
   * 오프라인 서비스 초기화
   */
  private async initializeOfflineService(): Promise<void> {
    try {
      // 캐시 디렉토리 생성
      await this.ensureCacheDirectory();

      // 이전 세션의 큐 복원
      await this.restorePendingQueue();

      // 캐시 복원
      await this.restoreCache();

      // 온라인 상태 모니터링 시작
      this.startOnlineMonitoring();

      console.log("✅ OfflineService 초기화 완료");
    } catch (error) {
      this.errorService.logError(error as Error, ErrorSeverity.MEDIUM, {
        component: "OfflineService",
        phase: "initialization",
      });
    }
  }

  /**
   * 온라인 상태 확인
   */
  async checkOnlineStatus(): Promise<boolean> {
    try {
      // DNS 조회로 네트워크 연결 확인
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch("https://www.google.com", {
        method: "HEAD",
        signal: controller.signal,
        mode: "no-cors",
      });

      clearTimeout(timeoutId);
      this.setOnlineStatus(true);
      return true;
    } catch (error) {
      this.setOnlineStatus(false);
      return false;
    }
  }

  /**
   * 온라인 상태 설정
   */
  private setOnlineStatus(online: boolean): void {
    const wasOnline = this.isOnline;
    this.isOnline = online;
    this.lastOnlineCheck = new Date();

    if (wasOnline !== online) {
      // 상태 변경 시 리스너들에게 알림
      this.onlineStatusListeners.forEach((listener) => {
        try {
          listener(online);
        } catch (error) {
          this.errorService.logError(error as Error, ErrorSeverity.LOW, {
            listener: "onlineStatusListener",
          });
        }
      });

      // 온라인 상태가 되면 큐 처리
      if (online) {
        this.processPendingQueue();
      }

      // 상태 변경 알림
      vscode.window.showInformationMessage(
        online
          ? `🌐 온라인 상태 복원됨 (대기 중인 요청: ${this.pendingRequests.length}개)`
          : `🔌 오프라인 모드 - 요청들이 큐에 저장됩니다`
      );
    }
  }

  /**
   * 온라인 상태 모니터링 시작
   */
  private startOnlineMonitoring(): void {
    this.onlineCheckInterval = this.memoryManager.setInterval(async () => {
      await this.checkOnlineStatus();
    }, 30000); // 30초마다 확인
  }

  /**
   * 요청을 오프라인 큐에 추가
   */
  addToQueue(
    type: OfflineRequest["type"],
    payload: any,
    priority: OfflineRequest["priority"] = "medium"
  ): string {
    const request: OfflineRequest = {
      id: this.generateRequestId(),
      type,
      payload,
      timestamp: new Date(),
      retryCount: 0,
      priority,
    };

    // 우선순위에 따른 삽입
    const insertIndex = this.findInsertionIndex(priority);
    this.pendingRequests.splice(insertIndex, 0, request);

    // 큐 크기 제한
    if (this.pendingRequests.length > this.maxQueueSize) {
      const removed = this.pendingRequests.splice(this.maxQueueSize);
      this.errorService.logError(
        `큐 크기 제한으로 ${removed.length}개 요청 제거됨`,
        ErrorSeverity.LOW
      );
    }

    // 파일에 저장
    this.saveQueueToFile();

    return request.id;
  }

  /**
   * 우선순위에 따른 삽입 위치 찾기
   */
  private findInsertionIndex(priority: OfflineRequest["priority"]): number {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const targetPriority = priorityOrder[priority];

    for (let i = 0; i < this.pendingRequests.length; i++) {
      const currentPriority = priorityOrder[this.pendingRequests[i].priority];
      if (currentPriority > targetPriority) {
        return i;
      }
    }
    return this.pendingRequests.length;
  }

  /**
   * 응답을 로컬 캐시에 저장
   */
  cacheResponse(
    requestPayload: any,
    response: any,
    ttlMinutes: number = 60
  ): void {
    const requestHash = this.hashRequest(requestPayload);
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
    const responseStr = JSON.stringify(response);
    const size = Buffer.byteLength(responseStr, "utf8");

    const cachedResponse: CachedResponse = {
      id: this.generateRequestId(),
      requestHash,
      response,
      timestamp: new Date(),
      expiresAt,
      size,
    };

    // 캐시 크기 확인 및 정리
    this.ensureCacheSpace(size);

    this.responseCache.set(requestHash, cachedResponse);
    this.currentCacheSize += size;

    // 파일에 저장
    this.saveCacheToFile(requestHash, cachedResponse);
  }

  /**
   * 캐시에서 응답 조회
   */
  getCachedResponse(requestPayload: any): any | null {
    const requestHash = this.hashRequest(requestPayload);
    const cached = this.responseCache.get(requestHash);

    if (!cached) {
      return null;
    }

    // 만료 확인
    if (new Date() > cached.expiresAt) {
      this.responseCache.delete(requestHash);
      this.currentCacheSize -= cached.size;
      this.deleteCacheFile(requestHash);
      return null;
    }

    return cached.response;
  }

  /**
   * 대기 중인 큐 처리
   */
  private async processPendingQueue(): Promise<void> {
    if (!this.isOnline || this.pendingRequests.length === 0) {
      return;
    }

    const batch = this.pendingRequests.splice(0, 5); // 한 번에 5개씩 처리

    for (const request of batch) {
      try {
        await this.processQueuedRequest(request);
      } catch (error) {
        request.retryCount++;

        if (request.retryCount < 3) {
          // 재시도
          this.pendingRequests.unshift(request);
        } else {
          // 최대 재시도 횟수 초과
          this.errorService.logError(
            `큐 요청 처리 실패 (최대 재시도 초과): ${request.id}`,
            ErrorSeverity.MEDIUM,
            { request }
          );
        }
      }
    }

    // 큐 파일 업데이트
    this.saveQueueToFile();

    // 더 처리할 요청이 있으면 계속
    if (this.pendingRequests.length > 0) {
      this.memoryManager.setTimeout(() => this.processPendingQueue(), 1000);
    }
  }

  /**
   * 큐된 요청 처리
   */
  private async processQueuedRequest(request: OfflineRequest): Promise<void> {
    // 실제 API 호출 로직은 각 모듈에서 구현
    // 여기서는 인터페이스만 제공
    switch (request.type) {
      case "completion":
        await this.processCompletionRequest(request);
        break;
      case "analysis":
        await this.processAnalysisRequest(request);
        break;
      case "generation":
        await this.processGenerationRequest(request);
        break;
    }
  }

  /**
   * 완성 요청 처리
   */
  private async processCompletionRequest(
    request: OfflineRequest
  ): Promise<void> {
    try {
      // API 클라이언트를 통한 실제 완성 요청
      const { apiClient } = await import("../modules/apiClient.js");

      const completionResponse = await apiClient.completeCode({
        prefix: request.payload.prefix || "",
        language: request.payload.language || "python",
        cursor_position: request.payload.cursor_position || 0,
        file_path: request.payload.file_path || "",
        context: request.payload.context || "",
        trigger_character: request.payload.trigger_character || "",
      });

      // 성공 시 응답 캐시
      this.cacheResponse(
        request.payload,
        completionResponse,
        30 // 30분 캐시
      );

      // 성공 로그 (낮은 심각도로 기록)
      this.errorService.logError(
        `완성 요청 처리 완료: ${request.id} (completions: ${
          completionResponse.completions?.length || 0
        })`,
        ErrorSeverity.LOW,
        {
          completions_count: completionResponse.completions?.length || 0,
          cached: true,
        }
      );
    } catch (error) {
      this.errorService.logError(error as Error, ErrorSeverity.MEDIUM, {
        operation: "processCompletionRequest",
        requestId: request.id,
        retryCount: request.retryCount,
      });

      // 재시도 카운트 증가
      request.retryCount += 1;

      // 최대 재시도 횟수 초과 시 큐에서 제거
      if (request.retryCount >= 3) {
        const index = this.pendingRequests.findIndex(
          (r) => r.id === request.id
        );
        if (index > -1) {
          this.pendingRequests.splice(index, 1);
        }
      }
    }
  }

  /**
   * 분석 요청 처리
   */
  private async processAnalysisRequest(request: OfflineRequest): Promise<void> {
    try {
      // API 클라이언트를 통한 실제 코드 분석 요청
      const { apiClient } = await import("../modules/apiClient.js");

      // 코드 분석을 위한 생성 요청으로 처리
      const analysisResponse = await apiClient.generateCode({
        user_question: `다음 코드를 분석해주세요: ${
          request.payload.question || "코드 품질 분석"
        }`,
        code_context: request.payload.code || "",
        language: request.payload.language || "python",
        file_path: request.payload.file_path || "",
      });

      // 성공 시 응답 캐시
      this.cacheResponse(
        request.payload,
        analysisResponse,
        60 // 60분 캐시
      );

      // 성공 로그 (낮은 심각도로 기록)
      this.errorService.logError(
        `분석 요청 처리 완료: ${request.id} (분석 길이: ${
          analysisResponse.explanation?.length || 0
        })`,
        ErrorSeverity.LOW,
        {
          analysis_length: analysisResponse.explanation?.length || 0,
          cached: true,
        }
      );
    } catch (error) {
      this.errorService.logError(error as Error, ErrorSeverity.MEDIUM, {
        operation: "processAnalysisRequest",
        requestId: request.id,
        retryCount: request.retryCount,
      });

      // 재시도 카운트 증가
      request.retryCount += 1;

      // 최대 재시도 횟수 초과 시 큐에서 제거
      if (request.retryCount >= 3) {
        const index = this.pendingRequests.findIndex(
          (r) => r.id === request.id
        );
        if (index > -1) {
          this.pendingRequests.splice(index, 1);
        }
      }
    }
  }

  /**
   * 생성 요청 처리
   */
  private async processGenerationRequest(
    request: OfflineRequest
  ): Promise<void> {
    try {
      // API 클라이언트를 통한 실제 코드 생성 요청
      const { apiClient } = await import("../modules/apiClient.js");

      const generationResponse = await apiClient.generateCode({
        user_question: request.payload.user_question || "",
        code_context: request.payload.code_context || "",
        language: request.payload.language || "python",
        file_path: request.payload.file_path || "",
      });

      // 성공 시 응답 캐시
      this.cacheResponse(
        request.payload,
        generationResponse,
        120 // 120분 캐시
      );

      // 성공 로그 (낮은 심각도로 기록)
      this.errorService.logError(
        `생성 요청 처리 완료: ${request.id} (코드 길이: ${
          generationResponse.generated_code?.length || 0
        })`,
        ErrorSeverity.LOW,
        {
          code_length: generationResponse.generated_code?.length || 0,
          cached: true,
        }
      );
    } catch (error) {
      this.errorService.logError(error as Error, ErrorSeverity.MEDIUM, {
        operation: "processGenerationRequest",
        requestId: request.id,
        retryCount: request.retryCount,
      });

      // 재시도 카운트 증가
      request.retryCount += 1;

      // 최대 재시도 횟수 초과 시 큐에서 제거
      if (request.retryCount >= 3) {
        const index = this.pendingRequests.findIndex(
          (r) => r.id === request.id
        );
        if (index > -1) {
          this.pendingRequests.splice(index, 1);
        }
      }
    }
  }

  /**
   * 오프라인 상태 조회
   */
  getStatus(): OfflineStatus {
    return {
      isOnline: this.isOnline,
      lastOnlineCheck: this.lastOnlineCheck,
      pendingRequests: this.pendingRequests.length,
      cachedResponses: this.responseCache.size,
      queueSize: this.currentCacheSize,
    };
  }

  /**
   * 온라인 상태 리스너 등록
   */
  onOnlineStatusChange(listener: (isOnline: boolean) => void): void {
    this.onlineStatusListeners.push(listener);
  }

  /**
   * 캐시 정리
   */
  clearCache(): void {
    this.responseCache.clear();
    this.currentCacheSize = 0;

    // 캐시 파일들 삭제
    try {
      const files = fs.readdirSync(this.cacheDir);
      files.forEach((file) => {
        if (file.endsWith(".cache")) {
          fs.unlinkSync(path.join(this.cacheDir, file));
        }
      });

      // 성공 로그
      this.errorService.logError(
        `오프라인 캐시 정리 완료 (${files.length}개 파일)`,
        ErrorSeverity.LOW,
        { operation: "clearCache", filesCount: files.length }
      );
    } catch (error) {
      this.errorService.logError(error as Error, ErrorSeverity.LOW, {
        operation: "clearCache",
      });
    }
  }

  /**
   * 큐 정리
   */
  clearQueue(): void {
    this.pendingRequests = [];
    this.saveQueueToFile();
  }

  /**
   * 정리
   */
  cleanup(): void {
    if (this.onlineCheckInterval) {
      this.memoryManager.clearInterval(this.onlineCheckInterval);
      this.onlineCheckInterval = null;
    }

    this.onlineStatusListeners = [];
    this.saveQueueToFile();
  }

  // === 유틸리티 메서드들 ===

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private hashRequest(payload: any): string {
    const str = JSON.stringify(payload);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // 32비트 정수로 변환
    }
    return hash.toString(36);
  }

  private async ensureCacheDirectory(): Promise<void> {
    try {
      if (!fs.existsSync(this.cacheDir)) {
        fs.mkdirSync(this.cacheDir, { recursive: true });
      }
    } catch (error) {
      this.errorService.logError(error as Error, ErrorSeverity.MEDIUM, {
        operation: "ensureCacheDirectory",
      });
    }
  }

  private ensureCacheSpace(requiredSize: number): void {
    while (
      this.currentCacheSize + requiredSize > this.maxCacheSize &&
      this.responseCache.size > 0
    ) {
      // 가장 오래된 캐시 항목 제거 (LRU)
      const oldest = Array.from(this.responseCache.entries()).sort(
        ([, a], [, b]) => a.timestamp.getTime() - b.timestamp.getTime()
      )[0];

      if (oldest) {
        const [key, value] = oldest;
        this.responseCache.delete(key);
        this.currentCacheSize -= value.size;
        this.deleteCacheFile(key);
      }
    }
  }

  private async saveQueueToFile(): Promise<void> {
    try {
      const data = JSON.stringify(this.pendingRequests, null, 2);
      fs.writeFileSync(this.queueFile, data, "utf8");
    } catch (error) {
      this.errorService.logError(error as Error, ErrorSeverity.LOW, {
        operation: "saveQueueToFile",
      });
    }
  }

  private async restorePendingQueue(): Promise<void> {
    try {
      if (fs.existsSync(this.queueFile)) {
        const data = fs.readFileSync(this.queueFile, "utf8");
        this.pendingRequests = JSON.parse(data);

        // 날짜 객체 복원
        this.pendingRequests.forEach((req) => {
          req.timestamp = new Date(req.timestamp);
        });
      }
    } catch (error) {
      this.errorService.logError(error as Error, ErrorSeverity.LOW, {
        operation: "restorePendingQueue",
      });
      this.pendingRequests = [];
    }
  }

  private saveCacheToFile(key: string, cached: CachedResponse): void {
    try {
      const filePath = path.join(this.cacheDir, `${key}.cache`);
      const data = JSON.stringify(cached);
      fs.writeFileSync(filePath, data, "utf8");
    } catch (error) {
      this.errorService.logError(error as Error, ErrorSeverity.LOW, {
        operation: "saveCacheToFile",
        key,
      });
    }
  }

  private async restoreCache(): Promise<void> {
    try {
      if (!fs.existsSync(this.cacheDir)) return;

      const files = fs.readdirSync(this.cacheDir);

      for (const file of files) {
        if (file.endsWith(".cache")) {
          try {
            const filePath = path.join(this.cacheDir, file);
            const data = fs.readFileSync(filePath, "utf8");
            const cached: CachedResponse = JSON.parse(data);

            // 날짜 객체 복원
            cached.timestamp = new Date(cached.timestamp);
            cached.expiresAt = new Date(cached.expiresAt);

            // 만료 확인
            if (new Date() <= cached.expiresAt) {
              this.responseCache.set(cached.requestHash, cached);
              this.currentCacheSize += cached.size;
            } else {
              fs.unlinkSync(filePath);
            }
          } catch (error) {
            // 손상된 캐시 파일 삭제
            const filePath = path.join(this.cacheDir, file);
            fs.unlinkSync(filePath);
          }
        }
      }
    } catch (error) {
      this.errorService.logError(error as Error, ErrorSeverity.LOW, {
        operation: "restoreCache",
      });
    }
  }

  private deleteCacheFile(key: string): void {
    try {
      const filePath = path.join(this.cacheDir, `${key}.cache`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      this.errorService.logError(error as Error, ErrorSeverity.LOW, {
        operation: "deleteCacheFile",
        key,
      });
    }
  }
}
