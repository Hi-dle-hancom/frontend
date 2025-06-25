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
exports.PromptExtractor = void 0;
const vscode = __importStar(require("vscode"));
class PromptExtractor {
    /**
     * 현재 에디터에서 선택된 텍스트와 컨텍스트를 추출
     */
    static extractFromSelection() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return null;
        }
        const document = editor.document;
        const selection = editor.selection;
        const selectedText = document.getText(selection);
        // 선택된 텍스트가 없으면 null 반환
        if (!selectedText.trim()) {
            return null;
        }
        // 파일 언어 감지
        const language = document.languageId;
        // 선택 영역 주변 컨텍스트 추출 (앞뒤 5줄씩)
        const contextRange = new vscode.Range(Math.max(0, selection.start.line - 5), 0, Math.min(document.lineCount - 1, selection.end.line + 5), 0);
        const context = document.getText(contextRange);
        return {
            prompt: selectedText,
            context: context,
            selectedCode: selectedText,
            language: language,
            filePath: document.fileName,
            lineNumbers: {
                start: selection.start.line + 1,
                end: selection.end.line + 1,
            },
        };
    }
    /**
     * 현재 파일의 전체 컨텍스트를 추출
     */
    static extractFileContext() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return null;
        }
        const document = editor.document;
        const fullText = document.getText();
        const language = document.languageId;
        return {
            prompt: `현재 파일을 분석해주세요: ${document.fileName}`,
            context: fullText,
            language: language,
            filePath: document.fileName,
            lineNumbers: {
                start: 1,
                end: document.lineCount,
            },
        };
    }
    /**
     * 커서 위치 주변의 함수나 클래스를 추출
     */
    static extractCurrentFunction() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return null;
        }
        const document = editor.document;
        const position = editor.selection.active;
        const language = document.languageId;
        // 언어별 함수/클래스 패턴
        const patterns = {
            python: /(def\s+\w+|class\s+\w+)/g,
            javascript: /(function\s+\w+|class\s+\w+|const\s+\w+\s*=\s*\()/g,
            typescript: /(function\s+\w+|class\s+\w+|const\s+\w+\s*=\s*\()/g,
            java: /(public|private|protected)?\s*(static)?\s*(class|interface|enum|\w+\s+\w+\s*\()/g,
        };
        const pattern = patterns[language];
        if (!pattern) {
            // 패턴이 없으면 현재 라인 주변 10줄을 반환
            const range = new vscode.Range(Math.max(0, position.line - 10), 0, Math.min(document.lineCount - 1, position.line + 10), 0);
            const context = document.getText(range);
            return {
                prompt: `현재 위치의 코드를 분석해주세요`,
                context: context,
                language: language,
                filePath: document.fileName,
                lineNumbers: {
                    start: Math.max(1, position.line - 9),
                    end: Math.min(document.lineCount, position.line + 11),
                },
            };
        }
        // 현재 위치에서 가장 가까운 함수/클래스를 찾기
        const text = document.getText();
        const lines = text.split("\n");
        let functionStart = -1;
        let functionEnd = -1;
        // 현재 라인에서 위쪽으로 함수 시작점 찾기
        for (let i = position.line; i >= 0; i--) {
            if (pattern.test(lines[i])) {
                functionStart = i;
                break;
            }
        }
        if (functionStart === -1) {
            return null;
        }
        // 함수 끝점 찾기 (간단한 들여쓰기 기반)
        const startIndent = lines[functionStart].search(/\S/);
        functionEnd = functionStart;
        for (let i = functionStart + 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line === "") {
                continue;
            }
            const currentIndent = lines[i].search(/\S/);
            if (currentIndent <= startIndent && line !== "") {
                functionEnd = i - 1;
                break;
            }
            functionEnd = i;
        }
        const range = new vscode.Range(functionStart, 0, functionEnd, lines[functionEnd].length);
        const functionCode = document.getText(range);
        return {
            prompt: `다음 함수/클래스를 분석해주세요`,
            context: functionCode,
            selectedCode: functionCode,
            language: language,
            filePath: document.fileName,
            lineNumbers: {
                start: functionStart + 1,
                end: functionEnd + 1,
            },
        };
    }
    /**
     * 사용자 정의 프롬프트와 현재 컨텍스트를 결합
     */
    static combinePromptWithContext(userPrompt) {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return {
                prompt: userPrompt,
                context: "",
            };
        }
        const document = editor.document;
        const selection = editor.selection;
        const language = document.languageId;
        let context = "";
        let selectedCode = undefined;
        // 선택된 텍스트가 있으면 해당 텍스트와 주변 컨텍스트 포함
        if (!selection.isEmpty) {
            selectedCode = document.getText(selection);
            const contextRange = new vscode.Range(Math.max(0, selection.start.line - 3), 0, Math.min(document.lineCount - 1, selection.end.line + 3), 0);
            context = document.getText(contextRange);
        }
        else {
            // 선택된 텍스트가 없으면 현재 커서 주변 컨텍스트
            const position = editor.selection.active;
            const contextRange = new vscode.Range(Math.max(0, position.line - 5), 0, Math.min(document.lineCount - 1, position.line + 5), 0);
            context = document.getText(contextRange);
        }
        return {
            prompt: userPrompt,
            context: context,
            selectedCode: selectedCode,
            language: language,
            filePath: document.fileName,
            lineNumbers: selection.isEmpty
                ? undefined
                : {
                    start: selection.start.line + 1,
                    end: selection.end.line + 1,
                },
        };
    }
}
exports.PromptExtractor = PromptExtractor;
//# sourceMappingURL=promptExtractor.js.map