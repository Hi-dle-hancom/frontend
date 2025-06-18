import * as vscode from "vscode";
import { BaseWebviewProvider } from "./BaseWebviewProvider";

/**
 * 사용자 온보딩 웹뷰 프로바이더
 */
export class OnboardingProvider extends BaseWebviewProvider {
  private currentStep: number = 0;
  private readonly totalSteps: number = 5;
  private userProfile: any = {};

  constructor(extensionUri: vscode.Uri) {
    super(extensionUri);
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
   * 온보딩 완료
   */
  private async completeOnboarding(finalData: any) {
    this.userProfile = { ...this.userProfile, ...finalData };

    try {
      // VSCode 설정에 사용자 프로필 저장
      const config = vscode.workspace.getConfiguration("hapa");

      await config.update(
        "userProfile.isOnboardingCompleted",
        true,
        vscode.ConfigurationTarget.Global
      );
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

      vscode.window
        .showInformationMessage(
          "🎉 HAPA 온보딩이 완료되었습니다! 이제 맞춤형 AI 어시스턴트를 사용할 수 있습니다.",
          "HAPA 시작하기"
        )
        .then((selection) => {
          if (selection === "HAPA 시작하기") {
            vscode.commands.executeCommand("hapa.start");
          }
        });

      // 웹뷰 닫기
      if (this._view) {
        this._view.webview.html = this.generateCompletionHtml();
      }
    } catch (error) {
      vscode.window.showErrorMessage(
        "설정 저장 중 오류가 발생했습니다: " + (error as Error).message
      );
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
    
    // 라디오 버튼 선택 처리
    function selectRadio(name, value) {
      document.querySelectorAll('[data-radio="' + name + '"]').forEach(function(el) {
        el.classList.remove('selected');
      });
      var currentElement = event.currentTarget;
      currentElement.classList.add('selected');
      currentElement.setAttribute('data-value', value);
    }
    
    // 체크박스 선택 처리
    function toggleCheckbox(value) {
      const element = event.currentTarget;
      element.classList.toggle('selected');
      element.dataset.checked = element.classList.contains('selected') ? 'true' : 'false';
    }
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
          <h2 class="step-title">Python 스킬 수준을 알려주세요</h2>
          <p class="step-description">당신의 Python 경험 수준에 맞는 코드와 설명을 제공하겠습니다.</p>
          
          <div class="form-group">
            <div class="radio-group">
              <div class="radio-option" data-radio="skillLevel" onclick="selectRadio('skillLevel', 'beginner')">
                <div class="option-content">
                  <div class="option-title">🌱 초급자</div>
                  <div class="option-description">Python을 처음 배우고 있거나 기본 문법을 학습 중입니다</div>
                </div>
              </div>
              <div class="radio-option" data-radio="skillLevel" onclick="selectRadio('skillLevel', 'intermediate')">
                <div class="option-content">
                  <div class="option-title">🔧 중급자</div>
                  <div class="option-description">기본 문법을 알고 있으며 일반적인 프로그래밍이 가능합니다</div>
                </div>
              </div>
              <div class="radio-option" data-radio="skillLevel" onclick="selectRadio('skillLevel', 'advanced')">
                <div class="option-content">
                  <div class="option-title">⚡ 고급자</div>
                  <div class="option-description">복잡한 프로젝트 개발이 가능하며 라이브러리 활용에 능숙합니다</div>
                </div>
              </div>
              <div class="radio-option" data-radio="skillLevel" onclick="selectRadio('skillLevel', 'expert')">
                <div class="option-content">
                  <div class="option-title">🚀 전문가</div>
                  <div class="option-description">최적화, 아키텍처 설계, 고급 패턴 구현이 가능합니다</div>
                </div>
              </div>
            </div>
          </div>
        `;

      case 1:
        return `
          <h2 class="step-title">코드 출력 스타일을 선택해주세요</h2>
          <p class="step-description">AI가 생성하는 코드의 구조와 상세도를 설정합니다.</p>
          
          <div class="form-group">
            <div class="radio-group">
              <div class="radio-option" data-radio="outputStructure" onclick="selectRadio('outputStructure', 'minimal')">
                <div class="option-content">
                  <div class="option-title">✨ 최소한</div>
                  <div class="option-description">핵심 로직만 간결하게 (주석 최소화)</div>
                </div>
              </div>
              <div class="radio-option" data-radio="outputStructure" onclick="selectRadio('outputStructure', 'standard')">
                <div class="option-content">
                  <div class="option-title">📝 표준</div>
                  <div class="option-description">일반적인 코드 구조 + 기본 주석</div>
                </div>
              </div>
              <div class="radio-option" data-radio="outputStructure" onclick="selectRadio('outputStructure', 'detailed')">
                <div class="option-content">
                  <div class="option-title">🔍 상세</div>
                  <div class="option-description">자세한 주석 + 예외 처리 + 타입 힌트</div>
                </div>
              </div>
              <div class="radio-option" data-radio="outputStructure" onclick="selectRadio('outputStructure', 'comprehensive')">
                <div class="option-content">
                  <div class="option-title">📚 포괄적</div>
                  <div class="option-description">문서화 + 테스트 코드 + 최적화 제안</div>
                </div>
              </div>
            </div>
          </div>
        `;

      case 2:
        return `
          <h2 class="step-title">설명 스타일을 설정해주세요</h2>
          <p class="step-description">AI가 제공하는 설명의 상세도와 스타일을 선택합니다.</p>
          
          <div class="form-group">
            <div class="radio-group">
              <div class="radio-option" data-radio="explanationStyle" onclick="selectRadio('explanationStyle', 'brief')">
                <div class="option-content">
                  <div class="option-title">⚡ 간단한 설명</div>
                  <div class="option-description">핵심 내용만 빠르게</div>
                </div>
              </div>
              <div class="radio-option" data-radio="explanationStyle" onclick="selectRadio('explanationStyle', 'standard')">
                <div class="option-content">
                  <div class="option-title">📖 표준 설명</div>
                  <div class="option-description">코드 + 간단한 설명</div>
                </div>
              </div>
              <div class="radio-option" data-radio="explanationStyle" onclick="selectRadio('explanationStyle', 'detailed')">
                <div class="option-content">
                  <div class="option-title">🔍 상세 설명</div>
                  <div class="option-description">개념 + 이유 + 활용법</div>
                </div>
              </div>
              <div class="radio-option" data-radio="explanationStyle" onclick="selectRadio('explanationStyle', 'educational')">
                <div class="option-content">
                  <div class="option-title">🎓 교육적 설명</div>
                  <div class="option-description">단계별 + 예시 + 관련 개념</div>
                </div>
              </div>
            </div>
          </div>
        `;

      case 3:
        return `
          <h2 class="step-title">개발 환경을 설정해주세요</h2>
          <p class="step-description">주요 개발 분야와 선호하는 Python 기능을 선택합니다.</p>
          
          <div class="form-group">
            <label class="form-label">주요 개발 분야</label>
            <div class="radio-group">
              <div class="radio-option" data-radio="projectContext" onclick="selectRadio('projectContext', 'web_development')">
                <div class="option-content">
                  <div class="option-title">🌐 웹 개발</div>
                  <div class="option-description">Django, Flask, FastAPI</div>
                </div>
              </div>
              <div class="radio-option" data-radio="projectContext" onclick="selectRadio('projectContext', 'data_science')">
                <div class="option-content">
                  <div class="option-title">📊 데이터 사이언스</div>
                  <div class="option-description">NumPy, Pandas, ML</div>
                </div>
              </div>
              <div class="radio-option" data-radio="projectContext" onclick="selectRadio('projectContext', 'automation')">
                <div class="option-content">
                  <div class="option-title">🤖 자동화</div>
                  <div class="option-description">스크립팅, 업무 자동화</div>
                </div>
              </div>
              <div class="radio-option" data-radio="projectContext" onclick="selectRadio('projectContext', 'general_purpose')">
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
              <div class="checkbox-option" onclick="toggleCheckbox('type_hints')">
                <div class="option-content">
                  <div class="option-title">타입 힌트 (Type Hints)</div>
                  <div class="option-description">코드의 가독성과 안정성 향상</div>
                </div>
              </div>
              <div class="checkbox-option" onclick="toggleCheckbox('dataclasses')">
                <div class="option-content">
                  <div class="option-title">데이터클래스 (Dataclasses)</div>
                  <div class="option-description">간편한 클래스 정의</div>
                </div>
              </div>
              <div class="checkbox-option" onclick="toggleCheckbox('async_await')">
                <div class="option-content">
                  <div class="option-title">비동기 프로그래밍 (Async/Await)</div>
                  <div class="option-description">효율적인 I/O 처리</div>
                </div>
              </div>
              <div class="checkbox-option" onclick="toggleCheckbox('f_strings')">
                <div class="option-content">
                  <div class="option-title">f-strings</div>
                  <div class="option-description">문자열 포맷팅</div>
                </div>
              </div>
            </div>
          </div>
        `;

      case 4:
        return `
          <h2 class="step-title">⚡ 주석 트리거 워크플로우</h2>
          <p class="step-description">주석으로 코드를 요청할 때 결과를 어떻게 표시할까요? 개발 스타일에 맞는 워크플로우를 선택하세요.</p>
          
          <div class="form-group">
            <div class="radio-group">
              <div class="radio-option" data-radio="commentTriggerMode" onclick="selectRadio('commentTriggerMode', 'immediate_insert')">
                <div class="option-content">
                  <div class="option-title">⚡ 즉시 삽입</div>
                  <div class="option-description">생성된 코드를 커서 위치에 바로 삽입 (Thunder Client 스타일)</div>
                </div>
              </div>
              <div class="radio-option" data-radio="commentTriggerMode" onclick="selectRadio('commentTriggerMode', 'sidebar')">
                <div class="option-content">
                  <div class="option-title">📋 사이드바 표시</div>
                  <div class="option-description">사이드바에 결과를 표시하고 검토 후 삽입</div>
                </div>
              </div>
              <div class="radio-option" data-radio="commentTriggerMode" onclick="selectRadio('commentTriggerMode', 'confirm_insert')">
                <div class="option-content">
                  <div class="option-title">✅ 확인 후 삽입</div>
                  <div class="option-description">코드를 미리보고 확인 대화상자에서 삽입 여부 선택</div>
                </div>
              </div>
              <div class="radio-option" data-radio="commentTriggerMode" onclick="selectRadio('commentTriggerMode', 'inline_preview')">
                <div class="option-content">
                  <div class="option-title">👁️ 인라인 미리보기</div>
                  <div class="option-description">에디터에서 코드를 미리보고 키보드로 선택</div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="workflow-tip">
            <div class="tip-icon">💡</div>
            <div class="tip-content">
              <strong>팁:</strong> 나중에 설정에서 언제든 변경할 수 있습니다. 즉시 삽입 모드는 빠른 프로토타이핑에 유용하고, 사이드바 모드는 신중한 검토에 적합합니다.
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
          var selected = document.querySelector('[data-radio="skillLevel"].selected');
          if (!selected) {
            alert('Python 스킬 수준을 선택해주세요.');
            return null;
          }
          return { skillLevel: selected.getAttribute('data-value') };
        `;

      case 1:
        return `
          var selected = document.querySelector('[data-radio="outputStructure"].selected');
          if (!selected) {
            alert('코드 출력 스타일을 선택해주세요.');
            return null;
          }
          return { outputStructure: selected.getAttribute('data-value') };
        `;

      case 2:
        return `
          var selected = document.querySelector('[data-radio="explanationStyle"].selected');
          if (!selected) {
            alert('설명 스타일을 선택해주세요.');
            return null;
          }
          return { explanationStyle: selected.getAttribute('data-value') };
        `;

      case 3:
        return `
          var projectContext = document.querySelector('[data-radio="projectContext"].selected');
          if (!projectContext) {
            alert('개발 분야를 선택해주세요.');
            return null;
          }
          
          var languageFeatures = [];
          document.querySelectorAll('.checkbox-option.selected').forEach(function(el) {
            var onclick = el.getAttribute('onclick');
            var match = onclick.match(/toggleCheckbox\\('([^']+)'\\)/);
            if (match) {
              languageFeatures.push(match[1]);
            }
          });
          
          return { 
            projectContext: projectContext.getAttribute('data-value'),
            languageFeatures: languageFeatures,
            errorHandling: 'basic'
          };
        `;

      case 4:
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
