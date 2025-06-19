/**
 * 사이드바 HTML 콘텐츠 생성을 담당하는 클래스
 */
export class SidebarHtmlGenerator {
  static generateSidebarHtml(): string {
    return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HAPA - Sidebar Dashboard</title>
  <style>
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
      box-shadow: none;
    }
    
    /* 입력 필드 */
    .hapa-input {
      transition: border-color var(--hapa-duration-fast) var(--hapa-ease-out),
                  box-shadow var(--hapa-duration-fast) var(--hapa-ease-out),
                  background-color var(--hapa-duration-fast) var(--hapa-ease-out);
    }
    .hapa-input:focus {
      border-color: var(--hapa-focus-border);
      box-shadow: 0 0 0 2px var(--hapa-primary-light);
    }
    
    /* 포커스 링 */
    .hapa-focus-ring {
      position: relative;
      outline: none;
    }
    .hapa-focus-ring:focus::before {
      content: '';
      position: absolute;
      top: -2px; left: -2px; right: -2px; bottom: -2px;
      border: 2px solid var(--hapa-focus-border);
      border-radius: inherit;
      animation: hapa-focus-pulse 0.3s ease-out;
    }
    
    @keyframes hapa-focus-pulse {
      0% { opacity: 0; transform: scale(0.95); }
      100% { opacity: 1; transform: scale(1); }
    }
    
