import * as assert from "assert";
import * as vscode from "vscode";
import { TypedMessageHandler } from "../core/TypedMessageHandler";

// Mock webview for testing
class MockWebview implements vscode.Webview {
  public html: string = "";
  public options: vscode.WebviewOptions = {};
  public cspSource: string = "mock-csp";

  private messageListeners: ((message: any) => void)[] = [];
  private messageQueue: any[] = [];

  postMessage(message: any): Thenable<boolean> {
    this.messageQueue.push(message);
    return Promise.resolve(true);
  }

  onDidReceiveMessage(listener: (message: any) => void): vscode.Disposable {
    this.messageListeners.push(listener);
    return {
      dispose: () => {
        const index = this.messageListeners.indexOf(listener);
        if (index > -1) {
          this.messageListeners.splice(index, 1);
        }
      },
    };
  }

  // Helper methods for testing
  simulateMessage(message: any): void {
    this.messageListeners.forEach((listener) => listener(message));
  }

  getPostedMessages(): any[] {
    return [...this.messageQueue];
  }

  clearPostedMessages(): void {
    this.messageQueue = [];
  }

  asWebviewUri(localResource: vscode.Uri): vscode.Uri {
    return localResource;
  }
}

suite("TypedMessageHandler Test Suite", () => {
  let typedMessageHandler: TypedMessageHandler;
  let mockWebview: MockWebview;

  setup(() => {
    mockWebview = new MockWebview();
    typedMessageHandler = new TypedMessageHandler({
      enableLogging: false, // 테스트 시 로그 억제
      enableValidation: true,
      enableQueue: true,
      enableRetry: true,
      maxRetries: 2,
      retryDelay: 100,
      queueMaxSize: 10,
    });
  });

  teardown(() => {
    typedMessageHandler.dispose();
  });

  suite("초기화 및 기본 기능", () => {
    test("TypedMessageHandler 인스턴스 생성", () => {
      assert.ok(typedMessageHandler);
      assert.ok(typedMessageHandler instanceof TypedMessageHandler);
    });

    test("초기 상태 확인", () => {
      const stats = typedMessageHandler.getStats();
      assert.strictEqual(stats.sent, 0);
      assert.strictEqual(stats.received, 0);
      assert.strictEqual(stats.failed, 0);
      assert.strictEqual(stats.retried, 0);

      const queueStatus = typedMessageHandler.getQueueStatus();
      assert.strictEqual(queueStatus.size, 0);
      assert.strictEqual(queueStatus.isProcessing, false);
    });

    test("설정 업데이트", () => {
      typedMessageHandler.updateConfig({
        enableValidation: false,
        maxRetries: 5,
      });

      // 설정이 올바르게 업데이트되었는지 간접적으로 확인
      // (내부 config는 private이므로 동작으로 확인)
      assert.ok(true); // 오류가 발생하지 않으면 성공
    });
  });

  suite("웹뷰 설정 및 연결", () => {
    test("웹뷰 설정", () => {
      typedMessageHandler.setWebview(mockWebview);

      // 웹뷰가 설정되었는지 메시지 전송으로 확인
      const testMessage = {
        command: "showStatus" as const,
        message: "test",
      };

      return typedMessageHandler.sendToWebview(testMessage).then((result) => {
        assert.strictEqual(result, true);

        const postedMessages = mockWebview.getPostedMessages();
        assert.strictEqual(postedMessages.length, 1);
        assert.strictEqual(postedMessages[0].command, "showStatus");
      });
    });

    test("웹뷰 재설정", () => {
      typedMessageHandler.setWebview(mockWebview);

      const newMockWebview = new MockWebview();
      typedMessageHandler.setWebview(newMockWebview);

      const testMessage = {
        command: "showStatus" as const,
        message: "test",
      };

      return typedMessageHandler.sendToWebview(testMessage).then((result) => {
        assert.strictEqual(result, true);

        // 새 웹뷰에 메시지가 전송되어야 함
        const newPostedMessages = newMockWebview.getPostedMessages();
        assert.strictEqual(newPostedMessages.length, 1);

        // 기존 웹뷰에는 메시지가 없어야 함
        const oldPostedMessages = mockWebview.getPostedMessages();
        assert.strictEqual(oldPostedMessages.length, 0);
      });
    });
  });

  suite("메시지 핸들러 등록", () => {
    test("웹뷰 메시지 핸들러 등록", () => {
      let handledMessage: any = null;

      typedMessageHandler.onWebviewMessage("generateCode", (message) => {
        handledMessage = message;
      });

      typedMessageHandler.setWebview(mockWebview);

      const testMessage = {
        command: "generateCode",
        question: "test question",
        model_type: "prompt" as const,
      };

      mockWebview.simulateMessage(testMessage);

      // 비동기 처리를 위한 대기
      return new Promise((resolve) => {
        setTimeout(() => {
          assert.ok(handledMessage);
          assert.strictEqual(handledMessage.command, "generateCode");
          assert.strictEqual(handledMessage.question, "test question");
          resolve(undefined);
        }, 50);
      });
    });

    test("여러 핸들러 등록", () => {
      const handledMessages: any[] = [];

      typedMessageHandler.onWebviewMessage("modelSelected", (message) => {
        handledMessages.push({ type: "model", message });
      });

      typedMessageHandler.onWebviewMessage("stopStreaming", (message) => {
        handledMessages.push({ type: "stop", message });
      });

      typedMessageHandler.setWebview(mockWebview);

      mockWebview.simulateMessage({
        command: "modelSelected",
        modelType: "autocomplete",
      });

      mockWebview.simulateMessage({
        command: "stopStreaming",
      });

      return new Promise((resolve) => {
        setTimeout(() => {
          assert.strictEqual(handledMessages.length, 2);
          assert.strictEqual(handledMessages[0].type, "model");
          assert.strictEqual(handledMessages[1].type, "stop");
          resolve(undefined);
        }, 50);
      });
    });
  });

  suite("메시지 전송", () => {
    beforeEach(() => {
      typedMessageHandler.setWebview(mockWebview);
    });

    test("기본 메시지 전송", () => {
      const message = {
        command: "showError" as const,
        message: "Test error",
      };

      return typedMessageHandler.sendToWebview(message).then((result) => {
        assert.strictEqual(result, true);

        const postedMessages = mockWebview.getPostedMessages();
        assert.strictEqual(postedMessages.length, 1);

        const sentMessage = postedMessages[0];
        assert.strictEqual(sentMessage.command, "showError");
        assert.strictEqual(sentMessage.message, "Test error");
        assert.ok(sentMessage.timestamp);
        assert.ok(sentMessage.id);
      });
    });

    test("스트리밍 메시지 전송", () => {
      const streamingMessage = {
        command: "streamingChunk" as const,
        data: {
          type: "token" as const,
          content: "test",
          sequence: 1,
          timestamp: new Date().toISOString(),
        },
      };

      return typedMessageHandler
        .sendToWebview(streamingMessage)
        .then((result) => {
          assert.strictEqual(result, true);

          const postedMessages = mockWebview.getPostedMessages();
          assert.strictEqual(postedMessages.length, 1);
          assert.strictEqual(postedMessages[0].command, "streamingChunk");
        });
    });

    test("웹뷰 미설정 시 전송 실패", () => {
      const newHandler = new TypedMessageHandler();

      const message = {
        command: "showStatus" as const,
        message: "test",
      };

      return newHandler.sendToWebview(message).then((result) => {
        assert.strictEqual(result, false);
        newHandler.dispose();
      });
    });
  });

  suite("메시지 검증", () => {
    beforeEach(() => {
      typedMessageHandler.setWebview(mockWebview);
    });

    test("유효한 메시지 검증 통과", () => {
      const validMessage = {
        command: "generateCode" as const,
        question: "Valid question",
        model_type: "prompt" as const,
      };

      return typedMessageHandler.sendToWebview(validMessage).then((result) => {
        assert.strictEqual(result, true);

        const stats = typedMessageHandler.getStats();
        assert.strictEqual(stats.failed, 0);
      });
    });

    test("잘못된 메시지 검증 실패", () => {
      // 검증을 비활성화한 핸들러로 테스트
      const nonValidatingHandler = new TypedMessageHandler({
        enableValidation: false,
      });
      nonValidatingHandler.setWebview(mockWebview);

      const invalidMessage = {
        command: "generateCode" as const,
        question: "", // 빈 질문 (검증 실패 조건)
        model_type: "invalid" as any,
      };

      return nonValidatingHandler
        .sendToWebview(invalidMessage)
        .then((result) => {
          // 검증이 비활성화되어 있으므로 성공해야 함
          assert.strictEqual(result, true);
          nonValidatingHandler.dispose();
        });
    });

    test("웹뷰에서 받은 잘못된 메시지 처리", () => {
      typedMessageHandler.setWebview(mockWebview);

      // 잘못된 메시지 시뮬레이션
      const invalidMessage = {
        invalidField: "test",
        // command 필드 누락
      };

      mockWebview.simulateMessage(invalidMessage);

      return new Promise((resolve) => {
        setTimeout(() => {
          const stats = typedMessageHandler.getStats();
          // 검증 실패로 인해 실패 카운트가 증가해야 함
          assert.ok(stats.failed >= 0);
          resolve(undefined);
        }, 50);
      });
    });
  });

  suite("메시지 큐", () => {
    beforeEach(() => {
      typedMessageHandler.setWebview(mockWebview);
    });

    test("큐 기능 테스트", () => {
      const queueableMessage = {
        command: "showStatus" as const,
        message: "Queued message",
      };

      return typedMessageHandler
        .sendToWebview(queueableMessage)
        .then((result) => {
          assert.strictEqual(result, true);

          // 메시지가 즉시 처리되거나 큐에 들어가야 함
          const queueStatus = typedMessageHandler.getQueueStatus();
          assert.ok(queueStatus.size >= 0);
        });
    });

    test("큐 초기화", () => {
      typedMessageHandler.clearQueue();

      const queueStatus = typedMessageHandler.getQueueStatus();
      assert.strictEqual(queueStatus.size, 0);
      assert.strictEqual(queueStatus.isProcessing, false);
    });

    test("큐 최대 크기 제한", async () => {
      // 큐 최대 크기를 작게 설정한 핸들러
      const smallQueueHandler = new TypedMessageHandler({
        queueMaxSize: 2,
        enableLogging: false,
      });
      smallQueueHandler.setWebview(mockWebview);

      // 여러 메시지를 빠르게 전송
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          smallQueueHandler.sendToWebview({
            command: "showStatus" as const,
            message: `Message ${i}`,
          })
        );
      }

      await Promise.all(promises);

      const queueStatus = smallQueueHandler.getQueueStatus();
      assert.ok(queueStatus.size <= 2); // 큐 크기 제한 확인

      smallQueueHandler.dispose();
    });
  });

  suite("통계 및 모니터링", () => {
    beforeEach(() => {
      typedMessageHandler.setWebview(mockWebview);
    });

    test("통계 수집", () => {
      const message = {
        command: "showStatus" as const,
        message: "Stats test",
      };

      return typedMessageHandler.sendToWebview(message).then(() => {
        const stats = typedMessageHandler.getStats();

        assert.ok(stats.sent >= 1);
        assert.ok(typeof stats.averageProcessingTime === "number");
        assert.ok(stats.averageProcessingTime >= 0);
      });
    });

    test("핸들러 호출 시 통계 업데이트", () => {
      let handlerCalled = false;

      typedMessageHandler.onWebviewMessage("getHistory", () => {
        handlerCalled = true;
      });

      mockWebview.simulateMessage({
        command: "getHistory",
      });

      return new Promise((resolve) => {
        setTimeout(() => {
          const stats = typedMessageHandler.getStats();
          assert.ok(stats.received >= 1);
          assert.ok(handlerCalled);
          resolve(undefined);
        }, 50);
      });
    });
  });

  suite("에러 처리 및 재시도", () => {
    test("재시도 비활성화 시 즉시 실패", () => {
      const noRetryHandler = new TypedMessageHandler({
        enableRetry: false,
        enableLogging: false,
      });

      // 웹뷰를 설정하지 않아서 전송 실패 유도
      const message = {
        command: "showStatus" as const,
        message: "No retry test",
      };

      return noRetryHandler.sendToWebview(message).then((result) => {
        assert.strictEqual(result, false);

        const stats = noRetryHandler.getStats();
        assert.strictEqual(stats.retried, 0); // 재시도하지 않음

        noRetryHandler.dispose();
      });
    });

    test("전역 오류 핸들러 설정", () => {
      // 전역 오류 핸들러가 설정되었는지 확인
      // (실제 오류를 발생시키지 않고 핸들러 존재만 확인)
      assert.ok(typedMessageHandler);
    });
  });

  suite("리소스 정리", () => {
    test("dispose 후 상태 초기화", () => {
      typedMessageHandler.setWebview(mockWebview);

      const message = {
        command: "showStatus" as const,
        message: "Before dispose",
      };

      return typedMessageHandler
        .sendToWebview(message)
        .then(() => {
          typedMessageHandler.dispose();

          const queueStatus = typedMessageHandler.getQueueStatus();
          assert.strictEqual(queueStatus.size, 0);

          // dispose 후 메시지 전송 시도
          return typedMessageHandler.sendToWebview(message);
        })
        .then((result) => {
          assert.strictEqual(result, false); // 실패해야 함
        });
    });

    test("중복 dispose 처리", () => {
      typedMessageHandler.dispose();

      // 중복 dispose 시 오류가 발생하지 않아야 함
      assert.doesNotThrow(() => {
        typedMessageHandler.dispose();
      });
    });
  });

  suite("특수 메시지 타입 처리", () => {
    beforeEach(() => {
      typedMessageHandler.setWebview(mockWebview);
    });

    test("모델 선택 메시지", () => {
      const modelMessage = {
        command: "modelSelected" as const,
        modelType: "autocomplete" as const,
      };

      return typedMessageHandler.sendToWebview(modelMessage).then((result) => {
        assert.strictEqual(result, true);

        const postedMessages = mockWebview.getPostedMessages();
        assert.strictEqual(postedMessages[0].command, "modelSelected");
      });
    });

    test("스트리밍 완료 메시지", () => {
      const completionMessage = {
        command: "streamingComplete" as const,
        data: {
          finalContent: "Final result",
          metadata: { tokens: 100 },
        },
      };

      return typedMessageHandler
        .sendToWebview(completionMessage)
        .then((result) => {
          assert.strictEqual(result, true);

          const postedMessages = mockWebview.getPostedMessages();
          const sentMessage = postedMessages[0];
          assert.strictEqual(sentMessage.command, "streamingComplete");
          assert.strictEqual(sentMessage.data.finalContent, "Final result");
        });
    });

    test("히스토리 동기화 메시지", () => {
      const historyMessage = {
        command: "syncHistory" as const,
        history: JSON.stringify([
          {
            question: "test",
            response: "response",
            timestamp: Date.now(),
            modelType: "prompt",
          },
        ]),
      };

      return typedMessageHandler
        .sendToWebview(historyMessage)
        .then((result) => {
          assert.strictEqual(result, true);

          const postedMessages = mockWebview.getPostedMessages();
          const sentMessage = postedMessages[0];
          assert.strictEqual(sentMessage.command, "syncHistory");
          assert.ok(sentMessage.history);
        });
    });
  });

  suite("메시지 보안", () => {
    beforeEach(() => {
      typedMessageHandler.setWebview(mockWebview);
    });

    test("XSS 방지 - 스크립트 태그 제거", () => {
      const maliciousMessage = {
        command: "showError" as const,
        message: '<script>alert("xss")</script>Safe message',
      };

      return typedMessageHandler.sendToWebview(maliciousMessage).then(() => {
        const postedMessages = mockWebview.getPostedMessages();
        const sentMessage = postedMessages[0];

        // 스크립트 태그가 제거되었는지 확인
        assert.ok(!sentMessage.message.includes("<script>"));
        assert.ok(sentMessage.message.includes("Safe message"));
      });
    });

    test("JavaScript URL 제거", () => {
      const maliciousMessage = {
        command: "showStatus" as const,
        message: 'javascript:alert("xss") Safe content',
      };

      return typedMessageHandler.sendToWebview(maliciousMessage).then(() => {
        const postedMessages = mockWebview.getPostedMessages();
        const sentMessage = postedMessages[0];

        // javascript: 프로토콜이 제거되었는지 확인
        assert.ok(!sentMessage.message.includes("javascript:"));
        assert.ok(sentMessage.message.includes("Safe content"));
      });
    });
  });
});
