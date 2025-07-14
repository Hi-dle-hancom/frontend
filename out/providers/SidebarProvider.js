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
exports.SidebarProvider = void 0;
const vscode = __importStar(require("vscode"));
const BaseWebviewProvider_1 = require("./BaseWebviewProvider");
const triggerDetector_1 = require("../modules/triggerDetector");
const SidebarHtmlGenerator_1 = require("../templates/SidebarHtmlGenerator");
const apiClient_1 = require("../modules/apiClient");
const apiClient_2 = require("../modules/apiClient");
const ConfigService_1 = require("../services/ConfigService");
/**
 * 사이드바 대시보드 웹뷰 프로바이더 클래스
 */
class SidebarProvider extends BaseWebviewProvider_1.BaseWebviewProvider {
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
        return "HAPA Assistant";
    }
    constructor(extensionUri) {
        super(extensionUri);
        // 히스토리 상태 관리를 위한 속성들 추가
        this.questionHistory = [];
        this.expandedPanels = []; // 열린 expand 패널들 추적
        this.maxHistorySize = 50; // 최대 50개 히스토리 유지
        this.configService = ConfigService_1.ConfigService.getInstance();
        // TriggerDetector 초기화 및 이벤트 리스너 설정
        this.triggerDetector = new triggerDetector_1.TriggerDetector();
        this.triggerDetector.onTrigger(this.handleTriggerEvent.bind(this));
        // 히스토리 로드
        this.loadHistory();
    }
    /**
     * 히스토리 로드 (VSCode globalState에서)
     */
    loadHistory() {
        const context = this.getContext();
        const savedHistory = context?.globalState.get("hapaHistory");
        if (savedHistory) {
            this.questionHistory = savedHistory;
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
            const historyData = JSON.stringify(this.questionHistory);
            // 사이드바에 전송
            if (this._view?.webview) {
                this._view.webview.postMessage({
                    command: "syncHistory",
                    history: historyData,
                }).then(undefined, (error) => {
                    console.error("❌ 사이드바 히스토리 동기화 메시지 전송 실패:", error);
                });
            }
            // 모든 expand 패널에 전송
            this.expandedPanels.forEach((panel, index) => {
                if (panel.webview) {
                    panel.webview.postMessage({
                        command: "syncHistory",
                        history: historyData,
                    }).then(undefined, (error) => {
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
     * 히스토리에 새 항목 추가
     */
    addToHistory(question, response) {
        console.log("📚 히스토리 저장 시도:", {
            question_preview: question.substring(0, 50) + "...",
            response_length: response.length,
            current_history_count: this.questionHistory.length,
        });
        // 중복 질문 제한 (연속 3회까지)
        const recentSameQuestions = this.questionHistory
            .slice(0, 3)
            .filter((item) => item.question.trim().toLowerCase() === question.trim().toLowerCase());
        if (recentSameQuestions.length < 3) {
            // 새로운 히스토리 항목 추가
            this.questionHistory.unshift({
                question: question,
                timestamp: new Date().toLocaleString("ko-KR"),
                response: response,
            });
            // 최대 50개까지만 저장
            if (this.questionHistory.length > this.maxHistorySize) {
                this.questionHistory = this.questionHistory.slice(0, this.maxHistorySize);
            }
            // 저장 및 동기화
            this.saveHistory();
            console.log("✅ 히스토리 저장 완료:", {
                total_count: this.questionHistory.length,
                saved_timestamp: new Date().toLocaleString("ko-KR"),
            });
        }
        else {
            console.log("⚠️ 히스토리 저장 스킵 (중복 질문 제한):", {
                duplicate_count: recentSameQuestions.length,
                question_preview: question.substring(0, 50) + "...",
            });
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
        this.loadHistory(); // context 설정 후 히스토리 다시 로드
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
                this._view.webview.postMessage({
                    command: "updateCodeContext",
                    context: contextInfo,
                }).then(undefined, (error) => {
                    console.error("❌ 사이드바 코드 맥락 메시지 전송 실패:", error);
                });
            }
            // 모든 expand 패널에 코드 맥락 정보 전송
            this.expandedPanels.forEach((panel) => {
                if (panel.webview) {
                    panel.webview.postMessage({
                        command: "updateCodeContext",
                        context: contextInfo,
                    }).then(undefined, (error) => {
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
        // 1. 히스토리 동기화
        this.broadcastHistoryUpdate();
        // 2. 초기 빈 상태 메시지 설정
        setTimeout(() => {
            if (this._view) {
                console.log("📤 빈 상태 초기화 메시지 전송");
                this._view.webview.postMessage({
                    command: "initializeEmptyStates",
                });
            }
        }, 200);
        // 3. 현재 에디터 컨텍스트 정보 전송
        setTimeout(() => {
            if (this._view) {
                const activeEditor = vscode.window.activeTextEditor;
                if (activeEditor) {
                    this._view.webview.postMessage({
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
                        promptLength: prompt.length
                    });
                    await this.handleStreamingCodeGeneration(prompt, modelType);
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
                this.addToHistory(message.question, message.response);
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
        if (activeEditor &&
            activeEditor.selection &&
            !activeEditor.selection.isEmpty) {
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
                    model_type: apiClient_2.VLLMModelType.CODE_GENERATION,
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
                // ConfigService에서 설정 가져오기
                const apiConfig = this.configService.getAPIConfig();
                const headers = {
                    "Content-Type": "application/json",
                    "X-API-Key": apiConfig.apiKey,
                };
                const streamUrl = `${apiConfig.baseURL}/code/generate/stream`;
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
                                    if (parsedContent.length + parsed.text.length >
                                        maxContentLength) {
                                        parsedContent +=
                                            "\n\n⚠️ **응답이 너무 길어 일부가 생략되었습니다.**";
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
                this.addToHistory(continuePrompt, finalCleanedContent);
                resolve();
            }
            catch (error) {
                console.error("응답 이어가기 실패:", error);
                // 사용자에게 구체적인 오류 메시지 제공
                let errorMessage = "응답 이어가기 중 오류가 발생했습니다.";
                if (error instanceof Error) {
                    if (error.message.includes("응답 시간이 초과")) {
                        errorMessage =
                            "⏱️ 응답 시간이 초과되었습니다. 더 간단한 질문으로 다시 시도해주세요.";
                    }
                    else if (error.message.includes("HTTP error")) {
                        errorMessage =
                            "🌐 서버 연결 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
                    }
                    else if (error.message.includes("응답을 읽을 수 없습니다")) {
                        errorMessage =
                            "📡 응답 데이터를 읽는 중 오류가 발생했습니다. 다시 시도해주세요.";
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
            question: trimmedQuestion.length > 100
                ? trimmedQuestion.substring(0, 100) + "..."
                : trimmedQuestion,
            questionLength: trimmedQuestion.length,
            modelType,
            webviewReady: !!this._view?.webview,
        });
        // 현재 활성 편집기의 컨텍스트 가져오기
        const activeEditor = vscode.window.activeTextEditor;
        let codeContext = undefined;
        if (activeEditor &&
            activeEditor.selection &&
            !activeEditor.selection.isEmpty) {
            codeContext = activeEditor.document.getText(activeEditor.selection);
        }
        // 스트리밍 완료 후 최종 응답 저장용 변수
        let finalStreamingContent = "";
        // 버그 수정 전용 API 요청 구성
        const bugFixRequest = {
            prompt: question,
            context: codeContext || "",
            model_type: modelType || "bug_fix",
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
                console.log("📦 스트리밍 청크 수신:", {
                    chunkType: chunk.type,
                    chunkContentLength: chunk.content?.length || 0,
                    chunkSequence: chunk.sequence,
                    hasWebview: !!this._view?.webview,
                    chunkContent: chunk.content?.substring(0, 50) + "..." || "empty",
                });
                if (this._view?.webview) {
                    // [DONE] 신호 감지 - 스트리밍 종료 처리
                    if (chunk.content === "[DONE]" ||
                        (typeof chunk.content === "string" &&
                            chunk.content.trim() === "[DONE]") ||
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
                            content: chunk.content || "",
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
                this.addToHistory(question.trim(), "AI 생성 코드");
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
            question: trimmedQuestion.length > 100
                ? trimmedQuestion.substring(0, 100) + "..."
                : trimmedQuestion,
            questionLength: trimmedQuestion.length,
            modelType,
            webviewReady: !!this._view?.webview,
        });
        // 현재 활성 편집기의 컨텍스트 가져오기
        const activeEditor = vscode.window.activeTextEditor;
        let codeContext = undefined;
        if (activeEditor &&
            activeEditor.selection &&
            !activeEditor.selection.isEmpty) {
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
                    // im_end 태그 감지 및 조기 종료
                    if (chunk.content && chunk.content.includes('<|im_end|>')) {
                        console.log("🔚 im_end 태그 감지 - 스트리밍 종료");
                        // im_end 태그 전까지의 내용만 추가
                        const contentBeforeEnd = chunk.content.split('<|im_end|>')[0];
                        if (contentBeforeEnd.trim()) {
                            finalStreamingContent += contentBeforeEnd;
                            // 마지막 청크 전송
                            if (this._view?.webview) {
                                this._view.webview.postMessage({
                                    command: "streamingChunk",
                                    chunk: {
                                        ...chunk,
                                        content: contentBeforeEnd,
                                        type: "final"
                                    },
                                    chunkNumber: chunkCount,
                                    isLast: true
                                });
                            }
                        }
                        // 스트리밍 완료 호출
                        setTimeout(() => {
                            if (this._view?.webview) {
                                this._view.webview.postMessage({
                                    command: "streamingComplete",
                                    finalContent: this.cleanAIResponse(finalStreamingContent),
                                    totalChunks: chunkCount,
                                    duration: lastChunkTime - streamingStartTime
                                });
                            }
                        }, 50);
                        return;
                    }
                    console.log("📦 스트리밍 청크 수신:", {
                        type: chunk.type,
                        sequence: chunk.sequence,
                        contentLength: chunk.content?.length || 0,
                        chunkNumber: chunkCount,
                        timeSinceStart: lastChunkTime - streamingStartTime,
                        hasImEnd: chunk.content?.includes('<|im_end|>') || false,
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
                        if (chunk.content && typeof chunk.content === "string") {
                            // 콘텐츠 정리 및 누적
                            const cleanedContent = this.cleanStreamingContent(chunk.content);
                            if (cleanedContent.trim()) {
                                finalStreamingContent += cleanedContent;
                                chunkBuffer += cleanedContent;
                                // 청크 번들링 로직
                                const currentTime = Date.now();
                                const shouldSendBundle = chunkBuffer.length >= MIN_BUNDLE_SIZE ||
                                    (currentTime - lastBundleTime) >= BUNDLE_INTERVAL ||
                                    cleanedContent.includes('\n'); // 줄바꿈이 있으면 즉시 전송
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
                        console.error("❌ 스트리밍 오류 청크:", chunk.content);
                        this._view.webview.postMessage({
                            command: "streamingError",
                            error: chunk.content || "스트리밍 중 오류 발생",
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
                        if (typeof parsedContent === "string" &&
                            parsedContent.trim().startsWith("{")) {
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
                    // 응답 품질 검증
                    if (finalCleanedContent.length < 10) {
                        console.warn("⚠️ 응답이 너무 짧음:", finalCleanedContent.length);
                        finalCleanedContent +=
                            "\n\n⚠️ **알림**: 응답이 예상보다 짧습니다. 더 구체적인 질문으로 다시 시도해보세요.";
                    }
                    // 보안 경고 및 사용자 안내 추가 (조건부)
                    if (finalCleanedContent.length > 100 &&
                        finalCleanedContent.includes("def ")) {
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
                    this.addToHistory(question, finalCleanedContent);
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
                            userFriendlyMessage =
                                "🔑 API 인증 오류가 발생했습니다. 설정을 확인해주세요.";
                        }
                        else if (error.message?.includes("500")) {
                            userFriendlyMessage =
                                "🛠️ 서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
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
            // 백엔드 API 스키마에 맞춘 요청 구성
            const request = {
                // 핵심 요청 정보
                prompt: question.trim(),
                model_type: vllmModelType,
                context: codeContext || "",
                // vLLM 서버 전용 매개변수
                temperature: modelConfig.temperature || 0.3,
                top_p: modelConfig.top_p || 0.95,
                max_tokens: modelConfig.max_tokens || 1024,
                // 사용자 개인화 옵션 (ConfigService에서 가져오기)
                programming_level: this.getUserProgrammingLevel(),
                explanation_detail: this.getUserExplanationDetail(),
                code_style: "pythonic",
                include_comments: modelConfig.include_comments !== false,
                include_docstring: modelConfig.include_docstring !== false,
                include_type_hints: modelConfig.include_type_hints !== false,
                // 추가 메타데이터
                language: "python",
                project_context: this.getUserProjectContext(),
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
     * 사용자 프로그래밍 레벨 가져오기
     */
    getUserProgrammingLevel() {
        try {
            const config = vscode.workspace.getConfiguration("hapa");
            return config.get("userProfile.pythonSkillLevel", "intermediate");
        }
        catch {
            return "intermediate";
        }
    }
    /**
     * 사용자 설명 세부사항 레벨 가져오기
     */
    getUserExplanationDetail() {
        try {
            const config = vscode.workspace.getConfiguration("hapa");
            return config.get("userProfile.explanationStyle", "standard");
        }
        catch {
            return "standard";
        }
    }
    /**
     * 사용자 프로젝트 컨텍스트 가져오기
     */
    getUserProjectContext() {
        try {
            const config = vscode.workspace.getConfiguration("hapa");
            const projectContext = config.get("userProfile.projectContext", "general_purpose");
            // 프로젝트 컨텍스트를 문자열로 변환
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
        catch {
            return "범용";
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
            await activeEditor.edit((editBuilder) => {
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
     * TriggerDetector에서 발생한 이벤트 처리
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
                error: error instanceof Error
                    ? error.message
                    : "알 수 없는 오류가 발생했습니다.",
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
        panel.webview.onDidReceiveMessage((message) => {
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
                this._view.webview.postMessage({
                    command: "streamingError",
                    error: errorMessage,
                    timestamp: new Date().toISOString()
                }).then(undefined, (error) => {
                    console.error("❌ 에러 메시지 전송 실패:", error);
                });
            }
            // 모든 확장 패널에도 전송
            this.expandedPanels.forEach((panel, index) => {
                if (panel.webview) {
                    panel.webview.postMessage({
                        command: "streamingError",
                        error: errorMessage,
                        timestamp: new Date().toISOString()
                    }).then(undefined, (error) => {
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
     * 확장된 뷰의 메시지 처리
     */
    async handleExpandedViewMessage(message, panel) {
        switch (message.command) {
            case "generateCodeStreaming":
                this.handleExpandedStreamingCodeGeneration(message.question, panel);
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
                this.addToHistory(message.question, message.response);
                return;
            case "getHistory":
                // 히스토리 요청 처리
                panel.webview.postMessage({
                    command: "syncHistory",
                    history: JSON.stringify(this.questionHistory),
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
        if (activeEditor &&
            activeEditor.selection &&
            !activeEditor.selection.isEmpty) {
            codeContext = activeEditor.document.getText(activeEditor.selection);
        }
        // 버그 수정 전용 API 요청 구성
        const bugFixRequest = {
            prompt: question,
            context: codeContext || "",
            model_type: modelType || "bug_fix",
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
     * 확장된 뷰에서의 스트리밍 코드 생성 처리
     */
    async handleExpandedStreamingCodeGeneration(question, panel) {
        if (!panel.webview) {
            return;
        }
        // 현재 활성 편집기의 컨텍스트 가져오기
        const activeEditor = vscode.window.activeTextEditor;
        let codeContext = undefined;
        if (activeEditor &&
            activeEditor.selection &&
            !activeEditor.selection.isEmpty) {
            codeContext = activeEditor.document.getText(activeEditor.selection);
        }
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
                        error: error.message,
                    });
                }
                vscode.window.showErrorMessage(`코드 생성 오류: ${error.message}`);
            },
        };
        try {
            await apiClient_1.apiClient.generateCodeStreaming(question, codeContext || "", callbacks);
        }
        catch (error) {
            console.error("스트리밍 코드 생성 실패:", error);
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
            /^\s*#\s*TODO[:\s]/i,
            /^\s*#\s*FIXME[:\s]/i,
            /^\s*#\s*생성[:\s]/,
            /^\s*#\s*만들어[:\s]/,
            /^\s*#\s*작성[:\s]/,
            /^\s*#\s*구현[:\s]/,
            /^\s*#\s*추가[:\s]/,
            /^\s*#\s*수정[:\s]/,
            /^\s*#\s*개선[:\s]/,
            /^\s*#\s*[가-힣\w]+.*함수/,
            /^\s*#\s*[가-힣\w]+.*클래스/,
            /^\s*#\s*[가-힣\w]+.*메서드/,
            /^\s*#\s*create[:\s]/i,
            /^\s*#\s*make[:\s]/i,
            /^\s*#\s*implement[:\s]/i,
            /^\s*#\s*add[:\s]/i,
            /^\s*#\s*write[:\s]/i, // 영어: write
        ];
        return commentPatterns.some((pattern) => pattern.test(text));
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
        tokenPatterns.forEach((pattern) => {
            cleaned = cleaned.replace(pattern, "");
        });
        // 2. 불완전한 JSON 문자열 제거
        cleaned = cleaned.replace(/^["{,]/g, "");
        // 3. 깨진 문법 패턴 수정 (성능 최적화)
        const syntaxFixes = [
            [/if __name_ _== "_ ___":/g, 'if __name__ == "__main__":'],
            [/\{"text"rint/g, "print"],
            [/print\(f"\{__file_\{"/g, 'print(f"{__file__}\\n{'],
            [
                /print\("Exception occurred repr\(e\)\)/g,
                'print(f"Exception occurred: {repr(e)}")',
            ],
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
            if (line.includes('if __name__ == "__main__"') &&
                seenFunctions.has("main_block")) {
                skipUntilEnd = true;
                continue;
            }
            // doctest 관련 중복 제거
            if (line.includes("doctest.testmod()") && seenFunctions.has("doctest")) {
                continue;
            }
            // timer 관련 중복 제거
            if (line.includes("from timeit import default_timer") &&
                seenFunctions.has("timer")) {
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
        cleaned = cleaned.replace(/"""[\s\S]*?(?=[^"])/g, (match) => {
            if (!match.endsWith('"""')) {
                return match + '"""';
            }
            return match;
        });
        // 7. eval() 사용 시 경고 주석 추가 (보안 고려사항)
        if (cleaned.includes("eval(") && !cleaned.includes("# 주의: eval()")) {
            cleaned =
                "# 주의: 이 코드는 eval()을 사용합니다. 실제 사용 시 보안을 고려하세요.\n" +
                    cleaned;
        }
        // 8. 과도한 공백 정리
        cleaned = cleaned.replace(/\n\s*\n\s*\n+/g, "\n\n");
        cleaned = cleaned.trim();
        return cleaned;
    }
    /**
     * 모델별 특화 설정 반환
     */
    getModelConfiguration(modelType) {
        const configs = {
            autocomplete: {
                model: "claude-3-haiku-20240307",
                temperature: 0.1,
                top_p: 0.9,
                max_tokens: 512,
                prompt: undefined,
                include_comments: false,
                include_docstring: false,
                include_type_hints: true,
            },
            prompt: {
                model: "claude-3-haiku-20240307",
                temperature: 0.3,
                top_p: 0.95,
                max_tokens: 1024,
                prompt: undefined,
                include_comments: true,
                include_docstring: true,
                include_type_hints: true,
            },
            comment: {
                model: "claude-3-haiku-20240307",
                temperature: 0.2,
                top_p: 0.9,
                max_tokens: 800,
                prompt: undefined,
                include_comments: true,
                include_docstring: true,
                include_type_hints: true,
            },
            error_fix: {
                model: "claude-3-haiku-20240307",
                temperature: 0.1,
                top_p: 0.9,
                max_tokens: 1024,
                prompt: undefined,
                include_comments: true,
                include_docstring: true,
                include_type_hints: true,
            },
        };
        // 기본값 설정 (지원하지 않는 모델 타입의 경우)
        const defaultConfig = configs.prompt;
        return configs[modelType] || defaultConfig;
    }
}
exports.SidebarProvider = SidebarProvider;
//# sourceMappingURL=SidebarProvider.js.map