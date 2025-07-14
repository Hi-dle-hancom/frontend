"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsProvider = void 0;
const vscode = __importStar(require("vscode"));
const BaseWebviewProvider_1 = require("./BaseWebviewProvider");
/**
 * 사용자 설정 웹뷰 프로바이더
 */
class SettingsProvider extends BaseWebviewProvider_1.BaseWebviewProvider {
    constructor(extensionUri) {
        super(extensionUri);
    }
    /**
     * 패널 타입 반환
     */
    getPanelType() {
        return "hapa-settings";
    }
    /**
     * 패널 제목 반환
     */
    getPanelTitle() {
        return "HAPA 설정";
    }
    /**
     * 웹뷰 패널용 public HTML 생성 메서드
     */
    getPublicHtmlContent(webview) {
        return this.getHtmlContent(webview);
    }
    /**
     * 웹뷰 패널용 public 메시지 핸들러 설정 메서드
     */
    setupPublicHandlers(webview) {
        this.setupMessageHandlers(webview);
    }
    getHtmlContent(webview) {
        return this.generateSettingsHtml();
    }
    handleCustomMessage(message) {
        switch (message.command) {
            case "loadSettings":
                this.loadAndSendSettings();
                break;
            case "saveSettings":
                this.saveSettings(message.settings);
                break;
            case "resetSettings":
                this.resetSettings();
                break;
            case "generateApiKey":
                this.generateAPIKeyForEmail(message.email, message.username);
                break;
            case "openVSCodeSettings":
                this.openVSCodeSettings();
                break;
            default:
                console.log("🔍 알 수 없는 메시지 명령:", message.command);
        }
    }
    /**
     * 웹뷰가 준비되면 즉시 설정 로드
     */
    onWebviewReady() {
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
    async saveSettings(settings) {
        try {
            console.log("💾 설정 저장 시작:", settings);
            const config = vscode.workspace.getConfiguration("hapa");
            // 사용자 프로필 설정
            if (settings.userProfile) {
                await config.update("userProfile.email", settings.userProfile.email, vscode.ConfigurationTarget.Global);
                await config.update("userProfile.username", settings.userProfile.username, vscode.ConfigurationTarget.Global);
                await config.update("userProfile.pythonSkillLevel", settings.userProfile.pythonSkillLevel, vscode.ConfigurationTarget.Global);
                await config.update("userProfile.codeOutputStructure", settings.userProfile.codeOutputStructure, vscode.ConfigurationTarget.Global);
                await config.update("userProfile.explanationStyle", settings.userProfile.explanationStyle, vscode.ConfigurationTarget.Global);
                await config.update("userProfile.projectContext", settings.userProfile.projectContext, vscode.ConfigurationTarget.Global);
                await config.update("userProfile.errorHandlingPreference", settings.userProfile.errorHandlingPreference, vscode.ConfigurationTarget.Global);
                await config.update("userProfile.preferredLanguageFeatures", settings.userProfile.preferredLanguageFeatures || [], vscode.ConfigurationTarget.Global);
            }
            // API 설정
            if (settings.api) {
                await config.update("apiBaseURL", settings.api.apiBaseURL, vscode.ConfigurationTarget.Global);
                await config.update("apiKey", settings.api.apiKey, vscode.ConfigurationTarget.Global);
                await config.update("apiTimeout", settings.api.apiTimeout, vscode.ConfigurationTarget.Global);
            }
            // 주석 트리거 설정
            if (settings.commentTrigger) {
                await config.update("commentTrigger.resultDisplayMode", settings.commentTrigger.resultDisplayMode, vscode.ConfigurationTarget.Global);
                await config.update("commentTrigger.autoInsertDelay", settings.commentTrigger.autoInsertDelay, vscode.ConfigurationTarget.Global);
                await config.update("commentTrigger.showNotification", settings.commentTrigger.showNotification, vscode.ConfigurationTarget.Global);
            }
            // 기능 설정
            if (settings.features) {
                await config.update("autoComplete", settings.features.autoComplete, vscode.ConfigurationTarget.Global);
                await config.update("maxSuggestions", settings.features.maxSuggestions, vscode.ConfigurationTarget.Global);
                await config.update("enableLogging", settings.features.enableLogging, vscode.ConfigurationTarget.Global);
                await config.update("enableCodeAnalysis", settings.features.enableCodeAnalysis, vscode.ConfigurationTarget.Global);
            }
            console.log("✅ 설정 저장 성공");
            // 성공 메시지 전송
            if (this._view) {
                this._view.webview.postMessage({
                    command: "settingsSaved",
                    success: true,
                });
            }
        }
        catch (error) {
            console.error("❌ 설정 저장 실패:", error);
            // 오류 메시지 전송
            if (this._view) {
                this._view.webview.postMessage({
                    command: "settingsError",
                    error: error.message,
                });
            }
        }
    }
    /**
     * 설정에서 이메일을 위한 API 키 발급
     */
    async generateAPIKeyForEmail(email, username) {
        try {
            console.log("🔑 API 키 생성 시작:", { email, username });
            const config = vscode.workspace.getConfiguration("hapa");
            const apiBaseURL = config.get("apiBaseURL") || "http://3.13.240.111:8000/api/v1";
            console.log("🌐 API 엔드포인트:", apiBaseURL);
            const response = await fetch(`${apiBaseURL}/users/generate-api-key`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: email,
                    username: username || "CompleteUser",
                }),
            });
            if (!response.ok) {
                const errorText = await response.text();
                console.error("❌ API 키 생성 실패:", response.status, errorText);
                // 웹뷰에 오류 메시지 전송
                if (this._view) {
                    this._view.webview.postMessage({
                        command: "apiKeyGenerated",
                        success: false,
                        error: `HTTP ${response.status}: ${errorText}`,
                    });
                }
                return {
                    success: false,
                    error: `HTTP ${response.status}: ${errorText}`,
                };
            }
            const result = await response.json();
            console.log("✅ API 키 생성 성공:", result);
            // 생성된 API 키를 VSCode 설정에 저장
            if (result.api_key) {
                await config.update("apiKey", result.api_key, vscode.ConfigurationTarget.Global);
                console.log("💾 API 키 저장 완료");
            }
            // 웹뷰에 성공 메시지 전송
            if (this._view) {
                this._view.webview.postMessage({
                    command: "apiKeyGenerated",
                    success: true,
                    apiKey: result.api_key,
                });
            }
            return {
                success: true,
                apiKey: result.api_key,
            };
        }
        catch (error) {
            console.error("❌ API 키 생성 오류:", error);
            // 웹뷰에 오류 메시지 전송
            if (this._view) {
                this._view.webview.postMessage({
                    command: "apiKeyGenerated",
                    success: false,
                    error: error.message,
                });
            }
            return {
                success: false,
                error: error.message,
            };
        }
    }
    /**
     * 설정 초기화
     */
    async resetSettings() {
        const result = await vscode.window.showWarningMessage("모든 설정을 기본값으로 초기화하시겠습니까?", "초기화", "취소");
        if (result === "초기화") {
            try {
                const config = vscode.workspace.getConfiguration("hapa");
                // 사용자 프로필 기본값으로 초기화
                await config.update("userProfile.pythonSkillLevel", "intermediate", vscode.ConfigurationTarget.Global);
                await config.update("userProfile.codeOutputStructure", "standard", vscode.ConfigurationTarget.Global);
                await config.update("userProfile.explanationStyle", "standard", vscode.ConfigurationTarget.Global);
                await config.update("userProfile.projectContext", "general_purpose", vscode.ConfigurationTarget.Global);
                await config.update("userProfile.errorHandlingPreference", "basic", vscode.ConfigurationTarget.Global);
                await config.update("userProfile.preferredLanguageFeatures", ["type_hints", "f_strings"], vscode.ConfigurationTarget.Global);
                // 기능 설정 기본값으로 초기화
                await config.update("autoComplete", true, vscode.ConfigurationTarget.Global);
                await config.update("maxSuggestions", 5, vscode.ConfigurationTarget.Global);
                await config.update("enableLogging", false, vscode.ConfigurationTarget.Global);
                await config.update("apiTimeout", 30000, vscode.ConfigurationTarget.Global);
                // 주석 트리거 설정 기본값으로 초기화
                await config.update("commentTrigger.resultDisplayMode", "sidebar", vscode.ConfigurationTarget.Global);
                await config.update("commentTrigger.autoInsertDelay", 0, vscode.ConfigurationTarget.Global);
                await config.update("commentTrigger.showNotification", true, vscode.ConfigurationTarget.Global);
                vscode.window.showInformationMessage("🔄 설정이 기본값으로 초기화되었습니다.");
                // 웹뷰 새로고침
                this.loadAndSendSettings();
            }
            catch (error) {
                vscode.window.showErrorMessage(`설정 초기화 중 오류가 발생했습니다: ${error.message}`);
            }
        }
    }
    /**
     * 현재 설정 로드 및 웹뷰로 전송
     */
    loadAndSendSettings() {
        try {
            console.log("⚙️ VSCode 설정 로드 시작...");
            const config = vscode.workspace.getConfiguration("hapa");
            const currentSettings = {
                userProfile: {
                    email: config.get("userProfile.email") || "complete.test@email.com",
                    username: config.get("userProfile.username") || "CompleteUser",
                    pythonSkillLevel: config.get("userProfile.pythonSkillLevel") || "intermediate",
                    codeOutputStructure: config.get("userProfile.codeOutputStructure") || "minimal",
                    explanationStyle: config.get("userProfile.explanationStyle") || "brief",
                    projectContext: config.get("userProfile.projectContext") || "web_development",
                    errorHandlingPreference: config.get("userProfile.errorHandlingPreference") || "basic",
                    preferredLanguageFeatures: config.get("userProfile.preferredLanguageFeatures") || ["type_hints"],
                },
                api: {
                    apiBaseURL: config.get("apiBaseURL") || "http://3.13.240.111:8000/api/v1",
                    apiKey: config.get("apiKey") || "hapa_demo_20241228_secure_key_for_testing",
                    apiTimeout: config.get("apiTimeout") || 30000,
                },
                commentTrigger: {
                    resultDisplayMode: config.get("commentTrigger.resultDisplayMode") ||
                        "immediate_insert",
                    autoInsertDelay: config.get("commentTrigger.autoInsertDelay") || 0,
                    showNotification: config.get("commentTrigger.showNotification") || false,
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
                apiKey: currentSettings.api.apiKey &&
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
            }
            else {
                console.error("❌ 웹뷰 인스턴스가 없음");
            }
        }
        catch (error) {
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
                    error: error.message,
                });
            }
        }
    }
    /**
     * VSCode 설정 페이지 열기
     */
    openVSCodeSettings() {
        vscode.commands.executeCommand("workbench.action.openSettings", "hapa");
    }
    /**
     * 설정 HTML 생성 (JavaScript 템플릿 분리)
     */
    generateSettingsHtml() {
        const scriptContent = `
    (function() {
      'use strict';
      
      let currentSettings = {};
      let isFormVisible = false;
      let vscode = null;
      let isInitialized = false;
      
      console.log('🚀 설정 페이지 JavaScript 초기화 시작');
      
      // 유틸리티 함수들
      function getValue(id) {
        const element = document.getElementById(id);
        return element ? element.value : '';
      }
      
      function setValue(id, value) {
        const element = document.getElementById(id);
        if (element) {
          element.value = value || '';
        }
      }
      
      function getChecked(id) {
        const element = document.getElementById(id);
        return element ? element.checked : false;
      }
      
      function setChecked(id, checked) {
        const element = document.getElementById(id);
        if (element) {
          element.checked = !!checked;
        }
      }
      
      function setTextContent(id, text) {
        const element = document.getElementById(id);
        if (element) {
          element.textContent = text || '';
        }
      }
      
      // 메시지 표시 함수
      function showMessage(message, type = 'info') {
        const messageId = type === 'error' ? 'errorMessage' : 'successMessage';
        const messageElement = document.getElementById(messageId);
        
        if (messageElement) {
          messageElement.textContent = message;
          messageElement.className = 'message ' + type + ' show';
          
          // 3초 후 자동 숨기기
          setTimeout(() => {
            messageElement.classList.remove('show');
          }, 3000);
        }
      }
      
      // 모든 메시지 숨기기
      function hideAllMessages() {
        const messages = document.querySelectorAll('.message');
        messages.forEach(msg => msg.classList.remove('show'));
      }
      
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
      
      // 메시지 리스너 설정
      function setupMessageListener() {
        window.addEventListener('message', event => {
          const message = event.data;
          console.log('📨 메시지 수신:', message.command);
          
          switch (message.command) {
            case 'settingsLoaded':
              console.log('📋 설정 데이터 수신:', message.settings);
              currentSettings = message.settings;
              hideLoading();
              showForm();
              populateSettings(message.settings);
              break;
              
            case 'settingsSaved':
              console.log('✅ 설정 저장 완료');
              showMessage('설정이 성공적으로 저장되었습니다!', 'success');
              break;
              
            case 'settingsError':
              console.error('❌ 설정 오류:', message.error);
              showMessage('설정 처리 중 오류가 발생했습니다: ' + message.error, 'error');
              break;
              
            case 'apiKeyGenerated':
              if (message.success && message.apiKey) {
                console.log('🔑 API 키 생성 완료');
                setValue('apiKey', message.apiKey);
                showMessage('API 키가 성공적으로 생성되었습니다!', 'success');
              } else {
                showMessage('API 키 생성 실패: ' + (message.error || '알 수 없는 오류'), 'error');
              }
              break;
          }
        });
      }
      
      // 초기화 함수 (강화된 버전)
      function initialize() {
        console.log('🔧 설정 페이지 초기화 시작...');
        
        if (isInitialized) {
          console.log('⚠️ 이미 초기화됨');
          return;
        }
        
        // VSCode API 초기화
        if (!initializeVSCode()) {
          console.error('❌ VSCode API 초기화 실패 - 기본 설정으로 진행');
          setTimeout(showFormWithDefaults, 1000);
          return;
        }
        
        // 메시지 리스너 설정
        setupMessageListener();
        
        // 이벤트 리스너 설정
        setupEventListeners();
        
        // 설정 로드 시도
        loadSettings();
        
        // 안전장치: 5초 후에도 로딩 상태면 기본값으로 진행
        setTimeout(() => {
          if (!isFormVisible) {
            console.log('⏰ 타임아웃: 기본 설정으로 진행');
            showFormWithDefaults();
          }
        }, 5000);
        
        isInitialized = true;
      }
      
      // 설정 로드 함수
      function loadSettings() {
        console.log('📥 설정 로드 요청 전송...');
        if (vscode) {
          vscode.postMessage({ command: 'loadSettings' });
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
            codeOutputStructure: 'standard',
            explanationStyle: 'standard',
            projectContext: 'general_purpose',
            errorHandlingPreference: 'basic',
            preferredLanguageFeatures: ['type_hints', 'f_strings']
          },
          api: {
            apiBaseURL: 'http://3.13.240.111:8000/api/v1',
            apiKey: 'hapa_demo_20241228_secure_key_for_testing',
            apiTimeout: 30000
          },
          commentTrigger: {
            resultDisplayMode: 'sidebar',
            autoInsertDelay: 0,
            showNotification: true
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
          
          // 폼이 표시된 후 커스텀 select 초기화
          setTimeout(() => {
            initializeCustomSelects();
            
            // 현재 설정으로 커스텀 select 값 재설정
            if (currentSettings && currentSettings.userProfile) {
              const profile = currentSettings.userProfile;
              setCustomSelectValue('pythonSkillLevel', profile.pythonSkillLevel);
              setCustomSelectValue('codeOutputStructure', profile.codeOutputStructure);
              setCustomSelectValue('explanationStyle', profile.explanationStyle);
              setCustomSelectValue('projectContext', profile.projectContext);
              setCustomSelectValue('errorHandlingPreference', profile.errorHandlingPreference);
            }
            
            if (currentSettings && currentSettings.commentTrigger) {
              setCustomSelectValue('commentTriggerResultDisplayMode', currentSettings.commentTrigger.resultDisplayMode);
            }
            
            console.log('🎯 폼 표시 후 커스텀 드롭다운 초기화 및 값 설정 완료');
          }, 100);
          
          console.log('✅ 설정 폼 표시 완료');
        }
      }
      
      // 설정으로 폼 채우기
      function populateSettings(settings) {
        console.log('📝 설정 데이터로 폼 채우기...', settings);
        
        try {
          // 사용자 정보 표시
          if (settings.userProfile) {
            setValue('userDisplayName', settings.userProfile.username || 'CompleteUser');
            setValue('userDisplayEmail', settings.userProfile.email || 'complete.test@email.com');
            
            // 폼 필드 채우기
            setValue('email', settings.userProfile.email);
            setValue('username', settings.userProfile.username);
            setValue('pythonSkillLevel', settings.userProfile.pythonSkillLevel);
            setValue('codeOutputStructure', settings.userProfile.codeOutputStructure);
            setValue('explanationStyle', settings.userProfile.explanationStyle);
            setValue('projectContext', settings.userProfile.projectContext);
            setValue('errorHandlingPreference', settings.userProfile.errorHandlingPreference);
            
            // 언어 기능 체크박스
            populateLanguageFeatures(settings.userProfile.preferredLanguageFeatures || []);
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
          
          // 현재 설정 요약 업데이트
          updateCurrentSettingsSummary(settings);
          
          console.log('✅ 폼 채우기 완료');
        } catch (error) {
          console.error('❌ 폼 채우기 오류:', error);
        }
      }
      
      // 언어 기능 체크박스 채우기
      function populateLanguageFeatures(features) {
        console.log('📝 언어 기능 체크박스 채우기:', features);
        const checkboxes = document.querySelectorAll('#languageFeatures input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
          const parent = checkbox.closest('.checkbox-item');
          const value = parent.getAttribute('data-value');
          if (value) {
            checkbox.checked = features.includes(value);
            if (checkbox.checked) {
              parent.classList.add('checked');
            } else {
              parent.classList.remove('checked');
            }
          }
        });
      }
      
      // 현재 설정 요약 업데이트
      function updateCurrentSettingsSummary(settings) {
        try {
          if (settings.userProfile) {
            setTextContent('currentCodeOutput', getDisplayText('codeOutputStructure', settings.userProfile.codeOutputStructure));
            setTextContent('currentExplanation', getDisplayText('explanationStyle', settings.userProfile.explanationStyle));
            setTextContent('currentProject', getDisplayText('projectContext', settings.userProfile.projectContext));
            setTextContent('currentErrorHandling', getDisplayText('errorHandlingPreference', settings.userProfile.errorHandlingPreference));
            
            const features = settings.userProfile.preferredLanguageFeatures || [];
            setTextContent('currentLanguageFeature', features.length > 0 ? features.join(', ') : '없음');
          }
          
          if (settings.commentTrigger) {
            setTextContent('currentCommentTrigger', getDisplayText('resultDisplayMode', settings.commentTrigger.resultDisplayMode));
          }
        } catch (error) {
          console.error('❌ 설정 요약 업데이트 오류:', error);
        }
      }
      
      // 표시 텍스트 가져오기
      function getDisplayText(type, value) {
        const displayTexts = {
          codeOutputStructure: {
            minimal: '최소한',
            standard: '표준',
            detailed: '상세',
            comprehensive: '포괄적'
          },
          explanationStyle: {
            brief: '간단',
            standard: '표준',
            detailed: '상세',
            educational: '교육적'
          },
          projectContext: {
            web_development: '웹 개발',
            data_science: '데이터 사이언스',
            automation: '자동화',
            general_purpose: '범용 개발',
            academic: '학술',
            enterprise: '기업용'
          },
          errorHandlingPreference: {
            minimal: '최소한',
            basic: '기본',
            comprehensive: '포괄적',
            production_ready: '프로덕션'
          },
          resultDisplayMode: {
            immediate_insert: '즉시 삽입',
            sidebar: '사이드바 표시',
            confirm_insert: '확인 후 삽입',
            inline_preview: '인라인 미리보기'
          }
        };
        
        return displayTexts[type]?.[value] || value;
      }
      
      // 텍스트 내용 설정 헬퍼 함수
      function setTextContent(id, text) {
        const element = document.getElementById(id);
        if (element && text !== undefined && text !== null) {
          element.textContent = text;
        }
      }
      
      // 체크박스 설정 헬퍼 함수
      function setChecked(id, checked) {
        const element = document.getElementById(id);
        if (element && checked !== undefined && checked !== null) {
          element.checked = !!checked;
          
          const parent = element.closest('.checkbox-item');
          if (parent) {
            if (checked) {
              parent.classList.add('checked');
            } else {
              parent.classList.remove('checked');
            }
          }
        }
      }
      
      // 체크박스 값 가져오기 헬퍼 함수
      function getChecked(id) {
        const element = document.getElementById(id);
        return element ? element.checked : false;
      }
      
      // 메시지 표시 함수
      function showMessage(text, type) {
        const messageId = type === 'error' ? 'errorMessage' : 'successMessage';
        const messageElement = document.getElementById(messageId);
        
        if (messageElement) {
          messageElement.textContent = text;
          messageElement.style.display = 'block';
          
          // 3초 후 자동 숨김
          setTimeout(() => {
            messageElement.style.display = 'none';
          }, 3000);
        }
      }
      
      // 설정 저장 함수
      function saveSettings() {
        console.log('💾 설정 저장 시작...');
        
        if (!vscode) {
          console.error('❌ VSCode API 없음');
          showMessage('VSCode API를 사용할 수 없습니다.', 'error');
          return;
        }
        
        try {
          // 언어 기능 수집
          const selectedFeatures = [];
          const checkboxes = document.querySelectorAll('#languageFeatures input[type="checkbox"]:checked');
          checkboxes.forEach(checkbox => {
            const parent = checkbox.closest('.checkbox-item');
            const value = parent.getAttribute('data-value');
            if (value) selectedFeatures.push(value);
          });
          
          const settings = {
            userProfile: {
              email: getValue('email') || 'complete.test@email.com',
              username: getValue('username') || 'CompleteUser',
              pythonSkillLevel: getValue('pythonSkillLevel') || 'intermediate',
              codeOutputStructure: getValue('codeOutputStructure') || 'standard',
              explanationStyle: getValue('explanationStyle') || 'standard',
              projectContext: getValue('projectContext') || 'general_purpose',
              errorHandlingPreference: getValue('errorHandlingPreference') || 'basic',
              preferredLanguageFeatures: selectedFeatures.length > 0 ? selectedFeatures : ['type_hints', 'f_strings']
            },
            api: {
              apiBaseURL: getValue('apiBaseURL') || 'http://3.13.240.111:8000/api/v1',
              apiKey: getValue('apiKey') || '',
              apiTimeout: parseInt(getValue('apiTimeout')) || 30000
            },
            commentTrigger: {
              resultDisplayMode: getValue('commentTriggerResultDisplayMode') || 'sidebar',
              autoInsertDelay: parseInt(getValue('commentTriggerAutoInsertDelay')) || 0,
              showNotification: getChecked('commentTriggerShowNotification')
            },
            features: {
              autoComplete: getChecked('autoComplete'),
              maxSuggestions: parseInt(getValue('maxSuggestions')) || 5,
              enableLogging: getChecked('enableLogging'),
              enableCodeAnalysis: getChecked('enableCodeAnalysis')
            }
          };
          
          console.log('📤 설정 저장 요청 전송:', settings);
          
          vscode.postMessage({
            command: 'saveSettings',
            settings: settings
          });
          
        } catch (error) {
          console.error('❌ 설정 저장 오류:', error);
          showMessage('설정 저장 중 오류가 발생했습니다.', 'error');
        }
      }
      
      // API 키 생성 함수
      function generateApiKey() {
        const email = getValue('email');
        const username = getValue('username');
        
        if (!email) {
          showMessage('API 키 생성을 위해 이메일을 입력해주세요.', 'error');
          return;
        }
        
        if (!vscode) {
          showMessage('VSCode API를 사용할 수 없습니다.', 'error');
          return;
        }
        
        console.log('🔑 API 키 생성 요청...');
        vscode.postMessage({
          command: 'generateApiKey',
          email: email,
          username: username
        });
      }
      
      // 설정 초기화 함수
      function resetSettings() {
        if (confirm('모든 설정을 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
          if (vscode) {
            vscode.postMessage({
              command: 'resetSettings'
            });
          }
        }
      }
      
      // VSCode 설정 열기
      function openVSCodeSettings() {
        if (vscode) {
          vscode.postMessage({
            command: 'openVSCodeSettings'
          });
        }
      }
      
      // 체크박스 상태 변경 처리
      function handleCheckboxChange(checkbox) {
        const parent = checkbox.closest('.checkbox-item');
        if (parent) {
          if (checkbox.checked) {
            parent.classList.add('checked');
          } else {
            parent.classList.remove('checked');
          }
        }
      }
      
      // 전역 함수로 노출 (디버깅용으로만 유지)
      window.saveSettings = saveSettings;
      window.generateApiKey = generateApiKey;
      window.resetSettings = resetSettings;
      window.openVSCodeSettings = openVSCodeSettings;
      
      // DOM 완전 로드 후 초기화
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
      } else {
        // DOM이 이미 로드된 경우 즉시 초기화
        setTimeout(initialize, 100);
      }
      
      // 커스텀 드롭다운 관리 함수들
      function initializeCustomSelects() {
        console.log('🎯 커스텀 드롭다운 초기화...');
        
        const customSelects = document.querySelectorAll('.custom-select');
        console.log('📋 찾은 커스텀 select 개수:', customSelects.length);
        
        customSelects.forEach((select, index) => {
          const selectId = select.getAttribute('data-select-id');
          console.log('📝 커스텀 select [' + index + '] 초기화 중:', selectId);
          const button = select.querySelector('.select-button');
          const dropdown = select.querySelector('.select-dropdown');
          const options = select.querySelectorAll('.select-option');
          
          if (!button || !dropdown) return;
          
          // 버튼 클릭 이벤트
          button.addEventListener('click', function(e) {
            console.log('🖱️ 드롭다운 버튼 클릭됨:', selectId);
            e.preventDefault();
            e.stopPropagation();
            toggleDropdown(select);
          });
          
          // 키보드 이벤트
          button.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              toggleDropdown(select);
            } else if (e.key === 'ArrowDown') {
              e.preventDefault();
              if (!dropdown.classList.contains('open')) {
                toggleDropdown(select);
              } else {
                focusNextOption(select);
              }
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              focusPreviousOption(select);
            } else if (e.key === 'Escape') {
              closeDropdown(select);
            }
          });
          
          // 옵션 클릭 이벤트
          options.forEach(option => {
            option.addEventListener('click', function(e) {
              e.preventDefault();
              e.stopPropagation();
              selectOption(select, option);
            });
          });
        });
        
        // 외부 클릭 시 모든 드롭다운 닫기
        document.addEventListener('click', function(e) {
          if (!e.target.closest('.custom-select')) {
            closeAllDropdowns();
          }
        });
        
        console.log('✅ 커스텀 드롭다운 초기화 완료');
      }
      
      function toggleDropdown(select) {
        const dropdown = select.querySelector('.select-dropdown');
        const button = select.querySelector('.select-button');
        const selectId = select.getAttribute('data-select-id');
        
        console.log('🔄 toggleDropdown 호출됨:', selectId);
        console.log('📋 dropdown 요소:', dropdown);
        console.log('📋 button 요소:', button);
        
        if (dropdown.classList.contains('open')) {
          console.log('📤 드롭다운 닫기:', selectId);
          closeDropdown(select);
        } else {
          console.log('📥 드롭다운 열기:', selectId);
          closeAllDropdowns();
          dropdown.classList.add('open');
          button.classList.add('open');
          button.setAttribute('aria-expanded', 'true');
          console.log('✅ 드롭다운 열기 완료:', selectId);
        }
      }
      
      function closeDropdown(select) {
        const dropdown = select.querySelector('.select-dropdown');
        const button = select.querySelector('.select-button');
        
        dropdown.classList.remove('open');
        button.classList.remove('open');
        button.setAttribute('aria-expanded', 'false');
      }
      
      function closeAllDropdowns() {
        const openDropdowns = document.querySelectorAll('.select-dropdown.open');
        openDropdowns.forEach(dropdown => {
          const select = dropdown.closest('.custom-select');
          if (select) closeDropdown(select);
        });
      }
      
      function selectOption(select, option) {
        const button = select.querySelector('.select-button');
        const selectText = button.querySelector('.select-text');
        const value = option.getAttribute('data-value');
        const mainText = option.querySelector('.select-option-main').textContent;
        const descText = option.querySelector('.select-option-desc').textContent;
        
        // 이전 선택 해제
        const previousSelected = select.querySelector('.select-option.selected');
        if (previousSelected) {
          previousSelected.classList.remove('selected');
        }
        
        // 새 선택 설정
        option.classList.add('selected');
        selectText.textContent = mainText + ' - ' + descText;
        
        // data-value 속성 설정
        select.setAttribute('data-value', value);
        
        // 드롭다운 닫기
        closeDropdown(select);
        
        // 설정 요약 업데이트 시도
        try {
          updateSettingsSummary();
        } catch (error) {
          console.log('설정 요약 업데이트 오류 (무시):', error);
        }
        
        console.log('✅ 옵션 선택됨:', { id: select.getAttribute('data-select-id'), value: value, text: mainText });
      }
      
      function focusNextOption(select) {
        const options = select.querySelectorAll('.select-option');
        const currentSelected = select.querySelector('.select-option.selected');
        const currentIndex = Array.from(options).indexOf(currentSelected);
        const nextIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
        
        if (options[nextIndex]) {
          selectOption(select, options[nextIndex]);
        }
      }
      
      function focusPreviousOption(select) {
        const options = select.querySelectorAll('.select-option');
        const currentSelected = select.querySelector('.select-option.selected');
        const currentIndex = Array.from(options).indexOf(currentSelected);
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
        
        if (options[prevIndex]) {
          selectOption(select, options[prevIndex]);
        }
      }
      
      // 커스텀 select 값 설정
      function setCustomSelectValue(selectId, value) {
        const select = document.querySelector('[data-select-id="' + selectId + '"]');
        if (!select) return false;
        
        const option = select.querySelector('[data-value="' + value + '"]');
        if (option) {
          selectOption(select, option);
          return true;
        }
        return false;
      }
      
      // 커스텀 select 값 가져오기
      function getCustomSelectValue(selectId) {
        const select = document.querySelector('[data-select-id="' + selectId + '"]');
        return select ? select.getAttribute('data-value') : null;
      }
      
      // 기존 setValue 함수 수정 (커스텀 select 지원)
      function setValue(id, value) {
        // 먼저 커스텀 select 시도
        if (setCustomSelectValue(id, value)) {
          return;
        }
        
        // 기존 input/select 요소 처리
        const element = document.getElementById(id);
        if (element && value !== undefined && value !== null) {
          element.value = value;
          if (element.textContent !== undefined) {
            element.textContent = value;
          }
        }
      }
      
      // 기존 getValue 함수 수정 (커스텀 select 지원)
      function getValue(id) {
        // 먼저 커스텀 select 시도
        const customValue = getCustomSelectValue(id);
        if (customValue !== null) {
          return customValue;
        }
        
        // 기존 input/select 요소 처리
        const element = document.getElementById(id);
        return element ? element.value : null;
      }

      // 이벤트 리스너 설정
      function setupEventListeners() {
        console.log('🔗 이벤트 리스너 설정 중...');
        
        // 버튼 이벤트 리스너
        const generateApiKeyBtn = document.getElementById('generateApiKeyBtn');
        const saveSettingsBtn = document.getElementById('saveSettingsBtn');
        const resetSettingsBtn = document.getElementById('resetSettingsBtn');
        const openVSCodeSettingsBtn = document.getElementById('openVSCodeSettingsBtn');
        
        if (generateApiKeyBtn) {
          generateApiKeyBtn.addEventListener('click', generateApiKey);
          console.log('✅ API 키 발급 버튼 이벤트 연결');
        }
        
        if (saveSettingsBtn) {
          saveSettingsBtn.addEventListener('click', saveSettings);
          console.log('✅ 설정 저장 버튼 이벤트 연결');
        }
        
        if (resetSettingsBtn) {
          resetSettingsBtn.addEventListener('click', resetSettings);
          console.log('✅ 설정 초기화 버튼 이벤트 연결');
        }
        
        if (openVSCodeSettingsBtn) {
          openVSCodeSettingsBtn.addEventListener('click', openVSCodeSettings);
          console.log('✅ VSCode 설정 열기 버튼 이벤트 연결');
        }
        
        // 체크박스 이벤트 리스너
        document.addEventListener('change', function(e) {
          if (e.target.type === 'checkbox') {
            handleCheckboxChange(e.target);
          }
        });
        
        console.log('✅ 모든 이벤트 리스너 설정 완료');
      }
      
      // 중복 호출 방지 - initialize()에서만 setupEventListeners 호출
      // document.addEventListener('DOMContentLoaded', setupEventListeners);
      
      console.log('🚀 설정 페이지 JavaScript 로드 완료');
      
    })();
    
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
      const tabContent = document.getElementById(tabName + 'Tab');
      if (tabContent) {
        tabContent.classList.add('active');
      }
      
      // 선택된 탭 버튼에 active 클래스 추가
      if (event && event.target) {
        event.target.classList.add('active');
      }
    }
    



    
    `;
        return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src vscode-resource: https: data:;">
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
      cursor: pointer;
      user-select: none;
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
    
    /* 로딩 및 메시지 스타일 */
    .loading {
      text-align: center;
      padding: 40px;
      color: var(--vscode-descriptionForeground);
      font-size: 16px;
      background-color: var(--vscode-input-background);
      border-radius: 8px;
      margin: 20px 0;
      animation: pulse 1.5s ease-in-out infinite;
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }
    
    .message {
      padding: 12px 16px;
      border-radius: 4px;
      margin: 12px 0;
      font-size: 14px;
      display: none;
    }
    
    .message.success {
      background-color: var(--vscode-terminal-ansiGreen);
      color: white;
      border-left: 4px solid var(--vscode-terminal-ansiBrightGreen);
    }
    
    .message.error {
      background-color: var(--vscode-errorBackground);
      color: var(--vscode-errorForeground);
      border-left: 4px solid var(--vscode-errorForeground);
    }
    
    .message.show {
      display: block;
      animation: slideDown 0.3s ease-out;
    }
    
    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    /* 커스텀 드롭다운 스타일 */
    .custom-select {
      position: relative;
      width: 100%;
    }
    
    .select-button {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid var(--vscode-input-border);
      border-radius: 4px;
      background-color: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      font-size: 14px;
      font-family: var(--vscode-font-family);
      cursor: pointer;
      user-select: none;
      display: flex;
      justify-content: space-between;
      align-items: center;
      text-align: left;
      transition: all 0.2s ease;
    }
    
    .select-button:hover {
      border-color: var(--vscode-focusBorder);
      background-color: var(--vscode-list-hoverBackground);
    }
    
    .select-button:focus {
      outline: none;
      border-color: var(--vscode-focusBorder);
      box-shadow: 0 0 0 1px var(--vscode-focusBorder);
    }
    
    .select-button.open {
      border-color: var(--vscode-focusBorder);
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
    }
    
    .select-arrow {
      font-size: 12px;
      transition: transform 0.2s ease;
      color: var(--vscode-foreground);
    }
    
    .select-button.open .select-arrow {
      transform: rotate(180deg);
    }
    
    .select-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background-color: var(--vscode-input-background);
      border: 1px solid var(--vscode-focusBorder);
      border-top: none;
      border-radius: 0 0 4px 4px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      max-height: 200px;
      overflow-y: auto;
      z-index: 1000;
      display: none;
    }
    
    .select-dropdown.open {
      display: block;
    }
    
    .select-option {
      padding: 10px 12px;
      cursor: pointer;
      border-bottom: 1px solid var(--vscode-panel-border);
      background-color: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      transition: background-color 0.1s ease;
    }
    
    .select-option:last-child {
      border-bottom: none;
      border-radius: 0 0 4px 4px;
    }
    
    .select-option:hover {
      background-color: var(--vscode-list-hoverBackground);
    }
    
    .select-option.selected {
      background-color: var(--vscode-list-activeSelectionBackground);
      color: var(--vscode-list-activeSelectionForeground);
    }
    
    .select-option-main {
      font-weight: 500;
      margin-bottom: 2px;
    }
    
    .select-option-desc {
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
      line-height: 1.3;
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
              <div class="custom-select" data-select-id="pythonSkillLevel">
                <div class="select-button" tabindex="0">
                  <span class="select-text">중급자 - 일반적인 프로그래밍 가능</span>
                  <span class="select-arrow">▼</span>
                </div>
                <div class="select-dropdown">
                  <div class="select-option" data-value="beginner">
                    <div class="select-option-main">초급자</div>
                    <div class="select-option-desc">Python 기초 학습 중</div>
                  </div>
                  <div class="select-option selected" data-value="intermediate">
                    <div class="select-option-main">중급자</div>
                    <div class="select-option-desc">일반적인 프로그래밍 가능</div>
                  </div>
                  <div class="select-option" data-value="advanced">
                    <div class="select-option-main">고급자</div>
                    <div class="select-option-desc">복잡한 프로젝트 개발 가능</div>
                  </div>
                  <div class="select-option" data-value="expert">
                    <div class="select-option-main">전문가</div>
                    <div class="select-option-desc">최적화 및 아키텍처 설계 가능</div>
                  </div>
                </div>
              </div>
            <p class="form-help">당신의 경험 수준에 맞는 코드와 설명을 제공합니다.</p>
            </div>
            
            <div class="form-group">
              <label class="form-label">코드 출력 구조</label>
              <div class="custom-select" data-select-id="codeOutputStructure">
                <div class="select-button" tabindex="0">
                  <span class="select-text">표준 - 일반적인 구조 + 기본 주석</span>
                  <span class="select-arrow">▼</span>
                </div>
                <div class="select-dropdown">
                  <div class="select-option" data-value="minimal">
                    <div class="select-option-main">최소한</div>
                    <div class="select-option-desc">핵심 로직만 간결하게</div>
                  </div>
                  <div class="select-option selected" data-value="standard">
                    <div class="select-option-main">표준</div>
                    <div class="select-option-desc">일반적인 구조 + 기본 주석</div>
                  </div>
                  <div class="select-option" data-value="detailed">
                    <div class="select-option-main">상세</div>
                    <div class="select-option-desc">자세한 주석 + 예외 처리</div>
                  </div>
                  <div class="select-option" data-value="comprehensive">
                    <div class="select-option-main">포괄적</div>
                    <div class="select-option-desc">문서화 + 테스트 코드</div>
                  </div>
                </div>
              </div>
            <p class="form-help">AI가 생성하는 코드의 상세도를 설정합니다.</p>
            </div>
            
            <div class="form-group">
              <label class="form-label">설명 스타일</label>
              <div class="custom-select" data-select-id="explanationStyle">
                <div class="select-button" tabindex="0">
                  <span class="select-text">표준 설명 - 코드 + 간단한 설명</span>
                  <span class="select-arrow">▼</span>
                </div>
                <div class="select-dropdown">
                  <div class="select-option" data-value="brief">
                    <div class="select-option-main">간단한 설명</div>
                    <div class="select-option-desc">핵심 내용만 빠르게</div>
                  </div>
                  <div class="select-option selected" data-value="standard">
                    <div class="select-option-main">표준 설명</div>
                    <div class="select-option-desc">코드 + 간단한 설명</div>
                  </div>
                  <div class="select-option" data-value="detailed">
                    <div class="select-option-main">상세 설명</div>
                    <div class="select-option-desc">개념 + 이유 + 활용법</div>
                  </div>
                  <div class="select-option" data-value="educational">
                    <div class="select-option-main">교육적 설명</div>
                    <div class="select-option-desc">단계별 + 예시 + 관련 개념</div>
                  </div>
                </div>
              </div>
            <p class="form-help">AI 설명의 상세도와 스타일을 선택합니다.</p>
            </div>
            
            <div class="form-group">
            <label class="form-label">주요 프로젝트 컨텍스트</label>
              <div class="custom-select" data-select-id="projectContext">
                <div class="select-button" tabindex="0">
                  <span class="select-text">웹 개발 - Django, Flask, FastAPI</span>
                  <span class="select-arrow">▼</span>
                </div>
                <div class="select-dropdown">
                  <div class="select-option selected" data-value="web_development">
                    <div class="select-option-main">웹 개발</div>
                    <div class="select-option-desc">Django, Flask, FastAPI</div>
                  </div>
                  <div class="select-option" data-value="data_science">
                    <div class="select-option-main">데이터 사이언스</div>
                    <div class="select-option-desc">NumPy, Pandas, ML</div>
                  </div>
                  <div class="select-option" data-value="automation">
                    <div class="select-option-main">자동화</div>
                    <div class="select-option-desc">스크립팅, 업무 자동화</div>
                  </div>
                  <div class="select-option" data-value="general_purpose">
                    <div class="select-option-main">범용 개발</div>
                    <div class="select-option-desc">다양한 목적</div>
                  </div>
                </div>
              </div>
            <p class="form-help">주요 개발 분야에 맞는 라이브러리와 패턴을 제안합니다.</p>
          </div>
          
          <div class="form-group">
            <label class="form-label">오류 처리 선호도</label>
              <div class="custom-select" data-select-id="errorHandlingPreference">
                <div class="select-button" tabindex="0">
                  <span class="select-text">기본 - 필요한 경우만</span>
                  <span class="select-arrow">▼</span>
                </div>
                <div class="select-dropdown">
                  <div class="select-option selected" data-value="basic">
                    <div class="select-option-main">기본</div>
                    <div class="select-option-desc">필요한 경우만</div>
                  </div>
                  <div class="select-option" data-value="comprehensive">
                    <div class="select-option-main">포괄적</div>
                    <div class="select-option-desc">상세한 예외 처리</div>
                  </div>
                  <div class="select-option" data-value="minimal">
                    <div class="select-option-main">최소한</div>
                    <div class="select-option-desc">단순한 처리</div>
                  </div>
                </div>
              </div>
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
              <button type="button" class="btn btn-secondary api-key-btn" id="generateApiKeyBtn">
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
              <div class="custom-select" data-select-id="commentTriggerResultDisplayMode">
                <div class="select-button" tabindex="0">
                  <span class="select-text">사이드바 표시 - 사이드바에서 검토 후 삽입</span>
                  <span class="select-arrow">▼</span>
                </div>
                <div class="select-dropdown">
                  <div class="select-option" data-value="immediate_insert">
                    <div class="select-option-main">즉시 삽입</div>
                    <div class="select-option-desc">생성된 코드를 바로 삽입</div>
                  </div>
                  <div class="select-option selected" data-value="sidebar">
                    <div class="select-option-main">사이드바 표시</div>
                    <div class="select-option-desc">사이드바에서 검토 후 삽입</div>
                  </div>
                  <div class="select-option" data-value="confirm_insert">
                    <div class="select-option-main">확인 후 삽입</div>
                    <div class="select-option-desc">미리보고 확인 대화상자</div>
                  </div>
                  <div class="select-option" data-value="inline_preview">
                    <div class="select-option-main">인라인 미리보기</div>
                    <div class="select-option-desc">에디터에서 미리보고 선택</div>
                  </div>
                </div>
              </div>
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
          <button type="button" class="btn btn-danger" id="resetSettingsBtn">
            🔄 설정 초기화
          </button>
          <button type="button" class="btn btn-secondary" id="openVSCodeSettingsBtn">
            ⚙️ VSCode 설정 열기
          </button>
          <button type="button" class="btn btn-primary" id="saveSettingsBtn">
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
exports.SettingsProvider = SettingsProvider;
//# sourceMappingURL=SettingsProvider.js.map