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
exports.BaseWebviewProvider = void 0;
const vscode = __importStar(require("vscode"));
const apiClient_1 = require("../modules/apiClient");
const promptExtractor_1 = require("../modules/promptExtractor");
const inserter_1 = require("../modules/inserter");
/**
 * 모든 웹뷰 프로바이더의 공통 기능을 제공하는 추상 베이스 클래스
 */
class BaseWebviewProvider {
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
            // 웹뷰 준비 완료 알림
            setTimeout(() => {
                console.log(`🎉 [${this.constructor.name}] 웹뷰 준비 완료`);
                this.onWebviewReady();
            }, 100);
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
            // 백엔드 API 호출
            const request = {
                prompt: question,
                context: extractedPrompt.context,
                model_type: "CODE_GENERATION",
                language: "python",
            };
            // 로딩 상태 표시
            webview.postMessage({
                command: "showLoading",
                message: "AI가 응답을 생성하고 있습니다...",
            });
            // 실제 API 호출
            const response = await apiClient_1.apiClient.generateCode(request);
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
                    }
                }
                catch (parseError) {
                    console.log("ℹ️ BaseWebviewProvider JSON 파싱 불가, 원본 코드 사용:", parseError);
                    // JSON 파싱에 실패하면 원본 그대로 사용
                }
                // 응답을 웹뷰에 전송
                webview.postMessage({
                    command: "addAIResponse",
                    response: {
                        generated_code: finalCode,
                        explanation: response.explanation || "AI가 생성한 코드입니다.",
                        originalQuestion: question,
                        success: true,
                    },
                });
            }
            else {
                // 오류 응답 처리
                webview.postMessage({
                    command: "showError",
                    error: response.error_message || "응답 생성에 실패했습니다.",
                });
            }
        }
        catch (error) {
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
}
exports.BaseWebviewProvider = BaseWebviewProvider;
//# sourceMappingURL=BaseWebviewProvider.js.map