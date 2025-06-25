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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiClient = void 0;
const axios_1 = __importDefault(require("axios"));
const vscode = __importStar(require("vscode"));
/**
 * HAPA API 클라이언트 클래스
 */
class HAPAAPIClient {
    client;
    baseURL;
    config;
    constructor() {
        // 설정 로드
        this.config = this.loadConfig();
        this.baseURL = this.config.baseURL;
        // Axios 인스턴스 생성
        this.client = axios_1.default.create({
            baseURL: this.config.baseURL,
            timeout: this.config.timeout,
            headers: {
                "Content-Type": "application/json",
                "User-Agent": "HAPA-VSCode-Extension/0.4.0",
            },
        });
        // 요청 인터셉터
        this.client.interceptors.request.use((config) => {
            // API Key 추가
            if (this.config.apiKey) {
                config.headers["X-API-Key"] = this.config.apiKey;
            }
            return config;
        }, (error) => {
            return Promise.reject(error);
        });
        // 응답 인터셉터
        this.client.interceptors.response.use((response) => response, (error) => {
            const errorMessage = this.handleAPIError(error);
            return Promise.reject(new Error(errorMessage));
        });
    }
    /**
     * 설정 로드
     */
    loadConfig() {
        const config = vscode.workspace.getConfiguration("hapa");
        return {
            baseURL: config.get("apiBaseURL", "http://localhost:8000/api/v1"),
            timeout: config.get("apiTimeout", 30000),
            apiKey: config.get("apiKey", "hapa_demo_20241228_secure_key_for_testing"),
        };
    }
    /**
     * API 오류 처리
     */
    handleAPIError(error) {
        if (error.response) {
            const data = error.response.data;
            switch (error.response.status) {
                case 401:
                    return "API 인증에 실패했습니다. API Key를 확인해주세요.";
                case 403:
                    return "API 권한이 부족합니다.";
                case 429:
                    return "API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.";
                case 422:
                    return `요청 데이터가 올바르지 않습니다: ${data.error_message}`;
                case 500:
                    return "서버 내부 오류가 발생했습니다.";
                default:
                    return (data.error_message ||
                        `API 오류가 발생했습니다 (${error.response.status})`);
            }
        }
        else if (error.request) {
            return "API 서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.";
        }
        else {
            return `요청 처리 중 오류가 발생했습니다: ${error.message}`;
        }
    }
    /**
     * 서버 상태 확인
     */
    async checkHealth() {
        try {
            const response = await this.client.get("/health");
            return response.status === 200;
        }
        catch (error) {
            console.error("Health check failed:", error);
            return false;
        }
    }
    /**
     * 사용자 프로필 정보 가져오기
     */
    getUserProfile() {
        const config = vscode.workspace.getConfiguration("hapa");
        return {
            pythonSkillLevel: config.get("userProfile.pythonSkillLevel", "intermediate"),
            codeOutputStructure: config.get("userProfile.codeOutputStructure", "standard"),
            explanationStyle: config.get("userProfile.explanationStyle", "standard"),
            projectContext: config.get("userProfile.projectContext", "general_purpose"),
            errorHandlingPreference: config.get("userProfile.errorHandlingPreference", "basic"),
            preferredLanguageFeatures: config.get("userProfile.preferredLanguageFeatures", ["type_hints", "f_strings"]),
        };
    }
    /**
     * 코드 생성 요청
     */
    async generateCode(request) {
        try {
            // 사용자 프로필 정보 추가
            const userProfile = this.getUserProfile();
            const enhancedRequest = {
                ...request,
                userProfile: userProfile,
            };
            const response = await this.client.post("/code/generate", enhancedRequest);
            return response.data;
        }
        catch (error) {
            // 오류 상황에서도 일관된 응답 형식 반환
            let errorMessage = "알 수 없는 오류가 발생했습니다.";
            if (error instanceof Error) {
                // 네트워크 오류
                if (error.message.includes("ECONNREFUSED") ||
                    error.message.includes("Network Error")) {
                    errorMessage =
                        "🔗 API 서버에 연결할 수 없습니다.\n설정에서 API 서버 주소를 확인해주세요.\n\n현재 설정: " +
                            this.baseURL;
                }
                // 타임아웃 오류
                else if (error.message.includes("timeout")) {
                    errorMessage =
                        "⏱️ 요청 시간이 초과되었습니다.\n잠시 후 다시 시도하거나 더 간단한 질문을 해보세요.";
                }
                // 인증 오류
                else if (error.message.includes("401") ||
                    error.message.includes("Unauthorized")) {
                    errorMessage =
                        "🔐 API 인증에 실패했습니다.\n설정에서 API 키를 확인해주세요.";
                }
                // 서버 오류
                else if (error.message.includes("500") ||
                    error.message.includes("Internal Server Error")) {
                    errorMessage =
                        "🛠️ 서버에 일시적인 문제가 발생했습니다.\n잠시 후 다시 시도해주세요.";
                }
                // 요청 형식 오류
                else if (error.message.includes("400") ||
                    error.message.includes("Bad Request")) {
                    errorMessage =
                        "📝 요청 형식에 문제가 있습니다.\n질문을 다시 작성해보세요.";
                }
                // 기타 오류
                else {
                    errorMessage = `❌ 오류 발생: ${error.message}\n\n문제가 지속되면 확장 프로그램을 재시작해보세요.`;
                }
            }
            return {
                generated_code: "",
                status: "error",
                error_message: errorMessage,
            };
        }
    }
    /**
     * 코드 자동완성 요청
     */
    async completeCode(request) {
        try {
            const response = await this.client.post("/code/complete", request);
            return response.data;
        }
        catch (error) {
            return {
                completions: [],
                status: "error",
                error_message: error instanceof Error
                    ? error.message
                    : "알 수 없는 오류가 발생했습니다.",
            };
        }
    }
    /**
     * 피드백 제출
     */
    async submitFeedback(feedback) {
        try {
            const response = await this.client.post("/feedback/submit", feedback);
            return { success: true, message: "피드백이 성공적으로 제출되었습니다." };
        }
        catch (error) {
            let errorMessage = "피드백 제출에 실패했습니다.";
            if (error instanceof Error) {
                if (error.message.includes("ECONNREFUSED") ||
                    error.message.includes("Network Error")) {
                    errorMessage =
                        "🔗 서버에 연결할 수 없어 피드백을 전송하지 못했습니다.";
                }
                else if (error.message.includes("timeout")) {
                    errorMessage =
                        "⏱️ 피드백 전송 시간이 초과되었습니다. 다시 시도해주세요.";
                }
                else {
                    errorMessage = `❌ 피드백 전송 오류: ${error.message}`;
                }
            }
            return {
                success: false,
                message: errorMessage,
            };
        }
    }
    /**
     * 설정 업데이트
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        // Axios 인스턴스 설정 업데이트
        this.client.defaults.baseURL = this.config.baseURL;
        this.client.defaults.timeout = this.config.timeout;
    }
    /**
     * API Key 설정
     */
    setAPIKey(apiKey) {
        this.config.apiKey = apiKey;
        // VSCode 설정에 저장
        const config = vscode.workspace.getConfiguration("hapa");
        config.update("apiKey", apiKey, vscode.ConfigurationTarget.Global);
    }
    /**
     * 현재 설정 반환
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * 스트리밍 방식으로 코드 생성 요청
     */
    async generateCodeStreaming(userQuestion, codeContext, callbacks) {
        const config = vscode.workspace.getConfiguration("hapa");
        const apiKey = config.get("apiKey");
        const baseURL = config.get("apiBaseURL", "http://localhost:8000");
        const timeout = config.get("apiTimeout", 30000);
        if (!apiKey) {
            const error = new Error("API 키가 설정되지 않았습니다. 설정에서 API 키를 입력해주세요.");
            callbacks?.onError?.(error);
            throw error;
        }
        const url = `${baseURL}/api/v1/code-generation/stream-generate`;
        // 사용자 프로필 정보 추가
        const userProfile = this.getUserProfile();
        const requestBody = {
            user_question: userQuestion,
            code_context: codeContext,
            language: "python",
            stream: true,
            userProfile: userProfile,
        };
        try {
            callbacks?.onStart?.();
            // AbortController로 타임아웃 제어
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-API-Key": apiKey,
                    Accept: "text/event-stream",
                    "Cache-Control": "no-cache",
                },
                body: JSON.stringify(requestBody),
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            if (!response.body) {
                throw new Error("응답 본문이 없습니다.");
            }
            // SSE 스트림 처리
            await this.processSSEStream(response.body, callbacks);
        }
        catch (error) {
            console.error("스트리밍 API 요청 실패:", error);
            if (error instanceof Error) {
                if (error.name === "AbortError") {
                    const timeoutError = new Error(`API 요청이 ${timeout}ms 후 타임아웃되었습니다.`);
                    callbacks?.onError?.(timeoutError);
                    throw timeoutError;
                }
                else {
                    callbacks?.onError?.(error);
                    throw error;
                }
            }
            else {
                const unknownError = new Error("알 수 없는 오류가 발생했습니다.");
                callbacks?.onError?.(unknownError);
                throw unknownError;
            }
        }
    }
    /**
     * Server-Sent Events 스트림 처리
     */
    async processSSEStream(stream, callbacks) {
        const reader = stream.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let fullContent = "";
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    break;
                }
                // 바이트를 문자열로 디코딩
                buffer += decoder.decode(value, { stream: true });
                // SSE 이벤트들을 파싱
                const events = this.parseSSEEvents(buffer);
                for (const event of events.parsed) {
                    try {
                        const chunk = JSON.parse(event);
                        // 콜백 호출
                        callbacks?.onChunk?.(chunk);
                        // 전체 컨텐츠 누적 (에러가 아닌 경우에만)
                        if (chunk.type !== "error" && chunk.type !== "start") {
                            fullContent += chunk.content;
                        }
                        // 완료 또는 에러 시 처리
                        if (chunk.type === "done") {
                            callbacks?.onComplete?.(fullContent);
                            return;
                        }
                        else if (chunk.type === "error") {
                            callbacks?.onError?.(new Error(chunk.content));
                            return;
                        }
                    }
                    catch (parseError) {
                        console.warn("SSE 이벤트 파싱 실패:", event, parseError);
                    }
                }
                // 처리되지 않은 부분을 버퍼에 보관
                buffer = events.remaining;
            }
        }
        finally {
            reader.releaseLock();
        }
    }
    /**
     * SSE 이벤트 파싱
     */
    parseSSEEvents(data) {
        const lines = data.split("\n");
        const events = [];
        let currentEvent = "";
        let i = 0;
        while (i < lines.length) {
            const line = lines[i];
            if (line.startsWith("data: ")) {
                currentEvent = line.substring(6); // 'data: ' 제거
                i++;
                // 다음 줄이 빈 줄인지 확인 (SSE 이벤트 종료)
                if (i < lines.length && lines[i] === "") {
                    events.push(currentEvent);
                    currentEvent = "";
                    i++;
                }
                else {
                    // 아직 완성되지 않은 이벤트
                    break;
                }
            }
            else if (line === "") {
                // 빈 줄은 건너뛰기
                i++;
            }
            else {
                // 처리되지 않은 라인
                break;
            }
        }
        // 남은 데이터 계산
        const remaining = lines.slice(i).join("\n");
        return { parsed: events, remaining };
    }
    /**
     * JWT 토큰 기반으로 DB에서 사용자 설정을 가져와 VSCode 로컬 설정과 동기화
     */
    async syncUserSettingsFromDB() {
        try {
            const config = vscode.workspace.getConfiguration("hapa");
            const accessToken = config.get("auth.accessToken");
            if (!accessToken) {
                console.log("JWT 토큰이 없어 DB 동기화를 건너뜁니다.");
                return false;
            }
            const response = await this.client.get("/users/me/settings", {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (response.status === 200 && response.data) {
                await this.updateLocalSettingsFromDB(response.data);
                console.log("DB 설정 동기화 완료");
                return true;
            }
            return false;
        }
        catch (error) {
            console.error("DB 설정 동기화 실패:", error);
            return false;
        }
    }
    /**
     * DB 설정을 VSCode 로컬 설정으로 변환 및 저장
     */
    async updateLocalSettingsFromDB(dbSettings) {
        const config = vscode.workspace.getConfiguration("hapa");
        // DB 설정 옵션 ID를 VSCode 설정값으로 매핑
        const settingsMapping = this.mapDBSettingsToLocal(dbSettings);
        // 각 설정을 VSCode에 저장
        for (const [key, value] of Object.entries(settingsMapping)) {
            await config.update(key, value, vscode.ConfigurationTarget.Global);
        }
    }
    /**
     * DB 설정 옵션 ID를 VSCode 로컬 설정값으로 매핑
     */
    mapDBSettingsToLocal(dbSettings) {
        const mapping = {};
        for (const setting of dbSettings) {
            const optionId = setting.option_id;
            const settingType = setting.setting_type;
            const optionValue = setting.option_value;
            // Python 스킬 수준 (ID: 1-4)
            if (optionId >= 1 && optionId <= 4) {
                const skillMap = {
                    1: "beginner",
                    2: "intermediate",
                    3: "advanced",
                    4: "expert",
                };
                mapping["userProfile.pythonSkillLevel"] = skillMap[optionId];
            }
            // 코드 출력 구조 (ID: 5-8)
            else if (optionId >= 5 && optionId <= 8) {
                const outputMap = {
                    5: "minimal",
                    6: "standard",
                    7: "detailed",
                    8: "comprehensive",
                };
                mapping["userProfile.codeOutputStructure"] = outputMap[optionId];
            }
            // 설명 스타일 (ID: 9-12)
            else if (optionId >= 9 && optionId <= 12) {
                const explanationMap = {
                    9: "brief",
                    10: "standard",
                    11: "detailed",
                    12: "educational",
                };
                mapping["userProfile.explanationStyle"] = explanationMap[optionId];
            }
            // 프로젝트 컨텍스트 (ID: 13-16)
            else if (optionId >= 13 && optionId <= 16) {
                const contextMap = {
                    13: "web_development",
                    14: "data_science",
                    15: "automation",
                    16: "general_purpose",
                };
                mapping["userProfile.projectContext"] = contextMap[optionId];
            }
            // 주석 트리거 모드 (ID: 17-20)
            else if (optionId >= 17 && optionId <= 20) {
                const triggerMap = {
                    17: "immediate_insert",
                    18: "sidebar",
                    19: "confirm_insert",
                    20: "inline_preview",
                };
                mapping["commentTrigger.resultDisplayMode"] = triggerMap[optionId];
            }
            // 선호 언어 기능 (ID: 21-24) - 배열로 수집
            else if (optionId >= 21 && optionId <= 24) {
                if (!mapping["userProfile.preferredLanguageFeatures"]) {
                    mapping["userProfile.preferredLanguageFeatures"] = [];
                }
                const featureMap = {
                    21: "type_hints",
                    22: "dataclasses",
                    23: "async_await",
                    24: "f_strings",
                };
                if (featureMap[optionId]) {
                    mapping["userProfile.preferredLanguageFeatures"].push(featureMap[optionId]);
                }
            }
            // 에러 처리 선호도 (ID: 25-27)
            else if (optionId >= 25 && optionId <= 27) {
                const errorMap = {
                    25: "basic",
                    26: "detailed",
                    27: "robust",
                };
                mapping["userProfile.errorHandlingPreference"] = errorMap[optionId];
            }
        }
        return mapping;
    }
    /**
     * 강화된 사용자 프로필 정보 가져오기 (DB 동기화 후)
     */
    async getEnhancedUserProfile() {
        // 먼저 DB와 동기화 시도
        await this.syncUserSettingsFromDB();
        // 로컬 설정 반환 (이제 DB와 동기화된 상태)
        return this.getUserProfile();
    }
    /**
     * 개인화된 코드 생성 요청 (JWT 토큰 포함)
     */
    async generatePersonalizedCode(request) {
        try {
            const config = vscode.workspace.getConfiguration("hapa");
            const accessToken = config.get("auth.accessToken");
            // 강화된 사용자 프로필 정보 추가
            const userProfile = await this.getEnhancedUserProfile();
            const enhancedRequest = {
                ...request,
                userProfile: userProfile,
            };
            // JWT 토큰이 있으면 Authorization 헤더 추가
            const headers = {};
            if (accessToken) {
                headers["Authorization"] = `Bearer ${accessToken}`;
            }
            const response = await this.client.post("/code/generate", enhancedRequest, { headers });
            return response.data;
        }
        catch (error) {
            // 기존 에러 처리 로직과 동일
            let errorMessage = "알 수 없는 오류가 발생했습니다.";
            if (error instanceof Error) {
                if (error.message.includes("ECONNREFUSED") ||
                    error.message.includes("Network Error")) {
                    errorMessage =
                        "🔗 API 서버에 연결할 수 없습니다.\n설정에서 API 서버 주소를 확인해주세요.\n\n현재 설정: " +
                            this.baseURL;
                }
                else if (error.message.includes("timeout")) {
                    errorMessage =
                        "⏱️ 요청 시간이 초과되었습니다.\n잠시 후 다시 시도하거나 더 간단한 질문을 해보세요.";
                }
                else if (error.message.includes("401") ||
                    error.message.includes("Unauthorized")) {
                    errorMessage =
                        "🔐 API 인증에 실패했습니다.\n설정에서 API 키를 확인해주세요.";
                }
                else {
                    errorMessage = `❌ 오류 발생: ${error.message}\n\n문제가 지속되면 확장 프로그램을 재시작해보세요.`;
                }
            }
            return {
                generated_code: "",
                status: "error",
                error_message: errorMessage,
            };
        }
    }
    /**
     * 스트리밍 방식으로 개인화된 코드 생성 요청
     */
    async generatePersonalizedCodeStreaming(userQuestion, codeContext, callbacks) {
        const config = vscode.workspace.getConfiguration("hapa");
        const apiKey = config.get("apiKey");
        const accessToken = config.get("auth.accessToken");
        const baseURL = config.get("apiBaseURL", "http://localhost:8000");
        if (!apiKey) {
            const error = new Error("API 키가 설정되지 않았습니다. 설정에서 API 키를 입력해주세요.");
            callbacks?.onError?.(error);
            throw error;
        }
        const url = `${baseURL}/api/v1/code-generation/stream-generate`;
        // 강화된 사용자 프로필 정보 추가
        const userProfile = await this.getEnhancedUserProfile();
        const requestBody = {
            user_question: userQuestion,
            code_context: codeContext,
            language: "python",
            stream: true,
            userProfile: userProfile,
        };
        // JWT 토큰이 있으면 Authorization 헤더 추가
        const headers = {
            "Content-Type": "application/json",
            "X-API-Key": apiKey,
        };
        if (accessToken) {
            headers["Authorization"] = `Bearer ${accessToken}`;
        }
        try {
            callbacks?.onStart?.();
            const response = await fetch(url, {
                method: "POST",
                headers,
                body: JSON.stringify(requestBody),
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            if (!response.body) {
                throw new Error("Response body is null");
            }
            await this.processSSEStream(response.body, callbacks);
        }
        catch (error) {
            const errorObj = error instanceof Error ? error : new Error(String(error));
            callbacks?.onError?.(errorObj);
            throw errorObj;
        }
    }
}
// 싱글톤 인스턴스
exports.apiClient = new HAPAAPIClient();
//# sourceMappingURL=apiClient.js.map