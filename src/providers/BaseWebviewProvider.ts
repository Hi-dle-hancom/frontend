import * as vscode from "vscode";
import {
  apiClient,
  CodeGenerationRequest,
  CodeGenerationResponse,
} from "../modules/apiClient";
import { PromptExtractor, ExtractedPrompt } from "../modules/promptExtractor";
import { CodeInserter } from "../modules/inserter";

/**
 * 모든 웹뷰 프로바이더의 공통 기능을 제공하는 추상 베이스 클래스
 */
export abstract class BaseWebviewProvider
  implements vscode.WebviewViewProvider
{
  protected _view?: vscode.WebviewView;
  protected _panel?: vscode.WebviewPanel;

  constructor(protected readonly _extensionUri: vscode.Uri) {}

  /**
   * 웹뷰 패널을 생성하여 표시합니다.
   */
  public show(): void {
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
      this._panel = vscode.window.createWebviewPanel(
        this.getPanelType(),
        this.getPanelTitle(),
        columnToShowIn || vscode.ViewColumn.One,
        {
          enableScripts: true,
          localResourceRoots: [this._extensionUri],
          retainContextWhenHidden: true,
        }
      );

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
    } catch (error) {
      console.error(
        `❌ [${this.constructor.name}] show() 메서드 실행 중 오류:`,
        error
      );
      vscode.window.showErrorMessage(
        `웹뷰 표시 중 오류가 발생했습니다: ${error}`
      );
    }
  }

  /**
   * 패널 타입을 반환합니다. 서브클래스에서 구현해야 합니다.
   */
  protected abstract getPanelType(): string;

  /**
   * 패널 제목을 반환합니다. 서브클래스에서 구현해야 합니다.
   */
  protected abstract getPanelTitle(): string;

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

    // 웹뷰 준비 완료 후 서브클래스에 알림
    setTimeout(() => {
      this.onWebviewReady();
    }, 100);
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
      console.log(
        `🔔 [${this.constructor.name}] 메시지 수신:`,
        message.command
      );

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
  protected handleCustomMessage(message: any) {
    // 기본 구현 - 서브클래스에서 오버라이드
  }

  /**
   * 웹뷰가 준비되었을 때 호출됩니다. 서브클래스에서 오버라이드할 수 있습니다.
   */
  protected onWebviewReady(): void {
    // 기본 구현 - 서브클래스에서 오버라이드
  }

  /**
   * AI 질문을 처리하는 공통 메서드 (강화된 안전성 확인 및 JSON 파싱)
   */
  protected async handleAIQuestion(question: string, webview: vscode.Webview) {
    try {
      // vscode API 안전성 확인
      if (!vscode || !vscode.workspace) {
        throw new Error(
          "VSCode API가 초기화되지 않았습니다. 다시 시도해주세요."
        );
      }

      console.log("🤖 BaseWebviewProvider AI 질문 처리:", {
        question_length: question.length,
        workspace_available: !!vscode.workspace,
      });

      // 프롬프트와 컨텍스트 추출
      const extractedPrompt =
        PromptExtractor.combinePromptWithContext(question);

      // 백엔드 API 호출
      const request: CodeGenerationRequest = {
        prompt: question,
        context: extractedPrompt.context,
        model_type: "CODE_GENERATION" as any,
        language: "python",
      };

      // 로딩 상태 표시
      webview.postMessage({
        command: "showLoading",
        message: "AI가 응답을 생성하고 있습니다...",
      });

      // 실제 API 호출
      const response = await apiClient.generateCode(request);

      // 성공 응답 처리 및 JSON 파싱
      if (response.success && response.generated_code) {
        // generated_code가 JSON 형태인지 확인하고 파싱
        let finalCode = response.generated_code;

        try {
          // JSON 형태인지 확인 ({"text": "실제코드"} 구조)
          if (
            typeof finalCode === "string" &&
            finalCode.trim().startsWith("{")
          ) {
            const parsedCode = JSON.parse(finalCode);
            if (parsedCode.text) {
              finalCode = parsedCode.text;
              console.log(
                "✅ BaseWebviewProvider JSON 응답에서 text 필드 추출 성공"
              );
            }
          }
        } catch (parseError) {
          console.log(
            "ℹ️ BaseWebviewProvider JSON 파싱 불가, 원본 코드 사용:",
            parseError
          );
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
      } else {
        // 오류 응답 처리
        webview.postMessage({
          command: "showError",
          error: response.error_message || "응답 생성에 실패했습니다.",
        });
      }
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
