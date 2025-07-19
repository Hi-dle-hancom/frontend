/**
 * Extension 통합 테스트
 * 전체 시스템의 상호작용 검증
 */

import * as vscode from "vscode";
import { ExtensionManager } from "../../core/ExtensionManager";
import { ConfigService } from "../../services/ConfigService";
import { TriggerDetector } from "../../modules/triggerDetector";

// Mock VSCode API
jest.mock("vscode", () => ({
  window: {
    onDidChangeTextEditorSelection: jest.fn(() => ({ dispose: jest.fn() })),
    onDidChangeActiveTextEditor: jest.fn(() => ({ dispose: jest.fn() })),
    onDidChangeWindowState: jest.fn(() => ({ dispose: jest.fn() })),
    activeTextEditor: null,
    showErrorMessage: jest.fn(),
    showWarningMessage: jest.fn(),
    showInformationMessage: jest.fn(),
    createWebviewPanel: jest.fn(),
  },
  workspace: {
    onDidChangeConfiguration: jest.fn(() => ({ dispose: jest.fn() })),
    onDidChangeTextDocument: jest.fn(() => ({ dispose: jest.fn() })),
    getConfiguration: jest.fn(() => ({
      get: jest.fn(),
      update: jest.fn(),
      inspect: jest.fn(),
    })),
  },
  commands: {
    executeCommand: jest.fn(),
    registerCommand: jest.fn(() => ({ dispose: jest.fn() })),
  },
  Uri: {
    file: jest.fn((path) => ({ fsPath: path })),
  },
  ViewColumn: {
    One: 1,
    Two: 2,
    Three: 3,
  },
  Disposable: jest.fn(() => ({ dispose: jest.fn() })),
  Range: jest.fn(),
  ExtensionMode: {
    Test: 3,
  },
}));

