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
    _extensionUri;
    _view;
    constructor(_extensionUri) {
        this._extensionUri = _extensionUri;
    }
    resolveWebviewView(webviewView, context, _token) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };
        webviewView.webview.html = this.getHtmlContent(webviewView.webview);
        this.setupMessageHandlers(webviewView.webview);
    }
    /**
     * 메시지 핸들러를 설정합니다. 서브클래스에서 오버라이드할 수 있습니다.
     */
    setupMessageHandlers(webview) {
        webview.onDidReceiveMessage((message) => {
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
                    this.handleCustomMessage(message);
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
     * AI 질문을 처리하는 공통 메서드
     */
    async handleAIQuestion(question, webview) {
        try {
            // 프롬프트와 컨텍스트 추출
            const extractedPrompt = promptExtractor_1.PromptExtractor.combinePromptWithContext(question);
            // 백엔드 API 호출
            const request = {
                user_question: question,
                code_context: extractedPrompt.context,
                language: "python",
                file_path: undefined,
            };
            // 로딩 상태 표시
            webview.postMessage({
                command: "showLoading",
                message: "AI가 응답을 생성하고 있습니다...",
            });
            // 실제 API 호출
            const response = await apiClient_1.apiClient.generateCode(request);
            // 응답을 웹뷰에 전송
            webview.postMessage({
                command: "addAIResponse",
                response: {
                    ...response,
                    originalQuestion: question,
                },
            });
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