import * as vscode from "vscode";
import { BaseWebviewProvider } from "./BaseWebviewProvider";

/**
 * 사용자 온보딩 웹뷰 프로바이더
 */
export class OnboardingProvider extends BaseWebviewProvider {
  private currentStep: number = 0;
  private readonly totalSteps: number = 6;
  private userProfile: any = {};

  constructor(extensionUri: vscode.Uri) {
    super(extensionUri);
  }

  /**
   * 웹뷰 패널용 public HTML 생성 메서드
   */
  public getPublicHtmlContent(webview: vscode.Webview): string {
    return this.getHtmlContent(webview);
  }

  /**
   * 웹뷰 패널용 public 메시지 핸들러 설정 메서드
   */
  public setupPublicHandlers(webview: vscode.Webview): void {
    this.setupMessageHandlers(webview);
  }

  protected getHtmlContent(webview: vscode.Webview): string {
    return this.generateOnboardingHtml();
  }

  protected handleCustomMessage(message: any) {
    switch (message.command) {
      case "nextStep":
        this.handleNextStep(message.data);
        break;
      case "previousStep":
        this.handlePreviousStep();
        break;
      case "completeOnboarding":
        this.completeOnboarding(message.data);
        break;
      case "skipOnboarding":
        this.skipOnboarding();
        break;
    }
  }

  /**
   * 다음 단계로 이동
   */
  private handleNextStep(stepData: any) {
    // 현재 단계 데이터 저장
    this.userProfile = { ...this.userProfile, ...stepData };

    if (this.currentStep < this.totalSteps - 1) {
      this.currentStep++;
      this.updateWebview();
    }
  }

