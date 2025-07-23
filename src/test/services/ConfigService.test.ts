/**
 * ConfigService 단위 테스트
 * 설정 관리 시스템 검증
 */

import * as vscode from "vscode";
import { ConfigService } from "../../services/ConfigService";

// Mock VSCode workspace configuration
const mockConfig = {
  get: jest.fn(),
  update: jest.fn(),
  inspect: jest.fn(),
  has: jest.fn(),
};

const mockWorkspace = {
  getConfiguration: jest.fn().mockReturnValue(mockConfig),
  onDidChangeConfiguration: jest.fn().mockReturnValue({ dispose: jest.fn() }),
};

jest.mock("vscode", () => ({
  workspace: mockWorkspace,
  Disposable: jest.fn(() => ({ dispose: jest.fn() })),
}));

describe("ConfigService", () => {
  let configService: ConfigService;
  let mockContext: vscode.ExtensionContext;

  beforeEach(() => {
    // 싱글톤 인스턴스 초기화
    (ConfigService as any).instance = undefined;
    configService = ConfigService.getInstance();

    mockContext = {
      subscriptions: [],
      extensionUri: vscode.Uri.file("/test"),
      globalState: { get: jest.fn(), update: jest.fn(), keys: jest.fn() } as any,
      workspaceState: { get: jest.fn(), update: jest.fn(), keys: jest.fn() } as any,
    } as any;

    // Mock 초기화
    jest.clearAllMocks();
    mockConfig.get.mockReset();
    mockConfig.update.mockReset();
  });

  afterEach(() => {
    configService.dispose();
  });

  describe("싱글톤 패턴", () => {
    test("ConfigService는 싱글톤이어야 함", () => {
      const instance1 = ConfigService.getInstance();
      const instance2 = ConfigService.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe("API 설정", () => {
    test("getAPIConfig()가 올바른 기본값을 반환해야 함", () => {
      mockConfig.get
        .mockReturnValueOnce("http://3.13.240.111:8000/api/v1") // apiBaseURL
        .mockReturnValueOnce(30000) // apiTimeout
        .mockReturnValueOnce("hapa_demo_20241228_secure_key_for_testing") // apiKey
        .mockReturnValueOnce(3) // retryAttempts
        .mockReturnValueOnce(1000); // retryDelay

      const apiConfig = configService.getAPIConfig();

      expect(apiConfig).toEqual({
        baseURL: "http://3.13.240.111:8000/api/v1",
        timeout: 30000,
        apiKey: "hapa_demo_20241228_secure_key_for_testing",
        retryAttempts: 3,
        retryDelay: 1000,
      });
    });

    test("사용자 정의 API 설정이 올바르게 반영되어야 함", () => {
      mockConfig.get
        .mockReturnValueOnce("http://custom-server:9000/api/v2") // apiBaseURL
        .mockReturnValueOnce(60000) // apiTimeout  
        .mockReturnValueOnce("custom_api_key") // apiKey
        .mockReturnValueOnce(5) // retryAttempts
        .mockReturnValueOnce(2000); // retryDelay

      const apiConfig = configService.getAPIConfig();

      expect(apiConfig.baseURL).toBe("http://custom-server:9000/api/v2");
      expect(apiConfig.timeout).toBe(60000);
      expect(apiConfig.apiKey).toBe("custom_api_key");
      expect(apiConfig.retryAttempts).toBe(5);
      expect(apiConfig.retryDelay).toBe(2000);
    });
  });

  describe("사용자 프로필", () => {
    test("getUserProfile()가 올바른 기본값을 반환해야 함", () => {
      // hapa.userProfile 설정에 대한 mock
      const mockUserProfileConfig = {
        get: jest.fn()
          .mockReturnValueOnce("intermediate") // pythonSkillLevel
          .mockReturnValueOnce("standard") // codeOutputStructure
          .mockReturnValueOnce("standard") // explanationStyle
          .mockReturnValueOnce("general_purpose") // projectContext
          .mockReturnValueOnce("basic") // errorHandlingPreference
          .mockReturnValueOnce(["type_hints", "f_strings"]) // preferredLanguageFeatures
          .mockReturnValueOnce(false), // isOnboardingCompleted
      };

      mockWorkspace.getConfiguration.mockReturnValue(mockUserProfileConfig);

      const userProfile = configService.getUserProfile();

      expect(userProfile).toEqual({
        pythonSkillLevel: "intermediate",
        codeOutputStructure: "standard",
        explanationStyle: "standard",
        projectContext: "general_purpose",
        errorHandlingPreference: "basic",
        preferredLanguageFeatures: ["type_hints", "f_strings"],
        isOnboardingCompleted: false,
      });
    });

    test("updateUserProfile()이 개별 속성을 올바르게 업데이트해야 함", async () => {
      const mockUserProfileConfig = {
        get: jest.fn(),
        update: jest.fn().mockResolvedValue(undefined),
      };

      mockWorkspace.getConfiguration.mockReturnValue(mockUserProfileConfig);

      const profileUpdate = {
        pythonSkillLevel: "advanced" as const,
        isOnboardingCompleted: true,
      };

      await configService.updateUserProfile(profileUpdate);

      expect(mockUserProfileConfig.update).toHaveBeenCalledWith("pythonSkillLevel", "advanced", true);
      expect(mockUserProfileConfig.update).toHaveBeenCalledWith("isOnboardingCompleted", true, true);
    });
  });

  describe("설정 검증", () => {
    test("유효한 설정에 대해 검증이 통과해야 함", () => {
      mockConfig.get
        .mockReturnValueOnce(true) // enableCodeAnalysis
        .mockReturnValueOnce("system") // theme
        .mockReturnValueOnce("http://localhost:8000/api/v1") // apiBaseURL
        .mockReturnValueOnce("valid_api_key_1234567890") // apiKey
        .mockReturnValueOnce(30000) // apiTimeout
        .mockReturnValueOnce(true) // autoComplete
        .mockReturnValueOnce(5) // maxSuggestions
        .mockReturnValueOnce(false); // enableLogging

      // getUserProfile() 호출을 위한 추가 mock
      const mockUserProfileConfig = {
        get: jest.fn().mockReturnValue("intermediate"),
      };
      mockWorkspace.getConfiguration.mockReturnValue(mockUserProfileConfig);

      const validation = configService.validateConfig();

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test("잘못된 API URL에 대해 오류를 반환해야 함", () => {
      mockConfig.get
        .mockReturnValueOnce(true) // enableCodeAnalysis
        .mockReturnValueOnce("system") // theme
        .mockReturnValueOnce("invalid-url") // apiBaseURL - 잘못된 URL
        .mockReturnValueOnce("valid_api_key_1234567890") // apiKey
        .mockReturnValueOnce(30000) // apiTimeout
        .mockReturnValueOnce(true) // autoComplete
        .mockReturnValueOnce(5) // maxSuggestions
        .mockReturnValueOnce(false); // enableLogging

      const mockUserProfileConfig = {
        get: jest.fn().mockReturnValue("intermediate"),
      };
      mockWorkspace.getConfiguration.mockReturnValue(mockUserProfileConfig);

      const validation = configService.validateConfig();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain("유효하지 않은 API URL입니다.");
    });

    test("짧은 API 키에 대해 오류를 반환해야 함", () => {
      mockConfig.get
        .mockReturnValueOnce(true) // enableCodeAnalysis
        .mockReturnValueOnce("system") // theme
        .mockReturnValueOnce("http://localhost:8000/api/v1") // apiBaseURL
        .mockReturnValueOnce("short") // apiKey - 너무 짧은 키
        .mockReturnValueOnce(30000) // apiTimeout
        .mockReturnValueOnce(true) // autoComplete
        .mockReturnValueOnce(5) // maxSuggestions
        .mockReturnValueOnce(false); // enableLogging

      const mockUserProfileConfig = {
        get: jest.fn().mockReturnValue("intermediate"),
      };
      mockWorkspace.getConfiguration.mockReturnValue(mockUserProfileConfig);

      const validation = configService.validateConfig();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain("API 키가 설정되지 않았거나 너무 짧습니다.");
    });

    test("잘못된 타임아웃 값에 대해 오류를 반환해야 함", () => {
      mockConfig.get
        .mockReturnValueOnce(true) // enableCodeAnalysis
        .mockReturnValueOnce("system") // theme
        .mockReturnValueOnce("http://localhost:8000/api/v1") // apiBaseURL
        .mockReturnValueOnce("valid_api_key_1234567890") // apiKey
        .mockReturnValueOnce(500) // apiTimeout - 너무 짧은 타임아웃
        .mockReturnValueOnce(true) // autoComplete
        .mockReturnValueOnce(5) // maxSuggestions
        .mockReturnValueOnce(false); // enableLogging

      const mockUserProfileConfig = {
        get: jest.fn().mockReturnValue("intermediate"),
      };
      mockWorkspace.getConfiguration.mockReturnValue(mockUserProfileConfig);

      const validation = configService.validateConfig();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain("API 타임아웃은 1초~5분 사이여야 합니다.");
    });
  });

  describe("설정 가져오기/내보내기", () => {
    test("exportConfig()가 JSON 형태로 설정을 내보내야 함", () => {
      mockConfig.get
        .mockReturnValueOnce(true) // enableCodeAnalysis
        .mockReturnValueOnce("dark") // theme
        .mockReturnValueOnce("http://localhost:8000/api/v1") // apiBaseURL
        .mockReturnValueOnce("test_api_key") // apiKey
        .mockReturnValueOnce(30000) // apiTimeout
        .mockReturnValueOnce(true) // autoComplete
        .mockReturnValueOnce(5) // maxSuggestions
        .mockReturnValueOnce(false); // enableLogging

      const mockUserProfileConfig = {
        get: jest.fn().mockReturnValue("intermediate"),
      };
      mockWorkspace.getConfiguration.mockReturnValue(mockUserProfileConfig);

      const exportedConfig = configService.exportConfig();
      const parsedConfig = JSON.parse(exportedConfig);

      expect(parsedConfig).toHaveProperty("enableCodeAnalysis", true);
      expect(parsedConfig).toHaveProperty("theme", "dark");
      expect(parsedConfig).toHaveProperty("apiBaseURL", "http://localhost:8000/api/v1");
      expect(parsedConfig).toHaveProperty("userProfile");
    });

    test("importConfig()가 유효한 설정을 올바르게 가져와야 함", async () => {
      const validConfig = {
        apiBaseURL: "http://import-test:8000/api/v1",
        apiKey: "imported_api_key_1234567890",
        apiTimeout: 45000,
        enableCodeAnalysis: false,
        userProfile: {
          pythonSkillLevel: "expert",
          isOnboardingCompleted: true,
        }
      };

      mockConfig.update.mockResolvedValue(undefined);
      const mockUserProfileConfig = {
        update: jest.fn().mockResolvedValue(undefined),
      };
      mockWorkspace.getConfiguration.mockReturnValue(mockUserProfileConfig);

      await configService.importConfig(JSON.stringify(validConfig));

      expect(mockConfig.update).toHaveBeenCalledWith("apiBaseURL", validConfig.apiBaseURL, true);
      expect(mockConfig.update).toHaveBeenCalledWith("apiKey", validConfig.apiKey, true);
      expect(mockConfig.update).toHaveBeenCalledWith("apiTimeout", validConfig.apiTimeout, true);
    });

    test("importConfig()가 잘못된 설정에 대해 오류를 발생시켜야 함", async () => {
      const invalidConfig = {
        // apiBaseURL 누락
        apiKey: "test_key",
        // apiTimeout이 문자열 (숫자여야 함)
        apiTimeout: "invalid_timeout",
      };

      await expect(configService.importConfig(JSON.stringify(invalidConfig)))
        .rejects.toThrow("설정 가져오기 실패");
    });
  });

  describe("설정 업데이트", () => {
    test("update()가 설정을 올바르게 업데이트해야 함", async () => {
      mockConfig.get.mockReturnValue("old_value");
      mockConfig.update.mockResolvedValue(undefined);

      await configService.update("testKey", "new_value", true);

      expect(mockConfig.update).toHaveBeenCalledWith("testKey", "new_value", true);
    });

    test("updateAPIKey()가 API 키를 올바르게 업데이트해야 함", async () => {
      mockConfig.update.mockResolvedValue(undefined);

      await configService.updateAPIKey("new_api_key_1234567890");

      expect(mockConfig.update).toHaveBeenCalledWith("apiKey", "new_api_key_1234567890", true);
    });

    test("markOnboardingCompleted()가 온보딩 상태를 올바르게 업데이트해야 함", async () => {
      mockConfig.update.mockResolvedValue(undefined);

      await configService.markOnboardingCompleted();

      expect(mockConfig.update).toHaveBeenCalledWith("userProfile.isOnboardingCompleted", true, true);
    });
  });

  describe("설정 변경 이벤트", () => {
    test("설정 변경 리스너가 올바르게 등록되어야 함", () => {
      const listener = jest.fn();
      const disposable = configService.onConfigChange(listener);

      expect(disposable).toBeDefined();
      expect(typeof disposable.dispose).toBe("function");
    });

    test("설정 변경 시 리스너가 호출되어야 함", () => {
      const listener = jest.fn();
      configService.onConfigChange(listener);

      // private 메서드 직접 호출로 테스트
      (configService as any).notifyConfigChangeForKey("testKey", "oldValue", "newValue");

      expect(listener).toHaveBeenCalledWith({
        key: "testKey",
        oldValue: "oldValue", 
        newValue: "newValue",
        timestamp: expect.any(Date),
      });
    });
  });

  describe("리소스 정리", () => {
    test("dispose()가 모든 리소스를 정리해야 함", () => {
      const mockDisposable = { dispose: jest.fn() };
      (configService as any).disposables = [mockDisposable];

      const listener = jest.fn();
      configService.onConfigChange(listener);

      configService.dispose();

      expect(mockDisposable.dispose).toHaveBeenCalled();
      expect((configService as any).listeners).toHaveLength(0);
    });
  });
});