"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SidebarHtmlGenerator = void 0;
const SidebarComponents_1 = require("./components/SidebarComponents");
const SidebarStyles_1 = require("./styles/SidebarStyles");
const SidebarScripts_1 = require("./scripts/SidebarScripts");
/**
 * 사이드바 HTML 생성기 - 분할된 컴포넌트들을 조합
 */
class SidebarHtmlGenerator {
    static generateSidebarHtml() {
        return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; font-src vscode-resource:;">
    <title>HAPA</title>
  <style>
        ${SidebarStyles_1.SidebarStyles.generateCSS()}
  </style>
</head>
<body>
    ${SidebarComponents_1.SidebarComponents.generateMainContainer()}

  <script>
        ${SidebarScripts_1.SidebarScripts.generateJS()}
    </script>
</body>
</html>
    `.trim();
    }
    /**
     * 확장 뷰용 HTML 생성 (좌우 레이아웃, 확장 버튼 제거)
     */
    static generateExpandedViewHtml() {
        return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; font-src vscode-resource:;">
    <title>HAPA</title>
  <style>
        ${SidebarStyles_1.SidebarStyles.generateCSS()}
        ${SidebarStyles_1.SidebarStyles.generateExpandedViewCSS()}
  </style>
</head>
<body>
    ${SidebarComponents_1.SidebarComponents.generateExpandedMainContainer()}

  <script>
        ${SidebarScripts_1.SidebarScripts.generateJS()}
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
    static generateMainSidebarHtml() {
        return this.generateSidebarHtml();
    }
}
exports.SidebarHtmlGenerator = SidebarHtmlGenerator;
//# sourceMappingURL=SidebarHtmlGenerator.js.map