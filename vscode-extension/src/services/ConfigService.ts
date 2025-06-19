/**
 * HAPA VSCode Extension - 설정 관리 서비스
 * @fileoverview VSCode 확장의 모든 설정을 중앙에서 관리
 */

import * as vscode from "vscode";
import { ExtensionConfig, UserProfile, APIConfig } from "../types";

/**
 * 설정 변경 이벤트
 */
export interface ConfigChangeEvent {
  key: string;
  oldValue: any;
  newValue: any;
  timestamp: Date;
}

/**
 * 설정 관리 서비스
 */
export class ConfigService {
  private static instance: ConfigService;
  private listeners: ((event: ConfigChangeEvent) => void)[] = [];
  private disposables: vscode.Disposable[] = [];
  private context?: vscode.ExtensionContext;

  private constructor() {
    // 설정 변경 감지
    this.disposables.push(
      vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration("hapa")) {
          this.notifyConfigChange();
        }
      })
    );
  }

  /**
   * 싱글톤 인스턴스 반환
   */
  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  /**
   * Extension Context 설정
   */
  public setContext(context: vscode.ExtensionContext): void {
    this.context = context;
  }

  /**
   * Extension Context 가져오기
   */
  public getContext(): vscode.ExtensionContext | undefined {
    return this.context;
  }

  /**
   * 설정 변경 리스너 등록
   */
  public onConfigChange(
    listener: (event: ConfigChangeEvent) => void
  ): vscode.Disposable {
    this.listeners.push(listener);
    return new vscode.Disposable(() => {
      const index = this.listeners.indexOf(listener);
      if (index !== -1) {
        this.listeners.splice(index, 1);
      }
    });
  }

  /**
   * 전체 확장 설정 가져오기
   */
  public getExtensionConfig(): ExtensionConfig {
    const config = vscode.workspace.getConfiguration("hapa");

    return {
      enableCodeAnalysis: config.get("enableCodeAnalysis", true),
      theme: config.get("theme", "system"),
      apiBaseURL: config.get("apiBaseURL", "http://localhost:8000/api/v1"),
      apiKey: config.get("apiKey", "hapa_demo_20241228_secure_key_for_testing"),
      apiTimeout: config.get("apiTimeout", 30000),
      autoComplete: config.get("autoComplete", true),
      maxSuggestions: config.get("maxSuggestions", 5),
      enableLogging: config.get("enableLogging", false),
      userProfile: this.getUserProfile(),
      commentTrigger: {
        enabled: config.get("commentTrigger.enabled", true),
        resultDisplayMode: config.get(
          "commentTrigger.resultDisplayMode",
          "sidebar"
        ),
        autoInsertDelay: config.get("commentTrigger.autoInsertDelay", 0),
        showNotification: config.get("commentTrigger.showNotification", true),
      },
    };
  }

  /**
   * API 설정 가져오기
   */
  public getAPIConfig(): APIConfig {
    const config = vscode.workspace.getConfiguration("hapa");

    return {
      baseURL: config.get("apiBaseURL", "http://localhost:8000/api/v1"),
      timeout: config.get("apiTimeout", 30000),
      apiKey: config.get("apiKey", "hapa_demo_20241228_secure_key_for_testing"),
      retryAttempts: config.get("retryAttempts", 3),
      retryDelay: config.get("retryDelay", 1000),
    };
  }

  /**
   * 사용자 프로필 가져오기
   */
  public getUserProfile(): UserProfile {
    const config = vscode.workspace.getConfiguration("hapa.userProfile");

    return {
      pythonSkillLevel: config.get("pythonSkillLevel", "intermediate"),
      codeOutputStructure: config.get("codeOutputStructure", "standard"),
      explanationStyle: config.get("explanationStyle", "standard"),
      projectContext: config.get("projectContext", "general_purpose"),
      errorHandlingPreference: config.get("errorHandlingPreference", "basic"),
      preferredLanguageFeatures: config.get("preferredLanguageFeatures", [
        "type_hints",
        "f_strings",
      ]),
      isOnboardingCompleted: config.get("isOnboardingCompleted", false),
    };
  }

  /**
   * 특정 설정 값 가져오기
   */
  public get<T>(key: string, defaultValue: T): T {
    const config = vscode.workspace.getConfiguration("hapa");
    return config.get(key, defaultValue);
  }

  /**
   * 특정 설정 값 업데이트
   */
  public async update(
    key: string,
    value: any,
    isGlobal: boolean = true
  ): Promise<void> {
    const config = vscode.workspace.getConfiguration("hapa");
    const oldValue = config.get(key);

    await config.update(key, value, isGlobal);

    // 변경 이벤트 발생
    this.notifyConfigChangeForKey(key, oldValue, value);
  }

  /**
   * 사용자 프로필 업데이트
   */
  public async updateUserProfile(profile: Partial<UserProfile>): Promise<void> {
    const currentProfile = this.getUserProfile();
    const updatedProfile = { ...currentProfile, ...profile };

    const config = vscode.workspace.getConfiguration("hapa.userProfile");

    // 각 속성을 개별적으로 업데이트
    for (const [key, value] of Object.entries(profile)) {
      await config.update(key, value, true);
    }
  }

  /**
   * API 키 업데이트
   */
  public async updateAPIKey(apiKey: string): Promise<void> {
    await this.update("apiKey", apiKey, true);
  }

  /**
   * 온보딩 완료 상태 업데이트
   */
  public async markOnboardingCompleted(): Promise<void> {
    await this.update("userProfile.isOnboardingCompleted", true, true);
  }

  /**
   * 설정 검증
   */
  public validateConfig(): { isValid: boolean; errors: string[] } {
    const config = this.getExtensionConfig();
    const errors: string[] = [];

    // API URL 검증
    try {
      new URL(config.apiBaseURL);
    } catch {
      errors.push("유효하지 않은 API URL입니다.");
    }

    // API 키 검증
    if (!config.apiKey || config.apiKey.length < 10) {
      errors.push("API 키가 설정되지 않았거나 너무 짧습니다.");
    }

    // 타임아웃 검증
    if (config.apiTimeout < 1000 || config.apiTimeout > 300000) {
      errors.push("API 타임아웃은 1초~5분 사이여야 합니다.");
    }

    // 최대 제안 수 검증
    if (config.maxSuggestions < 1 || config.maxSuggestions > 20) {
      errors.push("최대 제안 수는 1~20 사이여야 합니다.");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 기본 설정으로 리셋
   */
  public async resetToDefaults(): Promise<void> {
    const config = vscode.workspace.getConfiguration("hapa");
    const inspection = config.inspect("");

    if (inspection) {
      // 모든 사용자 설정 제거
      for (const key of Object.keys(inspection.globalValue || {})) {
        await config.update(key, undefined, true);
      }
    }
  }

  /**
   * 설정 내보내기
   */
  public exportConfig(): string {
    const config = this.getExtensionConfig();
    return JSON.stringify(config, null, 2);
  }

  /**
   * 설정 가져오기
   */
  public async importConfig(configJson: string): Promise<void> {
    try {
      const importedConfig = JSON.parse(configJson) as ExtensionConfig;

      // 설정 검증
      const validation = this.validateImportedConfig(importedConfig);
      if (!validation.isValid) {
        throw new Error(`설정 가져오기 실패: ${validation.errors.join(", ")}`);
      }

      // 설정 적용
      for (const [key, value] of Object.entries(importedConfig)) {
        if (key === "userProfile") {
          await this.updateUserProfile(value as UserProfile);
        } else {
          await this.update(key, value, true);
        }
      }
    } catch (error) {
      throw new Error(
        `설정 가져오기 실패: ${
          error instanceof Error ? error.message : "알 수 없는 오류"
        }`
      );
    }
  }

  /**
   * 가져온 설정 검증
   */
  private validateImportedConfig(config: any): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // 필수 필드 검증
    const requiredFields = ["apiBaseURL", "apiKey", "apiTimeout"];
    for (const field of requiredFields) {
      if (!(field in config)) {
        errors.push(`필수 설정이 누락되었습니다: ${field}`);
      }
    }

    // 타입 검증
    if (typeof config.apiBaseURL !== "string") {
      errors.push("apiBaseURL은 문자열이어야 합니다.");
    }

    if (typeof config.apiTimeout !== "number") {
      errors.push("apiTimeout은 숫자여야 합니다.");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 설정 변경 알림
   */
  private notifyConfigChange(): void {
    // 전체 설정 변경 이벤트
    this.listeners.forEach((listener) => {
      listener({
        key: "hapa",
        oldValue: null,
        newValue: this.getExtensionConfig(),
        timestamp: new Date(),
      });
    });
  }

  /**
   * 특정 키 설정 변경 알림
   */
  private notifyConfigChangeForKey(
    key: string,
    oldValue: any,
    newValue: any
  ): void {
    this.listeners.forEach((listener) => {
      listener({
        key,
        oldValue,
        newValue,
        timestamp: new Date(),
      });
    });
  }

  /**
   * 리소스 정리
   */
  public dispose(): void {
    this.disposables.forEach((disposable) => disposable.dispose());
    this.listeners = [];
  }
}

/**
 * 설정 서비스 인스턴스 내보내기
 */
export const configService = ConfigService.getInstance();
