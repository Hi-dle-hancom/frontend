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
            case "saveSettings":
                this.saveSettings(message.settings);
                break;
            case "resetSettings":
                this.resetSettings();
                break;
            case "loadSettings":
                this.loadAndSendSettings();
                break;
            case "openVSCodeSettings":
                this.openVSCodeSettings();
                break;
        }
    }
    /**
     * 설정 저장
     */
    async saveSettings(settings) {
        try {
            const config = vscode.workspace.getConfiguration("hapa");
            // 사용자 프로필 설정 저장
            if (settings.userProfile) {
                for (const [key, value] of Object.entries(settings.userProfile)) {
                    await config.update(`userProfile.${key}`, value, vscode.ConfigurationTarget.Global);
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
                    await config.update(`commentTrigger.${key}`, value, vscode.ConfigurationTarget.Global);
                }
            }
            // 기능 설정 저장
            if (settings.features) {
                for (const [key, value] of Object.entries(settings.features)) {
                    await config.update(key, value, vscode.ConfigurationTarget.Global);
                }
            }
            vscode.window.showInformationMessage("✅ 설정이 성공적으로 저장되었습니다!");
            // 웹뷰에 저장 완료 신호 전송
            if (this._view) {
                this._view.webview.postMessage({
                    command: "settingsSaved",
                    success: true,
                });
            }
        }
        catch (error) {
            const errorMessage = `설정 저장 중 오류가 발생했습니다: ${error.message}`;
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
        const config = vscode.workspace.getConfiguration("hapa");
        const currentSettings = {
            userProfile: {
                email: config.get("userProfile.email"),
                username: config.get("userProfile.username"),
                pythonSkillLevel: config.get("userProfile.pythonSkillLevel"),
                codeOutputStructure: config.get("userProfile.codeOutputStructure"),
                explanationStyle: config.get("userProfile.explanationStyle"),
                projectContext: config.get("userProfile.projectContext"),
                errorHandlingPreference: config.get("userProfile.errorHandlingPreference"),
                preferredLanguageFeatures: config.get("userProfile.preferredLanguageFeatures"),
            },
            api: {
                apiBaseURL: config.get("apiBaseURL"),
                apiKey: config.get("apiKey"),
                apiTimeout: config.get("apiTimeout"),
            },
            commentTrigger: {
                resultDisplayMode: config.get("commentTrigger.resultDisplayMode"),
                autoInsertDelay: config.get("commentTrigger.autoInsertDelay"),
                showNotification: config.get("commentTrigger.showNotification"),
            },
            features: {
                autoComplete: config.get("autoComplete"),
                maxSuggestions: config.get("maxSuggestions"),
                enableLogging: config.get("enableLogging"),
                enableCodeAnalysis: config.get("enableCodeAnalysis"),
            },
        };
        if (this._view) {
            this._view.webview.postMessage({
                command: "settingsLoaded",
                settings: currentSettings,
            });
        }
    }
    /**
     * VSCode 설정 페이지 열기
     */
    openVSCodeSettings() {
        vscode.commands.executeCommand("workbench.action.openSettings", "hapa");
    }
    /**
     * 설정 HTML 생성 (탭 기반 UI로 변경)
     */
    generateSettingsHtml() {
        return `
<!DOCTYPE html>
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
    
    .settings-container {
      max-width: 1000px;
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
    
    /* 탭 네비게이션 스타일 */
    .tab-navigation {
      background-color: var(--vscode-tab-activeBackground);
      border-bottom: 1px solid var(--vscode-panel-border);
      display: flex;
      gap: 0;
    }
    
    .tab-button {
      padding: 16px 24px;
      background-color: var(--vscode-tab-inactiveBackground);
      color: var(--vscode-tab-inactiveForeground);
      border: none;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s ease;
      border-bottom: 3px solid transparent;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .tab-button:hover {
      background-color: var(--vscode-tab-hoverBackground);
      color: var(--vscode-tab-hoverForeground);
    }
    
    .tab-button.active {
      background-color: var(--vscode-tab-activeBackground);
      color: var(--vscode-tab-activeForeground);
      border-bottom-color: #007ACC;
    }
    
    .tab-content {
      background-color: var(--vscode-editor-background);
      border: 1px solid var(--vscode-panel-border);
      border-top: none;
      border-radius: 0 0 8px 8px;
      padding: 32px;
      min-height: 500px;
    }
    
    .tab-panel {
      display: none;
    }
    
    .tab-panel.active {
      display: block;
    }
    
    .setting-section {
      margin-bottom: 40px;
      padding-bottom: 32px;
      border-bottom: 1px solid var(--vscode-panel-border);
    }
    
    .setting-section:last-child {
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
    
    .section-description {
      color: var(--vscode-descriptionForeground);
      margin-bottom: 24px;
      font-size: 14px;
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
    
    .form-description {
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
      margin-bottom: 8px;
    }
    
    .form-control {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid var(--vscode-input-border);
      background-color: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border-radius: 4px;
      font-size: 14px;
    }
    
    .form-control:focus {
      outline: none;
      border-color: var(--vscode-focusBorder);
    }
    
    .form-control:read-only {
      background-color: var(--vscode-input-background);
      opacity: 0.7;
    }
    
    .form-select {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid var(--vscode-input-border);
      background-color: var(--vscode-dropdown-background);
      color: var(--vscode-dropdown-foreground);
      border-radius: 4px;
      font-size: 14px;
    }
    
    .checkbox-group {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 8px;
    }
    
    .checkbox-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background-color: var(--vscode-input-background);
      border: 1px solid var(--vscode-input-border);
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .checkbox-item:hover {
      background-color: var(--vscode-list-hoverBackground);
    }
    
    .checkbox-item.checked {
      background-color: rgba(0, 122, 204, 0.1);
      border-color: #007ACC;
    }
    
    .checkbox-item input[type="checkbox"] {
      margin: 0;
    }
    
    /* 사용자 정보 카드 스타일 */
    .user-info-card {
      background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
      color: white;
      padding: 24px;
      border-radius: 8px;
      margin-bottom: 24px;
    }
    
    .user-info-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
    }
    
    .user-avatar {
      width: 60px;
      height: 60px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
    }
    
    .user-details h3 {
      font-size: 20px;
      margin-bottom: 4px;
    }
    
    .user-details p {
      opacity: 0.9;
      font-size: 14px;
    }
    
    .completion-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }
    
    .stat-item {
      background: rgba(255, 255, 255, 0.1);
      padding: 16px;
      border-radius: 6px;
    }
    
    .stat-label {
      font-size: 12px;
      opacity: 0.8;
      margin-bottom: 4px;
    }
    
    .stat-value {
      font-size: 18px;
      font-weight: 600;
    }
    
    /* 진행률 바 */
    .progress-bar {
      width: 100%;
      height: 8px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 4px;
      overflow: hidden;
      margin-top: 8px;
    }
    
    .progress-fill {
      height: 100%;
      background: rgba(255, 255, 255, 0.8);
      border-radius: 4px;
      transition: width 0.3s ease;
    }
    
    /* 설정 아이템 스타일 */
    .setting-item {
      background-color: var(--vscode-input-background);
      border: 1px solid var(--vscode-input-border);
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 16px;
    }
    
    .setting-item-header {
      display: flex;
      justify-content: between;
      align-items: center;
      margin-bottom: 12px;
    }
    
    .setting-item-title {
      font-weight: 600;
      font-size: 16px;
    }
    
    .setting-item-value {
      font-size: 14px;
      color: var(--vscode-descriptionForeground);
      background: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: 500;
    }
    
    .actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid var(--vscode-panel-border);
    }
    
    .button-group {
      display: flex;
      gap: 12px;
    }
    
    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
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
      opacity: 0.9;
      transform: translateY(-1px);
    }
    
    .info-link {
      color: var(--vscode-textLink-foreground);
      text-decoration: none;
      font-size: 14px;
    }
    
    .info-link:hover {
      text-decoration: underline;
    }
    
    .loading {
      text-align: center;
      padding: 40px;
      color: var(--vscode-descriptionForeground);
    }
    
    .success-message {
      background-color: rgba(76, 175, 80, 0.1);
      border: 1px solid #4CAF50;
      color: #4CAF50;
      padding: 12px;
      border-radius: 4px;
      margin-bottom: 16px;
      display: none;
    }
    
    .error-message {
      background-color: var(--vscode-inputValidation-errorBackground);
      border: 1px solid var(--vscode-inputValidation-errorBorder);
      color: var(--vscode-errorForeground);
      padding: 12px;
      border-radius: 4px;
      margin-bottom: 16px;
      display: none;
    }
  </style>
</head>
<body>
  <div class="settings-container">
    <div class="header">
      <h1>⚙️ HAPA 설정</h1>
      <p>맞춤형 AI 어시스턴트를 위한 개인화 설정</p>
    </div>
    
    <!-- 탭 네비게이션 -->
    <div class="tab-navigation">
      <button class="tab-button active" onclick="switchTab('user-info', this)">
        👤 사용자 정보
      </button>
      <button class="tab-button" onclick="switchTab('onboarding', this)">
        🚀 온보딩 설정
      </button>
      <button class="tab-button" onclick="switchTab('api', this)">
        🔌 API 설정
      </button>
      <button class="tab-button" onclick="switchTab('features', this)">
        ⚡ 기능 설정
      </button>
    </div>
    
    <div class="tab-content">
      <div class="success-message" id="successMessage"></div>
      <div class="error-message" id="errorMessage"></div>
      
      <div class="loading" id="loadingIndicator">
        설정을 불러오는 중...
      </div>
      
      <div id="settingsForm" style="display: none;">
        
        <!-- 사용자 정보 탭 -->
        <div id="user-info-tab" class="tab-panel active">
          <div class="user-info-card">
            <div class="user-info-header">
              <div class="user-avatar">👤</div>
              <div class="user-details">
                <h3 id="userDisplayName">CompleteUser</h3>
                <p id="userDisplayEmail">complete.test@email.com</p>
              </div>
            </div>
            
            <div class="completion-stats">
              <div class="stat-item">
                <div class="stat-label">온보딩 완성도</div>
                <div class="stat-value" id="completionPercentage">85.7%</div>
                <div class="progress-bar">
                  <div class="progress-fill" style="width: 85.7%"></div>
                </div>
              </div>
              <div class="stat-item">
                <div class="stat-label">완료된 설정</div>
                <div class="stat-value" id="completedSettings">6/7 카테고리</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">가입일</div>
                <div class="stat-value" id="joinDate">2025-06-25</div>
              </div>
            </div>
          </div>
          
          <!-- 현재 적용된 설정 요약 -->
          <div class="setting-section">
            <h2 class="section-title">🎯 현재 적용된 설정</h2>
            <p class="section-description">complete.test@email.com 사용자의 개인화 설정 현황입니다.</p>
            
            <div class="setting-item">
              <div class="setting-item-header">
                <span class="setting-item-title">코드 출력 구조</span>
                <span class="setting-item-value" id="currentCodeOutput">minimal</span>
              </div>
              <p class="form-description">간결한 코드 - 핵심 로직만 간결하게 생성</p>
            </div>
            
            <div class="setting-item">
              <div class="setting-item-header">
                <span class="setting-item-title">설명 스타일</span>
                <span class="setting-item-value" id="currentExplanation">brief</span>
              </div>
              <p class="form-description">간단한 설명 - 핵심 내용만 제공</p>
            </div>
            
            <div class="setting-item">
              <div class="setting-item-header">
                <span class="setting-item-title">프로젝트 컨텍스트</span>
                <span class="setting-item-value" id="currentProject">web_development</span>
              </div>
              <p class="form-description">웹 개발 환경에 최적화된 코드 제공</p>
            </div>
            
            <div class="setting-item">
              <div class="setting-item-header">
                <span class="setting-item-title">주석 트리거 모드</span>
                <span class="setting-item-value" id="currentCommentTrigger">immediate_insert</span>
              </div>
              <p class="form-description">즉시 삽입 - 코드를 커서 위치에 바로 삽입</p>
            </div>
            
            <div class="setting-item">
              <div class="setting-item-header">
                <span class="setting-item-title">선호 언어 기능</span>
                <span class="setting-item-value" id="currentLanguageFeature">type_hints</span>
              </div>
              <p class="form-description">타입 힌트를 적극 활용한 안전한 코딩</p>
            </div>
            
            <div class="setting-item">
              <div class="setting-item-header">
                <span class="setting-item-title">오류 처리 방식</span>
                <span class="setting-item-value" id="currentErrorHandling">basic</span>
              </div>
              <p class="form-description">기본적인 try-catch 패턴 사용</p>
            </div>
          </div>
          
          <!-- 사용자 정보 수정 -->
          <div class="setting-section">
            <h2 class="section-title">✏️ 사용자 정보 수정</h2>
            <p class="section-description">필요시 사용자 정보를 수정할 수 있습니다.</p>
            
            <div class="form-group">
              <label class="form-label">이메일 주소</label>
              <p class="form-description">HAPA 계정과 설정 동기화에 사용되는 이메일입니다</p>
              <input type="email" class="form-control" id="email" placeholder="example@example.com">
            </div>
            
            <div class="form-group">
              <label class="form-label">사용자명</label>
              <p class="form-description">HAPA에서 표시될 사용자명입니다</p>
              <input type="text" class="form-control" id="username" placeholder="홍길동">
            </div>
          </div>
        </div>
        
        <!-- 온보딩 설정 탭 -->
        <div id="onboarding-tab" class="tab-panel">
          <div class="setting-section">
            <h2 class="section-title">🚀 온보딩 및 개인화 설정</h2>
            <p class="section-description">AI가 당신에게 맞는 코드와 설명을 제공하도록 설정합니다.</p>
            
            <div class="form-group">
              <label class="form-label">Python 스킬 수준</label>
              <p class="form-description">당신의 Python 경험 수준을 선택하세요</p>
              <select class="form-select" id="pythonSkillLevel">
                <option value="beginner">🌱 초급자 - 기본 문법 학습 중</option>
                <option value="intermediate">🔧 중급자 - 일반적인 프로그래밍 가능</option>
                <option value="advanced">⚡ 고급자 - 복잡한 프로젝트 개발 가능</option>
                <option value="expert">🚀 전문가 - 최적화 및 아키텍처 설계</option>
              </select>
            </div>
            
            <div class="form-group">
              <label class="form-label">코드 출력 구조</label>
              <p class="form-description">AI가 생성하는 코드의 상세도를 설정합니다</p>
              <select class="form-select" id="codeOutputStructure">
                <option value="minimal">✨ 최소한 - 핵심 로직만 간결하게</option>
                <option value="standard">📝 표준 - 일반적인 코드 + 기본 주석</option>
                <option value="detailed">🔍 상세 - 자세한 주석 + 예외 처리</option>
                <option value="comprehensive">📚 포괄적 - 문서화 + 테스트 + 최적화</option>
              </select>
            </div>
            
            <div class="form-group">
              <label class="form-label">설명 스타일</label>
              <p class="form-description">AI 설명의 상세도와 스타일을 선택합니다</p>
              <select class="form-select" id="explanationStyle">
                <option value="brief">⚡ 간단한 설명 - 핵심 내용만</option>
                <option value="standard">📖 표준 설명 - 코드 + 간단한 설명</option>
                <option value="detailed">🔍 상세 설명 - 개념 + 이유 + 활용법</option>
                <option value="educational">🎓 교육적 설명 - 단계별 + 예시 + 관련 개념</option>
              </select>
            </div>
            
            <div class="form-group">
              <label class="form-label">주요 개발 분야</label>
              <p class="form-description">당신의 주요 Python 개발 분야를 선택하세요</p>
              <select class="form-select" id="projectContext">
                <option value="web_development">🌐 웹 개발 - Django, Flask, FastAPI</option>
                <option value="data_science">📊 데이터 사이언스 - NumPy, Pandas, ML</option>
                <option value="automation">🤖 자동화 - 스크립팅, 업무 자동화</option>
                <option value="general_purpose">🔧 범용 개발 - 다양한 목적</option>
                <option value="academic">🎓 학술/연구 - 알고리즘, 연구 프로젝트</option>
                <option value="enterprise">🏢 기업용 개발 - 대규모, 안정성 중시</option>
              </select>
            </div>
            
            <div class="form-group">
              <label class="form-label">선호하는 Python 기능</label>
              <p class="form-description">AI가 우선적으로 사용할 Python 기능들을 선택하세요 (복수 선택 가능)</p>
              <div class="checkbox-group" id="languageFeatures">
                <div class="checkbox-item" data-value="type_hints">
                  <input type="checkbox" id="type_hints">
                  <label for="type_hints">타입 힌트</label>
                </div>
                <div class="checkbox-item" data-value="dataclasses">
                  <input type="checkbox" id="dataclasses">
                  <label for="dataclasses">데이터클래스</label>
                </div>
                <div class="checkbox-item" data-value="async_await">
                  <input type="checkbox" id="async_await">
                  <label for="async_await">비동기 프로그래밍</label>
                </div>
                <div class="checkbox-item" data-value="comprehensions">
                  <input type="checkbox" id="comprehensions">
                  <label for="comprehensions">컴프리헨션</label>
                </div>
                <div class="checkbox-item" data-value="generators">
                  <input type="checkbox" id="generators">
                  <label for="generators">제너레이터</label>
                </div>
                <div class="checkbox-item" data-value="decorators">
                  <input type="checkbox" id="decorators">
                  <label for="decorators">데코레이터</label>
                </div>
                <div class="checkbox-item" data-value="context_managers">
                  <input type="checkbox" id="context_managers">
                  <label for="context_managers">컨텍스트 매니저</label>
                </div>
                <div class="checkbox-item" data-value="f_strings">
                  <input type="checkbox" id="f_strings">
                  <label for="f_strings">f-strings</label>
                </div>
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label">오류 처리 선호도</label>
              <p class="form-description">생성되는 코드의 오류 처리 수준을 설정합니다</p>
              <select class="form-select" id="errorHandlingPreference">
                <option value="minimal">최소한의 오류 처리</option>
                <option value="basic">기본적인 try-catch</option>
                <option value="comprehensive">포괄적인 예외 처리</option>
                <option value="production_ready">프로덕션 수준 오류 처리</option>
              </select>
            </div>
            
            <!-- 온보딩 재시작 버튼 -->
            <div class="actions">
              <div>
                <button class="btn btn-secondary" onclick="restartOnboarding()">
                  🔄 온보딩 다시 시작
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- API 설정 탭 -->
        <div id="api-tab" class="tab-panel">
          <div class="setting-section">
            <h2 class="section-title">🔌 API 설정</h2>
            <p class="section-description">HAPA 백엔드 서버와의 연결을 설정합니다.</p>
            
            <div class="form-group">
              <label class="form-label">API 서버 주소</label>
              <p class="form-description">HAPA 백엔드 API 서버의 URL을 입력하세요</p>
              <input type="text" class="form-control" id="apiBaseURL" placeholder="http://localhost:8000/api/v1">
            </div>
            
            <div class="form-group">
              <label class="form-label">API 키</label>
              <p class="form-description">HAPA API 접근을 위한 인증 키를 입력하세요</p>
              <input type="password" class="form-control" id="apiKey" placeholder="API 키를 입력하세요">
            </div>
            
            <div class="form-group">
              <label class="form-label">API 타임아웃 (밀리초)</label>
              <p class="form-description">API 요청 타임아웃 시간을 설정합니다</p>
              <input type="number" class="form-control" id="apiTimeout" min="5000" max="60000" step="1000">
            </div>
          </div>
        </div>
        
        <!-- 기능 설정 탭 -->
        <div id="features-tab" class="tab-panel">
          <div class="setting-section">
            <h2 class="section-title">⚡ 주석 트리거 워크플로우</h2>
            <p class="section-description">주석으로 코드를 요청할 때의 결과 표시 방식을 설정합니다.</p>
            
            <div class="form-group">
              <label class="form-label">결과 표시 방식</label>
              <p class="form-description">주석 트리거 시 AI 응답을 어떻게 표시할지 선택하세요</p>
              <select class="form-select" id="commentTriggerResultDisplayMode">
                <option value="immediate_insert">⚡ 즉시 삽입 - 코드를 커서 위치에 바로 삽입</option>
                <option value="sidebar">📋 사이드바 표시 - 사이드바에 결과를 표시하고 검토 후 삽입</option>
                <option value="confirm_insert">✅ 확인 후 삽입 - 코드를 미리보고 확인 대화상자에서 삽입 여부 선택</option>
                <option value="inline_preview">👁️ 인라인 미리보기 - 에디터에서 코드를 미리보고 키보드로 선택</option>
              </select>
            </div>
            
            <div class="form-group">
              <label class="form-label">즉시 삽입 지연 시간 (밀리초)</label>
              <p class="form-description">즉시 삽입 모드에서 코드 삽입 전 대기 시간 (0은 즉시 삽입)</p>
              <input type="number" class="form-control" id="commentTriggerAutoInsertDelay" min="0" max="5000" step="100">
            </div>
            
            <div class="form-group">
              <div class="checkbox-item">
                <input type="checkbox" id="commentTriggerShowNotification">
                <label for="commentTriggerShowNotification">주석 트리거 실행 시 알림 표시</label>
              </div>
            </div>
          </div>
          
          <div class="setting-section">
            <h2 class="section-title">🤖 자동 완성 설정</h2>
            <p class="section-description">AI 기반 자동 완성 기능을 세밀하게 조정합니다.</p>
            
            <div class="form-group">
              <div class="checkbox-item">
                <input type="checkbox" id="autoComplete">
                <label for="autoComplete">자동 완성 기능 활성화</label>
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label">제안 최대 개수</label>
              <p class="form-description">한 번에 표시할 자동 완성 제안의 최대 개수</p>
              <input type="number" class="form-control" id="maxSuggestions" min="1" max="10">
            </div>
            
            <div class="form-group">
              <div class="checkbox-item">
                <input type="checkbox" id="enableCodeAnalysis">
                <label for="enableCodeAnalysis">코드 분석 기능 활성화</label>
              </div>
            </div>
            
            <div class="form-group">
              <div class="checkbox-item">
                <input type="checkbox" id="enableLogging">
                <label for="enableLogging">디버그 로깅 활성화</label>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="actions">
        <div>
          <a href="#" class="info-link" onclick="openVSCodeSettings()">
            VSCode 설정에서 편집하기 →
          </a>
        </div>
        
        <div class="button-group">
          <button class="btn btn-danger" onclick="resetSettings()">기본값으로 초기화</button>
          <button class="btn btn-secondary" onclick="loadSettings()">새로고침</button>
          <button class="btn btn-primary" onclick="saveSettings()">설정 저장</button>
        </div>
      </div>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    let currentSettings = {};
    
    // 페이지 로드 시 설정 불러오기
    window.addEventListener('load', function() {
      console.log('HAPA 설정 페이지 로드됨');
      loadSettings();
      
      // 3초 후 설정이 로드되지 않으면 강제로 폼 표시 (안전장치)
      setTimeout(function() {
        const settingsForm = document.getElementById('settingsForm');
        const loadingIndicator = document.getElementById('loadingIndicator');
        
        if (settingsForm && settingsForm.style.display === 'none') {
          console.log('⚠️ 설정 로드 타임아웃 - 폼을 강제로 표시합니다');
          loadingIndicator.style.display = 'none';
          settingsForm.style.display = 'block';
          
          // 기본 설정으로 폼 채우기
          populateSettings({
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
              apiBaseURL: 'http://localhost:8000/api/v1',
              apiKey: '',
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
          });
        }
      }, 3000);
    });
    
    // DOM이 이미 로드된 경우 즉시 실행
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        console.log('HAPA 설정 페이지 로드됨 (DOMContentLoaded)');
        loadSettings();
      });
    } else {
      console.log('HAPA 설정 페이지 로드됨 (이미 로드됨)');
      loadSettings();
    }
    
    // 탭 전환 함수
    function switchTab(tabName, clickedButton = null) {
      console.log('🔄 탭 전환 시도:', tabName, '버튼:', clickedButton);
      
      // 모든 탭 버튼 비활성화
      const allButtons = document.querySelectorAll('.tab-button');
      console.log('📋 탭 버튼 개수:', allButtons.length);
      allButtons.forEach(btn => btn.classList.remove('active'));
      
      // 모든 탭 패널 숨기기
      const allPanels = document.querySelectorAll('.tab-panel');
      console.log('📋 탭 패널 개수:', allPanels.length);
      allPanels.forEach(panel => {
        panel.classList.remove('active');
        console.log('❌ 패널 숨김:', panel.id);
      });
      
      // 클릭된 버튼 활성화 (전달된 버튼이 있으면 사용, 없으면 찾기)
      if (clickedButton) {
        clickedButton.classList.add('active');
        console.log('✅ 버튼 활성화:', clickedButton.textContent.trim());
      } else {
        // tabName에 해당하는 버튼 찾기
        const buttons = document.querySelectorAll('.tab-button');
        buttons.forEach(btn => {
          if (btn.getAttribute('onclick').includes(tabName)) {
            btn.classList.add('active');
            console.log('✅ 버튼 활성화 (검색):', btn.textContent.trim());
          }
        });
      }
      
      // 선택된 탭 패널 활성화
      const targetPanelId = tabName + '-tab';
      const tabPanel = document.getElementById(targetPanelId);
      console.log('🎯 찾는 패널 ID:', targetPanelId);
      console.log('📦 찾은 패널:', tabPanel);
      
      if (tabPanel) {
        tabPanel.classList.add('active');
        console.log('✅ 패널 활성화:', targetPanelId);
        
        // 패널이 실제로 보이는지 확인
        const computedStyle = window.getComputedStyle(tabPanel);
        console.log('👀 패널 display 속성:', computedStyle.display);
      } else {
        console.error('❌ 탭 패널을 찾을 수 없습니다:', targetPanelId);
        
        // 존재하는 모든 패널 ID 출력
        document.querySelectorAll('.tab-panel').forEach(panel => {
          console.log('📋 존재하는 패널:', panel.id);
        });
      }
    }
    
    function loadSettings() {
      vscode.postMessage({
        command: 'loadSettings'
      });
    }
    
    function saveSettings() {
      const settings = {
        userProfile: {
          email: document.getElementById('email').value,
          username: document.getElementById('username').value,
          pythonSkillLevel: document.getElementById('pythonSkillLevel').value,
          codeOutputStructure: document.getElementById('codeOutputStructure').value,
          explanationStyle: document.getElementById('explanationStyle').value,
          projectContext: document.getElementById('projectContext').value,
          errorHandlingPreference: document.getElementById('errorHandlingPreference').value,
          preferredLanguageFeatures: getSelectedLanguageFeatures()
        },
        api: {
          apiBaseURL: document.getElementById('apiBaseURL').value,
          apiKey: document.getElementById('apiKey').value,
          apiTimeout: parseInt(document.getElementById('apiTimeout').value)
        },
        commentTrigger: {
          resultDisplayMode: document.getElementById('commentTriggerResultDisplayMode').value,
          autoInsertDelay: parseInt(document.getElementById('commentTriggerAutoInsertDelay').value),
          showNotification: document.getElementById('commentTriggerShowNotification').checked
        },
        features: {
          autoComplete: document.getElementById('autoComplete').checked,
          maxSuggestions: parseInt(document.getElementById('maxSuggestions').value),
          enableLogging: document.getElementById('enableLogging').checked,
          enableCodeAnalysis: document.getElementById('enableCodeAnalysis').checked
        }
      };
      
      vscode.postMessage({
        command: 'saveSettings',
        settings: settings
      });
    }
    
    function resetSettings() {
      if (confirm('모든 설정을 기본값으로 초기화하시겠습니까?')) {
        vscode.postMessage({
          command: 'resetSettings'
        });
      }
    }
    
    function restartOnboarding() {
      if (confirm('온보딩을 다시 시작하시겠습니까? 현재 설정이 초기화됩니다.')) {
        vscode.postMessage({
          command: 'restartOnboarding'
        });
      }
    }
    
    function openVSCodeSettings() {
      vscode.postMessage({
        command: 'openVSCodeSettings'
      });
    }
    
    function getSelectedLanguageFeatures() {
      const features = [];
      document.querySelectorAll('#languageFeatures input[type="checkbox"]:checked').forEach(checkbox => {
        features.push(checkbox.closest('.checkbox-item').dataset.value);
      });
      return features;
    }
    
    function setSelectedLanguageFeatures(features) {
      if (!features) return;
      document.querySelectorAll('#languageFeatures input[type="checkbox"]').forEach(checkbox => {
        const value = checkbox.closest('.checkbox-item').dataset.value;
        checkbox.checked = features.includes(value);
        checkbox.closest('.checkbox-item').classList.toggle('checked', checkbox.checked);
      });
    }
    
    // 체크박스 상태 변경 이벤트
    document.addEventListener('change', function(e) {
      if (e.target.type === 'checkbox') {
        e.target.closest('.checkbox-item').classList.toggle('checked', e.target.checked);
      }
    });
    
    // VSCode에서 메시지 수신
    window.addEventListener('message', event => {
      const message = event.data;
      
      switch (message.command) {
        case 'settingsLoaded':
          currentSettings = message.settings;
          populateSettings(currentSettings);
          document.getElementById('loadingIndicator').style.display = 'none';
          document.getElementById('settingsForm').style.display = 'block';
          break;
          
        case 'settingsSaved':
          if (message.success) {
            showMessage('설정이 성공적으로 저장되었습니다!', 'success');
          } else {
            showMessage('설정 저장 중 오류가 발생했습니다: ' + message.error, 'error');
          }
          break;
          
        case 'settingsReset':
          showMessage('설정이 기본값으로 초기화되었습니다.', 'success');
          loadSettings();
          break;
      }
    });
    
    function populateSettings(settings) {
      // 사용자 프로필 설정
      if (settings.userProfile) {
        document.getElementById('email').value = settings.userProfile.email || '';
        document.getElementById('username').value = settings.userProfile.username || '';
        
        // 사용자 정보 카드 업데이트
        document.getElementById('userDisplayName').textContent = settings.userProfile.username || 'CompleteUser';
        document.getElementById('userDisplayEmail').textContent = settings.userProfile.email || 'complete.test@email.com';
        
        // 현재 설정 값 표시
        document.getElementById('currentCodeOutput').textContent = settings.userProfile.codeOutputStructure || 'minimal';
        document.getElementById('currentExplanation').textContent = settings.userProfile.explanationStyle || 'brief';
        document.getElementById('currentProject').textContent = settings.userProfile.projectContext || 'web_development';
        document.getElementById('currentLanguageFeature').textContent = 
          (settings.userProfile.preferredLanguageFeatures && settings.userProfile.preferredLanguageFeatures[0]) || 'type_hints';
        
        document.getElementById('pythonSkillLevel').value = settings.userProfile.pythonSkillLevel || 'intermediate';
        document.getElementById('codeOutputStructure').value = settings.userProfile.codeOutputStructure || 'minimal';
        document.getElementById('explanationStyle').value = settings.userProfile.explanationStyle || 'brief';
        document.getElementById('projectContext').value = settings.userProfile.projectContext || 'web_development';
        document.getElementById('errorHandlingPreference').value = settings.userProfile.errorHandlingPreference || 'basic';
        setSelectedLanguageFeatures(settings.userProfile.preferredLanguageFeatures);
      }
      
      // API 설정
      if (settings.api) {
        document.getElementById('apiBaseURL').value = settings.api.apiBaseURL || 'http://localhost:8000/api/v1';
        document.getElementById('apiKey').value = settings.api.apiKey || '';
        document.getElementById('apiTimeout').value = settings.api.apiTimeout || 30000;
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
    
    function showMessage(text, type) {
      const successMsg = document.getElementById('successMessage');
      const errorMsg = document.getElementById('errorMessage');
      
      if (type === 'success') {
        successMsg.textContent = text;
        successMsg.style.display = 'block';
        errorMsg.style.display = 'none';
      } else {
        errorMsg.textContent = text;
        errorMsg.style.display = 'block';
        successMsg.style.display = 'none';
      }
      
      setTimeout(() => {
        successMsg.style.display = 'none';
        errorMsg.style.display = 'none';
      }, 5000);
    }
  </script>
</body>
</html>`;
    }
}
exports.SettingsProvider = SettingsProvider;
//# sourceMappingURL=SettingsProvider.js.map