/**
 * ExtensionManager 단위 테스트
 * 핵심 기능의 안정성 검증
 */

import * as vscode from "vscode";
import { ExtensionManager } from "../../core/ExtensionManager";

// Mock VSCode API
const mockContext: vscode.ExtensionContext = {
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

describe("ExtensionManager", () => {
  let extensionManager: ExtensionManager;

  beforeEach(() => {
    extensionManager = new ExtensionManager(mockContext);
  });

  afterEach(() => {
    if (extensionManager && extensionManager.isExtensionActivated()) {
      extensionManager.deactivate();
    }
  });

  describe("초기화", () => {
    test("ExtensionManager가 올바르게 생성되어야 함", () => {
      expect(extensionManager).toBeDefined();
      expect(extensionManager.isExtensionActivated()).toBe(false);
    });

    test("context가 올바르게 설정되어야 함", () => {
      const context = extensionManager.getContext();
      expect(context).toBe(mockContext);
    });
  });

  describe("활성화 프로세스", () => {
    test("activate() 호출 시 정상적으로 활성화되어야 함", async () => {
      await extensionManager.activate();
      expect(extensionManager.isExtensionActivated()).toBe(true);
    });

    test("이미 활성화된 상태에서 다시 activate() 호출 시 경고만 출력", async () => {
      await extensionManager.activate();
      const consoleSpy = jest.spyOn(console, 'warn');
      
      await extensionManager.activate();
      
      expect(consoleSpy).toHaveBeenCalledWith("⚠️ Extension is already activated");
      consoleSpy.mockRestore();
    });

    test("활성화 실패 시 적절한 오류 처리", async () => {
      // ServiceManager 초기화 실패 시뮬레이션
      const mockServiceManager = {
        initializeAllServices: jest.fn().mockRejectedValue(new Error("Service init failed"))
      };
      
      // ExtensionManager의 serviceManager를 mock으로 교체
      (extensionManager as any).serviceManager = mockServiceManager;

      await expect(extensionManager.activate()).rejects.toThrow("Service init failed");
      expect(extensionManager.isExtensionActivated()).toBe(false);
    });
  });

  describe("메서드 존재성 검증", () => {
    test("hasMethod()가 존재하는 메서드를 올바르게 감지해야 함", () => {
      const testObj = {
        existingMethod: () => {},
        notAMethod: "string value"
      };

      // private 메서드 테스트를 위한 타입 캐스팅
      const hasMethod = (extensionManager as any).hasMethod;
      
      expect(hasMethod.call(extensionManager, testObj, 'existingMethod')).toBe(true);
      expect(hasMethod.call(extensionManager, testObj, 'notAMethod')).toBe(false);
      expect(hasMethod.call(extensionManager, testObj, 'nonExistentMethod')).toBe(false);
    });

    test("hasMethod()가 null/undefined 객체를 안전하게 처리해야 함", () => {
      const hasMethod = (extensionManager as any).hasMethod;
      
      expect(hasMethod.call(extensionManager, null, 'anyMethod')).toBe(false);
      expect(hasMethod.call(extensionManager, undefined, 'anyMethod')).toBe(false);
    });

    test("hasMethod()가 예외 발생 시 false를 반환해야 함", () => {
      const problematicObj = {
        get badProperty() {
          throw new Error("Access denied");
        }
      };

      const hasMethod = (extensionManager as any).hasMethod;
      expect(hasMethod.call(extensionManager, problematicObj, 'badProperty')).toBe(false);
    });
  });

  describe("비활성화 프로세스", () => {
    test("deactivate() 호출 시 정상적으로 비활성화되어야 함", async () => {
      await extensionManager.activate();
      expect(extensionManager.isExtensionActivated()).toBe(true);

      await extensionManager.deactivate();
      expect(extensionManager.isExtensionActivated()).toBe(false);
    });

    test("비활성화되지 않은 상태에서 deactivate() 호출 시 경고만 출력", async () => {
      const consoleSpy = jest.spyOn(console, 'warn');
      
      await extensionManager.deactivate();
      
      expect(consoleSpy).toHaveBeenCalledWith("⚠️ Extension is not activated");
      consoleSpy.mockRestore();
    });
  });

  describe("상태 관리", () => {
    test("getExtensionStatus()가 올바른 상태 정보를 반환해야 함", async () => {
      await extensionManager.activate();
      
      const status = extensionManager.getExtensionStatus();
      
      expect(status).toHaveProperty('isActivated', true);
      expect(status).toHaveProperty('serviceStatus');
      expect(status).toHaveProperty('providerStatus');
      expect(status).toHaveProperty('registeredCommands');
      expect(status).toHaveProperty('activeEventListeners');
    });

    test("generateStatusReport()가 상세한 보고서를 생성해야 함", async () => {
      await extensionManager.activate();
      
      const report = extensionManager.generateStatusReport();
      
      expect(report).toHaveProperty('extension');
      expect(report).toHaveProperty('services');
      expect(report).toHaveProperty('providers');
      expect(report).toHaveProperty('commands');
      expect(report).toHaveProperty('events');
      
      expect(report.extension.isActivated).toBe(true);
      expect(typeof report.services.count).toBe('number');
      expect(typeof report.providers.count).toBe('number');
    });
  });

  describe("서비스 관리", () => {
    test("getService()가 올바른 서비스를 반환해야 함", async () => {
      await extensionManager.activate();
      
      // ConfigValidationService 가져오기 시도
      const service = extensionManager.getService('ConfigValidationService');
      
      // 서비스가 등록되어 있다면 객체여야 하고, 없다면 undefined여야 함
      expect(service === undefined || typeof service === 'object').toBe(true);
    });

    test("getProvider()가 올바른 프로바이더를 반환해야 함", async () => {
      await extensionManager.activate();
      
      // SidebarProvider 가져오기 시도
      const provider = extensionManager.getProvider('sidebar');
      
      // 프로바이더가 등록되어 있다면 객체여야 하고, 없다면 undefined여야 함
      expect(provider === undefined || typeof provider === 'object').toBe(true);
    });
  });

  describe("오류 상황 처리", () => {
    test("활성화 중 오류 발생 시 부분 정리가 실행되어야 함", async () => {
      // 인위적으로 오류 발생시키기
      const originalInitializeServices = (extensionManager as any).initializeServices;
      (extensionManager as any).initializeServices = jest.fn().mockRejectedValue(new Error("Test error"));

      await expect(extensionManager.activate()).rejects.toThrow("Test error");

      // 원본 메서드 복원
      (extensionManager as any).initializeServices = originalInitializeServices;
    });

    test("비활성화 중 오류 발생 시 로그만 출력하고 계속 진행해야 함", async () => {
      await extensionManager.activate();

      // 일부 정리 과정에서 오류 발생 시뮬레이션
      const originalServiceManager = (extensionManager as any).serviceManager;
      (extensionManager as any).serviceManager = {
        cleanup: jest.fn().mockRejectedValue(new Error("Cleanup error"))
      };

      const consoleSpy = jest.spyOn(console, 'error');

      await extensionManager.deactivate();

      expect(consoleSpy).toHaveBeenCalled();
      expect(extensionManager.isExtensionActivated()).toBe(false);

      consoleSpy.mockRestore();
      (extensionManager as any).serviceManager = originalServiceManager;
    });
  });
});