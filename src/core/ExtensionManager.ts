/**
 * HAPA VSCode Extension - 확장 관리자 (리팩토링됨)
 * @fileoverview 확장의 전체 생명주기를 관리하는 중앙 컨트롤러
 */

import * as vscode from "vscode";
import { ProviderRegistry } from "./ProviderRegistry";
import { CommandRegistry } from "./CommandRegistry";
import { ServiceManager } from "./ServiceManager";
import { configService } from "../services/ConfigService";
import {
  EnhancedErrorService,
  ErrorSeverity,
} from "../services/EnhancedErrorService";
import { TriggerDetector, TriggerEvent } from "../modules/triggerDetector";
import { CodeInserter } from "../modules/inserter";
import { SidebarProvider } from "../providers/SidebarProvider";
import { OnboardingProvider } from "../providers/OnboardingProvider";
import { SettingsProvider } from "../providers/SettingsProvider";
import { GuideProvider } from "../providers/GuideProvider";

/**
 * 리팩토링된 확장 관리자 클래스
 * - 단일 책임 원칙을 적용하여 각 관리자들에게 책임 위임
 * - 간소화된 구조로 유지보수성 향상
 */
export class ExtensionManager {
  private context: vscode.ExtensionContext;
  private extensionUri: vscode.Uri;

  // 핵심 매니저들
  private providerRegistry!: ProviderRegistry;
  private commandRegistry!: CommandRegistry;
  private serviceManager!: ServiceManager;

  // 활성화 상태
  private isActivated = false;

  // 트리거 및 코드 처리
  private triggerDetector: TriggerDetector | null = null;
  private codeInserter: CodeInserter;

  // 이벤트 리스너 disposables
  private eventDisposables: vscode.Disposable[] = [];

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.extensionUri = context.extensionUri;
    this.codeInserter = new CodeInserter();

    // 매니저들 초기화
    this.serviceManager = new ServiceManager();
    this.providerRegistry = new ProviderRegistry(this.extensionUri);

