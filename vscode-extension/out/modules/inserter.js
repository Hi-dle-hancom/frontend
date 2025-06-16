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
exports.CodeInserter = void 0;
const vscode = __importStar(require("vscode"));
class CodeInserter {
    /**
     * 현재 커서 위치에 코드 삽입
     */
    static async insertAtCursor(code, options = {}) {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage("활성 에디터가 없습니다.");
            return false;
        }
        try {
            const success = await editor.edit((editBuilder) => {
                const position = editor.selection.active;
                // 코드 포맷팅 (들여쓰기 맞추기)
                const formattedCode = this.formatCodeForInsertion(code, editor, position);
                editBuilder.insert(position, formattedCode);
            });
            if (success) {
                // 포맷팅 적용
                await vscode.commands.executeCommand("editor.action.formatDocument");
                vscode.window.showInformationMessage("코드가 성공적으로 삽입되었습니다.");
            }
            return success;
        }
        catch (error) {
            vscode.window.showErrorMessage(`코드 삽입 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}`);
            return false;
        }
    }
    /**
     * 선택된 영역을 코드로 교체
     */
    static async replaceSelection(code, options = {}) {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage("활성 에디터가 없습니다.");
            return false;
        }
        const selection = editor.selection;
        if (selection.isEmpty) {
            return this.insertAtCursor(code, options);
        }
        try {
            const success = await editor.edit((editBuilder) => {
                // 선택 영역의 들여쓰기 레벨 감지
                const selectedText = editor.document.getText(selection);
                const indentLevel = this.detectIndentLevel(selectedText);
                // 코드 포맷팅
                const formattedCode = this.formatCodeWithIndent(code, indentLevel, editor.options.tabSize);
                editBuilder.replace(selection, formattedCode);
            });
            if (success) {
                await vscode.commands.executeCommand("editor.action.formatSelection");
                vscode.window.showInformationMessage("선택된 코드가 교체되었습니다.");
            }
            return success;
        }
        catch (error) {
            vscode.window.showErrorMessage(`코드 교체 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}`);
            return false;
        }
    }
    /**
     * 파일 끝에 코드 추가
     */
    static async appendToFile(code, options = {}) {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage("활성 에디터가 없습니다.");
            return false;
        }
        try {
            const document = editor.document;
            const lastLine = document.lineAt(document.lineCount - 1);
            const position = lastLine.range.end;
            const success = await editor.edit((editBuilder) => {
                // 마지막 줄이 비어있지 않으면 새 줄 추가
                const prefix = lastLine.text.trim() === "" ? "" : "\n\n";
                const formattedCode = prefix + this.formatCodeForInsertion(code, editor, position);
                editBuilder.insert(position, formattedCode);
            });
            if (success) {
                await vscode.commands.executeCommand("editor.action.formatDocument");
                vscode.window.showInformationMessage("코드가 파일 끝에 추가되었습니다.");
            }
            return success;
        }
        catch (error) {
            vscode.window.showErrorMessage(`코드 추가 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}`);
            return false;
        }
    }
    /**
     * 새 파일에 코드 생성
     */
    static async createNewFile(code, options = {}) {
        try {
            // 파일 확장자 결정
            const language = options.language || "python";
            const extensions = {
                python: ".py",
                javascript: ".js",
                typescript: ".ts",
                java: ".java",
                cpp: ".cpp",
                c: ".c",
            };
            const extension = extensions[language] || ".txt";
            const filename = options.filename || `generated_code${extension}`;
            // 새 문서 생성
            const document = await vscode.workspace.openTextDocument({
                content: this.cleanCode(code),
                language: language,
            });
            // 에디터에서 열기
            await vscode.window.showTextDocument(document);
            // 포맷팅 적용
            await vscode.commands.executeCommand("editor.action.formatDocument");
            vscode.window.showInformationMessage(`새 파일 "${filename}"이 생성되었습니다.`);
            return true;
        }
        catch (error) {
            vscode.window.showErrorMessage(`새 파일 생성 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}`);
            return false;
        }
    }
    /**
     * 테스트 파일에 코드 삽입 (특별한 처리)
     */
    static async insertTest(testCode, originalFunction) {
        try {
            // 현재 파일의 테스트 파일 찾기 또는 생성
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                return this.createNewFile(testCode, {
                    language: "python",
                    filename: "test_generated.py",
                });
            }
            const currentFilePath = editor.document.fileName;
            const testFilePath = this.generateTestFilePath(currentFilePath);
            // 테스트 파일이 존재하는지 확인
            try {
                const testDocument = await vscode.workspace.openTextDocument(testFilePath);
                await vscode.window.showTextDocument(testDocument);
                // 파일 끝에 테스트 코드 추가
                return this.appendToFile(testCode);
            }
            catch {
                // 테스트 파일이 없으면 새로 생성
                const testFileName = testFilePath.split("/").pop() || "test_generated.py";
                return this.createNewFile(testCode, {
                    language: "python",
                    filename: testFileName,
                });
            }
        }
        catch (error) {
            vscode.window.showErrorMessage(`테스트 삽입 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}`);
            return false;
        }
    }
    /**
     * 코드를 삽입 위치에 맞게 포맷팅
     */
    static formatCodeForInsertion(code, editor, position) {
        const document = editor.document;
        const lineText = document.lineAt(position.line).text;
        const indentLevel = this.detectIndentLevel(lineText);
        const tabSize = editor.options.tabSize;
        return this.formatCodeWithIndent(code, indentLevel, tabSize);
    }
    /**
     * 들여쓰기 레벨 감지
     */
    static detectIndentLevel(text) {
        const lines = text.split("\n");
        let minIndent = Infinity;
        for (const line of lines) {
            if (line.trim() === "")
                continue;
            const indent = line.search(/\S/);
            if (indent >= 0 && indent < minIndent) {
                minIndent = indent;
            }
        }
        return minIndent === Infinity ? 0 : minIndent;
    }
    /**
     * 지정된 들여쓰기 레벨로 코드 포맷팅
     */
    static formatCodeWithIndent(code, indentLevel, tabSize) {
        const cleanedCode = this.cleanCode(code);
        const lines = cleanedCode.split("\n");
        const indentString = " ".repeat(indentLevel);
        return lines
            .map((line, index) => {
            if (line.trim() === "")
                return "";
            // 첫 번째 줄이 아니면 추가 들여쓰기 적용
            if (index === 0) {
                return indentString + line;
            }
            else {
                return indentString + line;
            }
        })
            .join("\n");
    }
    /**
     * 코드에서 불필요한 마크다운 문법 제거
     */
    static cleanCode(code) {
        // 코드 블록 마커 제거
        let cleaned = code.replace(/^```\w*\n?/gm, "").replace(/^```\n?/gm, "");
        // 앞뒤 공백 정리
        cleaned = cleaned.trim();
        // 연속된 빈 줄 정리
        cleaned = cleaned.replace(/\n{3,}/g, "\n\n");
        return cleaned;
    }
    /**
     * 테스트 파일 경로 생성
     */
    static generateTestFilePath(originalPath) {
        const parts = originalPath.split("/");
        const filename = parts.pop() || "unknown.py";
        const nameWithoutExt = filename.replace(/\.[^.]+$/, "");
        const testFilename = `test_${nameWithoutExt}.py`;
        return [...parts, testFilename].join("/");
    }
    /**
     * 스마트 삽입 - 상황에 맞는 최적의 삽입 방법 선택
     */
    static async smartInsert(code, options = {}) {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return this.createNewFile(code, options);
        }
        const selection = editor.selection;
        // 선택된 텍스트가 있으면 교체
        if (!selection.isEmpty) {
            return this.replaceSelection(code, options);
        }
        // 테스트 코드인지 확인
        if (code.includes("test_") ||
            code.includes("assert") ||
            code.includes("unittest")) {
            return this.insertTest(code, "");
        }
        // 일반적인 경우 커서 위치에 삽입
        return this.insertAtCursor(code, options);
    }
}
exports.CodeInserter = CodeInserter;
//# sourceMappingURL=inserter.js.map