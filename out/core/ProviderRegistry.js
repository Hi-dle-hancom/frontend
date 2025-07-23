"use strict";
/**
 * HAPA VSCode Extension - 프로바이더 등록 관리
 * @fileoverview 모든 프로바이더의 등록과 생명주기를 관리
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderRegistry = void 0;
const vscode = __importStar(require("vscode"));
const SidebarProvider_1 = require("../providers/SidebarProvider");
const GuideProvider_1 = require("../providers/GuideProvider");
const SettingsProvider_1 = require("../providers/SettingsProvider");
const OnboardingProvider_1 = require("../providers/OnboardingProvider");
const CompletionProvider_1 = require("../providers/CompletionProvider");
class ProviderRegistry {
    extensionUri;
    providers = new Map();
    disposables = [];
    constructor(extensionUri) {
        this.extensionUri = extensionUri;
    }
    /**
     * 모든 프로바이더 등록
     */
    async registerAllProviders(context) {
        console.log("📦 프로바이더 등록 시작...");
        try {
            // 사이드바 프로바이더
            await this.registerSidebarProvider(context);
            // 웹뷰 프로바이더들
            this.registerWebviewProviders();
            // 코드 완성 프로바이더들
            this.registerCompletionProviders();
            console.log(`✅ 총 ${this.providers.size}개 프로바이더 등록 완료`);
            console.log("📋 등록된 프로바이더:", Array.from(this.providers.keys()));
        }
        catch (error) {
            console.error("❌ 프로바이더 등록 실패:", error);
            throw error;
        }
    }
    /**
     * 사이드바 프로바이더 등록
     */
    async registerSidebarProvider(context) {
        const sidebarProvider = new SidebarProvider_1.SidebarProvider(this.extensionUri);
        sidebarProvider.setContext(context);
        const disposable = vscode.window.registerWebviewViewProvider("hapa-dashboard", sidebarProvider);
        this.registerProvider("sidebar", sidebarProvider, disposable);
        console.log("✅ 사이드바 프로바이더 등록 완료");
    }
    /**
     * 웹뷰 프로바이더들 등록
     */
    registerWebviewProviders() {
        // 가이드 프로바이더
        const guideProvider = new GuideProvider_1.GuideProvider(this.extensionUri);
        this.registerProvider("guide", guideProvider);
        // 설정 프로바이더
        const settingsProvider = new SettingsProvider_1.SettingsProvider(this.extensionUri);
        this.registerProvider("settings", settingsProvider);
        // 온보딩 프로바이더
        const onboardingProvider = new OnboardingProvider_1.OnboardingProvider(this.extensionUri);
        this.registerProvider("onboarding", onboardingProvider);
        console.log("✅ 웹뷰 프로바이더들 등록 완료");
    }
    /**
     * 코드 완성 프로바이더들 등록
     */
    registerCompletionProviders() {
        const completionProvider = new CompletionProvider_1.HAPACompletionProvider();
        const inlineCompletionProvider = new CompletionProvider_1.HAPAInlineCompletionProvider();
        const completionDisposable = vscode.languages.registerCompletionItemProvider({ scheme: "file", language: "python" }, completionProvider, ".");
        const inlineDisposable = vscode.languages.registerInlineCompletionItemProvider({ scheme: "file", language: "python" }, inlineCompletionProvider);
        this.registerProvider("completion", completionProvider, completionDisposable);
        this.registerProvider("inlineCompletion", inlineCompletionProvider, inlineDisposable);
        console.log("✅ 코드 완성 프로바이더들 등록 완료");
    }
    /**
     * 프로바이더 등록 (내부 메서드)
     */
    registerProvider(id, provider, disposable) {
        this.providers.set(id, {
            id,
            provider,
            disposable,
        });
        if (disposable) {
            this.disposables.push(disposable);
        }
    }
    /**
     * 특정 프로바이더 가져오기
     */
    getProvider(id) {
        const registered = this.providers.get(id);
        return registered?.provider;
    }
    /**
     * 모든 프로바이더 ID 목록
     */
    getProviderIds() {
        return Array.from(this.providers.keys());
    }
    /**
     * 등록된 프로바이더 수
     */
    getProviderCount() {
        return this.providers.size;
    }
    /**
     * 프로바이더 상태 정보
     */
    getProviderStatus() {
        const status = {};
        for (const [id, registered] of this.providers) {
            // 프로바이더가 제대로 등록되었는지 확인
            status[id] = !!registered.provider;
        }
        return status;
    }
    /**
     * 모든 disposable 가져오기
     */
    getDisposables() {
        return [...this.disposables];
    }
    /**
     * 정리 (deactivate 시 호출)
     */
    dispose() {
        console.log("🔄 프로바이더 정리 시작...");
        // 모든 disposable 정리
        this.disposables.forEach((disposable) => disposable.dispose());
        this.disposables = [];
        // 프로바이더들 정리
        this.providers.forEach((registered) => {
            if (registered.provider.dispose) {
                registered.provider.dispose();
            }
        });
        this.providers.clear();
        console.log("✅ 프로바이더 정리 완료");
    }
}
exports.ProviderRegistry = ProviderRegistry;
//# sourceMappingURL=ProviderRegistry.js.map