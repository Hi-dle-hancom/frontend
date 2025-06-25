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
exports.EnhancedErrorService = exports.ErrorSeverity = void 0;
const vscode = __importStar(require("vscode"));
var ErrorSeverity;
(function (ErrorSeverity) {
    ErrorSeverity["LOW"] = "low";
    ErrorSeverity["MEDIUM"] = "medium";
    ErrorSeverity["HIGH"] = "high";
    ErrorSeverity["CRITICAL"] = "critical";
})(ErrorSeverity = exports.ErrorSeverity || (exports.ErrorSeverity = {}));
class EnhancedErrorService {
    static instance;
    errorLog = [];
    maxLogSize = 1000;
    errorCount = 0;
    static getInstance() {
        if (!EnhancedErrorService.instance) {
            EnhancedErrorService.instance = new EnhancedErrorService();
        }
        return EnhancedErrorService.instance;
    }
    /**
     * 에러 로깅 및 처리
     */
    logError(error, severity = ErrorSeverity.MEDIUM, context, retryable = false) {
        const errorInfo = {
            id: this.generateErrorId(),
            message: error instanceof Error ? error.message : error,
            severity,
            context,
            timestamp: new Date(),
            stack: error instanceof Error ? error.stack : undefined,
            retryable,
        };
        // 로그에 저장
        this.errorLog.push(errorInfo);
        this.maintainLogSize();
        // 콘솔에 출력
        this.logToConsole(errorInfo);
        // 사용자에게 표시 (심각도에 따라)
        this.showToUser(errorInfo);
        // 필요시 개발자에게 보고
        this.reportToDeveloper(errorInfo);
    }
    /**
     * 에러 복구 시도
     */
    async attemptRecovery(error, retryFunction, maxRetries = 3) {
        if (!retryFunction)
            return false;
        for (let i = 0; i < maxRetries; i++) {
            try {
                await retryFunction();
                this.logError(`복구 성공 (재시도 ${i + 1}/${maxRetries})`, ErrorSeverity.LOW);
                return true;
            }
            catch (retryError) {
                this.logError(`재시도 ${i + 1}/${maxRetries} 실패: ${retryError}`, ErrorSeverity.LOW, { originalError: error.message, retryError });
                // 지수적 백오프
                if (i < maxRetries - 1) {
                    await this.delay(Math.pow(2, i) * 1000);
                }
            }
        }
        this.logError(`복구 실패: 모든 재시도 완료 (${maxRetries}회)`, ErrorSeverity.HIGH, { originalError: error.message });
        return false;
    }
    /**
     * 네트워크 에러 처리
     */
    handleNetworkError(error) {
        if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
            this.logError("네트워크 연결 실패", ErrorSeverity.HIGH, { code: error.code }, true);
            vscode.window
                .showErrorMessage("네트워크 연결을 확인해주세요.", "재시도")
                .then((selection) => {
                if (selection === "재시도") {
                    // 재시도 로직 트리거
                    vscode.commands.executeCommand("hapa.retryLastRequest");
                }
            });
        }
        else if (error.status === 429) {
            this.logError("API 요청 한도 초과", ErrorSeverity.MEDIUM, { status: error.status }, true);
            vscode.window.showWarningMessage("요청이 너무 많습니다. 잠시 후 다시 시도해주세요.");
        }
        else if (error.status >= 500) {
            this.logError("서버 에러", ErrorSeverity.HIGH, { status: error.status }, true);
            vscode.window.showErrorMessage("서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.");
        }
        else {
            this.logError(`HTTP 에러: ${error.status}`, ErrorSeverity.MEDIUM, error);
        }
    }
    /**
     * API 키 관련 에러 처리
     */
    handleApiKeyError(error) {
        this.logError("API 키 인증 실패", ErrorSeverity.CRITICAL, error);
        vscode.window
            .showErrorMessage("API 키가 유효하지 않습니다. 설정을 확인해주세요.", "설정 열기")
            .then((selection) => {
            if (selection === "설정 열기") {
                vscode.commands.executeCommand("hapa.showSettings");
            }
        });
    }
    /**
     * 메모리 관련 에러 처리
     */
    handleMemoryError(error) {
        this.logError("메모리 부족", ErrorSeverity.CRITICAL, {
            heapUsed: process.memoryUsage().heapUsed,
            heapTotal: process.memoryUsage().heapTotal,
        });
        vscode.window
            .showErrorMessage("메모리가 부족합니다. VS Code를 재시작하는 것을 권장합니다.", "지금 재시작")
            .then((selection) => {
            if (selection === "지금 재시작") {
                vscode.commands.executeCommand("workbench.action.reloadWindow");
            }
        });
    }
    /**
     * 에러 통계 가져오기
     */
    getErrorStats() {
        const now = Date.now();
        const last24Hours = this.errorLog.filter((error) => now - error.timestamp.getTime() < 24 * 60 * 60 * 1000).length;
        const stats = {
            total: this.errorLog.length,
            bySeverity: {
                [ErrorSeverity.LOW]: 0,
                [ErrorSeverity.MEDIUM]: 0,
                [ErrorSeverity.HIGH]: 0,
                [ErrorSeverity.CRITICAL]: 0,
            },
            last24Hours,
            retryableCount: this.errorLog.filter((error) => error.retryable).length,
        };
        this.errorLog.forEach((error) => {
            stats.bySeverity[error.severity]++;
        });
        return stats;
    }
    /**
     * 최근 에러 목록 가져오기
     */
    getRecentErrors(limit = 10) {
        return this.errorLog.slice(-limit).reverse();
    }
    /**
     * 재시도 가능한 에러 목록
     */
    getRetryableErrors() {
        return this.errorLog.filter((error) => error.retryable).slice(-10);
    }
    /**
     * 에러 로그 정리
     */
    clearErrorLog() {
        this.errorLog = [];
        this.errorCount = 0;
    }
    /**
     * 특정 심각도 이상의 에러만 가져오기
     */
    getErrorsBySeverity(minSeverity) {
        const severityOrder = {
            [ErrorSeverity.LOW]: 0,
            [ErrorSeverity.MEDIUM]: 1,
            [ErrorSeverity.HIGH]: 2,
            [ErrorSeverity.CRITICAL]: 3,
        };
        return this.errorLog.filter((error) => severityOrder[error.severity] >= severityOrder[minSeverity]);
    }
    generateErrorId() {
        return `err_${Date.now()}_${++this.errorCount}`;
    }
    logToConsole(error) {
        const prefix = `[HAPA ${error.severity.toUpperCase()}] ${error.id}:`;
        switch (error.severity) {
            case ErrorSeverity.LOW:
                console.info(prefix, error.message, error.context);
                break;
            case ErrorSeverity.MEDIUM:
                console.warn(prefix, error.message, error.context);
                break;
            case ErrorSeverity.HIGH:
            case ErrorSeverity.CRITICAL:
                console.error(prefix, error.message);
                if (error.stack)
                    console.error(error.stack);
                if (error.context)
                    console.error("Context:", error.context);
                break;
        }
    }
    showToUser(error) {
        switch (error.severity) {
            case ErrorSeverity.CRITICAL:
                vscode.window
                    .showErrorMessage(`심각한 오류: ${error.message}`, "에러 로그 보기", "보고하기")
                    .then((selection) => {
                    if (selection === "에러 로그 보기") {
                        this.showErrorLog();
                    }
                    else if (selection === "보고하기") {
                        this.reportErrorToGitHub(error);
                    }
                });
                break;
            case ErrorSeverity.HIGH:
                vscode.window
                    .showErrorMessage(error.message, error.retryable ? "재시도" : "에러 로그 보기")
                    .then((selection) => {
                    if (selection === "재시도") {
                        vscode.commands.executeCommand("hapa.retryLastRequest");
                    }
                    else if (selection === "에러 로그 보기") {
                        this.showErrorLog();
                    }
                });
                break;
            case ErrorSeverity.MEDIUM:
                vscode.window.showWarningMessage(error.message);
                break;
            case ErrorSeverity.LOW:
                // 낮은 심각도는 사용자에게 표시하지 않음
                break;
        }
    }
    reportToDeveloper(error) {
        if (error.severity === ErrorSeverity.CRITICAL) {
            console.log("🚨 CRITICAL ERROR - 개발자에게 보고가 필요합니다", {
                id: error.id,
                message: error.message,
                timestamp: error.timestamp,
                context: error.context,
            });
        }
    }
    maintainLogSize() {
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog = this.errorLog.slice(-this.maxLogSize / 2);
        }
    }
    showErrorLog() {
        const panel = vscode.window.createWebviewPanel("hapaErrorLog", "HAPA 에러 로그", vscode.ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true,
        });
        const recentErrors = this.getRecentErrors(50);
        panel.webview.html = this.generateErrorLogHtml(recentErrors);
    }
    generateErrorLogHtml(errors) {
        const stats = this.getErrorStats();
        const errorItems = errors
            .map((error) => `
      <div class="error-item ${error.severity}" data-id="${error.id}">
        <div class="error-header">
          <span class="severity">${error.severity.toUpperCase()}</span>
          <span class="error-id">${error.id}</span>
          <span class="timestamp">${error.timestamp.toLocaleString()}</span>
          ${error.retryable ? '<span class="retryable">재시도 가능</span>' : ""}
        </div>
        <div class="error-message">${this.escapeHtml(error.message)}</div>
        ${error.stack
            ? `<details class="error-stack"><summary>스택 트레이스</summary><pre>${this.escapeHtml(error.stack)}</pre></details>`
            : ""}
        ${error.context
            ? `<details class="error-context"><summary>컨텍스트</summary><pre>${this.escapeHtml(JSON.stringify(error.context, null, 2))}</pre></details>`
            : ""}
      </div>
    `)
            .join("");
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>HAPA 에러 로그</title>
        <style>
          body { font-family: var(--vscode-font-family); margin: 20px; color: var(--vscode-foreground); }
          .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
          .stat-card { background: var(--vscode-editor-background); border: 1px solid var(--vscode-panel-border); padding: 15px; border-radius: 5px; }
          .stat-title { font-weight: bold; margin-bottom: 5px; }
          .error-item { border: 1px solid var(--vscode-panel-border); margin: 10px 0; padding: 15px; border-radius: 5px; }
          .error-item.critical { border-left: 4px solid #ff4444; }
          .error-item.high { border-left: 4px solid #ff8800; }
          .error-item.medium { border-left: 4px solid #ffaa00; }
          .error-item.low { border-left: 4px solid #88aa88; }
          .error-header { display: flex; gap: 10px; align-items: center; margin-bottom: 10px; flex-wrap: wrap; }
          .severity { font-weight: bold; padding: 2px 6px; border-radius: 3px; font-size: 0.8em; }
          .error-id { font-family: monospace; background: var(--vscode-textCodeBlock-background); padding: 2px 6px; border-radius: 3px; font-size: 0.8em; }
          .timestamp { color: var(--vscode-descriptionForeground); font-size: 0.9em; }
          .retryable { background: #4CAF50; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em; }
          .error-message { font-weight: 500; margin-bottom: 10px; }
          details { margin-top: 10px; }
          summary { cursor: pointer; font-weight: 500; }
          pre { background: var(--vscode-textCodeBlock-background); padding: 10px; border-radius: 3px; font-size: 0.85em; overflow-x: auto; margin: 5px 0; }
          .actions { margin-bottom: 20px; }
          .btn { background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; padding: 8px 16px; border-radius: 3px; cursor: pointer; margin-right: 10px; }
        </style>
      </head>
      <body>
        <h1>HAPA 에러 로그</h1>
        
        <div class="stats">
          <div class="stat-card">
            <div class="stat-title">전체 에러</div>
            <div>${stats.total}개</div>
          </div>
          <div class="stat-card">
            <div class="stat-title">24시간 내</div>
            <div>${stats.last24Hours}개</div>
          </div>
          <div class="stat-card">
            <div class="stat-title">재시도 가능</div>
            <div>${stats.retryableCount}개</div>
          </div>
          <div class="stat-card">
            <div class="stat-title">심각도별</div>
            <div>
              Critical: ${stats.bySeverity.critical}<br>
              High: ${stats.bySeverity.high}<br>
              Medium: ${stats.bySeverity.medium}<br>
              Low: ${stats.bySeverity.low}
            </div>
          </div>
        </div>

        <div class="actions">
          <button class="btn" onclick="clearLogs()">로그 지우기</button>
          <button class="btn" onclick="exportLogs()">로그 내보내기</button>
        </div>

        <div class="errors-container">
          ${errorItems}
        </div>

        <script>
          function clearLogs() {
            if (confirm('모든 에러 로그를 삭제하시겠습니까?')) {
              // VS Code 명령어 호출
              window.parent.postMessage({ command: 'clearErrorLogs' }, '*');
            }
          }
          
          function exportLogs() {
            window.parent.postMessage({ command: 'exportErrorLogs' }, '*');
          }
        </script>
      </body>
      </html>
    `;
    }
    reportErrorToGitHub(error) {
        const issueUrl = `https://github.com/your-repo/hapa-extension/issues/new?title=${encodeURIComponent(`[BUG] ${error.message}`)}&body=${encodeURIComponent(`
**에러 ID:** ${error.id}
**심각도:** ${error.severity}
**발생 시간:** ${error.timestamp.toISOString()}

**에러 메시지:**
${error.message}

**스택 트레이스:**
${error.stack || "N/A"}

**컨텍스트:**
\`\`\`json
${JSON.stringify(error.context, null, 2)}
\`\`\`
    `)}`;
        vscode.env.openExternal(vscode.Uri.parse(issueUrl));
    }
    escapeHtml(text) {
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    }
    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
exports.EnhancedErrorService = EnhancedErrorService;
//# sourceMappingURL=EnhancedErrorService.js.map