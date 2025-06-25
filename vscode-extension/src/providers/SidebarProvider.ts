import * as vscode from "vscode";
import { BaseWebviewProvider } from "./BaseWebviewProvider";
import { TriggerDetector, TriggerEvent } from "../modules/triggerDetector";
import { SidebarHtmlGenerator } from "../templates/SidebarHtmlGenerator";
import {
  apiClient,
  StreamingChunk,
  StreamingCallbacks,
} from "../modules/apiClient";

/**
 * 사이드바 대시보드 웹뷰 프로바이더 클래스
 */
export class SidebarProvider extends BaseWebviewProvider {
  private triggerDetector: TriggerDetector;
  // 히스토리 상태 관리를 위한 속성들 추가
  private questionHistory: Array<{
    question: string;
    response: string;
    timestamp: string;
  }> = [];
  private expandedPanels: vscode.WebviewPanel[] = []; // 열린 expand 패널들 추적

  constructor(extensionUri: vscode.Uri) {
    super(extensionUri);

    // TriggerDetector 초기화 및 이벤트 리스너 설정
    this.triggerDetector = new TriggerDetector();
    this.triggerDetector.onTrigger(this.handleTriggerEvent.bind(this));

    // 히스토리 로드
    this.loadHistory();
  }

  /**
   * 히스토리 로드 (VSCode globalState에서)
   */
  private loadHistory() {
    const context = this.getContext();
    const savedHistory =
      context?.globalState.get<
        Array<{ question: string; response: string; timestamp: string }>
      >("hapaHistory");
    if (savedHistory) {
      this.questionHistory = savedHistory;
    }
  }

