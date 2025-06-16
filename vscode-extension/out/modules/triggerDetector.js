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
exports.TriggerDetector = void 0;
const vscode = __importStar(require("vscode"));
const promptExtractor_1 = require("./promptExtractor");
class TriggerDetector {
    onTriggerCallback;
    constructor() {
        this.setupEventListeners();
    }
    /**
     * 트리거 이벤트 콜백 설정
     */
    onTrigger(callback) {
        this.onTriggerCallback = callback;
    }
    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 텍스트 선택 변경 감지
        vscode.window.onDidChangeTextEditorSelection((event) => {
            this.handleSelectionChange(event);
        });
        // 활성 에디터 변경 감지
        vscode.window.onDidChangeActiveTextEditor((editor) => {
            this.handleEditorChange(editor);
        });
    }
    /**
     * 선택 영역 변경 처리
     */
    handleSelectionChange(event) {
        const selection = event.selections[0];
        // 의미있는 텍스트가 선택되었는지 확인
        if (!selection.isEmpty &&
            event.textEditor.document.getText(selection).trim().length > 10) {
            const extractedPrompt = promptExtractor_1.PromptExtractor.extractFromSelection();
            if (extractedPrompt) {
                this.emitTrigger({
                    type: "selection",
                    action: "analyze",
                    data: extractedPrompt,
                    timestamp: new Date(),
                });
            }
        }
    }
    /**
     * 에디터 변경 처리
     */
    handleEditorChange(editor) {
        if (!editor) {
            return;
        }
        // 파일이 Python 파일인지 확인
        if (editor.document.languageId === "python") {
            const extractedPrompt = promptExtractor_1.PromptExtractor.extractFileContext();
            if (extractedPrompt) {
                this.emitTrigger({
                    type: "command",
                    action: "analyze",
                    data: extractedPrompt,
                    timestamp: new Date(),
                });
            }
        }
    }
    /**
     * 명령어 기반 트리거 처리
     */
    handleCommand(command, customPrompt) {
        let action;
        let extractedPrompt = null;
        switch (command) {
            case "hapa.analyze":
                action = "analyze";
                extractedPrompt =
                    promptExtractor_1.PromptExtractor.extractFromSelection() ||
                        promptExtractor_1.PromptExtractor.extractCurrentFunction() ||
                        promptExtractor_1.PromptExtractor.extractFileContext();
                break;
            case "hapa.generateTest":
                action = "test";
                extractedPrompt =
                    promptExtractor_1.PromptExtractor.extractFromSelection() ||
                        promptExtractor_1.PromptExtractor.extractCurrentFunction();
                break;
            case "hapa.explain":
                action = "explain";
                extractedPrompt =
                    promptExtractor_1.PromptExtractor.extractFromSelection() ||
                        promptExtractor_1.PromptExtractor.extractCurrentFunction();
                break;
            case "hapa.custom":
                action = "custom";
                if (customPrompt) {
                    extractedPrompt =
                        promptExtractor_1.PromptExtractor.combinePromptWithContext(customPrompt);
                }
                break;
            default:
                return;
        }
        if (extractedPrompt) {
            this.emitTrigger({
                type: "command",
                action: action,
                data: extractedPrompt,
                timestamp: new Date(),
            });
        }
        else {
            vscode.window.showWarningMessage("분석할 코드를 선택하거나 커서를 코드 영역에 위치시켜주세요.");
        }
    }
    /**
     * 컨텍스트 메뉴 기반 트리거 처리
     */
    handleContextMenu(action) {
        const extractedPrompt = promptExtractor_1.PromptExtractor.extractFromSelection();
        if (!extractedPrompt) {
            vscode.window.showWarningMessage("분석할 코드를 먼저 선택해주세요.");
            return;
        }
        this.emitTrigger({
            type: "contextMenu",
            action: action,
            data: extractedPrompt,
            timestamp: new Date(),
        });
    }
    /**
     * 수동 트리거 (웹뷰에서 호출)
     */
    handleManualTrigger(prompt) {
        const extractedPrompt = promptExtractor_1.PromptExtractor.combinePromptWithContext(prompt);
        this.emitTrigger({
            type: "manual",
            action: "custom",
            data: extractedPrompt,
            timestamp: new Date(),
        });
    }
    /**
     * 트리거 이벤트 발생
     */
    emitTrigger(event) {
        if (this.onTriggerCallback) {
            this.onTriggerCallback(event);
        }
    }
    /**
     * 현재 컨텍스트 정보 가져오기
     */
    getCurrentContext() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return null;
        }
        // 선택된 텍스트가 있으면 우선적으로 반환
        const selection = promptExtractor_1.PromptExtractor.extractFromSelection();
        if (selection) {
            return selection;
        }
        // 현재 함수/클래스 컨텍스트 반환
        const currentFunction = promptExtractor_1.PromptExtractor.extractCurrentFunction();
        if (currentFunction) {
            return currentFunction;
        }
        // 파일 전체 컨텍스트 반환
        return promptExtractor_1.PromptExtractor.extractFileContext();
    }
    /**
     * 언어별 기본 프롬프트 생성
     */
    generateDefaultPrompt(language, action) {
        const prompts = {
            analyze: {
                python: "이 Python 코드를 분석하고 개선점을 제안해주세요.",
                javascript: "이 JavaScript 코드를 분석하고 최적화 방법을 알려주세요.",
                typescript: "이 TypeScript 코드를 분석하고 타입 안정성을 검토해주세요.",
                default: "이 코드를 분석하고 개선점을 제안해주세요.",
            },
            test: {
                python: "이 Python 함수에 대한 단위 테스트를 작성해주세요.",
                javascript: "이 JavaScript 함수에 대한 Jest 테스트를 작성해주세요.",
                typescript: "이 TypeScript 함수에 대한 단위 테스트를 작성해주세요.",
                default: "이 함수에 대한 단위 테스트를 작성해주세요.",
            },
            explain: {
                python: "이 Python 코드가 어떻게 작동하는지 자세히 설명해주세요.",
                javascript: "이 JavaScript 코드의 동작 원리를 설명해주세요.",
                typescript: "이 TypeScript 코드의 구조와 동작을 설명해주세요.",
                default: "이 코드가 어떻게 작동하는지 설명해주세요.",
            },
        };
        const actionPrompts = prompts[action];
        if (actionPrompts) {
            return (actionPrompts[language] ||
                actionPrompts.default);
        }
        return "이 코드에 대해 분석해주세요.";
    }
}
exports.TriggerDetector = TriggerDetector;
//# sourceMappingURL=triggerDetector.js.map