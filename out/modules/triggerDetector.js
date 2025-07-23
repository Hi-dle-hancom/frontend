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
exports.TriggerDetector = void 0;
const vscode = __importStar(require("vscode"));
const promptExtractor_1 = require("./promptExtractor");
class TriggerDetector {
    onTriggerCallback;
    lastTriggerTime = 0;
    triggerDebounceMs = 1000; // 1초 디바운스
    disposables = [];
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
        this.disposables.push(vscode.window.onDidChangeTextEditorSelection((event) => {
            this.handleSelectionChange(event);
        }));
        // 활성 에디터 변경 감지
        this.disposables.push(vscode.window.onDidChangeActiveTextEditor((editor) => {
            this.handleEditorChange(editor);
        }));
        // 실시간 텍스트 변경 감지 (주석 트리거용)
        this.disposables.push(vscode.workspace.onDidChangeTextDocument((event) => {
            this.handleTextDocumentChange(event);
        }));
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
     * 실시간 텍스트 문서 변경 처리 (개선된 주석 트리거 감지)
     */
    handleTextDocumentChange(event) {
        // Python 파일만 처리
        if (event.document.languageId !== "python") {
            return;
        }
        // 디바운스 적용 (너무 빈번한 트리거 방지)
        const now = Date.now();
        if (now - this.lastTriggerTime < this.triggerDebounceMs) {
            return;
        }
        // 텍스트 변경 사항에서 주석 트리거 감지
        for (const change of event.contentChanges) {
            const changedText = change.text;
            // 주석 트리거 패턴 감지
            if (this.isCommentTrigger(changedText, change)) {
                console.log("🔍 실시간 주석 트리거 감지:", changedText.substring(0, 50));
                // 주석 내용 분석 및 프롬프트 생성
                const analyzedPrompt = this.analyzeCommentContent(changedText, event.document, change.range);
                if (analyzedPrompt) {
                    this.lastTriggerTime = now;
                    const triggerEvent = {
                        type: "comment",
                        action: "custom",
                        data: analyzedPrompt,
                        timestamp: new Date(),
                    };
                    console.log("📤 실시간 주석 트리거 이벤트 발생:", triggerEvent);
                    this.emitTrigger(triggerEvent);
                }
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
    /**
     * 개선된 주석 트리거 여부 판단
     */
    isCommentTrigger(text, change) {
        console.log("🔍 주석 트리거 검사:", {
            text: text.substring(0, 100),
            hasHash: text.includes("#"),
            hasNewline: text.includes("\n"),
            length: text.length
        });
        // 단순 # 문자만으로는 트리거하지 않음
        if (!text.includes("#")) {
            console.log("❌ # 문자 없음");
            return false;
        }
        // 줄바꿈으로 끝나는 주석만 트리거 (완성된 주석)
        if (!text.includes("\n")) {
            console.log("❌ 줄바꿈 없음 (완성되지 않은 주석)");
            return false;
        }
        // 주석 패턴 감지 (더 정확한 패턴)
        const commentPatterns = [
            /^\s*#\s*TODO[:\s].+/i, // TODO 주석
            /^\s*#\s*FIXME[:\s].+/i, // FIXME 주석
            /^\s*#\s*(생성|만들어|작성|구현|추가|수정|개선).+/, // 한국어 액션
            /^\s*#\s*[가-힣\w]+.*함수.+/, // ~함수
            /^\s*#\s*[가-힣\w]+.*클래스.+/, // ~클래스
            /^\s*#\s*[가-힣\w]+.*메서드.+/, // ~메서드
            /^\s*#\s*(create|make|implement|add|write|generate).+/i, // 영어 액션
        ];
        const lines = text.split('\n');
        const result = lines.some(line => {
            const trimmed = line.trim();
            const hasMinLength = trimmed.length > 5;
            const matchesPattern = commentPatterns.some(pattern => pattern.test(line));
            if (trimmed.startsWith('#')) {
                console.log("🔍 주석 라인 분석:", {
                    line: line,
                    hasMinLength,
                    matchesPattern,
                    patterns: commentPatterns.map(p => ({ pattern: p.toString(), matches: p.test(line) }))
                });
            }
            return hasMinLength && matchesPattern;
        });
        if (result) {
            console.log("✅ 주석 트리거 조건 만족!");
        }
        else {
            console.log("❌ 주석 트리거 조건 불만족");
        }
        return result;
    }
    /**
     * 주석 내용 분석 및 프롬프트 생성
     */
    analyzeCommentContent(commentText, document, range) {
        try {
            // 주석에서 # 제거하고 정리
            const lines = commentText.split('\n');
            const commentLines = lines
                .filter(line => line.includes('#'))
                .map(line => line.replace(/^\s*#\s*/, "").trim())
                .filter(line => line.length > 0);
            if (commentLines.length === 0) {
                return null;
            }
            const cleanComment = commentLines.join(' ');
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
     * 리소스 정리
     */
    dispose() {
        this.disposables.forEach(disposable => disposable.dispose());
        this.disposables = [];
    }
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