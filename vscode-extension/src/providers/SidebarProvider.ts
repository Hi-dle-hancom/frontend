
import * as vscode from "vscode";
import { BaseWebviewProvider } from "./BaseWebviewProvider";
import { TriggerDetector, TriggerEvent } from "../modules/triggerDetector";
import { ExtractedPrompt } from "../modules/promptExtractor";
import { CodeGenerationRequest } from "../modules/apiClient";
import { SidebarHtmlGenerator } from "../templates/SidebarHtmlGenerator";
import {
  apiClient,
  StreamingChunk,
  StreamingCallbacks,
} from "../modules/apiClient";
import { VLLMModelType } from "../modules/apiClient";

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
  private readonly maxHistorySize = 50; // 최대 50개 히스토리 유지

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
    console.log("📚 히스토리 저장 시도:", {
      question_preview: question.substring(0, 50) + "...",
      response_length: response.length,
      current_history_count: this.questionHistory.length,
    });

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

      // 최대 50개까지만 저장
      if (this.questionHistory.length > this.maxHistorySize) {
        this.questionHistory = this.questionHistory.slice(
          0,
          this.maxHistorySize
        );
      }

      // 저장 및 동기화
      this.saveHistory();

      console.log("✅ 히스토리 저장 완료:", {
        total_count: this.questionHistory.length,
        saved_timestamp: new Date().toLocaleString("ko-KR"),
      });
    } else {
      console.log("⚠️ 히스토리 저장 스킵 (중복 질문 제한):", {
        duplicate_count: recentSameQuestions.length,
        question_preview: question.substring(0, 50) + "...",
      });
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
      case "generateBugFixStreaming":
        this.handleBugFixStreamingCodeGeneration(
          message.question,
          message.model_type
        );
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
    let codeContext: string | undefined = undefined;

    if (
      activeEditor &&
      activeEditor.selection &&
      !activeEditor.selection.isEmpty
    ) {
      codeContext = activeEditor.document.getText(activeEditor.selection);
    }

    // 응답 시간 제한 (30초)
    const timeoutPromise = new Promise<void>((_, reject) => {
      setTimeout(() => {
        reject(new Error("응답 시간이 초과되었습니다. 다시 시도해주세요."));
      }, 30000);
    });

    // 스트리밍 요청과 타임아웃 경쟁
    const streamingPromise = new Promise<void>(async (resolve, reject) => {
      try {
        const response = await fetch(
          "http://3.13.240.111:8000/api/v1/generate",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              prompt: fullPrompt,
              context: codeContext || "",
              model_type: "code_generation",
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
            }),
          }
        );

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
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.trim() === "") continue;

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
                  if (
                    parsedContent.length + parsed.text.length >
                    maxContentLength
                  ) {
                    parsedContent +=
                      "\n\n⚠️ **응답이 너무 길어 일부가 생략되었습니다.**";
                    resolve();
                    return;
                  }

                  parsedContent += parsed.text;

                  // 실시간 정리 및 전송
                  const cleanedContent = this.cleanStreamingContent(
                    parsed.text
                  );
                  if (cleanedContent.trim()) {
                    this._view?.webview.postMessage({
                      type: "streamingResponse",
                      content: cleanedContent,
                    });
                  }
                }
              } catch (e) {
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
      } catch (error) {
        console.error("응답 이어가기 실패:", error);

        // 사용자에게 구체적인 오류 메시지 제공
        let errorMessage = "응답 이어가기 중 오류가 발생했습니다.";

        if (error instanceof Error) {
          if (error.message.includes("응답 시간이 초과")) {
            errorMessage =
              "⏱️ 응답 시간이 초과되었습니다. 더 간단한 질문으로 다시 시도해주세요.";
          } else if (error.message.includes("HTTP error")) {
            errorMessage =
              "🌐 서버 연결 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
          } else if (error.message.includes("응답을 읽을 수 없습니다")) {
            errorMessage =
              "📡 응답 데이터를 읽는 중 오류가 발생했습니다. 다시 시도해주세요.";
          } else {
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
  private async handleBugFixStreamingCodeGeneration(
    question: string,
    modelType: string = "bug_fix"
  ) {
    if (!this._view?.webview) {
      return;
    }

    console.log("🐛 ERROR 모드 전송 디버깅:", {
      question: question,
      modelType: modelType,
      originalModelType: modelType,
      expectedModelType: "bug_fix",
    });

    // 현재 활성 편집기의 컨텍스트 가져오기
    const activeEditor = vscode.window.activeTextEditor;
    let codeContext: string | undefined = undefined;

    if (
      activeEditor &&
      activeEditor.selection &&
      !activeEditor.selection.isEmpty
    ) {
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

    // 스트리밍 콜백 설정
    const callbacks = {
      onStart: () => {
        // 시작 신호는 UI에서 이미 처리됨
      },

      onChunk: (chunk: StreamingChunk) => {
        if (this._view?.webview) {
          // 스트리밍 청크 전송
          this._view.webview.postMessage({
            command: "streamingChunk",
            chunk: chunk,
          });

          // 최종 콘텐츠 누적 (정리된 버전)
          if (chunk.type === "token" || chunk.type === "code") {
            const cleanedContent = this.cleanStreamingContent(chunk.content);
            finalStreamingContent += cleanedContent;
          }
        }
      },

      onComplete: () => {
        if (this._view?.webview) {
          // JSON 파싱 시도
          let parsedContent = finalStreamingContent;
          try {
            // JSON 형태인지 확인 ({"text": "실제코드"} 구조)
            if (
              typeof parsedContent === "string" &&
              parsedContent.trim().startsWith("{")
            ) {
              const parsedCode = JSON.parse(parsedContent);
              if (parsedCode.text) {
                parsedContent = parsedCode.text;
                console.log(
                  "✅ 버그 수정 스트리밍 응답에서 JSON text 필드 추출 성공"
                );
              }
            }
          } catch (parseError) {
            console.log(
              "ℹ️ 버그 수정 스트리밍 JSON 파싱 불가, 원본 사용:",
              parseError
            );
            // JSON 파싱에 실패하면 원본 그대로 사용
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
          this._view.webview.postMessage({
            command: "streamingComplete",
            finalContent: finalCleanedContent,
          });

          // 히스토리에 추가 (정리된 콘텐츠로 저장)
          this.addToHistory(question, finalCleanedContent);

          console.log("✅ 버그 수정 스트리밍 완료 및 응답 정리 적용:", {
            original_length: finalStreamingContent.length,
            cleaned_length: finalCleanedContent.length,
            was_cleaned: finalStreamingContent !== finalCleanedContent,
          });
        }
      },

      onError: (error: any) => {
        if (this._view?.webview) {
          this._view.webview.postMessage({
            command: "streamingError",
            error: error.message || error.toString(),
          });
        }
        vscode.window.showErrorMessage(
          `버그 수정 오류: ${error.message || error.toString()}`
        );
      },
    };

    try {
      // 버그 수정 전용으로 직접 API 호출
      await apiClient.generateCodeStream(
        bugFixRequest as any,
        callbacks.onChunk || (() => {}),
        callbacks.onComplete,
        callbacks.onError
      );
    } catch (error) {
      console.error("버그 수정 스트리밍 실패:", error);
      callbacks.onError?.(
        error instanceof Error ? error : new Error("알 수 없는 오류")
      );
    }
  }

  /**
   * 스트리밍 코드 생성 처리 (JSON 파싱 포함)
   */
  private async handleStreamingCodeGeneration(question: string) {
    if (!this._view?.webview) {
      return;
    }

    // 현재 활성 편집기의 컨텍스트 가져오기
    const activeEditor = vscode.window.activeTextEditor;
    let codeContext: string | undefined = undefined;

    if (
      activeEditor &&
      activeEditor.selection &&
      !activeEditor.selection.isEmpty
    ) {
      codeContext = activeEditor.document.getText(activeEditor.selection);
    }

    // 스트리밍 완료 후 최종 응답 저장용 변수
    let finalStreamingContent = "";

    // 스트리밍 콜백 설정
    const callbacks = {
      onStart: () => {
        // 시작 신호는 UI에서 이미 처리됨
      },

      onChunk: (chunk: StreamingChunk) => {
        if (this._view?.webview) {
          // 스트리밍 청크 전송
          this._view.webview.postMessage({
            command: "streamingChunk",
            chunk: chunk,
          });

          // 최종 콘텐츠 누적 (정리된 버전)
          if (chunk.type === "token" || chunk.type === "code") {
            const cleanedContent = this.cleanStreamingContent(chunk.content);
            finalStreamingContent += cleanedContent;
          }
        }
      },

      onComplete: () => {
        if (this._view?.webview) {
          // JSON 파싱 시도
          let parsedContent = finalStreamingContent;
          try {
            // JSON 형태인지 확인 ({"text": "실제코드"} 구조)
            if (
              typeof parsedContent === "string" &&
              parsedContent.trim().startsWith("{")
            ) {
              const parsedCode = JSON.parse(parsedContent);
              if (parsedCode.text) {
                parsedContent = parsedCode.text;
                console.log("✅ 스트리밍 응답에서 JSON text 필드 추출 성공");
              }
            }
          } catch (parseError) {
            console.log("ℹ️ 스트리밍 JSON 파싱 불가, 원본 사용:", parseError);
            // JSON 파싱에 실패하면 원본 그대로 사용
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
          this._view.webview.postMessage({
            command: "streamingComplete",
            finalContent: finalCleanedContent,
          });

          // 히스토리에 추가 (정리된 콘텐츠로 저장)
          this.addToHistory(question, finalCleanedContent);

          console.log("✅ 스트리밍 완료 및 응답 정리 적용:", {
            original_length: finalStreamingContent.length,
            cleaned_length: finalCleanedContent.length,
            was_cleaned: finalStreamingContent !== finalCleanedContent,
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
        vscode.window.showErrorMessage(`코드 생성 오류: ${error.message}`);
      },
    };

    try {
      await apiClient.generateCodeStreaming(
        question,
        codeContext || "",
        callbacks
      );
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
      await this.handleAIQuestion(prompt);
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
   * AI 질문 처리 (SidebarProvider 전용 - 스트리밍 방식만 사용)
   */
  protected async handleAIQuestion(question: string) {
    // 스트리밍 방식으로만 처리하여 중복 방지
    await this.handleStreamingCodeGeneration(question);
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
      case "generateBugFixStreaming":
        this.handleExpandedBugFixStreamingCodeGeneration(
          message.question,
          panel,
          message.model_type
        );
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
   * 확장된 뷰에서의 버그 수정 스트리밍 코드 생성 처리
   */
  private async handleExpandedBugFixStreamingCodeGeneration(
    question: string,
    panel: vscode.WebviewPanel,
    modelType: string = "bug_fix"
  ) {
    if (!panel.webview) {
      return;
    }

    // 현재 활성 편집기의 컨텍스트 가져오기
    const activeEditor = vscode.window.activeTextEditor;
    let codeContext: string | undefined = undefined;

    if (
      activeEditor &&
      activeEditor.selection &&
      !activeEditor.selection.isEmpty
    ) {
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

      onChunk: (chunk: StreamingChunk) => {
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

      onError: (error: any) => {
        if (panel.webview) {
          panel.webview.postMessage({
            command: "streamingError",
            error: error.message || error.toString(),
          });
        }
        vscode.window.showErrorMessage(
          `버그 수정 오류: ${error.message || error.toString()}`
        );
      },
    };

    try {
      await apiClient.generateCodeStream(
        bugFixRequest as any,
        callbacks.onChunk || (() => {}),
        callbacks.onComplete,
        callbacks.onError
      );
    } catch (error) {
      console.error("확장된 뷰 버그 수정 스트리밍 실패:", error);
      callbacks.onError?.(
        error instanceof Error ? error : new Error("알 수 없는 오류")
      );
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
    let codeContext: string | undefined = undefined;

    if (
      activeEditor &&
      activeEditor.selection &&
      !activeEditor.selection.isEmpty
    ) {
      codeContext = activeEditor.document.getText(activeEditor.selection);
    }

    // 스트리밍 콜백 설정
    const callbacks = {
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

      onComplete: () => {
        if (panel.webview) {
          panel.webview.postMessage({
            command: "streamingComplete",
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
      await apiClient.generateCodeStreaming(
        question,
        codeContext || "",
        callbacks
      );
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
      const response = await fetch("http://3.13.240.111:8000/api/v1/health");
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
   * 트리거 감지 (ExtensionManager에서 호출) - 개선된 버전
   */
  public detectTriggers(event: vscode.TextDocumentChangeEvent): void {
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
        const analyzedPrompt = this.analyzeCommentContent(
          changedText,
          event.document,
          change.range
        );

        if (analyzedPrompt) {
          const triggerEvent: TriggerEvent = {
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
  private isCommentTrigger(text: string): boolean {
    // 단순 # 문자만으로는 트리거하지 않음
    if (!text.includes("#")) {
      return false;
    }

    // 주석 패턴 감지
    const commentPatterns = [
      /^\s*#\s*TODO[:\s]/i, // TODO 주석
      /^\s*#\s*FIXME[:\s]/i, // FIXME 주석
      /^\s*#\s*생성[:\s]/, // 한국어: 생성
      /^\s*#\s*만들어[:\s]/, // 한국어: 만들어
      /^\s*#\s*작성[:\s]/, // 한국어: 작성
      /^\s*#\s*구현[:\s]/, // 한국어: 구현
      /^\s*#\s*추가[:\s]/, // 한국어: 추가
      /^\s*#\s*수정[:\s]/, // 한국어: 수정
      /^\s*#\s*개선[:\s]/, // 한국어: 개선
      /^\s*#\s*[가-힣\w]+.*함수/, // ~함수
      /^\s*#\s*[가-힣\w]+.*클래스/, // ~클래스
      /^\s*#\s*[가-힣\w]+.*메서드/, // ~메서드
      /^\s*#\s*create[:\s]/i, // 영어: create
      /^\s*#\s*make[:\s]/i, // 영어: make
      /^\s*#\s*implement[:\s]/i, // 영어: implement
      /^\s*#\s*add[:\s]/i, // 영어: add
      /^\s*#\s*write[:\s]/i, // 영어: write
    ];

    return commentPatterns.some((pattern) => pattern.test(text));
  }

  /**
   * 주석 내용 분석 및 프롬프트 생성
   */
  private analyzeCommentContent(
    commentText: string,
    document: vscode.TextDocument,
    range: vscode.Range
  ): ExtractedPrompt | null {
    try {
      // 주석에서 # 제거하고 정리
      const cleanComment = commentText.replace(/^\s*#\s*/, "").trim();

      if (!cleanComment) {
        return null;
      }

      // 의도 분석
      const intent = this.analyzeCommentIntent(cleanComment);

      // 컨텍스트 추출 (주석 주변 코드)
      const contextRange = new vscode.Range(
        Math.max(0, range.start.line - 3),
        0,
        Math.min(document.lineCount - 1, range.end.line + 10),
        0
      );
      const contextCode = document.getText(contextRange);

      // AI가 이해할 수 있는 프롬프트 구성
      const aiPrompt = this.constructAIPrompt(
        cleanComment,
        intent,
        contextCode
      );

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
    } catch (error) {
      console.error("❌ 주석 분석 중 오류:", error);
      return null;
    }
  }

  /**
   * 주석 의도 분석
   */
  private analyzeCommentIntent(comment: string): string {
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
  private constructAIPrompt(
    comment: string,
    intent: string,
    context: string
  ): string {
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

  /**
   * 스트리밍 콘텐츠 정리
   */
  private cleanStreamingContent(content: string): string {
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
      cleaned = cleaned.replace(pattern, replacement as string);
    });

    // 4. 불필요한 공백 및 줄바꿈 정리
    cleaned = cleaned.replace(/\n{3,}/g, "\n\n");
    cleaned = cleaned.replace(/\s+$/gm, "");

    return cleaned.trim();
  }

  private finalizeResponse(content: string): string {
    if (!content) return content;

    let finalized = content;

    // 1. 중복된 코드 블록 완전 제거
    const lines = finalized.split("\n");
    const uniqueLines: string[] = [];
    const seenFunctions = new Set<string>();
    let skipUntilEnd = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // 중복된 main 블록 스킵
      if (
        line.includes('if __name__ == "__main__"') &&
        seenFunctions.has("main_block")
      ) {
        skipUntilEnd = true;
        continue;
      }

      // doctest 관련 중복 제거
      if (line.includes("doctest.testmod()") && seenFunctions.has("doctest")) {
        continue;
      }

      // timer 관련 중복 제거
      if (
        line.includes("from timeit import default_timer") &&
        seenFunctions.has("timer")
      ) {
        skipUntilEnd = true;
        continue;
      }

      if (skipUntilEnd) {
        // 다음 함수나 클래스 정의까지 스킵
        if (
          line.startsWith("def ") ||
          line.startsWith("class ") ||
          (line.startsWith("if ") && line.includes("__name__"))
        ) {
          skipUntilEnd = false;
          if (!seenFunctions.has("main_block") && line.includes("__name__")) {
            seenFunctions.add("main_block");
          }
        } else {
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

  private cleanupComplexCode(content: string): string {
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
    cleaned = cleaned.replace(
      /if __name_ _== "_ ___":/g,
      'if __name__ == "__main__":'
    );
    cleaned = cleaned.replace(/\{"text"rint/g, "print");
    cleaned = cleaned.replace(
      /print\(f"\{__file_\{"/g,
      'print(f"{__file__}\\n{'
    );

    // 추가 문법 오류 수정
    cleaned = cleaned.replace(
      /print\("Exception occurred repr\(e\)\)/g,
      'print(f"Exception occurred: {repr(e)}")'
    );
    cleaned = cleaned.replace(/raise\|im_end\|/g, "raise");
    cleaned = cleaned.replace(
      /__all__ = \[calculate"\]/g,
      '__all__ = ["calculate"]'
    );
    cleaned = cleaned.replace(/"([^"]*)" "([^"]*)"/g, '"$1", "$2"'); // 쉼표 누락 수정
    cleaned = cleaned.replace(
      /\[([^,\]]*)"([^,\]]*)" ([^,\]]*)"([^,\]]*)"([^,\]]*)"\]/g,
      '["$1", "$2", "$3", "$4", "$5"]'
    ); // 복잡한 배열 수정

    // 3. 불완전한 함수 종료 정리
    cleaned = cleaned.replace(
      /return eval\(output\)<\|im_end\|>/g,
      "return eval(output)"
    );
    cleaned = cleaned.replace(/print\(eval\(output\)\)<\|im_end\|>/g, "");
    cleaned = cleaned.replace(/quit\(\)<\|im_end\|>/g, "");

    // 4. 중복된 main 블록 정리
    const mainBlocks = cleaned.match(
      /if __name__ == "__main__":[\s\S]*?(?=\n\w|\n$|$)/g
    );
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
      } else {
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
}
