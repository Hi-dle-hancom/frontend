import { SidebarComponents } from "./components/SidebarComponents";
import { SidebarStyles } from "./styles/SidebarStyles";
import { SidebarScripts } from "./scripts/SidebarScripts";

/**
 * 사이드바 HTML 생성기 - 분할된 컴포넌트들을 조합
 */
export class SidebarHtmlGenerator {
  static generateSidebarHtml(): string {
    return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; font-src vscode-resource:;">
    <title>HAPA AI Assistant</title>
  <style>
        ${SidebarStyles.generateCSS()}
  </style>
</head>
<body>
    ${SidebarComponents.generateMainContainer()}

  <script>
        ${SidebarScripts.generateJS()}
    </script>
</body>
</html>
    `.trim();
  }

  /**
   * 확장 뷰용 HTML 생성 (좌우 레이아웃, 확장 버튼 제거)
   */
  static generateExpandedViewHtml(): string {
    return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; font-src vscode-resource:;">
    <title>HAPA AI Assistant - Expanded View</title>
  <style>
        ${SidebarStyles.generateCSS()}
        ${SidebarStyles.generateExpandedViewCSS()}
  </style>
</head>
<body>
    ${SidebarComponents.generateExpandedMainContainer()}

  <script>
        ${SidebarScripts.generateJS()}
        // 확장 뷰 플래그 설정
        window.isExpandedView = true;
    </script>
</body>
</html>
    `.trim();
  }

  /**
   * 레거시 지원을 위한 메서드 (기존 코드 호환성)
   */
  static generateMainSidebarHtml(): string {
    return this.generateSidebarHtml();
  }
}