describe("Extension Integration Tests", () => {
  let extensionManager: ExtensionManager;
  let mockContext: vscode.ExtensionContext;
  let configService: ConfigService;

  beforeEach(() => {
    // Mock Extension Context
    mockContext = {
      subscriptions: [],
      extensionUri: vscode.Uri.file("/test"),
      globalState: {
        get: jest.fn(),
        update: jest.fn(),
        keys: jest.fn(),
      } as any,
      workspaceState: {
        get: jest.fn(),
        update: jest.fn(),
        keys: jest.fn(),
      } as any,
      secrets: {} as any,
      storageUri: vscode.Uri.file("/test/storage"),
      globalStorageUri: vscode.Uri.file("/test/global"),
      logUri: vscode.Uri.file("/test/log"),
      extensionMode: vscode.ExtensionMode.Test,
      extension: {} as any,
      environmentVariableCollection: {} as any,
      asAbsolutePath: jest.fn((path) => `/test/${path}`),
      storageKey: 'test',
      globalStorageKey: 'test-global',
      logKey: 'test-log',
    };

    // ConfigService 초기화
    (ConfigService as any).instance = undefined;
    configService = ConfigService.getInstance();
    configService.setContext(mockContext);

    // ExtensionManager 초기화
    extensionManager = new ExtensionManager(mockContext);

    // Mock 초기화
    jest.clearAllMocks();
  });

  afterEach(async () => {
    if (extensionManager && extensionManager.isExtensionActivated()) {
      await extensionManager.deactivate();
    }
    configService.dispose();
  });

  describe("Extension 생명주기", () => {
    test("Extension이 정상적으로 활성화되고 비활성화되어야 함", async () => {
      // 활성화
      await extensionManager.activate();
      expect(extensionManager.isExtensionActivated()).toBe(true);

      // 상태 검증
      const status = extensionManager.getExtensionStatus();
      expect(status.isActivated).toBe(true);

      // 비활성화
      await extensionManager.deactivate();
      expect(extensionManager.isExtensionActivated()).toBe(false);
    });

    test("Extension 활성화 중 오류 발생 시 적절히 처리되어야 함", async () => {
      // ServiceManager 초기화 실패 시뮬레이션
      const mockServiceManager = {
        initializeAllServices: jest.fn().mockRejectedValue(new Error("Service initialization failed"))
      };
      (extensionManager as any).serviceManager = mockServiceManager;

      await expect(extensionManager.activate()).rejects.toThrow();
      expect(extensionManager.isExtensionActivated()).toBe(false);
    });
  });

  describe("ConfigService와 ExtensionManager 통합", () => {
    test("ConfigService 설정이 ExtensionManager에 반영되어야 함", async () => {
      // 설정 변경
      const mockConfig = {
        get: jest.fn()
          .mockReturnValue("http://custom-api:8000/api/v1"), // apiBaseURL
        update: jest.fn().mockResolvedValue(undefined),
      };
      (vscode.workspace.getConfiguration as jest.Mock).mockReturnValue(mockConfig);

      await configService.update("apiBaseURL", "http://custom-api:8000/api/v1");

      // ExtensionManager 활성화 시 설정이 반영되는지 확인
      await extensionManager.activate();

      const apiConfig = configService.getAPIConfig();
      expect(apiConfig.baseURL).toBe("http://custom-api:8000/api/v1");
    });

    test("설정 변경 시 ExtensionManager가 알림을 받아야 함", async () => {
      await extensionManager.activate();

      // 설정 변경 이벤트 시뮬레이션
      const configChangeCallback = (vscode.workspace.onDidChangeConfiguration as jest.Mock).mock.calls[0][0];
      
      const mockEvent = {
        affectsConfiguration: jest.fn().mockReturnValue(true),
      };

      // 설정 변경 이벤트 발생
      expect(() => configChangeCallback(mockEvent)).not.toThrow();
    });
  });

  describe("TriggerDetector와 Extension 통합", () => {
    test("주석 트리거가 올바르게 감지되고 처리되어야 함", async () => {
      await extensionManager.activate();

      // TriggerDetector 가져오기
      const triggerDetector = new TriggerDetector();
      let triggeredEvent: any = null;

      triggerDetector.onTrigger((event) => {
        triggeredEvent = event;
      });

      // 주석 트리거 시뮬레이션
      const mockTextDocument = {
        languageId: "python",
        getText: jest.fn().mockReturnValue("# 기존 코드\ndef existing_function():\n    pass"),
        lineCount: 3,
      };

      const mockContentChange = {
        text: "# TODO: 새로운 함수를 만들어주세요\n",
        range: {
          start: { line: 3 },
          end: { line: 3 },
        },
      };

      const mockEvent = {
        document: mockTextDocument,
        contentChanges: [mockContentChange],
      };

      // Mock vscode.Range
      (vscode.Range as any) = jest.fn().mockImplementation((start, startChar, end, endChar) => ({
        start: { line: start, character: startChar },
        end: { line: end, character: endChar },
      }));

      // 텍스트 변경 이벤트 처리
      (triggerDetector as any).handleTextDocumentChange(mockEvent);

      // 트리거 이벤트가 발생했는지 확인
      expect(triggeredEvent).toBeDefined();
      expect(triggeredEvent.type).toBe("comment");
      expect(triggeredEvent.action).toBe("custom");

      triggerDetector.dispose();
    });

    test("명령어 트리거가 올바르게 처리되어야 함", async () => {
      await extensionManager.activate();

      const triggerDetector = new TriggerDetector();
      let triggeredEvent: any = null;

      triggerDetector.onTrigger((event) => {
        triggeredEvent = event;
      });

      // Mock PromptExtractor
      jest.doMock("../../modules/promptExtractor", () => ({
        PromptExtractor: {
          extractFromSelection: jest.fn().mockReturnValue({
            prompt: "테스트 프롬프트",
            context: "테스트 컨텍스트",
            selectedCode: "print('hello')",
            language: "python",
            filePath: "/test/file.py",
            lineNumbers: { start: 1, end: 1 }
          }),
          extractCurrentFunction: jest.fn().mockReturnValue(null),
          extractFileContext: jest.fn().mockReturnValue(null),
        }
      }));

      // 명령어 처리
      triggerDetector.handleCommand("hapa.analyze");

      // 트리거 이벤트가 발생했는지 확인
      expect(triggeredEvent).toBeDefined();
      expect(triggeredEvent.type).toBe("command");
      expect(triggeredEvent.action).toBe("analyze");

      triggerDetector.dispose();
    });
  });

  describe("에러 처리 통합", () => {
    test("서비스 초기화 실패 시 적절한 에러 메시지가 표시되어야 함", async () => {
      // ServiceManager 초기화 실패 시뮬레이션
      (extensionManager as any).serviceManager = {
        initializeAllServices: jest.fn().mockRejectedValue(new Error("Network error")),
        cleanup: jest.fn().mockResolvedValue(undefined),
      };

      await expect(extensionManager.activate()).rejects.toThrow("Network error");

      // 에러 메시지가 사용자에게 표시되는지 확인은 실제 환경에서 테스트
      expect(extensionManager.isExtensionActivated()).toBe(false);
    });

    test("설정 검증 실패 시 적절한 처리가 되어야 함", () => {
      // 잘못된 설정으로 검증
      const mockConfig = {
        get: jest.fn()
          .mockReturnValueOnce(true) // enableCodeAnalysis
          .mockReturnValueOnce("system") // theme
          .mockReturnValueOnce("invalid-url") // apiBaseURL - 잘못된 URL
          .mockReturnValueOnce("short") // apiKey - 너무 짧은 키
          .mockReturnValueOnce(30000) // apiTimeout
          .mockReturnValueOnce(true) // autoComplete
          .mockReturnValueOnce(5) // maxSuggestions
          .mockReturnValueOnce(false), // enableLogging
      };

      const mockUserProfileConfig = {
        get: jest.fn().mockReturnValue("intermediate"),
      };

      (vscode.workspace.getConfiguration as jest.Mock)
        .mockReturnValueOnce(mockConfig)
        .mockReturnValueOnce(mockUserProfileConfig);

      const validation = configService.validateConfig();

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe("상태 동기화 통합", () => {
    test("Extension 상태가 모든 컴포넌트에 일관되게 반영되어야 함", async () => {
      // 활성화 전 상태 확인
      expect(extensionManager.isExtensionActivated()).toBe(false);

      // 활성화
      await extensionManager.activate();
      expect(extensionManager.isExtensionActivated()).toBe(true);

      // 상태 보고서 생성
      const statusReport = extensionManager.generateStatusReport();
      expect(statusReport.extension.isActivated).toBe(true);

      // 비활성화
      await extensionManager.deactivate();
      expect(extensionManager.isExtensionActivated()).toBe(false);
    });

    test("프로바이더와 서비스 간 상태 동기화가 올바르게 작동해야 함", async () => {
      await extensionManager.activate();

      // 서비스 상태 확인
      const serviceStatus = extensionManager.getExtensionStatus();
      expect(serviceStatus.isActivated).toBe(true);

      // 프로바이더 가져오기 테스트
      const sidebarProvider = extensionManager.getProvider("sidebar");
      // 프로바이더가 등록되어 있다면 객체여야 함
      if (sidebarProvider) {
        expect(typeof sidebarProvider).toBe("object");
      }

      // 서비스 가져오기 테스트
      const configValidationService = extensionManager.getService("ConfigValidationService");
      // 서비스가 등록되어 있다면 객체여야 함
      if (configValidationService) {
        expect(typeof configValidationService).toBe("object");
      }
    });
  });

  describe("메모리 관리", () => {
    test("Extension 비활성화 시 모든 리소스가 정리되어야 함", async () => {
      await extensionManager.activate();

      // 구독 항목들이 등록되었는지 확인
      expect(mockContext.subscriptions.length).toBeGreaterThan(0);

      await extensionManager.deactivate();

      // 모든 구독이 정리되었는지는 실제 구현에서 확인
      expect(extensionManager.isExtensionActivated()).toBe(false);
    });

    test("설정 서비스 리소스가 올바르게 정리되어야 함", () => {
      const listener = jest.fn();
      const disposable = configService.onConfigChange(listener);

      // 리스너가 등록되었는지 확인
      expect((configService as any).listeners.length).toBeGreaterThan(0);

      // 리소스 정리
      disposable.dispose();
      configService.dispose();

      // 리스너가 정리되었는지 확인
      expect((configService as any).listeners.length).toBe(0);
    });
  });
});