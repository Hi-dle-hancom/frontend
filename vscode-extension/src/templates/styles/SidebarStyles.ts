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

/* 버튼 스타일 */
.hapa-button {
  position: relative;
  overflow: hidden;
  transition: all var(--hapa-duration-fast) var(--hapa-ease-out);
}
.hapa-button:hover {
  transform: translateY(-1px);
  box-shadow: var(--hapa-shadow-small);
}
.hapa-button:active {
  transform: translateY(0);
}

/* 사이드바 컨테이너 기본 스타일 */
.sidebar-container {
  height: 100vh;
  background: var(--hapa-sidebar-background);
  color: var(--hapa-sidebar-foreground);
  font-family: var(--vscode-font-family);
  font-size: var(--vscode-font-size);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 12px;
  background: var(--hapa-sidebar-section-header-background);
  border-bottom: 1px solid var(--hapa-sidebar-section-header-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.sidebar-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
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
}

@media (min-width: 700px) {
  .sidebar-container {
    background: var(--vscode-editor-background);
    border: 1px solid var(--vscode-panel-border);
    border-radius: 8px;
    margin: 8px;
    height: calc(100vh - 16px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  .sidebar-header {
    background: linear-gradient(135deg, var(--vscode-sideBarSectionHeader-background) 0%, var(--vscode-editor-background) 100%);
    border-radius: 8px 8px 0 0;
    border-bottom: 2px solid var(--vscode-focusBorder);
  }
}
    `;
  }
}
