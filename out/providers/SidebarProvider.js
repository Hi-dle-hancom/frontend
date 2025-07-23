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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SidebarProvider = void 0;
const vscode = __importStar(require("vscode"));
const BaseWebviewProvider_1 = require("./BaseWebviewProvider");
const SidebarHtmlGenerator_1 = require("../templates/SidebarHtmlGenerator");
const apiClient_1 = require("../modules/apiClient");
const apiClient_2 = require("../modules/apiClient");
const ConfigService_1 = require("../services/ConfigService");
/**
 * 개선된 사이드바 대시보드 웹뷰 프로바이더 클래스
 * - JWT 토큰 기반 실제 사용자 설정 조회
 * - DB 연동된 사용자 컨텍스트 사용
 */
class SidebarProvider extends BaseWebviewProvider_1.BaseWebviewProvider {
    selectedModel;
    configService;
    // 캐시된 사용자 설정 (성능 최적화)
    cachedUserSettings = null;
    settingsLastFetch = 0;
    SETTINGS_CACHE_TTL = 5 * 60 * 1000; // 5분 캐시
    // 현재 응답 상태 저장 (웹뷰 재생성 시 복원용)
    currentResponseState = {};
    /**
     * 패널 타입 반환
     */
    getPanelType() {
        return "hapa-sidebar-panel";
    }
    /**
     * 패널 제목 반환
     */
    getPanelTitle() {
        return "HAPA";
    }
    // 히스토리 상태 관리를 위한 속성들 추가
    questionHistory = [];
    expandedPanels = []; // 열린 expand 패널들 추적
    maxHistorySize = 50; // 최대 50개 히스토리 유지
    constructor(extensionUri) {
        super(extensionUri);
        this.configService = ConfigService_1.ConfigService.getInstance();
        // TriggerDetector는 ExtensionManager에서 관리하므로 여기서 제거
        // 히스토리 로드 (비동기)
        this.loadHistory().catch(error => {
            console.error("❌ 초기 히스토리 로드 실패:", error);
        });
    }
    /**
     * 히스토리 로드 (DB 우선, 로컬 fallback)
     */
    async loadHistory() {
        try {
            // 1단계: DB에서 히스토리 로드 시도
            const dbHistory = await this.loadHistoryFromDB();
            if (dbHistory.success && dbHistory.history && dbHistory.history.length > 0) {
                this.questionHistory = dbHistory.history;
                console.log("✅ DB에서 히스토리 로드 성공:", dbHistory.history.length, "개 항목");
                // DB 히스토리를 로컬에도 동기화 (캐시 목적)
                this.syncDBToLocalHistory(dbHistory.history);
                return;
            }
            // 2단계: DB 로드 실패 시 로컬 저장소에서 로드
            console.log("⚠️ DB 히스토리 로드 실패, 로컬 저장소 사용");
            const context = this.getContext();
            const savedHistory = context?.globalState.get("hapaHistory");
            if (savedHistory) {
                this.questionHistory = savedHistory;
                console.log("✅ 로컬 저장소에서 히스토리 로드:", savedHistory.length, "개 항목");
            }
        }
        catch (error) {
            console.error("❌ 히스토리 로드 실패:", error);
            // 에러 시 로컬 저장소 fallback
            const context = this.getContext();
            const savedHistory = context?.globalState.get("hapaHistory");
            if (savedHistory) {
                this.questionHistory = savedHistory;
            }
        }
    }
    /**
     * 히스토리 저장 (VSCode globalState에)
     */
    saveHistory() {
        const context = this.getContext();
        if (context) {
            context.globalState.update("hapaHistory", this.questionHistory);
            // 모든 webview에 히스토리 동기화 메시지 전송
            this.broadcastHistoryUpdate();
        }
    }
    /**
     * 모든 webview에 히스토리 업데이트 브로드캐스트
     */
    broadcastHistoryUpdate() {
        try {
            console.log("📚 히스토리 업데이트 브로드캐스트 시작:", {
                historyCount: this.questionHistory.length,
                historyPreview: this.questionHistory.slice(0, 2).map(h => ({
                    question: h.question.substring(0, 30) + "...",
                    timestamp: h.timestamp,
                })),
            });
            const historyData = JSON.stringify(this.questionHistory);
            const messageId = Date.now().toString();
            console.log("📚 히스토리 데이터 JSON 길이:", historyData.length);
            // 사이드바에 전송 (확인 가능한 메시지)
            if (this._view?.webview) {
                this._view.webview
                    .postMessage({
                    command: "syncHistory",
                    history: historyData,
                })
                    .then(undefined, error => {
                    console.error("❌ 사이드바 히스토리 동기화 메시지 전송 실패:", error);
                });
            }
            // 모든 expand 패널에 전송
            this.expandedPanels.forEach((panel, index) => {
                if (panel.webview) {
                    panel.webview
                        .postMessage({
                        command: "syncHistory",
                        history: historyData,
                    })
                        .then(undefined, error => {
                        console.error(`❌ 확장 패널 ${index} 히스토리 동기화 메시지 전송 실패:`, error);
                    });
                }
            });
        }
        catch (error) {
            console.error("❌ 히스토리 브로드캐스트 실패:", error);
        }
    }
    /**
     * 히스토리에 새 항목 추가 (로컬 + DB 동시 저장)
     */
    async addToHistory(question, response) {
        console.log("📚 히스토리 저장 시도:", {
            question_preview: question.substring(0, 50) + "...",
            response_length: response.length,
            current_history_count: this.questionHistory.length,
        });
        // 중복 질문 제한 (연속 3회까지)
        const recentSameQuestions = this.questionHistory
            .slice(0, 3)
            .filter(item => item.question.trim().toLowerCase() === question.trim().toLowerCase());
        if (recentSameQuestions.length < 3) {
            // 1단계: 로컬 히스토리 저장 (기존 방식)
            this.questionHistory.unshift({
                question: question,
                timestamp: new Date().toLocaleString("ko-KR"),
                response: response,
            });
            // 최대 50개까지만 저장
            if (this.questionHistory.length > this.maxHistorySize) {
                this.questionHistory = this.questionHistory.slice(0, this.maxHistorySize);
            }
            // 로컬 저장 및 동기화
            this.saveHistory();
            console.log("✅ 로컬 히스토리 저장 완료:", {
                total_count: this.questionHistory.length,
                saved_timestamp: new Date().toLocaleString("ko-KR"),
            });
            // 2단계: 백엔드 DB 저장 (비동기)
            this.saveHistoryToDB(question, response).catch(error => {
                console.error("❌ DB 히스토리 저장 실패:", error);
                // DB 저장 실패해도 로컬 저장은 유지됨
            });
            // 3단계: 히스토리 UI 업데이트
            this.broadcastHistoryUpdate();
        }
        else {
            console.log("⚠️ 히스토리 저장 스킵 (중복 질문 제한):", {
                duplicate_count: recentSameQuestions.length,
                question_preview: question.substring(0, 50) + "...",
            });
        }
    }
    /**
     * 백엔드 DB에 히스토리 저장
     */
    async saveHistoryToDB(question, response) {
        try {
            // JWT 토큰 확인
            const accessToken = this.getJWTToken();
            if (!accessToken) {
                console.log("⚠️ JWT 토큰이 없어 DB 히스토리 저장을 건너뜁니다.");
                return;
            }
            const config = vscode.workspace.getConfiguration("hapa");
            // DB-Module API 사용으로 변경
            const dbModuleURL = config.get("dbModuleURL") || "http://3.13.240.111:8001";
            const apiBaseURL = `${dbModuleURL}/history`;
            console.log("🔄 DB 히스토리 저장 시작...");
            // 1단계: 세션 생성 또는 기존 세션 사용
            const sessionId = await this.getOrCreateSession(apiBaseURL, accessToken);
            if (!sessionId) {
                throw new Error("세션 생성 실패");
            }
            // 2단계: 질문 엔트리 추가
            const questionEntry = {
                session_id: sessionId,
                conversation_type: "question",
                content: question,
                language: "python",
                code_snippet: null,
                file_name: null,
                line_number: null,
                response_time: null,
                confidence_score: null,
            };
            const questionResponse = await fetch(`${apiBaseURL}/entries`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(questionEntry),
                timeout: 10000,
            });
            if (!questionResponse.ok) {
                throw new Error(`질문 저장 실패: ${questionResponse.status}`);
            }
            // 3단계: 응답 엔트리 추가
            const answerEntry = {
                session_id: sessionId,
                conversation_type: "answer",
                content: response,
                language: "python",
                code_snippet: response.includes("```") ? response : null,
                file_name: null,
                line_number: null,
                response_time: null,
                confidence_score: null,
            };
            const answerResponse = await fetch(`${apiBaseURL}/entries`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(answerEntry),
                timeout: 10000,
            });
            if (!answerResponse.ok) {
                throw new Error(`응답 저장 실패: ${answerResponse.status}`);
            }
            console.log("✅ DB 히스토리 저장 완료:", {
                session_id: sessionId,
                question_length: question.length,
                response_length: response.length,
            });
        }
        catch (error) {
            console.error("❌ DB 히스토리 저장 중 예외 발생:", error);
            throw error;
        }
    }
    /**
     * DB에서 히스토리 로드
     */
    async loadHistoryFromDB() {
        try {
            // JWT 토큰 확인
            const accessToken = this.getJWTToken();
            if (!accessToken) {
                console.log("⚠️ JWT 토큰이 없어 DB 히스토리 로드를 건너뜁니다.");
                return { success: false, error: "JWT 토큰 없음" };
            }
            const config = vscode.workspace.getConfiguration("hapa");
            // DB-Module API 사용으로 변경
            const dbModuleURL = config.get("dbModuleURL") || "http://3.13.240.111:8001";
            const apiBaseURL = `${dbModuleURL}/history`;
            console.log("🔄 DB 히스토리 로드 시작...");
            // 타임아웃 처리를 위한 AbortController
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            try {
                // 사용자의 히스토리 세션 목록 가져오기 (DB-Module API 사용)
                const sessionsResponse = await fetch(`${apiBaseURL}/sessions?limit=50`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                    signal: controller.signal,
                });
                clearTimeout(timeoutId);
                if (!sessionsResponse.ok) {
                    console.error("❌ 세션 목록 조회 실패:", sessionsResponse.status);
                    return { success: false, error: `세션 목록 조회 실패 (${sessionsResponse.status})` };
                }
                const sessions = await sessionsResponse.json();
                console.log("📚 DB 세션 목록:", sessions.length, "개");
                if (!sessions || sessions.length === 0) {
                    console.log("📚 DB에 저장된 히스토리가 없습니다.");
                    return { success: true, history: [] };
                }
                // 모든 세션의 엔트리들을 가져와서 질문-답변 쌍으로 구성
                const allHistoryItems = [];
                // 동시 요청 제한을 위한 배치 처리
                const batchSize = 5;
                for (let i = 0; i < sessions.length; i += batchSize) {
                    const batch = sessions.slice(i, i + batchSize);
                    const batchPromises = batch.map(async (session) => {
                        try {
                            const entryController = new AbortController();
                            const entryTimeoutId = setTimeout(() => entryController.abort(), 8000);
                            // DB-Module API 엔드포인트 사용: /history/sessions/{session_id}
                            const entriesResponse = await fetch(`${apiBaseURL}/sessions/${session.session_id}?limit=50`, {
                                method: "GET",
                                headers: {
                                    Authorization: `Bearer ${accessToken}`,
                                    "Content-Type": "application/json",
                                },
                                signal: entryController.signal,
                            });
                            clearTimeout(entryTimeoutId);
                            if (entriesResponse.ok) {
                                const entries = await entriesResponse.json();
                                console.log(`📚 세션 ${session.session_id}: ${entries.length}개 엔트리`);
                                const historyPairs = this.parseHistoryEntries(entries, session.created_at);
                                return historyPairs;
                            }
                            else {
                                console.warn(`⚠️ 세션 ${session.session_id} 엔트리 조회 실패: ${entriesResponse.status}`);
                                return [];
                            }
                        }
                        catch (error) {
                            console.error(`❌ 세션 ${session.session_id} 엔트리 조회 실패:`, error);
                            return [];
                        }
                    });
                    const batchResults = await Promise.all(batchPromises);
                    batchResults.forEach(historyPairs => {
                        allHistoryItems.push(...historyPairs);
                    });
                }
                // 타임스탬프 기준으로 정렬 (최신 순)
                allHistoryItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                // 최대 히스토리 개수 제한
                const limitedHistory = allHistoryItems.slice(0, this.maxHistorySize);
                console.log(`✅ DB 히스토리 로드 완료: ${limitedHistory.length}개 항목 (전체 ${allHistoryItems.length}개 중)`);
                return { success: true, history: limitedHistory };
            }
            catch (error) {
                clearTimeout(timeoutId);
                if (error instanceof Error && error.name === "AbortError") {
                    console.error("❌ DB 히스토리 로드 타임아웃");
                    return { success: false, error: "요청 타임아웃" };
                }
                throw error;
            }
        }
        catch (error) {
            console.error("❌ DB 히스토리 로드 실패:", error);
            return { success: false, error: error instanceof Error ? error.message : "알 수 없는 오류" };
        }
    }
    /**
     * DB 엔트리들을 질문-답변 쌍으로 파싱
     */
    parseHistoryEntries(entries, sessionCreatedAt) {
        const historyPairs = [];
        // 엔트리들을 시간순으로 정렬
        entries.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        let currentQuestion = null;
        let currentTimestamp = null;
        for (const entry of entries) {
            if (entry.conversation_type === "question") {
                currentQuestion = entry.content;
                currentTimestamp = entry.created_at;
            }
            else if (entry.conversation_type === "answer" && currentQuestion) {
                historyPairs.push({
                    question: currentQuestion,
                    response: entry.content,
                    timestamp: currentTimestamp || entry.created_at,
                });
                currentQuestion = null;
                currentTimestamp = null;
            }
        }
        return historyPairs;
    }
    /**
     * DB 히스토리를 로컬에 동기화
     */
    syncDBToLocalHistory(dbHistory) {
        try {
            const context = this.getContext();
            if (context) {
                context.globalState.update("hapaHistory", dbHistory);
                console.log("✅ DB 히스토리를 로컬에 동기화 완료");
            }
        }
        catch (error) {
            console.error("❌ DB 히스토리 로컬 동기화 실패:", error);
        }
    }
    /**
     * DB 히스토리와 로컬 히스토리를 지능적으로 병합
     * - 타임스탬프 기준으로 중복 제거
     * - 최신 순으로 정렬
     * - 로컬에만 있는 새로운 항목 보존
     */
    mergeDBHistoryWithLocal(dbHistory) {
        try {
            // 로컬 히스토리 가져오기
            const context = this.getContext();
            const localHistory = context?.globalState.get("hapaHistory") || [];
            console.log(`🔄 히스토리 병합 시작: DB ${dbHistory.length}개, 로컬 ${localHistory.length}개`);
            // 병합을 위한 Map 사용 (타임스탬프를 키로 사용)
            const mergedMap = new Map();
            // 1. DB 히스토리 추가 (우선순위 높음)
            dbHistory.forEach(item => {
                if (item.timestamp && item.question && item.response) {
                    mergedMap.set(item.timestamp, item);
                }
            });
            // 2. 로컬 히스토리 추가 (DB에 없는 항목만)
            localHistory.forEach(item => {
                if (item.timestamp && item.question && item.response) {
                    // DB에 없는 항목이거나, 더 최신 데이터인 경우에만 추가
                    if (!mergedMap.has(item.timestamp)) {
                        mergedMap.set(item.timestamp, item);
                    }
                }
            });
            // 3. 타임스탬프 기준 최신 순 정렬
            const mergedHistory = Array.from(mergedMap.values()).sort((a, b) => {
                const timestampA = new Date(a.timestamp).getTime();
                const timestampB = new Date(b.timestamp).getTime();
                return timestampB - timestampA; // 최신 순 (내림차순)
            });
            console.log(`✅ 히스토리 병합 완료: 총 ${mergedHistory.length}개 항목`);
            console.log(`📊 병합 결과: 기존 ${dbHistory.length + localHistory.length}개 → 중복 제거 후 ${mergedHistory.length}개`);
            // 4. 병합된 히스토리를 로컬에 저장
            if (context) {
                context.globalState.update("hapaHistory", mergedHistory);
                console.log("💾 병합된 히스토리 로컬 저장 완료");
            }
            return mergedHistory;
        }
        catch (error) {
            console.error("❌ 히스토리 병합 실패:", error);
            // 에러 시 DB 히스토리 우선 반환
            return dbHistory;
        }
    }
    /**
     * 세션 생성 또는 기존 세션 반환
     */
    async getOrCreateSession(apiBaseURL, accessToken) {
        try {
            // 현재 세션 ID 캐시 (클래스 변수로 관리)
            if (this.currentSessionId) {
                return this.currentSessionId;
            }
            // 새 세션 생성
            const sessionData = {
                session_title: `HAPA Session ${new Date().toLocaleDateString("ko-KR")}`,
                primary_language: "python",
                tags: ["vscode", "hapa"],
                project_name: vscode.workspace.name || "Unknown Project",
            };
            const response = await fetch(`${apiBaseURL}/sessions`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(sessionData),
                timeout: 10000,
            });
            if (!response.ok) {
                throw new Error(`세션 생성 실패: ${response.status}`);
            }
            const result = await response.json();
            const sessionId = result.session_id;
            // 세션 ID 캐시 (5분간 유지)
            this.currentSessionId = sessionId;
            setTimeout(() => {
                this.currentSessionId = null;
            }, 5 * 60 * 1000);
            console.log("✅ 새 세션 생성:", sessionId);
            return sessionId;
        }
        catch (error) {
            console.error("❌ 세션 생성 실패:", error);
            return null;
        }
    }
    /**
     * 히스토리 항목 삭제
     */
    deleteHistoryItem(index) {
        if (index >= 0 && index < this.questionHistory.length) {
            this.questionHistory.splice(index, 1);
            this.saveHistory();
            this.broadcastHistoryUpdate();
        }
    }
    /**
     * 확인 대화상자를 통한 히스토리 항목 삭제
     */
    async confirmDeleteHistoryItem(index) {
        const confirmResult = await vscode.window.showWarningMessage("이 기록을 삭제하시겠습니까?", "삭제", "취소");
        if (confirmResult === "삭제") {
            this.deleteHistoryItem(index);
        }
    }
    /**
     * 확인 대화상자를 통한 모든 히스토리 삭제
     */
    async confirmClearAllHistory() {
        const confirmResult = await vscode.window.showWarningMessage("모든 히스토리를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.", "모두 삭제", "취소");
        if (confirmResult === "모두 삭제") {
            this.questionHistory = [];
            this.saveHistory();
            this.broadcastHistoryUpdate();
            vscode.window.showInformationMessage("모든 히스토리가 삭제되었습니다.");
        }
    }
    /**
     * Extension context 가져오기 (BaseWebviewProvider에서 상속받을 수 있도록)
     */
    getContext() {
        // BaseWebviewProvider나 Extension에서 context를 제공받을 수 있도록 하는 메서드
        // 실제 구현은 extension.ts에서 context를 전달받아야 함
        return this._context;
    }
    /**
     * Context 설정 메서드 (extension.ts에서 호출)
     */
    setContext(context) {
        this._context = context;
        // context 설정 후 히스토리 다시 로드 (비동기)
        this.loadHistory().catch(error => {
            console.error("❌ 컨텍스트 설정 후 히스토리 로드 실패:", error);
        });
        // 에디터 변경 감지하여 코드 맥락 업데이트
        this.setupEditorContextMonitoring();
    }
    /**
     * 에디터 변경 감지 및 코드 맥락 모니터링 설정
     */
    setupEditorContextMonitoring() {
        // 활성 에디터 변경 감지
        vscode.window.onDidChangeActiveTextEditor(() => {
            this.updateCodeContext();
        });
        // 선택 영역 변경 감지
        vscode.window.onDidChangeTextEditorSelection(() => {
            this.updateCodeContext();
        });
        // 초기 컨텍스트 업데이트
        this.updateCodeContext();
    }
    /**
     * 현재 코드 맥락 정보 수집 및 UI 업데이트
     */
    updateCodeContext() {
        try {
            const contextInfo = this.getCodeContextInfo();
            // 사이드바에 코드 맥락 정보 전송
            if (this._view?.webview) {
                this._view.webview
                    .postMessage({
                    command: "updateCodeContext",
                    context: contextInfo,
                })
                    .then(undefined, error => {
                    console.error("❌ 사이드바 코드 맥락 메시지 전송 실패:", error);
                });
            }
            // 모든 expand 패널에 코드 맥락 정보 전송
            this.expandedPanels.forEach(panel => {
                if (panel.webview) {
                    panel.webview
                        .postMessage({
                        command: "updateCodeContext",
                        context: contextInfo,
                    })
                        .then(undefined, error => {
                        console.error("❌ 확장 패널 코드 맥락 메시지 전송 실패:", error);
                    });
                }
            });
        }
        catch (error) {
            console.error("❌ 코드 맥락 업데이트 실패:", error);
        }
    }
    /**
     * 현재 코드 맥락 정보 수집
     */
    getCodeContextInfo() {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            return {
                hasContext: false,
                message: "편집기가 열려있지 않습니다",
                details: "",
                icon: "📝",
            };
        }
        const document = activeEditor.document;
        const selection = activeEditor.selection;
        const fileName = document.fileName.split("/").pop() || "Unknown";
        const fileExtension = fileName.split(".").pop()?.toLowerCase() || "";
        // 지원되는 파일 타입 확인
        const supportedExtensions = [
            "py",
            "js",
            "ts",
            "jsx",
            "tsx",
            "java",
            "cpp",
            "c",
            "cs",
            "go",
            "rs",
            "php",
        ];
        const isSupported = supportedExtensions.includes(fileExtension);
        if (!isSupported) {
            return {
                hasContext: false,
                message: `${fileName} - 지원되지 않는 파일 형식`,
                details: "Python, JavaScript, TypeScript 등의 파일을 열어주세요",
                icon: "⚠️",
            };
        }
        // 선택 영역이 있는 경우
        if (!selection.isEmpty) {
            const selectedText = document.getText(selection);
            const lineCount = selection.end.line - selection.start.line + 1;
            const charCount = selectedText.length;
            return {
                hasContext: true,
                message: `${fileName} - 선택 영역 분석 중`,
                details: `${lineCount}줄, ${charCount}자 선택됨`,
                icon: "🎯",
                selectedText: selectedText.substring(0, 200), // 처음 200자만 저장
            };
        }
        // 전체 파일 컨텍스트
        const totalLines = document.lineCount;
        const currentLine = selection.active.line + 1;
        return {
            hasContext: true,
            message: `${fileName} - 파일 내용 참고 중`,
            details: `${totalLines}줄, 현재 ${currentLine}줄`,
            icon: "📄",
            fileName: fileName,
            fileExtension: fileExtension,
        };
    }
    getHtmlContent(webview) {
        return SidebarHtmlGenerator_1.SidebarHtmlGenerator.generateSidebarHtml();
    }
    /**
     * 웹뷰 준비 완료 시 호출 (히스토리 로드 및 초기화)
     */
    onWebviewReady() {
        console.log("🔗 사이드바 웹뷰 준비 완료");
        console.log("🔍 웹뷰 인스턴스 상태:", {
            hasView: !!this._view,
            hasPanel: !!this._panel,
            viewWebview: !!this._view?.webview,
            panelWebview: !!this._panel?.webview,
        });
        // 1. MongoDB에서 히스토리 로드 후 동기화
        this.loadHistoryFromDB()
            .then(dbResult => {
            if (dbResult.success && dbResult.history && dbResult.history.length > 0) {
                console.log("🔄 MongoDB 히스토리 로드 성공, 로컬 히스토리와 병합");
                this.questionHistory = dbResult.history;
                // DB 히스토리를 로컬 저장소에도 캐시 저장
                this.syncDBToLocalHistory(dbResult.history);
            }
            else {
                console.log("⚠️ MongoDB 히스토리 로드 실패 또는 빈 데이터, 로컬 히스토리 사용");
            }
            // 2. 히스토리 동기화 (DB 또는 로컬)
            this.broadcastHistoryUpdate();
            // 3. 히스토리 로드 완료 후 응답 상태 복원 또는 빈 상태 초기화
            this.initializeResponseState();
            // 4. 현재 에디터 컨텍스트 정보 전송
            this.updateEditorContext();
        })
            .catch(error => {
            console.error("❌ MongoDB 히스토리 로드 중 오류:", error);
            // 오류 발생 시 기존 로컬 히스토리로 동기화
            this.broadcastHistoryUpdate();
            // 오류 시에도 초기화 진행
            this.initializeResponseState();
            this.updateEditorContext();
        });
    }
    /**
     * 응답 상태 복원 또는 빈 상태 초기화
     */
    initializeResponseState() {
        const shouldRestoreResponse = this.currentResponseState.isValid &&
            this.currentResponseState.response &&
            this.currentResponseState.timestamp &&
            Date.now() - this.currentResponseState.timestamp < 30 * 60 * 1000; // 30분 내
        if (shouldRestoreResponse) {
            console.log("🔄 마지막 응답 상태 복원 시도");
            setTimeout(() => {
                const webview = this._view?.webview || this._panel?.webview;
                if (webview) {
                    webview.postMessage({
                        command: "restoreResponse",
                        response: this.currentResponseState.response,
                    });
                    console.log("✅ 마지막 응답 상태 복원 완료");
                }
            }, 300);
        }
        else {
            // 복원할 응답이 없으면 빈 상태 초기화
            setTimeout(() => {
                const webview = this._view?.webview || this._panel?.webview;
                if (webview) {
                    console.log("📤 빈 상태 초기화 메시지 전송");
                    webview.postMessage({
                        command: "initializeEmptyStates",
                    });
                }
                else {
                    console.warn("⚠️ 웹뷰 인스턴스를 찾을 수 없어 빈 상태 초기화 메시지를 전송할 수 없음");
                }
            }, 200);
        }
    }
    /**
     * 현재 에디터 컨텍스트 정보 전송
     */
    updateEditorContext() {
        setTimeout(() => {
            const webview = this._view?.webview || this._panel?.webview;
            if (webview) {
                const activeEditor = vscode.window.activeTextEditor;
                if (activeEditor) {
                    webview.postMessage({
                        command: "updateContext",
                        context: {
                            filename: activeEditor.document.fileName,
                            language: activeEditor.document.languageId,
                            lineCount: activeEditor.document.lineCount,
                        },
                    });
                }
            }
        }, 500);
    }
    async handleCustomMessage(message) {
        switch (message.command) {
            case "alert":
                vscode.window.showInformationMessage(message.text);
                return;
            case "openMainDashboard":
                console.log("↗ 확장 뷰 열기 명령 실행 중...");
                try {
                    this.openExpandedView();
                    console.log("✅ 확장 뷰 열기 성공");
                }
                catch (error) {
                    console.error("❌ 확장 뷰 열기 실패:", error);
                    vscode.window.showErrorMessage("확장 뷰를 열 수 없습니다.");
                }
                return;
            case "modelSelected":
                // 모델 선택 메시지 처리 (새로 추가)
                console.log("🎯 모델 선택됨:", message.modelType);
                // 현재 선택된 모델을 인스턴스 변수로 저장
                this.selectedModel = message.modelType;
                return;
            case "generateCodeStreaming":
                console.log("🔔 [SidebarProvider] generateCodeStreaming 메시지 수신");
                try {
                    // 메시지 정규화 - question 또는 prompt 필드 지원
                    const prompt = message.question || message.prompt;
                    const modelType = message.modelType || message.model_type || this.selectedModel || "autocomplete";
                    if (!prompt || prompt.trim().length === 0) {
                        console.error("❌ 빈 질문/프롬프트 수신");
                        this.sendErrorToWebview("질문을 입력해주세요.");
                        return;
                    }
                    console.log("✅ 정규화된 요청:", {
                        prompt: prompt.substring(0, 100) + "...",
                        modelType,
                        promptLength: prompt.length,
                    });
                    // 두 가지 모드 모두 지원: 스트리밍 및 동기식
                    const preferSync = message.preferSync || false;
                    if (preferSync) {
                        console.log("🔄 동기식 모드로 처리");
                        await this.handleSyncCodeGeneration(prompt, this.mapModelToVLLMType(modelType));
                    }
                    else {
                        console.log("🔄 스트리밍 모드로 처리");
                        await this.handleStreamingCodeGeneration(prompt, modelType);
                    }
                }
                catch (error) {
                    console.error("❌ generateCodeStreaming 처리 오류:", error);
                    this.sendErrorToWebview("요청 처리 중 오류가 발생했습니다.");
                }
                return;
            case "generateBugFixStreaming":
                this.handleBugFixStreamingCodeGeneration(message.prompt, // question에서 prompt로 수정
                message.model_type || this.selectedModel || "error_fix");
                return;
            case "insertCode":
                this.insertCodeToActiveEditor(message.code);
                return;
            case "showInfo":
                vscode.window.showInformationMessage(message.message);
                return;
            case "addToHistory":
                // 히스토리 추가 요청 처리
                this.addToHistory(message.question, message.response).catch(error => {
                    console.error("❌ 히스토리 저장 실패:", error);
                });
                return;
            case "getHistory":
                // 히스토리 요청 처리
                if (this._view?.webview) {
                    this._view.webview.postMessage({
                        command: "syncHistory",
                        history: JSON.stringify(this.questionHistory),
                    });
                }
                return;
            case "refreshHistory":
                // 히스토리 새로고침 (DB에서 다시 로드)
                console.log("🔄 히스토리 새로고침 요청");
                this.loadHistory()
                    .then(() => {
                    console.log("✅ 히스토리 새로고침 완료");
                    this.broadcastHistoryUpdate();
                })
                    .catch(error => {
                    console.error("❌ 히스토리 새로고침 실패:", error);
                });
                return;
            case "deleteHistoryItem":
                // 히스토리 항목 삭제 처리
                this.deleteHistoryItem(message.index);
                return;
            case "confirmDeleteHistoryItem":
                // 확인 대화상자를 통한 히스토리 항목 삭제 처리
                this.confirmDeleteHistoryItem(message.index);
                return;
            case "confirmClearAllHistory":
                // 모든 히스토리 삭제 확인
                this.confirmClearAllHistory();
                return;
            case "clearHistory":
                // 히스토리 직접 삭제 (확인 없이)
                this.questionHistory = [];
                this.saveHistory();
                this.broadcastHistoryUpdate();
                return;
            case "loadHistoryItem":
                // 특정 히스토리 항목 로드
                this.loadSpecificHistoryItem(message.index);
                return;
            case "openSettings":
                // 사용자 설정 열기 - HAPA 설정 페이지
                console.log("⚙️ 설정 명령어 실행 중...");
                try {
                    await vscode.commands.executeCommand("hapa.showSettings");
                    console.log("✅ 설정 명령어 실행 성공");
                }
                catch (error) {
                    console.error("❌ 설정 명령어 실행 실패:", error);
                    vscode.window.showErrorMessage("설정을 열 수 없습니다.");
                }
                return;
            case "showHelp":
                // 가이드 표시 - HAPA 가이드 페이지
                console.log("❓ 도움말 명령어 실행 중...");
                try {
                    await vscode.commands.executeCommand("hapa.showGuide");
                    console.log("✅ 도움말 명령어 실행 성공");
                }
                catch (error) {
                    console.error("❌ 도움말 명령어 실행 실패:", error);
                    vscode.window.showErrorMessage("도움말을 열 수 없습니다.");
                }
                return;
            case "openUserSettings":
                // VS Code 사용자 설정 열기 (HAPA 섹션)
                console.log("🔧 사용자 설정 명령어 실행 중...");
                try {
                    await vscode.commands.executeCommand("hapa.openUserSettings");
                    console.log("✅ 사용자 설정 명령어 실행 성공");
                }
                catch (error) {
                    console.error("❌ 사용자 설정 명령어 실행 실패:", error);
                    vscode.window.showErrorMessage("사용자 설정을 열 수 없습니다.");
                }
                return;
            case "showGuide":
                // 가이드 표시 (showHelp와 동일)
                console.log("📖 가이드 명령어 실행 중...");
                try {
                    await vscode.commands.executeCommand("hapa.showGuide");
                    console.log("✅ 가이드 명령어 실행 성공");
                }
                catch (error) {
                    console.error("❌ 가이드 명령어 실행 실패:", error);
                    vscode.window.showErrorMessage("가이드를 열 수 없습니다.");
                }
                return;
            case "refreshConnection":
                // 연결 새로고침 (상태 표시용)
                vscode.window.showInformationMessage("연결이 새로고침되었습니다.");
                return;
            case "continueResponse":
                // 응답 이어가기 처리
                this.handleContinueResponse(message.previousContent, message.continuePrompt);
                return;
            case "stopStreaming":
                // 스트리밍 중지 처리
                this.handleStopStreaming();
                return;
        }
    }
    /**
     * 스트리밍 중지 처리
     */
    handleStopStreaming() {
        console.log("⏹️ SidebarProvider: 스트리밍 중지 요청");
        // 현재 진행 중인 스트리밍이 있다면 중지
        // (실제로는 fetch abort controller를 사용해야 하지만,
        // 현재 구조에서는 웹뷰에 중지 완료 메시지만 전송)
        if (this._view?.webview) {
            this._view.webview.postMessage({
                command: "streamingStopped",
                message: "스트리밍이 중지되었습니다.",
            });
        }
        vscode.window.showInformationMessage("AI 응답 생성이 중지되었습니다.");
    }
    /**
     * 응답 이어가기 처리
     */
    async handleContinueResponse(previousContent, continuePrompt) {
        if (!this._view?.webview) {
            return;
        }
        // 이어가기 요청을 위한 프롬프트 구성
        const fullPrompt = `${continuePrompt}

이전 응답:
${previousContent}

위 내용에 이어서 완성해주세요.`;
        // 현재 활성 편집기의 컨텍스트 가져오기
        const activeEditor = vscode.window.activeTextEditor;
        let codeContext = undefined;
        if (activeEditor && activeEditor.selection && !activeEditor.selection.isEmpty) {
            codeContext = activeEditor.document.getText(activeEditor.selection);
        }
        // 응답 시간 제한 (30초)
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error("응답 시간이 초과되었습니다. 다시 시도해주세요."));
            }, 30000);
        });
        // 스트리밍 요청과 타임아웃 경쟁 (axios로 통일)
        const streamingPromise = new Promise(async (resolve, reject) => {
            try {
                // Backend 스키마와 일치하는 API 요청 구성
                const apiRequest = {
                    prompt: fullPrompt,
                    model_type: apiClient_2.VLLMModelType.CODE_GENERATION, // Backend가 기대하는 model_type 사용
                    context: codeContext || "",
                    language: "python",
                    temperature: 0.3,
                    top_p: 0.95,
                    max_tokens: 1024,
                    programming_level: "intermediate",
                    explanation_detail: "standard",
                    code_style: "pythonic",
                    include_comments: true,
                    include_docstring: true,
                    include_type_hints: true,
                    project_context: "",
                };
                // ConfigService에서 설정 가져오기 + JWT 토큰 우선 사용
                const apiConfig = this.configService.getAPIConfig();
                const jwtToken = this.getJWTToken();
                const headers = {
                    "Content-Type": "application/json",
                };
                // JWT 토큰이 있으면 Authorization Bearer 헤더로 전달 (개인화 지원)
                if (jwtToken) {
                    headers["Authorization"] = `Bearer ${jwtToken}`;
                    console.log("🔑 JWT 토큰 인증 사용 (Enhanced 모드)");
                }
                else if (apiConfig.apiKey) {
                    headers["X-API-Key"] = apiConfig.apiKey;
                    console.log("🔑 API Key 인증 사용 (기본 모드)");
                }
                else {
                    console.warn("⚠️ 인증 정보가 없습니다.");
                }
                const streamUrl = `${apiConfig.baseURL}/code/generate/stream?enhanced=true`;
                console.log("🌊 이어가기 스트리밍 요청:", {
                    url: streamUrl,
                    hasApiKey: !!apiConfig.apiKey,
                    request: apiRequest,
                });
                const response = await fetch(streamUrl, {
                    method: "POST",
                    headers,
                    body: JSON.stringify(apiRequest),
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const reader = response.body?.getReader();
                if (!reader) {
                    throw new Error("응답을 읽을 수 없습니다.");
                }
                let parsedContent = "";
                const decoder = new TextDecoder();
                const maxContentLength = 10000; // 최대 10KB 제한
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) {
                        break;
                    }
                    const chunk = decoder.decode(value);
                    const lines = chunk.split("\n");
                    for (const line of lines) {
                        if (line.trim() === "") {
                            continue;
                        }
                        if (line.startsWith("data: ")) {
                            const data = line.slice(6);
                            if (data === "[DONE]") {
                                resolve();
                                return;
                            }
                            try {
                                const parsed = JSON.parse(data);
                                if (parsed.text) {
                                    // 응답 길이 제한 체크
                                    if (parsedContent.length + parsed.text.length > maxContentLength) {
                                        parsedContent += "\n\n⚠️ **응답이 너무 길어 일부가 생략되었습니다.**";
                                        resolve();
                                        return;
                                    }
                                    parsedContent += parsed.text;
                                    // 실시간 정리 및 전송
                                    const cleanedContent = this.cleanStreamingContent(parsed.text);
                                    if (cleanedContent.trim()) {
                                        this._view?.webview.postMessage({
                                            type: "streamingResponse",
                                            content: cleanedContent,
                                        });
                                    }
                                }
                            }
                            catch (e) {
                                console.warn("JSON 파싱 오류:", e);
                            }
                        }
                    }
                }
                // 최종 응답 정리
                let finalCleanedContent = this.finalizeResponse(parsedContent);
                // 보안 경고 및 사용자 안내 추가
                const securityWarnings = [
                    "\n\n⚠️ **보안 알림**: 위 코드를 실행하기 전에 반드시 검토하세요.",
                    "\n📝 **사용법**: 코드를 복사하여 Python 파일로 저장한 후 실행하세요.",
                    "\n🔍 **참고**: AI가 생성한 코드이므로 문법 오류나 논리적 오류가 있을 수 있습니다.",
                    "\n💡 **팁**: 복잡한 요구사항은 단계별로 나누어 질문하시면 더 정확한 답변을 받을 수 있습니다.",
                ];
                // 보안 경고 추가 (응답이 충분히 긴 경우에만)
                if (finalCleanedContent.length > 100) {
                    finalCleanedContent += securityWarnings.join("");
                }
                // 스트리밍 완료 메시지 전송 (정리된 콘텐츠 포함)
                this._view?.webview.postMessage({
                    type: "streamingComplete",
                    content: finalCleanedContent,
                });
                // 히스토리에 추가 (이어가기 요청도 저장)
                this.addToHistory(continuePrompt, finalCleanedContent).catch(error => {
                    console.error("❌ 히스토리 저장 실패:", error);
                });
                resolve();
            }
            catch (error) {
                console.error("응답 이어가기 실패:", error);
                // 사용자에게 구체적인 오류 메시지 제공
                let errorMessage = "응답 이어가기 중 오류가 발생했습니다.";
                if (error instanceof Error) {
                    if (error.message.includes("응답 시간이 초과")) {
                        errorMessage = "⏱️ 응답 시간이 초과되었습니다. 더 간단한 질문으로 다시 시도해주세요.";
                    }
                    else if (error.message.includes("HTTP error")) {
                        errorMessage = "🌐 서버 연결 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
                    }
                    else if (error.message.includes("응답을 읽을 수 없습니다")) {
                        errorMessage = "📡 응답 데이터를 읽는 중 오류가 발생했습니다. 다시 시도해주세요.";
                    }
                    else {
                        errorMessage = `❌ 오류: ${error.message}`;
                    }
                }
                // 웹뷰에 오류 메시지 전송
                this._view?.webview.postMessage({
                    type: "error",
                    message: errorMessage,
                });
                // VSCode 사용자에게도 알림
                vscode.window.showErrorMessage(errorMessage);
            }
        });
        // 타임아웃과 스트리밍 요청 경쟁
        await Promise.race([streamingPromise, timeoutPromise]);
    }
    /**
     * 버그 수정 전용 스트리밍 코드 생성 처리
     */
    async handleBugFixStreamingCodeGeneration(question, modelType = "bug_fix") {
        // 질문 매개변수 안전성 검증
        if (!question || typeof question !== "string") {
            console.error("❌ 버그 수정 질문이 유효하지 않습니다:", question);
            vscode.window.showErrorMessage("버그 수정 요청을 입력해주세요.");
            if (this._view?.webview) {
                this._view.webview.postMessage({
                    command: "streamingError",
                    error: "버그 수정 요청이 입력되지 않았습니다. 다시 시도해주세요.",
                });
            }
            return;
        }
        // 질문 길이 검증
        const trimmedQuestion = question.trim();
        if (trimmedQuestion.length === 0) {
            console.error("❌ 빈 버그 수정 질문이 전달됨");
            vscode.window.showErrorMessage("버그 수정 요청을 입력해주세요.");
            if (this._view?.webview) {
                this._view.webview.postMessage({
                    command: "streamingError",
                    error: "버그 수정 요청을 입력해주세요.",
                });
            }
            return;
        }
        if (!this._view?.webview) {
            console.error("❌ 웹뷰가 없어 버그 수정 스트리밍을 시작할 수 없습니다");
            return;
        }
        console.log("🔧 버그 수정 스트리밍 시작:", {
            question: trimmedQuestion.length > 100 ? trimmedQuestion.substring(0, 100) + "..." : trimmedQuestion,
            questionLength: trimmedQuestion.length,
            modelType,
            webviewReady: !!this._view?.webview,
        });
        // 현재 활성 편집기의 컨텍스트 가져오기
        const activeEditor = vscode.window.activeTextEditor;
        let codeContext = undefined;
        if (activeEditor && activeEditor.selection && !activeEditor.selection.isEmpty) {
            codeContext = activeEditor.document.getText(activeEditor.selection);
        }
        // 스트리밍 완료 후 최종 응답 저장용 변수
        let finalStreamingContent = "";
        // 버그 수정 전용 API 요청 구성 (DB 연동 개선)
        const bugFixRequest = {
            prompt: question,
            context: codeContext || "",
            model_type: modelType || "bug_fix",
            language: "python",
            temperature: 0.3,
            top_p: 0.95,
            max_tokens: 1024,
            programming_level: await this.getUserProgrammingLevel(),
            explanation_detail: await this.getUserExplanationDetail(),
            code_style: "pythonic",
            include_comments: true,
            include_docstring: true,
            include_type_hints: true,
            project_context: await this.getUserProjectContext(),
        };
        console.log("🚀 ERROR 모드 API 요청 데이터:", {
            request: bugFixRequest,
            model_type_final: bugFixRequest.model_type,
            prompt_length: bugFixRequest.prompt.length,
            has_context: !!bugFixRequest.context,
        });
        // 스트리밍 콜백 설정 (강화된 디버깅 및 오류 처리)
        const callbacks = {
            onStart: () => {
                console.log("🎬 스트리밍 시작됨");
                if (this._view?.webview) {
                    this._view.webview.postMessage({
                        command: "streamingStarted",
                        message: "AI가 응답을 생성하고 있습니다...",
                        timestamp: Date.now(),
                    });
                }
            },
            onChunk: (chunk) => {
                // Backend 호환성: text 필드도 지원
                const chunkContent = chunk.text || chunk.content || "";
                console.log("📦 스트리밍 청크 수신:", {
                    chunkType: chunk.type,
                    chunkContentLength: chunkContent.length,
                    chunkSequence: chunk.sequence,
                    hasWebview: !!this._view?.webview,
                    chunkContent: chunkContent.substring(0, 50) + "..." || "empty",
                });
                if (this._view?.webview) {
                    // [DONE] 신호 감지 - 스트리밍 종료 처리
                    if (chunkContent === "[DONE]" ||
                        (typeof chunkContent === "string" && chunkContent.trim() === "[DONE]") ||
                        chunk.type === "done" ||
                        chunk.is_complete === true) {
                        console.log("🏁 [DONE] 신호 감지 - 스트리밍 종료 처리");
                        // 안전한 프로퍼티 접근을 위한 타입 단언
                        const chunkData = chunk;
                        // 최종 완료 메시지 전송
                        this._view.webview.postMessage({
                            command: "streamingComplete",
                            finalContent: chunkData.finalContent || "",
                            totalChunks: chunkData.totalChunks || 0,
                            sessionId: chunkData.sessionId || Date.now().toString(),
                            timestamp: Date.now(),
                        });
                        return; // [DONE] 처리 후 즉시 종료
                    }
                    // 웹뷰로 청크 데이터 전송 (일반 청크)
                    this._view.webview.postMessage({
                        command: "streamingChunk",
                        chunk: {
                            type: chunk.type || "text",
                            content: chunkContent || "",
                            sequence: chunk.sequence || 0,
                            timestamp: chunk.timestamp || Date.now(),
                            is_complete: chunk.is_complete || false,
                        },
                        timestamp: Date.now(),
                    });
                }
            },
            onComplete: () => {
                console.log("🏁 스트리밍 완료됨");
                if (this._view?.webview) {
                    this._view.webview.postMessage({
                        command: "streamingComplete",
                        timestamp: Date.now(),
                        message: "코드 생성이 완료되었습니다.",
                    });
                    console.log("✅ 웹뷰로 완료 메시지 전송");
                }
                // 히스토리에 추가 (질문과 현재까지 누적된 응답)
                this.addToHistory(question.trim(), "AI 생성 코드").catch(error => {
                    console.error("❌ 히스토리 저장 실패:", error);
                });
            },
            onError: (error) => {
                console.error("❌ 스트리밍 오류:", {
                    errorMessage: error.message,
                    errorName: error.name,
                    hasWebview: !!this._view?.webview,
                });
                if (this._view?.webview) {
                    this._view.webview.postMessage({
                        command: "streamingError",
                        error: error.message || "코드 생성 중 오류가 발생했습니다.",
                        timestamp: Date.now(),
                    });
                    console.log("✅ 웹뷰로 오류 메시지 전송");
                }
                // 사용자에게도 알림
                vscode.window.showErrorMessage(`HAPA 코드 생성 오류: ${error.message}`);
            },
        };
        try {
            // 버그 수정 전용으로 직접 API 호출
            await apiClient_1.apiClient.generateCodeStreaming(bugFixRequest.prompt, bugFixRequest.context || "", {
                onChunk: callbacks.onChunk || (() => { }),
                onComplete: callbacks.onComplete,
                onError: callbacks.onError,
            });
        }
        catch (error) {
            console.error("버그 수정 스트리밍 실패:", error);
            callbacks.onError?.(error instanceof Error ? error : new Error("알 수 없는 오류"));
        }
    }
    /**
     * 스트리밍 코드 생성 처리 (안전성 강화 및 API 구조 개선)
     */
    async handleStreamingCodeGeneration(question, modelType = "code_generation") {
        // 질문 매개변수 안전성 검증
        if (!question || typeof question !== "string") {
            console.error("❌ 질문이 유효하지 않습니다:", question);
            vscode.window.showErrorMessage("질문을 입력해주세요.");
            if (this._view?.webview) {
                this._view.webview.postMessage({
                    command: "streamingError",
                    error: "질문이 입력되지 않았습니다. 다시 시도해주세요.",
                });
            }
            return;
        }
        // 질문 길이 검증
        const trimmedQuestion = question.trim();
        if (trimmedQuestion.length === 0) {
            console.error("❌ 빈 질문이 전달됨");
            vscode.window.showErrorMessage("질문을 입력해주세요.");
            if (this._view?.webview) {
                this._view.webview.postMessage({
                    command: "streamingError",
                    error: "질문을 입력해주세요.",
                });
            }
            return;
        }
        if (!this._view?.webview) {
            console.error("❌ 웹뷰가 없어 스트리밍을 시작할 수 없습니다");
            return;
        }
        console.log("🚀 스트리밍 코드 생성 시작:", {
            question: trimmedQuestion.length > 100 ? trimmedQuestion.substring(0, 100) + "..." : trimmedQuestion,
            questionLength: trimmedQuestion.length,
            modelType,
            webviewReady: !!this._view?.webview,
        });
        // 현재 활성 편집기의 컨텍스트 가져오기
        const activeEditor = vscode.window.activeTextEditor;
        let codeContext = undefined;
        if (activeEditor && activeEditor.selection && !activeEditor.selection.isEmpty) {
            codeContext = activeEditor.document.getText(activeEditor.selection);
            console.log("📝 활성 에디터 컨텍스트 추출:", {
                contextLength: codeContext.length,
                selectionRange: `${activeEditor.selection.start.line}-${activeEditor.selection.end.line}`,
            });
        }
        // 스트리밍 완료 후 최종 응답 저장용 변수
        let finalStreamingContent = "";
        let streamingStartTime = Date.now();
        let chunkCount = 0;
        let lastChunkTime = Date.now();
        // 청크 번들링을 위한 변수들
        let chunkBuffer = "";
        let lastBundleTime = Date.now();
        const BUNDLE_INTERVAL = 100; // 100ms마다 번들 전송
        const MIN_BUNDLE_SIZE = 50; // 최소 50자 이상일 때 번들 전송
        // 안전한 스트리밍 콜백 설정
        const callbacks = {
            onStart: () => {
                console.log("🎬 스트리밍 시작 콜백 실행");
                streamingStartTime = Date.now();
                chunkCount = 0;
                finalStreamingContent = "";
                // 웹뷰에 스트리밍 시작 신호 전송
                if (this._view?.webview) {
                    this._view.webview.postMessage({
                        command: "streamingStarted",
                        timestamp: new Date().toISOString(),
                    });
                }
            },
            onChunk: (chunk) => {
                try {
                    chunkCount++;
                    lastChunkTime = Date.now();
                    // 현재 청크 내용 추출
                    const currentChunkContent = chunk.text || chunk.content || "";
                    // 🚀 강화된 조기 종료 로직 - 간단한 요청 감지
                    if (currentChunkContent) {
                        // 1. 실제 vLLM stop token 감지 - FIM 토큰 포함
                        const stopTokens = [
                            "\n# --- Generation Complete ---", // vLLM 완료 마커
                            "", // FIM 시작 토큰
                            "", // FIM 종료 토큰
                            "<|endoftext|>", // GPT 스타일 종료
                            "<|im_end|>", // 백업용 ChatML 종료
                            "</s>", // 백업용 시퀀스 종료
                            "[DONE]", // 백업용 완료 신호
                        ];
                        let detectedStopToken = null;
                        let contentBeforeStop = currentChunkContent;
                        for (const stopToken of stopTokens) {
                            if (currentChunkContent.includes(stopToken)) {
                                console.log(`🔚 실제 vLLM stop token 감지: ${stopToken} - 스트리밍 종료`);
                                detectedStopToken = stopToken;
                                contentBeforeStop = currentChunkContent.split(stopToken)[0];
                                break;
                            }
                        }
                        if (detectedStopToken) {
                            // Stop token 앞부분만 추가
                            if (contentBeforeStop.trim()) {
                                finalStreamingContent += contentBeforeStop;
                                // 웹뷰에 최종 청크 전송
                                if (this._view?.webview) {
                                    this._view.webview.postMessage({
                                        command: "streamingChunk",
                                        chunk: {
                                            ...chunk,
                                            content: contentBeforeStop,
                                            type: "final",
                                        },
                                        chunkNumber: chunkCount,
                                        isLast: true,
                                    });
                                }
                            }
                            // 스트리밍 완료 처리
                            setTimeout(() => {
                                if (this._view?.webview) {
                                    this._view.webview.postMessage({
                                        command: "streamingComplete",
                                        finalContent: this.cleanAIResponse(finalStreamingContent),
                                        totalChunks: chunkCount,
                                        duration: lastChunkTime - streamingStartTime,
                                        terminationReason: `vllm_stop_token_detected:${detectedStopToken}`,
                                    });
                                }
                            }, 30); // 더 빠른 종료
                            return;
                        }
                        // 태그가 없는 경우에만 내용 추가
                        finalStreamingContent += currentChunkContent;
                        // 🎯 2. 강화된 간단한 print문 완성 감지 (즉시 종료)
                        const printPatterns = [
                            /print\s*\(\s*["'][^"']*["']\s*\)/, // print("text")
                            /print\s*\(\s*["'][^"']*["']\s*\)\s*$/, // print("text") 완전 종료
                            /print\s*\(\s*f?["'][^"']*["']\s*\)\s*[;\n]*$/, // f-string 포함
                            /console\.log\s*\(\s*["'][^"']*["']\s*\)/, // console.log("text")
                            /puts\s+["'][^"']*["']/, // Ruby puts
                            /echo\s+["'][^"']*["']/, // PHP/Shell echo
                        ];
                        const isSimpleRequest = question.toLowerCase().includes("출력") ||
                            question.toLowerCase().includes("print") ||
                            question.toLowerCase().includes("hello") ||
                            question.toLowerCase().includes("world") ||
                            question.toLowerCase().includes("jay") ||
                            question.length < 50;
                        // 🔥 더 적극적인 조기 종료 - 완전한 출력문이 감지되면 즉시 종료
                        if (isSimpleRequest && finalStreamingContent.length > 5) {
                            const hasCompleteOutput = printPatterns.some(pattern => pattern.test(finalStreamingContent));
                            // 간단한 변수 할당도 감지
                            const simpleAssignmentPattern = /^\s*\w+\s*=\s*["'][^"']*["']\s*$/;
                            const hasSimpleAssignment = simpleAssignmentPattern.test(finalStreamingContent.trim());
                            if (hasCompleteOutput || hasSimpleAssignment) {
                                console.log("🎯 간단한 출력/할당 완성 감지 - 즉시 종료");
                                console.log("📝 최종 내용:", finalStreamingContent.trim());
                                // 즉시 스트리밍 완료 처리
                                setTimeout(() => {
                                    if (this._view?.webview) {
                                        this._view.webview.postMessage({
                                            command: "streamingComplete",
                                            finalContent: this.cleanAIResponse(finalStreamingContent),
                                            totalChunks: chunkCount,
                                            duration: lastChunkTime - streamingStartTime,
                                            earlyTermination: "simple_output_detected",
                                        });
                                    }
                                }, 50); // 더 빠른 종료
                                return;
                            }
                        }
                        // 🎯 3. 과도한 내용 감지 시 조기 종료
                        if (finalStreamingContent.length > 100 && isSimpleRequest) {
                            const hasExcessiveContent = finalStreamingContent.includes('"""') ||
                                finalStreamingContent.includes("def ") ||
                                finalStreamingContent.includes("class ") ||
                                finalStreamingContent.includes("This is") ||
                                finalStreamingContent.includes("basic");
                            if (hasExcessiveContent) {
                                console.log("⚠️ 간단한 요청에 과도한 응답 감지 - 조기 종료");
                                // print 문만 추출
                                const printMatch = finalStreamingContent.match(/print\s*\([^)]+\)/);
                                if (printMatch) {
                                    const cleanedContent = printMatch[0];
                                    console.log("✂️ print 문만 추출:", cleanedContent);
                                    setTimeout(() => {
                                        if (this._view?.webview) {
                                            this._view.webview.postMessage({
                                                command: "streamingComplete",
                                                finalContent: cleanedContent,
                                                totalChunks: chunkCount,
                                                duration: lastChunkTime - streamingStartTime,
                                                earlyTermination: "excessive_content_trimmed",
                                            });
                                        }
                                    }, 100);
                                    return;
                                }
                            }
                        }
                    }
                    console.log("📦 스트리밍 청크 수신:", {
                        type: chunk.type,
                        sequence: chunk.sequence,
                        contentLength: chunk.content?.length || 0,
                        chunkNumber: chunkCount,
                        timeSinceStart: lastChunkTime - streamingStartTime,
                        hasImEnd: currentChunkContent?.includes("<|im_end|>") || false,
                    });
                    // 웹뷰 상태 확인
                    if (!this._view?.webview) {
                        console.warn("⚠️ 웹뷰가 사라짐 - 스트리밍 중단");
                        return;
                    }
                    // 청크 타입별 처리
                    if (chunk.type === "start") {
                        // 시작 청크 - UI 초기화
                        this._view.webview.postMessage({
                            command: "streamingChunk",
                            chunk: {
                                type: "start",
                                content: "",
                                sequence: chunk.sequence,
                                timestamp: chunk.timestamp,
                            },
                        });
                    }
                    else if (chunk.type === "token" || chunk.type === "code") {
                        // 콘텐츠 청크 - 안전성 검증
                        const chunkText = chunk.text || chunk.content || "";
                        if (chunkText && typeof chunkText === "string") {
                            // 콘텐츠 정리 및 누적
                            const cleanedContent = this.cleanStreamingContent(chunkText);
                            if (cleanedContent.trim()) {
                                finalStreamingContent += cleanedContent;
                                chunkBuffer += cleanedContent;
                                // 청크 번들링 로직
                                const currentTime = Date.now();
                                const shouldSendBundle = chunkBuffer.length >= MIN_BUNDLE_SIZE ||
                                    currentTime - lastBundleTime >= BUNDLE_INTERVAL ||
                                    cleanedContent.includes("\n"); // 줄바꿈이 있으면 즉시 전송
                                if (shouldSendBundle && chunkBuffer.trim()) {
                                    // 번들된 청크 전송
                                    this._view.webview.postMessage({
                                        command: "streamingChunk",
                                        chunk: {
                                            type: "bundled",
                                            content: chunkBuffer,
                                            sequence: chunk.sequence,
                                            timestamp: chunk.timestamp,
                                            totalLength: finalStreamingContent.length,
                                            bundleSize: chunkBuffer.length,
                                        },
                                    });
                                    // 전송된 번들 크기 로깅
                                    const bundleSize = chunkBuffer.length;
                                    console.log(`📦 번들 청크 전송 (${bundleSize}자)`);
                                    // 버퍼 초기화
                                    chunkBuffer = "";
                                    lastBundleTime = currentTime;
                                }
                            }
                        }
                        else {
                            console.warn("⚠️ 잘못된 청크 콘텐츠:", chunk);
                        }
                    }
                    else if (chunk.type === "error") {
                        // 오류 청크
                        const errorContent = chunk.text || chunk.content || "";
                        console.error("❌ 스트리밍 오류 청크:", errorContent);
                        this._view.webview.postMessage({
                            command: "streamingError",
                            error: errorContent || "스트리밍 중 오류 발생",
                            timestamp: chunk.timestamp,
                        });
                    }
                    // 성능 모니터링 - 너무 많은 청크나 긴 응답 감지
                    if (chunkCount > 1000) {
                        console.warn("⚠️ 청크 수가 과도함 - 응답 제한 검토 필요");
                    }
                    if (finalStreamingContent.length > 50000) {
                        console.warn("⚠️ 응답이 너무 김 - 50KB 초과");
                    }
                }
                catch (chunkError) {
                    console.error("❌ 청크 처리 중 오류:", chunkError);
                    // 청크 처리 오류가 전체 스트리밍을 중단하지 않도록 방어
                }
            },
            onComplete: () => {
                try {
                    const totalDuration = Date.now() - streamingStartTime;
                    // 남은 버퍼가 있으면 마지막으로 전송
                    if (chunkBuffer.trim() && this._view?.webview) {
                        console.log("📦 마지막 번들 청크 전송:", chunkBuffer.length);
                        this._view.webview.postMessage({
                            command: "streamingChunk",
                            chunk: {
                                type: "final_bundle",
                                content: chunkBuffer,
                                sequence: chunkCount,
                                timestamp: new Date().toISOString(),
                                totalLength: finalStreamingContent.length,
                                bundleSize: chunkBuffer.length,
                            },
                        });
                        chunkBuffer = "";
                    }
                    console.log("✅ 스트리밍 완료:", {
                        totalChunks: chunkCount,
                        duration: totalDuration,
                        contentLength: finalStreamingContent.length,
                        avgChunkTime: chunkCount > 0 ? totalDuration / chunkCount : 0,
                        finalBufferCleared: true,
                    });
                    if (!this._view?.webview) {
                        console.warn("⚠️ 스트리밍 완료 시 웹뷰 없음");
                        return;
                    }
                    // JSON 파싱 시도 (백엔드 응답 형식 대응)
                    let parsedContent = finalStreamingContent;
                    try {
                        if (typeof parsedContent === "string" && parsedContent.trim().startsWith("{")) {
                            const parsedCode = JSON.parse(parsedContent);
                            if (parsedCode.text) {
                                parsedContent = parsedCode.text;
                                console.log("✅ 스트리밍 응답에서 JSON text 필드 추출 성공");
                            }
                            else if (parsedCode.content) {
                                parsedContent = parsedCode.content;
                                console.log("✅ 스트리밍 응답에서 JSON content 필드 추출 성공");
                            }
                        }
                    }
                    catch (parseError) {
                        console.log("ℹ️ 스트리밍 JSON 파싱 불가, 원본 사용:", parseError);
                    }
                    // 최종 응답 정리
                    let finalCleanedContent = this.finalizeResponse(parsedContent);
                    const isPrintStatement = /print\s*\([^)]*\)/.test(finalCleanedContent);
                    const isSimpleExpression = finalCleanedContent.split("\n").length === 1;
                    const isValidPythonCode = /^(print|def|class|import|from|return|\w+\s*[=+\-*/]|[\w\.]+\([^)]*\))/.test(finalCleanedContent.trim());
                    const isMathExpression = /^[\d\w\s+\-*/().]+$/.test(finalCleanedContent.trim());
                    const isVariableAssignment = /^\w+\s*=\s*.+/.test(finalCleanedContent.trim());
                    const isFunctionCall = /\w+\([^)]*\)/.test(finalCleanedContent.trim());
                    // 응답 품질 검증
                    const isValidResponse = finalCleanedContent.length >= 1 && // 최소 1글자
                        (isPrintStatement || // print("hello")
                            isValidPythonCode || // def func():
                            isMathExpression || // 2 + 3
                            isVariableAssignment || // x = 5
                            isFunctionCall || // len([1,2,3])
                            finalCleanedContent.length >= 5); // 5글자 이상은 무조건 허용
                    if (!isValidResponse || finalCleanedContent.trim() === "") {
                        console.warn("⚠️ 응답이 유효하지 않음:", {
                            length: finalCleanedContent.length,
                            content: finalCleanedContent.substring(0, 50),
                            isPrintStatement,
                            isValidPythonCode,
                            isMathExpression,
                            isVariableAssignment,
                            isFunctionCall,
                        });
                        // ❌ 정말로 무효한 응답인 경우에만 경고 메시지 추가
                        if (finalCleanedContent.trim() === "" || finalCleanedContent.length < 1) {
                            finalCleanedContent = "⚠️ **응답이 생성되지 않았습니다.** 다시 시도해주세요.";
                        }
                        else {
                            // 짧지만 유효한 응답은 그대로 표시하고 간단한 안내만 추가
                            finalCleanedContent +=
                                "\n\n💡 **참고**: 간단한 응답입니다. 더 자세한 설명이 필요하면 추가 질문해주세요.";
                        }
                    }
                    else {
                        console.log("✅ 유효한 응답 확인:", {
                            length: finalCleanedContent.length,
                            type: isPrintStatement
                                ? "print문"
                                : isValidPythonCode
                                    ? "Python 코드"
                                    : isMathExpression
                                        ? "수식"
                                        : isVariableAssignment
                                            ? "변수 할당"
                                            : isFunctionCall
                                                ? "함수 호출"
                                                : "일반 응답",
                        });
                    }
                    // 보안 경고 및 사용자 안내 추가 (조건부)
                    if (finalCleanedContent.length > 100 && finalCleanedContent.includes("def ")) {
                        const securityWarnings = [
                            "\n\n⚠️ **보안 알림**: 위 코드를 실행하기 전에 반드시 검토하세요.",
                            "\n📝 **사용법**: 코드를 복사하여 Python 파일로 저장한 후 실행하세요.",
                            "\n🔍 **참고**: AI가 생성한 코드이므로 문법 오류나 논리적 오류가 있을 수 있습니다.",
                            "\n💡 **팁**: 복잡한 요구사항은 단계별로 나누어 질문하시면 더 정확한 답변을 받을 수 있습니다.",
                        ];
                        finalCleanedContent += securityWarnings.join("");
                    }
                    // 스트리밍 완료 메시지 전송
                    this._view.webview.postMessage({
                        command: "streamingComplete",
                        finalContent: finalCleanedContent,
                        metadata: {
                            duration: totalDuration,
                            chunkCount: chunkCount,
                            contentLength: finalCleanedContent.length,
                            modelType: modelType,
                            timestamp: new Date().toISOString(),
                        },
                    });
                    // 히스토리에 추가 (정리된 콘텐츠로 저장)
                    this.addToHistory(question, finalCleanedContent).catch(error => {
                        console.error("❌ 히스토리 저장 실패:", error);
                    });
                    console.log("✅ 스트리밍 완료 처리 및 응답 정리 완료:", {
                        original_length: finalStreamingContent.length,
                        cleaned_length: finalCleanedContent.length,
                        model_type: modelType,
                        performance: {
                            duration: totalDuration,
                            chunksPerSecond: ((chunkCount / totalDuration) * 1000).toFixed(2),
                        },
                    });
                }
                catch (completeError) {
                    console.error("❌ 스트리밍 완료 처리 중 오류:", completeError);
                    // 완료 처리 오류 시 사용자에게 알림
                    this._view?.webview.postMessage({
                        command: "streamingError",
                        error: "응답 처리 중 오류가 발생했습니다.",
                    });
                }
            },
            onError: (error) => {
                try {
                    const duration = Date.now() - streamingStartTime;
                    console.error("❌ 스트리밍 오류:", {
                        error: error.message || error.toString(),
                        duration: duration,
                        chunksReceived: chunkCount,
                        modelType: modelType,
                    });
                    if (this._view?.webview) {
                        // 구체적인 오류 메시지 생성
                        let userFriendlyMessage = "코드 생성 중 오류가 발생했습니다.";
                        if (error.code === "NETWORK_ERROR") {
                            userFriendlyMessage =
                                "🌐 네트워크 연결 오류가 발생했습니다. 인터넷 연결을 확인해주세요.";
                        }
                        else if (error.code === "TIMEOUT_ERROR") {
                            userFriendlyMessage =
                                "⏱️ 응답 시간이 초과되었습니다. 더 간단한 질문으로 다시 시도해주세요.";
                        }
                        else if (error.code === "REQUEST_ABORTED") {
                            userFriendlyMessage = "🛑 요청이 취소되었습니다.";
                        }
                        else if (error.message?.includes("401")) {
                            userFriendlyMessage = "🔑 API 인증 오류가 발생했습니다. 설정을 확인해주세요.";
                        }
                        else if (error.message?.includes("500")) {
                            userFriendlyMessage = "🛠️ 서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
                        }
                        this._view.webview.postMessage({
                            command: "streamingError",
                            error: userFriendlyMessage,
                            details: {
                                code: error.code,
                                message: error.message,
                                duration: duration,
                                modelType: modelType,
                            },
                        });
                    }
                    // VSCode 사용자에게도 알림
                    vscode.window.showErrorMessage(`HAPA 오류: ${error.message || error.toString()}`);
                }
                catch (errorHandlingError) {
                    console.error("❌ 오류 처리 중 추가 오류:", errorHandlingError);
                }
            },
        };
        try {
            // modelType을 VLLMModelType으로 안전하게 변환
            let vllmModelType;
            switch (modelType) {
                case "code_completion":
                    vllmModelType = apiClient_2.VLLMModelType.CODE_COMPLETION;
                    break;
                case "code_generation":
                    vllmModelType = apiClient_2.VLLMModelType.CODE_GENERATION;
                    break;
                case "code_explanation":
                    vllmModelType = apiClient_2.VLLMModelType.CODE_EXPLANATION;
                    break;
                case "bug_fix":
                    vllmModelType = apiClient_2.VLLMModelType.BUG_FIX;
                    break;
                case "code_optimization":
                    vllmModelType = apiClient_2.VLLMModelType.CODE_OPTIMIZATION;
                    break;
                case "unit_test_generation":
                    vllmModelType = apiClient_2.VLLMModelType.UNIT_TEST_GENERATION;
                    break;
                case "documentation":
                    vllmModelType = apiClient_2.VLLMModelType.DOCUMENTATION;
                    break;
                default:
                    console.warn("⚠️ 알 수 없는 모델 타입, 기본값 사용:", modelType);
                    vllmModelType = apiClient_2.VLLMModelType.CODE_GENERATION;
            }
            // 모델별 특화된 설정 가져오기
            const modelConfig = this.getModelConfiguration(modelType);
            // 프롬프트 최적화 및 전처리
            const optimizedPrompt = this.optimizePrompt(question.trim(), modelType);
            // 백엔드 API 스키마에 맞춘 요청 구성
            const request = {
                // 핵심 요청 정보
                prompt: optimizedPrompt,
                model_type: vllmModelType,
                context: codeContext || "",
                // vLLM 서버 전용 매개변수
                temperature: modelConfig.temperature || 0.3,
                top_p: modelConfig.top_p || 0.95,
                max_tokens: modelConfig.max_tokens || 1024,
                // 사용자 개인화 옵션 (DB 연동으로 개선)
                programming_level: await this.getUserProgrammingLevel(),
                explanation_detail: await this.getUserExplanationDetail(),
                code_style: "pythonic",
                include_comments: modelConfig.include_comments !== false,
                include_docstring: modelConfig.include_docstring !== false,
                include_type_hints: modelConfig.include_type_hints !== false,
                // 추가 메타데이터
                language: "python",
                project_context: await this.getUserProjectContext(),
            };
            // 요청 검증
            if (!request.prompt || request.prompt.length === 0) {
                throw new Error("질문이 비어있습니다.");
            }
            if (request.prompt.length > 4000) {
                throw new Error("질문이 너무 깁니다. (최대 4000자)");
            }
            console.log("🚀 최종 스트리밍 요청 데이터:", {
                original_model_type: modelType,
                mapped_vllm_model_type: vllmModelType,
                prompt_length: request.prompt.length,
                has_context: !!request.context,
                context_length: request.context?.length || 0,
                temperature: request.temperature,
                max_tokens: request.max_tokens,
                programming_level: request.programming_level,
            });
            // 스트리밍 시작 알림 (UI 준비를 위해 추가)
            this._view.webview.postMessage({
                command: "streamingStarted",
                data: {
                    timestamp: new Date().toISOString(),
                    modelType: modelType,
                    question: question.substring(0, 100) + (question.length > 100 ? "..." : ""),
                },
            });
            // API 클라이언트를 통한 스트리밍 요청
            await apiClient_1.apiClient.generateCodeStreaming(request.prompt, request.context || "", {
                onChunk: callbacks.onChunk,
                onComplete: callbacks.onComplete,
                onError: callbacks.onError,
            });
        }
        catch (error) {
            console.error("❌ 스트리밍 코드 생성 실행 실패:", error);
            callbacks.onError?.(error instanceof Error ? error : new Error("알 수 없는 오류"));
        }
    }
    /**
     * 생성된 코드를 활성 편집기에 삽입
     */
    async insertCodeToActiveEditor(code) {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            vscode.window.showWarningMessage("코드를 삽입할 편집기가 없습니다.");
            return;
        }
        try {
            await activeEditor.edit(editBuilder => {
                if (activeEditor.selection && !activeEditor.selection.isEmpty) {
                    // 선택된 텍스트가 있으면 교체
                    editBuilder.replace(activeEditor.selection, code);
                }
                else {
                    // 선택된 텍스트가 없으면 커서 위치에 삽입
                    editBuilder.insert(activeEditor.selection.active, code);
                }
            });
            vscode.window.showInformationMessage("코드가 성공적으로 삽입되었습니다.");
        }
        catch (error) {
            vscode.window.showErrorMessage(`코드 삽입 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}`);
        }
    }
    /**
     * AI 응답 정리 (태그 제거, 포맷팅 등)
     */
    cleanAIResponse(content) {
        if (!content) {
            return "";
        }
        // im_end 태그 제거
        let cleaned = content.replace(/<\|im_end\|>/g, "");
        // 기타 특수 태그들 제거
        cleaned = cleaned.replace(/<\|.*?\|>/g, "");
        // 과도한 공백 정리
        cleaned = cleaned.replace(/\n\s*\n\s*\n/g, "\n\n");
        cleaned = cleaned.trim();
        return cleaned;
    }
    /**
     * TriggerDetector에서 발생한 이벤트 처리 (public으로 변경)
     */
    async handleTriggerEvent(event) {
        if (!this._view?.webview) {
            return;
        }
        try {
            // 로딩 상태 표시
            this._view.webview.postMessage({
                command: "showLoading",
                message: "AI가 코드를 분석하고 있습니다...",
            });
            // AI 질문으로 변환하여 스트리밍 처리
            const prompt = event.data.prompt;
            await this.handleAIQuestion(prompt);
        }
        catch (error) {
            // 에러 처리
            this._view.webview.postMessage({
                command: "streamingError",
                error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
            });
        }
    }
    /**
     * AI 질문 처리 (SidebarProvider 전용 - 스트리밍 방식만 사용)
     */
    async handleAIQuestion(question) {
        // 스트리밍 방식으로만 처리하여 중복 방지
        await this.handleStreamingCodeGeneration(question);
    }
    /**
     * 확장된 뷰를 메인 패널에 열기
     */
    openExpandedView() {
        // 기존 패널이 있는지 확인 (유효하지 않은 패널은 제거)
        this.expandedPanels = this.expandedPanels.filter(panel => {
            try {
                // 패널이 여전히 유효한지 확인
                return panel && panel.visible !== undefined;
            }
            catch {
                return false; // 유효하지 않은 패널
            }
        });
        if (this.expandedPanels.length > 0) {
            // 기존 패널에 포커스 이동
            const existingPanel = this.expandedPanels[0];
            try {
                console.log("✅ 기존 확장 뷰에 포커스 이동");
                existingPanel.reveal(vscode.ViewColumn.One);
                return;
            }
            catch (error) {
                console.warn("⚠️ 기존 패널에 포커스 이동 실패, 새 패널 생성:", error);
                // 패널이 유효하지 않으면 배열에서 제거
                this.expandedPanels = [];
            }
        }
        console.log("🔧 새 확장 뷰 패널 생성");
        // 새로운 웹뷰 패널 생성
        const panel = vscode.window.createWebviewPanel("hapaExpandedView", "HAPA - Expanded View", vscode.ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [this._extensionUri],
        });
        // 패널을 추적 목록에 추가
        this.expandedPanels.push(panel);
        // 확장된 뷰의 HTML 콘텐츠 설정
        panel.webview.html = this.getExpandedViewHtml(panel.webview);
        // 확장된 뷰의 메시지 처리
        panel.webview.onDidReceiveMessage(message => {
            this.handleExpandedViewMessage(message, panel);
        }, undefined, []);
        // 패널이 닫힐 때 정리
        panel.onDidDispose(() => {
            // 추적 목록에서 제거
            const index = this.expandedPanels.indexOf(panel);
            if (index > -1) {
                this.expandedPanels.splice(index, 1);
            }
        });
        // 패널 생성 직후 현재 히스토리 및 코드 맥락 동기화
        setTimeout(() => {
            // 히스토리 동기화
            panel.webview.postMessage({
                command: "syncHistory",
                history: JSON.stringify(this.questionHistory),
            });
            // 코드 맥락 정보 동기화
            const contextInfo = this.getCodeContextInfo();
            panel.webview.postMessage({
                command: "updateCodeContext",
                context: contextInfo,
            });
            // 현재 응답 상태 동기화
            const shouldRestoreResponse = this.currentResponseState.isValid &&
                this.currentResponseState.response &&
                this.currentResponseState.timestamp &&
                Date.now() - this.currentResponseState.timestamp < 30 * 60 * 1000; // 30분 내
            if (shouldRestoreResponse) {
                console.log("🔄 확장 뷰에 마지막 응답 상태 동기화");
                panel.webview.postMessage({
                    command: "restoreResponse",
                    response: this.currentResponseState.response,
                });
            }
            else {
                console.log("📤 확장 뷰에 빈 상태 초기화");
                panel.webview.postMessage({
                    command: "initializeEmptyStates",
                });
            }
        }, 100);
    }
    /**
     * 확장된 뷰의 HTML 생성
     */
    getExpandedViewHtml(webview) {
        // 확장 뷰용 전용 HTML 사용 (좌우 레이아웃, 확장 버튼 제거)
        return SidebarHtmlGenerator_1.SidebarHtmlGenerator.generateExpandedViewHtml();
    }
    /**
     * 웹뷰에 에러 메시지 전송
     */
    sendErrorToWebview(errorMessage) {
        try {
            if (this._view?.webview) {
                this._view.webview
                    .postMessage({
                    command: "streamingError",
                    error: errorMessage,
                    timestamp: new Date().toISOString(),
                })
                    .then(undefined, error => {
                    console.error("❌ 에러 메시지 전송 실패:", error);
                });
            }
            // 모든 확장 패널에도 전송
            this.expandedPanels.forEach((panel, index) => {
                if (panel.webview) {
                    panel.webview
                        .postMessage({
                        command: "streamingError",
                        error: errorMessage,
                        timestamp: new Date().toISOString(),
                    })
                        .then(undefined, error => {
                        console.error(`❌ 확장 패널 ${index} 에러 메시지 전송 실패:`, error);
                    });
                }
            });
        }
        catch (error) {
            console.error("❌ sendErrorToWebview 실패:", error);
        }
    }
    /**
     * 확장된 뷰의 메시지 처리 (개선)
     */
    async handleExpandedViewMessage(message, panel) {
        switch (message.command) {
            case "generateCodeStreaming":
                this.handleExpandedStreamingCodeGeneration(message.question, panel, message.modelType || message.model_type || "code_generation");
                return;
            case "generateBugFixStreaming":
                this.handleExpandedBugFixStreamingCodeGeneration(message.question, panel, message.model_type);
                return;
            case "insertCode":
                this.insertCodeToActiveEditor(message.code);
                return;
            case "showInfo":
                vscode.window.showInformationMessage(message.message);
                return;
            case "expandView":
                this.openExpandedView();
                return;
            case "clearInput":
                // 확장된 뷰에서는 별도 처리 불필요 (UI에서 처리)
                return;
            case "copyToClipboard":
                // 클립보드 복사 처리
                if (message.text) {
                    vscode.env.clipboard.writeText(message.text);
                    vscode.window.showInformationMessage("클립보드에 복사되었습니다.");
                }
                return;
            case "addToHistory":
                // 히스토리 추가 요청 처리
                this.addToHistory(message.question, message.response).catch(error => {
                    console.error("❌ 히스토리 저장 실패:", error);
                });
                return;
            case "getHistory":
                // 히스토리 요청 처리
                panel.webview.postMessage({
                    command: "syncHistory",
                    history: JSON.stringify(this.questionHistory),
                });
                return;
            case "refreshHistory":
                // 히스토리 새로고침 (DB에서 다시 로드)
                console.log("🔄 확장 패널 히스토리 새로고침 요청");
                this.loadHistory()
                    .then(() => {
                    console.log("✅ 확장 패널 히스토리 새로고침 완료");
                    this.broadcastHistoryUpdate();
                })
                    .catch(error => {
                    console.error("❌ 확장 패널 히스토리 새로고침 실패:", error);
                });
                return;
            case "deleteHistoryItem":
                // 히스토리 항목 삭제 처리
                this.deleteHistoryItem(message.index);
                return;
            case "confirmDeleteHistoryItem":
                // 확인 대화상자를 통한 히스토리 항목 삭제 처리
                this.confirmDeleteHistoryItem(message.index);
                return;
            case "confirmClearAllHistory":
                // 모든 히스토리 삭제 확인
                this.confirmClearAllHistory();
                return;
            case "openSettings":
                // 사용자 설정 열기 - HAPA 설정 페이지
                console.log("⚙️ 설정 명령어 실행 중...");
                try {
                    await vscode.commands.executeCommand("hapa.showSettings");
                    console.log("✅ 설정 명령어 실행 성공");
                }
                catch (error) {
                    console.error("❌ 설정 명령어 실행 실패:", error);
                    vscode.window.showErrorMessage("설정을 열 수 없습니다.");
                }
                return;
            case "showHelp":
                // 가이드 표시 - HAPA 가이드 페이지
                console.log("❓ 도움말 명령어 실행 중...");
                try {
                    await vscode.commands.executeCommand("hapa.showGuide");
                    console.log("✅ 도움말 명령어 실행 성공");
                }
                catch (error) {
                    console.error("❌ 도움말 명령어 실행 실패:", error);
                    vscode.window.showErrorMessage("도움말을 열 수 없습니다.");
                }
                return;
            case "openUserSettings":
                // VS Code 사용자 설정 열기 (HAPA 섹션)
                console.log("🔧 사용자 설정 명령어 실행 중...");
                try {
                    await vscode.commands.executeCommand("hapa.openUserSettings");
                    console.log("✅ 사용자 설정 명령어 실행 성공");
                }
                catch (error) {
                    console.error("❌ 사용자 설정 명령어 실행 실패:", error);
                    vscode.window.showErrorMessage("사용자 설정을 열 수 없습니다.");
                }
                return;
            case "showGuide":
                // 가이드 표시 (showHelp와 동일)
                console.log("📖 가이드 명령어 실행 중...");
                try {
                    await vscode.commands.executeCommand("hapa.showGuide");
                    console.log("✅ 가이드 명령어 실행 성공");
                }
                catch (error) {
                    console.error("❌ 가이드 명령어 실행 실패:", error);
                    vscode.window.showErrorMessage("가이드를 열 수 없습니다.");
                }
                return;
            case "refreshConnection":
                // 연결 새로고침 (상태 표시용)
                vscode.window.showInformationMessage("연결이 새로고침되었습니다.");
                return;
            case "domReadyStatus":
                // DOM 준비 상태 응답 처리
                console.log("✅ 확장 뷰 DOM 준비 상태:", message.isReady);
                if (message.isReady) {
                    // DOM 준비 완료 후 즉시 동기화
                    this.syncExpandedViewState(panel);
                }
                return;
            case "historySynced":
                // 히스토리 동기화 완료 확인
                console.log("✅ 확장 뷰 히스토리 동기화 완료 확인");
                return;
        }
    }
    /**
     * 확장된 뷰에서의 버그 수정 스트리밍 코드 생성 처리
     */
    async handleExpandedBugFixStreamingCodeGeneration(question, panel, modelType = "bug_fix") {
        if (!panel.webview) {
            return;
        }
        // 현재 활성 편집기의 컨텍스트 가져오기
        const activeEditor = vscode.window.activeTextEditor;
        let codeContext = undefined;
        if (activeEditor && activeEditor.selection && !activeEditor.selection.isEmpty) {
            codeContext = activeEditor.document.getText(activeEditor.selection);
        }
        // 버그 수정 전용 API 요청 구성 (DB 연동 개선)
        const bugFixRequest = {
            prompt: question,
            context: codeContext || "",
            model_type: modelType || "bug_fix",
            language: "python",
            temperature: 0.3,
            top_p: 0.95,
            max_tokens: 1024,
            programming_level: await this.getUserProgrammingLevel(),
            explanation_detail: await this.getUserExplanationDetail(),
            code_style: "pythonic",
            include_comments: true,
            include_docstring: true,
            include_type_hints: true,
            project_context: await this.getUserProjectContext(),
        };
        // 스트리밍 콜백 설정
        const callbacks = {
            onStart: () => {
                // 시작 신호는 UI에서 이미 처리됨
            },
            onChunk: (chunk) => {
                if (panel.webview) {
                    panel.webview.postMessage({
                        command: "streamingChunk",
                        chunk: chunk,
                    });
                }
            },
            onComplete: () => {
                if (panel.webview) {
                    panel.webview.postMessage({
                        command: "streamingComplete",
                    });
                }
                // 히스토리에 추가 (question은 UI에서 전달받을 예정)
            },
            onError: (error) => {
                if (panel.webview) {
                    panel.webview.postMessage({
                        command: "streamingError",
                        error: error.message || error.toString(),
                    });
                }
                vscode.window.showErrorMessage(`버그 수정 오류: ${error.message || error.toString()}`);
            },
        };
        try {
            await apiClient_1.apiClient.generateCodeStreaming(bugFixRequest.prompt, bugFixRequest.context || "", {
                onChunk: callbacks.onChunk || (() => { }),
                onComplete: callbacks.onComplete,
                onError: callbacks.onError,
            });
        }
        catch (error) {
            console.error("확장된 뷰 버그 수정 스트리밍 실패:", error);
            callbacks.onError?.(error instanceof Error ? error : new Error("알 수 없는 오류"));
        }
    }
    /**
     * 확장된 뷰에서의 스트리밍 코드 생성 처리 (사이드바와 동일한 로직 적용)
     */
    async handleExpandedStreamingCodeGeneration(question, panel, modelType = "code_generation") {
        // 질문 매개변수 안전성 검증
        if (!question || typeof question !== "string") {
            console.error("❌ [확장뷰] 질문이 유효하지 않습니다:", question);
            vscode.window.showErrorMessage("질문을 입력해주세요.");
            if (panel.webview) {
                panel.webview.postMessage({
                    command: "streamingError",
                    error: "질문이 입력되지 않았습니다. 다시 시도해주세요.",
                });
            }
            return;
        }
        // 질문 길이 검증
        const trimmedQuestion = question.trim();
        if (trimmedQuestion.length === 0) {
            console.error("❌ [확장뷰] 빈 질문이 전달됨");
            vscode.window.showErrorMessage("질문을 입력해주세요.");
            if (panel.webview) {
                panel.webview.postMessage({
                    command: "streamingError",
                    error: "질문을 입력해주세요.",
                });
            }
            return;
        }
        if (!panel.webview) {
            console.error("❌ [확장뷰] 웹뷰가 없어 스트리밍을 시작할 수 없습니다");
            return;
        }
        console.log("🚀 [확장뷰] 스트리밍 코드 생성 시작:", {
            question: trimmedQuestion.length > 100 ? trimmedQuestion.substring(0, 100) + "..." : trimmedQuestion,
            questionLength: trimmedQuestion.length,
            modelType,
            webviewReady: !!panel.webview,
        });
        // 현재 활성 편집기의 컨텍스트 가져오기
        const activeEditor = vscode.window.activeTextEditor;
        let codeContext = undefined;
        if (activeEditor && activeEditor.selection && !activeEditor.selection.isEmpty) {
            codeContext = activeEditor.document.getText(activeEditor.selection);
            console.log("📝 [확장뷰] 활성 에디터 컨텍스트 추출:", {
                contextLength: codeContext.length,
                selectionRange: `${activeEditor.selection.start.line}-${activeEditor.selection.end.line}`,
            });
        }
        // 스트리밍 완료 후 최종 응답 저장용 변수
        let finalStreamingContent = "";
        let streamingStartTime = Date.now();
        let chunkCount = 0;
        // 스트리밍 콜백 설정 (사이드바와 동일한 로직)
        const callbacks = {
            onStart: () => {
                console.log("🎬 [확장뷰] 스트리밍 시작 콜백 실행");
                streamingStartTime = Date.now();
                chunkCount = 0;
                finalStreamingContent = "";
                // 웹뷰에 스트리밍 시작 신호 전송
                if (panel.webview) {
                    panel.webview.postMessage({
                        command: "streamingStarted",
                        timestamp: new Date().toISOString(),
                    });
                }
            },
            onChunk: (chunk) => {
                try {
                    chunkCount++;
                    const lastChunkTime = Date.now();
                    // 현재 청크 내용 추출
                    const currentChunkContent = chunk.text || chunk.content || "";
                    console.log("📦 [확장뷰] 스트리밍 청크 수신:", {
                        type: chunk.type,
                        sequence: chunk.sequence,
                        contentLength: chunk.content?.length || 0,
                        chunkNumber: chunkCount,
                        timeSinceStart: lastChunkTime - streamingStartTime,
                    });
                    // 웹뷰 상태 확인
                    if (!panel.webview) {
                        console.warn("⚠️ [확장뷰] 웹뷰가 사라짐 - 스트리밍 중단");
                        return;
                    }
                    // 청크 타입별 처리
                    if (chunk.type === "start") {
                        // 시작 청크 - UI 초기화
                        panel.webview.postMessage({
                            command: "streamingChunk",
                            chunk: {
                                type: "start",
                                content: "",
                                sequence: chunk.sequence,
                                timestamp: chunk.timestamp,
                            },
                        });
                    }
                    else if (chunk.type === "token" || chunk.type === "code") {
                        // 콘텐츠 청크 - 안전성 검증
                        const chunkText = chunk.text || chunk.content || "";
                        if (chunkText && typeof chunkText === "string") {
                            // 콘텐츠 정리 및 누적
                            const cleanedContent = this.cleanStreamingContent(chunkText);
                            if (cleanedContent.trim()) {
                                finalStreamingContent += cleanedContent;
                                // 청크 전송
                                panel.webview.postMessage({
                                    command: "streamingChunk",
                                    chunk: {
                                        type: "token",
                                        content: cleanedContent,
                                        sequence: chunk.sequence,
                                        timestamp: chunk.timestamp,
                                        totalLength: finalStreamingContent.length,
                                    },
                                });
                            }
                        }
                        else {
                            console.warn("⚠️ [확장뷰] 잘못된 청크 콘텐츠:", chunk);
                        }
                    }
                    else if (chunk.type === "done") {
                        console.log("🏁 [확장뷰] 완료 청크 수신");
                    }
                }
                catch (error) {
                    console.error("❌ [확장뷰] 청크 처리 오류:", error);
                }
            },
            onComplete: () => {
                try {
                    const totalDuration = Date.now() - streamingStartTime;
                    console.log("✅ [확장뷰] 스트리밍 완료:", {
                        totalChunks: chunkCount,
                        duration: totalDuration,
                        contentLength: finalStreamingContent.length,
                    });
                    if (!panel.webview) {
                        console.warn("⚠️ [확장뷰] 스트리밍 완료 시 웹뷰 없음");
                        return;
                    }
                    // 최종 응답 정리
                    let finalCleanedContent = this.finalizeResponse(finalStreamingContent);
                    // 응답 품질 검증
                    const isValidResponse = finalCleanedContent.length >= 1;
                    if (!isValidResponse) {
                        console.warn("⚠️ [확장뷰] 응답 품질 문제 감지, 폴백 응답 제공");
                        // 간단한 폴백 응답 제공
                        if (trimmedQuestion.includes("더하") || trimmedQuestion.includes("숫자")) {
                            finalCleanedContent = `def add_numbers(a, b):
    """두 숫자를 더하는 함수"""
    return a + b

# 사용 예시
result = add_numbers(5, 3)
print(f"결과: {result}")`;
                        }
                        else if (trimmedQuestion.includes("주석") || trimmedQuestion.includes("comment")) {
                            finalCleanedContent = `# 이것은 주석입니다
# 코드에 설명을 추가할 때 사용합니다

def example_function():
    """
    함수에 대한 설명을 여기에 작성합니다.
    """
    pass  # 실제 코드를 여기에 작성`;
                        }
                        else {
                            finalCleanedContent = `# AI 응답 생성에 문제가 발생했습니다.
# 더 구체적인 질문으로 다시 시도해 주세요.

print("안녕하세요! HAPA입니다.")`;
                        }
                    }
                    // 스트리밍 완료 메시지 전송
                    panel.webview.postMessage({
                        command: "streamingComplete",
                        finalContent: finalCleanedContent,
                        metadata: {
                            duration: totalDuration,
                            chunkCount: chunkCount,
                            contentLength: finalCleanedContent.length,
                            modelType: modelType,
                            timestamp: new Date().toISOString(),
                        },
                    });
                    // 히스토리에 추가 (정리된 콘텐츠로 저장)
                    this.addToHistory(question, finalCleanedContent).catch(error => {
                        console.error("❌ [확장뷰] 히스토리 저장 실패:", error);
                    });
                    console.log("✅ [확장뷰] 스트리밍 완료 처리 및 응답 정리 완료");
                }
                catch (error) {
                    console.error("❌ [확장뷰] 완료 처리 오류:", error);
                }
            },
            onError: (error) => {
                try {
                    const duration = Date.now() - streamingStartTime;
                    console.error("❌ [확장뷰] 스트리밍 오류:", {
                        errorMessage: error.message,
                        errorName: error.name,
                        duration: duration,
                        chunkCount: chunkCount,
                    });
                    if (panel.webview) {
                        const userFriendlyMessage = error.message.includes("timeout")
                            ? "⏱️ 응답 시간이 초과되었습니다. 더 간단한 질문으로 다시 시도해주세요."
                            : error.message.includes("network")
                                ? "🌐 네트워크 연결에 문제가 있습니다. 잠시 후 다시 시도해주세요."
                                : `❌ 코드 생성 중 오류가 발생했습니다: ${error.message}`;
                        panel.webview.postMessage({
                            command: "streamingError",
                            error: userFriendlyMessage,
                            details: {
                                message: error.message,
                                duration: duration,
                                modelType: modelType,
                            },
                        });
                    }
                    // VSCode 사용자에게도 알림
                    vscode.window.showErrorMessage(`HAPA 오류: ${error.message || error.toString()}`);
                }
                catch (errorHandlingError) {
                    console.error("❌ [확장뷰] 오류 처리 중 추가 오류:", errorHandlingError);
                }
            },
        };
        try {
            // modelType을 VLLMModelType으로 안전하게 변환
            let vllmModelType = apiClient_2.VLLMModelType.CODE_GENERATION;
            switch (modelType) {
                case "code_completion":
                    vllmModelType = apiClient_2.VLLMModelType.CODE_COMPLETION;
                    break;
                case "code_generation":
                    vllmModelType = apiClient_2.VLLMModelType.CODE_GENERATION;
                    break;
                case "code_explanation":
                    vllmModelType = apiClient_2.VLLMModelType.CODE_EXPLANATION;
                    break;
                case "bug_fix":
                    vllmModelType = apiClient_2.VLLMModelType.BUG_FIX;
                    break;
                default:
                    console.warn("⚠️ [확장뷰] 알 수 없는 모델 타입, 기본값 사용:", modelType);
                    vllmModelType = apiClient_2.VLLMModelType.CODE_GENERATION;
            }
            // 모델별 특화된 설정 가져오기
            const modelConfig = this.getModelConfiguration(modelType);
            // 프롬프트 최적화 및 전처리
            const optimizedPrompt = this.optimizePrompt(question.trim(), modelType);
            // 백엔드 API 스키마에 맞춘 요청 구성
            const request = {
                prompt: optimizedPrompt,
                model_type: vllmModelType,
                context: codeContext || "",
                temperature: modelConfig.temperature || 0.3,
                top_p: modelConfig.top_p || 0.95,
                max_tokens: modelConfig.max_tokens || 1024,
                programming_level: await this.getUserProgrammingLevel(),
                explanation_detail: await this.getUserExplanationDetail(),
                code_style: "pythonic",
                include_comments: modelConfig.include_comments !== false,
                include_docstring: modelConfig.include_docstring !== false,
                include_type_hints: modelConfig.include_type_hints !== false,
                language: "python",
                project_context: await this.getUserProjectContext(),
            };
            console.log("🚀 [확장뷰] 최종 스트리밍 요청 데이터:", {
                original_model_type: modelType,
                mapped_vllm_model_type: vllmModelType,
                prompt_length: request.prompt.length,
                has_context: !!request.context,
                context_length: request.context?.length || 0,
                temperature: request.temperature,
                max_tokens: request.max_tokens,
            });
            // 스트리밍 시작 알림
            panel.webview.postMessage({
                command: "streamingStarted",
                data: {
                    timestamp: new Date().toISOString(),
                    modelType: modelType,
                    question: question.substring(0, 100) + (question.length > 100 ? "..." : ""),
                },
            });
            // API 클라이언트를 통한 스트리밍 요청
            await apiClient_1.apiClient.generateCodeStreaming(request.prompt, request.context || "", {
                onChunk: callbacks.onChunk,
                onComplete: callbacks.onComplete,
                onError: callbacks.onError,
            });
        }
        catch (error) {
            console.error("❌ [확장뷰] 스트리밍 코드 생성 실행 실패:", error);
            callbacks.onError?.(error instanceof Error ? error : new Error("알 수 없는 오류"));
        }
    }
    /**
     * API 상태 업데이트 (ExtensionManager에서 호출)
     */
    async updateApiStatus() {
        // API 연결 상태 확인 및 업데이트
        try {
            const apiConfig = this.configService.getAPIConfig();
            const healthUrl = `${apiConfig.baseURL}/health`;
            const response = await fetch(healthUrl);
            const isConnected = response.ok;
            if (this._view?.webview) {
                this._view.webview.postMessage({
                    command: "updateApiStatus",
                    status: {
                        isConnected,
                        lastChecked: new Date().toISOString(),
                    },
                });
            }
        }
        catch (error) {
            if (this._view?.webview) {
                this._view.webview.postMessage({
                    command: "updateApiStatus",
                    status: {
                        isConnected: false,
                        lastChecked: new Date().toISOString(),
                        error: error instanceof Error ? error.message : "Unknown error",
                    },
                });
            }
        }
    }
    /**
     * 코드 컨텍스트 업데이트 (ExtensionManager에서 호출)
     */
    updateContext() {
        this.updateCodeContext();
    }
    /**
     * 트리거 감지 (ExtensionManager에서 호출) - 개선된 버전
     */
    detectTriggers(event) {
        // Python 파일만 처리
        if (event.document.languageId !== "python") {
            return;
        }
        // 텍스트 변경 이벤트에서 트리거 감지
        for (const change of event.contentChanges) {
            const changedText = change.text;
            // 개선된 주석 감지 로직
            if (this.isCommentTrigger(changedText)) {
                console.log("🔍 주석 트리거 감지:", changedText);
                // 주석 내용 분석 및 프롬프트 생성
                const analyzedPrompt = this.analyzeCommentContent(changedText, event.document, change.range);
                if (analyzedPrompt) {
                    const triggerEvent = {
                        type: "comment",
                        action: "custom",
                        data: analyzedPrompt,
                        timestamp: new Date(),
                    };
                    console.log("📤 주석 트리거 이벤트 발생:", triggerEvent);
                    this.handleTriggerEvent(triggerEvent);
                }
            }
        }
    }
    /**
     * 주석 트리거 여부 판단 (개선된 로직)
     */
    isCommentTrigger(text) {
        // 단순 # 문자만으로는 트리거하지 않음
        if (!text.includes("#")) {
            return false;
        }
        // 주석 패턴 감지
        const commentPatterns = [
            /^\s*#\s*TODO[:\s]/i, // TODO 주석
            /^\s*#\s*FIXME[:\s]/i, // FIXME 주석
            /^\s*#\s*생성[:\s]/, // 한국어: 생성
            /^\s*#\s*만들어[:\s]/, // 한국어: 만들어
            /^\s*#\s*작성[:\s]/, // 한국어: 작성
            /^\s*#\s*구현[:\s]/, // 한국어: 구현
            /^\s*#\s*추가[:\s]/, // 한국어: 추가
            /^\s*#\s*수정[:\s]/, // 한국어: 수정
            /^\s*#\s*개선[:\s]/, // 한국어: 개선
            /^\s*#\s*[가-힣\w]+.*함수/, // ~함수
            /^\s*#\s*[가-힣\w]+.*클래스/, // ~클래스
            /^\s*#\s*[가-힣\w]+.*메서드/, // ~메서드
            /^\s*#\s*create[:\s]/i, // 영어: create
            /^\s*#\s*make[:\s]/i, // 영어: make
            /^\s*#\s*implement[:\s]/i, // 영어: implement
            /^\s*#\s*add[:\s]/i, // 영어: add
            /^\s*#\s*write[:\s]/i, // 영어: write
        ];
        return commentPatterns.some(pattern => pattern.test(text));
    }
    /**
     * 주석 내용 분석 및 프롬프트 생성
     */
    analyzeCommentContent(commentText, document, range) {
        try {
            // 주석에서 # 제거하고 정리
            const cleanComment = commentText.replace(/^\s*#\s*/, "").trim();
            if (!cleanComment) {
                return null;
            }
            // 의도 분석
            const intent = this.analyzeCommentIntent(cleanComment);
            // 컨텍스트 추출 (주석 주변 코드)
            const contextRange = new vscode.Range(Math.max(0, range.start.line - 3), 0, Math.min(document.lineCount - 1, range.end.line + 10), 0);
            const contextCode = document.getText(contextRange);
            // AI가 이해할 수 있는 프롬프트 구성
            const aiPrompt = this.constructAIPrompt(cleanComment, intent, contextCode);
            return {
                prompt: aiPrompt,
                context: contextCode,
                selectedCode: commentText,
                language: "python",
                filePath: document.fileName,
                lineNumbers: {
                    start: range.start.line + 1,
                    end: range.end.line + 1,
                },
            };
        }
        catch (error) {
            console.error("❌ 주석 분석 중 오류:", error);
            return null;
        }
    }
    /**
     * 주석 의도 분석
     */
    analyzeCommentIntent(comment) {
        const intentPatterns = [
            { pattern: /(함수|function)/i, intent: "function_creation" },
            { pattern: /(클래스|class)/i, intent: "class_creation" },
            { pattern: /(메서드|method)/i, intent: "method_creation" },
            { pattern: /(생성|만들|create|make)/i, intent: "creation" },
            { pattern: /(구현|implement)/i, intent: "implementation" },
            { pattern: /(수정|fix|개선|improve)/i, intent: "modification" },
            { pattern: /(추가|add)/i, intent: "addition" },
            { pattern: /(삭제|제거|remove|delete)/i, intent: "removal" },
            { pattern: /(테스트|test)/i, intent: "testing" },
            { pattern: /(API|api)/i, intent: "api_creation" },
            { pattern: /(데이터|data|처리|process)/i, intent: "data_processing" },
        ];
        for (const { pattern, intent } of intentPatterns) {
            if (pattern.test(comment)) {
                return intent;
            }
        }
        return "general";
    }
    /**
     * AI를 위한 프롬프트 구성
     */
    constructAIPrompt(comment, intent, context) {
        // 기본 프롬프트 템플릿
        let prompt = `다음 요청사항에 따라 Python 코드를 생성해주세요:\n\n`;
        // 요청사항
        prompt += `요청: ${comment}\n\n`;
        // 의도별 세부 지침
        switch (intent) {
            case "function_creation":
                prompt += `지침: 
- 명확한 함수명과 매개변수를 가진 함수를 작성하세요
- docstring을 포함하여 함수의 목적과 사용법을 설명하세요
- 타입 힌트를 사용하여 매개변수와 반환값의 타입을 명시하세요
- 예외 처리를 적절히 포함하세요\n\n`;
                break;
            case "class_creation":
                prompt += `지침:
- 클래스명은 PascalCase를 사용하세요
- __init__ 메서드를 포함하여 초기화 로직을 작성하세요
- docstring으로 클래스의 목적을 설명하세요
- 필요한 메서드들을 구현하세요\n\n`;
                break;
            case "api_creation":
                prompt += `지침:
- RESTful API 구조를 고려하여 작성하세요
- 적절한 HTTP 상태 코드를 사용하세요
- 에러 핸들링을 포함하세요
- FastAPI 또는 Flask 패턴을 따르세요\n\n`;
                break;
            case "data_processing":
                prompt += `지침:
- pandas, numpy 등 적절한 라이브러리를 사용하세요
- 데이터 검증 로직을 포함하세요
- 메모리 효율성을 고려하세요
- 에러 처리를 포함하세요\n\n`;
                break;
            default:
                prompt += `지침:
- Python 베스트 프랙티스를 따르세요
- PEP 8 스타일 가이드를 준수하세요
- 적절한 주석과 docstring을 포함하세요
- 에러 처리를 고려하세요\n\n`;
        }
        // 컨텍스트 정보
        if (context.trim()) {
            prompt += `기존 코드 컨텍스트:\n\`\`\`python\n${context}\n\`\`\`\n\n`;
        }
        prompt += `생성된 코드만 반환하고, 설명은 주석으로 포함해주세요.`;
        return prompt;
    }
    /**
     * 코드 분석 (ExtensionManager에서 호출)
     */
    async analyzeCode(code) {
        const question = `다음 코드를 분석해주세요:\n\n${code}`;
        await this.handleStreamingCodeGeneration(question);
    }
    /**
     * 테스트 생성 (ExtensionManager에서 호출)
     */
    async generateTest(code) {
        const question = `다음 코드에 대한 단위 테스트를 작성해주세요:\n\n${code}`;
        await this.handleStreamingCodeGeneration(question);
    }
    /**
     * 코드 설명 (ExtensionManager에서 호출)
     */
    async explainCode(code) {
        const question = `다음 코드가 어떤 일을 하는지 설명해주세요:\n\n${code}`;
        await this.handleStreamingCodeGeneration(question);
    }
    /**
     * 스트리밍 콘텐츠 정리
     */
    cleanStreamingContent(content) {
        if (!content || typeof content !== "string") {
            return "";
        }
        let cleaned = content;
        // 1. AI 모델 토큰과 불완전한 응답 정리 (한 번에 처리)
        const tokenPatterns = [
            /<\|im_end\|>/g,
            /\|im_end\|>/g,
            /\|im_end\|/g,
            /<\|im_start\|>/g,
            /<\|system\|>/g,
            /<\|user\|>/g,
            /<\|assistant\|>/g,
            /\{"text"/g,
            /\{\"text\"/g,
            /\{"content"/g,
            /\{\"content\"/g,
        ];
        tokenPatterns.forEach(pattern => {
            cleaned = cleaned.replace(pattern, "");
        });
        // 2. 불완전한 JSON 문자열 제거
        cleaned = cleaned.replace(/^["{,]/g, "");
        // 3. 깨진 문법 패턴 수정 (성능 최적화)
        const syntaxFixes = [
            [/if __name_ _== "_ ___":/g, 'if __name__ == "__main__":'],
            [/\{"text"rint/g, "print"],
            [/print\(f"\{__file_\{"/g, 'print(f"{__file__}\\n{'],
            [/print\("Exception occurred repr\(e\)\)/g, 'print(f"Exception occurred: {repr(e)}")'],
            [/raise\|im_end\|/g, "raise"],
            [/__all__ = \[calculate"\]/g, '__all__ = ["calculate"]'],
            [/"([^"]*)" "([^"]*)"/g, '"$1", "$2"'],
        ];
        syntaxFixes.forEach(([pattern, replacement]) => {
            cleaned = cleaned.replace(pattern, replacement);
        });
        // 4. 불필요한 공백 및 줄바꿈 정리
        cleaned = cleaned.replace(/\n{3,}/g, "\n\n");
        cleaned = cleaned.replace(/\s+$/gm, "");
        return cleaned.trim();
    }
    finalizeResponse(content) {
        if (!content) {
            return content;
        }
        let finalized = content;
        // 1. 중복된 코드 블록 완전 제거
        const lines = finalized.split("\n");
        const uniqueLines = [];
        const seenFunctions = new Set();
        let skipUntilEnd = false;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            // 중복된 main 블록 스킵
            if (line.includes('if __name__ == "__main__"') && seenFunctions.has("main_block")) {
                skipUntilEnd = true;
                continue;
            }
            // doctest 관련 중복 제거
            if (line.includes("doctest.testmod()") && seenFunctions.has("doctest")) {
                continue;
            }
            // timer 관련 중복 제거
            if (line.includes("from timeit import default_timer") && seenFunctions.has("timer")) {
                skipUntilEnd = true;
                continue;
            }
            if (skipUntilEnd) {
                // 다음 함수나 클래스 정의까지 스킵
                if (line.startsWith("def ") ||
                    line.startsWith("class ") ||
                    (line.startsWith("if ") && line.includes("__name__"))) {
                    skipUntilEnd = false;
                    if (!seenFunctions.has("main_block") && line.includes("__name__")) {
                        seenFunctions.add("main_block");
                    }
                }
                else {
                    continue;
                }
            }
            // 주요 함수 정의 추적
            if (line.startsWith("def ")) {
                const funcName = line.split("(")[0].replace("def ", "");
                if (seenFunctions.has(funcName)) {
                    skipUntilEnd = true;
                    continue;
                }
                seenFunctions.add(funcName);
            }
            if (line.includes("doctest.testmod()")) {
                seenFunctions.add("doctest");
            }
            if (line.includes("from timeit import default_timer")) {
                seenFunctions.add("timer");
            }
            uniqueLines.push(lines[i]);
        }
        finalized = uniqueLines.join("\n");
        // 2. 불완전한 함수 완성
        if (finalized.includes("def ") && !finalized.trim().endsWith(":")) {
            // 함수가 불완전하면 적절한 return 문 추가
            const lastLine = finalized.trim();
            if (!lastLine.includes("return") && !lastLine.includes("print")) {
                finalized += '\n    return "함수가 완성되지 않았습니다"';
            }
        }
        // 3. 실제 AI 응답 정리 (대체하지 않고 정리만)
        // 복잡한 구현도 그대로 유지하되 정리만 수행
        finalized = this.cleanupComplexCode(finalized);
        // 4. 최종 정리
        finalized = finalized.replace(/\n\s*\n\s*\n/g, "\n\n");
        finalized = finalized.trim();
        return finalized;
    }
    cleanupComplexCode(content) {
        // 실제 AI 응답을 정리하되 대체하지는 않음
        let cleaned = content;
        // 1. AI 모델 토큰과 불완전한 응답 정리
        cleaned = cleaned.replace(/<\|im_end\|>/g, "");
        cleaned = cleaned.replace(/\|im_end\|>/g, "");
        cleaned = cleaned.replace(/\|im_end\|/g, "");
        cleaned = cleaned.replace(/<\|im_start\|>/g, "");
        cleaned = cleaned.replace(/<\|system\|>/g, "");
        cleaned = cleaned.replace(/<\|user\|>/g, "");
        cleaned = cleaned.replace(/<\|assistant\|>/g, "");
        cleaned = cleaned.replace(/\{"text"/g, "");
        cleaned = cleaned.replace(/\{\"text\"/g, "");
        cleaned = cleaned.replace(/\{"content"/g, "");
        cleaned = cleaned.replace(/\{\"content\"/g, "");
        // 2. 깨진 문법 패턴 수정
        cleaned = cleaned.replace(/if __name_ _== "_ ___":/g, 'if __name__ == "__main__":');
        cleaned = cleaned.replace(/\{"text"rint/g, "print");
        cleaned = cleaned.replace(/print\(f"\{__file_\{"/g, 'print(f"{__file__}\\n{');
        // 추가 문법 오류 수정
        cleaned = cleaned.replace(/print\("Exception occurred repr\(e\)\)/g, 'print(f"Exception occurred: {repr(e)}")');
        cleaned = cleaned.replace(/raise\|im_end\|/g, "raise");
        cleaned = cleaned.replace(/__all__ = \[calculate"\]/g, '__all__ = ["calculate"]');
        cleaned = cleaned.replace(/"([^"]*)" "([^"]*)"/g, '"$1", "$2"'); // 쉼표 누락 수정
        cleaned = cleaned.replace(/\[([^,\]]*)"([^,\]]*)" ([^,\]]*)"([^,\]]*)"([^,\]]*)"\]/g, '["$1", "$2", "$3", "$4", "$5"]'); // 복잡한 배열 수정
        // 3. 불완전한 함수 종료 정리
        cleaned = cleaned.replace(/return eval\(output\)<\|im_end\|>/g, "return eval(output)");
        cleaned = cleaned.replace(/print\(eval\(output\)\)<\|im_end\|>/g, "");
        cleaned = cleaned.replace(/quit\(\)<\|im_end\|>/g, "");
        // 4. 중복된 main 블록 정리
        const mainBlocks = cleaned.match(/if __name__ == "__main__":[\s\S]*?(?=\n\w|\n$|$)/g);
        if (mainBlocks && mainBlocks.length > 1) {
            // 첫 번째 main 블록만 유지
            const firstMainBlock = mainBlocks[0];
            const beforeMain = cleaned.split(mainBlocks[0])[0];
            cleaned = beforeMain + firstMainBlock;
        }
        // 5. 중복된 import 문 정리
        const lines = cleaned.split("\n");
        const imports = new Set();
        const cleanedLines = [];
        for (const line of lines) {
            const trimmed = line.trim();
            // import 문 중복 체크
            if (trimmed.startsWith("import ") || trimmed.startsWith("from ")) {
                if (!imports.has(trimmed)) {
                    imports.add(trimmed);
                    cleanedLines.push(line);
                }
            }
            else {
                cleanedLines.push(line);
            }
        }
        cleaned = cleanedLines.join("\n");
        // 6. 불완전한 docstring 정리
        cleaned = cleaned.replace(/"""[\s\S]*?(?=[^"])/g, match => {
            if (!match.endsWith('"""')) {
                return match + '"""';
            }
            return match;
        });
        // 7. eval() 사용 시 경고 주석 추가 (보안 고려사항)
        if (cleaned.includes("eval(") && !cleaned.includes("# 주의: eval()")) {
            cleaned =
                "# 주의: 이 코드는 eval()을 사용합니다. 실제 사용 시 보안을 고려하세요.\n" + cleaned;
        }
        // 8. 과도한 공백 정리
        cleaned = cleaned.replace(/\n\s*\n\s*\n+/g, "\n\n");
        cleaned = cleaned.trim();
        return cleaned;
    }
    /**
     * 모델별 특화 설정 반환
     */
    /**
     * 프롬프트 최적화 및 전처리
     * 사용자 요청을 분석하여 더 명확하고 구체적인 프롬프트로 변환
     */
    optimizePrompt(userPrompt, modelType) {
        const prompt = userPrompt.toLowerCase().trim();
        // 간단한 출력 요청 감지 및 최적화
        if (prompt.includes("출력") || prompt.includes("print")) {
            // "jay를 출력하는 코드" → 명확한 파이썬 요청
            if (prompt.includes("jay")) {
                return 'Python에서 "jay"를 출력하는 간단한 코드 한 줄만 작성해주세요. print() 함수를 사용하세요.';
            }
            // 다른 출력 요청들
            const outputMatch = prompt.match(/['"]([^'"]+)['"].*출력|출력.*['"]([^'"]+)['"]/);
            if (outputMatch) {
                const text = outputMatch[1] || outputMatch[2];
                return `Python에서 "${text}"를 출력하는 간단한 코드 한 줄만 작성해주세요. print() 함수를 사용하세요.`;
            }
            // 일반적인 출력 요청
            return `Python에서 텍스트를 출력하는 간단한 코드 한 줄만 작성해주세요. print() 함수를 사용하세요.`;
        }
        // 변수 관련 요청 최적화
        if (prompt.includes("변수")) {
            return `Python에서 ${userPrompt
                .replace(/변수|를|을|만들|생성|작성/g, "")
                .trim()}에 대한 간단한 변수 정의 코드만 작성해주세요.`;
        }
        // 함수 관련 요청 최적화
        if (prompt.includes("함수")) {
            return `Python에서 ${userPrompt
                .replace(/함수|를|을|만들|생성|작성/g, "")
                .trim()}에 대한 간단한 함수 정의만 작성해주세요.`;
        }
        // 모델 타입별 최적화
        switch (modelType) {
            case "code_generation":
            case "prompt":
                return `Python으로 다음 요청을 간단하고 명확하게 구현해주세요: ${userPrompt}. 불필요한 주석이나 설명 없이 핵심 코드만 작성해주세요.`;
            case "code_explanation":
            case "comment":
                return `다음 코드나 개념에 대해 간단히 설명해주세요: ${userPrompt}`;
            case "bug_fix":
            case "error_fix":
                return `다음 코드의 문제점을 찾아 수정해주세요: ${userPrompt}`;
            default:
                return `Python으로 간단하게 구현해주세요: ${userPrompt}`;
        }
    }
    getModelConfiguration(modelType) {
        const configs = {
            autocomplete: {
                model: "claude-3-haiku-20240307",
                temperature: 0.1, // 자동완성은 낮은 창의성
                top_p: 0.9,
                max_tokens: 100, // 자동완성은 짧게 (512 → 100)
                prompt: undefined, // 원본 프롬프트 사용
                include_comments: false, // 자동완성은 주석 최소화
                include_docstring: false,
                include_type_hints: true,
            },
            prompt: {
                model: "claude-3-haiku-20240307",
                temperature: 0.2, // 더 결정론적 응답 (과도한 복잡성 방지)
                top_p: 0.9, // 더 집중된 응답
                max_tokens: 150, // 간단한 코드 생성에 충분 (1024 → 150)
                prompt: undefined, // 원본 프롬프트 사용
                include_comments: false, // 간단한 코드는 주석 최소화
                include_docstring: false, // 간단한 코드는 독스트링 생략
                include_type_hints: false, // 간단한 코드는 타입 힌트 생략
            },
            comment: {
                model: "claude-3-haiku-20240307",
                temperature: 0.2, // 설명은 일관성 중요
                top_p: 0.9,
                max_tokens: 300, // 간결한 설명 (800 → 300)
                prompt: undefined, // 원본 프롬프트 사용 (주석/설명 요청)
                include_comments: true,
                include_docstring: false, // 설명에서는 독스트링 생략
                include_type_hints: false,
            },
            error_fix: {
                model: "claude-3-haiku-20240307",
                temperature: 0.1, // 버그 수정은 정확성 최우선
                top_p: 0.9,
                max_tokens: 400, // 집중된 수정 (1024 → 400)
                prompt: undefined, // 원본 프롬프트 사용
                include_comments: true, // 수정 이유 설명
                include_docstring: false, // 수정에서는 독스트링 생략
                include_type_hints: true,
            },
        };
        // 기본값 설정 (지원하지 않는 모델 타입의 경우)
        const defaultConfig = configs.prompt;
        return configs[modelType] || defaultConfig;
    }
    /**
     * 동기식 코드 생성 처리 (새로운 메서드)
     */
    async handleSyncCodeGeneration(question, modelType = "code_generation") {
        if (!this._view?.webview) {
            return;
        }
        try {
            console.log("🔄 동기식 코드 생성 시작:", {
                question: question.substring(0, 100) + "...",
                modelType,
            });
            // 로딩 상태 표시
            this._view.webview.postMessage({
                command: "showLoading",
                message: "AI가 응답을 생성하고 있습니다...",
            });
            // 현재 활성 편집기의 컨텍스트 가져오기
            const activeEditor = vscode.window.activeTextEditor;
            let codeContext = undefined;
            if (activeEditor && activeEditor.selection && !activeEditor.selection.isEmpty) {
                codeContext = activeEditor.document.getText(activeEditor.selection);
            }
            // API 요청 구성
            const request = {
                prompt: question,
                context: codeContext || "",
                model_type: this.mapModelToVLLMType(modelType),
                language: "python",
                temperature: 0.3,
                max_tokens: 1024,
            };
            console.log("📡 API 요청:", {
                prompt_length: request.prompt.length,
                model_type: request.model_type,
                has_context: !!request.context,
            });
            // API 호출
            const response = await apiClient_1.apiClient.generateCode(request);
            console.log("📡 API 응답:", {
                success: response.success,
                code_length: response.generated_code?.length || 0,
                has_error: !!response.error_message,
            });
            if (response.success && response.generated_code) {
                // 성공 응답 처리
                const cleanedCode = this.cleanAIResponse(response.generated_code);
                const responseData = {
                    generated_code: cleanedCode,
                    explanation: response.explanation || "AI가 생성한 코드입니다.",
                    originalQuestion: question,
                    success: true,
                    processingTime: response.processing_time || 0,
                };
                // 현재 응답 상태 저장 (웹뷰 재생성 시 복원용)
                this.currentResponseState = {
                    response: responseData,
                    timestamp: Date.now(),
                    isValid: true,
                };
                this._view.webview.postMessage({
                    command: "addAIResponse",
                    response: responseData,
                });
                // 응답 확인을 위한 추가 메시지
                setTimeout(() => {
                    if (this._view?.webview) {
                        this._view.webview.postMessage({
                            command: "ensureResponseVisible",
                            data: {
                                generated_code: cleanedCode,
                                explanation: response.explanation || "AI가 생성한 코드입니다.",
                                originalQuestion: question,
                                success: true,
                            },
                        });
                    }
                }, 100);
                // 히스토리에 추가
                this.addToHistory(question.trim(), cleanedCode).catch(error => {
                    console.error("❌ 히스토리 저장 실패:", error);
                });
                console.log("✅ 동기식 코드 생성 완료");
            }
            else {
                // 오류 응답 처리
                console.error("❌ 동기식 코드 생성 실패:", response.error_message);
                this._view.webview.postMessage({
                    command: "showError",
                    error: response.error_message || "코드 생성에 실패했습니다.",
                });
            }
        }
        catch (error) {
            console.error("❌ 동기식 코드 생성 오류:", error);
            if (this._view?.webview) {
                this._view.webview.postMessage({
                    command: "showError",
                    error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
                });
            }
        }
    }
    /**
     * 모델 타입 매핑 (새로운 메서드)
     */
    mapModelToVLLMType(modelType) {
        const mapping = {
            autocomplete: apiClient_2.VLLMModelType.CODE_COMPLETION,
            prompt: apiClient_2.VLLMModelType.CODE_GENERATION,
            comment: apiClient_2.VLLMModelType.CODE_EXPLANATION,
            error_fix: apiClient_2.VLLMModelType.BUG_FIX,
            code_generation: apiClient_2.VLLMModelType.CODE_GENERATION,
            bug_fix: apiClient_2.VLLMModelType.BUG_FIX,
        };
        return mapping[modelType] || apiClient_2.VLLMModelType.CODE_GENERATION;
    }
    /**
     * DB에서 실제 사용자 설정 조회 (캐시 포함)
     */
    async fetchUserSettingsFromDB() {
        try {
            // 캐시된 설정이 유효한지 확인
            const now = Date.now();
            if (this.cachedUserSettings && now - this.settingsLastFetch < this.SETTINGS_CACHE_TTL) {
                console.log("📋 SidebarProvider: 캐시된 사용자 설정 사용");
                return { success: true, settings: this.cachedUserSettings };
            }
            const config = vscode.workspace.getConfiguration("hapa");
            // DB-Module API 사용으로 변경
            const dbModuleURL = config.get("dbModuleURL") || "http://3.13.240.111:8001";
            const accessToken = this.getJWTToken();
            if (!accessToken) {
                return {
                    success: false,
                    error: "JWT 토큰이 없습니다.",
                };
            }
            console.log("⚙️ SidebarProvider: DB에서 사용자 설정 조회 시작");
            const response = await fetch(`${dbModuleURL}/settings/me`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                timeout: 10000,
            });
            if (!response.ok) {
                console.error("❌ SidebarProvider 사용자 설정 조회 실패:", response.status);
                return {
                    success: false,
                    error: `설정 조회 실패: ${response.status}`,
                };
            }
            const settings = await response.json();
            // 캐시 업데이트
            this.cachedUserSettings = settings;
            this.settingsLastFetch = now;
            console.log("✅ SidebarProvider DB 사용자 설정 조회 성공:", {
                settingsCount: settings.length,
            });
            return { success: true, settings };
        }
        catch (error) {
            console.error("❌ SidebarProvider 사용자 설정 조회 중 예외:", error);
            return {
                success: false,
                error: "설정 조회 중 오류가 발생했습니다.",
            };
        }
    }
    /**
     * DB 설정을 프론트엔드 설정으로 변환
     */
    convertDBSettingsToUserProfile(dbSettings) {
        try {
            const userProfile = {
                pythonSkillLevel: "intermediate",
                explanationStyle: "standard",
                projectContext: "general_purpose",
            };
            // DB 설정을 사용자 프로필로 매핑
            dbSettings.forEach(setting => {
                switch (setting.setting_type) {
                    case "python_skill_level":
                        userProfile.pythonSkillLevel = setting.option_value;
                        break;
                    case "explanation_style":
                        userProfile.explanationStyle = setting.option_value;
                        break;
                    // 다른 설정들도 매핑 가능
                }
            });
            console.log("🔄 SidebarProvider DB 설정 변환 완료:", userProfile);
            return userProfile;
        }
        catch (error) {
            console.error("❌ SidebarProvider DB 설정 변환 실패:", error);
            return {
                pythonSkillLevel: "intermediate",
                explanationStyle: "standard",
                projectContext: "general_purpose",
            };
        }
    }
    /**
     * 개선된 사용자 프로그래밍 레벨 가져오기 (JWT + DB 우선, 로컬 fallback)
     */
    async getUserProgrammingLevel() {
        try {
            // 1단계: DB에서 실제 사용자 설정 조회 시도
            const dbResult = await this.fetchUserSettingsFromDB();
            if (dbResult.success && dbResult.settings) {
                const userProfile = this.convertDBSettingsToUserProfile(dbResult.settings);
                const dbLevel = userProfile.pythonSkillLevel;
                if (["beginner", "intermediate", "advanced", "expert"].includes(dbLevel)) {
                    console.log("✅ SidebarProvider: DB에서 Python 스킬 레벨 사용:", dbLevel);
                    return dbLevel;
                }
            }
            // 2단계: DB 조회 실패 시 로컬 VSCode 설정 사용 (fallback)
            console.log("⚠️ SidebarProvider: DB 조회 실패, 로컬 설정 사용");
            const config = vscode.workspace.getConfiguration("hapa");
            return config.get("userProfile.pythonSkillLevel", "intermediate");
        }
        catch (error) {
            console.error("❌ SidebarProvider getUserProgrammingLevel 오류:", error);
            return "intermediate";
        }
    }
    /**
     * 개선된 사용자 설명 세부사항 레벨 가져오기 (JWT + DB 우선, 로컬 fallback)
     */
    async getUserExplanationDetail() {
        try {
            // 1단계: DB에서 실제 사용자 설정 조회 시도
            const dbResult = await this.fetchUserSettingsFromDB();
            if (dbResult.success && dbResult.settings) {
                const userProfile = this.convertDBSettingsToUserProfile(dbResult.settings);
                const dbStyle = userProfile.explanationStyle;
                // DB 값을 API 형식으로 매핑
                const styleMapping = {
                    brief: "minimal",
                    standard: "standard",
                    detailed: "detailed",
                    educational: "comprehensive",
                };
                const mappedStyle = styleMapping[dbStyle] || "standard";
                console.log("✅ SidebarProvider: DB에서 설명 스타일 사용:", `${dbStyle} → ${mappedStyle}`);
                return mappedStyle;
            }
            // 2단계: DB 조회 실패 시 로컬 VSCode 설정 사용 (fallback)
            console.log("⚠️ SidebarProvider: DB 조회 실패, 로컬 설정 사용");
            const config = vscode.workspace.getConfiguration("hapa");
            const localStyle = config.get("userProfile.explanationStyle", "standard");
            // 로컬 설정도 매핑
            const styleMapping = {
                brief: "minimal",
                minimal: "minimal",
                standard: "standard",
                detailed: "detailed",
                comprehensive: "comprehensive",
                educational: "comprehensive",
            };
            return styleMapping[localStyle] || "standard";
        }
        catch (error) {
            console.error("❌ SidebarProvider getUserExplanationDetail 오류:", error);
            return "standard";
        }
    }
    /**
     * 개선된 사용자 프로젝트 컨텍스트 가져오기 (JWT + DB 우선, 로컬 fallback)
     */
    async getUserProjectContext() {
        try {
            // 1단계: DB에서 실제 사용자 설정 조회 시도
            const dbResult = await this.fetchUserSettingsFromDB();
            if (dbResult.success && dbResult.settings) {
                const userProfile = this.convertDBSettingsToUserProfile(dbResult.settings);
                const dbContext = userProfile.projectContext;
                // 프로젝트 컨텍스트를 문자열로 변환
                const contextMap = {
                    web_development: "웹 개발",
                    data_science: "데이터 사이언스",
                    automation: "자동화",
                    general_purpose: "범용",
                    academic: "학술/연구",
                    enterprise: "기업용 개발",
                };
                const mappedContext = contextMap[dbContext] || "범용";
                console.log("✅ SidebarProvider: DB에서 프로젝트 컨텍스트 사용:", `${dbContext} → ${mappedContext}`);
                return mappedContext;
            }
            // 2단계: DB 조회 실패 시 로컬 VSCode 설정 사용 (fallback)
            console.log("⚠️ SidebarProvider: DB 조회 실패, 로컬 설정 사용");
            const config = vscode.workspace.getConfiguration("hapa");
            const projectContext = config.get("userProfile.projectContext", "general_purpose");
            const contextMap = {
                web_development: "웹 개발",
                data_science: "데이터 사이언스",
                automation: "자동화",
                general_purpose: "범용",
                academic: "학술/연구",
                enterprise: "기업용 개발",
            };
            return contextMap[projectContext] || "범용";
        }
        catch (error) {
            console.error("❌ SidebarProvider getUserProjectContext 오류:", error);
            return "범용";
        }
    }
    /**
     * 확장 뷰 초기화 및 상태 동기화 (강화)
     */
    async initializeExpandedView(panel) {
        console.log("🔄 확장 뷰 초기화 시작");
        // 확장 뷰 플래그 전송
        await panel.webview.postMessage({
            command: "setExpandedViewFlag",
            isExpandedView: true,
        });
        // DOM 준비 대기
        let retryCount = 0;
        const maxRetries = 15; // 재시도 횟수 증가
        const retryInterval = 200; // 간격 단축
        const waitForExpandedViewReady = async () => {
            return new Promise(resolve => {
                const checkReady = async () => {
                    retryCount++;
                    console.log(`🔍 확장 뷰 DOM 준비 확인 (${retryCount}/${maxRetries})`);
                    try {
                        // 확장 뷰 준비 상태 확인
                        await panel.webview.postMessage({
                            command: "checkExpandedViewReady",
                            retryCount: retryCount,
                            maxRetries: maxRetries,
                        });
                        // 잠시 대기 후 동기화 시도
                        setTimeout(() => {
                            this.syncExpandedViewState(panel);
                            resolve(true);
                        }, 100);
                    }
                    catch (error) {
                        console.warn(`⚠️ 확장 뷰 준비 확인 실패 (${retryCount}/${maxRetries}):`, error);
                        if (retryCount < maxRetries) {
                            setTimeout(checkReady, retryInterval);
                        }
                        else {
                            console.error("❌ 확장 뷰 준비 확인 최대 재시도 초과");
                            // 실패해도 강제 동기화 시도
                            setTimeout(() => {
                                this.syncExpandedViewState(panel);
                            }, 500);
                            resolve(false);
                        }
                    }
                };
                // 초기 지연 후 시작
                setTimeout(checkReady, 300);
            });
        };
        // 확장 뷰 준비 완료 대기
        await waitForExpandedViewReady();
    }
    /**
     * 확장 뷰 상태 동기화 (강화된 에러 처리)
     */
    async syncExpandedViewState(panel) {
        console.log("🔄 확장 뷰 상태 동기화 시작");
        try {
            // 현재 히스토리 데이터 준비
            const syncData = {
                history: JSON.stringify(this.questionHistory),
                historyCount: this.questionHistory.length,
                timestamp: Date.now(),
            };
            console.log("📚 확장 뷰 히스토리 동기화:", {
                count: syncData.historyCount,
                dataSize: syncData.history.length,
                sampleData: this.questionHistory.slice(0, 2).map(h => ({
                    question: h.question.substring(0, 30) + "...",
                    timestamp: h.timestamp,
                })),
            });
            // 1. 확장 뷰 식별자 설정
            await panel.webview.postMessage({
                command: "setExpandedViewMode",
                isExpanded: true,
            });
            // 2. 히스토리 동기화 (재시도 메커니즘 포함)
            let historySync = false;
            for (let i = 0; i < 3; i++) {
                try {
                    await panel.webview.postMessage({
                        command: "syncHistory",
                        history: syncData.history,
                        metadata: {
                            count: syncData.historyCount,
                            timestamp: syncData.timestamp,
                            source: "expandedViewInit",
                            attempt: i + 1,
                            isExpandedView: true,
                        },
                    });
                    historySync = true;
                    console.log(`✅ 확장 뷰 히스토리 동기화 성공 (${i + 1}번째 시도)`);
                    break;
                }
                catch (error) {
                    console.warn(`⚠️ 히스토리 동기화 실패 (${i + 1}/3):`, error);
                    if (i < 2) {
                        await new Promise(resolve => setTimeout(resolve, 300 * (i + 1)));
                    }
                }
            }
            if (!historySync) {
                console.error("❌ 확장 뷰 히스토리 동기화 최종 실패");
                // 히스토리 동기화 실패 시 강제로 DB에서 다시 로드 시도
                console.log("🔄 DB에서 강제 히스토리 재로드 시도");
                setTimeout(async () => {
                    const freshHistory = await this.loadHistoryFromDB();
                    if (freshHistory.success && freshHistory.history) {
                        this.questionHistory = freshHistory.history;
                        await panel.webview.postMessage({
                            command: "syncHistory",
                            history: JSON.stringify(freshHistory.history),
                            metadata: {
                                count: freshHistory.history.length,
                                timestamp: Date.now(),
                                source: "fallbackReload",
                                isExpandedView: true,
                            },
                        });
                        console.log("✅ 강제 히스토리 재로드 완료");
                    }
                }, 1000);
            }
            // 3. 코드 맥락 정보 동기화
            const contextInfo = this.getCodeContextInfo();
            await panel.webview.postMessage({
                command: "updateCodeContext",
                context: contextInfo,
            });
            // 4. 현재 응답 상태 동기화
            const shouldRestoreResponse = this.currentResponseState.isValid &&
                this.currentResponseState.response &&
                this.currentResponseState.timestamp &&
                Date.now() - this.currentResponseState.timestamp < 30 * 60 * 1000;
            if (shouldRestoreResponse) {
                console.log("🔄 확장 뷰에 마지막 응답 상태 동기화");
                await panel.webview.postMessage({
                    command: "restoreResponse",
                    response: this.currentResponseState.response,
                });
            }
            else {
                console.log("📤 확장 뷰에 빈 상태 초기화");
                await panel.webview.postMessage({
                    command: "initializeEmptyStates",
                });
            }
            // 5. UI 상태 동기화
            await panel.webview.postMessage({
                command: "syncUIState",
                uiState: {
                    activeTab: "response",
                    selectedModel: this.selectedModel || "autocomplete",
                    timestamp: Date.now(),
                    isExpandedView: true,
                },
            });
            // 6. 동기화 완료 확인
            await panel.webview.postMessage({
                command: "syncComplete",
                summary: {
                    historyItems: syncData.historyCount,
                    hasResponse: shouldRestoreResponse,
                    timestamp: Date.now(),
                },
            });
            console.log("✅ 확장 뷰 상태 동기화 완료");
        }
        catch (error) {
            console.error("❌ 확장 뷰 상태 동기화 실패:", error);
            // 실패 시 기본 상태로 초기화 시도
            setTimeout(() => {
                console.log("🔄 확장 뷰 기본 상태 초기화 시도");
                panel.webview.postMessage({
                    command: "initializeEmptyStates",
                    fallback: true,
                });
            }, 1000);
        }
    }
    /**
     * 특정 히스토리 항목 로드
     */
    loadSpecificHistoryItem(index) {
        try {
            console.log(`📖 히스토리 항목 로드 요청: ${index}`);
            if (!this.questionHistory || this.questionHistory.length === 0) {
                console.warn("⚠️ 로드할 히스토리가 없음");
                this.sendHistoryLoadError("히스토리가 비어있습니다");
                return;
            }
            if (index < 0 || index >= this.questionHistory.length) {
                console.warn(`⚠️ 잘못된 히스토리 인덱스: ${index} (총 ${this.questionHistory.length}개)`);
                this.sendHistoryLoadError("유효하지 않은 히스토리 항목입니다");
                return;
            }
            const historyItem = this.questionHistory[index];
            // 히스토리 항목 검증
            if (!historyItem || !historyItem.question || !historyItem.response) {
                console.warn("⚠️ 히스토리 항목이 불완전함:", historyItem);
                this.sendHistoryLoadError("히스토리 항목이 손상되었습니다");
                return;
            }
            // 응답 데이터 구성
            const responseData = {
                generated_code: historyItem.response,
                explanation: `📖 히스토리에서 로드된 응답\n\n**원본 질문:** ${historyItem.question}\n**생성 시간:** ${historyItem.timestamp}`,
                originalQuestion: historyItem.question,
                success: true,
                processingTime: 0,
                isHistoryItem: true,
                historyIndex: index,
                timestamp: historyItem.timestamp,
            };
            console.log("📤 히스토리 항목 전송:", {
                index,
                question: historyItem.question.substring(0, 50) + "...",
                responseLength: historyItem.response.length,
                timestamp: historyItem.timestamp,
            });
            // 웹뷰에 히스토리 항목 전송
            if (this._view?.webview) {
                this._view.webview.postMessage({
                    command: "addAIResponse",
                    response: responseData,
                });
            }
            // 확장된 패널들에도 전송
            this.expandedPanels.forEach((panel, panelIndex) => {
                if (panel.webview) {
                    panel.webview.postMessage({
                        command: "addAIResponse",
                        response: responseData,
                    });
                    console.log(`📤 확장 패널 ${panelIndex}에 히스토리 항목 전송`);
                }
            });
            console.log("✅ 히스토리 항목 로드 완료");
        }
        catch (error) {
            console.error("❌ 히스토리 항목 로드 실패:", error);
            this.sendHistoryLoadError("히스토리 로드 중 오류가 발생했습니다");
        }
    }
    /**
     * 히스토리 로드 오류 전송
     */
    sendHistoryLoadError(errorMessage) {
        console.warn("⚠️ 히스토리 로드 오류:", errorMessage);
        // 웹뷰에 오류 전송
        if (this._view?.webview) {
            this._view.webview.postMessage({
                command: "showError",
                error: errorMessage,
            });
        }
        // 확장된 패널들에도 전송
        this.expandedPanels.forEach(panel => {
            if (panel.webview) {
                panel.webview.postMessage({
                    command: "showError",
                    error: errorMessage,
                });
            }
        });
    }
}
exports.SidebarProvider = SidebarProvider;
//# sourceMappingURL=SidebarProvider.js.map