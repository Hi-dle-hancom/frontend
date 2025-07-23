"use strict";
/**
 * HAPA API Client - 통합 클라이언트 (리팩토링됨)
 * - StreamingCodeGenerator 및 CodeCompletionProvider 통합
 * - 백엔드 상태 관리 및 헬스 체크
 * - 레거시 호환성 유지
 */
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiClient = exports.HAPAAPIClient = exports.VLLMModelType = void 0;
exports.initializeAPIClient = initializeAPIClient;
exports.watchConfigChanges = watchConfigChanges;
const axios_1 = __importDefault(require("axios"));
const vscode = __importStar(require("vscode"));
// 내부 모듈 import
const StreamingCodeGenerator_1 = require("./StreamingCodeGenerator");
const CodeCompletionProvider_1 = require("./CodeCompletionProvider");
const ConfigService_1 = require("../services/ConfigService");
// types/index.ts에서 타입들을 import
const types_1 = require("../types");
// 타입들을 다른 모듈에서 사용할 수 있도록 re-export
var types_2 = require("../types");
Object.defineProperty(exports, "VLLMModelType", { enumerable: true, get: function () { return types_2.VLLMModelType; } });
// 네트워크 설정 상수
const VLLM_API_TIMEOUT = 300000; // 5분
const CHUNK_TIMEOUT = 60000; // 60초 (45초 → 60초로 증가)
// 네트워크 모니터링 클래스
class NetworkMonitor {
    static instance;
    isOnline = true;
    lastFailureTime = 0;
    consecutiveFailures = 0;
    static getInstance() {
        if (!NetworkMonitor.instance) {
            NetworkMonitor.instance = new NetworkMonitor();
        }
        return NetworkMonitor.instance;
    }
    checkNetworkHealth() {
        const timeSinceFailure = Date.now() - this.lastFailureTime;
        // 5분 이내에 3회 이상 실패하면 불안정으로 판단
        if (this.consecutiveFailures >= 3 && timeSinceFailure < 300000) {
            return false;
        }
        return this.isOnline;
    }
    recordFailure() {
        this.consecutiveFailures++;
        this.lastFailureTime = Date.now();
        this.isOnline = false;
        // 2분 후 자동 복구 시도
        setTimeout(() => {
            if (this.consecutiveFailures > 0) {
                this.consecutiveFailures = Math.max(0, this.consecutiveFailures - 1);
            }
            if (this.consecutiveFailures === 0) {
                this.isOnline = true;
            }
        }, 120000);
    }
    recordSuccess() {
        this.consecutiveFailures = 0;
        this.isOnline = true;
    }
}
class HAPAAPIClient {
    apiKey;
    baseURL;
    configService;
    // 전용 서비스 컴포넌트들
    streamingGenerator;
    completionProvider;
    constructor(apiKey = "") {
        this.configService = ConfigService_1.ConfigService.getInstance();
        // ConfigService에서 동적으로 설정 로드
        const apiConfig = this.configService.getAPIConfig();
        this.apiKey = apiKey || apiConfig.apiKey;
        this.baseURL = apiConfig.baseURL;
        // 전용 클래스들 초기화 (수정된 생성자 사용)
        this.streamingGenerator = new StreamingCodeGenerator_1.StreamingCodeGenerator(this.configService);
        this.completionProvider = new CodeCompletionProvider_1.CodeCompletionProvider(this.apiKey, this.baseURL);
        // Axios 기본 설정 (JWT와 API Key 모두 지원)
        axios_1.default.defaults.timeout = apiConfig.timeout;
        axios_1.default.defaults.headers.common["Content-Type"] = "application/json";
        // JWT 토큰 우선, 없으면 API Key 사용
        const config = vscode.workspace.getConfiguration("hapa");
        const jwtToken = config.get("auth.accessToken");
        if (jwtToken) {
            axios_1.default.defaults.headers.common["Authorization"] = `Bearer ${jwtToken}`;
            console.log("🔑 API Client: JWT 토큰 인증 사용");
        }
        else if (this.apiKey) {
            axios_1.default.defaults.headers.common["X-API-Key"] = this.apiKey;
            console.log("🔑 API Client: API Key 인증 사용");
        }
    }
    /**
     * vLLM 서버 상태 확인
     */
    async checkVLLMHealth() {
        try {
            const response = await axios_1.default.get(`${this.baseURL}/code/health`);
            return response.data;
        }
        catch (error) {
            console.error("vLLM 상태 확인 실패:", error);
            return {
                status: "error",
                error: this.handleError(error).message,
            };
        }
    }
    /**
     * Enhanced AI 백엔드 상태 확인
     */
    async getBackendStatus() {
        try {
            const response = await axios_1.default.get(`${this.baseURL}/code/backend/status`);
            return response.data;
        }
        catch (error) {
            console.error("백엔드 상태 조회 실패:", error);
            return null;
        }
    }
    /**
     * 사용 가능한 모델 목록 조회
     */
    async getAvailableModels() {
        try {
            const response = await axios_1.default.get(`${this.baseURL}/code/models`);
            return response.data.available_models || [];
        }
        catch (error) {
            console.error("모델 목록 조회 실패:", error);
            return [];
        }
    }
    /**
     * 실시간 스트리밍 코드 생성 (안전성 강화 버전)
     */
    async generateCodeStream(request, onChunk, onComplete, onError) {
        // StreamingCodeGenerator에 위임 (리팩토링됨)
        return this.streamingGenerator.generateCodeStream(request, onChunk, onComplete, onError);
    }
    /**
     * 레거시 스트리밍 메서드 (사용하지 않음)
     */
    async legacyGenerateCodeStream(request, onChunk, onComplete, onError) {
        const networkMonitor = NetworkMonitor.getInstance();
        // 🌐 네트워크 상태 체크
        if (!networkMonitor.checkNetworkHealth()) {
            const error = {
                message: "네트워크 상태가 불안정합니다. 잠시 후 다시 시도해주세요.",
                code: "NETWORK_UNHEALTHY",
            };
            onError?.(error);
            return;
        }
        let reader = null;
        let abortController = null;
        let startTime = Date.now();
        let accumulated_content = "";
        let chunkSequence = 0;
        let lastChunkTime = Date.now();
        try {
            // API 키 확인 및 업데이트
            const config = vscode.workspace.getConfiguration("hapa");
            const currentApiKey = config.get("apiKey", "hapa_demo_20241228_secure_key_for_testing");
            if (currentApiKey && currentApiKey !== this.apiKey) {
                this.updateConfig(currentApiKey);
            }
            // AbortController 생성 (타임아웃 및 수동 취소용)
            abortController = new AbortController();
            // 타임아웃 설정 (5분)
            const timeoutId = setTimeout(() => {
                if (abortController) {
                    abortController.abort();
                }
            }, VLLM_API_TIMEOUT);
            // 청크 타임아웃 모니터링
            const chunkTimeoutId = setInterval(() => {
                const timeSinceLastChunk = Date.now() - lastChunkTime;
                if (timeSinceLastChunk > CHUNK_TIMEOUT) {
                    console.warn("⏱️ 청크 타임아웃 감지");
                    if (abortController) {
                        abortController.abort();
                    }
                }
            }, 5000);
            // 요청 헤더 설정
            const headers = {
                "Content-Type": "application/json",
                Accept: "text/event-stream",
            };
            if (this.apiKey) {
                headers["X-API-Key"] = this.apiKey;
            }
            // 요청 검증
            if (!request.prompt || request.prompt.trim().length === 0) {
                throw new Error("프롬프트가 비어있습니다.");
            }
            if (request.prompt.length > 4000) {
                throw new Error("프롬프트가 너무 깁니다. (최대 4000자)");
            }
            console.log("🔑 스트리밍 API 요청 시작:", {
                hasApiKey: !!this.apiKey,
                keyPrefix: this.apiKey ? this.apiKey.substring(0, 10) + "..." : "없음",
                url: `${this.baseURL}/code/generate/stream`,
                promptLength: request.prompt.length,
                modelType: request.model_type,
                networkHealth: networkMonitor.checkNetworkHealth(),
            });
            // 스트리밍 요청 시작 신호
            onChunk({
                type: "start",
                content: "스트리밍 시작",
                sequence: chunkSequence++,
                timestamp: new Date().toISOString(),
                is_complete: false,
            });
            // fetch 요청 실행
            const response = await fetch(`${this.baseURL}/code/generate/stream`, {
                method: "POST",
                headers,
                body: JSON.stringify(request),
                signal: abortController.signal,
            });
            // 네트워크 성공 기록
            networkMonitor.recordSuccess();
            // 응답 상태 확인
            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.detail || errorData.message || errorMessage;
                }
                catch {
                    // JSON 파싱 실패 시 원본 메시지 사용
                    if (errorText) {
                        errorMessage = errorText;
                    }
                }
                throw new Error(errorMessage);
            }
            // ReadableStream 확인
            if (!response.body) {
                throw new Error("스트리밍 응답 본문이 없습니다.");
            }
            reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = ""; // 불완전한 청크 처리용 버퍼
            console.log("✅ 스트리밍 시작 - 청크 읽기 시작");
            while (true) {
                // 타임아웃 체크
                if (Date.now() - startTime > VLLM_API_TIMEOUT) {
                    throw new Error("스트리밍 타임아웃 - 응답 시간이 초과되었습니다.");
                }
                // 청크 읽기
                const { done, value } = await reader.read();
                if (done) {
                    console.log("✅ 스트리밍 완료 - 모든 청크 처리됨");
                    break;
                }
                // 청크 수신 시간 업데이트
                lastChunkTime = Date.now();
                // 청크 디코딩 및 버퍼 처리
                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;
                // 라인별 처리 (SSE 형식)
                const lines = buffer.split("\n");
                buffer = lines.pop() || ""; // 마지막 불완전한 라인은 버퍼에 보관
                for (const line of lines) {
                    if (line.trim() === "") {
                        continue;
                    }
                    if (line.startsWith("data: ")) {
                        const data = line.slice(6).trim();
                        // **업데이트된 스탑 태그 감지**
                        if (data === "[DONE]" ||
                            data.includes("<|EOT|>") ||
                            data.includes("# --- Generation Complete ---") ||
                            data.includes("</c>") ||
                            data.includes("[END_OF_GENERATION]")) {
                            console.log("🏁 스트리밍 종료 신호 수신:", {
                                신호타입: data.includes("<|EOT|>")
                                    ? "EOT"
                                    : data.includes("# --- Generation Complete ---")
                                        ? "Generation Complete"
                                        : data.includes("</c>")
                                            ? "vLLM 종료"
                                            : data.includes("[END_OF_GENERATION]")
                                                ? "모델 종료"
                                                : "[DONE]",
                                원본데이터: data.substring(0, 50) + "...",
                            });
                            // 완료 청크 전송
                            onChunk({
                                type: "done",
                                content: accumulated_content,
                                sequence: chunkSequence++,
                                timestamp: new Date().toISOString(),
                                is_complete: true,
                            });
                            clearTimeout(timeoutId);
                            clearInterval(chunkTimeoutId);
                            onComplete?.();
                            return;
                        }
                        if (data) {
                            try {
                                // 안전한 JSON 파싱
                                let contentToAdd = data;
                                // JSON 형태인지 확인
                                if (typeof data === "string" && data.trim().startsWith("{")) {
                                    try {
                                        const parsedData = JSON.parse(data);
                                        // 다양한 JSON 구조 처리
                                        if (parsedData.text) {
                                            contentToAdd = parsedData.text;
                                        }
                                        else if (parsedData.content) {
                                            contentToAdd = parsedData.content;
                                        }
                                        else if (parsedData.delta && parsedData.delta.content) {
                                            contentToAdd = parsedData.delta.content;
                                        }
                                        else if (typeof parsedData === "string") {
                                            contentToAdd = parsedData;
                                        }
                                        else {
                                            // JSON 객체이지만 예상된 필드가 없는 경우
                                            console.warn("예상치 못한 JSON 구조:", parsedData);
                                            contentToAdd = JSON.stringify(parsedData);
                                        }
                                        console.log("✅ JSON 파싱 성공:", {
                                            originalLength: data.length,
                                            extractedLength: contentToAdd.length,
                                            hasText: !!parsedData.text,
                                            hasContent: !!parsedData.content,
                                            hasDelta: !!parsedData.delta,
                                        });
                                    }
                                    catch (parseError) {
                                        console.warn("⚠️ JSON 파싱 실패, 원본 사용:", {
                                            error: parseError,
                                            data: data.substring(0, 100) + "...",
                                        });
                                        // 파싱 실패 시 원본 그대로 사용
                                        contentToAdd = data;
                                    }
                                }
                                // 콘텐츠 검증
                                if (typeof contentToAdd !== "string") {
                                    console.warn("⚠️ 문자열이 아닌 콘텐츠:", typeof contentToAdd);
                                    contentToAdd = String(contentToAdd);
                                }
                                // 빈 콘텐츠 필터링
                                if (contentToAdd.trim().length === 0) {
                                    continue;
                                }
                                accumulated_content += contentToAdd;
                                // 청크 전송
                                onChunk({
                                    type: "token",
                                    content: contentToAdd,
                                    sequence: chunkSequence++,
                                    timestamp: new Date().toISOString(),
                                    is_complete: false,
                                });
                            }
                            catch (processingError) {
                                console.error("❌ 청크 처리 오류:", {
                                    error: processingError,
                                    data: data.substring(0, 100) + "...",
                                });
                                // 처리 오류가 발생해도 스트리밍을 중단하지 않고 계속 진행
                                continue;
                            }
                        }
                    }
                }
            }
            // 청크 타임아웃 정리
            clearInterval(chunkTimeoutId);
        }
        catch (error) {
            console.error("❌ 스트리밍 코드 생성 실패:", error);
            // 네트워크 실패 기록
            networkMonitor.recordFailure();
            // 상세한 오류 분석
            let apiError;
            if (error instanceof Error) {
                if (error.name === "AbortError") {
                    apiError = {
                        message: "요청이 취소되었습니다. (타임아웃 또는 사용자 취소)",
                        code: "REQUEST_ABORTED",
                    };
                }
                else if (error.message.includes("Failed to fetch")) {
                    apiError = {
                        message: "네트워크 연결에 실패했습니다. 인터넷 연결을 확인해주세요.",
                        code: "NETWORK_ERROR",
                    };
                }
                else if (error.message.includes("타임아웃")) {
                    apiError = {
                        message: "응답 시간이 초과되었습니다. 더 간단한 요청으로 다시 시도해주세요.",
                        code: "TIMEOUT_ERROR",
                    };
                }
                else {
                    apiError = this.handleError(error);
                }
            }
            else {
                apiError = {
                    message: "알 수 없는 오류가 발생했습니다.",
                    code: "UNKNOWN_ERROR",
                };
            }
            // 오류 청크 전송
            onChunk({
                type: "error",
                content: apiError.message,
                sequence: chunkSequence++,
                timestamp: new Date().toISOString(),
                is_complete: true,
            });
            onError?.(apiError);
        }
        finally {
            // 리소스 정리
            try {
                if (reader) {
                    reader.releaseLock();
                }
                if (abortController) {
                    abortController.abort();
                }
            }
            catch (cleanupError) {
                console.warn("⚠️ 리소스 정리 중 오류:", cleanupError);
            }
        }
    }
    /**
     * 동기식 코드 생성 (스트리밍 없음)
     */
    async generateCode(request) {
        try {
            // ConfigService에서 최신 설정 가져오기
            const apiConfig = this.configService.getAPIConfig();
            if (apiConfig.apiKey !== this.apiKey ||
                apiConfig.baseURL !== this.baseURL) {
                this.updateConfig(apiConfig.apiKey, apiConfig.baseURL);
            }
            // 🔍 요청 헤더 설정 (X-API-Key만 사용)
            const headers = {
                "Content-Type": "application/json",
            };
            // JWT 토큰 우선, 없으면 API Key 사용
            const config = vscode.workspace.getConfiguration("hapa");
            const jwtToken = config.get("auth.accessToken");
            if (jwtToken) {
                headers["Authorization"] = `Bearer ${jwtToken}`;
            }
            else if (this.apiKey) {
                headers["X-API-Key"] = this.apiKey;
            }
            // Backend 스키마와 완전 일치하는 요청 구조
            const apiRequest = {
                prompt: request.prompt,
                model_type: request.model_type || types_1.VLLMModelType.CODE_GENERATION, // Backend가 기대하는 model_type 사용
                context: request.context || "",
                language: request.language || "python",
                temperature: request.temperature || 0.3,
                top_p: request.top_p || 0.95,
                max_tokens: request.max_tokens || 1024,
                programming_level: request.programming_level || "intermediate",
                explanation_detail: request.explanation_detail || "standard",
                code_style: request.code_style || "pythonic",
                include_comments: request.include_comments !== false,
                include_docstring: request.include_docstring !== false,
                include_type_hints: request.include_type_hints !== false,
                project_context: request.project_context || "",
            };
            console.log("🚀 동기식 코드 생성 요청 - 수정된 스키마:", {
                url: `${this.baseURL}/code/generate`,
                headers: {
                    "Content-Type": headers["Content-Type"],
                    "X-API-Key": headers["X-API-Key"]
                        ? headers["X-API-Key"].substring(0, 20) + "..."
                        : "없음",
                },
                request_data: apiRequest,
            });
            const response = await axios_1.default.post(`${this.baseURL}/code/generate`, apiRequest, {
                headers,
                timeout: VLLM_API_TIMEOUT,
            });
            console.log("📡 API 응답 상태:", {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers,
                data_type: typeof response.data,
                response_data: response.data,
            });
            if (response.status === 200) {
                console.log("✅ 코드 생성 성공:", {
                    success: response.data.success,
                    code_length: response.data.generated_code?.length || 0,
                });
                return response.data;
            }
            else {
                console.error("❌ API 오류 응답 - 상세 정보:", {
                    status: response.status,
                    statusText: response.statusText,
                    data: response.data,
                    url: `${this.baseURL}/code/generate`,
                    sent_request: JSON.stringify(request, null, 2),
                });
                return {
                    success: false,
                    generated_code: "",
                    error_message: response.data?.detail ||
                        `HTTP ${response.status}: ${response.statusText}`,
                    model_used: "unknown",
                    processing_time: 0,
                };
            }
        }
        catch (error) {
            console.error("❌ 코드 생성 실패:", error);
            if (axios_1.default.isAxiosError(error)) {
                if (error.response) {
                    console.error("🚨 서버 응답 오류 - 상세 디버깅:", {
                        status: error.response.status,
                        statusText: error.response.statusText,
                        data: error.response.data,
                        url: error.config?.url,
                        method: error.config?.method,
                        headers: error.config?.headers,
                        sent_data: error.config?.data,
                    });
                    // 422 Validation Error 특별 처리
                    if (error.response.status === 422 && error.response.data?.details) {
                        console.error("🔍 422 Validation Error 상세 분석:", {
                            validation_errors: error.response.data.details,
                            error_count: error.response.data.details?.length || 0,
                            timestamp: error.response.data.timestamp,
                            path: error.response.data.path,
                        });
                        // 각 validation 오류별로 상세 로그
                        if (Array.isArray(error.response.data.details)) {
                            error.response.data.details.forEach((detail, index) => {
                                console.error(`❌ Validation Error #${index + 1}:`, {
                                    field: detail.loc?.join(".") || "unknown",
                                    error_type: detail.type,
                                    message: detail.msg,
                                    input_value: detail.input,
                                    context: detail.ctx,
                                });
                            });
                        }
                    }
                    return {
                        success: false,
                        generated_code: "",
                        error_message: `서버 오류 (${error.response.status}): ${error.response.data?.detail ||
                            error.response.data?.message ||
                            error.response.statusText}`,
                        model_used: "unknown",
                        processing_time: 0,
                    };
                }
                else if (error.request) {
                    console.error("네트워크 연결 오류:", error.message);
                    return {
                        success: false,
                        generated_code: "",
                        error_message: "서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.",
                        model_used: "unknown",
                        processing_time: 0,
                    };
                }
            }
            return {
                success: false,
                generated_code: "",
                error_message: this.handleError(error).message,
                model_used: "unknown",
                processing_time: 0,
            };
        }
    }
    /**
     * 백엔드 수동 전환
     */
    async switchBackend(backendType) {
        try {
            const response = await axios_1.default.post(`${this.baseURL}/code/backend/switch`, {
                backend_type: backendType,
            });
            return response.data.success || false;
        }
        catch (error) {
            console.error("백엔드 전환 실패:", error);
            return false;
        }
    }
    /**
     * vLLM 연동 테스트
     */
    async testVLLMIntegration() {
        try {
            const response = await axios_1.default.post(`${this.baseURL}/code/test`, {
                test_prompt: "Hello World 함수를 만들어주세요",
            });
            return {
                success: true,
                details: response.data,
            };
        }
        catch (error) {
            console.error("vLLM 연동 테스트 실패:", error);
            return {
                success: false,
                error: this.handleError(error).message,
            };
        }
    }
    /**
     * 레거시 API 호환성 - 기존 코드와의 호환을 위해 유지
     */
    async generateCompletion(prompt, language = "python") {
        return this.generateCode({
            prompt: prompt,
            model_type: types_1.VLLMModelType.CODE_GENERATION,
            language: language,
            programming_level: "intermediate",
            explanation_detail: "standard",
        });
    }
    /**
     * 코드 자동완성 (autocomplete 모델 사용)
     */
    async generateAutoComplete(prefix, language = "python") {
        return this.generateCode({
            prompt: prefix,
            model_type: types_1.VLLMModelType.CODE_COMPLETION,
            language: language,
            max_tokens: 64, // 자동완성은 짧게
            temperature: 0.1, // 자동완성은 낮은 창의성
        });
    }
    /**
     * 에러 처리 헬퍼
     */
    handleError(error) {
        const apiConfig = this.configService.getAPIConfig();
        console.error("🚨 API 오류 상세 정보:", {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
            config: {
                url: error.config?.url,
                method: error.config?.method,
                timeout: error.config?.timeout,
            },
        });
        // 네트워크 모니터에 실패 기록
        const networkMonitor = NetworkMonitor.getInstance();
        networkMonitor.recordFailure();
        // Axios 오류 처리
        if (axios_1.default.isAxiosError(error)) {
            const axiosError = error;
            if (axiosError.response) {
                // 서버 응답이 있는 경우
                const status = axiosError.response.status;
                const data = axiosError.response.data;
                switch (status) {
                    case 400:
                        return {
                            message: data?.message || "잘못된 요청입니다. 입력 내용을 확인해주세요.",
                            status: status,
                            code: data?.error_code || "BAD_REQUEST",
                        };
                    case 401:
                        return {
                            message: "API 키가 유효하지 않습니다. 설정을 확인해주세요.",
                            status: status,
                            code: "UNAUTHORIZED",
                        };
                    case 403:
                        return {
                            message: "접근이 거부되었습니다. 권한을 확인해주세요.",
                            status: status,
                            code: "FORBIDDEN",
                        };
                    case 404:
                        return {
                            message: "요청하신 리소스를 찾을 수 없습니다.",
                            status: status,
                            code: "NOT_FOUND",
                        };
                    case 429:
                        return {
                            message: "요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.",
                            status: status,
                            code: "RATE_LIMITED",
                        };
                    case 500:
                        return {
                            message: "서버 내부 오류입니다. 계속 문제가 발생하면 관리자에게 문의하세요.",
                            status: status,
                            code: "INTERNAL_SERVER_ERROR",
                        };
                    case 502:
                        return {
                            message: "서버가 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.",
                            status: status,
                            code: "BAD_GATEWAY",
                        };
                    case 503:
                        return {
                            message: "서버가 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.",
                            status: status,
                            code: "SERVICE_UNAVAILABLE",
                        };
                    default:
                        return {
                            message: data?.message ||
                                data?.detail ||
                                `HTTP ${status} 오류가 발생했습니다`,
                            status: status,
                            code: data?.error_code || "API_ERROR",
                        };
                }
            }
            else if (axiosError.request) {
                // 네트워크 오류 - 더 구체적인 처리
                if (axiosError.code === "ECONNREFUSED") {
                    return {
                        message: `HAPA 백엔드 서버(${apiConfig.baseURL})에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.`,
                        code: "CONNECTION_REFUSED",
                    };
                }
                else if (axiosError.code === "ENOTFOUND") {
                    return {
                        message: "서버 주소를 찾을 수 없습니다. 네트워크 연결을 확인해주세요.",
                        code: "DNS_ERROR",
                    };
                }
                else if (axiosError.code === "ETIMEDOUT") {
                    return {
                        message: "요청 시간이 초과되었습니다. 네트워크 상태를 확인하거나 잠시 후 다시 시도해주세요.",
                        code: "TIMEOUT_ERROR",
                    };
                }
                else {
                    return {
                        message: "네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인해주세요.",
                        code: "NETWORK_ERROR",
                    };
                }
            }
        }
        // 일반 오류
        return {
            message: error?.message || "알 수 없는 오류가 발생했습니다.",
            code: "UNKNOWN_ERROR",
        };
    }
    /**
     * 설정 업데이트
     */
    updateConfig(apiKey, baseURL) {
        if (apiKey !== undefined) {
            this.apiKey = apiKey;
            if (apiKey) {
                axios_1.default.defaults.headers.common["X-API-Key"] = this.apiKey;
            }
            else {
                delete axios_1.default.defaults.headers.common["X-API-Key"];
            }
        }
        if (baseURL !== undefined) {
            this.baseURL = baseURL;
        }
        // 전용 클래스들도 설정 업데이트
        const finalBaseURL = baseURL || this.baseURL || "http://3.13.240.111:8000/api/v1";
        const finalApiKey = apiKey || this.apiKey || "";
        this.streamingGenerator.updateConfig(finalApiKey, finalBaseURL);
        this.completionProvider.updateConfig(finalApiKey, finalBaseURL);
        console.log("🔧 API Client 설정 업데이트됨");
    }
    /**
     * 현재 설정 정보
     */
    getConfig() {
        return {
            baseURL: this.baseURL,
            hasApiKey: !!this.apiKey,
            timeout: axios_1.default.defaults.timeout,
        };
    }
    /**
     * 실시간 스트리밍 코드 생성 (기존 메서드의 별칭) - 리팩토링됨
     */
    async generateCodeStreaming(prompt, codeContext, callbacks) {
        // StreamingCodeGenerator에 위임
        return this.streamingGenerator.generateCodeStreaming(prompt, codeContext, callbacks);
    }
    /**
     * 코드 자동완성
     */
    async completeCode(request) {
        try {
            const completionRequest = {
                prompt: request.prefix,
                context: request.context,
                model_type: types_1.VLLMModelType.CODE_COMPLETION,
                language: request.language || "python",
            };
            const response = await this.generateCode(completionRequest);
            return {
                completions: [
                    {
                        code: response.generated_code,
                        label: "AI Completion",
                        description: response.explanation || "AI generated completion",
                        confidence: 0.8,
                    },
                ],
                status: response.success ? "success" : "error",
            };
        }
        catch (error) {
            console.error("코드 완성 실패:", error);
            return {
                completions: [],
                status: "error",
            };
        }
    }
    /**
     * 에이전트 목록 조회
     */
    async listAgents() {
        try {
            const response = await axios_1.default.get(`${this.baseURL}/custom/agents`);
            return response.data;
        }
        catch (error) {
            console.error("에이전트 목록 조회 실패:", error);
            return {
                agents: [
                    {
                        id: "default_web_developer",
                        name: "웹 개발자 AI",
                        description: "FastAPI, Django, Flask 전문",
                        specialization: "web_development",
                    },
                    {
                        id: "default_data_scientist",
                        name: "데이터 사이언티스트 AI",
                        description: "pandas, numpy, ML 전문",
                        specialization: "data_science",
                    },
                ],
                status: "success",
            };
        }
    }
    /**
     * 에이전트 역할 조회
     */
    async getAgentRoles() {
        try {
            const response = await axios_1.default.get(`${this.baseURL}/custom/agents/roles`);
            return response.data;
        }
        catch (error) {
            console.error("에이전트 역할 조회 실패:", error);
            return {
                roles: [
                    {
                        role: "웹 개발자",
                        description: "웹 애플리케이션 개발",
                        examples: ["FastAPI REST API", "Django 모델", "Flask 라우터"],
                    },
                    {
                        role: "데이터 분석가",
                        description: "데이터 분석 및 시각화",
                        examples: ["pandas 데이터 처리", "matplotlib 차트", "numpy 연산"],
                    },
                ],
                status: "success",
            };
        }
    }
    /**
     * 에이전트로 코드 생성
     */
    async generateCodeWithAgent(request) {
        try {
            const response = await axios_1.default.post(`${this.baseURL}/custom/agents/generate`, {
                agent_id: request.agent_id,
                prompt: request.user_question,
                context: request.code_context,
                language: request.language || "python",
            });
            return response.data;
        }
        catch (error) {
            console.error("에이전트 코드 생성 실패:", error);
            return {
                success: false,
                generated_code: "",
                model_used: "error",
                processing_time: 0,
                error_message: this.handleError(error).message,
            };
        }
    }
    /**
     * 에이전트 생성
     */
    async createAgent(agentData) {
        try {
            const response = await axios_1.default.post(`${this.baseURL}/custom/agents`, agentData);
            return response.data;
        }
        catch (error) {
            console.error("에이전트 생성 실패:", error);
            return {
                id: "",
                name: agentData.name,
                status: "error",
            };
        }
    }
    /**
     * 개인화된 코드 생성
     */
    async generatePersonalizedCode(request) {
        try {
            const codeRequest = {
                prompt: request.user_question,
                context: request.code_context,
                model_type: types_1.VLLMModelType.CODE_GENERATION,
                language: request.language || "python",
                programming_level: request.userProfile?.pythonSkillLevel || "intermediate",
            };
            return await this.generateCode(codeRequest);
        }
        catch (error) {
            console.error("개인화 코드 생성 실패:", error);
            return {
                success: false,
                generated_code: "",
                model_used: "error",
                processing_time: 0,
                error_message: this.handleError(error).message,
            };
        }
    }
}
exports.HAPAAPIClient = HAPAAPIClient;
// 기본 인스턴스 생성
exports.apiClient = new HAPAAPIClient();
// VSCode 설정에서 API Key 로드
function initializeAPIClient() {
    const configService = ConfigService_1.ConfigService.getInstance();
    const apiConfig = configService.getAPIConfig();
    console.log("🔧 API 클라이언트 초기화:", {
        serverUrl: apiConfig.baseURL,
        hasApiKey: !!apiConfig.apiKey,
        keyPrefix: apiConfig.apiKey
            ? apiConfig.apiKey.substring(0, 10) + "..."
            : "없음",
    });
    exports.apiClient.updateConfig(apiConfig.apiKey, apiConfig.baseURL);
    // 기본 데모 키가 없으면 설정
    if (!apiConfig.apiKey) {
        const demoKey = "hapa_demo_20241228_secure_key_for_testing";
        console.log("⚠️ API 키가 없어 데모 키를 사용합니다:", demoKey.substring(0, 10) + "...");
        exports.apiClient.updateConfig(demoKey, apiConfig.baseURL);
    }
    console.log("🚀 HAPA API Client 초기화 완료:", {
        serverUrl: apiConfig.baseURL,
        hasApiKey: !!apiConfig.apiKey,
        vllmSupport: true,
    });
}
// 설정 변경 감지
function watchConfigChanges() {
    return vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration("hapa")) {
            console.log("📝 HAPA 설정 변경 감지 - API Client 재초기화");
            initializeAPIClient();
        }
    });
}
//# sourceMappingURL=apiClient.js.map