  /**
   * 이전 단계로 이동
   */
  private handlePreviousStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.updateWebview();
    }
  }

  /**
   * 온보딩 완료 (개선된 버전 - 유효성 검증 강화)
   */
  private async completeOnboarding(finalData: any) {
    try {
      // 1. 최종 데이터 검증 및 병합
      const validatedData = this.validateAndMergeData(finalData);
      if (!validatedData) {
        vscode.window.showErrorMessage(
          "입력 데이터가 유효하지 않습니다. 다시 확인해주세요."
        );
        return;
      }

      this.userProfile = validatedData;

      // 2. 온보딩 완료 로그
      console.log("📝 온보딩 완료 데이터:", {
        email: this.userProfile.email,
        skillLevel: this.userProfile.skillLevel,
        projectContext: this.userProfile.projectContext,
        features: this.userProfile.languageFeatures?.length || 0,
      });

      // 3. 로컬 설정 저장 (우선 처리)
      await this.saveToLocalConfig();

      // 4. 진행률 표시
      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "HAPA 설정 저장 중...",
          cancellable: false,
        },
        async (progress) => {
          progress.report({ increment: 30, message: "로컬 설정 저장 완료" });

          // 5. DB 저장 시도
          const dbSaveSuccess = await this.saveUserProfileToDB();
          progress.report({ increment: 70, message: "서버 동기화 중..." });

          await new Promise((resolve) => setTimeout(resolve, 500)); // 사용자 경험을 위한 짧은 지연

          if (dbSaveSuccess) {
            vscode.window
              .showInformationMessage(
                "🎉 HAPA 온보딩이 완료되었습니다! 설정이 서버에 저장되어 다른 기기에서도 동기화됩니다.",
                "HAPA 시작하기"
              )
              .then((selection) => {
                if (selection === "HAPA 시작하기") {
                  vscode.commands.executeCommand("hapa.openSidebar");
                }
              });
          } else {
            vscode.window
              .showWarningMessage(
                "⚠️ 온보딩은 완료되었지만 서버 저장에 실패했습니다. 설정은 로컬에 저장되었습니다.",
                "확인",
                "다시 시도"
              )
              .then((selection) => {
                if (selection === "다시 시도") {
                  this.saveUserProfileToDB();
                }
              });
          }

          // 6. 완료 화면 표시
          if (this._view) {
            this._view.webview.html = this.generateCompletionHtml();
          }

          // 7. 완료 이벤트 발생 (다른 모듈에서 감지 가능)
          vscode.commands.executeCommand(
            "hapa.onboardingCompleted",
            this.userProfile
          );

          return dbSaveSuccess;
        }
      );
    } catch (error) {
      console.error("❌ 온보딩 완료 중 오류:", error);
      vscode.window
        .showErrorMessage(
          `설정 저장 중 오류가 발생했습니다: ${
            (error as Error).message
          }. 다시 시도해주세요.`,
          "다시 시도"
        )
        .then((selection) => {
          if (selection === "다시 시도") {
            this.completeOnboarding(finalData);
          }
        });
    }
  }

  /**
   * 온보딩 데이터 유효성 검증 및 병합
   */
  private validateAndMergeData(finalData: any): any | null {
    try {
      const merged = { ...this.userProfile, ...finalData };

      // 필수 필드 검증
      const requiredFields = [
        "email",
        "skillLevel",
        "outputStructure",
        "explanationStyle",
        "projectContext",
      ];
      for (const field of requiredFields) {
        if (!merged[field]) {
          console.error(`❌ 필수 필드 누락: ${field}`);
          return null;
        }
      }

      // 이메일 형식 재검증
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(merged.email)) {
        console.error("❌ 이메일 형식 오류");
        return null;
      }

      // 언어 기능 배열 검증
      if (!Array.isArray(merged.languageFeatures)) {
        merged.languageFeatures = [];
      }

      // 기본값 설정
      merged.username = merged.username || merged.email.split("@")[0];
      merged.errorHandling = merged.errorHandling || "basic";
      merged.commentTriggerMode = merged.commentTriggerMode || "confirm_insert";

      console.log("✅ 데이터 유효성 검증 완료");
      return merged;
    } catch (error) {
      console.error("❌ 데이터 검증 중 오류:", error);
      return null;
    }
  }

  /**
   * 로컬 VSCode 설정 저장
   */
  private async saveToLocalConfig(): Promise<void> {
    const config = vscode.workspace.getConfiguration("hapa");

    await config.update(
      "userProfile.isOnboardingCompleted",
      true,
      vscode.ConfigurationTarget.Global
    );

    // 이메일 저장 (Step 0에서 수집)
    if (this.userProfile.email) {
      await config.update(
        "userProfile.email",
        this.userProfile.email,
        vscode.ConfigurationTarget.Global
      );
    }

    if (this.userProfile.username) {
      await config.update(
        "userProfile.username",
        this.userProfile.username,
        vscode.ConfigurationTarget.Global
      );
    }

    await config.update(
      "userProfile.pythonSkillLevel",
      this.userProfile.skillLevel,
      vscode.ConfigurationTarget.Global
    );
    await config.update(
      "userProfile.codeOutputStructure",
      this.userProfile.outputStructure,
      vscode.ConfigurationTarget.Global
    );
    await config.update(
      "userProfile.explanationStyle",
      this.userProfile.explanationStyle,
      vscode.ConfigurationTarget.Global
    );
    await config.update(
      "userProfile.projectContext",
      this.userProfile.projectContext,
      vscode.ConfigurationTarget.Global
    );
    await config.update(
      "userProfile.errorHandlingPreference",
      this.userProfile.errorHandling,
      vscode.ConfigurationTarget.Global
    );

    if (this.userProfile.languageFeatures) {
      await config.update(
        "userProfile.preferredLanguageFeatures",
        this.userProfile.languageFeatures,
        vscode.ConfigurationTarget.Global
      );
    }

    // 주석 트리거 설정 저장
    if (this.userProfile.commentTriggerMode) {
      await config.update(
        "commentTrigger.resultDisplayMode",
        this.userProfile.commentTriggerMode,
        vscode.ConfigurationTarget.Global
      );
    }
  }

  /**
   * DB에 사용자 프로필 저장 (개선된 버전 - 재시도 로직 포함)
   */
  private async saveUserProfileToDB(): Promise<boolean> {
    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        // 이메일이 없으면 DB 저장 건너뛰기
        if (!this.userProfile.email) {
          console.log("이메일이 없어 DB 저장을 건너뜁니다.");
          return false;
        }

        // 1. 사용자 등록/로그인 (재시도 포함)
        const authResult = await this.loginOrRegisterUserWithRetry();
        if (!authResult || !authResult.access_token) {
          throw new Error("사용자 인증 실패");
        }

        // 2. 설정을 DB 옵션 ID로 매핑
        const settingsMapping = this.mapOnboardingDataToSettings();
        console.log(`온보딩 설정 매핑: ${settingsMapping.length}개 옵션`);

        // 3. 프로필 저장 API 호출 (재시도 포함)
        const saveResult = await this.saveSettingsToDBWithRetry(
          authResult.access_token,
          settingsMapping
        );

        if (saveResult) {
          // JWT 토큰 로컬 저장
          const config = vscode.workspace.getConfiguration("hapa");
          await config.update(
            "auth.accessToken",
            authResult.access_token,
            vscode.ConfigurationTarget.Global
          );

          console.log("✅ DB 저장 성공");
          return true;
        }

        throw new Error("설정 저장 API 실패");
      } catch (error) {
        retryCount++;
        console.error(
          `❌ DB 저장 실패 (시도 ${retryCount}/${maxRetries}):`,
          error
        );

        if (retryCount >= maxRetries) {
          // 최종 실패 시 사용자에게 안내
          vscode.window
            .showWarningMessage(
              `🔄 서버 연결에 실패했습니다 (${maxRetries}회 시도). 설정은 로컬에 저장되었으며, 나중에 다시 동기화를 시도할 수 있습니다.`,
              "다시 시도",
              "나중에"
            )
            .then((selection) => {
              if (selection === "다시 시도") {
                this.saveUserProfileToDB(); // 재시도
              }
            });

          return false;
        }

        // 재시도 전 잠시 대기 (exponential backoff)
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, retryCount) * 1000)
        );
      }
    }

    return false;
  }

  /**
   * 재시도 로직이 포함된 사용자 인증
   */
  private async loginOrRegisterUserWithRetry(): Promise<{
    access_token: string;
    token_type: string;
  } | null> {
    const maxRetries = 2;

    for (let i = 0; i < maxRetries; i++) {
      try {
        const result = await this.loginOrRegisterUser();
        if (result) return result;
        throw new Error("인증 응답 없음");
      } catch (error) {
        console.error(`인증 시도 ${i + 1} 실패:`, error);
        if (i === maxRetries - 1) throw error;
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return null;
  }

  /**
   * 재시도 로직이 포함된 설정 저장
   */
  private async saveSettingsToDBWithRetry(
    accessToken: string,
    optionIds: number[]
  ): Promise<boolean> {
    const maxRetries = 2;

    for (let i = 0; i < maxRetries; i++) {
      try {
        const result = await this.saveSettingsToDB(accessToken, optionIds);
        if (result) return true;
        throw new Error("설정 저장 응답 실패");
      } catch (error) {
        console.error(`설정 저장 시도 ${i + 1} 실패:`, error);
        if (i === maxRetries - 1) throw error;
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return false;
  }

  /**
   * 사용자 등록/로그인 API 호출
   */
  private async loginOrRegisterUser(): Promise<{
    access_token: string;
    token_type: string;
  } | null> {
    try {
      const config = vscode.workspace.getConfiguration("hapa");
      const baseURL = config.get("apiBaseURL", "http://localhost:8000/api/v1");

      // 테스트 사용자 감지 및 특별 처리
      const isTestUser = this.userProfile.email?.startsWith("real.db.user");

      if (isTestUser) {
        console.log("🧪 [테스트 모드] real.db.user 온보딩 테스트 진행");
        console.log(`테스트 사용자: ${this.userProfile.email}`);
      }

      const response = await fetch(`${baseURL}/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(isTestUser && { "X-Test-Mode": "onboarding" }),
        },
        body: JSON.stringify({
          email: this.userProfile.email,
          username:
            this.userProfile.username || this.userProfile.email.split("@")[0],
        }),
      });

      if (response.ok) {
        const result = await response.json();

        if (isTestUser) {
          console.log("🧪 [테스트 모드] 로그인/등록 성공:", {
            email: this.userProfile.email,
            tokenType: result.token_type,
            tokenLength: result.access_token?.length,
          });
        }

        return result;
      } else {
        const errorText = await response.text();
        console.error("로그인/등록 실패:", {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
        });

        if (isTestUser) {
          console.error(
            "🧪 [테스트 모드] 로그인/등록 실패 - 서버 상태를 확인하세요"
          );
        }

        return null;
      }
    } catch (error) {
      console.error("로그인/등록 오류:", error);

      if (this.userProfile.email?.startsWith("real.db.user")) {
        console.error(
          "🧪 [테스트 모드] 네트워크 오류 - Backend/DB Module이 실행 중인지 확인하세요"
        );
      }

      return null;
    }
  }

  /**
   * 온보딩 데이터를 DB 설정 옵션 ID로 매핑
   */
  private mapOnboardingDataToSettings(): number[] {
    const mapping: number[] = [];

    // Python 스킬 수준 (ID: 1-4)
    const skillMapping: Record<string, number> = {
      beginner: 1,
      intermediate: 2,
      advanced: 3,
      expert: 4,
    };
    if (
      this.userProfile.skillLevel &&
      skillMapping[this.userProfile.skillLevel]
    ) {
      mapping.push(skillMapping[this.userProfile.skillLevel]);
    }

    // 코드 출력 구조 (ID: 5-8)
    const outputMapping: Record<string, number> = {
      minimal: 5,
      standard: 6,
      detailed: 7,
      comprehensive: 8,
    };
    if (
      this.userProfile.outputStructure &&
      outputMapping[this.userProfile.outputStructure]
    ) {
      mapping.push(outputMapping[this.userProfile.outputStructure]);
    }

    // 설명 스타일 (ID: 9-12)
    const explanationMapping: Record<string, number> = {
      brief: 9,
      standard: 10,
      detailed: 11,
      educational: 12,
    };
    if (
      this.userProfile.explanationStyle &&
      explanationMapping[this.userProfile.explanationStyle]
    ) {
      mapping.push(explanationMapping[this.userProfile.explanationStyle]);
    }

    // 프로젝트 컨텍스트 (ID: 13-16)
    const contextMapping: Record<string, number> = {
      web_development: 13,
      data_science: 14,
      automation: 15,
      general_purpose: 16,
    };
    if (
      this.userProfile.projectContext &&
      contextMapping[this.userProfile.projectContext]
    ) {
      mapping.push(contextMapping[this.userProfile.projectContext]);
    }

    // 주석 트리거 모드 (ID: 17-20)
    const triggerMapping: Record<string, number> = {
      immediate_insert: 17,
      sidebar: 18,
      confirm_insert: 19,
      inline_preview: 20,
    };
    if (
      this.userProfile.commentTriggerMode &&
      triggerMapping[this.userProfile.commentTriggerMode]
    ) {
      mapping.push(triggerMapping[this.userProfile.commentTriggerMode]);
    }

    // 선호 언어 기능 (ID: 21-24)
    const featureMapping: Record<string, number> = {
      type_hints: 21,
      dataclasses: 22,
      async_await: 23,
      f_strings: 24,
    };
    if (
      this.userProfile.languageFeatures &&
      Array.isArray(this.userProfile.languageFeatures)
    ) {
      this.userProfile.languageFeatures.forEach((feature: string) => {
        if (featureMapping[feature]) {
          mapping.push(featureMapping[feature]);
        }
      });
    }

    // 에러 처리 선호도 (ID: 25-27)
    const errorMapping: Record<string, number> = {
      basic: 25,
      detailed: 26,
      robust: 27,
    };
    if (
      this.userProfile.errorHandling &&
      errorMapping[this.userProfile.errorHandling]
    ) {
      mapping.push(errorMapping[this.userProfile.errorHandling]);
    }

    return mapping;
  }

  /**
   * DB에 설정 저장
   */
  private async saveSettingsToDB(
    accessToken: string,
    optionIds: number[]
  ): Promise<boolean> {
    try {
      const config = vscode.workspace.getConfiguration("hapa");
      const baseURL = config.get("apiBaseURL", "http://localhost:8000/api/v1");

      const response = await fetch(`${baseURL}/users/profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          profile_data: this.userProfile,
          settings_mapping: optionIds,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error("설정 저장 오류:", error);
      return false;
    }
  }

  /**
   * 온보딩 건너뛰기
   */
  private async skipOnboarding() {
    const config = vscode.workspace.getConfiguration("hapa");
    await config.update(
      "userProfile.isOnboardingCompleted",
      true,
      vscode.ConfigurationTarget.Global
    );

    vscode.window.showInformationMessage(
      "온보딩을 건너뛰었습니다. 언제든 설정에서 변경할 수 있습니다."
    );

    if (this._view) {
      this._view.webview.html = this.generateCompletionHtml();
    }
  }

  /**
   * 웹뷰 업데이트
   */
  private updateWebview() {
    if (this._view) {
      this._view.webview.html = this.generateOnboardingHtml();
    }
  }

  /**
   * 온보딩 HTML 생성
   */
  private generateOnboardingHtml(): string {
    const stepContent = this.getStepContent(this.currentStep);

    return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HAPA 온보딩</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      background: linear-gradient(135deg, var(--vscode-editor-background) 0%, var(--vscode-sideBar-background) 100%);
      color: var(--vscode-foreground);
      line-height: 1.6;
      padding: 20px;
      min-height: 100vh;
    }
    
    .onboarding-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: var(--vscode-editor-background);
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    
    .header {
      background: linear-gradient(135deg, #007ACC 0%, #40A9FF 100%);
      color: white;
      padding: 24px;
      text-align: center;
    }
    
    .header h1 {
      font-size: 28px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    
    .header p {
      opacity: 0.9;
      font-size: 16px;
    }
    
    .progress-bar {
      background-color: var(--vscode-progressBar-background);
      height: 4px;
      position: relative;
    }
    
    .progress-fill {
      background: linear-gradient(90deg, #007ACC, #40A9FF);
      height: 100%;
      width: ${((this.currentStep + 1) / this.totalSteps) * 100}%;
      transition: width 0.3s ease;
    }
    
    .step-content {
      padding: 32px;
    }
    
    .step-title {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 8px;
      color: var(--vscode-foreground);
    }
    
    .step-description {
      color: var(--vscode-descriptionForeground);
      margin-bottom: 24px;
      font-size: 16px;
    }
    
    .form-group {
      margin-bottom: 24px;
    }
    
    .form-label {
      display: block;
      font-weight: 600;
      margin-bottom: 8px;
      color: var(--vscode-foreground);
    }
    
    .form-input {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid var(--vscode-input-border);
      border-radius: 4px;
      background-color: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      font-size: 14px;
      font-family: var(--vscode-font-family);
    }
    
    .form-input:focus {
      outline: none;
      border-color: var(--vscode-focusBorder);
      box-shadow: 0 0 0 1px var(--vscode-focusBorder);
    }
    
    .form-help {
      margin-top: 6px;
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
      line-height: 1.4;
    }
    
    .form-label {
      display: block;
      font-weight: 500;
      margin-bottom: 8px;
      color: var(--vscode-input-foreground);
    }
    
    .radio-group, .checkbox-group {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .radio-option, .checkbox-option {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;
      background-color: var(--vscode-input-background);
      border: 2px solid var(--vscode-input-border);
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .radio-option:hover, .checkbox-option:hover {
      border-color: var(--vscode-focusBorder);
      background-color: var(--vscode-list-hoverBackground);
    }
    
    .radio-option.selected, .checkbox-option.selected {
      border-color: #007ACC;
      background-color: rgba(0, 122, 204, 0.1);
    }
    
    .option-content {
      flex: 1;
    }
    
    .option-title {
      font-weight: 500;
      margin-bottom: 4px;
    }
    
    .option-description {
      font-size: 14px;
      color: var(--vscode-descriptionForeground);
    }
    
    .actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px 32px;
      background-color: var(--vscode-editor-background);
      border-top: 1px solid var(--vscode-panel-border);
    }
    
    .step-indicator {
      font-size: 14px;
      color: var(--vscode-descriptionForeground);
    }
    
    .button-group {
      display: flex;
      gap: 12px;
    }
    
    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .btn-primary {
      background: linear-gradient(135deg, #007ACC 0%, #0E639C 100%);
      color: white;
    }
    
    .btn-primary:hover {
      background: linear-gradient(135deg, #0E639C 0%, #1177BB 100%);
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 122, 204, 0.3);
    }
    
    .btn-secondary {
      background-color: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
      border: 1px solid var(--vscode-input-border);
    }
    
    .btn-secondary:hover {
      background-color: var(--vscode-button-secondaryHoverBackground);
    }
    
    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .skip-link {
      color: var(--vscode-textLink-foreground);
      text-decoration: none;
      font-size: 14px;
    }
    
    .skip-link:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="onboarding-container">
    <div class="header">
      <h1>🚀 HAPA에 오신 것을 환영합니다!</h1>
      <p>당신에게 최적화된 AI 코딩 어시스턴트로 설정해보세요</p>
    </div>
    
    <div class="progress-bar">
      <div class="progress-fill"></div>
    </div>
    
    <div class="step-content">
      ${stepContent}
    </div>
    
    <div class="actions">
      <div class="step-indicator">
        ${this.currentStep + 1} / ${this.totalSteps}
      </div>
      
      <div class="button-group">
        ${
          this.currentStep > 0
            ? '<button class="btn btn-secondary" onclick="previousStep()">이전</button>'
            : ""
        }
        ${
          this.currentStep < this.totalSteps - 1
            ? '<button class="btn btn-primary" onclick="nextStep()" id="nextBtn">다음</button>'
            : '<button class="btn btn-primary" onclick="completeOnboarding()" id="completeBtn">완료</button>'
        }
      </div>
    </div>
    
    <div style="text-align: center; padding: 16px;">
      <a href="#" class="skip-link" onclick="skipOnboarding()">온보딩 건너뛰기</a>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    
    function nextStep() {
      const data = collectStepData();
      if (data) {
        vscode.postMessage({
          command: 'nextStep',
          data: data
        });
      }
    }
    
    function previousStep() {
      vscode.postMessage({
        command: 'previousStep'
      });
    }
    
    function completeOnboarding() {
      const data = collectStepData();
      if (data) {
        vscode.postMessage({
          command: 'completeOnboarding',
          data: data
        });
      }
    }
    
    function skipOnboarding() {
      vscode.postMessage({
        command: 'skipOnboarding'
      });
    }
    
    function collectStepData() {
      // 각 단계별 데이터 수집 로직
      ${this.getStepScript(this.currentStep)}
    }
    
    // 라디오 버튼 선택 처리 (개선된 버전)
    function selectRadio(name, value) {
      // 같은 그룹의 모든 라디오 버튼에서 selected 클래스 제거
      document.querySelectorAll('[data-radio="' + name + '"]').forEach(function(el) {
        el.classList.remove('selected');
        el.style.borderColor = 'var(--vscode-input-border)';
        el.style.backgroundColor = 'var(--vscode-input-background)';
      });
      
      // 클릭된 요소에 selected 클래스 추가
      var currentElement = event.currentTarget;
      currentElement.classList.add('selected');
      currentElement.setAttribute('data-value', value);
      
      // 시각적 피드백 개선
      currentElement.style.borderColor = '#007ACC';
      currentElement.style.backgroundColor = 'rgba(0, 122, 204, 0.1)';
      currentElement.style.transform = 'scale(0.98)';
      setTimeout(function() {
        currentElement.style.transform = 'scale(1)';
      }, 150);
    }
    
    // 체크박스 토글 처리 (개선된 버전)
    function toggleCheckbox(element, feature) {
      var targetElement = event ? event.currentTarget : element;
      if (!targetElement) return;
      
      targetElement.classList.toggle('selected');
      targetElement.setAttribute('data-checked', targetElement.classList.contains('selected') ? 'true' : 'false');
      
      // 시각적 피드백
      targetElement.style.transform = 'scale(0.95)';
      setTimeout(function() {
        targetElement.style.transform = 'scale(1)';
      }, 150);
      
      // 선택 상태 표시 개선
      if (targetElement.classList.contains('selected')) {
        targetElement.style.borderColor = '#007ACC';
        targetElement.style.backgroundColor = 'rgba(0, 122, 204, 0.1)';
      } else {
        targetElement.style.borderColor = 'var(--vscode-input-border)';
        targetElement.style.backgroundColor = 'var(--vscode-input-background)';
      }
    }
    
    // 페이지 로드 시 기본값 설정
    setTimeout(function() {
      // Step 1: Python 스킬 수준 - 중급자 기본 선택
      if (${this.currentStep} === 1) {
        var intermediateOption = document.querySelector('[data-value="intermediate"]');
        if (intermediateOption && !document.querySelector('.radio-option.selected')) {
          intermediateOption.click();
        }
      }
      
      // Step 2: 코드 출력 - 표준 기본 선택
      if (${this.currentStep} === 2) {
        var standardOption = document.querySelector('[data-value="standard"]');
        if (standardOption && !document.querySelector('.radio-option.selected')) {
          standardOption.click();
        }
      }
      
      // Step 3: 설명 스타일 - 표준 설명 기본 선택
      if (${this.currentStep} === 3) {
        var standardExplanation = document.querySelector('[data-value="standard"]');
        if (standardExplanation && !document.querySelector('.radio-option.selected')) {
          standardExplanation.click();
        }
      }
      
      // Step 4: 개발 환경 - 범용 개발 기본 선택
      if (${this.currentStep} === 4) {
        var generalPurpose = document.querySelector('[data-value="general_purpose"]');
        if (generalPurpose && !document.querySelector('.radio-option.selected')) {
          generalPurpose.click();
        }
      }
      
      // Step 5: 트리거 모드 - 확인 후 삽입 기본 선택
      if (${this.currentStep} === 5) {
        var confirmInsert = document.querySelector('[data-value="confirm_insert"]');
        if (confirmInsert && !document.querySelector('.radio-option.selected')) {
          confirmInsert.click();
        }
      }
    }, 100);
  </script>
</body>
</html>`;
  }

  /**
   * 단계별 콘텐츠 생성
   */
  private getStepContent(step: number): string {
    switch (step) {
      case 0:
        return `
          <h2 class="step-title">👋 환영합니다!</h2>
          <p class="step-description">HAPA 설정을 동기화하기 위해 이메일을 입력해주세요.</p>
          
          <div class="form-group">
            <label class="form-label">이메일 주소 *</label>
            <input type="email" id="email" class="form-input" placeholder="example@example.com" required>
            <p class="form-help">설정 동기화를 위해서만 사용되며, 다른 용도로 사용되지 않습니다.</p>
          </div>
          
          <div class="form-group">
            <label class="form-label">사용자명 (선택)</label>
            <input type="text" id="username" class="form-input" placeholder="홍길동">
            <p class="form-help">비워두면 이메일 앞부분을 사용자명으로 사용합니다.</p>
          </div>
        `;

      case 1:
        return `
          <h2 class="step-title">🐍 Python 스킬 수준을 알려주세요</h2>
          <p class="step-description">당신의 Python 경험 수준에 맞는 코드와 설명을 제공하겠습니다.</p>
          
          <div class="form-group">
            <div class="radio-group">
              <div class="radio-option" data-radio="skillLevel" data-value="beginner" onclick="selectRadio('skillLevel', 'beginner')">
                <div class="option-content">
                  <div class="option-title">🌱 초급자</div>
                  <div class="option-description">Python을 처음 배우고 있거나 기본 문법을 학습 중입니다</div>
                </div>
              </div>
              <div class="radio-option" data-radio="skillLevel" data-value="intermediate" onclick="selectRadio('skillLevel', 'intermediate')">
                <div class="option-content">
                  <div class="option-title">🔧 중급자</div>
                  <div class="option-description">기본 문법을 알고 있으며 일반적인 프로그래밍이 가능합니다</div>
                </div>
              </div>
              <div class="radio-option" data-radio="skillLevel" data-value="advanced" onclick="selectRadio('skillLevel', 'advanced')">
                <div class="option-content">
                  <div class="option-title">⚡ 고급자</div>
                  <div class="option-description">복잡한 프로젝트 개발이 가능하며 라이브러리 활용에 능숙합니다</div>
                </div>
              </div>
              <div class="radio-option" data-radio="skillLevel" data-value="expert" onclick="selectRadio('skillLevel', 'expert')">
                <div class="option-content">
                  <div class="option-title">🚀 전문가</div>
                  <div class="option-description">최적화, 아키텍처 설계, 고급 패턴 구현이 가능합니다</div>
                </div>
              </div>
            </div>
          </div>
        `;

      case 2:
        return `
          <h2 class="step-title">📝 코드 출력 스타일을 선택해주세요</h2>
          <p class="step-description">AI가 생성하는 코드의 구조와 상세도를 설정합니다.</p>
          
          <div class="form-group">
            <div class="radio-group">
              <div class="radio-option" data-radio="outputStructure" data-value="minimal" onclick="selectRadio('outputStructure', 'minimal')">
                <div class="option-content">
                  <div class="option-title">✨ 최소한</div>
                  <div class="option-description">핵심 로직만 간결하게 (주석 최소화)</div>
                </div>
              </div>
              <div class="radio-option" data-radio="outputStructure" data-value="standard" onclick="selectRadio('outputStructure', 'standard')">
                <div class="option-content">
                  <div class="option-title">📝 표준</div>
                  <div class="option-description">일반적인 코드 구조 + 기본 주석</div>
                </div>
              </div>
              <div class="radio-option" data-radio="outputStructure" data-value="detailed" onclick="selectRadio('outputStructure', 'detailed')">
                <div class="option-content">
                  <div class="option-title">🔍 상세</div>
                  <div class="option-description">자세한 주석 + 예외 처리 + 타입 힌트</div>
                </div>
              </div>
              <div class="radio-option" data-radio="outputStructure" data-value="comprehensive" onclick="selectRadio('outputStructure', 'comprehensive')">
                <div class="option-content">
                  <div class="option-title">📚 포괄적</div>
                  <div class="option-description">문서화 + 테스트 코드 + 최적화 제안</div>
                </div>
              </div>
            </div>
          </div>
        `;

      case 3:
        return `
          <h2 class="step-title">💬 설명 스타일을 설정해주세요</h2>
          <p class="step-description">AI가 제공하는 설명의 상세도와 스타일을 선택합니다.</p>
          
          <div class="form-group">
            <div class="radio-group">
              <div class="radio-option" data-radio="explanationStyle" data-value="brief" onclick="selectRadio('explanationStyle', 'brief')">
                <div class="option-content">
                  <div class="option-title">⚡ 간단한 설명</div>
                  <div class="option-description">핵심 내용만 빠르게</div>
                </div>
              </div>
              <div class="radio-option" data-radio="explanationStyle" data-value="standard" onclick="selectRadio('explanationStyle', 'standard')">
                <div class="option-content">
                  <div class="option-title">📖 표준 설명</div>
                  <div class="option-description">코드 + 간단한 설명</div>
                </div>
              </div>
              <div class="radio-option" data-radio="explanationStyle" data-value="detailed" onclick="selectRadio('explanationStyle', 'detailed')">
                <div class="option-content">
                  <div class="option-title">🔍 상세 설명</div>
                  <div class="option-description">개념 + 이유 + 활용법</div>
                </div>
              </div>
              <div class="radio-option" data-radio="explanationStyle" data-value="educational" onclick="selectRadio('explanationStyle', 'educational')">
                <div class="option-content">
                  <div class="option-title">🎓 교육적 설명</div>
                  <div class="option-description">단계별 + 예시 + 관련 개념</div>
                </div>
              </div>
            </div>
          </div>
        `;

      case 4:
        return `
          <h2 class="step-title">🛠️ 개발 환경을 설정해주세요</h2>
          <p class="step-description">주요 개발 분야와 선호하는 Python 기능을 선택합니다.</p>
          
          <div class="form-group">
            <label class="form-label">주요 개발 분야</label>
            <div class="radio-group">
              <div class="radio-option" data-radio="projectContext" data-value="web_development" onclick="selectRadio('projectContext', 'web_development')">
                <div class="option-content">
                  <div class="option-title">🌐 웹 개발</div>
                  <div class="option-description">Django, Flask, FastAPI</div>
                </div>
              </div>
              <div class="radio-option" data-radio="projectContext" data-value="data_science" onclick="selectRadio('projectContext', 'data_science')">
                <div class="option-content">
                  <div class="option-title">📊 데이터 사이언스</div>
                  <div class="option-description">NumPy, Pandas, ML</div>
                </div>
              </div>
              <div class="radio-option" data-radio="projectContext" data-value="automation" onclick="selectRadio('projectContext', 'automation')">
                <div class="option-content">
                  <div class="option-title">🤖 자동화</div>
                  <div class="option-description">스크립팅, 업무 자동화</div>
                </div>
              </div>
              <div class="radio-option" data-radio="projectContext" data-value="general_purpose" onclick="selectRadio('projectContext', 'general_purpose')">
                <div class="option-content">
                  <div class="option-title">🔧 범용 개발</div>
                  <div class="option-description">다양한 목적</div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">선호하는 Python 기능 (복수 선택 가능)</label>
            <div class="checkbox-group">
              <div class="checkbox-option" data-feature="type_hints" onclick="toggleCheckbox(this, 'type_hints')">
                <div class="option-content">
                  <div class="option-title">타입 힌트 (Type Hints)</div>
                  <div class="option-description">코드의 가독성과 안정성 향상</div>
                </div>
              </div>
              <div class="checkbox-option" data-feature="dataclasses" onclick="toggleCheckbox(this, 'dataclasses')">
                <div class="option-content">
                  <div class="option-title">데이터클래스 (Dataclasses)</div>
                  <div class="option-description">간편한 클래스 정의</div>
                </div>
              </div>
              <div class="checkbox-option" data-feature="async_await" onclick="toggleCheckbox(this, 'async_await')">
                <div class="option-content">
                  <div class="option-title">비동기 프로그래밍 (Async/Await)</div>
                  <div class="option-description">효율적인 I/O 처리</div>
                </div>
              </div>
              <div class="checkbox-option" data-feature="f_strings" onclick="toggleCheckbox(this, 'f_strings')">
                <div class="option-content">
                  <div class="option-title">f-strings</div>
                  <div class="option-description">문자열 포맷팅</div>
                </div>
              </div>
            </div>
          </div>
        `;

      case 5:
        return `
          <h2 class="step-title">⚙️ 주석 트리거 워크플로우를 선택해주세요</h2>
          <p class="step-description">AI 코드 생성 후 어떤 방식으로 처리할지 설정합니다.</p>
          
          <div class="form-group">
            <div class="radio-group">
              <div class="radio-option" data-radio="commentTriggerMode" data-value="immediate_insert" onclick="selectRadio('commentTriggerMode', 'immediate_insert')">
                <div class="option-content">
                  <div class="option-title">⚡ 즉시 삽입</div>
                  <div class="option-description">생성된 코드를 커서 위치에 바로 삽입 (Thunder Client 스타일)</div>
                </div>
              </div>
              <div class="radio-option" data-radio="commentTriggerMode" data-value="sidebar" onclick="selectRadio('commentTriggerMode', 'sidebar')">
                <div class="option-content">
                  <div class="option-title">📋 사이드바 표시</div>
                  <div class="option-description">사이드바에 결과를 표시하고 검토 후 삽입</div>
                </div>
              </div>
              <div class="radio-option" data-radio="commentTriggerMode" data-value="confirm_insert" onclick="selectRadio('commentTriggerMode', 'confirm_insert')">
                <div class="option-content">
                  <div class="option-title">✅ 확인 후 삽입</div>
                  <div class="option-description">코드를 미리보고 확인 대화상자에서 삽입 여부 선택</div>
                </div>
              </div>
              <div class="radio-option" data-radio="commentTriggerMode" data-value="inline_preview" onclick="selectRadio('commentTriggerMode', 'inline_preview')">
                <div class="option-content">
                  <div class="option-title">👁️ 인라인 미리보기</div>
                  <div class="option-description">에디터에서 코드를 미리보고 키보드로 선택</div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="workflow-tip" style="margin-top: 24px; padding: 16px; background-color: rgba(0, 122, 204, 0.1); border-radius: 6px; border-left: 4px solid #007ACC;">
            <div style="display: flex; align-items: flex-start; gap: 12px;">
              <div style="font-size: 20px;">💡</div>
              <div style="flex: 1;">
                <strong style="color: var(--vscode-foreground);">팁:</strong>
                <span style="color: var(--vscode-descriptionForeground); margin-left: 8px;">
                  나중에 설정에서 언제든 변경할 수 있습니다. 즉시 삽입 모드는 빠른 프로토타이핑에 유용하고, 사이드바 모드는 신중한 검토에 적합합니다.
                </span>
              </div>
            </div>
          </div>
        `;

      default:
        return "<p>알 수 없는 단계입니다.</p>";
    }
  }

  /**
   * 단계별 JavaScript 스크립트 생성
   */
  private getStepScript(step: number): string {
    switch (step) {
      case 0:
        return `
          var email = document.getElementById('email').value.trim();
          var username = document.getElementById('username').value.trim();
          
          if (!email) {
            alert('이메일을 입력해주세요.');
            return null;
          }
          
          // 이메일 형식 검증
          var emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
          if (!emailRegex.test(email)) {
            alert('올바른 이메일 형식을 입력해주세요.');
            return null;
          }
          
          return { 
            email: email, 
            username: username || email.split('@')[0] 
          };
        `;

      case 1:
        return `
          var selected = document.querySelector('[data-radio="skillLevel"].selected');
          if (!selected) {
            alert('Python 스킬 수준을 선택해주세요.');
            return null;
          }
          return { skillLevel: selected.getAttribute('data-value') };
        `;

      case 2:
        return `
          var selected = document.querySelector('[data-radio="outputStructure"].selected');
          if (!selected) {
            alert('코드 출력 스타일을 선택해주세요.');
            return null;
          }
          return { outputStructure: selected.getAttribute('data-value') };
        `;

      case 3:
        return `
          var selected = document.querySelector('[data-radio="explanationStyle"].selected');
          if (!selected) {
            alert('설명 스타일을 선택해주세요.');
            return null;
          }
          return { explanationStyle: selected.getAttribute('data-value') };
        `;

      case 4:
        return `
          var projectContext = document.querySelector('[data-radio="projectContext"].selected');
          if (!projectContext) {
            alert('개발 분야를 선택해주세요.');
            return null;
          }
          
          var languageFeatures = [];
          document.querySelectorAll('.checkbox-option.selected').forEach(function(el) {
            var feature = el.getAttribute('data-feature');
            if (feature) {
              languageFeatures.push(feature);
            }
          });
          
          return { 
            projectContext: projectContext.getAttribute('data-value'),
            languageFeatures: languageFeatures,
            errorHandling: 'basic'
          };
        `;

      case 5:
        return `
          var selected = document.querySelector('[data-radio="commentTriggerMode"].selected');
          if (!selected) {
            alert('주석 트리거 워크플로우를 선택해주세요.');
            return null;
          }
          return { commentTriggerMode: selected.getAttribute('data-value') };
        `;

      default:
        return "return {};";
    }
  }

  /**
   * 완료 HTML 생성
   */
  private generateCompletionHtml(): string {
    return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>온보딩 완료</title>
  <style>
    body {
      font-family: var(--vscode-font-family);
      background: linear-gradient(135deg, var(--vscode-editor-background) 0%, var(--vscode-sideBar-background) 100%);
      color: var(--vscode-foreground);
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
    }
    
    .completion-container {
      text-align: center;
      max-width: 400px;
      padding: 40px;
      background-color: var(--vscode-editor-background);
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    }
    
    .success-icon {
      font-size: 64px;
      margin-bottom: 24px;
    }
    
    .completion-title {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 16px;
      color: #007ACC;
    }
    
    .completion-message {
      color: var(--vscode-descriptionForeground);
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="completion-container">
    <div class="success-icon">🎉</div>
    <h1 class="completion-title">온보딩 완료!</h1>
    <p class="completion-message">
      HAPA가 당신의 선호도에 맞게 설정되었습니다.<br>
      이제 맞춤형 AI 코딩 어시스턴트를 사용할 수 있습니다.
    </p>
  </div>
</body>
</html>`;
  }
}
