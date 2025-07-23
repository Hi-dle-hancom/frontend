"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unifiedStateManager = exports.UnifiedStateManager = void 0;
/**
 * 통합 상태 관리자 클래스
 */
class UnifiedStateManager {
    state;
    listeners = new Map();
    validators = new Map();
    stateHistory = [];
    maxHistorySize = 100;
    constructor() {
        this.state = this.createInitialState();
        this.setupInternalValidators();
    }
    /**
     * 초기 상태 생성
     */
    createInitialState() {
        return {
            streaming: {
                status: "idle",
                sessionId: null,
                startTime: null,
                chunkCount: 0,
                totalBytes: 0,
                lastChunkTime: null,
                errorMessage: null,
            },
            ui: {
                selectedModel: "autocomplete",
                activeTab: "response",
                isLoading: false,
                loadingMessage: null,
                responseContent: "",
                historyItems: [],
                showingError: false,
                errorDetails: null,
            },
            api: {
                isConnected: false,
                lastError: null,
                requestCount: 0,
                avgResponseTime: 0,
                lastRequestTime: null,
                pendingRequests: 0,
            },
            performance: {
                maxChunks: 50,
                hardLimit: 100,
                warningThreshold: 30,
                emergencyThreshold: 80,
                maxBytes: 512 * 1024,
                maxProcessingTime: 30000,
                minChunkSize: 10,
                batchSize: 5,
            },
        };
    }
    /**
     * 내부 검증자 설정
     */
    setupInternalValidators() {
        // 스트리밍 상태 전환 유효성 검증
        this.addValidator("streaming.status", (path, newValue, currentState) => {
            const currentStatus = currentState.streaming.status;
            const allowedTransitions = {
                idle: ["starting", "error"],
                starting: ["active", "error", "idle"],
                active: ["finishing", "error", "idle"],
                finishing: ["completed", "error", "idle"],
                completed: ["idle"],
                error: ["idle"],
            };
            const allowed = allowedTransitions[currentStatus];
            if (!allowed || !allowed.includes(newValue)) {
                console.error(`❌ 잘못된 스트리밍 상태 전환: ${currentStatus} → ${newValue}`);
                return false;
            }
            return true;
        });
        // UI 모델 선택 검증
        this.addValidator("ui.selectedModel", (path, newValue, currentState) => {
            const validModels = [
                "autocomplete",
                "prompt",
                "comment",
                "error_fix",
                "review",
                "optimize",
                "test",
                "docs",
            ];
            if (!validModels.includes(newValue)) {
                console.error(`❌ 유효하지 않은 모델 타입: ${newValue}`);
                return false;
            }
            return true;
        });
        // 성능 한계값 검증
        this.addValidator("performance.*", (path, newValue, currentState) => {
            if (typeof newValue !== "number" || newValue < 0) {
                console.error(`❌ 성능 설정값은 양수여야 합니다: ${path} = ${newValue}`);
                return false;
            }
            return true;
        });
    }
    /**
     * 상태 값 읽기 (깊은 경로 지원)
     * @param path 점 표기법 경로 (예: 'streaming.status', 'ui.selectedModel')
     */
    getState(path) {
        return this.getNestedValue(this.state, path);
    }
    /**
     * 전체 상태 읽기
     */
    getFullState() {
        return Object.freeze(JSON.parse(JSON.stringify(this.state)));
    }
    /**
     * 상태 값 설정 (깊은 경로 지원)
     * @param path 점 표기법 경로
     * @param value 새로운 값
     * @param metadata 추가 메타데이터
     */
    setState(path, value, metadata = {}) {
        const oldValue = this.getNestedValue(this.state, path);
        // 값이 같으면 변경하지 않음
        if (this.deepEquals(oldValue, value)) {
            return true;
        }
        // 검증 실행
        if (!this.validateStateChange(path, value)) {
            return false;
        }
        // 상태 변경 실행
        const success = this.setNestedValue(this.state, path, value);
        if (!success) {
            console.error(`❌ 상태 설정 실패: ${path}`);
            return false;
        }
        // 히스토리 기록
        this.addToHistory(path, value);
        // 리스너들에게 알림
        this.notifyListeners(path, value, oldValue);
        console.log(`🔄 상태 변경: ${path} = ${JSON.stringify(value)}`, metadata);
        return true;
    }
    /**
     * 여러 상태를 원자적으로 업데이트
     * @param updates 경로-값 쌍의 객체
     */
    setMultipleStates(updates) {
        const oldValues = {};
        const paths = Object.keys(updates);
        // 모든 변경사항 검증
        for (const path of paths) {
            oldValues[path] = this.getNestedValue(this.state, path);
            if (!this.validateStateChange(path, updates[path])) {
                console.error(`❌ 다중 상태 업데이트 검증 실패: ${path}`);
                return false;
            }
        }
        // 모든 변경사항 적용
        for (const path of paths) {
            this.setNestedValue(this.state, path, updates[path]);
            this.addToHistory(path, updates[path]);
        }
        // 모든 리스너들에게 알림
        for (const path of paths) {
            this.notifyListeners(path, updates[path], oldValues[path]);
        }
        console.log(`🔄 다중 상태 변경 완료:`, Object.keys(updates));
        return true;
    }
    /**
     * 상태 변경 리스너 등록
     * @param path 경로 (와일드카드 * 지원)
     * @param listener 리스너 함수
     */
    addListener(path, listener) {
        if (!this.listeners.has(path)) {
            this.listeners.set(path, []);
        }
        this.listeners.get(path).push(listener);
    }
    /**
     * 상태 변경 리스너 제거
     */
    removeListener(path, listener) {
        const pathListeners = this.listeners.get(path);
        if (pathListeners) {
            const index = pathListeners.indexOf(listener);
            if (index > -1) {
                pathListeners.splice(index, 1);
            }
        }
    }
    /**
     * 검증자 추가
     */
    addValidator(path, validator) {
        if (!this.validators.has(path)) {
            this.validators.set(path, []);
        }
        this.validators.get(path).push(validator);
    }
    /**
     * 상태 초기화
     */
    reset() {
        const oldState = this.getFullState();
        this.state = this.createInitialState();
        // 모든 리스너들에게 리셋 알림
        this.notifyListeners("*", this.state, oldState);
        console.log("🔄 상태 관리자 초기화 완료");
    }
    /**
     * 스트리밍 상태 관련 헬퍼 메서드들
     */
    isStreamingActive() {
        return this.getState("streaming.status") === "active";
    }
    startStreaming(sessionId) {
        return this.setMultipleStates({
            "streaming.status": "starting",
            "streaming.sessionId": sessionId,
            "streaming.startTime": Date.now(),
            "streaming.chunkCount": 0,
            "streaming.totalBytes": 0,
            "streaming.errorMessage": null,
        });
    }
    addStreamingChunk(chunkSize) {
        const currentCount = this.getState("streaming.chunkCount");
        const currentBytes = this.getState("streaming.totalBytes");
        return this.setMultipleStates({
            "streaming.chunkCount": currentCount + 1,
            "streaming.totalBytes": currentBytes + chunkSize,
            "streaming.lastChunkTime": Date.now(),
        });
    }
    completeStreaming() {
        return this.setState("streaming.status", "completed");
    }
    errorStreaming(errorMessage) {
        return this.setMultipleStates({
            "streaming.status": "error",
            "streaming.errorMessage": errorMessage,
        });
    }
    /**
     * UI 상태 관련 헬퍼 메서드들
     */
    setSelectedModel(modelType) {
        return this.setState("ui.selectedModel", modelType);
    }
    setActiveTab(tab) {
        return this.setState("ui.activeTab", tab);
    }
    setLoading(isLoading, message) {
        return this.setMultipleStates({
            "ui.isLoading": isLoading,
            "ui.loadingMessage": message || null,
        });
    }
    setResponseContent(content) {
        return this.setState("ui.responseContent", content);
    }
    addHistoryItem(item) {
        const historyItem = {
            ...item,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            timestamp: Date.now(),
        };
        const currentHistory = this.getState("ui.historyItems");
        const newHistory = [historyItem, ...currentHistory].slice(0, 50); // 최대 50개 유지
        return this.setState("ui.historyItems", newHistory);
    }
    /**
     * 성능 설정 조정 헬퍼 메서드들
     */
    adjustPerformanceLimits(complexity) {
        const configs = {
            simple: {
                maxChunks: 20,
                hardLimit: 50,
                warningThreshold: 15,
                emergencyThreshold: 40,
                maxProcessingTime: 15000,
                minChunkSize: 5,
                batchSize: 3,
            },
            medium: {
                maxChunks: 50,
                hardLimit: 100,
                warningThreshold: 30,
                emergencyThreshold: 80,
                maxProcessingTime: 30000,
                minChunkSize: 10,
                batchSize: 5,
            },
            complex: {
                maxChunks: 100,
                hardLimit: 200,
                warningThreshold: 60,
                emergencyThreshold: 150,
                maxProcessingTime: 60000,
                minChunkSize: 15,
                batchSize: 8,
            },
        };
        const config = configs[complexity];
        const updates = {};
        for (const [key, value] of Object.entries(config)) {
            updates[`performance.${key}`] = value;
        }
        return this.setMultipleStates(updates);
    }
    /**
     * 진단 정보 생성
     */
    getDiagnostics() {
        return {
            timestamp: Date.now(),
            state: this.getFullState(),
            listenerCount: Array.from(this.listeners.entries()).reduce((acc, [path, listeners]) => ({ ...acc, [path]: listeners.length }), {}),
            validatorCount: Array.from(this.validators.entries()).reduce((acc, [path, validators]) => ({ ...acc, [path]: validators.length }), {}),
            historySize: this.stateHistory.length,
            recentChanges: this.stateHistory.slice(-10),
        };
    }
    // Private helper methods
    getNestedValue(obj, path) {
        return path.split(".").reduce((current, key) => {
            return current && typeof current === "object" && key in current
                ? current[key]
                : undefined;
        }, obj);
    }
    setNestedValue(obj, path, value) {
        try {
            const keys = path.split(".");
            const lastKey = keys.pop();
            if (!lastKey) {
                return false;
            }
            const target = keys.reduce((current, key) => {
                if (!current || typeof current !== "object") {
                    return null;
                }
                if (!current[key] || typeof current[key] !== "object") {
                    current[key] = {};
                }
                return current[key];
            }, obj);
            if (target && typeof target === "object") {
                target[lastKey] = value;
                return true;
            }
            return false;
        }
        catch (error) {
            console.error(`❌ setNestedValue 오류: ${path}`, error);
            return false;
        }
    }
    deepEquals(a, b) {
        if (a === b) {
            return true;
        }
        if (a === null || b === null || a === undefined || b === undefined) {
            return a === b;
        }
        if (typeof a !== typeof b) {
            return false;
        }
        if (typeof a !== "object") {
            return false;
        }
        try {
            const keysA = Object.keys(a);
            const keysB = Object.keys(b);
            if (keysA.length !== keysB.length) {
                return false;
            }
            for (const key of keysA) {
                if (!keysB.includes(key) || !this.deepEquals(a[key], b[key])) {
                    return false;
                }
            }
            return true;
        }
        catch (error) {
            console.error("❌ deepEquals 비교 오류:", error);
            return false;
        }
    }
    validateStateChange(path, value) {
        try {
            // 정확한 경로 매칭
            const exactValidators = this.validators.get(path) || [];
            for (const validator of exactValidators) {
                if (!validator(path, value, this.state)) {
                    return false;
                }
            }
            // 와일드카드 매칭
            for (const [validatorPath, validators] of this.validators.entries()) {
                if (this.matchesWildcard(path, validatorPath)) {
                    for (const validator of validators) {
                        if (!validator(path, value, this.state)) {
                            return false;
                        }
                    }
                }
            }
            return true;
        }
        catch (error) {
            console.error(`❌ 상태 검증 오류: ${path}`, error);
            return false;
        }
    }
    matchesWildcard(path, pattern) {
        try {
            if (pattern.includes("*")) {
                const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
                return regex.test(path);
            }
            return false;
        }
        catch (error) {
            console.error(`❌ 와일드카드 매칭 오류: ${path}, ${pattern}`, error);
            return false;
        }
    }
    notifyListeners(path, newValue, oldValue) {
        try {
            // 정확한 경로 매칭
            const exactListeners = this.listeners.get(path) || [];
            for (const listener of exactListeners) {
                try {
                    listener(path, newValue, oldValue, this.state);
                }
                catch (error) {
                    console.error(`❌ 리스너 실행 오류 (${path}):`, error);
                }
            }
            // 와일드카드 매칭
            for (const [listenerPath, listeners] of this.listeners.entries()) {
                if (this.matchesWildcard(path, listenerPath)) {
                    for (const listener of listeners) {
                        try {
                            listener(path, newValue, oldValue, this.state);
                        }
                        catch (error) {
                            console.error(`❌ 와일드카드 리스너 실행 오류 (${listenerPath}):`, error);
                        }
                    }
                }
            }
        }
        catch (error) {
            console.error(`❌ notifyListeners 오류: ${path}`, error);
        }
    }
    addToHistory(path, value) {
        try {
            this.stateHistory.push({
                timestamp: Date.now(),
                path,
                value: JSON.parse(JSON.stringify(value)),
            });
            // 히스토리 크기 제한
            if (this.stateHistory.length > this.maxHistorySize) {
                this.stateHistory.splice(0, this.stateHistory.length - this.maxHistorySize);
            }
        }
        catch (error) {
            console.error(`❌ 히스토리 추가 오류: ${path}`, error);
            // 히스토리 추가 실패는 치명적이지 않으므로 계속 진행
        }
    }
}
exports.UnifiedStateManager = UnifiedStateManager;
// 싱글톤 인스턴스 생성 및 내보내기
exports.unifiedStateManager = new UnifiedStateManager();
//# sourceMappingURL=UnifiedStateManager.js.map