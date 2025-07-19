/**
 * 사이드바 CSS 스타일 생성 클래스
 */
export class SidebarStyles {
  static generateCSS(): string {
    return `
/* HAPA Extension - VS Code 테마 색상 시스템 (인라인) */
:root {
  /* VS Code 기본 색상 */
  --hapa-focus-border: var(--vscode-focusBorder, #007ACC);
  --hapa-selection-background: var(--vscode-selection-background, rgba(0, 122, 204, 0.3));
  --hapa-foreground: var(--vscode-foreground, #cccccc);
  --hapa-description-foreground: var(--vscode-descriptionForeground, #999999);
  --hapa-disabled-foreground: var(--vscode-disabledForeground, #888888);
  
  /* 오류 및 상태 */
  --hapa-error-foreground: var(--vscode-errorForeground, #F44336);
  --hapa-error-background: var(--vscode-errorBackground, rgba(244, 67, 54, 0.1));
  --hapa-warning-foreground: var(--vscode-warningForeground, #FF9800);
  --hapa-warning-background: var(--vscode-warningBackground, rgba(255, 152, 0, 0.1));
  --hapa-info-foreground: var(--vscode-infoForeground, #2196F3);
  --hapa-info-background: var(--vscode-infoBackground, rgba(33, 150, 243, 0.1));
  
  /* 에디터 관련 */
  --hapa-editor-background: var(--vscode-editor-background, #1e1e1e);
  --hapa-editor-foreground: var(--vscode-editor-foreground, #d4d4d4);
  
  /* 입력 요소 */
  --hapa-input-background: var(--vscode-input-background, #3c3c3c);
  --hapa-input-foreground: var(--vscode-input-foreground, #cccccc);
  --hapa-input-border: var(--vscode-input-border, #3c3c3c);
  --hapa-input-placeholder-foreground: var(--vscode-input-placeholderForeground, #888888);
  
  /* 버튼 */
  --hapa-button-background: var(--vscode-button-background, #0e639c);
  --hapa-button-foreground: var(--vscode-button-foreground, #ffffff);
  --hapa-button-hover-background: var(--vscode-button-hoverBackground, #1177bb);
  --hapa-button-secondary-background: var(--vscode-button-secondaryBackground, #3c3c3c);
  --hapa-button-secondary-foreground: var(--vscode-button-secondaryForeground, #cccccc);
  --hapa-button-secondary-hover-background: var(--vscode-button-secondaryHoverBackground, #444444);
  
  /* 패널 및 사이드바 */
  --hapa-panel-background: var(--vscode-panel-background, #1e1e1e);
  --hapa-panel-border: var(--vscode-panel-border, #2d2d30);
  --hapa-sidebar-background: var(--vscode-sideBar-background, #252526);
  --hapa-sidebar-foreground: var(--vscode-sideBar-foreground, #cccccc);
  --hapa-sidebar-border: var(--vscode-sideBar-border, #2d2d30);
  --hapa-sidebar-section-header-background: var(--vscode-sideBarSectionHeader-background, #2d2d30);
  --hapa-sidebar-section-header-foreground: var(--vscode-sideBarSectionHeader-foreground, #cccccc);
  --hapa-sidebar-section-header-border: var(--vscode-sideBarSectionHeader-border, #2d2d30);
  
  /* 목록 */
  --hapa-list-active-selection-background: var(--vscode-list-activeSelectionBackground, #094771);
  --hapa-list-active-selection-foreground: var(--vscode-list-activeSelectionForeground, #ffffff);
  --hapa-list-hover-background: var(--vscode-list-hoverBackground, #2a2d2e);
  --hapa-list-hover-foreground: var(--vscode-list-hoverForeground, #cccccc);
  
  /* HAPA 커스텀 색상 */
  --hapa-primary: #007ACC;
  --hapa-primary-hover: #005a9e;
  --hapa-primary-active: #004578;
  --hapa-primary-light: rgba(0, 122, 204, 0.1);
  --hapa-success: #4CAF50;
  --hapa-success-light: rgba(76, 175, 80, 0.1);
  --hapa-warning: #FF9800;
  --hapa-warning-light: rgba(255, 152, 0, 0.1);
  --hapa-error: #F44336;
  --hapa-error-light: rgba(244, 67, 54, 0.1);
  
  /* 그라데이션 */
  --hapa-gradient-primary: linear-gradient(135deg, #007ACC 0%, #40A9FF 100%);
  --hapa-gradient-success: linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%);
  
  /* 그림자 */
  --hapa-shadow-small: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
  --hapa-shadow-medium: 0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23);
  --hapa-shadow-large: 0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23);
  
  /* 애니메이션 변수 */
  --hapa-duration-fast: 150ms;
  --hapa-duration-normal: 250ms;
  --hapa-duration-slow: 350ms;
  --hapa-ease-out: cubic-bezier(0.25, 0.8, 0.25, 1);
  --hapa-ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  --hapa-transition-duration: var(--hapa-duration-normal);
}

/* 애니메이션 키프레임 */
@keyframes hapa-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes hapa-fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes hapa-fade-in-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes hapa-fade-in-down {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes hapa-fade-in-left {
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes hapa-fade-in-right {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes hapa-scale-in {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes hapa-bounce-in {
  0% { opacity: 0; transform: scale(0.3); }
  50% { opacity: 1; transform: scale(1.05); }
  70% { transform: scale(0.95); }
  100% { opacity: 1; transform: scale(1); }
}

@keyframes hapa-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes hapa-shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
  20%, 40%, 60%, 80% { transform: translateX(10px); }
}

@keyframes hapa-typing {
  0% { opacity: 0.3; }
  50% { opacity: 1; }
  100% { opacity: 0.3; }
}

@keyframes hapa-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 애니메이션 유틸리티 클래스 */
.hapa-animate-fade-in { animation: hapa-fade-in var(--hapa-transition-duration) var(--hapa-ease-out); }
.hapa-animate-fade-out { animation: hapa-fade-out var(--hapa-transition-duration) var(--hapa-ease-out); }
.hapa-animate-fade-in-up { animation: hapa-fade-in-up var(--hapa-transition-duration) var(--hapa-ease-out); }
.hapa-animate-fade-in-down { animation: hapa-fade-in-down var(--hapa-transition-duration) var(--hapa-ease-out); }
.hapa-animate-fade-in-left { animation: hapa-fade-in-left var(--hapa-transition-duration) var(--hapa-ease-out); }
.hapa-animate-fade-in-right { animation: hapa-fade-in-right var(--hapa-transition-duration) var(--hapa-ease-out); }
.hapa-animate-scale-in { animation: hapa-scale-in var(--hapa-transition-duration) var(--hapa-ease-out); }
.hapa-animate-bounce-in { animation: hapa-bounce-in var(--hapa-duration-slow) var(--hapa-ease-bounce); }
.hapa-animate-bounce { animation: hapa-bounce 1s infinite; }
.hapa-animate-pulse { animation: hapa-pulse 2s ease-in-out infinite; }
.hapa-animate-shake { animation: hapa-shake 0.5s ease-in-out; }

.hapa-animate-delay-100 { animation-delay: 100ms; }
.hapa-animate-delay-200 { animation-delay: 200ms; }
.hapa-animate-delay-300 { animation-delay: 300ms; }
.hapa-animate-delay-400 { animation-delay: 400ms; }
.hapa-animate-delay-500 { animation-delay: 500ms; }

/* 호버 효과 */
.hapa-hover-lift {
  transition: transform var(--hapa-duration-fast) var(--hapa-ease-out), box-shadow var(--hapa-duration-fast) var(--hapa-ease-out);
}
.hapa-hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: var(--hapa-shadow-medium);
}

.hapa-hover-scale {
  transition: transform var(--hapa-duration-fast) var(--hapa-ease-out);
}
.hapa-hover-scale:hover {
  transform: scale(1.1);
}

/* 기본 리셋 */
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  font-family: var(--vscode-font-family);
  font-size: var(--vscode-font-size);
  background: var(--vscode-sideBar-background);
  color: var(--vscode-sideBar-foreground);
  overflow: hidden;
}

/* 사이드바 컨테이너 */
.sidebar-container {
  height: 100vh;
  background: var(--hapa-sidebar-background);
  color: var(--hapa-sidebar-foreground);
  font-family: var(--vscode-font-family);
  font-size: var(--vscode-font-size);
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
}

/* 사이드바 헤더 */
.sidebar-header {
  padding: 6px 12px; /* 패딩을 절반으로 축소 */
  background: var(--hapa-header-background);
  border-bottom: 1px solid var(--hapa-panel-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(8px);
  border-radius: var(--hapa-border-radius) var(--hapa-border-radius) 0 0;
}

.sidebar-title {
  font-size: 12px; /* 폰트 크기 대폭 축소 */
  font-weight: 700;
  color: var(--hapa-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  line-height: 1;
}

.sidebar-icon {
  width: 20px;
  height: 20px;
  background: var(--hapa-primary);
  color: white;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 4px; /* 간격 축소 */
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 3px; /* 간격 축소 */
  font-size: 9px; /* 폰트 크기 축소 */
  color: var(--hapa-description-foreground);
  padding: 2px 4px; /* 패딩 축소 */
  border-radius: 8px;
  background: var(--hapa-success-background);
}

.status-dot {
  width: 4px; /* 크기 축소 */
  height: 4px;
  background: var(--hapa-success);
  border-radius: 50%;
  animation: pulse 2s infinite;
}

/* 헤더 확장/축소 버튼 */
.expand-btn {
  padding: 3px 6px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 4px;
  color: var(--hapa-description-foreground);
  cursor: pointer;
  font-size: 8px;
  transition: all var(--hapa-duration-normal) var(--hapa-ease-out);
  width: 20px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.expand-btn:hover {
  background: var(--hapa-button-secondary-hover-background);
  border-color: transparent;
}

.expand-btn:active {
  background: var(--hapa-input-background);
  border-color: transparent;
}

.expand-btn:focus {
  outline: none;
  border-color: transparent;
}

.header-action-btn {
  padding: 3px 6px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 4px;
  color: var(--hapa-description-foreground);
  cursor: pointer;
  font-size: 8px;
  transition: all var(--hapa-duration-normal) var(--hapa-ease-out);
  width: 20px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 2px;
}

.header-action-btn:hover {
  background: var(--hapa-button-secondary-hover-background);
  border-color: transparent;
}

.header-action-btn:active {
  background: var(--hapa-input-background);
  border-color: transparent;
}

.header-action-btn:focus {
  outline: none;
  border-color: transparent;
}

.header-action-btn span {
  font-size: 8px;
}

/* 개별 버튼 색상 */
.delete-btn:hover {
  background: var(--hapa-error-background);
  color: var(--hapa-error);
}

.delete-btn:active {
  background: var(--hapa-input-background);
  color: var(--hapa-error);
}

.settings-btn:hover {
  background: var(--hapa-warning-background);
  color: var(--hapa-warning);
}

.settings-btn:active {
  background: var(--hapa-input-background);
  color: var(--hapa-warning);
}

.help-btn:hover {
  background: var(--hapa-info-background);
  color: var(--hapa-primary);
}

.help-btn:active {
  background: var(--hapa-input-background);
  color: var(--hapa-primary);
}



/* 버튼 공통 스타일 */
.hapa-button, button {
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--hapa-duration-fast) var(--hapa-ease-out);
  display: inline-flex;
  align-items: center;
  gap: 4px;
  position: relative;
  overflow: hidden;
  background: var(--hapa-button-secondary-background);
  color: var(--hapa-button-secondary-foreground);
}

.hapa-button:hover, button:hover {
  background: var(--hapa-button-secondary-hover-background);
  transform: translateY(-1px);
  box-shadow: var(--hapa-shadow-small);
}

.hapa-button:active, button:active {
  transform: translateY(0);
}

.hapa-button:disabled, button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 프라이머리 버튼 */
.send-btn, .expand-btn {
  background: var(--hapa-button-background) !important;
  color: var(--hapa-button-foreground) !important;
}

.send-btn:hover, .expand-btn:hover {
  background: var(--hapa-button-hover-background) !important;
}

/* 메뉴 관련 */
.menu-container {
  position: relative;
}

.menu-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: var(--hapa-input-background);
  border: 1px solid var(--hapa-input-border);
  border-radius: 4px;
  padding: 4px 0;
  min-width: 150px;
  box-shadow: var(--hapa-shadow-medium);
  display: none;
  z-index: 1000;
}

.menu-dropdown.show {
  display: block;
}

.menu-item {
  width: 100%;
  text-align: left;
  padding: 8px 12px;
  border: none;
  background: transparent;
  color: var(--hapa-foreground);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.menu-item:hover {
  background: var(--hapa-list-hover-background);
}

.menu-separator {
  height: 1px;
  background: var(--hapa-input-border);
  margin: 4px 0;
}

/* 섹션 공통 스타일 */
.request-section, .response-section, .history-section {
  padding: 16px;
  border-bottom: 1px solid var(--hapa-panel-border);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--hapa-foreground);
}

.section-subtitle {
  font-size: 11px;
  color: var(--hapa-description-foreground);
  margin-top: 2px;
}

/* 모델 탭 섹션 */
.model-tabs-section {
  margin-bottom: 0; /* 질문 입력칸과 연결되도록 마진 제거 */
}

.model-tabs {
  display: flex;
  background: var(--hapa-input-background);
  border: 1px solid var(--hapa-input-border);
  border-bottom: none; /* 하단 경계선 제거로 입력칸과 연결 */
  border-radius: 8px 8px 0 0; /* 상단만 라운드 */
  overflow: hidden;
}

.model-tab {
  padding: 8px 16px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  border-radius: 0;
  color: var(--hapa-description-foreground);
  cursor: pointer;
  font-size: 11px;
  transition: all var(--hapa-duration-normal) var(--hapa-ease-out);
  flex: 1;
  text-align: center;
  font-weight: 400;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.model-tab:hover {
  background: var(--hapa-button-secondary-hover-background);
  color: var(--hapa-primary);
}

.model-tab.active {
  color: var(--hapa-primary);
  background: transparent;
  border-bottom-color: var(--hapa-primary);
  font-weight: 500;
}

.model-tab:active {
  background: var(--hapa-input-background);
}

.model-tab:focus {
  outline: none;
  box-shadow: none;
}

.model-tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--hapa-primary);
}

/* 질문 입력 폼과 연결 */
.question-form {
  background: var(--hapa-input-background);
  border: 1px solid var(--hapa-input-border);
  border-radius: 0 0 8px 8px; /* 하단만 라운드 */
  padding: 12px;
}

.input-container {
  margin-bottom: 12px;
}

/* 질문 입력 영역 */
.question-input {
  width: 100%;
  min-height: 60px;
  padding: 8px;
  border: 1px solid var(--hapa-input-border);
  border-radius: 6px;
  background: var(--hapa-input-background);
  color: var(--hapa-input-foreground);
  font-size: 11px;
  line-height: 1.4;
  resize: vertical;
  transition: all var(--hapa-duration-normal) var(--hapa-ease-out);
  font-family: var(--vscode-font-family);
  outline: none;
  box-shadow: none;
}

.question-input:focus {
  border-color: var(--hapa-primary);
  box-shadow: none;
  outline: none;
}

.question-input:hover {
  border-color: var(--hapa-primary-light);
}

.question-input::placeholder {
  color: var(--hapa-description-foreground);
  opacity: 0.7;
}

/* 에러 placeholder 스타일 */
.question-input.error-placeholder, textarea.error-placeholder {
  border-color: var(--hapa-error-foreground) !important;
  box-shadow: 0 0 0 1px var(--hapa-error-foreground) !important;
  animation: hapa-shake 0.5s ease-in-out;
}

.question-input.error-placeholder::placeholder, textarea.error-placeholder::placeholder {
  color: var(--hapa-error-foreground) !important;
  font-weight: 600;
}

.input-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
}

.input-info {
  display: flex;
  gap: 12px;
  font-size: 10px;
  color: var(--hapa-description-foreground);
}

.char-count {
  font-weight: 500;
}

.input-tip {
  font-style: italic;
}

/* 액션 버튼들 */
.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

.send-btn {
  padding: 10px 20px;
  background: var(--hapa-primary);
  color: var(--hapa-primary-foreground);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  transition: all var(--hapa-duration-normal) var(--hapa-ease-out);
  outline: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  min-width: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.send-btn:hover {
  background: var(--hapa-primary-dark);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.send-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.send-btn:focus {
  outline: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1), 0 0 0 2px var(--hapa-primary-light);
}

.send-btn:disabled {
  background: var(--hapa-button-secondary-background);
  color: var(--hapa-button-secondary-foreground);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
  opacity: 0.6;
}

/* 빠른 액션 */
.quick-actions {
  margin-top: 16px;
}

.quick-title {
  font-size: 12px;
  font-weight: 500;
  color: var(--hapa-foreground);
  margin-bottom: 8px;
}

.quick-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.quick-btn {
  padding: 8px 6px;
  font-size: 11px;
  text-align: center;
  background: var(--hapa-button-secondary-background);
  border: 1px solid var(--hapa-input-border);
  border-radius: 4px;
  cursor: pointer;
  transition: all var(--hapa-duration-fast);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.quick-btn:hover {
  background: var(--hapa-button-secondary-hover-background);
  border-color: var(--hapa-focus-border);
}

.quick-btn span {
  font-size: 14px;
}

/* 응답 섹션 - 질문 입력 폼과 동일한 스타일 적용 */
.response-tabs {
  background: var(--hapa-input-background);
  border: 1px solid var(--hapa-input-border);
  border-bottom: none;
  border-radius: 8px 8px 0 0;
  overflow: hidden;
  display: flex;
  margin-bottom: 0;
}

.tab-btn {
  padding: 8px 16px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  border-radius: 0;
  color: var(--hapa-description-foreground);
  cursor: pointer;
  font-size: 11px;
  transition: all var(--hapa-duration-normal) var(--hapa-ease-out);
  flex: 1;
  text-align: center;
  font-weight: 400;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  outline: none;
}

.tab-btn:hover {
  background: var(--hapa-button-secondary-hover-background);
  color: var(--hapa-primary);
}

.tab-btn.active {
  color: var(--hapa-primary);
  background: transparent;
  border-bottom-color: var(--hapa-primary);
  font-weight: 500;
}

.tab-btn:active {
  background: var(--hapa-input-background);
}

.tab-btn:focus {
  outline: 2px solid var(--hapa-primary) !important;
  outline-offset: 2px !important;
  box-shadow: 0 0 0 2px var(--hapa-primary) !important;
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--hapa-primary);
}

/* AI 모델 선택 섹션 */
.model-selection-section {
  margin-bottom: 16px;
  padding: 12px;
  background: var(--hapa-input-background);
  border: 1px solid var(--hapa-input-border);
  border-radius: 6px;
}

.model-selection-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--hapa-foreground);
  margin-bottom: 10px;
  text-align: center;
}



/* 탭 콘텐츠 컨테이너 - 질문 입력 폼과 동일한 스타일 */
.tab-content {
  display: block;
  width: 100%;
  box-sizing: border-box;
  background: var(--hapa-input-background);
  border: 1px solid var(--hapa-input-border);
  border-radius: 0 0 8px 8px;
  padding: 12px;
  margin-bottom: 16px;
}

.response-content,
.history-content {
  width: 100%;
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}

.tab-content.active {
  display: block;
  width: 100%;
}

.response-actions {
  display: flex;
  gap: 8px;
}

.stop-btn, .continue-btn {
  padding: 4px 8px;
  font-size: 11px;
}

/* 응답 표시 영역 - 질문 입력창과 동일한 스타일 */
.response-display {
  width: 100% !important;
  min-height: 200px !important;
  padding: 16px !important;
  border: 1px solid var(--hapa-input-border) !important;
  border-radius: 8px !important;
  background: var(--hapa-input-background) !important;
  color: var(--hapa-foreground) !important;
  font-family: 'Consolas', 'Monaco', monospace !important;
  white-space: pre-wrap !important;
  word-wrap: break-word !important;
  overflow-y: auto !important;
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
  box-sizing: border-box !important;
}

/* 빈 상태 스타일 */
.response-display .empty-state {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  height: 100% !important;
  min-height: 180px !important;
}

/* 테스트 컨텐츠 스타일 */
.test-response-content,
.test-history-item {
  padding: 12px;
  margin-bottom: 8px;
  background: var(--hapa-input-background);
  border: 1px solid var(--hapa-input-border);
  border-radius: 4px;
  color: var(--hapa-foreground);
}

.test-response-content .response-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--hapa-input-border);
}

.test-response-content .response-title {
  font-weight: bold;
  color: var(--hapa-success);
}

.test-response-content .response-meta,
.test-history-item .history-meta {
  font-size: 11px;
  color: var(--hapa-description-foreground);
}

.test-response-content .response-body {
  margin-top: 8px;
}

.test-response-content .code-block {
  background: var(--hapa-editor-background);
  border: 1px solid var(--hapa-input-border);
  border-radius: 4px;
  padding: 8px;
  margin: 8px 0;
  overflow-x: auto;
}

.test-response-content .code-block code {
  color: var(--hapa-editor-foreground);
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.test-history-item .history-question {
  margin-bottom: 6px;
}

.test-history-item .question-text {
  font-weight: 500;
  margin-top: 4px;
}

.test-history-item .response-preview {
  color: var(--hapa-description-foreground);
  font-size: 12px;
  font-style: italic;
}

/* 응답 표시 영역 - webview 호환성을 위한 !important 선언 */
.response-display {
  width: 100% !important;
  min-height: 200px !important;
  padding: 12px !important;
  border: 1px solid var(--hapa-input-border) !important;
  border-radius: 6px !important;
  background: var(--hapa-input-background) !important;
  color: var(--hapa-input-foreground) !important;
  font-size: 11px !important;
  line-height: 1.4 !important;
  font-family: var(--vscode-font-family) !important;
  outline: none !important;
  box-shadow: none !important;
  white-space: pre-wrap !important;
  word-wrap: break-word !important;
  box-sizing: border-box !important;
  transition: all var(--hapa-duration-normal) var(--hapa-ease-out) !important;
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
}

.response-display:focus {
  border-color: var(--hapa-primary) !important;
  box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.3) !important;
  outline: 2px solid var(--hapa-focus-border) !important;
  outline-offset: 2px !important;
}

.response-display:hover {
  border-color: var(--hapa-primary-light) !important;
}

/* 접근성 강화 - 포커스 가시성 */
.response-display:focus-visible {
  outline: 2px solid var(--hapa-focus-border) !important;
  outline-offset: 2px !important;
}

/* 탭 UI 접근성 강화 */
.response-tabs .tab-button:focus {
  outline: 2px solid var(--hapa-focus-border) !important;
  outline-offset: -2px !important;
}

.response-tabs .tab-button:focus-visible {
  outline: 2px solid var(--hapa-focus-border) !important;
  outline-offset: -2px !important;
}

/* 빈 상태 스타일 - 일관된 디자인 */
.empty-state {
  text-align: center;
  color: var(--hapa-description-foreground);
  padding: 40px 20px;
  font-size: 11px;
}

/* Claude 스타일 응답 컨테이너 - SidebarComponents.ts와 호환 */
.claude-style-response {
  width: 100%;
  min-height: 200px;
  display: block;
  visibility: visible;
  opacity: 1;
}

/* Claude 스타일 빈 상태 - SidebarComponents.ts와 호환 */
.claude-empty-state {
  text-align: center;
  color: var(--hapa-description-foreground);
  padding: 40px 20px;
  font-size: 11px;
  display: block;
  visibility: visible;
  opacity: 1;
}

.claude-empty-state .empty-icon {
  font-size: 24px;
  margin-bottom: 12px;
  opacity: 0.6;
}

.claude-empty-state .empty-message {
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 8px;
  color: var(--hapa-foreground);
  line-height: 1.4;
}

.claude-empty-state .empty-submessage {
  font-size: 10px;
  line-height: 1.4;
  opacity: 0.7;
  color: var(--hapa-description-foreground);
}

/* 히스토리 관련 스타일 */
.empty-history {
  text-align: center;
  color: var(--hapa-description-foreground);
  padding: 40px 20px;
  font-size: 11px;
}

.empty-history-icon {
  font-size: 24px;
  margin-bottom: 12px;
  opacity: 0.6;
}

.empty-history-message {
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 8px;
  color: var(--hapa-foreground);
  line-height: 1.4;
}

.empty-history-submessage {
  font-size: 10px;
  line-height: 1.4;
  opacity: 0.7;
  color: var(--hapa-description-foreground);
}

.history-item {
  border: 1px solid var(--hapa-panel-border);
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 12px;
  background: var(--hapa-editor-background);
  transition: all 0.2s ease;
}

.history-item:hover {
  border-color: var(--hapa-primary);
  background: rgba(var(--hapa-primary-rgb), 0.05);
}

.history-question {
  margin-bottom: 8px;
}

.history-meta {
  font-size: 10px;
  color: var(--hapa-description-foreground);
  margin-bottom: 4px;
}

.question-text {
  font-size: 12px;
  color: var(--hapa-foreground);
  font-weight: 500;
  line-height: 1.4;
}

.history-response {
  margin-bottom: 8px;
}

.response-preview {
  font-size: 11px;
  color: var(--hapa-description-foreground);
  line-height: 1.4;
  padding: 8px;
  background: var(--hapa-input-background);
  border-radius: 4px;
  border-left: 3px solid var(--hapa-primary);
}

.history-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.history-action-btn {
  background: var(--hapa-button-background);
  border: 1px solid var(--hapa-button-border);
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 10px;
  color: var(--hapa-button-foreground);
  cursor: pointer;
  transition: all 0.2s ease;
}

.history-action-btn:hover {
  background: var(--hapa-button-hoverBackground);
  border-color: var(--hapa-primary);
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid var(--hapa-panel-border);
  background: var(--hapa-input-background);
  border-radius: 6px 6px 0 0;
  margin-bottom: 8px;
}

.history-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--hapa-foreground);
}

.history-refresh-btn {
  background: var(--hapa-button-background);
  border: 1px solid var(--hapa-button-border);
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 11px;
  color: var(--hapa-button-foreground);
  cursor: pointer;
  transition: all 0.2s ease;
}

.history-refresh-btn:hover:not(:disabled) {
  background: var(--hapa-button-hoverBackground);
  border-color: var(--hapa-primary);
}

.history-refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.empty-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.empty-title {
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 4px;
  color: var(--hapa-foreground);
}

.empty-description {
  font-size: 10px;
  line-height: 1.4;
  opacity: 0.7;
}

/* 에러 메시지 */
.error-message {
  background: var(--hapa-error-background);
  border: 1px solid var(--hapa-error-foreground);
  border-radius: 4px;
  padding: 12px;
  margin-top: 8px;
}

.error-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.error-text {
  font-size: 12px;
  color: var(--hapa-error-foreground);
  font-weight: 500;
}

/* 스트리밍 인디케이터 */
.streaming-indicator {
  background: linear-gradient(90deg, 
    var(--hapa-input-background) 25%, 
    rgba(var(--hapa-primary-rgb), 0.1) 50%, 
    var(--hapa-input-background) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
  padding: 12px;
  margin: 8px 0;
}

.streaming-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.streaming-dots {
  display: flex;
  gap: 4px;
}

.streaming-dots span {
  width: 6px;
  height: 6px;
  background: var(--hapa-info-foreground);
  border-radius: 50%;
  animation: pulse 1.4s infinite ease-in-out;
}

.streaming-dots span:nth-child(1) {
  animation-delay: -0.32s;
}

.streaming-dots span:nth-child(2) {
  animation-delay: -0.16s;
}

.streaming-text {
  font-size: 11px;
  color: var(--hapa-info-foreground);
}

/* 히스토리 섹션 */
.history-actions {
  display: flex;
  gap: 4px;
}

.history-clear-btn {
  padding: 4px 6px;
  background: var(--hapa-error-background);
  color: var(--hapa-error-foreground);
}

.history-clear-btn:hover {
  background: var(--hapa-error-foreground);
  color: white;
}

/* 히스토리 섹션 - 질문 입력창과 일관된 스타일 */
.history-content {
  max-height: 300px;
  overflow-y: auto;
  width: 100%;
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}

.history-empty {
  text-align: center;
  color: var(--hapa-description-foreground);
  padding: 40px 20px;
  width: 100%;
  box-sizing: border-box;
  font-size: 11px;
}

/* 히스토리 아이템 - 질문 입력창과 동일한 스타일 */
.history-item {
  margin-bottom: 8px;
  padding: 8px;
  border: 1px solid var(--hapa-input-border);
  border-radius: 6px;
  background: var(--hapa-input-background);
  color: var(--hapa-input-foreground);
  font-size: 11px;
  line-height: 1.4;
  transition: all var(--hapa-duration-normal) var(--hapa-ease-out);
  position: relative;
  width: 100%;
  box-sizing: border-box;
}

.history-item:hover {
  border-color: var(--hapa-primary-light);
  background: var(--hapa-button-secondary-hover-background);
}

.history-item:focus-within {
  border-color: var(--hapa-primary);
}

.history-question {
  font-size: 11px;
  font-weight: 600;
  color: var(--hapa-foreground);
  margin-bottom: 4px;
  word-wrap: break-word;
}

.history-response {
  font-size: 10px;
  color: var(--hapa-description-foreground);
  margin-bottom: 4px;
  white-space: pre-wrap;
  word-wrap: break-word;
  max-height: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-timestamp {
  font-size: 9px;
  color: var(--hapa-disabled-foreground);
}

.history-delete-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  padding: 0;
  background: var(--hapa-error-background);
  color: var(--hapa-error-foreground);
  border-radius: 50%;
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
}

.history-delete-btn:hover {
  background: var(--hapa-error-foreground);
  color: white;
}

/* 상태 컴포넌트 */
.code-context-indicator {
  position: fixed;
  bottom: 16px;
  left: 16px;
  right: 16px;
  background: var(--hapa-warning-background);
  border: 1px solid var(--hapa-warning-foreground);
  border-radius: 4px;
  padding: 8px;
  display: none;
  z-index: 1000;
}

.context-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.context-icon {
  font-size: 16px;
}

.context-message {
  font-size: 11px;
  font-weight: 500;
  color: var(--hapa-warning-foreground);
}

.context-details {
  font-size: 10px;
  color: var(--hapa-description-foreground);
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.loading-content {
  background: var(--hapa-panel-background);
  border-radius: 8px;
  padding: 24px;
  text-align: center;
  box-shadow: var(--hapa-shadow-large);
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--hapa-input-border);
  border-top: 3px solid var(--hapa-primary);
  border-radius: 50%;
  animation: hapa-spin 1s linear infinite;
  margin: 0 auto 12px;
}

.loading-message {
  font-size: 12px;
  color: var(--hapa-foreground);
}

/* 반응형 디자인 */
@media (max-width: 300px) {
  .sidebar-header {
    padding: 8px;
  }
  
  .sidebar-title {
    font-size: 12px;
  }
  
  .header-actions {
    gap: 4px;
  }
  
  .quick-buttons {
    grid-template-columns: 1fr;
  }
  
  .action-buttons {
    flex-direction: column;
  }
}

@media (min-width: 400px) {
  .quick-buttons {
    grid-template-columns: 1fr 1fr 1fr 1fr;
  }
}

/* 스크롤바 스타일링 */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: var(--hapa-sidebar-background);
}

::-webkit-scrollbar-thumb {
  background: var(--hapa-input-border);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--hapa-description-foreground);
}

/* 코드 블록 스타일 */
pre, code {
  background: var(--hapa-editor-background);
  border: 1px solid var(--hapa-input-border);
  border-radius: 4px;
  padding: 8px;
  font-family: var(--vscode-editor-fontFamily, 'Consolas, Monaco, monospace');
  font-size: 11px;
  overflow-x: auto;
}

code {
  padding: 2px 4px;
  display: inline;
}

/* 키보드 접근성 - 포커스 스타일 */
.keyboard-focused {
  outline: 2px solid var(--hapa-primary) !important;
  outline-offset: 2px;
  border-radius: 4px;
}

.model-tab:focus-visible,
.tab-btn:focus-visible,
.question-input:focus-visible,
button:focus-visible {
  outline: 2px solid var(--hapa-primary);
  outline-offset: 2px;
}

/* 접근성 향상 - 고대비 모드 지원 */
@media (prefers-contrast: high) {
  .model-tab.active {
    border: 3px solid var(--hapa-primary);
  }
  
  .keyboard-focused {
    outline: 3px solid var(--hapa-primary) !important;
  }
}

/* 모바일 최적화 - 작은 화면 대응 */
@media (max-width: 480px) {
  .sidebar-header {
    padding: 4px 8px;
  }
  
  .sidebar-title {
    font-size: 11px;
  }
  
  .connection-status {
    font-size: 8px;
    padding: 1px 3px;
  }
  
  .expand-btn {
    padding: 2px 4px;
    font-size: 8px;
  }
  
  .menu-btn {
    width: 18px;
    height: 16px;
    font-size: 7px;
  }
}

@media (max-width: 360px) {
  .model-tabs {
    border-radius: 6px 6px 0 0;
  }
  
  .model-tab {
    padding: 8px 4px;
    font-size: 10px;
    min-height: 40px; /* 터치 인터페이스 권장 최소 크기 */
  }
  
  .question-form {
    padding: 8px;
    border-radius: 0 0 6px 6px;
  }
  
  .question-input {
    min-height: 50px;
    padding: 8px;
    font-size: 12px;
  }
  
  .action-buttons {
    gap: 6px;
  }
  
  .send-btn,
  .clear-btn {
    padding: 8px 12px;
    font-size: 11px;
    min-height: 36px;
  }
}

@media (max-width: 320px) {
  .model-tab {
    padding: 6px 2px;
    font-size: 9px;
    min-height: 36px;
  }
  
  .question-input {
    font-size: 11px;
    min-height: 45px;
  }
  
  .send-btn,
  .clear-btn {
    font-size: 10px;
    padding: 6px 10px;
    min-height: 32px;
  }
}

/* 터치 인터페이스 최적화 */
@media (pointer: coarse) {
  .model-tab {
    min-height: 44px; /* iOS 권장 최소 터치 영역 */
    padding: 10px 8px;
  }
  
  .send-btn,
  .clear-btn,
  .tab-btn {
    min-height: 44px;
    padding: 10px 16px;
  }
  
  .expand-btn,
  .menu-btn {
    min-width: 44px;
    min-height: 44px;
  }
}

/* 시각적 피드백 강화 - 애니메이션 */
@keyframes slideIn {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes shimmer {
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.1);
  }
}

@keyframes bounceIn {
  0% {
    transform: scale(0.3);
    opacity: 0;
  }
  50% {
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* 탭 전환 애니메이션 */
.model-tab {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.model-tab::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.6s;
}

.model-tab:hover::before {
  left: 100%;
}

.model-tab.active::after {
  animation: slideIn 0.3s ease-out;
}

/* 로딩 상태 개선 */
.streaming-indicator {
  background: linear-gradient(90deg, 
    var(--hapa-input-background) 25%, 
    var(--hapa-primary-light) 50%, 
    var(--hapa-input-background) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
  padding: 12px;
  margin: 8px 0;
}

.streaming-dots span {
  animation: pulse 1.4s infinite ease-in-out;
}

.streaming-dots span:nth-child(1) {
  animation-delay: -0.32s;
}

.streaming-dots span:nth-child(2) {
  animation-delay: -0.16s;
}

/* 상태 메시지 애니메이션 */
.empty-state {
  animation: bounceIn 0.6s ease-out;
}

.status-message {
  padding: 8px 12px;
  border-radius: 4px;
  margin: 8px 0;
  opacity: 0;
  transform: translateY(-10px);
  transition: all 0.3s ease-out;
}

.status-message.show {
  opacity: 1;
  transform: translateY(0);
}

.status-message.success {
  background: var(--hapa-success-background);
  color: var(--hapa-success-foreground);
  border-left: 3px solid var(--hapa-success);
}

.status-message.error {
  background: var(--hapa-error-background);
  color: var(--hapa-error-foreground);
  border-left: 3px solid var(--hapa-error);
}

.status-message.warning {
  background: var(--hapa-warning-background);
  color: var(--hapa-warning-foreground);
  border-left: 3px solid var(--hapa-warning);
}

/* 버튼 호버 효과 강화 */
.send-btn {
  position: relative;
  overflow: hidden;
}

.send-btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.3s, height 0.3s;
}

.send-btn:hover::before {
  width: 200%;
  height: 200%;
}

/* 입력창 상태 표시 */
.question-input.error-placeholder {
  border-color: var(--hapa-error);
  background: var(--hapa-error-background);
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

/* 탭 콘텐츠 전환 애니메이션 */
.tab-content {
  transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
  opacity: 0;
  transform: translateY(10px);
}

.tab-content.active {
  opacity: 1;
  transform: translateY(0);
}

/* 히스토리 아이템 애니메이션 */
.history-item {
  transition: all 0.2s ease-out;
  opacity: 0;
  transform: translateX(-20px);
  animation: slideInHistory 0.4s ease-out forwards;
}

@keyframes slideInHistory {
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.history-item:hover {
  transform: translateX(5px);
  box-shadow: var(--hapa-shadow-medium);
}

/* 연결 상태 애니메이션 */
.status-dot {
  animation: pulse 2s infinite;
}

/* 메뉴 드롭다운 애니메이션 */
.menu-dropdown {
  transform: translateY(-10px);
  opacity: 0;
  transition: all 0.2s ease-out;
}

.menu-dropdown.show {
  transform: translateY(0);
  opacity: 1;
}

/* 질문 섹션 모든 요소 outline 제거 */
.request-section button,
.request-section input,
.request-section textarea,
.request-section select {
  outline: none !important;
  box-shadow: none !important;
}

.request-section button:focus,
.request-section input:focus,
.request-section textarea:focus,
.request-section select:focus {
  outline: none !important;
  box-shadow: none !important;
}

.request-section button:active,
.request-section input:active,
.request-section textarea:active,
.request-section select:active {
  outline: none !important;
  box-shadow: none !important;
}

/* 응답 탭도 outline 제거 */
.tab-btn:focus,
.tab-btn:active {
  outline: none !important;
  box-shadow: none !important;
}

/* 전송/중지 버튼 스타일 */
.send-btn {
  background: var(--hapa-button-background);
  color: var(--hapa-button-foreground);
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 80px;
  justify-content: center;
}

.send-btn:hover {
  background: var(--hapa-button-hover-background);
  transform: translateY(-1px);
}

.send-btn:disabled {
  background: var(--hapa-disabled-foreground);
  cursor: not-allowed;
  transform: none;
}

/* 중지 버튼 스타일 */
.stop-btn {
  background: var(--hapa-error-foreground);
  color: #ffffff;
}

.stop-btn:hover {
  background: var(--hapa-error);
  box-shadow: 0 2px 8px rgba(244, 67, 54, 0.3);
}

.stop-btn:active {
  transform: translateY(0);
  box-shadow: 0 1px 4px rgba(244, 67, 54, 0.4);
}

/* 버튼 아이콘과 텍스트 스타일 */
#sendBtnIcon {
  font-size: 16px;
  line-height: 1;
}

#sendBtnText {
  font-weight: 500;
  letter-spacing: 0.5px;
}
    `;
  }

