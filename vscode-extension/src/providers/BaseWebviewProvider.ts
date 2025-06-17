import * as vscode from "vscode";
import { apiClient, GenerateRequest, AIResponse } from "../modules/apiClient";
import { PromptExtractor, ExtractedPrompt } from "../modules/promptExtractor";
import { CodeInserter } from "../modules/inserter";

/**
 * 모든 웹뷰 프로바이더의 공통 기능을 제공하는 추상 베이스 클래스
 */
export abstract class BaseWebviewProvider
  implements vscode.WebviewViewProvider
{
  protected _view?: vscode.WebviewView;

  constructor(protected readonly _extensionUri: vscode.Uri) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this.getHtmlContent(webviewView.webview);
    this.setupMessageHandlers(webviewView.webview);
  }

  /**
   * HTML 콘텐츠를 반환합니다. 서브클래스에서 구현해야 합니다.
   */
  protected abstract getHtmlContent(webview: vscode.Webview): string;

  /**
   * 메시지 핸들러를 설정합니다. 서브클래스에서 오버라이드할 수 있습니다.
   */
  protected setupMessageHandlers(webview: vscode.Webview) {
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
  protected handleCustomMessage(message: any) {
    // 기본 구현 - 서브클래스에서 오버라이드
  }

  /**
   * AI 질문을 처리하는 공통 메서드
   */
  protected async handleAIQuestion(question: string, webview: vscode.Webview) {
    try {
      // 프롬프트와 컨텍스트 추출
      const extractedPrompt =
        PromptExtractor.combinePromptWithContext(question);

      // 백엔드 API 호출
      const request: GenerateRequest = {
        prompt: extractedPrompt.prompt,
        context: extractedPrompt.context,
        selectedCode: extractedPrompt.selectedCode,
        language: extractedPrompt.language,
        requestType: "generate",
      };

      // 로딩 상태 표시
      webview.postMessage({
        command: "showLoading",
        message: "AI가 응답을 생성하고 있습니다...",
      });

      // 실제 API 호출
      const response = await apiClient.generate(request);

      // 응답을 웹뷰에 전송
      webview.postMessage({
        command: "addAIResponse",
        response: {
          ...response,
          originalQuestion: question,
        },
      });
    } catch (error) {
      // 에러 처리
      webview.postMessage({
        command: "showError",
        error:
          error instanceof Error
            ? error.message
            : "응답 생성 중 오류가 발생했습니다.",
      });
    }
  }

  /**
   * 코드를 에디터에 삽입하는 공통 메서드
   */
  protected async insertCodeToEditor(code: string) {
    try {
      const success = await CodeInserter.smartInsert(code);
      if (success && this._view?.webview) {
        this._view.webview.postMessage({
          command: "insertSuccess",
          message: "코드가 성공적으로 삽입되었습니다.",
        });
      }
    } catch (error) {
      vscode.window.showErrorMessage(
        `코드 삽입 실패: ${
          error instanceof Error ? error.message : "알 수 없는 오류"
        }`
      );
    }
  }
}
