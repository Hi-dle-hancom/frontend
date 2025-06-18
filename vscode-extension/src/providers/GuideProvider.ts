import * as vscode from "vscode";
import { BaseWebviewProvider } from "./BaseWebviewProvider";

/**
 * 가이드 뷰를 제공하는 프로바이더 클래스
 */
export class GuideProvider extends BaseWebviewProvider {
  protected getHtmlContent(webview: vscode.Webview): string {
    return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HAPA 가이드</title>
  <style>
    body {
      font-family: var(--vscode-font-family);
      background-color: var(--vscode-editor-background);
      color: var(--vscode-editor-foreground);
      padding: 20px;
      line-height: 1.6;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
    }
    h1 {
      color: var(--vscode-editor-foreground);
      border-bottom: 2px solid var(--vscode-focusBorder);
      padding-bottom: 10px;
      margin-bottom: 30px;
    }
    h2 {
      color: var(--vscode-editor-foreground);
      margin-top: 30px;
      margin-bottom: 15px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .step-number {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      background: linear-gradient(135deg, #007ACC 0%, #0E639C 100%);
      color: white;
      border-radius: 50%;
      font-size: 12px;
      font-weight: bold;
    }
    .feature-list {
      list-style: none;
      padding: 0;
    }
    .feature-item {
      background-color: var(--vscode-sideBarSectionHeader-background);
      margin-bottom: 10px;
      padding: 15px;
      border-radius: 6px;
      border-left: 4px solid var(--vscode-focusBorder);
    }
    .feature-title {
      font-weight: bold;
      color: var(--vscode-editor-foreground);
      margin-bottom: 5px;
    }
    .feature-desc {
      color: var(--vscode-descriptionForeground);
      font-size: 14px;
    }
    .code-example {
      background-color: var(--vscode-textCodeBlock-background);
      border: 1px solid var(--vscode-panel-border);
      padding: 15px;
      border-radius: 6px;
      font-family: var(--vscode-editor-font-family);
      font-size: 13px;
      margin: 15px 0;
      overflow-x: auto;
    }
    .tip {
      background-color: var(--vscode-inputValidation-infoBackground);
      border: 1px solid var(--vscode-inputValidation-infoBorder);
      padding: 12px;
      border-radius: 6px;
      margin: 15px 0;
    }
    .tip-icon {
      color: var(--vscode-focusBorder);
      font-weight: bold;
      margin-right: 8px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚀 HAPA 사용 가이드</h1>
    
    <h2><span class="step-number">1</span> 시작하기</h2>
    <p>HAPA는 VSCode에서 Python 개발을 도와주는 AI 어시스턴트입니다. Activity Bar에서 HAPA 아이콘을 클릭하여 사이드바를 열 수 있습니다.</p>
    
    <h2><span class="step-number">2</span> 주요 기능</h2>
    <ul class="feature-list">
      <li class="feature-item">
        <div class="feature-title">🎯 코드 생성</div>
        <div class="feature-desc">자연어로 요청하면 Python 코드를 자동 생성합니다</div>
      </li>
      <li class="feature-item">
        <div class="feature-title">⚡ 자동 완성</div>
        <div class="feature-desc">타이핑 중인 코드를 지능적으로 완성해줍니다</div>
      </li>
      <li class="feature-item">
        <div class="feature-title">🔧 코드 분석</div>
        <div class="feature-desc">선택한 코드를 분석하고 개선 사항을 제안합니다</div>
      </li>
      <li class="feature-item">
        <div class="feature-title">📝 테스트 생성</div>
        <div class="feature-desc">함수나 클래스에 대한 테스트 코드를 자동 생성합니다</div>
      </li>
    </ul>

    <h2><span class="step-number">3</span> 사용 방법</h2>
    
    <h3>📱 사이드바에서 질문하기</h3>
            <p>사이드바의 입력창에 원하는 작업을 자연어로 입력하고 전송 버튼을 클릭하세요.</p>
    <div class="code-example">
예시: "피보나치 수열을 계산하는 함수를 만들어주세요"
예시: "리스트에서 중복을 제거하는 코드가 필요해요"
예시: "파일을 읽어서 JSON으로 파싱하는 방법을 알려주세요"
    </div>

    <h3>🖱️ 컨텍스트 메뉴 사용하기</h3>
    <p>코드를 선택한 후 마우스 우클릭을 하면 HAPA 메뉴가 나타납니다.</p>
    <ul class="feature-list">
      <li class="feature-item">
        <div class="feature-title">HAPA: 선택 영역 분석</div>
        <div class="feature-desc">선택한 코드를 분석하고 개선점을 제안합니다</div>
      </li>
      <li class="feature-item">
        <div class="feature-title">HAPA: 테스트 생성</div>
        <div class="feature-desc">선택한 함수/클래스의 테스트 코드를 생성합니다</div>
      </li>
      <li class="feature-item">
        <div class="feature-title">HAPA: 코드 설명</div>
        <div class="feature-desc">복잡한 코드의 동작 원리를 설명합니다</div>
      </li>
    </ul>

    <h2><span class="step-number">4</span> 유용한 팁</h2>
    
    <div class="tip">
      <span class="tip-icon">💡</span>
      <strong>구체적으로 요청하세요:</strong> "리스트 정렬"보다는 "숫자 리스트를 오름차순으로 정렬하는 함수"라고 구체적으로 요청하면 더 정확한 결과를 얻을 수 있습니다.
    </div>

    <div class="tip">
      <span class="tip-icon">⚡</span>
      <strong>컨텍스트 활용:</strong> 현재 작업 중인 파일의 내용을 자동으로 분석하여 더 적절한 코드를 생성합니다.
    </div>

    <div class="tip">
      <span class="tip-icon">🎯</span>
      <strong>코드 삽입:</strong> AI가 생성한 코드는 Insert 버튼을 클릭하여 현재 커서 위치에 바로 삽입할 수 있습니다.
    </div>

    <h2><span class="step-number">5</span> 키보드 단축키</h2>
    <div class="code-example">
Command Palette에서 "HAPA"를 검색하여 다양한 명령어를 사용할 수 있습니다:

- HAPA: 시작하기 - 확장 프로그램 활성화
- HAPA: 설정 - 설정 패널 열기  
- HAPA: 웹사이트 방문 - 랜딩페이지 열기
    </div>

    <h2><span class="step-number">6</span> 문제 해결</h2>
    <ul class="feature-list">
      <li class="feature-item">
        <div class="feature-title">응답이 느린 경우</div>
        <div class="feature-desc">복잡한 요청은 처리 시간이 오래 걸릴 수 있습니다. 잠시 기다려주세요.</div>
      </li>
      <li class="feature-item">
        <div class="feature-title">연결 오류가 발생하는 경우</div>
        <div class="feature-desc">백엔드 서버가 실행 중인지 확인하고, 네트워크 연결을 점검해주세요.</div>
      </li>
      <li class="feature-item">
        <div class="feature-title">코드가 예상과 다른 경우</div>
        <div class="feature-desc">더 구체적인 요청으로 다시 시도하거나, 예시를 포함하여 질문해보세요.</div>
      </li>
    </ul>

    <div style="margin-top: 40px; text-align: center; color: var(--vscode-descriptionForeground);">
      <p>🎉 HAPA와 함께 효율적인 Python 개발을 경험해보세요!</p>
    </div>
  </div>
</body>
</html>`;
  }

  protected setupMessageHandlers(webview: vscode.Webview) {
    // 가이드 뷰는 읽기 전용이므로 기본 메시지 핸들러만 사용
    super.setupMessageHandlers(webview);
  }
}