  /**
   * 확장 뷰용 추가 CSS 스타일
   */
  static generateExpandedViewCSS(): string {
    return `
/* 확장 뷰 컨테이너 */
.expanded-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--hapa-editor-background);
  color: var(--hapa-editor-foreground);
}

/* 확장 뷰 헤더 */
.expanded-container .sidebar-header {
  flex-shrink: 0;
  padding: 12px 20px;
  border-bottom: 1px solid var(--hapa-panel-border);
  background: var(--hapa-sidebar-background);
}

.expanded-container .sidebar-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--hapa-primary);
}

/* 확장 뷰 메인 콘텐츠 - 좌우 레이아웃 */
.expanded-content {
  display: flex;
  flex: 1;
  overflow: hidden;
  gap: 1px; /* 패널 간 구분선 */
  background: var(--hapa-panel-border);
}

/* 왼쪽 패널 - 질문 섹션 */
.left-panel {
  flex: 0 0 400px; /* 고정 너비 400px */
  display: flex;
  flex-direction: column;
  background: var(--hapa-sidebar-background);
  border-right: 1px solid var(--hapa-panel-border);
  overflow: hidden;
}

/* 오른쪽 패널 - 응답 섹션 */
.right-panel {
  flex: 1; /* 남은 공간 모두 사용 */
  display: flex;
  flex-direction: column;
  background: var(--hapa-editor-background);
  overflow: hidden;
}

/* 확장 뷰에서 질문 섹션 스타일 조정 */
.expanded-container .request-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
  margin: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.expanded-container .question-form {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.expanded-container .input-container {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.expanded-container .question-input {
  flex: 1;
  min-height: 120px;
  resize: none;
  font-family: var(--vscode-editor-font-family);
  line-height: 1.5;
}

/* 확장 뷰에서 응답 섹션 스타일 조정 - 질문 입력 칸과 동일한 스타일 적용 */
.expanded-container .response-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
  margin: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

/* 응답 탭 컨테이너 - 질문 입력 폼과 동일한 스타일 */
.expanded-container .response-tabs {
  background: var(--hapa-input-background);
  border: 1px solid var(--hapa-input-border);
  border-bottom: none;
  border-radius: 8px 8px 0 0;
  overflow: hidden;
  display: flex;
  margin-bottom: 0;
}

.expanded-container .tab-btn {
  padding: 8px 16px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  border-radius: 0;
  color: var(--hapa-description-foreground);
  cursor: pointer;
  font-size: 11px;
  transition: all var(--hapa-duration-normal) var(--hapa-ease-out);
  flex: 1;
  text-align: center;
  font-weight: 400;
  position: relative;
  outline: none;
}

.expanded-container .tab-btn:hover {
  background: var(--hapa-button-secondary-hover-background);
  color: var(--hapa-primary);
}

.expanded-container .tab-btn.active {
  color: var(--hapa-primary);
  background: transparent;
  border-bottom-color: var(--hapa-primary);
  font-weight: 500;
}

.expanded-container .tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--hapa-primary);
}

/* 탭 콘텐츠 컨테이너 - 질문 입력 폼과 동일한 스타일 */
.expanded-container .tab-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--hapa-input-background);
  border: 1px solid var(--hapa-input-border);
  border-radius: 0 0 8px 8px;
  padding: 12px;
}

.expanded-container .response-content,
.expanded-container .history-content {
  flex: 1;
  overflow-y: auto;
  padding: 0;
  margin: 0;
}

/* 응답 표시 영역 - 질문 입력창과 동일한 스타일 */
.expanded-container .response-display {
  width: 100%;
  min-height: 200px;
  max-height: none;
  flex: 1;
  padding: 8px;
  border: 1px solid var(--hapa-input-border);
  border-radius: 6px;
  background: var(--hapa-input-background);
  color: var(--hapa-input-foreground);
  font-size: 11px;
  line-height: 1.4;
  font-family: var(--vscode-font-family);
  outline: none;
  box-shadow: none;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-y: auto;
}

.expanded-container .response-display:focus {
  border-color: var(--hapa-primary);
}

.expanded-container .response-display:hover {
  border-color: var(--hapa-primary-light);
}

/* 히스토리 목록 컨테이너 */
.expanded-container .history-list {
  flex: 1;
  overflow-y: auto;
  padding: 0;
  margin: 0;
}

/* 히스토리 아이템 - 질문 입력창과 동일한 스타일 적용 */
.expanded-container .history-item {
  margin-bottom: 8px;
  padding: 8px;
  border: 1px solid var(--hapa-input-border);
  border-radius: 6px;
  background: var(--hapa-input-background);
  color: var(--hapa-input-foreground);
  font-size: 11px;
  line-height: 1.4;
  transition: all var(--hapa-duration-normal) var(--hapa-ease-out);
  position: relative;
}

.expanded-container .history-item:hover {
  border-color: var(--hapa-primary-light);
  background: var(--hapa-button-secondary-hover-background);
}

.expanded-container .history-item:focus-within {
  border-color: var(--hapa-primary);
}

/* 히스토리 질문 텍스트 */
.expanded-container .history-question {
  font-size: 11px;
  font-weight: 600;
  color: var(--hapa-foreground);
  margin-bottom: 4px;
  word-wrap: break-word;
}

/* 히스토리 응답 텍스트 */
.expanded-container .history-response {
  font-size: 10px;
  color: var(--hapa-description-foreground);
  margin-bottom: 4px;
  white-space: pre-wrap;
  word-wrap: break-word;
  max-height: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 히스토리 타임스탬프 */
.expanded-container .history-timestamp {
  font-size: 9px;
  color: var(--hapa-disabled-foreground);
}

/* 빈 상태 스타일 */
.expanded-container .empty-state {
  text-align: center;
  color: var(--hapa-description-foreground);
  padding: 40px 20px;
  font-size: 11px;
}

.expanded-container .empty-title {
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 4px;
  color: var(--hapa-foreground);
}

.expanded-container .empty-description {
  font-size: 10px;
  line-height: 1.4;
  opacity: 0.7;
}

/* 확장 뷰에서 모델 탭 스타일 */
.expanded-container .model-tabs {
  flex-wrap: wrap;
  gap: 8px;
}

.expanded-container .model-tab {
  flex: 1;
  min-width: 80px;
  text-align: center;
  font-size: 12px;
  padding: 8px 12px;
}

/* 확장 뷰에서 액션 버튼 */
.expanded-container .action-buttons {
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid var(--hapa-panel-border);
}

/* 확장 뷰에서 상태 컴포넌트 위치 조정 */
.expanded-container .code-context-indicator {
  position: fixed;
  bottom: 20px;
  left: 20px;
  max-width: 300px;
  z-index: 1000;
}

.expanded-container .loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9999;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .expanded-content {
    flex-direction: column;
  }
  
  .left-panel {
    flex: 0 0 300px;
    border-right: none;
    border-bottom: 1px solid var(--hapa-panel-border);
  }
  
  .right-panel {
    flex: 1;
  }
}

@media (max-width: 480px) {
  .left-panel {
    flex: 0 0 250px;
  }
  
  .expanded-container .request-section,
  .expanded-container .response-section {
    padding: 12px;
  }
}

/* 확장 뷰에서 히스토리 섹션 스타일 */
.expanded-container .history-list {
  padding-right: 8px; /* 스크롤바 공간 */
}

.expanded-container .history-item {
  margin-bottom: 12px;
  padding: 16px;
  border-radius: 8px;
  background: var(--hapa-sidebar-background);
  border: 1px solid var(--hapa-panel-border);
}

/* 스크롤바 스타일링 */
.expanded-container .response-content::-webkit-scrollbar,
.expanded-container .history-content::-webkit-scrollbar {
  width: 8px;
}

.expanded-container .response-content::-webkit-scrollbar-track,
.expanded-container .history-content::-webkit-scrollbar-track {
  background: var(--hapa-editor-background);
}

.expanded-container .response-content::-webkit-scrollbar-thumb,
.expanded-container .history-content::-webkit-scrollbar-thumb {
  background: var(--hapa-panel-border);
  border-radius: 4px;
}

.expanded-container .response-content::-webkit-scrollbar-thumb:hover,
.expanded-container .history-content::-webkit-scrollbar-thumb:hover {
  background: var(--hapa-description-foreground);
}
    `;
  }
}
