import * as vscode from "vscode";
import { BaseWebviewProvider } from "./BaseWebviewProvider";
import { TriggerDetector, TriggerEvent } from "../modules/triggerDetector";
import { SidebarHtmlGenerator } from "../templates/SidebarHtmlGenerator";

/**
 * 사이드바 대시보드 웹뷰 프로바이더 클래스
 */
export class SidebarProvider extends BaseWebviewProvider {
  private triggerDetector: TriggerDetector;

  constructor(extensionUri: vscode.Uri) {
    super(extensionUri);

    // TriggerDetector 초기화 및 이벤트 리스너 설정
    this.triggerDetector = new TriggerDetector();
    this.triggerDetector.onTrigger(this.handleTriggerEvent.bind(this));
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
        vscode.commands.executeCommand("hapa.openDashboard");
        return;
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

      // AI 질문으로 변환하여 처리
      const prompt = event.data.prompt;
      await this.handleAIQuestion(prompt, this._view.webview);
    } catch (error) {
      // 에러 처리
      this._view.webview.postMessage({
        command: "showError",
        error:
          error instanceof Error
            ? error.message
            : "알 수 없는 오류가 발생했습니다.",
      });
    }
  }
}