  /**
   * 히스토리 저장 (VSCode globalState에)
   */
  private saveHistory() {
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
  private broadcastHistoryUpdate() {
    const historyData = JSON.stringify(this.questionHistory);

    // 사이드바에 전송
    if (this._view?.webview) {
      this._view.webview.postMessage({
        command: "syncHistory",
        history: historyData,
      });
    }

    // 모든 expand 패널에 전송
    this.expandedPanels.forEach((panel) => {
      if (panel.webview) {
        panel.webview.postMessage({
          command: "syncHistory",
          history: historyData,
        });
      }
    });
  }

  /**
   * 히스토리에 새 항목 추가
   */
  private addToHistory(question: string, response: string) {
    // 중복 질문 제한 (연속 3회까지)
    const recentSameQuestions = this.questionHistory
      .slice(0, 3)
      .filter(
        (item) =>
          item.question.trim().toLowerCase() === question.trim().toLowerCase()
      );

    if (recentSameQuestions.length < 3) {
      // 새로운 히스토리 항목 추가
      this.questionHistory.unshift({
        question: question,
        timestamp: new Date().toLocaleString("ko-KR"),
        response: response,
      });

      // 최대 20개까지만 저장
      if (this.questionHistory.length > 20) {
        this.questionHistory = this.questionHistory.slice(0, 20);
      }

      // 저장 및 동기화
      this.saveHistory();
    }
  }

  /**
   * 히스토리 항목 삭제
   */
  private deleteHistoryItem(index: number) {
    if (index >= 0 && index < this.questionHistory.length) {
      this.questionHistory.splice(index, 1);
      this.saveHistory();
      this.broadcastHistoryUpdate();
    }
  }

  /**
   * 확인 대화상자를 통한 히스토리 항목 삭제
   */
  private async confirmDeleteHistoryItem(index: number) {
    const confirmResult = await vscode.window.showWarningMessage(
      "이 기록을 삭제하시겠습니까?",
      "삭제",
      "취소"
    );

    if (confirmResult === "삭제") {
      this.deleteHistoryItem(index);
    }
  }

  /**
   * 확인 대화상자를 통한 모든 히스토리 삭제
   */
  private async confirmClearAllHistory() {
    const confirmResult = await vscode.window.showWarningMessage(
      "모든 히스토리를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.",
      "모두 삭제",
      "취소"
    );

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
  private getContext(): vscode.ExtensionContext | undefined {
    // BaseWebviewProvider나 Extension에서 context를 제공받을 수 있도록 하는 메서드
    // 실제 구현은 extension.ts에서 context를 전달받아야 함
    return (this as any)._context;
  }

  /**
   * Context 설정 메서드 (extension.ts에서 호출)
   */
  public setContext(context: vscode.ExtensionContext) {
    (this as any)._context = context;
    this.loadHistory(); // context 설정 후 히스토리 다시 로드

    // 에디터 변경 감지하여 코드 맥락 업데이트
    this.setupEditorContextMonitoring();
  }

  /**
   * 에디터 변경 감지 및 코드 맥락 모니터링 설정
   */
  private setupEditorContextMonitoring() {
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
  private updateCodeContext() {
    const contextInfo = this.getCodeContextInfo();

    // 사이드바에 코드 맥락 정보 전송
    if (this._view?.webview) {
      this._view.webview.postMessage({
        command: "updateCodeContext",
        context: contextInfo,
      });
    }

    // 모든 expand 패널에 코드 맥락 정보 전송
    this.expandedPanels.forEach((panel) => {
      if (panel.webview) {
        panel.webview.postMessage({
          command: "updateCodeContext",
          context: contextInfo,
        });
      }
    });
  }

  /**
   * 현재 코드 맥락 정보 수집
   */
  private getCodeContextInfo() {
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

  protected getHtmlContent(webview: vscode.Webview): string {
    return SidebarHtmlGenerator.generateSidebarHtml();
  }

  protected handleCustomMessage(message: any) {
    switch (message.command) {
      case "alert":
        vscode.window.showInformationMessage(message.text);
        return;
      case "openMainDashboard":
        this.openExpandedView();
        return;
      case "generateCodeStreaming":
        this.handleStreamingCodeGeneration(message.question);
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
      case "openUserSettings":
        // 사용자 설정 열기
        vscode.commands.executeCommand("hapa.openUserSettings");
        return;
      case "showGuide":
        // 가이드 표시
        vscode.commands.executeCommand("hapa.showGuide");
        return;
      case "refreshConnection":
        // 연결 새로고침 (상태 표시용)
        vscode.window.showInformationMessage("연결이 새로고침되었습니다.");
        return;
      case "continueResponse":
        // 응답 이어가기 처리
        this.handleContinueResponse(
          message.previousContent,
          message.continuePrompt
        );
        return;
    }
  }

  /**
   * 응답 이어가기 처리
   */
  private async handleContinueResponse(
    previousContent: string,
    continuePrompt: string
  ) {
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

    if (
      activeEditor &&
      activeEditor.selection &&
      !activeEditor.selection.isEmpty
    ) {
      codeContext = activeEditor.document.getText(activeEditor.selection);
    }

    // 스트리밍 콜백 설정
    const callbacks: StreamingCallbacks = {
      onStart: () => {
        // 시작 신호는 UI에서 이미 처리됨
      },

      onChunk: (chunk: StreamingChunk) => {
        if (this._view?.webview) {
          this._view.webview.postMessage({
            command: "streamingChunk",
            chunk: chunk,
          });
        }
      },

      onComplete: (fullContent: string) => {
        if (this._view?.webview) {
          this._view.webview.postMessage({
            command: "streamingComplete",
            content: fullContent,
          });
        }
      },

      onError: (error: Error) => {
        if (this._view?.webview) {
          this._view.webview.postMessage({
            command: "streamingError",
            error: error.message,
          });
        }
        vscode.window.showErrorMessage(`응답 이어가기 오류: ${error.message}`);
      },
    };

    try {
      await apiClient.generateCodeStreaming(fullPrompt, codeContext, callbacks);
    } catch (error) {
      console.error("응답 이어가기 실패:", error);
      callbacks.onError?.(
        error instanceof Error ? error : new Error("알 수 없는 오류")
      );
    }
  }

  /**
   * 스트리밍 코드 생성 처리
   */
  private async handleStreamingCodeGeneration(question: string) {
    if (!this._view?.webview) {
      return;
    }

    // 현재 활성 편집기의 컨텍스트 가져오기
    const activeEditor = vscode.window.activeTextEditor;
    let codeContext = undefined;

    if (
      activeEditor &&
      activeEditor.selection &&
      !activeEditor.selection.isEmpty
    ) {
      codeContext = activeEditor.document.getText(activeEditor.selection);
    }

    // 스트리밍 콜백 설정
    const callbacks: StreamingCallbacks = {
      onStart: () => {
        // 시작 신호는 UI에서 이미 처리됨
      },

      onChunk: (chunk: StreamingChunk) => {
        if (this._view?.webview) {
          this._view.webview.postMessage({
            command: "streamingChunk",
            chunk: chunk,
          });
        }
      },

      onComplete: (fullContent: string) => {
        if (this._view?.webview) {
          this._view.webview.postMessage({
            command: "streamingComplete",
            content: fullContent,
          });
        }
        // 히스토리에 추가 (question은 UI에서 전달받을 예정)
      },

      onError: (error: Error) => {
        if (this._view?.webview) {
          this._view.webview.postMessage({
            command: "streamingError",
            error: error.message,
          });
        }
        vscode.window.showErrorMessage(`코드 생성 오류: ${error.message}`);
      },
    };

    try {
      await apiClient.generateCodeStreaming(question, codeContext, callbacks);
    } catch (error) {
      console.error("스트리밍 코드 생성 실패:", error);
      callbacks.onError?.(
        error instanceof Error ? error : new Error("알 수 없는 오류")
      );
    }
  }

  /**
   * 생성된 코드를 활성 편집기에 삽입
   */
  private async insertCodeToActiveEditor(code: string) {
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
        } else {
          // 선택된 텍스트가 없으면 커서 위치에 삽입
          editBuilder.insert(activeEditor.selection.active, code);
        }
      });

      vscode.window.showInformationMessage("코드가 성공적으로 삽입되었습니다.");
    } catch (error) {
      vscode.window.showErrorMessage(
        `코드 삽입 실패: ${
          error instanceof Error ? error.message : "알 수 없는 오류"
        }`
      );
    }
  }

