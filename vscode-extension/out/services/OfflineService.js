"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfflineService = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const EnhancedErrorService_1 = require("./EnhancedErrorService");
const MemoryManager_1 = require("./MemoryManager");
class OfflineService {
    static instance;
    errorService = EnhancedErrorService_1.EnhancedErrorService.getInstance();
    memoryManager = MemoryManager_1.MemoryManager.getInstance();
    // 오프라인 상태 관리
    isOnline = true;
    onlineCheckInterval = null;
    lastOnlineCheck = new Date();
    // 요청 큐 관리
    pendingRequests = [];
    maxQueueSize = 1000;
    // 로컬 캐시 관리
    responseCache = new Map();
    maxCacheSize = 100 * 1024 * 1024; // 100MB
    currentCacheSize = 0;
    // 파일 시스템 경로
    cacheDir;
    queueFile;
    // 이벤트 리스너
    onlineStatusListeners = [];
    static getInstance() {
        if (!OfflineService.instance) {
            OfflineService.instance = new OfflineService();
        }
        return OfflineService.instance;
    }
    constructor() {
        // 캐시 디렉토리 설정
        const extensionPath = vscode.extensions.getExtension("hapa.ai-assistant")?.extensionPath;
        this.cacheDir = path.join(extensionPath || process.cwd(), "offline-cache");
        this.queueFile = path.join(this.cacheDir, "pending-queue.json");
        this.initializeOfflineService();
    }
    /**
     * 오프라인 서비스 초기화
     */
    async initializeOfflineService() {
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
        }
        catch (error) {
            this.errorService.logError(error, EnhancedErrorService_1.ErrorSeverity.MEDIUM, {
                component: "OfflineService",
                phase: "initialization",
            });
        }
    }
    /**
     * 온라인 상태 확인
     */
    async checkOnlineStatus() {
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
        }
        catch (error) {
            this.setOnlineStatus(false);
            return false;
        }
    }
    /**
     * 온라인 상태 설정
     */
    setOnlineStatus(online) {
        const wasOnline = this.isOnline;
        this.isOnline = online;
        this.lastOnlineCheck = new Date();
        if (wasOnline !== online) {
            // 상태 변경 시 리스너들에게 알림
            this.onlineStatusListeners.forEach((listener) => {
                try {
                    listener(online);
                }
                catch (error) {
                    this.errorService.logError(error, EnhancedErrorService_1.ErrorSeverity.LOW, {
                        listener: "onlineStatusListener",
                    });
                }
            });
            // 온라인 상태가 되면 큐 처리
            if (online) {
                this.processPendingQueue();
            }
            // 상태 변경 알림
            vscode.window.showInformationMessage(online
                ? `🌐 온라인 상태 복원됨 (대기 중인 요청: ${this.pendingRequests.length}개)`
                : `🔌 오프라인 모드 - 요청들이 큐에 저장됩니다`);
        }
    }
    /**
     * 온라인 상태 모니터링 시작
     */
    startOnlineMonitoring() {
        this.onlineCheckInterval = this.memoryManager.setInterval(async () => {
            await this.checkOnlineStatus();
        }, 30000); // 30초마다 확인
    }
    /**
     * 요청을 오프라인 큐에 추가
     */
    addToQueue(type, payload, priority = "medium") {
        const request = {
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
            this.errorService.logError(`큐 크기 제한으로 ${removed.length}개 요청 제거됨`, EnhancedErrorService_1.ErrorSeverity.LOW);
        }
        // 파일에 저장
        this.saveQueueToFile();
        return request.id;
    }
    /**
     * 우선순위에 따른 삽입 위치 찾기
     */
    findInsertionIndex(priority) {
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
    cacheResponse(requestPayload, response, ttlMinutes = 60) {
        const requestHash = this.hashRequest(requestPayload);
        const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
        const responseStr = JSON.stringify(response);
        const size = Buffer.byteLength(responseStr, "utf8");
        const cachedResponse = {
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
    getCachedResponse(requestPayload) {
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
    async processPendingQueue() {
        if (!this.isOnline || this.pendingRequests.length === 0) {
            return;
        }
        const batch = this.pendingRequests.splice(0, 5); // 한 번에 5개씩 처리
        for (const request of batch) {
            try {
                await this.processQueuedRequest(request);
            }
            catch (error) {
                request.retryCount++;
                if (request.retryCount < 3) {
                    // 재시도
                    this.pendingRequests.unshift(request);
                }
                else {
                    // 최대 재시도 횟수 초과
                    this.errorService.logError(`큐 요청 처리 실패 (최대 재시도 초과): ${request.id}`, EnhancedErrorService_1.ErrorSeverity.MEDIUM, { request });
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
    async processQueuedRequest(request) {
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
    async processCompletionRequest(request) {
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
            this.cacheResponse(request.payload, completionResponse, 30 // 30분 캐시
            );
            // 성공 로그 (낮은 심각도로 기록)
            this.errorService.logError(`완성 요청 처리 완료: ${request.id} (completions: ${completionResponse.completions?.length || 0})`, EnhancedErrorService_1.ErrorSeverity.LOW, {
                completions_count: completionResponse.completions?.length || 0,
                cached: true,
            });
        }
        catch (error) {
            this.errorService.logError(error, EnhancedErrorService_1.ErrorSeverity.MEDIUM, {
                operation: "processCompletionRequest",
                requestId: request.id,
                retryCount: request.retryCount,
            });
            // 재시도 카운트 증가
            request.retryCount += 1;
            // 최대 재시도 횟수 초과 시 큐에서 제거
            if (request.retryCount >= 3) {
                const index = this.pendingRequests.findIndex((r) => r.id === request.id);
                if (index > -1) {
                    this.pendingRequests.splice(index, 1);
                }
            }
        }
    }
    /**
     * 분석 요청 처리
     */
    async processAnalysisRequest(request) {
        try {
            // API 클라이언트를 통한 실제 코드 분석 요청
            const { apiClient } = await import("../modules/apiClient.js");
            // 코드 분석을 위한 생성 요청으로 처리
            const analysisResponse = await apiClient.generateCode({
                user_question: `다음 코드를 분석해주세요: ${request.payload.question || "코드 품질 분석"}`,
                code_context: request.payload.code || "",
                language: request.payload.language || "python",
                file_path: request.payload.file_path || "",
            });
            // 성공 시 응답 캐시
            this.cacheResponse(request.payload, analysisResponse, 60 // 60분 캐시
            );
            // 성공 로그 (낮은 심각도로 기록)
            this.errorService.logError(`분석 요청 처리 완료: ${request.id} (분석 길이: ${analysisResponse.explanation?.length || 0})`, EnhancedErrorService_1.ErrorSeverity.LOW, {
                analysis_length: analysisResponse.explanation?.length || 0,
                cached: true,
            });
        }
        catch (error) {
            this.errorService.logError(error, EnhancedErrorService_1.ErrorSeverity.MEDIUM, {
                operation: "processAnalysisRequest",
                requestId: request.id,
                retryCount: request.retryCount,
            });
            // 재시도 카운트 증가
            request.retryCount += 1;
            // 최대 재시도 횟수 초과 시 큐에서 제거
            if (request.retryCount >= 3) {
                const index = this.pendingRequests.findIndex((r) => r.id === request.id);
                if (index > -1) {
                    this.pendingRequests.splice(index, 1);
                }
            }
        }
    }
    /**
     * 생성 요청 처리
     */
    async processGenerationRequest(request) {
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
            this.cacheResponse(request.payload, generationResponse, 120 // 120분 캐시
            );
            // 성공 로그 (낮은 심각도로 기록)
            this.errorService.logError(`생성 요청 처리 완료: ${request.id} (코드 길이: ${generationResponse.generated_code?.length || 0})`, EnhancedErrorService_1.ErrorSeverity.LOW, {
                code_length: generationResponse.generated_code?.length || 0,
                cached: true,
            });
        }
        catch (error) {
            this.errorService.logError(error, EnhancedErrorService_1.ErrorSeverity.MEDIUM, {
                operation: "processGenerationRequest",
                requestId: request.id,
                retryCount: request.retryCount,
            });
            // 재시도 카운트 증가
            request.retryCount += 1;
            // 최대 재시도 횟수 초과 시 큐에서 제거
            if (request.retryCount >= 3) {
                const index = this.pendingRequests.findIndex((r) => r.id === request.id);
                if (index > -1) {
                    this.pendingRequests.splice(index, 1);
                }
            }
        }
    }
    /**
     * 오프라인 상태 조회
     */
    getStatus() {
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
    onOnlineStatusChange(listener) {
        this.onlineStatusListeners.push(listener);
    }
    /**
     * 캐시 정리
     */
    clearCache() {
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
            this.errorService.logError(`오프라인 캐시 정리 완료 (${files.length}개 파일)`, EnhancedErrorService_1.ErrorSeverity.LOW, { operation: "clearCache", filesCount: files.length });
        }
        catch (error) {
            this.errorService.logError(error, EnhancedErrorService_1.ErrorSeverity.LOW, {
                operation: "clearCache",
            });
        }
    }
    /**
     * 큐 정리
     */
    clearQueue() {
        this.pendingRequests = [];
        this.saveQueueToFile();
    }
    /**
     * 정리
     */
    cleanup() {
        if (this.onlineCheckInterval) {
            this.memoryManager.clearInterval(this.onlineCheckInterval);
            this.onlineCheckInterval = null;
        }
        this.onlineStatusListeners = [];
        this.saveQueueToFile();
    }
    // === 유틸리티 메서드들 ===
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    hashRequest(payload) {
        const str = JSON.stringify(payload);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash; // 32비트 정수로 변환
        }
        return hash.toString(36);
    }
    async ensureCacheDirectory() {
        try {
            if (!fs.existsSync(this.cacheDir)) {
                fs.mkdirSync(this.cacheDir, { recursive: true });
            }
        }
        catch (error) {
            this.errorService.logError(error, EnhancedErrorService_1.ErrorSeverity.MEDIUM, {
                operation: "ensureCacheDirectory",
            });
        }
    }
    ensureCacheSpace(requiredSize) {
        while (this.currentCacheSize + requiredSize > this.maxCacheSize &&
            this.responseCache.size > 0) {
            // 가장 오래된 캐시 항목 제거 (LRU)
            const oldest = Array.from(this.responseCache.entries()).sort(([, a], [, b]) => a.timestamp.getTime() - b.timestamp.getTime())[0];
            if (oldest) {
                const [key, value] = oldest;
                this.responseCache.delete(key);
                this.currentCacheSize -= value.size;
                this.deleteCacheFile(key);
            }
        }
    }
    async saveQueueToFile() {
        try {
            const data = JSON.stringify(this.pendingRequests, null, 2);
            fs.writeFileSync(this.queueFile, data, "utf8");
        }
        catch (error) {
            this.errorService.logError(error, EnhancedErrorService_1.ErrorSeverity.LOW, {
                operation: "saveQueueToFile",
            });
        }
    }
    async restorePendingQueue() {
        try {
            if (fs.existsSync(this.queueFile)) {
                const data = fs.readFileSync(this.queueFile, "utf8");
                this.pendingRequests = JSON.parse(data);
                // 날짜 객체 복원
                this.pendingRequests.forEach((req) => {
                    req.timestamp = new Date(req.timestamp);
                });
            }
        }
        catch (error) {
            this.errorService.logError(error, EnhancedErrorService_1.ErrorSeverity.LOW, {
                operation: "restorePendingQueue",
            });
            this.pendingRequests = [];
        }
    }
    saveCacheToFile(key, cached) {
        try {
            const filePath = path.join(this.cacheDir, `${key}.cache`);
            const data = JSON.stringify(cached);
            fs.writeFileSync(filePath, data, "utf8");
        }
        catch (error) {
            this.errorService.logError(error, EnhancedErrorService_1.ErrorSeverity.LOW, {
                operation: "saveCacheToFile",
                key,
            });
        }
    }
    async restoreCache() {
        try {
            if (!fs.existsSync(this.cacheDir))
                return;
            const files = fs.readdirSync(this.cacheDir);
            for (const file of files) {
                if (file.endsWith(".cache")) {
                    try {
                        const filePath = path.join(this.cacheDir, file);
                        const data = fs.readFileSync(filePath, "utf8");
                        const cached = JSON.parse(data);
                        // 날짜 객체 복원
                        cached.timestamp = new Date(cached.timestamp);
                        cached.expiresAt = new Date(cached.expiresAt);
                        // 만료 확인
                        if (new Date() <= cached.expiresAt) {
                            this.responseCache.set(cached.requestHash, cached);
                            this.currentCacheSize += cached.size;
                        }
                        else {
                            fs.unlinkSync(filePath);
                        }
                    }
                    catch (error) {
                        // 손상된 캐시 파일 삭제
                        const filePath = path.join(this.cacheDir, file);
                        fs.unlinkSync(filePath);
                    }
                }
            }
        }
        catch (error) {
            this.errorService.logError(error, EnhancedErrorService_1.ErrorSeverity.LOW, {
                operation: "restoreCache",
            });
        }
    }
    deleteCacheFile(key) {
        try {
            const filePath = path.join(this.cacheDir, `${key}.cache`);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        catch (error) {
            this.errorService.logError(error, EnhancedErrorService_1.ErrorSeverity.LOW, {
                operation: "deleteCacheFile",
                key,
            });
        }
    }
}
exports.OfflineService = OfflineService;
//# sourceMappingURL=OfflineService.js.map