    /* 카드 효과 */
    .hapa-card {
      transition: transform var(--hapa-duration-fast) var(--hapa-ease-out),
                  box-shadow var(--hapa-duration-fast) var(--hapa-ease-out),
                  border-color var(--hapa-duration-fast) var(--hapa-ease-out);
    }
    .hapa-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--hapa-shadow-medium);
      border-color: var(--hapa-focus-border);
    }
    
    /* 트랜지션 */
    .hapa-transition { transition: all var(--hapa-transition-duration) var(--hapa-ease-out); }
    .hapa-transition-opacity { transition: opacity var(--hapa-transition-duration) var(--hapa-ease-out); }
    
    /* 테마 유틸리티 */
    .hapa-theme-text-primary { color: var(--hapa-foreground); }
    .hapa-theme-text-secondary { color: var(--hapa-description-foreground); }
    .hapa-theme-text-error { color: var(--hapa-error-foreground); }
    .hapa-theme-button-secondary {
      background-color: var(--hapa-button-secondary-background);
      color: var(--hapa-button-secondary-foreground);
    }
    .hapa-theme-button-secondary:hover {
      background-color: var(--hapa-button-secondary-hover-background);
    }
    .hapa-theme-list-item:hover {
      background-color: var(--hapa-list-hover-background);
      color: var(--hapa-list-hover-foreground);
    }
    
    /* 타이핑 인디케이터 */
    .hapa-typing-indicator {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .hapa-typing-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: var(--hapa-description-foreground);
      animation: hapa-typing 1.4s ease-in-out infinite;
    }
    .hapa-typing-dot:nth-child(1) { animation-delay: -0.32s; }
    .hapa-typing-dot:nth-child(2) { animation-delay: -0.16s; }
    .hapa-typing-dot:nth-child(3) { animation-delay: 0s; }
    
    /* 움직임 감소 설정 지원 */
    @media (prefers-reduced-motion: reduce) {
      :root {
        --hapa-transition-duration: 0ms;
        --hapa-duration-fast: 0ms;
        --hapa-duration-normal: 0ms;
        --hapa-duration-slow: 0ms;
      }
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }
  </style>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      background-color: var(--hapa-sidebar-background);
      color: var(--hapa-foreground);
      line-height: 1.4;
      overflow-x: hidden;
      transition: background-color var(--hapa-transition-duration) var(--hapa-ease-out);
    }
    
    .sidebar-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background-color: var(--hapa-sidebar-background);
    }
    
    .sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      background-color: var(--hapa-sidebar-section-header-background);
      border-bottom: 1px solid var(--hapa-sidebar-section-header-border);
      flex-shrink: 0;
      min-height: 32px;
      transition: all var(--hapa-transition-duration) var(--hapa-ease-out);
    }
    
    .sidebar-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      font-weight: 600;
      color: var(--hapa-sidebar-section-header-foreground);
    }
    
    .sidebar-icon {
      width: 14px;
      height: 14px;
      background: var(--hapa-gradient-primary);
      border-radius: 2px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 8px;
      color: white;
      font-weight: bold;
      transition: transform var(--hapa-duration-fast) var(--hapa-ease-out);
    }
    
    .sidebar-icon:hover {
      transform: scale(1.1);
    }
    
    .header-actions {
      display: flex;
      gap: 6px;
      align-items: center;
    }
    
    .header-btn {
      padding: 3px 6px;
      font-size: 10px;
      border: none;
      border-radius: 2px;
      cursor: pointer;
      background-color: var(--hapa-button-secondary-background);
      color: var(--hapa-button-secondary-foreground);
      transition: all var(--hapa-duration-fast) var(--hapa-ease-out);
    }
    
    .header-btn:hover {
      background-color: var(--hapa-button-secondary-hover-background);
      transform: translateY(-1px);
      box-shadow: var(--hapa-shadow-small);
    }
    
    .menu-btn {
      padding: 4px 6px;
      font-size: 12px;
      background-color: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
      border: none;
      border-radius: 2px;
      cursor: pointer;
      transition: all 0.15s ease;
      position: relative;
      margin-right: 4px;
    }
    
    .menu-btn:hover {
      background-color: var(--vscode-button-secondaryHoverBackground);
      transform: translateY(-1px);
    }
    
    .menu-btn span {
      font-size: 12px;
      font-weight: bold;
    }
    
    .expand-btn {
      padding: 4px 8px;
      font-size: 10px;
      border: none;
      border-radius: 2px;
      cursor: pointer;
      background: var(--hapa-gradient-primary);
      color: white;
      transition: all var(--hapa-duration-fast) var(--hapa-ease-out);
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    .expand-btn:hover {
      background: var(--hapa-primary-hover);
      transform: translateY(-1px);
      box-shadow: var(--hapa-shadow-medium);
    }
    
    .expand-btn:active {
      transform: translateY(0);
      box-shadow: var(--hapa-shadow-small);
    }
    
    /* 메뉴 드롭다운 */
    .menu-dropdown {
      position: absolute;
      top: 100%;
      right: 0;
      background-color: var(--vscode-menu-background);
      border: 1px solid var(--vscode-menu-border);
      border-radius: 3px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      min-width: 160px;
      z-index: 1000;
      display: none;
      overflow: hidden;
      margin-top: 2px;
      transform: translateX(0);
    }
    
    /* 확장뷰에서 메뉴 드롭다운 z-index 추가 보정 */
    body.expanded-view .menu-dropdown {
      z-index: 1001;
    }
    
    .menu-item {
      padding: 6px 12px;
      font-size: 11px;
      color: var(--vscode-menu-foreground);
      cursor: pointer;
      border: none;
      background: none;
      width: 100%;
      text-align: left;
      transition: background-color 0.15s ease;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .menu-item:hover {
      background-color: var(--vscode-menu-selectionBackground);
      color: var(--vscode-menu-selectionForeground);
    }
    
    .menu-separator {
      height: 1px;
      background-color: var(--vscode-menu-separatorBackground);
      margin: 4px 0;
    }
    
    .connection-status {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 10px;
      color: var(--hapa-description-foreground);
    }
    
    .status-dot {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background-color: var(--hapa-success);
      animation: hapa-pulse 2s infinite;
    }
    
    .sidebar-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background-color: var(--hapa-editor-background);
      transition: background-color var(--hapa-transition-duration) var(--hapa-ease-out);
    }
    
    .section {
      background-color: var(--hapa-editor-background);
      border-bottom: 1px solid var(--hapa-panel-border);
      transition: all var(--hapa-transition-duration) var(--hapa-ease-out);
    }
    
    .request-section {
      padding: 12px;
      border-bottom: 1px solid var(--hapa-panel-border);
      flex-shrink: 0;
      transition: all var(--hapa-transition-duration) var(--hapa-ease-out);
    }
    
    .input-group {
      margin-bottom: 12px;
    }
    
    .input-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
      gap: 8px;
    }
    
    .input-label {
      font-size: 11px;
      font-weight: 500;
      color: var(--hapa-input-foreground);
      flex-shrink: 0;
    }
    
    .question-input {
      width: 100%;
      min-height: 60px;
      padding: 8px;
      border: 1px solid var(--hapa-input-border);
      background-color: var(--hapa-input-background);
      color: var(--hapa-input-foreground);
      font-size: 12px;
      border-radius: 3px;
      resize: vertical;
      transition: border-color var(--hapa-duration-fast) var(--hapa-ease-out),
                  box-shadow var(--hapa-duration-fast) var(--hapa-ease-out),
                  background-color var(--hapa-duration-fast) var(--hapa-ease-out);
    }
    
    .question-input:focus {
      outline: none;
      border-color: var(--hapa-focus-border);
      box-shadow: 0 0 0 2px var(--hapa-primary-light);
      background-color: var(--hapa-input-background);
    }
    
    .action-buttons {
      display: flex;
      gap: 8px;
      margin-top: 8px;
    }
    
    /* 코드 맥락 표시 영역 스타일 */
    .code-context-indicator {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 8px;
      background-color: var(--hapa-secondary-background);
      border: 1px solid var(--hapa-border-light);
      border-radius: 2px;
      font-size: 9px;
      line-height: 1.2;
      transition: all var(--hapa-duration-fast) var(--hapa-ease-out);
      opacity: 0.85;
      flex-shrink: 0;
      min-width: 0;
    }
    
    .code-context-indicator.active {
      background-color: var(--hapa-primary-background);
      border-color: var(--hapa-primary-light);
      opacity: 1;
    }
    
    .code-context-indicator.warning {
      background-color: var(--hapa-warning-background);
      border-color: var(--hapa-warning);
      color: var(--hapa-warning-foreground);
    }
    
    .context-icon {
      font-size: 10px;
      line-height: 1;
      min-width: 10px;
      text-align: center;
      flex-shrink: 0;
    }
    
    .context-info {
      flex: 1;
      min-width: 0;
      max-width: 180px;
    }
    
    .context-message {
      font-weight: 500;
      color: var(--hapa-foreground);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 9px;
    }
    
    .context-details {
      color: var(--hapa-description-foreground);
      margin-top: 1px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 8px;
    }
    
    /* 확장뷰에서의 스타일 조정 */
    body.expanded-view .expand-btn {
      display: none;
    }
    
    /* 확장뷰에서 메뉴 버튼 여백 조정 */
    body.expanded-view .menu-btn {
      margin-right: 0;
    }
    
    body.expanded-view .code-context-indicator {
      padding: 6px 10px;
      font-size: 10px;
      border-radius: 3px;
      max-width: 250px;
    }
    
    body.expanded-view .context-icon {
      font-size: 11px;
      min-width: 11px;
    }
    
    body.expanded-view .context-message {
      font-size: 10px;
    }
    
    body.expanded-view .context-details {
      font-size: 9px;
    }
    
    body.expanded-view .context-info {
      max-width: 220px;
    }
    
    /* 확장뷰에서 탭 버튼 추가 최적화 */
    body.expanded-view .response-tabs {
      padding: 0;
      margin: 0;
    }
    
    body.expanded-view .response-tab {
      padding: 8px 12px;
      font-size: 11px;
      min-height: 32px;
      font-weight: 500;
    }
    
    body.expanded-view .response-tab.active {
      font-weight: 600;
    }
    
    /* 확장뷰에서 버튼 스타일 통일 */
    body.expanded-view .send-btn {
      border-radius: 2px;
    }
    
    body.expanded-view .clear-btn {
      border-radius: 2px;
      border: none;
    }
    
    /* 확장뷰에서 섹션 패딩 통일 */
    body.expanded-view .response-content {
      padding: 8px;
    }
    
    /* 확장뷰에서 입력창 스타일 통일 */
    body.expanded-view .question-input {
      border-radius: 3px;
    }
    
    /* 확장뷰에서 응답창 여백 통일 */
    body.expanded-view .response-display {
      padding: 8px;
    }
    
    /* 확장뷰에서 히스토리 영역 여백 통일 */
    body.expanded-view .history-content {
      padding: 8px;
    }
    
    .send-btn, .clear-btn {
      flex: 1;
      padding: 6px 12px;
      font-size: 11px;
      border: none;
      border-radius: 2px;
      cursor: pointer;
      font-weight: 500;
      transition: all var(--hapa-duration-fast) var(--hapa-ease-out);
      position: relative;
      overflow: hidden;
    }
    
    .send-btn {
      background: var(--hapa-gradient-primary);
      color: white;
    }
    
    .send-btn:hover {
      background: linear-gradient(135deg, #0E639C 0%, #1177BB 100%);
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0, 122, 204, 0.3);
    }
    
    .clear-btn {
      background-color: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
    }
    
    .clear-btn:hover {
      background-color: var(--vscode-button-secondaryHoverBackground);
    }
    
    .response-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      padding: 12px;
    }
    
    .response-tabs {
      display: flex;
      border-bottom: 1px solid var(--vscode-panel-border);
      background-color: var(--vscode-sideBarSectionHeader-background);
      flex-shrink: 0;
      padding: 0;
      margin: 0;
    }
    
    .response-tab {
      flex: 1;
      padding: 6px 8px;
      font-size: 10px;
      font-weight: 500;
      border: none;
      background: transparent;
      color: var(--vscode-tab-inactiveForeground);
      cursor: pointer;
      transition: all 0.15s ease;
      min-height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0;
      border-radius: 0;
    }
    
    .response-tab:hover:not(.active) {
      background-color: var(--vscode-list-hoverBackground);
      color: var(--vscode-foreground);
    }
    
    .response-tab.active {
      color: var(--vscode-tab-activeForeground);
      background-color: var(--vscode-tab-activeBackground);
      border-bottom: 2px solid var(--vscode-focusBorder);
      font-weight: 600;
    }
    
    .response-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    
    .response-display {
      flex: 1;
      background-color: var(--vscode-editor-background);
      border: 1px solid var(--vscode-input-border);
      border-radius: 3px;
      padding: 8px;
      overflow-y: auto;
      font-family: var(--vscode-editor-font-family);
      font-size: var(--vscode-editor-font-size);
      line-height: 1.4;
      white-space: pre-wrap;
      word-break: break-word;
      min-height: 100px;
    }

    .streaming-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      background-color: var(--vscode-list-hoverBackground);
      border-radius: 4px;
      margin: 4px 0;
      border: 1px solid var(--vscode-widget-border);
    }

    .typing-animation {
      display: flex;
      gap: 2px;
    }

    .typing-animation span {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background-color: var(--vscode-progressBar-background);
      animation: typing 1.4s infinite;
    }

    .typing-animation span:nth-child(2) {
      animation-delay: 0.2s;
    }

    .typing-animation span:nth-child(3) {
      animation-delay: 0.4s;
    }

    @keyframes typing {
      0%, 60%, 100% {
        transform: translateY(0);
        opacity: 0.4;
      }
      30% {
        transform: translateY(-10px);
        opacity: 1;
      }
    }

    .streaming-text {
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
    }

    .response-text {
      font-family: var(--vscode-editor-font-family);
      font-size: var(--vscode-editor-font-size);
      line-height: 1.4;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .code-block {
      background-color: var(--vscode-textCodeBlock-background);
      border: 1px solid var(--vscode-widget-border);
      border-radius: 4px;
      padding: 8px;
      margin: 4px 0;
      font-family: var(--vscode-editor-font-family);
      overflow-x: auto;
    }
    
    .code-block pre {
      margin: 0;
      white-space: pre-wrap;
      word-break: break-word;
    }
    
    .code-block code {
      font-family: var(--vscode-editor-font-family);
      font-size: var(--vscode-editor-font-size);
      color: var(--vscode-editor-foreground);
      background: none;
      padding: 0;
    }
    
    .inline-code {
      background-color: var(--vscode-textCodeBlock-background);
      color: var(--vscode-editor-foreground);
      padding: 2px 4px;
      border-radius: 3px;
      font-family: var(--vscode-editor-font-family);
      font-size: 11px;
      border: 1px solid var(--vscode-widget-border);
    }

    .explanation-block {
      color: var(--vscode-descriptionForeground);
      font-style: italic;
      margin: 4px 0;
    }

    .response-actions {
      display: flex;
      gap: 6px;
      margin-top: 8px;
      flex-shrink: 0;
    }

    .action-btn {
      flex: 1;
      padding: 6px 8px;
      font-size: 10px;
      border: none;
      border-radius: 2px;
      cursor: pointer;
      background-color: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
    }

    .action-btn:hover {
      background-color: var(--vscode-button-secondaryHoverBackground);
    }

    .error-message {
      color: var(--vscode-errorForeground);
      background-color: var(--vscode-inputValidation-errorBackground);
      border: 1px solid var(--vscode-inputValidation-errorBorder);
      border-radius: 3px;
      padding: 8px;
      margin: 4px 0;
      font-size: 11px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    
    .response-empty {
      text-align: center;
      padding: 32px 16px;
      color: var(--vscode-descriptionForeground);
    }
    
    .empty-icon {
      font-size: 32px;
      margin-bottom: 12px;
      opacity: 0.5;
    }
    
    .empty-title {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    
    .empty-description {
      font-size: 11px;
      line-height: 1.4;
    }
    
    .response-item {
      margin-bottom: 16px;
      padding: 12px;
      background-color: var(--vscode-editor-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 4px;
    }
    
    .question-text {
      font-size: 12px;
      font-weight: 600;
      color: var(--vscode-foreground);
      margin-bottom: 8px;
      padding: 8px;
      background-color: var(--vscode-input-background);
      border-radius: 3px;
      border-left: 3px solid var(--vscode-focusBorder);
    }
    
    .code-actions {
      display: flex;
      gap: 6px;
      margin-top: 8px;
    }
    
    .insert-btn {
      background: linear-gradient(135deg, #007ACC 0%, #0E639C 100%);
      color: white;
    }
    
    .insert-btn:hover {
      background: linear-gradient(135deg, #0E639C 0%, #1177BB 100%);
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0, 122, 204, 0.3);
    }
    
    .copy-btn {
      background-color: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
    }
    
    .copy-btn:hover {
      background-color: var(--vscode-button-secondaryHoverBackground);
    }
    
    .explanation {
      font-size: 12px;
      color: var(--vscode-foreground);
      line-height: 1.4;
      margin-top: 8px;
      padding: 8px;
      background-color: var(--vscode-textCodeBlock-background);
      border-radius: 3px;
      border-left: 3px solid #4CAF50;
    }
    
    .loading {
      text-align: center;
      padding: 20px;
      color: var(--vscode-descriptionForeground);
    }
    
    .loading-spinner {
      display: inline-block;
      width: 20px;
      height: 20px;
      border: 2px solid var(--vscode-progressBar-background);
      border-radius: 50%;
      border-top-color: var(--vscode-focusBorder);
      animation: spin 1s ease-in-out infinite;
      margin-bottom: 8px;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .error {
      color: var(--vscode-errorForeground);
      background-color: var(--vscode-inputValidation-errorBackground);
      border: 1px solid var(--vscode-inputValidation-errorBorder);
      padding: 8px;
      border-radius: 3px;
      font-size: 12px;
      margin: 8px 0;
    }
    
    /* 반응형 레이아웃 - 500px 이상일 때 좌우 레이아웃 */
    @media (min-width: 500px) {
      .sidebar-container {
        max-width: none;
        min-width: 500px;
      }
      
      .sidebar-header {
        padding: 12px 16px;
        min-height: 40px;
      }
      
      .sidebar-title {
        font-size: 14px;
        gap: 8px;
      }
      
      .sidebar-icon {
        width: 18px;
        height: 18px;
        border-radius: 3px;
        font-size: 10px;
      }
      
      .expand-btn {
        padding: 6px 12px;
        font-size: 12px;
        gap: 6px;
      }
      
      /* 메인 콘텐츠를 좌우 레이아웃으로 변경 */
      .sidebar-main {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        padding: 8px;
        overflow: hidden;
      }
      
      .request-section {
        padding: 16px;
        border-bottom: none;
        border-right: 1px solid var(--vscode-panel-border);
        border-radius: 6px;
        background-color: var(--vscode-editor-background);
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow-y: auto;
      }
      
      .input-group {
        margin-bottom: 12px;
        flex: 1;
        display: flex;
        flex-direction: column;
      }
      
      .question-input {
        min-height: 120px;
        font-size: 13px;
        padding: 12px;
        flex: 1;
        resize: none;
      }
      
      .action-buttons {
        display: flex;
        gap: 8px;
        margin-top: 12px;
        justify-content: flex-end;
        flex-shrink: 0;
      }
      
      .send-btn, .clear-btn {
        flex: none;
        padding: 6px 12px;
        font-size: 11px;
        min-width: 60px;
      }
      
      .response-section {
        margin: 0;
        border-radius: 6px;
        background-color: var(--vscode-editor-background);
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow: hidden;
      }
      
      .response-tabs {
        padding: 0;
        justify-content: flex-start;
        gap: 0;
        border-bottom: 1px solid var(--vscode-panel-border);
        background-color: var(--vscode-sideBarSectionHeader-background);
        flex-shrink: 0;
        display: flex;
      }
      
      .response-tab {
        padding: 6px 8px;
        font-size: 10px;
        min-width: 60px;
        min-height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0;
        border-radius: 0;
        flex: 1;
      }
      
      .response-content {
        padding: 8px;
        flex: 1;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
      }
      
      .response-display {
        flex: 1;
        min-height: 0;
      }
      
      .response-item {
        padding: 12px;
        margin-bottom: 16px;
      }
      
      .question-text {
        font-size: 12px;
        padding: 8px;
      }
      
      .explanation {
        font-size: 12px;
        padding: 8px;
      }
      
      .code-actions {
        gap: 6px;
        margin-top: 8px;
      }
      
      .insert-btn, .copy-btn {
        padding: 4px 8px;
        font-size: 10px;
      }
      
      .connection-status {
        font-size: 11px;
        gap: 6px;
      }
      
      .status-dot {
        width: 6px;
        height: 6px;
      }
      
      /* 반응형 관련 추가 스타일 */
      .response-empty {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
      }
      
      .empty-icon {
        font-size: 32px;
        margin-bottom: 12px;
        opacity: 0.6;
      }
      
      .empty-title {
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 6px;
      }
      
      .empty-description {
        font-size: 11px;
        line-height: 1.4;
      }
    }
    
    /* 더 넓은 화면을 위한 추가 최적화 */
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
      
      .request-section {
        padding: 24px;
        background: var(--vscode-editor-background);
      }
      
      .response-section {
        padding: 24px;
      }
      
      .question-input {
        border: 2px solid var(--vscode-input-border);
        border-radius: 3px;
        transition: border-color 0.2s ease;
      }
      
      .question-input:focus {
        border-color: var(--vscode-focusBorder);
        box-shadow: 0 0 0 2px rgba(14, 99, 156, 0.2);
      }
      
      .send-btn {
        background: linear-gradient(135deg, #007ACC 0%, #40A9FF 100%);
        border-radius: 2px;
        box-shadow: 0 2px 4px rgba(0, 122, 204, 0.2);
      }
      
      .send-btn:hover {
        background: linear-gradient(135deg, #0E639C 0%, #36A2EB 100%);
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0, 122, 204, 0.3);
      }
      
      .clear-btn {
        border-radius: 2px;
        border: none;
      }
      
      .response-display {
        padding: 8px;
      }
      
      .history-content {
        padding: 8px;
      }
    }
    
    /* 히스토리 스타일 */
    .history-content {
      padding: 8px;
      height: 100%;
      overflow-y: auto;
    }
    
    .history-item {
      background: var(--vscode-editor-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 3px;
      padding: 10px;
      margin-bottom: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
    }
    
    .history-item:hover {
      background: var(--vscode-list-hoverBackground);
      border-color: var(--vscode-focusBorder);
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .history-question {
      font-size: 13px;
      line-height: 1.4;
      margin-bottom: 6px;
      color: var(--vscode-editor-foreground);
      word-break: break-word;
      font-weight: 500;
    }
    
    .history-response {
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
      margin-bottom: 4px;
      line-height: 1.3;
      font-family: var(--vscode-editor-font-family);
      background-color: var(--vscode-textCodeBlock-background);
      padding: 4px 6px;
      border-radius: 3px;
      border-left: 2px solid var(--vscode-focusBorder);
      word-break: break-word;
      max-height: 60px;
      overflow: hidden;
    }
    
    .history-timestamp {
      font-size: 10px;
      color: var(--vscode-descriptionForeground);
      opacity: 0.7;
    }
    
    .history-empty {
      text-align: center;
      padding: 40px 20px;
      color: var(--vscode-descriptionForeground);
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }
    
    /* 히스토리 삭제 버튼 스타일 */
    .history-delete-btn {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 20px;
      height: 20px;
      display: none;
      align-items: center;
      justify-content: center;
      background-color: var(--vscode-errorForeground);
      color: white;
      border-radius: 50%;
      font-size: 10px;
      cursor: pointer;
      transition: all 0.2s ease;
      z-index: 10;
    }
    
    .history-delete-btn:hover {
      background-color: var(--vscode-errorForeground);
      transform: scale(1.1);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
    
    .history-item:hover .history-delete-btn {
      display: flex;
    }
  </style>
</head>
<body>
  <div class="sidebar-container hapa-animate-fade-in" id="sidebarContainer">
    <!-- 헤더 -->
    <div class="sidebar-header hapa-animate-fade-in-down">
      <div class="sidebar-title">
        <div class="sidebar-icon hapa-hover-scale">H</div>
        HAPA AI Assistant
      </div>
      <div class="header-actions hapa-animate-fade-in-right hapa-animate-delay-100">
        <div class="connection-status">
          <div class="status-dot"></div>
          Connected
        </div>
        <button class="expand-btn hapa-button hapa-hover-lift" onclick="openMainDashboard()">
          <span>↗</span>
          Expand
        </button>
        <div class="menu-container" style="position: relative;">
          <button class="menu-btn hapa-button hapa-hover-lift" onclick="toggleMenu()" title="메뉴">
            <span>⋯</span>
          </button>
          <div class="menu-dropdown" id="menuDropdown">
            <button class="menu-item" onclick="clearAllHistory()">
              <span>🗑️</span>
              기록 전체 삭제
            </button>
            <div class="menu-separator"></div>
            <button class="menu-item" onclick="openSettings()">
              <span>⚙️</span>
              설정
            </button>
            <button class="menu-item" onclick="showHelp()">
              <span>❓</span>
              도움말
            </button>
            <div class="menu-separator"></div>
            <button class="menu-item" onclick="refreshConnection()">
              <span>🔄</span>
              연결 새로고침
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 메인 콘텐츠 -->
    <div class="sidebar-main hapa-animate-fade-in-up hapa-animate-delay-200">
      <!-- Request 섹션 -->
      <div class="request-section hapa-animate-fade-in-up hapa-animate-delay-300">
        <div class="input-group">
          <div class="input-header">
            <label class="input-label hapa-animate-fade-in hapa-animate-delay-400">Ask AI Assistant</label>
            <!-- 코드 맥락 표시 영역 -->
            <div class="code-context-indicator hapa-animate-fade-in hapa-animate-delay-600" id="codeContextIndicator">
              <div class="context-icon">📝</div>
              <div class="context-info">
                <div class="context-message">편집기가 열려있지 않습니다</div>
                <div class="context-details"></div>
              </div>
            </div>
          </div>
          <textarea 
            class="question-input hapa-input hapa-focus-ring hapa-animate-scale-in hapa-animate-delay-500" 
            id="questionInput" 
            placeholder="Python 코드 생성에 대해 질문하거나 요청사항을 입력하세요..."
          ></textarea>
        </div>
        <div class="action-buttons hapa-animate-fade-in hapa-animate-delay-500">
          <button class="send-btn hapa-button hapa-hover-lift" onclick="sendQuestion()">전송</button>
          <button class="clear-btn hapa-theme-button-secondary hapa-hover-lift" onclick="clearInput()">지우기</button>
        </div>
      </div>

      <!-- Response 섹션 -->
      <div class="response-section hapa-animate-fade-in hapa-animate-delay-300">
        <div class="response-tabs hapa-animate-fade-in-left hapa-animate-delay-400">
          <button class="response-tab active hapa-transition" onclick="switchTab('response')">응답</button>
          <button class="response-tab hapa-transition" onclick="switchTab('history')">기록</button>
        </div>
        <div class="response-content hapa-animate-scale-in hapa-animate-delay-500" id="responseContent">
          <div class="response-display hapa-transition-opacity" id="responseDisplay"></div>
          <div class="streaming-indicator hapa-animate-pulse" id="streamingIndicator" style="display: none;">
            <div class="typing-animation hapa-typing-indicator">
              <div class="hapa-typing-dot"></div>
              <div class="hapa-typing-dot"></div>
              <div class="hapa-typing-dot"></div>
            </div>
            <span class="streaming-text hapa-animate-fade-in">AI가 응답을 생성하고 있습니다...</span>
          </div>
          <div class="response-actions hapa-animate-fade-in-up" id="responseActions" style="display: none;">
            <button class="action-btn copy-btn hapa-button" onclick="copyResponse()">
              <span class="codicon codicon-copy"></span>
              복사
            </button>
            <button class="action-btn insert-btn hapa-button" onclick="insertResponse()">
              <span class="codicon codicon-insert"></span>
              삽입
            </button>
          </div>
          <div class="response-empty hapa-animate-fade-in" id="responseEmpty">
            <div class="empty-icon">⚡</div>
            <div class="empty-title hapa-theme-text-primary">응답 없음</div>
            <div class="empty-description hapa-theme-text-secondary">
              전송 버튼을 클릭하여 AI 요청을 실행하세요.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    
    // 스트리밍 관련 변수
    let currentStreamingContent = '';
    let isStreaming = false;
    let requestStartTime = 0;
    let questionHistory = []; // extension에서 동기화받을 빈 배열로 초기화
    
    // 페이지 로드 시 히스토리 요청
    function requestHistory() {
      vscode.postMessage({
        command: 'getHistory'
      });
    }
    
    // 확장뷰 여부 확인 및 클래스 추가
    if (window.isExpandedView) {
      document.body.classList.add('expanded-view');
    }
    
    // 페이지 로드 시 히스토리 요청
    requestHistory();
    
    // extension에서 히스토리 동기화 메시지 처리
    function syncHistoryFromExtension(historyData) {
      try {
        questionHistory = JSON.parse(historyData);
        
        // 현재 히스토리 탭이 활성화되어 있다면 새로고침
        const currentTab = document.querySelector('.response-tab.active');
        if (currentTab && currentTab.textContent.includes('기록')) {
          refreshHistoryDisplay();
        }
      } catch (error) {
        console.error('히스토리 동기화 오류:', error);
      }
    }
    
    function refreshHistoryDisplay() {
      const responseContent = document.getElementById('responseContent');
      if (!responseContent) return;
      
      // 히스토리 탭 내용만 새로고침
      let historyHtml = '<div class="history-content hapa-animate-fade-in">';
      
      if (questionHistory.length === 0) {
        historyHtml += '<div class="history-empty hapa-animate-fade-in hapa-theme-text-secondary"><p>아직 질문 기록이 없습니다.</p></div>';
      } else {
        questionHistory.forEach((item, index) => {
          const shortResponse = item.response && item.response.length > 100 ? 
            item.response.substring(0, 100) + '...' : 
            (item.response || '응답 없음');
          
          historyHtml += \`
            <div class="history-item hapa-list-item hapa-hover-lift hapa-animate-fade-in-left hapa-animate-delay-\${Math.min(index * 100, 500)}" onclick="replayResponse('\${escapeHtml(item.response)}')">
              <div class="history-question hapa-theme-text-primary">\${escapeHtml(item.question)}</div>
              <div class="history-response hapa-theme-text-secondary">\${escapeHtml(shortResponse)}</div>
              <div class="history-timestamp hapa-theme-text-tertiary">\${item.timestamp}</div>
              <div class="history-delete-btn" onclick="deleteHistoryItem(event, \${index})" title="삭제">🗑️</div>
            </div>
          \`;
        });
      }
      
      historyHtml += '</div>';
      responseContent.innerHTML = historyHtml;
    }
    
    function sendQuestion() {
      const input = document.getElementById('questionInput');
      const question = input.value.trim();
      
      if (!question) {
        return;
      }
      
      // 현재 탭이 히스토리 탭이면 응답 탭으로 자동 전환
      const currentTab = document.querySelector('.response-tab.active');
      const isHistoryTab = currentTab && currentTab.textContent.includes('기록');
      
      if (isHistoryTab) {
        // 히스토리 탭에서 전송 시: 탭 전환 완료 후 전송 로직 실행
        switchTab('response', null, () => {
          executeQuestionSend(question);
        });
        input.value = '';
        return;
      }
      
      // 응답 탭에서 직접 전송
      executeQuestionSend(question);
      input.value = '';
    }
    
    function executeQuestionSend(question) {
      // 요청 시작 시간 기록
      requestStartTime = Date.now();
      
      // UI 초기화 및 스트리밍 시작
      resetResponseDisplay();
      showStreamingIndicator();
      
      isStreaming = true;
      currentStreamingContent = '';
      
      // 현재 질문을 임시 저장 (응답 완료 시 히스토리에 추가)
      window.currentQuestion = question;
      
      vscode.postMessage({
        command: 'generateCodeStreaming',
        question: question
      });
    }
    
    function resetResponseDisplay() {
      const responseDisplay = document.getElementById('responseDisplay');
      const responseActions = document.getElementById('responseActions');
      const responseEmpty = document.getElementById('responseEmpty');
      
      // DOM 요소 존재 확인
      if (!responseDisplay) {
        console.warn('responseDisplay 요소를 찾을 수 없습니다.');
        return;
      }
      
      // 부드러운 페이드아웃 애니메이션 추가
      responseDisplay.classList.add('hapa-animate-fade-out');
      if (responseActions) {
        responseActions.classList.add('hapa-animate-fade-out');
      }
      
      setTimeout(() => {
        responseDisplay.innerHTML = '';
        if (responseActions) {
          responseActions.style.display = 'none';
        }
        if (responseEmpty) {
          responseEmpty.style.display = 'none';
        }
        currentStreamingContent = '';
        
        // 애니메이션 클래스 제거
        responseDisplay.classList.remove('hapa-animate-fade-out');
        if (responseActions) {
          responseActions.classList.remove('hapa-animate-fade-out');
        }
      }, 150);
    }
    
    function showStreamingIndicator() {
      const indicator = document.getElementById('streamingIndicator');
      
      // DOM 요소 존재 확인
      if (!indicator) {
        console.warn('streamingIndicator 요소를 찾을 수 없습니다.');
        return;
      }
      
      indicator.style.display = 'flex';
      indicator.classList.add('hapa-animate-fade-in');
      
      // 타이핑 애니메이션 시작
      setTimeout(() => {
        if (indicator) {
          indicator.classList.remove('hapa-animate-fade-in');
        }
      }, 250);
    }
    
    function hideStreamingIndicator() {
      const indicator = document.getElementById('streamingIndicator');
      indicator.classList.add('hapa-animate-fade-out');
      
      setTimeout(() => {
        indicator.style.display = 'none';
        indicator.classList.remove('hapa-animate-fade-out');
      }, 150);
    }
    
    function appendStreamingContent(chunk) {
      if (!isStreaming) return;
      
      const responseDisplay = document.getElementById('responseDisplay');
      
      // 청크 타입에 따른 처리
      switch (chunk.type) {
        case 'start':
          // 시작 메시지는 표시하지 않음
          break;
          
        case 'token':
        case 'code':
          // 일반 텍스트 또는 코드 토큰
          currentStreamingContent += chunk.content;
          responseDisplay.innerHTML = formatStreamingContent(currentStreamingContent);
          break;
          
        case 'explanation':
          // 설명 부분
          currentStreamingContent += chunk.content;
          responseDisplay.innerHTML = formatStreamingContent(currentStreamingContent);
          break;
          
        case 'done':
          // 스트리밍 완료
          completeStreaming();
          break;
          
        case 'error':
          // 오류 발생
          hideStreamingIndicator();
          showError(chunk.content);
          isStreaming = false;
          
          // 오류 발생 시에도 질문은 히스토리에 저장 (응답은 오류 메시지로)
          if (window.currentQuestion) {
            addToHistory(window.currentQuestion, '오류: ' + chunk.content);
            window.currentQuestion = null;
          }
          break;
      }
      
      // 자동 스크롤
      responseDisplay.scrollTop = responseDisplay.scrollHeight;
    }
    
    function formatStreamingContent(content) {
      // 마크다운 코드 블록과 일반 텍스트를 구분하여 포맷팅
      const codeBlockRegex = /\`\`\`python\\n([\\s\\S]*?)\`\`\`/g;
      let formattedContent = content;
      
      // 코드 블록 처리
      formattedContent = formattedContent.replace(codeBlockRegex, function(match, code) {
        return '<div class="code-block"><pre><code>' + escapeHtml(code) + '</code></pre></div>';
      });
      
      // 일반 텍스트에서 개행 처리
      formattedContent = formattedContent.replace(/\\n/g, '<br>');
      
      return formattedContent;
    }
    
    function escapeHtml(unsafe) {
      return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }
    
    function completeStreaming() {
      isStreaming = false;
      hideStreamingIndicator();
      
      // 응답 완료 시 히스토리에 질문 저장 (중복 검사 포함)
      if (window.currentQuestion && currentStreamingContent) {
        addToHistory(window.currentQuestion, currentStreamingContent);
        window.currentQuestion = null; // 임시 저장 질문 초기화
      }
      
      // 현재 응답 탭이 활성화되어 있는지 확인
      const currentTab = document.querySelector('.response-tab.active');
      const isResponseTab = currentTab && !currentTab.textContent.includes('기록');
      
      if (!isResponseTab) {
        // 히스토리 탭인 경우 응답 탭으로 자동 전환
        switchTab('response');
      }
      
      // 응답 완료 후 UI 업데이트
      const responseDisplay = document.getElementById('responseDisplay');
      if (responseDisplay) {
        responseDisplay.classList.add('hapa-success-enter');
        
        // 응답 시간 계산 및 표시
        if (requestStartTime > 0) {
          const responseTime = ((Date.now() - requestStartTime) / 1000).toFixed(1);
          const timeIndicator = document.createElement('div');
          timeIndicator.className = 'response-time-indicator hapa-animate-fade-in';
          timeIndicator.innerHTML = \`<small style="color: var(--hapa-description-foreground); font-size: 11px; margin-top: 8px; display: block;">⏱️ 응답 시간: \${responseTime}초</small>\`;
          responseDisplay.appendChild(timeIndicator);
        }
      }
      
      // 응답 액션 버튼 표시 (애니메이션과 함께)
      const responseActions = document.getElementById('responseActions');
      if (responseActions) {
        responseActions.style.display = 'flex';
        responseActions.classList.add('hapa-animate-fade-in-up');
      }
      
      // 코드 삽입 강조 효과를 위한 스타일 추가
      const finalResponseDisplay = document.getElementById('responseDisplay');
      if (finalResponseDisplay) {
        const codeBlocks = finalResponseDisplay.querySelectorAll('.code-block');
        codeBlocks.forEach((block, index) => {
          setTimeout(() => {
            block.classList.add('hapa-animate-fade-in-left');
          }, index * 100);
        });
        
        // 애니메이션 클래스 정리
        setTimeout(() => {
          finalResponseDisplay.classList.remove('hapa-success-enter');
          const finalResponseActions = document.getElementById('responseActions');
          if (finalResponseActions) {
            finalResponseActions.classList.remove('hapa-animate-fade-in-up');
          }
          codeBlocks.forEach(block => {
            block.classList.remove('hapa-animate-fade-in-left');
          });
        }, 500);
      }
    }
    
    function showError(message) {
      // 히스토리 탭에서 오류가 발생한 경우 응답 탭으로 전환
      const currentTab = document.querySelector('.response-tab.active');
      const isResponseTab = currentTab && !currentTab.textContent.includes('기록');
      
      if (!isResponseTab) {
        switchTab('response');
      }
      
      const responseDisplay = document.getElementById('responseDisplay');
      if (responseDisplay) {
        responseDisplay.innerHTML = 
          '<div class="error-message hapa-error-enter hapa-theme-text-error" style="padding: 12px; border-radius: 4px; background-color: var(--hapa-error-light); border-left: 4px solid var(--hapa-error-foreground);">' +
            '<span class="codicon codicon-error" style="margin-right: 8px;"></span>' +
            escapeHtml(message) +
          '</div>';
      }
    }
    
    function copyResponse() {
      if (currentStreamingContent) {
        navigator.clipboard.writeText(currentStreamingContent).then(() => {
          vscode.postMessage({
            command: 'showInfo',
            message: '응답이 클립보드에 복사되었습니다.'
          });
        });
      }
    }
    
    function insertResponse() {
      if (currentStreamingContent) {
        // 삽입 버튼에 시각적 피드백 추가
        const insertBtn = document.querySelector('.insert-btn');
        if (insertBtn) {
          insertBtn.classList.add('hapa-animate-bounce');
          insertBtn.style.background = 'var(--hapa-gradient-success)';
          
          setTimeout(() => {
            insertBtn.classList.remove('hapa-animate-bounce');
            insertBtn.style.background = '';
          }, 600);
        }
        
        // 응답 영역에 삽입 성공 애니메이션 추가
        const responseDisplay = document.getElementById('responseDisplay');
        const insertIndicator = document.createElement('div');
        insertIndicator.className = 'insert-indicator hapa-animate-fade-in';
        insertIndicator.innerHTML = '<div style="background: var(--hapa-success-light); color: var(--hapa-success); padding: 8px; border-radius: 4px; font-size: 11px; margin-top: 8px; border-left: 3px solid var(--hapa-success);">✅ 코드가 에디터에 삽입되었습니다</div>';
        responseDisplay.appendChild(insertIndicator);
        
        // 3초 후 인디케이터 제거
        setTimeout(() => {
          insertIndicator.classList.add('hapa-animate-fade-out');
          setTimeout(() => {
            if (insertIndicator.parentNode) {
              insertIndicator.parentNode.removeChild(insertIndicator);
            }
          }, 150);
        }, 3000);
        
        vscode.postMessage({
          command: 'insertCode',
          code: currentStreamingContent
        });
      }
    }
    
    function insertCode(button) {
      const codeBlock = button.closest('.response-item').querySelector('.code-block');
      if (codeBlock) {
        vscode.postMessage({
          command: 'insertCode',
          code: codeBlock.textContent
        });
      }
    }
    
    function copyCode(button) {
      const codeBlock = button.closest('.response-item').querySelector('.code-block');
      if (codeBlock) {
        navigator.clipboard.writeText(codeBlock.textContent);
      }
    }
    
    function switchTab(tab, eventTarget = null, callback = null) {
      const tabs = document.querySelectorAll('.response-tab');
      tabs.forEach(t => {
        t.classList.remove('active');
        t.classList.add('hapa-transition');
      });
      
      // 활성 탭에 애니메이션 효과 추가
      const targetElement = eventTarget || document.querySelector(\`.response-tab[data-tab="\${tab}"]\`) || 
                           document.querySelector(\`.response-tab\${tab === 'history' ? ':last-child' : ':first-child'}\`);
      if (targetElement) {
        targetElement.classList.add('active', 'hapa-animate-scale-in');
        setTimeout(() => {
          targetElement.classList.remove('hapa-animate-scale-in');
        }, 250);
      }
      
      const responseContent = document.getElementById('responseContent');
      
      // 페이드아웃 애니메이션 후 콘텐츠 변경
      responseContent.classList.add('hapa-animate-fade-out');
      
      setTimeout(() => {
        if (tab === 'history') {
          // 히스토리 표시
          let historyHtml = '<div class="history-content hapa-animate-fade-in">';
          
          if (questionHistory.length === 0) {
            historyHtml += '<div class="history-empty hapa-animate-fade-in hapa-theme-text-secondary"><p>아직 질문 기록이 없습니다.</p></div>';
          } else {
            questionHistory.forEach((item, index) => {
              const shortResponse = item.response && item.response.length > 100 ? 
                item.response.substring(0, 100) + '...' : 
                (item.response || '응답 없음');
              
              historyHtml += \`
                <div class="history-item hapa-list-item hapa-hover-lift hapa-animate-fade-in-left hapa-animate-delay-\${Math.min(index * 100, 500)}" onclick="replayResponse('\${escapeHtml(item.response)}')">
                  <div class="history-question hapa-theme-text-primary">\${escapeHtml(item.question)}</div>
                  <div class="history-response hapa-theme-text-secondary">\${escapeHtml(shortResponse)}</div>
                  <div class="history-timestamp hapa-theme-text-tertiary">\${item.timestamp}</div>
                  <div class="history-delete-btn" onclick="deleteHistoryItem(event, \${index})" title="삭제">🗑️</div>
                </div>
              \`;
            });
          }
          
          historyHtml += '</div>';
          responseContent.innerHTML = historyHtml;
        } else {
          // 응답 탭으로 되돌아가기
          responseContent.innerHTML = \`
            <div class="response-display hapa-animate-fade-in" id="responseDisplay">\${currentStreamingContent ? formatStreamingContent(currentStreamingContent) : ''}</div>
            <div class="streaming-indicator hapa-animate-pulse" id="streamingIndicator" style="display: none;">
              <div class="typing-animation hapa-typing-indicator">
                <div class="hapa-typing-dot"></div>
                <div class="hapa-typing-dot"></div>
                <div class="hapa-typing-dot"></div>
              </div>
              <span class="streaming-text hapa-animate-fade-in">AI가 응답을 생성하고 있습니다...</span>
            </div>
            <div class="response-actions hapa-animate-fade-in-up" id="responseActions" style="display: \${currentStreamingContent ? 'flex' : 'none'};">
              <button class="action-btn copy-btn hapa-button hapa-hover-lift" onclick="copyResponse()">
                <span class="codicon codicon-copy"></span>
                복사
              </button>
              <button class="action-btn insert-btn hapa-button hapa-hover-lift" onclick="insertResponse()">
                <span class="codicon codicon-insert"></span>
                삽입
              </button>
            </div>
            \${!currentStreamingContent ? '<div class="response-empty hapa-animate-fade-in" id="responseEmpty"><div class="empty-icon hapa-animate-bounce">⚡</div><div class="empty-title hapa-theme-text-primary">응답 없음</div><div class="empty-description hapa-theme-text-secondary">전송 버튼을 클릭하여 AI 요청을 실행하세요.</div></div>' : ''}
          \`;
        }
        
        // 페이드인 애니메이션
        responseContent.classList.remove('hapa-animate-fade-out');
        responseContent.classList.add('hapa-animate-fade-in');
        
        setTimeout(() => {
          responseContent.classList.remove('hapa-animate-fade-in');
          // 탭 전환 완료 후 콜백 실행
          if (callback && typeof callback === 'function') {
            callback();
          }
        }, 250);
      }, 150);
    }
    
    function replayQuestion(question) {
      const input = document.getElementById('questionInput');
      input.value = question;
      switchTab('response');
      // 히스토리에서 질문 선택 시 자동으로 전송
      setTimeout(() => {
        sendQuestion();
      }, 100);
    }
    
    function replayResponse(response) {
      const input = document.getElementById('questionInput');
      input.value = response;
      switchTab('response');
      // 사용자가 수정할 수 있도록 자동 전송하지 않음
      // 입력창에 포커스를 주어 사용자가 수정할 수 있도록 함
      setTimeout(() => {
        input.focus();
        // 텍스트 끝으로 커서 이동
        input.setSelectionRange(input.value.length, input.value.length);
      }, 150);
    }
    
    function deleteHistoryItem(event, index) {
      // 이벤트 버블링 방지 (카드 클릭 이벤트가 실행되지 않도록)
      event.stopPropagation();
      
      // 확인 대화상자 없이 바로 삭제
      vscode.postMessage({
        command: 'deleteHistoryItem',
        index: index
      });
    }
    
    function addToHistory(question, response) {
      // Extension으로 히스토리 추가 요청 전송
      vscode.postMessage({
        command: 'addToHistory',
        question: question,
        response: response
      });
    }

    function clearInput() {
      document.getElementById('questionInput').value = '';
    }
    
    function openMainDashboard() {
      vscode.postMessage({
        command: 'openMainDashboard'
      });
    }
    
    // 메뉴 관련 함수들
    function toggleMenu() {
      const dropdown = document.getElementById('menuDropdown');
      const isVisible = dropdown.style.display === 'block';
      
      if (isVisible) {
        dropdown.style.display = 'none';
      } else {
        dropdown.style.display = 'block';
      }
    }
    
    // 메뉴 외부 클릭 시 닫기
    document.addEventListener('click', function(event) {
      const menuContainer = event.target.closest('.menu-container');
      const dropdown = document.getElementById('menuDropdown');
      
      if (!menuContainer && dropdown) {
        dropdown.style.display = 'none';
      }
    });
    
    function clearAllHistory() {
      vscode.postMessage({
        command: 'confirmClearAllHistory'
      });
      document.getElementById('menuDropdown').style.display = 'none';
    }
    
    function openSettings() {
      vscode.postMessage({
        command: 'openUserSettings'
      });
      document.getElementById('menuDropdown').style.display = 'none';
    }
    
    function showHelp() {
      vscode.postMessage({
        command: 'showGuide'
      });
      document.getElementById('menuDropdown').style.display = 'none';
    }
    
    function refreshConnection() {
      vscode.postMessage({
        command: 'refreshConnection'
      });
      document.getElementById('menuDropdown').style.display = 'none';
    }
    
    // 통합 메시지 수신 처리
    window.addEventListener('message', event => {
      const message = event.data;
      
      switch (message.command) {
        // 스트리밍 관련 메시지
        case 'streamingChunk':
          appendStreamingContent(message.chunk);
          break;
          
        case 'streamingComplete':
          completeStreaming();
          // 히스토리 저장은 completeStreaming에서 처리하므로 여기서는 중복 처리하지 않음
          break;
          
        case 'streamingError':
          hideStreamingIndicator();
          showError(message.error);
          isStreaming = false;
          // 오류 시에도 히스토리에 저장
          if (window.currentQuestion) {
            addToHistory(window.currentQuestion, '오류: ' + message.error);
            window.currentQuestion = null;
          }
          break;
        
        // AI 응답 관련 메시지
        case 'addAIResponse':
          addAIResponse(message.response);
          break;
          
        // UI 상태 관련 메시지
        case 'showLoading':
          showLoading(message.message);
          break;
          
        case 'showError':
          showError(message.error);
          break;
          
        case 'insertSuccess':
          showInsertSuccess(message.message);
          break;
          
        // 히스토리 동기화 메시지
        case 'syncHistory':
          syncHistoryFromExtension(message.history);
          break;
          
        // 코드 맥락 업데이트 메시지
        case 'updateCodeContext':
          updateCodeContextDisplay(message.context);
          break;
          
        // 히스토리 삭제 확인 메시지
        case 'historyDeleted':
          // 히스토리가 삭제되면 자동으로 syncHistory 메시지가 올 것이므로 별도 처리 불필요
          break;
          
        default:
          console.warn('알 수 없는 메시지 명령:', message.command);
          break;
      }
    });
    
    function addAIResponse(response) {
      const content = document.getElementById('responseContent');
      
      // 처음 응답인 경우 empty 상태 제거
      if (content.querySelector('.response-empty')) {
        content.innerHTML = '';
      }
      
      const responseHtml = \`
        <div class="response-item">
          <div class="question-text">\${response.originalQuestion || 'AI 요청'}</div>
          <div class="code-block">\${response.generated_code || response.code || '코드가 생성되지 않았습니다.'}</div>
          <div class="code-actions">
            <button class="action-btn insert-btn" onclick="insertCode(this)">삽입</button>
            <button class="action-btn copy-btn" onclick="copyCode(this)">복사</button>
          </div>
          \${response.explanation ? \`<div class="explanation">\${response.explanation}</div>\` : ''}
        </div>
      \`;
      
      content.insertAdjacentHTML('afterbegin', responseHtml);
    }
    
    function showLoading(message) {
      const content = document.getElementById('responseContent');
      content.innerHTML = \`
        <div class="loading">
          <div class="loading-spinner"></div>
          <div>\${message}</div>
        </div>
      \`;
    }
    
    function showError(error) {
      const content = document.getElementById('responseContent');
      content.innerHTML = \`
        <div class="error">
          오류가 발생했습니다: \${error}
        </div>
      \`;
    }
    
    function showInsertSuccess(message) {
      // 성공 메시지를 임시로 표시
      const statusDiv = document.createElement('div');
      statusDiv.className = 'insert-success';
      statusDiv.style.cssText = \`
        position: fixed;
        top: 10px;
        right: 10px;
        background: #4CAF50;
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 12px;
        z-index: 1000;
      \`;
      statusDiv.textContent = message;
      document.body.appendChild(statusDiv);
      
      setTimeout(() => {
        document.body.removeChild(statusDiv);
      }, 3000);
    }
    
    /**
     * 코드 맥락 표시 업데이트
     */
    function updateCodeContextDisplay(contextInfo) {
      const indicator = document.getElementById('codeContextIndicator');
      if (!indicator) {
        console.warn('코드 맥락 표시 요소를 찾을 수 없습니다.');
        return;
      }
      
      const iconElement = indicator.querySelector('.context-icon');
      const messageElement = indicator.querySelector('.context-message');
      const detailsElement = indicator.querySelector('.context-details');
      
      if (!iconElement || !messageElement || !detailsElement) {
        console.warn('코드 맥락 표시 하위 요소를 찾을 수 없습니다.');
        return;
      }
      
      // 아이콘 업데이트
      iconElement.textContent = contextInfo.icon || '📝';
      
      // 메시지 업데이트
      messageElement.textContent = contextInfo.message || '상태 정보 없음';
      
      // 세부 정보 업데이트
      detailsElement.textContent = contextInfo.details || '';
      
      // 스타일 클래스 업데이트
      indicator.classList.remove('active', 'warning');
      
      if (contextInfo.hasContext) {
        indicator.classList.add('active');
      } else if (contextInfo.message && contextInfo.message.includes('지원되지 않는')) {
        indicator.classList.add('warning');
      }
      
      // 부드러운 애니메이션 효과
      indicator.style.transform = 'scale(1.02)';
      setTimeout(() => {
        indicator.style.transform = 'scale(1)';
      }, 150);
    }
    
    // 키보드 단축키 설정 함수
    function setupKeyboardEvents() {
      const questionInput = document.getElementById('questionInput');
      if (questionInput && !questionInput.hasAttribute('data-keyboard-setup')) {
        // 중복 설정 방지를 위한 마커 추가
        questionInput.setAttribute('data-keyboard-setup', 'true');
        
        questionInput.addEventListener('keydown', (e) => {
          // Enter: 전송 (Shift+Enter: 새 줄)
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendQuestion();
          }
          // Ctrl+Enter: 강제 전송 (멀티라인에서도)
          else if (e.key === 'Enter' && e.ctrlKey) {
            e.preventDefault();
            sendQuestion();
          }
          // Escape: 입력 지우기
          else if (e.key === 'Escape') {
            clearInput();
          }
          // Ctrl+/: 입력창 포커스
          else if (e.key === '/' && e.ctrlKey) {
            e.preventDefault();
            questionInput.focus();
          }
        });
      }
    }
    
    // 키보드 이벤트 즉시 설정 시도
    setupKeyboardEvents();
    
    // DOM 로드 완료 시에도 설정 (안전장치)
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', setupKeyboardEvents);
    }
    
    // MutationObserver를 사용하여 DOM 변경 시에도 설정
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList') {
          setupKeyboardEvents();
        }
      });
    });
    
    // body 요소 관찰 시작
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    }
  </script>
</body>
</html>
    `;
  }
}
