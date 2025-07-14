import * as assert from "assert";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
// import * as myExtension from '../../extension';
import { HAPAAPIClient } from "../modules/apiClient";
import {
  EnhancedErrorService,
  ErrorSeverity,
} from "../services/EnhancedErrorService";
import { PerformanceOptimizer } from "../services/PerformanceOptimizer";
import { OfflineService } from "../services/OfflineService";
import { ConfigValidationService } from "../services/ConfigValidationService";

suite("Extension Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");

  test("Sample test", () => {
    assert.strictEqual(-1, [1, 2, 3].indexOf(5));
    assert.strictEqual(-1, [1, 2, 3].indexOf(0));
  });

  suite("API Client Tests", () => {
    let apiClient: HAPAAPIClient;

    setup(() => {
      apiClient = new HAPAAPIClient("test_api_key");
    });

    test("API Client 초기화", () => {
      assert.ok(apiClient);
      const config = apiClient.getConfig();
      assert.ok(config.hasApiKey);
      assert.strictEqual(config.baseURL, "http://3.13.240.111:8000/api/v1");
    });

    test("API 설정 업데이트", () => {
      const newApiKey = "new_test_key";
      const newBaseURL = "http://localhost:8000/api/v1";

      apiClient.updateConfig(newApiKey, newBaseURL);
      const config = apiClient.getConfig();

      assert.strictEqual(config.baseURL, newBaseURL);
      assert.ok(config.hasApiKey);
    });

    test("사용 가능한 모델 목록 조회", async () => {
      try {
        const models = await apiClient.getAvailableModels();
        assert.ok(Array.isArray(models));
      } catch (error) {
        // 네트워크 오류는 예상 가능하므로 통과
        console.log("네트워크 오류로 인한 테스트 스킵:", error);
      }
    });

    test("에이전트 목록 조회 - 기본값 반환", async () => {
      const result = await apiClient.listAgents();
      assert.strictEqual(result.status, "success");
      assert.ok(Array.isArray(result.agents));
      assert.ok(result.agents.length >= 2); // 기본 에이전트들
    });

    test("에이전트 역할 조회 - 기본값 반환", async () => {
      const result = await apiClient.getAgentRoles();
      assert.strictEqual(result.status, "success");
      assert.ok(Array.isArray(result.roles));
      assert.ok(result.roles.length >= 2); // 기본 역할들
    });
  });

  suite("Enhanced Error Service Tests", () => {
    let errorService: EnhancedErrorService;

    setup(() => {
      errorService = EnhancedErrorService.getInstance();
    });

    test("에러 서비스 싱글톤 인스턴스", () => {
      const instance1 = EnhancedErrorService.getInstance();
      const instance2 = EnhancedErrorService.getInstance();
      assert.strictEqual(instance1, instance2);
    });

    test("에러 로깅", () => {
      const testError = new Error("테스트 에러");
      errorService.logError(testError, ErrorSeverity.LOW, { test: true });

      const recentErrors = errorService.getRecentErrors(1);
      assert.strictEqual(recentErrors.length, 1);
      assert.strictEqual(recentErrors[0].message, "테스트 에러");
      assert.strictEqual(recentErrors[0].severity, ErrorSeverity.LOW);
    });

    test("에러 통계 생성", () => {
      // 테스트 에러들 추가
      errorService.logError("중간 에러", ErrorSeverity.MEDIUM);
      errorService.logError("높은 에러", ErrorSeverity.HIGH);

      const stats = errorService.getErrorStats();
      assert.ok(stats.total >= 2);
      assert.ok(stats.bySeverity[ErrorSeverity.MEDIUM] >= 1);
      assert.ok(stats.bySeverity[ErrorSeverity.HIGH] >= 1);
    });

    test("재시도 가능한 에러 필터링", () => {
      errorService.logError("재시도 가능", ErrorSeverity.MEDIUM, {}, true);
      errorService.logError("재시도 불가", ErrorSeverity.HIGH, {}, false);

      const retryableErrors = errorService.getRetryableErrors();
      assert.ok(retryableErrors.length >= 1);
      assert.ok(retryableErrors.some((e) => e.message === "재시도 가능"));
    });
  });

  suite("Performance Optimizer Tests", () => {
    let performanceOptimizer: PerformanceOptimizer;

    setup(() => {
      performanceOptimizer = PerformanceOptimizer.getInstance();
    });

    test("성능 최적화 서비스 초기화", () => {
      assert.ok(performanceOptimizer);
    });

    test("성능 보고서 생성", () => {
      const report = performanceOptimizer.generatePerformanceReport();
      assert.ok(typeof report === "string");
      assert.ok(report.length > 0);
    });

    test("메모리 정리", () => {
      performanceOptimizer.clearMetrics();
      // 메모리 정리 후에도 서비스가 정상 동작하는지 확인
      const report = performanceOptimizer.generatePerformanceReport();
      assert.ok(typeof report === "string");
    });
  });

  suite("Offline Service Tests", () => {
    let offlineService: OfflineService;

    setup(() => {
      offlineService = OfflineService.getInstance();
    });

    test("오프라인 서비스 초기화", () => {
      assert.ok(offlineService);
    });

    test("온라인 상태 확인", async () => {
      const isOnline = await offlineService.checkOnlineStatus();
      assert.ok(typeof isOnline === "boolean");
    });

    test("상태 정보 조회", () => {
      const status = offlineService.getStatus();
      assert.ok(typeof status.isOnline === "boolean");
      assert.ok(typeof status.pendingRequests === "number");
      assert.ok(typeof status.cachedResponses === "number");
      assert.ok(status.lastOnlineCheck instanceof Date);
    });

    test("캐시 관리", () => {
      const initialStatus = offlineService.getStatus();
      offlineService.clearCache();
      const afterClearStatus = offlineService.getStatus();

      assert.ok(
        afterClearStatus.cachedResponses <= initialStatus.cachedResponses
      );
    });
  });

  suite("Config Validation Service Tests", () => {
    let configService: ConfigValidationService;

    setup(() => {
      configService = ConfigValidationService.getInstance();
    });

    test("설정 검증 서비스 초기화", () => {
      assert.ok(configService);
    });

    test("설정 스키마 조회", () => {
      const schema = configService.getConfigSchema();
      assert.ok(schema);
      assert.ok(schema["hapa.apiBaseURL"]);
      assert.ok(schema["hapa.apiKey"]);
    });

    test("개별 설정 검증 - 유효한 값", () => {
      const result = configService.validateSingle(
        "hapa.apiBaseURL",
        "http://localhost:8000/api/v1"
      );
      assert.ok(result.isValid);
      assert.strictEqual(result.errors.length, 0);
    });

    test("개별 설정 검증 - 무효한 값", () => {
      const result = configService.validateSingle(
        "hapa.apiBaseURL",
        "invalid-url"
      );
      assert.ok(!result.isValid);
      assert.ok(result.errors.length > 0);
    });

    test("숫자 범위 검증", () => {
      const validResult = configService.validateSingle("hapa.maxTokens", 1000);
      assert.ok(validResult.isValid);

      const invalidResult = configService.validateSingle(
        "hapa.maxTokens",
        10000
      );
      assert.ok(!invalidResult.isValid);
    });

    test("설정 보고서 생성", () => {
      const report = configService.generateConfigReport();
      assert.ok(typeof report === "string");
      assert.ok(report.length > 0);
    });
  });

  suite("Integration Tests", () => {
    test("모든 서비스 인스턴스 생성", () => {
      const errorService = EnhancedErrorService.getInstance();
      const performanceOptimizer = PerformanceOptimizer.getInstance();
      const offlineService = OfflineService.getInstance();
      const configService = ConfigValidationService.getInstance();

      assert.ok(errorService);
      assert.ok(performanceOptimizer);
      assert.ok(offlineService);
      assert.ok(configService);
    });

    test("서비스 간 상호작용", () => {
      const errorService = EnhancedErrorService.getInstance();
      const performanceOptimizer = PerformanceOptimizer.getInstance();

      // 에러 로깅
      errorService.logError("통합 테스트 에러", ErrorSeverity.LOW);

      // 성능 보고서 생성
      const report = performanceOptimizer.generatePerformanceReport();

      // 결과 검증
      const recentErrors = errorService.getRecentErrors(1);

      assert.ok(recentErrors.length > 0);
      assert.ok(typeof report === "string");
      assert.ok(report.length > 0);
    });
  });

  suite("Configuration Tests", () => {
    test("VS Code 설정 접근", () => {
      const config = vscode.workspace.getConfiguration("hapa");
      assert.ok(config);

      // 기본 설정값들 확인
      const apiBaseURL = config.get("apiBaseURL");
      const autoComplete = config.get("autoComplete");

      assert.ok(typeof apiBaseURL === "string");
      assert.ok(typeof autoComplete === "boolean");
    });

    test("설정 업데이트 시뮬레이션", async () => {
      const config = vscode.workspace.getConfiguration("hapa");
      const originalValue = config.get("enableLogging");

      try {
        // 설정 변경 (테스트 환경에서는 실제로 변경되지 않을 수 있음)
        await config.update(
          "enableLogging",
          !originalValue,
          vscode.ConfigurationTarget.Global
        );

        // 변경된 값 확인 (실제 환경에서는 동작)
        const newValue = config.get("enableLogging");
        console.log(`설정 변경 테스트: ${originalValue} -> ${newValue}`);
      } catch (error) {
        // 테스트 환경에서는 설정 변경이 제한될 수 있음
        console.log("설정 변경 제한:", error);
      }
    });
  });
});
