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
exports.BaseWebviewProvider = void 0;
const vscode = __importStar(require("vscode"));
const apiClient_1 = require("../modules/apiClient");
const promptExtractor_1 = require("../modules/promptExtractor");
const inserter_1 = require("../modules/inserter");
/**
 * 모든 웹뷰 프로바이더의 공통 기능을 제공하는 추상 베이스 클래스
 */
class BaseWebviewProvider {
    _extensionUri;
    _view;
    _panel;
    constructor(_extensionUri) {
        this._extensionUri = _extensionUri;
    }
    /**
     * 웹뷰 패널을 생성하여 표시합니다.
     */
    show() {
        console.log(`🚀 [${this.constructor.name}] show() 메서드 시작`);
        try {
            const columnToShowIn = vscode.window.activeTextEditor
                ? vscode.window.activeTextEditor.viewColumn
                : undefined;
            if (this._panel) {
                // 패널이 이미 있으면 포커스만 이동
                console.log(`🔄 [${this.constructor.name}] 기존 패널에 포커스 이동`);
                this._panel.reveal(columnToShowIn);
                return;
            }
            console.log(`🔧 [${this.constructor.name}] 새 웹뷰 패널 생성 중...`);
            console.log(`📋 패널 타입: ${this.getPanelType()}`);
            console.log(`📋 패널 제목: ${this.getPanelTitle()}`);
            // 새 패널 생성
            this._panel = vscode.window.createWebviewPanel(this.getPanelType(), this.getPanelTitle(), columnToShowIn || vscode.ViewColumn.One, {
                enableScripts: true,
                localResourceRoots: [this._extensionUri],
                retainContextWhenHidden: true,
            });
            console.log(`✅ [${this.constructor.name}] 웹뷰 패널 생성 성공`);
            // 패널 HTML 설정
            console.log(`🔧 [${this.constructor.name}] HTML 콘텐츠 설정 중...`);
            this._panel.webview.html = this.getHtmlContent(this._panel.webview);
            console.log(`✅ [${this.constructor.name}] HTML 콘텐츠 설정 완료`);
            // 메시지 핸들러 설정
            console.log(`🔧 [${this.constructor.name}] 메시지 핸들러 설정 중...`);
            this.setupMessageHandlers(this._panel.webview);
            console.log(`✅ [${this.constructor.name}] 메시지 핸들러 설정 완료`);
            // 패널이 닫힐 때 정리
            this._panel.onDidDispose(() => {
                console.log(`🗑️ [${this.constructor.name}] 웹뷰 패널 종료됨`);
                this._panel = undefined;
            }, null);
            // 웹뷰 준비 완료 알림 (개선된 준비 확인)
            this.waitForWebviewReady().then(() => {
                console.log(`🎉 [${this.constructor.name}] 웹뷰 준비 완료`);
                this.onWebviewReady();
            }).catch(error => {
                console.error(`❌ [${this.constructor.name}] 웹뷰 준비 실패:`, error);
                // 실패 시 fallback으로 기본 초기화 시도
                setTimeout(() => this.onWebviewReady(), 500);
            });
            console.log(`✅ [${this.constructor.name}] show() 메서드 완료`);
        }
        catch (error) {
            console.error(`❌ [${this.constructor.name}] show() 메서드 실행 중 오류:`, error);
            vscode.window.showErrorMessage(`웹뷰 표시 중 오류가 발생했습니다: ${error}`);
        }
    }
    resolveWebviewView(webviewView, context, _token) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };
        webviewView.webview.html = this.getHtmlContent(webviewView.webview);
        this.setupMessageHandlers(webviewView.webview);
        // 웹뷰 준비 완료 후 서브클래스에 알림
        setTimeout(() => {
            this.onWebviewReady();
        }, 100);
    }
    /**
     * 메시지 핸들러를 설정합니다. 서브클래스에서 오버라이드할 수 있습니다.
     */
    setupMessageHandlers(webview) {
        webview.onDidReceiveMessage((message) => {
            console.log(`🔔 [${this.constructor.name}] 메시지 수신:`, message.command);
            switch (message.command) {
                case "sendQuestion":
                    this.handleAIQuestion(message.question, webview);
                    return;
                case "insertCode":
                    this.insertCodeToEditor(message.code);
                    return;
                case "showGuide":
                    vscode.commands.executeCommand("hapa.showGuide");
                    return;
                case "showSettings":
                    vscode.commands.executeCommand("hapa.showSettings");
                    return;
                default:
                    // 커스텀 메시지를 서브클래스에서 처리
                    this.handleCustomMessage(message);
                    break;
            }
        });
    }
    /**
     * 서브클래스에서 추가 메시지를 처리할 수 있습니다.
     */
    handleCustomMessage(message) {
        // 기본 구현 - 서브클래스에서 오버라이드
    }
    /**
     * 웹뷰가 준비되었을 때 호출됩니다. 서브클래스에서 오버라이드할 수 있습니다.
     */
    onWebviewReady() {
        // 기본 구현 - 서브클래스에서 오버라이드
    }
    /**
     * 웹뷰가 실제로 준비될 때까지 기다립니다.
     */
    async waitForWebviewReady() {
        const webview = this._panel?.webview || this._view?.webview;
        if (!webview) {
            throw new Error("Webview instance not found");
        }
        // 웹뷰 준비 확인을 위한 핑 메시지 전송
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error("Webview ready timeout"));
            }, 5000);
            const messageHandler = (message) => {
                if (message.command === "webviewReady") {
                    clearTimeout(timeout);
                    resolve();
                }
            };
            // 메시지 핸들러 등록
            const disposable = webview.onDidReceiveMessage(messageHandler);
            // 핑 메시지 전송
            try {
                webview.postMessage({ command: "ping" });
                // 핑 전송 성공 시 기본 대기 시간 후 준비 완료로 간주
                setTimeout(() => {
                    clearTimeout(timeout);
                    disposable.dispose();
                    resolve();
                }, 150);
            }
            catch (error) {
                clearTimeout(timeout);
                disposable.dispose();
                reject(error);
            }
        });
    }
    /**
     * AI 질문을 처리하는 공통 메서드 (강화된 안전성 확인 및 JSON 파싱)
     */
    async handleAIQuestion(question, webview) {
        try {
            // vscode API 안전성 확인
            if (!vscode || !vscode.workspace) {
                throw new Error("VSCode API가 초기화되지 않았습니다. 다시 시도해주세요.");
            }
            console.log("🤖 BaseWebviewProvider AI 질문 처리:", {
                question_length: question.length,
                workspace_available: !!vscode.workspace,
            });
            // 프롬프트와 컨텍스트 추출
            const extractedPrompt = promptExtractor_1.PromptExtractor.combinePromptWithContext(question);
            // 백엔드 API 호출 (개선된 개인화 설정 포함)
            const request = {
                prompt: question,
                context: extractedPrompt.context,
                model_type: apiClient_1.VLLMModelType.CODE_GENERATION,
                language: "python",
                temperature: 0.3,
                top_p: 0.95,
                max_tokens: 1024,
                // 사용자 개인화 옵션 (DB 연동으로 개선)
                programming_level: await this.getUserProgrammingLevel(),
                explanation_detail: await this.getUserExplanationDetail(),
                code_style: "pythonic",
                include_comments: true,
                include_docstring: true,
                include_type_hints: true,
                project_context: await this.getUserProjectContext(),
            };
            // 로딩 상태 표시
            webview.postMessage({
                command: "showLoading",
                message: "AI가 응답을 생성하고 있습니다...",
            });
            // 실제 API 호출
            const response = await apiClient_1.apiClient.generateCode(request);
            console.log("📡 API 응답 상세 분석:", {
                success: response.success,
                hasGeneratedCode: !!response.generated_code,
                codeLength: response.generated_code?.length || 0,
                codePreview: response.generated_code?.substring(0, 100) || "없음",
                hasExplanation: !!response.explanation,
                errorMessage: response.error_message,
            });
            // 성공 응답 처리 및 JSON 파싱
            if (response.success && response.generated_code) {
                // generated_code가 JSON 형태인지 확인하고 파싱
                let finalCode = response.generated_code;
                try {
                    // JSON 형태인지 확인 ({"text": "실제코드"} 구조)
                    if (typeof finalCode === "string" &&
                        finalCode.trim().startsWith("{")) {
                        const parsedCode = JSON.parse(finalCode);
                        if (parsedCode.text) {
                            finalCode = parsedCode.text;
                            console.log("✅ BaseWebviewProvider JSON 응답에서 text 필드 추출 성공");
                        }
                        else if (parsedCode.content) {
                            finalCode = parsedCode.content;
                            console.log("✅ BaseWebviewProvider JSON 응답에서 content 필드 추출 성공");
                        }
                    }
                }
                catch (parseError) {
                    console.log("ℹ️ BaseWebviewProvider JSON 파싱 불가, 원본 코드 사용:", parseError);
                    // JSON 파싱에 실패하면 원본 그대로 사용
                }
                // 응답 데이터 정리
                const cleanedCode = finalCode;
                console.log("🧹 응답 정리 결과:", {
                    originalLength: finalCode.length,
                    cleanedLength: cleanedCode.length,
                    cleanedPreview: cleanedCode.substring(0, 100) || "없음",
                });
                // 응답을 웹뷰에 전송
                const responseData = {
                    generated_code: cleanedCode,
                    explanation: response.explanation || "AI가 생성한 코드입니다.",
                    originalQuestion: question,
                    success: true,
                    processingTime: response.processing_time || 0,
                };
                console.log("📤 웹뷰로 응답 전송:", {
                    command: "addAIResponse",
                    codeLength: responseData.generated_code.length,
                    hasExplanation: !!responseData.explanation,
                });
                webview.postMessage({
                    command: "addAIResponse",
                    response: responseData,
                });
                // 응답 표시 확인을 위한 추가 메시지
                setTimeout(() => {
                    webview.postMessage({
                        command: "ensureResponseVisible",
                        data: responseData,
                    });
                }, 100);
            }
            else {
                // 오류 응답 처리
                console.error("❌ API 응답 실패:", {
                    success: response.success,
                    error: response.error_message,
                    hasCode: !!response.generated_code,
                });
                webview.postMessage({
                    command: "showError",
                    error: response.error_message || "응답 생성에 실패했습니다.",
                });
            }
        }
        catch (error) {
            console.error("❌ AI 질문 처리 실패:", error);
            // 에러 처리
            webview.postMessage({
                command: "showError",
                error: error instanceof Error
                    ? error.message
                    : "응답 생성 중 오류가 발생했습니다.",
            });
        }
    }
    /**
     * 코드를 에디터에 삽입하는 공통 메서드
     */
    async insertCodeToEditor(code) {
        try {
            const success = await inserter_1.CodeInserter.smartInsert(code);
            if (success && this._view?.webview) {
                this._view.webview.postMessage({
                    command: "insertSuccess",
                    message: "코드가 성공적으로 삽입되었습니다.",
                });
            }
        }
        catch (error) {
            vscode.window.showErrorMessage(`코드 삽입 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}`);
        }
    }
    /**
     * JWT 토큰 조회 (캐시된 설정에서)
     */
    getJWTToken() {
        try {
            const config = vscode.workspace.getConfiguration("hapa");
            const accessToken = config.get("auth.accessToken");
            return accessToken || null;
        }
        catch (error) {
            console.error("❌ BaseWebviewProvider JWT 토큰 조회 실패:", error);
            return null;
        }
    }
    /**
     * DB에서 사용자 설정 조회
     */
    async fetchUserSettingsFromDB() {
        try {
            const config = vscode.workspace.getConfiguration("hapa");
            const apiBaseURL = config.get("apiBaseURL") || "http://3.13.240.111:8000/api/v1";
            const accessToken = this.getJWTToken();
            if (!accessToken) {
                return {
                    success: false,
                    error: "JWT 토큰이 없습니다.",
                };
            }
            console.log("⚙️ BaseWebviewProvider: DB에서 사용자 설정 조회 시작");
            console.log("JWT 토큰:", accessToken);
            const response = await fetch(`${apiBaseURL}/users/settings`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                timeout: 10000,
            });
            if (!response.ok) {
                console.error("❌ BaseWebviewProvider 사용자 설정 조회 실패:", response.status);
                return {
                    success: false,
                    error: `설정 조회 실패: ${response.status}`,
                };
            }
            const settings = await response.json();
            console.log("✅ BaseWebviewProvider DB 사용자 설정 조회 성공:", {
                settingsCount: settings.length,
            });
            return { success: true, settings };
        }
        catch (error) {
            console.error("❌ BaseWebviewProvider 사용자 설정 조회 중 예외:", error);
            return {
                success: false,
                error: "설정 조회 중 오류가 발생했습니다.",
            };
        }
    }
    /**
     * DB 설정을 사용자 프로필로 변환
     */
    convertDBSettingsToUserProfile(dbSettings) {
        try {
            const userProfile = {
                pythonSkillLevel: "intermediate",
                explanationStyle: "standard",
                projectContext: "general_purpose",
            };
            // DB 설정을 사용자 프로필로 매핑
            dbSettings.forEach((setting) => {
                switch (setting.setting_type) {
                    case "python_skill_level":
                        userProfile.pythonSkillLevel = setting.option_value;
                        break;
                    case "explanation_style":
                        userProfile.explanationStyle = setting.option_value;
                        break;
                }
            });
            console.log("🔄 BaseWebviewProvider DB 설정 변환 완료:", userProfile);
            return userProfile;
        }
        catch (error) {
            console.error("❌ BaseWebviewProvider DB 설정 변환 실패:", error);
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
                    console.log("✅ BaseWebviewProvider: DB에서 프로그래밍 레벨 사용:", dbLevel);
                    return dbLevel;
                }
            }
            // 2단계: DB 조회 실패 시 로컬 VSCode 설정 사용 (fallback)
            console.log("⚠️ BaseWebviewProvider: DB 조회 실패, 로컬 설정 사용");
            const config = vscode.workspace.getConfiguration("hapa");
            return config.get("userProfile.pythonSkillLevel", "intermediate");
        }
        catch (error) {
            console.error("❌ BaseWebviewProvider getUserProgrammingLevel 오류:", error);
            return "intermediate";
        }
    }
    /**
     * 개선된 사용자 설명 상세도 가져오기 (JWT + DB 우선, 로컬 fallback)
     */
    async getUserExplanationDetail() {
        try {
            // 1단계: DB에서 실제 사용자 설정 조회 시도
            const dbResult = await this.fetchUserSettingsFromDB();
            if (dbResult.success && dbResult.settings) {
                const userProfile = this.convertDBSettingsToUserProfile(dbResult.settings);
                const dbDetail = userProfile.explanationStyle;
                // DB 스타일을 API 타입으로 매핑
                const styleMapping = {
                    brief: "brief",
                    standard: "standard",
                    detailed: "detailed",
                    educational: "educational",
                };
                const mappedStyle = styleMapping[dbDetail] || "standard";
                console.log("✅ BaseWebviewProvider: DB에서 설명 상세도 사용:", `${dbDetail} → ${mappedStyle}`);
                return mappedStyle;
            }
            // 2단계: DB 조회 실패 시 로컬 VSCode 설정 사용 (fallback)
            console.log("⚠️ BaseWebviewProvider: DB 조회 실패, 로컬 설정 사용");
            const config = vscode.workspace.getConfiguration("hapa");
            const localStyle = config.get("userProfile.explanationStyle", "standard");
            // 로컬 설정도 API 타입으로 매핑
            const styleMapping = {
                brief: "brief",
                standard: "standard",
                detailed: "detailed",
                educational: "educational",
            };
            return (styleMapping[localStyle] || "standard");
        }
        catch (error) {
            console.error("❌ BaseWebviewProvider getUserExplanationDetail 오류:", error);
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
                console.log("✅ BaseWebviewProvider: DB에서 프로젝트 컨텍스트 사용:", `${dbContext} → ${mappedContext}`);
                return mappedContext;
            }
            // 2단계: DB 조회 실패 시 로컬 VSCode 설정 사용 (fallback)
            console.log("⚠️ BaseWebviewProvider: DB 조회 실패, 로컬 설정 사용");
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
            console.error("❌ BaseWebviewProvider getUserProjectContext 오류:", error);
            return "범용";
        }
    }
}
exports.BaseWebviewProvider = BaseWebviewProvider;
//# sourceMappingURL=BaseWebviewProvider.js.map