  /**
   * TriggerDetector에서 발생한 이벤트 처리
   */
  private async handleTriggerEvent(event: TriggerEvent) {
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
      await this.handleStreamingCodeGeneration(prompt);
    } catch (error) {
      // 에러 처리
      this._view.webview.postMessage({
        command: "streamingError",
        error:
          error instanceof Error
            ? error.message
            : "알 수 없는 오류가 발생했습니다.",
      });
    }
  }

  /**
   * 확장된 뷰를 메인 패널에 열기
   */
  private openExpandedView() {
    // 새로운 웹뷰 패널 생성
    const panel = vscode.window.createWebviewPanel(
      "hapaExpandedView",
      "HAPA - Expanded View",
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [this._extensionUri],
      }
    );

    // 패널을 추적 목록에 추가
    this.expandedPanels.push(panel);

    // 확장된 뷰의 HTML 콘텐츠 설정
    panel.webview.html = this.getExpandedViewHtml(panel.webview);

    // 확장된 뷰의 메시지 처리
    panel.webview.onDidReceiveMessage(
      (message) => {
        this.handleExpandedViewMessage(message, panel);
      },
      undefined,
      []
    );

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
  private getExpandedViewHtml(webview: vscode.Webview): string {
    // 사이드바와 동일한 HTML을 사용하되, 확장된 뷰용으로 약간 수정
    return SidebarHtmlGenerator.generateSidebarHtml()
      .replace(
        "<title>HAPA - Sidebar Dashboard</title>",
        "<title>HAPA - Expanded View</title>"
      )
      .replace(
        "const vscode = acquireVsCodeApi();",
        `const vscode = acquireVsCodeApi();
      // 확장된 뷰 플래그 설정
      window.isExpandedView = true;`
      );
  }

  /**
   * 확장된 뷰의 메시지 처리
   */
  private handleExpandedViewMessage(message: any, panel: vscode.WebviewPanel) {
    switch (message.command) {
      case "generateCodeStreaming":
        this.handleExpandedStreamingCodeGeneration(message.question, panel);
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
      case "openUserSettings":
        // 사용자 설정 열기
        vscode.commands.executeCommand("hapa.openUserSettings");
        return;
      case "showGuide":
        // 가이드 표시
        vscode.commands.executeCommand("hapa.showGuide");
        return;
      case "refreshConnection":
        // 연결 새로고침 (상태 표시용)
        vscode.window.showInformationMessage("연결이 새로고침되었습니다.");
        return;
    }
  }

  /**
   * 확장된 뷰에서의 스트리밍 코드 생성 처리
   */
  private async handleExpandedStreamingCodeGeneration(
    question: string,
    panel: vscode.WebviewPanel
  ) {
    if (!panel.webview) {
      return;
    }

    // 현재 활성 편집기의 컨텍스트 가져오기
    const activeEditor = vscode.window.activeTextEditor;
    let codeContext = undefined;

    if (
      activeEditor &&
      activeEditor.selection &&
      !activeEditor.selection.isEmpty
    ) {
      codeContext = activeEditor.document.getText(activeEditor.selection);
    }

    // 스트리밍 콜백 설정
    const callbacks: StreamingCallbacks = {
      onStart: () => {
        // 시작 신호는 UI에서 이미 처리됨
      },

      onChunk: (chunk: StreamingChunk) => {
        if (panel.webview) {
          panel.webview.postMessage({
            command: "streamingChunk",
            chunk: chunk,
          });
        }
      },

      onComplete: (fullContent: string) => {
        if (panel.webview) {
          panel.webview.postMessage({
            command: "streamingComplete",
            content: fullContent,
          });
        }
        // 히스토리에 추가 (question은 UI에서 전달받을 예정)
      },

      onError: (error: Error) => {
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
      await apiClient.generateCodeStreaming(question, codeContext, callbacks);
    } catch (error) {
      console.error("스트리밍 코드 생성 실패:", error);
      callbacks.onError?.(
        error instanceof Error ? error : new Error("알 수 없는 오류")
      );
    }
  }

  /**
   * API 상태 업데이트 (ExtensionManager에서 호출)
   */
  public async updateApiStatus(): Promise<void> {
    // API 연결 상태 확인 및 업데이트
    try {
      const response = await fetch("http://localhost:8000/api/v1/health");
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
    } catch (error) {
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
  public updateContext(): void {
    this.updateCodeContext();
  }

  /**
   * 트리거 감지 (ExtensionManager에서 호출)
   */
  public detectTriggers(event: vscode.TextDocumentChangeEvent): void {
    // 텍스트 변경 이벤트에서 트리거 감지
    for (const change of event.contentChanges) {
      if (
        change.text.includes("#") ||
        change.text.includes("TODO:") ||
        change.text.includes("FIXME:")
      ) {
        // 트리거 감지 시 처리
        const extractedPrompt = {
          prompt: `코멘트에서 감지된 요청: ${change.text}`,
          context: event.document.getText(),
          selectedText: change.text,
          fileName: event.document.fileName,
          language: event.document.languageId,
          lineNumber: 0,
          suggestion: change.text,
        };

        const triggerEvent: TriggerEvent = {
          type: "manual",
          action: "custom",
          data: extractedPrompt,
          timestamp: new Date(),
        };

        this.handleTriggerEvent(triggerEvent);
      }
    }
  }

  /**
   * 코드 분석 (ExtensionManager에서 호출)
   */
  public async analyzeCode(code: string): Promise<void> {
    const question = `다음 코드를 분석해주세요:\n\n${code}`;
    await this.handleStreamingCodeGeneration(question);
  }

  /**
   * 테스트 생성 (ExtensionManager에서 호출)
   */
  public async generateTest(code: string): Promise<void> {
    const question = `다음 코드에 대한 단위 테스트를 작성해주세요:\n\n${code}`;
    await this.handleStreamingCodeGeneration(question);
  }

  /**
   * 코드 설명 (ExtensionManager에서 호출)
   */
  public async explainCode(code: string): Promise<void> {
    const question = `다음 코드가 어떤 일을 하는지 설명해주세요:\n\n${code}`;
    await this.handleStreamingCodeGeneration(question);
  }
}
