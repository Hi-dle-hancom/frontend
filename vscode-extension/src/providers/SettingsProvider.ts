import * as vscode from "vscode";
import { BaseWebviewProvider } from "./BaseWebviewProvider";

/**
 * 사용자 설정 웹뷰 프로바이더
 */
export class SettingsProvider extends BaseWebviewProvider {
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
    return this.generateSettingsHtml();
  }

  protected handleCustomMessage(message: any) {
    console.log("🔔 설정 프로바이더 메시지 수신:", message.command);

    switch (message.command) {
      case "saveSettings":
        this.saveSettings(message.settings);
        break;
      case "resetSettings":
        this.resetSettings();
        break;
      case "loadSettings":
        console.log("📥 설정 로드 요청 처리 중...");
        this.loadAndSendSettings();
        break;
      case "openVSCodeSettings":
        this.openVSCodeSettings();
        break;
      default:
        console.log("❓ 알 수 없는 메시지:", message.command);
    }
  }

  /**
   * 웹뷰가 준비되면 즉시 설정 로드
   */
  protected onWebviewReady(): void {
    console.log("🔗 설정 웹뷰 준비 완료 - 설정 로드 시작");

    // 즉시 설정 로드 시도
    this.loadAndSendSettings();

    // 안전장치: 500ms 후에도 다시 시도
    setTimeout(() => {
      console.log("🛟 설정 프로바이더 안전장치: 설정 재로드 시도");
      this.loadAndSendSettings();
    }, 500);
  }

  /**
   * 설정 저장 (이메일 변경 시 자동 API 키 발급 옵션 포함)
   */
  private async saveSettings(settings: any) {
    try {
      const config = vscode.workspace.getConfiguration("hapa");
      const previousEmail = config.get<string>("userProfile.email");

      // 사용자 프로필 설정 저장
      if (settings.userProfile) {
        for (const [key, value] of Object.entries(settings.userProfile)) {
          await config.update(
            `userProfile.${key}`,
            value,
            vscode.ConfigurationTarget.Global
          );
        }
      }

      // API 설정 저장
      if (settings.api) {
        for (const [key, value] of Object.entries(settings.api)) {
          await config.update(key, value, vscode.ConfigurationTarget.Global);
        }
      }

      // 주석 트리거 설정 저장
      if (settings.commentTrigger) {
        for (const [key, value] of Object.entries(settings.commentTrigger)) {
          await config.update(
            `commentTrigger.${key}`,
            value,
            vscode.ConfigurationTarget.Global
          );
        }
      }

      // 기능 설정 저장
      if (settings.features) {
        for (const [key, value] of Object.entries(settings.features)) {
          await config.update(key, value, vscode.ConfigurationTarget.Global);
        }
      }

      // 이메일이 변경되었고 API 키가 없는 경우 자동 발급 제안
      const newEmail = settings.userProfile?.email;
      const currentApiKey = config.get<string>("apiKey");

      if (newEmail && newEmail !== previousEmail && !currentApiKey) {
        console.log("📧 이메일 변경 감지 - 자동 API 키 발급 제안");

        const choice = await vscode.window.showInformationMessage(
          "이메일이 설정되었습니다. API 키를 자동으로 발급받으시겠습니까?",
          "자동 발급",
          "나중에",
          "취소"
        );

        if (choice === "자동 발급") {
          const apiKeyResult = await this.generateAPIKeyForEmail(
            newEmail,
            settings.userProfile?.username
          );

          if (apiKeyResult.success) {
            vscode.window.showInformationMessage(
              `✅ API 키가 자동으로 발급되어 설정에 저장되었습니다!\n\n🔑 키: ${apiKeyResult.apiKey?.substring(
                0,
                20
              )}...`
            );
          } else {
            vscode.window.showWarningMessage(
              `⚠️ API 키 자동 발급에 실패했습니다: ${apiKeyResult.error}\n\n설정에서 수동으로 발급받으세요.`
            );
          }
        }
      }

      vscode.window.showInformationMessage(
        "✅ 설정이 성공적으로 저장되었습니다!"
      );

      // 웹뷰에 저장 완료 신호 전송
      if (this._view) {
        this._view.webview.postMessage({
          command: "settingsSaved",
          success: true,
        });
      }
    } catch (error) {
      const errorMessage = `설정 저장 중 오류가 발생했습니다: ${
        (error as Error).message
      }`;
      vscode.window.showErrorMessage(errorMessage);

      if (this._view) {
        this._view.webview.postMessage({
          command: "settingsSaved",
          success: false,
          error: errorMessage,
        });
      }
    }
  }

  /**
   * 설정에서 이메일을 위한 API 키 발급
   */
  private async generateAPIKeyForEmail(
    email: string,
    username?: string
  ): Promise<{
    success: boolean;
    apiKey?: string;
    error?: string;
  }> {
    try {
      console.log("🔑 설정에서 API 키 발급 요청:", { email, username });

      const config = vscode.workspace.getConfiguration("hapa");
      const apiBaseURL = config.get<string>(
        "apiBaseURL",
        "http://3.13.240.111:8000/api/v1"
      );

      const response = await fetch(`${apiBaseURL}/users/generate-api-key`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          username: username || email.split("@")[0],
        }),
        timeout: 10000,
      } as any);

      if (response.ok) {
        const result = await response.json();

        // API 키를 설정에 자동 저장
        await config.update(
          "apiKey",
          result.api_key,
          vscode.ConfigurationTarget.Global
        );

        console.log("✅ 설정에서 API 키 발급 및 저장 완료");

        return {
          success: true,
          apiKey: result.api_key,
        };
      } else {
        const errorText = await response.text();
        console.error("❌ 설정에서 API 키 발급 실패:", errorText);

        return {
          success: false,
          error: `서버 오류: ${response.status} - ${errorText}`,
        };
      }
    } catch (error) {
      console.error("❌ 설정에서 API 키 발급 중 오류:", error);

      return {
        success: false,
        error: `발급 오류: ${(error as Error).message}`,
      };
    }
  }

  /**
   * 설정 초기화
   */
  private async resetSettings() {
    const result = await vscode.window.showWarningMessage(
      "모든 설정을 기본값으로 초기화하시겠습니까?",
      "초기화",
      "취소"
    );

    if (result === "초기화") {
      try {
        const config = vscode.workspace.getConfiguration("hapa");

        // 사용자 프로필 기본값으로 초기화
        await config.update(
          "userProfile.pythonSkillLevel",
          "intermediate",
          vscode.ConfigurationTarget.Global
        );
        await config.update(
          "userProfile.codeOutputStructure",
          "standard",
          vscode.ConfigurationTarget.Global
        );
        await config.update(
          "userProfile.explanationStyle",
          "standard",
          vscode.ConfigurationTarget.Global
        );
        await config.update(
          "userProfile.projectContext",
          "general_purpose",
          vscode.ConfigurationTarget.Global
        );
        await config.update(
          "userProfile.errorHandlingPreference",
          "basic",
          vscode.ConfigurationTarget.Global
        );
        await config.update(
          "userProfile.preferredLanguageFeatures",
          ["type_hints", "f_strings"],
          vscode.ConfigurationTarget.Global
        );

        // 기능 설정 기본값으로 초기화
        await config.update(
          "autoComplete",
          true,
          vscode.ConfigurationTarget.Global
        );
        await config.update(
          "maxSuggestions",
          5,
          vscode.ConfigurationTarget.Global
        );
        await config.update(
          "enableLogging",
          false,
          vscode.ConfigurationTarget.Global
        );
        await config.update(
          "apiTimeout",
          30000,
          vscode.ConfigurationTarget.Global
        );

        // 주석 트리거 설정 기본값으로 초기화
        await config.update(
          "commentTrigger.resultDisplayMode",
          "sidebar",
          vscode.ConfigurationTarget.Global
        );
        await config.update(
          "commentTrigger.autoInsertDelay",
          0,
          vscode.ConfigurationTarget.Global
        );
        await config.update(
          "commentTrigger.showNotification",
          true,
          vscode.ConfigurationTarget.Global
        );

        vscode.window.showInformationMessage(
          "🔄 설정이 기본값으로 초기화되었습니다."
        );

        // 웹뷰 새로고침
        this.loadAndSendSettings();
      } catch (error) {
        vscode.window.showErrorMessage(
          `설정 초기화 중 오류가 발생했습니다: ${(error as Error).message}`
        );
      }
    }
  }

  /**
   * 현재 설정 로드 및 웹뷰로 전송
   */
  private loadAndSendSettings() {
    try {
      console.log("⚙️ VSCode 설정 로드 시작...");
      const config = vscode.workspace.getConfiguration("hapa");

      const currentSettings = {
        userProfile: {
          email: config.get("userProfile.email") || "complete.test@email.com",
          username: config.get("userProfile.username") || "CompleteUser",
          pythonSkillLevel:
            config.get("userProfile.pythonSkillLevel") || "intermediate",
          codeOutputStructure:
            config.get("userProfile.codeOutputStructure") || "minimal",
          explanationStyle:
            config.get("userProfile.explanationStyle") || "brief",
          projectContext:
            config.get("userProfile.projectContext") || "web_development",
          errorHandlingPreference:
            config.get("userProfile.errorHandlingPreference") || "basic",
          preferredLanguageFeatures: config.get(
            "userProfile.preferredLanguageFeatures"
          ) || ["type_hints"],
        },
        api: {
          apiBaseURL:
            config.get("apiBaseURL") || "http://3.13.240.111:8000/api/v1",
          apiKey:
            config.get("apiKey") || "hapa_demo_20241228_secure_key_for_testing",
          apiTimeout: config.get("apiTimeout") || 30000,
        },
        commentTrigger: {
          resultDisplayMode:
            config.get("commentTrigger.resultDisplayMode") ||
            "immediate_insert",
          autoInsertDelay: config.get("commentTrigger.autoInsertDelay") || 0,
          showNotification:
            config.get("commentTrigger.showNotification") || false,
        },
        features: {
          autoComplete: config.get("autoComplete") ?? true,
          maxSuggestions: config.get("maxSuggestions") || 5,
          enableLogging: config.get("enableLogging") || false,
          enableCodeAnalysis: config.get("enableCodeAnalysis") ?? true,
        },
      };

      console.log("📋 로드된 설정:", {
        email: currentSettings.userProfile.email,
        apiKey:
          currentSettings.api.apiKey &&
          typeof currentSettings.api.apiKey === "string"
            ? currentSettings.api.apiKey.substring(0, 10) + "..."
            : "없음",
        apiBaseURL: currentSettings.api.apiBaseURL,
      });

      if (this._view) {
        console.log("📤 웹뷰로 설정 전송 중...");
        this._view.webview.postMessage({
          command: "settingsLoaded",
          settings: currentSettings,
        });
        console.log("✅ 설정 전송 완료");
      } else {
        console.error("❌ 웹뷰 인스턴스가 없음");
      }
    } catch (error) {
      console.error("❌ 설정 로드 실패:", error);

      // 오류 발생 시에도 기본 설정으로 응답
      if (this._view) {
        this._view.webview.postMessage({
          command: "settingsLoaded",
          settings: {
            userProfile: {
              email: "complete.test@email.com",
              username: "CompleteUser",
              pythonSkillLevel: "intermediate",
              codeOutputStructure: "minimal",
              explanationStyle: "brief",
              projectContext: "web_development",
              errorHandlingPreference: "basic",
              preferredLanguageFeatures: ["type_hints"],
            },
            api: {
              apiBaseURL: "http://3.13.240.111:8000/api/v1",
              apiKey: "hapa_demo_20241228_secure_key_for_testing",
              apiTimeout: 30000,
            },
            commentTrigger: {
              resultDisplayMode: "immediate_insert",
              autoInsertDelay: 0,
              showNotification: false,
            },
            features: {
              autoComplete: true,
              maxSuggestions: 5,
              enableLogging: false,
              enableCodeAnalysis: true,
            },
          },
          error: (error as Error).message,
        });
      }
    }
  }

  /**
   * VSCode 설정 페이지 열기
   */
  private openVSCodeSettings() {
    vscode.commands.executeCommand("workbench.action.openSettings", "hapa");
  }

  /**
   * 설정 HTML 생성 (JavaScript 템플릿 분리)
   */
  private generateSettingsHtml(): string {
    // 안전하고 간단한 JavaScript 코드
    const scriptContent = `
    (function() {
      'use strict';
      
      let currentSettings = {};
      let isFormVisible = false;
      let vscode = null;
      
      // VSCode API 초기화
      function initializeVSCode() {
        try {
          vscode = acquireVsCodeApi();
          console.log('✅ VSCode API 초기화 완료');
          return true;
        } catch (error) {
          console.error('❌ VSCode API 초기화 실패:', error);
          return false;
        }
      }
      
      // 설정 로드 함수
      function loadSettings() {
        console.log('📥 설정 로드 요청 전송...');
        if (vscode) {
          vscode.postMessage({
            command: 'loadSettings'
          });
        } else {
          console.error('❌ VSCode API가 초기화되지 않음');
          showFormWithDefaults();
        }
      }
      
      // 기본값으로 폼 표시
      function showFormWithDefaults() {
        console.log('📋 기본 설정으로 폼 표시');
        const defaultSettings = {
          userProfile: {
            email: 'complete.test@email.com',
            username: 'CompleteUser',
            pythonSkillLevel: 'intermediate',
            codeOutputStructure: 'minimal',
            explanationStyle: 'brief',
            projectContext: 'web_development',
            errorHandlingPreference: 'basic',
            preferredLanguageFeatures: ['type_hints']
          },
          api: {
            apiBaseURL: 'http://3.13.240.111:8000/api/v1',
            apiKey: 'hapa_demo_20241228_secure_key_for_testing',
            apiTimeout: 30000
          },
          commentTrigger: {
            resultDisplayMode: 'immediate_insert',
            autoInsertDelay: 0,
            showNotification: false
          },
          features: {
            autoComplete: true,
            maxSuggestions: 5,
            enableLogging: false,
            enableCodeAnalysis: true
          }
        };
        
        hideLoading();
        showForm();
        populateSettings(defaultSettings);
      }
      
      // 로딩 숨기기
      function hideLoading() {
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
          loadingIndicator.style.display = 'none';
        }
      }
      
      // 폼 표시
      function showForm() {
        const settingsForm = document.getElementById('settingsForm');
        if (settingsForm) {
          settingsForm.style.display = 'block';
          isFormVisible = true;
          console.log('✅ 설정 폼 표시 완료');
        }
      }
      
      // 설정으로 폼 채우기
      function populateSettings(settings) {
        console.log('📝 설정 데이터로 폼 채우기...');
        
        try {
          // 사용자 프로필
          if (settings.userProfile) {
            setValue('email', settings.userProfile.email);
            setValue('username', settings.userProfile.username);
            setValue('pythonSkillLevel', settings.userProfile.pythonSkillLevel);
            setValue('codeOutputStructure', settings.userProfile.codeOutputStructure);
            setValue('explanationStyle', settings.userProfile.explanationStyle);
            setValue('projectContext', settings.userProfile.projectContext);
            setValue('errorHandlingPreference', settings.userProfile.errorHandlingPreference);
          }
          
          // API 설정
          if (settings.api) {
            setValue('apiBaseURL', settings.api.apiBaseURL);
            setValue('apiKey', settings.api.apiKey);
            setValue('apiTimeout', settings.api.apiTimeout);
          }
          
          // 주석 트리거 설정
          if (settings.commentTrigger) {
            setValue('commentTriggerResultDisplayMode', settings.commentTrigger.resultDisplayMode);
            setValue('commentTriggerAutoInsertDelay', settings.commentTrigger.autoInsertDelay);
            setChecked('commentTriggerShowNotification', settings.commentTrigger.showNotification);
          }
          
          // 기능 설정
          if (settings.features) {
            setChecked('autoComplete', settings.features.autoComplete);
            setValue('maxSuggestions', settings.features.maxSuggestions);
            setChecked('enableLogging', settings.features.enableLogging);
            setChecked('enableCodeAnalysis', settings.features.enableCodeAnalysis);
          }
          
          console.log('✅ 폼 채우기 완료');
        } catch (error) {
          console.error('❌ 폼 채우기 오류:', error);
        }
      }
      
      // 값 설정 헬퍼 함수
      function setValue(id, value) {
        const element = document.getElementById(id);
        if (element && value !== undefined && value !== null) {
          element.value = value;
        }
      }
      
      // 체크박스 설정 헬퍼 함수
      function setChecked(id, checked) {
        const element = document.getElementById(id);
        if (element && checked !== undefined && checked !== null) {
          element.checked = !!checked;
        }
      }
      
      // 설정 저장 함수
      function saveSettings() {
        console.log('💾 설정 저장 시작...');
        
        if (!vscode) {
          console.error('❌ VSCode API 없음');
          return;
        }
        
        try {
          const settings = {
            userProfile: {
              email: getValue('email') || 'complete.test@email.com',
              username: getValue('username') || 'CompleteUser',
              pythonSkillLevel: getValue('pythonSkillLevel') || 'intermediate',
              codeOutputStructure: getValue('codeOutputStructure') || 'minimal',
              explanationStyle: getValue('explanationStyle') || 'brief',
              projectContext: getValue('projectContext') || 'web_development',
              errorHandlingPreference: getValue('errorHandlingPreference') || 'basic',
              preferredLanguageFeatures: ['type_hints']
            },
            api: {
              apiBaseURL: getValue('apiBaseURL') || 'http://3.13.240.111:8000/api/v1',
              apiKey: getValue('apiKey') || '',
              apiTimeout: parseInt(getValue('apiTimeout')) || 30000
            },
            commentTrigger: {
              resultDisplayMode: getValue('commentTriggerResultDisplayMode') || 'immediate_insert',
              autoInsertDelay: parseInt(getValue('commentTriggerAutoInsertDelay')) || 0,
              showNotification: getChecked('commentTriggerShowNotification') || false
            },
            features: {
              autoComplete: getChecked('autoComplete') !== false,
              maxSuggestions: parseInt(getValue('maxSuggestions')) || 5,
              enableLogging: getChecked('enableLogging') || false,
              enableCodeAnalysis: getChecked('enableCodeAnalysis') !== false
            }
          };
          
          console.log('📤 설정 저장 요청 전송:', settings);
          
          vscode.postMessage({
            command: 'saveSettings',
            settings: settings
          });
          
        } catch (error) {
          console.error('❌ 설정 저장 오류:', error);
        }
      }
      
      // 값 가져오기 헬퍼 함수
      function getValue(id) {
        const element = document.getElementById(id);
        return element ? element.value : '';
      }
      
      // 체크박스 상태 가져오기 헬퍼 함수
      function getChecked(id) {
        const element = document.getElementById(id);
        return element ? element.checked : false;
      }
      
      // 기타 함수들
      function resetSettings() {
        if (confirm('모든 설정을 기본값으로 초기화하시겠습니까?')) {
          if (vscode) {
            vscode.postMessage({
              command: 'resetSettings'
            });
          }
        }
      }
      
      function openVSCodeSettings() {
        if (vscode) {
          vscode.postMessage({
            command: 'openVSCodeSettings'
          });
        }
      }
      
      // API 키 발급 함수
      async function generateApiKey() {
        console.log('🔑 API 키 발급 시작...');
        
        const email = getValue('email') || 'complete.test@email.com';
        const username = getValue('username') || 'CompleteUser';
        const apiBaseURL = getValue('apiBaseURL') || 'http://3.13.240.111:8000/api/v1';
        
        if (!email) {
          alert('이메일을 먼저 입력해주세요.');
          return;
        }
        
        try {
          const response = await fetch(apiBaseURL + '/users/generate-api-key', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: email,
              username: username
            })
          });
          
          if (response.ok) {
            const result = await response.json();
            setValue('apiKey', result.api_key);
            alert('API 키가 성공적으로 발급되어 입력 필드에 설정되었습니다!');
            console.log('✅ API 키 발급 성공');
          } else {
            const errorText = await response.text();
            alert('API 키 발급에 실패했습니다: ' + errorText);
            console.error('❌ API 키 발급 실패:', errorText);
          }
        } catch (error) {
          alert('API 키 발급 중 오류가 발생했습니다: ' + error.message);
          console.error('❌ API 키 발급 오류:', error);
        }
      }
      
      // 메시지 이벤트 리스너
      window.addEventListener('message', function(event) {
        const message = event.data;
        console.log('📨 웹뷰 메시지 수신:', message.command);
        
        switch (message.command) {
          case 'settingsLoaded':
            console.log('📥 설정 로드 완료');
            currentSettings = message.settings;
            hideLoading();
            showForm();
            populateSettings(currentSettings);
            break;
            
          case 'settingsSaved':
            if (message.success) {
              console.log('✅ 설정 저장 완료');
              alert('설정이 성공적으로 저장되었습니다!');
            } else {
              console.error('❌ 설정 저장 실패:', message.error);
              alert('설정 저장 중 오류가 발생했습니다: ' + message.error);
            }
            break;
            
          case 'settingsReset':
            console.log('🔄 설정 초기화 완료');
            alert('설정이 기본값으로 초기화되었습니다.');
            loadSettings();
            break;
        }
      });
      
      // 안전장치들
      let timeoutId1 = null;
      let timeoutId2 = null;
      let timeoutId3 = null;
      
      // 다단계 안전장치
      function setupSafetyMeasures() {
        // 1차 안전장치: 1초 후
        timeoutId1 = setTimeout(function() {
          if (!isFormVisible) {
            console.log('⚠️ 1차 안전장치 실행 (1초)');
            showFormWithDefaults();
          }
        }, 1000);
        
        // 2차 안전장치: 3초 후
        timeoutId2 = setTimeout(function() {
          if (!isFormVisible) {
            console.log('⚠️ 2차 안전장치 실행 (3초)');
            showFormWithDefaults();
          }
        }, 3000);
        
        // 3차 안전장치: 5초 후 (최종)
        timeoutId3 = setTimeout(function() {
          if (!isFormVisible) {
            console.log('⚠️ 최종 안전장치 실행 (5초)');
            showFormWithDefaults();
          }
        }, 5000);
      }
      
      // 초기화 함수
      function initialize() {
        console.log('🚀 HAPA 설정 페이지 초기화 시작');
        
        // VSCode API 초기화
        if (!initializeVSCode()) {
          console.log('📱 VSCode API 없음 - 기본 설정으로 실행');
          showFormWithDefaults();
          return;
        }
        
        // 안전장치 설정
        setupSafetyMeasures();
        
        // 설정 로드 시도
        setTimeout(function() {
          loadSettings();
        }, 100);
        
        console.log('✅ 초기화 완료');
      }
      
      // DOM 로드 이벤트
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
      } else {
        initialize();
      }
      
      // 🚨 즉시 안전장치: 100ms 후 무조건 폼 표시 시도
      setTimeout(function() {
        if (!isFormVisible) {
          console.log('🛟 즉시 안전장치: 기본 설정으로 폼 표시');
          showFormWithDefaults();
        }
      }, 100);
      
      // 전역 함수로 노출 (HTML에서 호출용)
      window.saveSettings = saveSettings;
      window.resetSettings = resetSettings;
      window.openVSCodeSettings = openVSCodeSettings;
      window.generateApiKey = generateApiKey;
      
    })(); // 즉시 실행 함수 종료
    
    // 탭 전환 함수 (전역 함수로 유지)
    function showTab(tabName) {
      // 모든 탭 내용 숨기기
      const tabContents = document.querySelectorAll('.tab-content');
      tabContents.forEach(content => {
        content.classList.remove('active');
      });
      
      // 모든 탭 버튼에서 active 클래스 제거
      const tabButtons = document.querySelectorAll('.tab-button');
      tabButtons.forEach(button => {
        button.classList.remove('active');
      });
      
      // 선택된 탭 내용 표시
      document.getElementById(tabName + 'Tab').classList.add('active');
      
      // 선택된 탭 버튼에 active 클래스 추가
      event.target.classList.add('active');
    }
      
      // 주석 트리거 설정
      if (settings.commentTrigger) {
        document.getElementById('commentTriggerResultDisplayMode').value = settings.commentTrigger.resultDisplayMode || 'immediate_insert';
        document.getElementById('commentTriggerAutoInsertDelay').value = settings.commentTrigger.autoInsertDelay || 0;
        document.getElementById('commentTriggerShowNotification').checked = settings.commentTrigger.showNotification || false;
        
        // 현재 설정 값 표시
        document.getElementById('currentCommentTrigger').textContent = settings.commentTrigger.resultDisplayMode || 'immediate_insert';
        document.getElementById('currentErrorHandling').textContent = settings.userProfile?.errorHandlingPreference || 'basic';
      }
      
      // 기능 설정
      if (settings.features) {
        document.getElementById('autoComplete').checked = settings.features.autoComplete !== false;
        document.getElementById('maxSuggestions').value = settings.features.maxSuggestions || 5;
        document.getElementById('enableLogging').checked = settings.features.enableLogging || false;
        document.getElementById('enableCodeAnalysis').checked = settings.features.enableCodeAnalysis !== false;
      }
    }
    



    
    `;

    return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HAPA 설정</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      background-color: var(--vscode-editor-background);
      color: var(--vscode-foreground);
      line-height: 1.6;
      padding: 20px;
    }
    
    .container {
      max-width: 800px;
      margin: 0 auto;
    }
    
    .header {
      background: linear-gradient(135deg, #007ACC 0%, #40A9FF 100%);
      color: white;
      padding: 24px;
      border-radius: 8px 8px 0 0;
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
    
    .content {
      background-color: var(--vscode-editor-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 0 0 8px 8px;
      padding: 32px;
    }
    
    .loading {
      text-align: center;
      padding: 40px;
      display: block;
    }
    
    .form-section {
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 1px solid var(--vscode-panel-border);
    }
    
    .form-section:last-child {
      border-bottom: none;
      margin-bottom: 0;
    }
    
    .section-title {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 16px;
      color: var(--vscode-foreground);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .form-group {
      margin-bottom: 20px;
    }
    
    .form-label {
      display: block;
      font-weight: 500;
      margin-bottom: 8px;
      color: var(--vscode-input-foreground);
    }
    
    .form-input, .form-select {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid var(--vscode-input-border);
      border-radius: 4px;
      background-color: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      font-size: 14px;
      font-family: var(--vscode-font-family);
    }
    
    .form-input:focus, .form-select:focus {
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
    
    .checkbox-group {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 12px;
      margin-top: 8px;
    }
    
    .checkbox-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px;
      background-color: var(--vscode-input-background);
      border: 1px solid var(--vscode-input-border);
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .checkbox-item:hover {
      border-color: var(--vscode-focusBorder);
      background-color: var(--vscode-list-hoverBackground);
    }
    
    .checkbox-item.checked {
      border-color: #007ACC;
      background-color: rgba(0, 122, 204, 0.1);
    }
    
    .checkbox-item input[type="checkbox"] {
      margin: 0;
    }
    
    .checkbox-label {
      flex: 1;
      font-size: 14px;
    }
    
    .user-info-card {
      background: linear-gradient(135deg, rgba(0, 122, 204, 0.1) 0%, rgba(64, 169, 255, 0.1) 100%);
      border: 1px solid rgba(0, 122, 204, 0.3);
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 24px;
    }
    
    .user-info-card h3 {
      margin-bottom: 12px;
      color: var(--vscode-foreground);
    }
    
    .user-info {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 8px 16px;
      font-size: 14px;
    }
    
    .info-label {
      font-weight: 500;
      color: var(--vscode-descriptionForeground);
    }
    
    .info-value {
      color: var(--vscode-foreground);
    }
    
    .current-settings {
      background-color: var(--vscode-input-background);
      border: 1px solid var(--vscode-input-border);
      border-radius: 6px;
      padding: 16px;
      margin-top: 16px;
    }
    
    .current-settings h4 {
      margin-bottom: 12px;
      font-size: 16px;
      color: var(--vscode-foreground);
    }
    
    .settings-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
    }
    
    .setting-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid var(--vscode-panel-border);
    }
    
    .setting-item:last-child {
      border-bottom: none;
    }
    
    .setting-label {
      font-size: 14px;
      color: var(--vscode-descriptionForeground);
    }
    
    .setting-value {
      font-size: 14px;
      font-weight: 500;
      color: var(--vscode-foreground);
    }
    
    .button-group {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid var(--vscode-panel-border);
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
    
    .btn-danger {
      background-color: var(--vscode-errorForeground);
      color: white;
    }
    
    .btn-danger:hover {
      background-color: var(--vscode-errorForeground);
      opacity: 0.8;
    }
    
    .message {
      padding: 12px 16px;
      border-radius: 4px;
      margin-bottom: 16px;
      display: none;
    }
    
    .message.success {
      background-color: var(--vscode-testing-iconPassed);
      color: white;
    }
    
    .message.error {
      background-color: var(--vscode-errorForeground);
      color: white;
    }
    
    .api-key-group {
      display: flex;
      gap: 8px;
      align-items: flex-end;
    }
    
    .api-key-input {
      flex: 1;
    }
    
    .api-key-btn {
      white-space: nowrap;
      min-width: 120px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚙️ HAPA 설정</h1>
      <p>AI 코딩 어시스턴트를 당신에게 맞게 설정하세요</p>
    </div>
    
    <div class="content">
      <div id="loadingIndicator" class="loading">
        설정을 불러오는 중...
      </div>
      
      <div id="settingsForm" style="display: none;">
        <div id="successMessage" class="message success"></div>
        <div id="errorMessage" class="message error"></div>
        
        <!-- 사용자 정보 카드 -->
          <div class="user-info-card">
          <h3>👤 사용자 정보</h3>
          <div class="user-info">
            <span class="info-label">이름:</span>
            <span class="info-value" id="userDisplayName">CompleteUser</span>
            <span class="info-label">이메일:</span>
            <span class="info-value" id="userDisplayEmail">complete.test@email.com</span>
              </div>
            </div>
            
        <!-- 사용자 프로필 설정 -->
        <div class="form-section">
          <h2 class="section-title">👤 사용자 프로필</h2>
            
            <div class="form-group">
              <label class="form-label">이메일 주소</label>
            <input type="email" id="email" class="form-input" placeholder="your.email@example.com">
            <p class="form-help">설정 동기화 및 API 키 발급에 사용됩니다.</p>
            </div>
            
            <div class="form-group">
              <label class="form-label">사용자명</label>
            <input type="text" id="username" class="form-input" placeholder="사용자명">
            <p class="form-help">코드 주석이나 문서에 표시될 이름입니다.</p>
        </div>
            
            <div class="form-group">
              <label class="form-label">Python 스킬 수준</label>
            <select id="pythonSkillLevel" class="form-select">
              <option value="beginner">초급자 - Python 기초 학습 중</option>
              <option value="intermediate">중급자 - 일반적인 프로그래밍 가능</option>
              <option value="advanced">고급자 - 복잡한 프로젝트 개발 가능</option>
              <option value="expert">전문가 - 최적화 및 아키텍처 설계 가능</option>
              </select>
            <p class="form-help">당신의 경험 수준에 맞는 코드와 설명을 제공합니다.</p>
            </div>
            
            <div class="form-group">
              <label class="form-label">코드 출력 구조</label>
            <select id="codeOutputStructure" class="form-select">
              <option value="minimal">최소한 - 핵심 로직만 간결하게</option>
              <option value="standard">표준 - 일반적인 구조 + 기본 주석</option>
              <option value="detailed">상세 - 자세한 주석 + 예외 처리</option>
              <option value="comprehensive">포괄적 - 문서화 + 테스트 코드</option>
              </select>
            <p class="form-help">AI가 생성하는 코드의 상세도를 설정합니다.</p>
            </div>
            
            <div class="form-group">
              <label class="form-label">설명 스타일</label>
            <select id="explanationStyle" class="form-select">
              <option value="brief">간단한 설명 - 핵심 내용만 빠르게</option>
              <option value="standard">표준 설명 - 코드 + 간단한 설명</option>
              <option value="detailed">상세 설명 - 개념 + 이유 + 활용법</option>
              <option value="educational">교육적 설명 - 단계별 + 예시 + 관련 개념</option>
              </select>
            <p class="form-help">AI 설명의 상세도와 스타일을 선택합니다.</p>
            </div>
            
            <div class="form-group">
            <label class="form-label">주요 프로젝트 컨텍스트</label>
            <select id="projectContext" class="form-select">
              <option value="web_development">웹 개발 - Django, Flask, FastAPI</option>
              <option value="data_science">데이터 사이언스 - NumPy, Pandas, ML</option>
              <option value="automation">자동화 - 스크립팅, 업무 자동화</option>
              <option value="general_purpose">범용 개발 - 다양한 목적</option>
              </select>
            <p class="form-help">주요 개발 분야에 맞는 라이브러리와 패턴을 제안합니다.</p>
          </div>
          
          <div class="form-group">
            <label class="form-label">오류 처리 선호도</label>
            <select id="errorHandlingPreference" class="form-select">
              <option value="basic">기본 - 필요한 경우만</option>
              <option value="comprehensive">포괄적 - 상세한 예외 처리</option>
              <option value="minimal">최소한 - 단순한 처리</option>
            </select>
            <p class="form-help">코드에 포함될 오류 처리 수준을 설정합니다.</p>
            </div>
            
            <div class="form-group">
              <label class="form-label">선호하는 Python 기능</label>
            <div id="languageFeatures" class="checkbox-group">
                <div class="checkbox-item" data-value="type_hints">
                <input type="checkbox" id="feature_type_hints">
                <label class="checkbox-label" for="feature_type_hints">타입 힌트 (Type Hints)</label>
                </div>
                <div class="checkbox-item" data-value="dataclasses">
                <input type="checkbox" id="feature_dataclasses">
                <label class="checkbox-label" for="feature_dataclasses">데이터클래스 (Dataclasses)</label>
                </div>
                <div class="checkbox-item" data-value="async_await">
                <input type="checkbox" id="feature_async_await">
                <label class="checkbox-label" for="feature_async_await">비동기 프로그래밍 (Async/Await)</label>
                </div>
              <div class="checkbox-item" data-value="f_strings">
                <input type="checkbox" id="feature_f_strings">
                <label class="checkbox-label" for="feature_f_strings">f-strings</label>
                </div>
              <div class="checkbox-item" data-value="list_comprehensions">
                <input type="checkbox" id="feature_list_comprehensions">
                <label class="checkbox-label" for="feature_list_comprehensions">리스트 컴프리헨션</label>
                </div>
                <div class="checkbox-item" data-value="decorators">
                <input type="checkbox" id="feature_decorators">
                <label class="checkbox-label" for="feature_decorators">데코레이터 (Decorators)</label>
                </div>
                </div>
            <p class="form-help">선택한 기능들을 우선적으로 사용하여 코드를 생성합니다.</p>
              </div>
            </div>
            
        <!-- API 설정 -->
        <div class="form-section">
          <h2 class="section-title">🔗 API 설정</h2>
            
            <div class="form-group">
            <label class="form-label">API 서버 URL</label>
            <input type="url" id="apiBaseURL" class="form-input" placeholder="http://3.13.240.111:8000/api/v1">
            <p class="form-help">HAPA Backend API 서버의 주소입니다.</p>
            </div>
            
            <div class="form-group">
              <label class="form-label">API 키</label>
            <div class="api-key-group">
              <div class="api-key-input">
                <input type="password" id="apiKey" class="form-input" placeholder="API 키를 입력하세요">
                <p class="form-help">HAPA API 접근을 위한 인증 키입니다.</p>
              </div>
              <button type="button" class="btn btn-secondary api-key-btn" id="generateApiKeyBtn" onclick="generateApiKey()">
                🔑 API 키 발급
              </button>
            </div>
            </div>
            
            <div class="form-group">
            <label class="form-label">API 타임아웃 (ms)</label>
            <input type="number" id="apiTimeout" class="form-input" min="5000" max="300000" step="1000" placeholder="30000">
            <p class="form-help">API 요청 대기 시간 (5초 ~ 5분)</p>
          </div>
        </div>
        
        <!-- 주석 트리거 설정 -->
        <div class="form-section">
          <h2 class="section-title">💬 주석 트리거 설정</h2>
            
            <div class="form-group">
            <label class="form-label">결과 표시 모드</label>
            <select id="commentTriggerResultDisplayMode" class="form-select">
              <option value="immediate_insert">즉시 삽입 - 생성된 코드를 바로 삽입</option>
              <option value="sidebar">사이드바 표시 - 사이드바에서 검토 후 삽입</option>
              <option value="confirm_insert">확인 후 삽입 - 미리보고 확인 대화상자</option>
              <option value="inline_preview">인라인 미리보기 - 에디터에서 미리보고 선택</option>
              </select>
            <p class="form-help">AI 코드 생성 후 처리 방식을 설정합니다.</p>
            </div>
            
            <div class="form-group">
            <label class="form-label">자동 삽입 지연 시간 (초)</label>
            <input type="number" id="commentTriggerAutoInsertDelay" class="form-input" min="0" max="10" step="0.5" placeholder="0">
            <p class="form-help">즉시 삽입 모드에서 지연 시간 (0 = 즉시)</p>
            </div>
            
            <div class="form-group">
              <div class="checkbox-item">
                <input type="checkbox" id="commentTriggerShowNotification">
              <label class="checkbox-label" for="commentTriggerShowNotification">코드 생성 완료 알림 표시</label>
              </div>
            <p class="form-help">AI 코드 생성이 완료되면 알림을 표시합니다.</p>
            </div>
          </div>
          
        <!-- 기능 설정 -->
        <div class="form-section">
          <h2 class="section-title">⚡ 기능 설정</h2>
            
            <div class="form-group">
              <div class="checkbox-item">
                <input type="checkbox" id="autoComplete">
              <label class="checkbox-label" for="autoComplete">자동 완성 활성화</label>
              </div>
            <p class="form-help">타이핑 중 AI 코드 제안을 표시합니다.</p>
            </div>
            
            <div class="form-group">
            <label class="form-label">최대 제안 수</label>
            <input type="number" id="maxSuggestions" class="form-input" min="1" max="20" placeholder="5">
            <p class="form-help">한 번에 표시할 최대 코드 제안 개수입니다.</p>
            </div>
            
            <div class="form-group">
              <div class="checkbox-item">
              <input type="checkbox" id="enableLogging">
              <label class="checkbox-label" for="enableLogging">상세 로깅 활성화</label>
              </div>
            <p class="form-help">디버깅을 위한 상세한 로그를 기록합니다.</p>
            </div>
            
            <div class="form-group">
              <div class="checkbox-item">
              <input type="checkbox" id="enableCodeAnalysis">
              <label class="checkbox-label" for="enableCodeAnalysis">코드 분석 기능 활성화</label>
              </div>
            <p class="form-help">코드 품질 분석 및 개선 제안을 제공합니다.</p>
            </div>
          </div>
        
        <!-- 현재 설정 요약 -->
        <div class="current-settings">
          <h4>📊 현재 설정 요약</h4>
          <div class="settings-grid">
            <div class="setting-item">
              <span class="setting-label">코드 출력:</span>
              <span class="setting-value" id="currentCodeOutput">minimal</span>
        </div>
            <div class="setting-item">
              <span class="setting-label">설명 스타일:</span>
              <span class="setting-value" id="currentExplanation">brief</span>
      </div>
            <div class="setting-item">
              <span class="setting-label">프로젝트 컨텍스트:</span>
              <span class="setting-value" id="currentProject">web_development</span>
            </div>
            <div class="setting-item">
              <span class="setting-label">언어 기능:</span>
              <span class="setting-value" id="currentLanguageFeature">type_hints</span>
            </div>
            <div class="setting-item">
              <span class="setting-label">주석 트리거:</span>
              <span class="setting-value" id="currentCommentTrigger">immediate_insert</span>
            </div>
            <div class="setting-item">
              <span class="setting-label">오류 처리:</span>
              <span class="setting-value" id="currentErrorHandling">basic</span>
            </div>
          </div>
        </div>
        
        <!-- 버튼 그룹 -->
        <div class="button-group">
          <button type="button" class="btn btn-danger" onclick="resetSettings()">
            🔄 설정 초기화
          </button>
          <button type="button" class="btn btn-secondary" onclick="openVSCodeSettings()">
            ⚙️ VSCode 설정 열기
          </button>
          <button type="button" class="btn btn-primary" onclick="saveSettings()">
            💾 설정 저장
          </button>
        </div>
      </div>
    </div>
  </div>

  <script>
    ${scriptContent}
  </script>
</body>
</html>`;
  }
}