    // CommandRegistry는 프로바이더들이 등록된 후에 초기화될 예정
    // (registerProviders 메서드에서 초기화)
  }

  /**
   * 🚀 확장 활성화 (메인 엔트리포인트)
   */
  public async activate(): Promise<void> {
    if (this.isActivated) {
      console.warn("⚠️ Extension is already activated");
      return;
    }

    console.log("🚀 HAPA Extension 활성화 시작...");
    const activationStartTime = Date.now();

    try {
      // 1단계: 서비스 초기화
      await this.initializeServices();

      // 2단계: 설정 서비스 설정
      this.initializeConfigService();

      // 3단계: 프로바이더 등록
      await this.registerProviders();

      // 4단계: 명령어 등록
      this.registerCommands();

      // 5단계: 이벤트 리스너 등록
      this.registerEventListeners();

      // 6단계: 트리거 디텍터 설정
      this.setupTriggerDetector();

      // 7단계: 온보딩 확인
      await this.checkOnboarding();

      // 활성화 완료
      this.isActivated = true;
      const activationTime = Date.now() - activationStartTime;

      console.log(`✅ HAPA Extension 활성화 완료 (${activationTime}ms)`);
      this.logActivationSummary();
    } catch (error) {
      const errorService = EnhancedErrorService.getInstance();
      errorService.logError(
        error instanceof Error ? error : new Error(String(error)),
        ErrorSeverity.CRITICAL,
        { component: "ExtensionManager", operation: "activate" }
      );

      // 부분적 정리
      await this.handleActivationFailure();
      throw error;
    }
  }

  /**
   * 🔧 1단계: 서비스 초기화
   */
  private async initializeServices(): Promise<void> {
    console.log("🔧 서비스 초기화 시작...");

    try {
      await this.serviceManager.initializeAllServices();
      console.log("✅ 서비스 초기화 완료");
    } catch (error) {
      console.error("❌ 서비스 초기화 실패:", error);
      throw new Error(`서비스 초기화 실패: ${error}`);
    }
  }

  /**
   * ⚙️ 2단계: 설정 서비스 설정
   */
  private initializeConfigService(): void {
    console.log("⚙️ 설정 서비스 초기화 중...");

    try {
      configService.setContext(this.context);
      console.log("✅ 설정 서비스 초기화 완료");
    } catch (error) {
      console.error("❌ 설정 서비스 초기화 실패:", error);
      throw new Error(`설정 서비스 초기화 실패: ${error}`);
    }
  }

  /**
   * 📦 3단계: 프로바이더 등록
   */
  private async registerProviders(): Promise<void> {
    console.log("📦 프로바이더 등록 시작...");

    try {
      await this.providerRegistry.registerAllProviders(this.context);

      // 프로바이더들의 disposable을 context에 추가
      const providerDisposables = this.providerRegistry.getDisposables();
      this.context.subscriptions.push(...providerDisposables);

      // 이제 프로바이더들이 등록되었으므로 CommandRegistry 초기화
      await this.initializeCommandRegistry();

      console.log("✅ 프로바이더 등록 완료");
    } catch (error) {
      console.error("❌ 프로바이더 등록 실패:", error);
      throw new Error(`프로바이더 등록 실패: ${error}`);
    }
  }

  /**
   * 📋 3.5단계: CommandRegistry 초기화
   */
  private async initializeCommandRegistry(): Promise<void> {
    console.log("🔧 CommandRegistry 초기화 시작...");

    try {
      // 프로바이더들 가져오기
      const sidebarProvider =
        this.providerRegistry.getProvider<SidebarProvider>("sidebar");
      const onboardingProvider =
        this.providerRegistry.getProvider<OnboardingProvider>("onboarding");
      const settingsProvider =
        this.providerRegistry.getProvider<SettingsProvider>("settings");
      const guideProvider =
        this.providerRegistry.getProvider<GuideProvider>("guide");

      if (
        !sidebarProvider ||
        !onboardingProvider ||
        !settingsProvider ||
        !guideProvider
      ) {
        throw new Error("필수 프로바이더들이 등록되지 않았습니다");
      }

      // CommandRegistry 초기화
      this.commandRegistry = new CommandRegistry(
        {
          providerRegistry: this.providerRegistry,
          extensionContext: this.context,
        },
        sidebarProvider,
        onboardingProvider,
        settingsProvider,
        guideProvider
      );

      console.log("✅ CommandRegistry 초기화 완료");
    } catch (error) {
      console.error("❌ CommandRegistry 초기화 실패:", error);
      throw new Error(`CommandRegistry 초기화 실패: ${error}`);
    }
  }

  /**
   * 📋 4단계: 명령어 등록
   */
  private registerCommands(): void {
    console.log("📋 명령어 등록 시작...");

    try {
      if (!this.commandRegistry) {
        throw new Error("CommandRegistry가 초기화되지 않았습니다");
      }

      const commandDisposables = this.commandRegistry.registerAllCommands();

      // 명령어들의 disposable을 context에 추가
      this.context.subscriptions.push(...commandDisposables);

      console.log("✅ 명령어 등록 완료");
    } catch (error) {
      console.error("❌ 명령어 등록 실패:", error);
      throw new Error(`명령어 등록 실패: ${error}`);
    }
  }

  /**
   * 🎧 5단계: 이벤트 리스너 등록
   */
  private registerEventListeners(): void {
    console.log("🎧 이벤트 리스너 등록 시작...");

    try {
      // 설정 변경 이벤트
      const configChangeDisposable = vscode.workspace.onDidChangeConfiguration(
        (event) => this.onConfigurationChanged(event)
      );

      // 활성 에디터 변경 이벤트
      const editorChangeDisposable = vscode.window.onDidChangeActiveTextEditor(
        (editor) => this.onActiveEditorChanged(editor)
      );

      // 텍스트 문서 변경 이벤트
      const textChangeDisposable = vscode.workspace.onDidChangeTextDocument(
        (event) => this.onTextDocumentChanged(event)
      );

      // 창 상태 변경 이벤트
      const windowStateDisposable = vscode.window.onDidChangeWindowState(
        (state) => this.onWindowStateChanged(state)
      );

      this.eventDisposables = [
        configChangeDisposable,
        editorChangeDisposable,
        textChangeDisposable,
        windowStateDisposable,
      ];

      // context에 추가
      this.context.subscriptions.push(...this.eventDisposables);

      console.log("✅ 이벤트 리스너 등록 완료");
    } catch (error) {
      console.error("❌ 이벤트 리스너 등록 실패:", error);
      throw new Error(`이벤트 리스너 등록 실패: ${error}`);
    }
  }

  /**
   * 🎯 6단계: 트리거 디텍터 설정
   */
  private setupTriggerDetector(): void {
    console.log("🎯 트리거 디텍터 설정 시작...");

    try {
      this.triggerDetector = new TriggerDetector();

      // 트리거 이벤트 처리
      this.triggerDetector.onTrigger((event: TriggerEvent) => {
        this.handleTriggerEvent(event);
      });

      console.log("✅ 트리거 디텍터 설정 완료");
    } catch (error) {
      console.error("❌ 트리거 디텍터 설정 실패:", error);
      // 트리거 디텍터는 중요하지만 확장 전체를 중단시키지 않음
      const errorService = EnhancedErrorService.getInstance();
      errorService.logError(
        error instanceof Error ? error : new Error(String(error)),
        ErrorSeverity.HIGH,
        { component: "TriggerDetector" }
      );
    }
  }

  /**
   * 🏁 7단계: 온보딩 확인
   */
  private async checkOnboarding(): Promise<void> {
    console.log("🏁 온보딩 확인 시작...");

    try {
      const isOnboardingCompleted = configService.get<boolean>(
        "userProfile.isOnboardingCompleted",
        false
      );

      if (!isOnboardingCompleted) {
        console.log("🎓 온보딩이 필요함 - 온보딩 프로바이더 표시");

        // 온보딩 프로바이더 가져오기
        const onboardingProvider =
          this.providerRegistry.getProvider("onboarding");
        if (onboardingProvider) {
          // 메서드 존재성 검증 후 호출
          if (this.hasMethod(onboardingProvider, 'show')) {
            // 2초 후 온보딩 표시 (다른 초기화가 완료된 후)
            setTimeout(() => {
              (onboardingProvider as any).show();
            }, 2000);
          } else {
            console.warn("⚠️ OnboardingProvider에 show 메서드가 없습니다. resolveWebviewView를 통해 표시됩니다.");
            // show 메서드가 없는 경우 대안: 명령어를 통한 온보딩 시작
            setTimeout(() => {
              vscode.commands.executeCommand("hapa.showOnboarding");
            }, 2000);
          }
        }
      } else {
        console.log("✅ 온보딩이 이미 완료됨");
      }

      console.log("✅ 온보딩 확인 완료");
    } catch (error) {
      console.error("❌ 온보딩 확인 실패:", error);
      // 온보딩 확인 실패는 치명적이지 않음
    }
  }

  /**
   * 🎯 트리거 이벤트 처리
   */
  private async handleTriggerEvent(event: TriggerEvent): Promise<void> {
    try {
      const sidebarProvider =
        this.providerRegistry.getProvider<SidebarProvider>("sidebar");
      // 트리거 이벤트 처리 로직 (메서드가 private이므로 직접 호출 대신 로깅)
      if (sidebarProvider) {
        console.log(`🎯 트리거 이벤트 감지: ${event.type}`);
        // TODO: SidebarProvider에 public 메서드 추가 필요
      }
    } catch (error) {
      const errorService = EnhancedErrorService.getInstance();
      errorService.logError(
        error instanceof Error ? error : new Error(String(error)),
        ErrorSeverity.MEDIUM,
        { event: event.type, component: "TriggerEventHandler" }
      );
    }
  }

  // =============================================================================
  // 이벤트 핸들러들
  // =============================================================================

  /**
   * 설정 변경 이벤트 처리
   */
  private async onConfigurationChanged(
    event: vscode.ConfigurationChangeEvent
  ): Promise<void> {
    if (event.affectsConfiguration("hapa")) {
      console.log("🔄 HAPA 설정 변경 감지");

      try {
        // 설정 검증
        const configValidationService = this.serviceManager.getService(
          "ConfigValidationService"
        );
        if (configValidationService && this.hasMethod(configValidationService, 'validateAllConfigs')) {
          (configValidationService as any).validateAllConfigs();
        }

        // 프로바이더들에게 설정 변경 알림 (메서드가 존재하는 경우에만)
        const sidebarProvider =
          this.providerRegistry.getProvider<SidebarProvider>("sidebar");
        if (sidebarProvider) {
          // onConfigurationChanged 메서드가 존재하지 않으므로 제거
          console.log("✅ SidebarProvider 설정 변경 알림 (메서드 없음)");
        }

        console.log("✅ 설정 변경 처리 완료");
      } catch (error) {
        console.error("❌ 설정 변경 처리 실패:", error);
      }
    }
  }

  /**
   * 활성 에디터 변경 이벤트 처리
   */
  private onActiveEditorChanged(editor: vscode.TextEditor | undefined): void {
    try {
      // 성능 메트릭 수집
      const performanceOptimizer = this.serviceManager.getService(
        "PerformanceOptimizer"
      );
      if (performanceOptimizer && this.hasMethod(performanceOptimizer, 'recordEditorChange')) {
        (performanceOptimizer as any).recordEditorChange(!!editor);
      }

      // 접근성 서비스에 알림
      const accessibilityService = this.serviceManager.getService(
        "AccessibilityService"
      );
      if (accessibilityService && this.hasMethod(accessibilityService, 'handleEditorChange')) {
        (accessibilityService as any).handleEditorChange(editor);
      }
    } catch (error) {
      console.error("❌ 활성 에디터 변경 처리 실패:", error);
    }
  }

  /**
   * 텍스트 문서 변경 이벤트 처리
   */
  private onTextDocumentChanged(event: vscode.TextDocumentChangeEvent): void {
    try {
      // 트리거 디텍터에 변경 사항 전달 (메서드가 존재하지 않으므로 제거)
      if (this.triggerDetector) {
        // onTextChanged 메서드가 존재하지 않으므로 로그만 남김
        console.log(
          "🔄 텍스트 변경 감지:",
          event.contentChanges.length,
          "개 변경사항"
        );
      }

      // 성능 메트릭 수집
      const performanceOptimizer = this.serviceManager.getService(
        "PerformanceOptimizer"
      );
      if (performanceOptimizer && this.hasMethod(performanceOptimizer, 'recordTextChange')) {
        (performanceOptimizer as any).recordTextChange(
          event.contentChanges.length
        );
      }
    } catch (error) {
      console.error("❌ 텍스트 문서 변경 처리 실패:", error);
    }
  }

  /**
   * 창 상태 변경 이벤트 처리
   */
  private onWindowStateChanged(state: vscode.WindowState): void {
    try {
      // 텔레메트리 서비스에 창 상태 전달
      const telemetryService =
        this.serviceManager.getService("TelemetryService");
      if (telemetryService && this.hasMethod(telemetryService, 'recordWindowState')) {
        (telemetryService as any).recordWindowState(state);
      }

      // 오프라인 서비스에 포커스 상태 전달
      const offlineService = this.serviceManager.getService("OfflineService");
      if (offlineService && this.hasMethod(offlineService, 'handleWindowFocus')) {
        (offlineService as any).handleWindowFocus(state.focused);
      }
    } catch (error) {
      console.error("❌ 창 상태 변경 처리 실패:", error);
    }
  }

  // =============================================================================
  // 유틸리티 메서드들
  // =============================================================================

  /**
   * 객체에 특정 메서드가 존재하는지 안전하게 확인
   */
  private hasMethod(obj: any, methodName: string): boolean {
    try {
      return obj && typeof obj[methodName] === "function";
    } catch (error) {
      console.warn(`⚠️ 메서드 존재성 확인 중 오류: ${methodName}`, error);
      return false;
    }
  }

  /**
   * 활성화 요약 로깅
   */
  private logActivationSummary(): void {
    const summary = {
      services: this.serviceManager.getServiceCount(),
      providers: this.providerRegistry.getProviderCount(),
      commands: this.commandRegistry.getRegisteredCommands().length,
      eventListeners: this.eventDisposables.length,
      isActivated: this.isActivated,
      timestamp: new Date().toISOString(),
    };

    console.log("📊 활성화 요약:", summary);
  }

  /**
   * 활성화 실패 처리
   */
  private async handleActivationFailure(): Promise<void> {
    console.error("🚨 확장 활성화 실패 - 부분 정리 시작");

    try {
      // 이벤트 리스너 정리
      this.eventDisposables.forEach((disposable) => disposable.dispose());
      this.eventDisposables = [];

      // 서비스 정리
      await this.serviceManager.cleanup();

      // 프로바이더 정리
      this.providerRegistry.dispose();

      // 명령어 정리 (commandRegistry가 초기화된 경우에만)
      if (this.commandRegistry) {
        this.commandRegistry.dispose();
      }

      console.log("✅ 부분 정리 완료");
    } catch (cleanupError) {
      console.error("❌ 부분 정리 실패:", cleanupError);
    }
  }

  // =============================================================================
  // 확장 비활성화
  // =============================================================================

  /**
   * 🔄 확장 비활성화
   */
  public async deactivate(): Promise<void> {
    if (!this.isActivated) {
      console.warn("⚠️ Extension is not activated");
      return;
    }

    console.log("🔄 HAPA Extension 비활성화 시작...");
    const deactivationStartTime = Date.now();

    try {
      // 트리거 디텍터 정리
      if (this.triggerDetector) {
        if (this.hasMethod(this.triggerDetector, 'dispose')) {
          (this.triggerDetector as any).dispose();
        }
        this.triggerDetector = null;
      }

      // 이벤트 리스너 정리
      this.eventDisposables.forEach((disposable) => disposable.dispose());
      this.eventDisposables = [];

      // 명령어 정리 (commandRegistry가 존재하는 경우에만)
      if (this.commandRegistry) {
        this.commandRegistry.dispose();
      }

      // 프로바이더 정리
      this.providerRegistry.dispose();

      // 서비스 정리
      await this.serviceManager.cleanup();

      this.isActivated = false;
      const deactivationTime = Date.now() - deactivationStartTime;

      console.log(`✅ HAPA Extension 비활성화 완료 (${deactivationTime}ms)`);
    } catch (error) {
      console.error("❌ 확장 비활성화 실패:", error);
      const errorService = EnhancedErrorService.getInstance();
      errorService.logError(
        error instanceof Error ? error : new Error(String(error)),
        ErrorSeverity.HIGH,
        { component: "ExtensionManager", operation: "deactivate" }
      );
    }
  }

  // =============================================================================
  // 공개 API 메서드들
  // =============================================================================

  /**
   * 특정 프로바이더 가져오기
   */
  public getProvider<T>(name: string): T | undefined {
    return this.providerRegistry.getProvider<T>(name);
  }

  /**
   * 특정 서비스 가져오기
   */
  public getService<T>(name: string): T | undefined {
    return this.serviceManager.getService<T>(name);
  }

  /**
   * 확장 컨텍스트 가져오기
   */
  public getContext(): vscode.ExtensionContext {
    return this.context;
  }

  /**
   * 활성화 상태 확인
   */
  public isExtensionActivated(): boolean {
    return this.isActivated;
  }

  /**
   * 확장 상태 정보
   */
  public getExtensionStatus(): any {
    return {
      isActivated: this.isActivated,
      serviceStatus: this.serviceManager.getServiceStatus(),
      providerStatus: this.providerRegistry.getProviderStatus(),
      registeredCommands: this.commandRegistry ? this.commandRegistry.getRegisteredCommands().length : 0,
      activeEventListeners: this.eventDisposables.length,
    };
  }

  /**
   * 코드 삽입기 가져오기
   */
  public getCodeInserter(): CodeInserter {
    return this.codeInserter;
  }

  /**
   * 특정 서비스 재시작
   */
  public async restartService(serviceName: string): Promise<void> {
    await this.serviceManager.restartService(serviceName);
  }

  /**
   * 확장 상태 보고서 생성 (디버깅용)
   */
  public generateStatusReport(): any {
    return {
      extension: {
        isActivated: this.isActivated,
        activationTime: new Date().toISOString(),
      },
      services: {
        count: this.serviceManager.getServiceCount(),
        names: this.serviceManager.getServiceNames(),
        status: this.serviceManager.getServiceStatus(),
        dependencies: this.serviceManager.generateDependencyGraph(),
      },
      providers: {
        count: this.providerRegistry.getProviderCount(),
        ids: this.providerRegistry.getProviderIds(),
        status: this.providerRegistry.getProviderStatus(),
      },
      commands: {
        total: this.commandRegistry ? this.commandRegistry.getRegisteredCommands().length : 0,
        byCategory: this.commandRegistry ? {
          basic: this.commandRegistry.getCommandsByCategory("basic").length,
          analysis:
            this.commandRegistry.getCommandsByCategory("analysis").length,
          settings:
            this.commandRegistry.getCommandsByCategory("settings").length,
          advanced:
            this.commandRegistry.getCommandsByCategory("advanced").length,
          accessibility:
            this.commandRegistry.getCommandsByCategory("accessibility").length,
          responsive:
            this.commandRegistry.getCommandsByCategory("responsive").length,
        } : {
          basic: 0,
          analysis: 0,
          settings: 0,
          advanced: 0,
          accessibility: 0,
          responsive: 0,
        },
      },
      events: {
        activeListeners: this.eventDisposables.length,
      },
    };
  }
}
