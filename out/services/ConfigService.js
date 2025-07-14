"use strict";
/**
 * HAPA VSCode Extension - 설정 관리 서비스
 * @fileoverview VSCode 확장의 모든 설정을 중앙에서 관리
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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configService = exports.ConfigService = void 0;
const vscode = __importStar(require("vscode"));
/**
 * 설정 관리 서비스
 */
class ConfigService {
    constructor() {
        this.listeners = [];
        this.disposables = [];
        // 설정 변경 감지
        this.disposables.push(vscode.workspace.onDidChangeConfiguration((event) => {
            if (event.affectsConfiguration("hapa")) {
                this.notifyConfigChange();
            }
        }));
    }
    /**
     * 싱글톤 인스턴스 반환
     */
    static getInstance() {
        if (!ConfigService.instance) {
            ConfigService.instance = new ConfigService();
        }
        return ConfigService.instance;
    }
    /**
     * Extension Context 설정
     */
    setContext(context) {
        this.context = context;
    }
    /**
     * Extension Context 가져오기
     */
    getContext() {
        return this.context;
    }
    /**
     * 설정 변경 리스너 등록
     */
    onConfigChange(listener) {
        this.listeners.push(listener);
        return new vscode.Disposable(() => {
            const index = this.listeners.indexOf(listener);
            if (index !== -1) {
                this.listeners.splice(index, 1);
            }
        });
    }
    /**
     * 전체 확장 설정 가져오기
     */
    getExtensionConfig() {
        const config = vscode.workspace.getConfiguration("hapa");
        return {
            enableCodeAnalysis: config.get("enableCodeAnalysis", true),
            theme: config.get("theme", "system"),
            apiBaseURL: config.get("apiBaseURL", "http://3.13.240.111:8000/api/v1"),
            apiKey: config.get("apiKey", "hapa_demo_20241228_secure_key_for_testing"),
            apiTimeout: config.get("apiTimeout", 30000),
            autoComplete: config.get("autoComplete", true),
            maxSuggestions: config.get("maxSuggestions", 5),
            enableLogging: config.get("enableLogging", false),
            userProfile: this.getUserProfile(),
            commentTrigger: {
                enabled: config.get("commentTrigger.enabled", true),
                resultDisplayMode: config.get("commentTrigger.resultDisplayMode", "sidebar"),
                autoInsertDelay: config.get("commentTrigger.autoInsertDelay", 0),
                showNotification: config.get("commentTrigger.showNotification", true),
            },
        };
    }
    /**
     * API 설정 가져오기
     */
    getAPIConfig() {
        const config = vscode.workspace.getConfiguration("hapa");
        return {
            baseURL: config.get("apiBaseURL", "http://3.13.240.111:8000/api/v1"),
            timeout: config.get("apiTimeout", 30000),
            apiKey: config.get("apiKey", "hapa_demo_20241228_secure_key_for_testing"),
            retryAttempts: config.get("retryAttempts", 3),
            retryDelay: config.get("retryDelay", 1000),
        };
    }
    /**
     * 사용자 프로필 가져오기
     */
    getUserProfile() {
        const config = vscode.workspace.getConfiguration("hapa.userProfile");
        return {
            pythonSkillLevel: config.get("pythonSkillLevel", "intermediate"),
            codeOutputStructure: config.get("codeOutputStructure", "standard"),
            explanationStyle: config.get("explanationStyle", "standard"),
            projectContext: config.get("projectContext", "general_purpose"),
            errorHandlingPreference: config.get("errorHandlingPreference", "basic"),
            preferredLanguageFeatures: config.get("preferredLanguageFeatures", [
                "type_hints",
                "f_strings",
            ]),
            isOnboardingCompleted: config.get("isOnboardingCompleted", false),
        };
    }
    /**
     * 특정 설정 값 가져오기
     */
    get(key, defaultValue) {
        const config = vscode.workspace.getConfiguration("hapa");
        return config.get(key, defaultValue);
    }
    /**
     * 특정 설정 값 업데이트
     */
    async update(key, value, isGlobal = true) {
        const config = vscode.workspace.getConfiguration("hapa");
        const oldValue = config.get(key);
        await config.update(key, value, isGlobal);
        // 변경 이벤트 발생
        this.notifyConfigChangeForKey(key, oldValue, value);
    }
    /**
     * 사용자 프로필 업데이트
     */
    async updateUserProfile(profile) {
        const currentProfile = this.getUserProfile();
        const updatedProfile = { ...currentProfile, ...profile };
        const config = vscode.workspace.getConfiguration("hapa.userProfile");
        // 각 속성을 개별적으로 업데이트
        for (const [key, value] of Object.entries(profile)) {
            await config.update(key, value, true);
        }
    }
    /**
     * API 키 업데이트
     */
    async updateAPIKey(apiKey) {
        await this.update("apiKey", apiKey, true);
    }
    /**
     * 온보딩 완료 상태 업데이트
     */
    async markOnboardingCompleted() {
        await this.update("userProfile.isOnboardingCompleted", true, true);
    }
    /**
     * 설정 검증
     */
    validateConfig() {
        const config = this.getExtensionConfig();
        const errors = [];
        // API URL 검증
        try {
            new URL(config.apiBaseURL);
        }
        catch {
            errors.push("유효하지 않은 API URL입니다.");
        }
        // API 키 검증
        if (!config.apiKey || config.apiKey.length < 10) {
            errors.push("API 키가 설정되지 않았거나 너무 짧습니다.");
        }
        // 타임아웃 검증
        if (config.apiTimeout < 1000 || config.apiTimeout > 300000) {
            errors.push("API 타임아웃은 1초~5분 사이여야 합니다.");
        }
        // 최대 제안 수 검증
        if (config.maxSuggestions < 1 || config.maxSuggestions > 20) {
            errors.push("최대 제안 수는 1~20 사이여야 합니다.");
        }
        return {
            isValid: errors.length === 0,
            errors,
        };
    }
    /**
     * 기본 설정으로 리셋
     */
    async resetToDefaults() {
        const config = vscode.workspace.getConfiguration("hapa");
        const inspection = config.inspect("");
        if (inspection) {
            // 모든 사용자 설정 제거
            for (const key of Object.keys(inspection.globalValue || {})) {
                await config.update(key, undefined, true);
            }
        }
    }
    /**
     * 설정 내보내기
     */
    exportConfig() {
        const config = this.getExtensionConfig();
        return JSON.stringify(config, null, 2);
    }
    /**
     * 설정 가져오기
     */
    async importConfig(configJson) {
        try {
            const importedConfig = JSON.parse(configJson);
            // 설정 검증
            const validation = this.validateImportedConfig(importedConfig);
            if (!validation.isValid) {
                throw new Error(`설정 가져오기 실패: ${validation.errors.join(", ")}`);
            }
            // 설정 적용
            for (const [key, value] of Object.entries(importedConfig)) {
                if (key === "userProfile") {
                    await this.updateUserProfile(value);
                }
                else {
                    await this.update(key, value, true);
                }
            }
        }
        catch (error) {
            throw new Error(`설정 가져오기 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}`);
        }
    }
    /**
     * 가져온 설정 검증
     */
    validateImportedConfig(config) {
        const errors = [];
        // 필수 필드 검증
        const requiredFields = ["apiBaseURL", "apiKey", "apiTimeout"];
        for (const field of requiredFields) {
            if (!(field in config)) {
                errors.push(`필수 설정이 누락되었습니다: ${field}`);
            }
        }
        // 타입 검증
        if (typeof config.apiBaseURL !== "string") {
            errors.push("apiBaseURL은 문자열이어야 합니다.");
        }
        if (typeof config.apiTimeout !== "number") {
            errors.push("apiTimeout은 숫자여야 합니다.");
        }
        return {
            isValid: errors.length === 0,
            errors,
        };
    }
    /**
     * 설정 변경 알림
     */
    notifyConfigChange() {
        // 전체 설정 변경 이벤트
        this.listeners.forEach((listener) => {
            listener({
                key: "hapa",
                oldValue: null,
                newValue: this.getExtensionConfig(),
                timestamp: new Date(),
            });
        });
    }
    /**
     * 특정 키 설정 변경 알림
     */
    notifyConfigChangeForKey(key, oldValue, newValue) {
        this.listeners.forEach((listener) => {
            listener({
                key,
                oldValue,
                newValue,
                timestamp: new Date(),
            });
        });
    }
    /**
     * 리소스 정리
     */
    dispose() {
        this.disposables.forEach((disposable) => disposable.dispose());
        this.listeners = [];
    }
}
exports.ConfigService = ConfigService;
/**
 * 설정 서비스 인스턴스 내보내기
 */
exports.configService = ConfigService.getInstance();
//# sourceMappingURL=ConfigService.js.map