import * as vscode from "vscode";

export interface ExtractedPrompt {
  prompt: string;
  context: string;
  selectedCode?: string;
  language?: string;
  filePath?: string;
  lineNumbers?: { start: number; end: number };
}

export class PromptExtractor {
  /**
   * 현재 에디터에서 선택된 텍스트와 컨텍스트를 추출 (개선된 버전)
   */
  static extractFromSelection(): ExtractedPrompt | null {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return null;
    }

    const document = editor.document;
    const selection = editor.selection;
    const selectedText = document.getText(selection);

    // 선택된 텍스트가 없으면 null 반환
    if (!selectedText.trim()) {
      return null;
    }

    // 파일 언어 감지
    const language = document.languageId;

    // 선택 영역 주변 컨텍스트 추출 (앞뒤 5줄씩)
    const contextRange = new vscode.Range(
      Math.max(0, selection.start.line - 5),
      0,
      Math.min(document.lineCount - 1, selection.end.line + 5),
      0
    );
    const context = document.getText(contextRange);

    // 선택된 텍스트가 주석인지 분석
    const commentAnalysis = this.analyzeSelectedText(selectedText, language);

    return {
      prompt: commentAnalysis.enhancedPrompt,
      context: context,
      selectedCode: selectedText,
      language: language,
      filePath: document.fileName,
      lineNumbers: {
        start: selection.start.line + 1,
        end: selection.end.line + 1,
      },
    };
  }

  /**
   * 선택된 텍스트 분석 (주석 인식 포함)
   */
  private static analyzeSelectedText(
    text: string,
    language: string
  ): {
    isComment: boolean;
    intent: string;
    enhancedPrompt: string;
  } {
    const trimmedText = text.trim();

    // 언어별 주석 패턴 확인
    const commentPatterns = {
      python: /^\s*#/,
      javascript: /^\s*(\/\/|\/\*)/,
      typescript: /^\s*(\/\/|\/\*)/,
      java: /^\s*(\/\/|\/\*)/,
      cpp: /^\s*(\/\/|\/\*)/,
      c: /^\s*(\/\/|\/\*)/,
    };

    const pattern = commentPatterns[language as keyof typeof commentPatterns];
    const isComment = pattern ? pattern.test(trimmedText) : false;

    if (isComment) {
      // 주석인 경우 의도 분석
      const intent = this.analyzeCommentIntent(trimmedText);
      const enhancedPrompt = this.enhanceCommentPrompt(
        trimmedText,
        intent,
        language
      );

      return {
        isComment: true,
        intent,
        enhancedPrompt,
      };
    } else {
      // 일반 코드인 경우
      const codeIntent = this.analyzeCodeIntent(trimmedText, language);
      const enhancedPrompt = this.enhanceCodePrompt(
        trimmedText,
        codeIntent,
        language
      );

      return {
        isComment: false,
        intent: codeIntent,
        enhancedPrompt,
      };
    }
  }

  /**
   * 주석 의도 분석
   */
  private static analyzeCommentIntent(comment: string): string {
    // 주석 기호 제거
    const cleanComment = comment
      .replace(/^\s*#\s*/, "")
      .replace(/^\s*\/\/\s*/, "")
      .replace(/^\s*\/\*\s*/, "")
      .replace(/\s*\*\/\s*$/, "")
      .trim()
      .toLowerCase();

    // 의도 패턴 매칭
    const intentPatterns = [
      { patterns: ["todo", "할일", "해야할"], intent: "todo" },
      { patterns: ["fixme", "fix", "수정", "고치", "버그"], intent: "fix" },
      {
        patterns: ["함수", "function", "def", "만들어", "생성"],
        intent: "create_function",
      },
      { patterns: ["클래스", "class", "객체"], intent: "create_class" },
      { patterns: ["메서드", "method"], intent: "create_method" },
      { patterns: ["api", "엔드포인트", "라우트"], intent: "create_api" },
      { patterns: ["테스트", "test", "검증"], intent: "create_test" },
      {
        patterns: ["데이터", "data", "처리", "가공"],
        intent: "data_processing",
      },
      { patterns: ["계산", "연산", "알고리즘"], intent: "calculation" },
      { patterns: ["저장", "save", "파일", "write"], intent: "file_operation" },
      { patterns: ["읽기", "read", "load", "불러"], intent: "read_operation" },
      {
        patterns: ["검색", "찾기", "filter", "search"],
        intent: "search_filter",
      },
      { patterns: ["정렬", "sort", "순서"], intent: "sort_order" },
      { patterns: ["변환", "convert", "transform"], intent: "transform" },
      { patterns: ["검증", "validate", "확인"], intent: "validation" },
    ];

    for (const { patterns, intent } of intentPatterns) {
      if (patterns.some((pattern) => cleanComment.includes(pattern))) {
        return intent;
      }
    }

    return "general";
  }

  /**
   * 코드 의도 분석
   */
  private static analyzeCodeIntent(code: string, language: string): string {
    const trimmedCode = code.trim().toLowerCase();

    // 언어별 코드 패턴
    if (language === "python") {
      if (trimmedCode.startsWith("def ")) return "function_definition";
      if (trimmedCode.startsWith("class ")) return "class_definition";
      if (trimmedCode.includes("import ")) return "import_statement";
      if (trimmedCode.includes("=") && !trimmedCode.includes("=="))
        return "assignment";
      if (trimmedCode.includes("if ")) return "conditional";
      if (trimmedCode.includes("for ") || trimmedCode.includes("while "))
        return "loop";
      if (trimmedCode.includes("try:") || trimmedCode.includes("except:"))
        return "error_handling";
    }

    return "code_analysis";
  }

  /**
   * 주석 프롬프트 개선
   */
  private static enhanceCommentPrompt(
    comment: string,
    intent: string,
    language: string
  ): string {
    const cleanComment = comment
      .replace(/^\s*#\s*/, "")
      .replace(/^\s*\/\/\s*/, "")
      .trim();

    const basePrompt = `다음 ${language} 주석의 요청사항을 구현해주세요: "${cleanComment}"`;

    switch (intent) {
      case "create_function":
        return `${basePrompt}\n\n요구사항:\n- 함수명과 매개변수를 명확히 정의\n- docstring 포함\n- 타입 힌트 사용 (Python의 경우)\n- 적절한 에러 처리`;

      case "create_class":
        return `${basePrompt}\n\n요구사항:\n- 클래스명은 PascalCase 사용\n- __init__ 메서드 구현\n- 필요한 메서드들 정의\n- docstring으로 클래스 목적 설명`;

      case "create_api":
        return `${basePrompt}\n\n요구사항:\n- RESTful 패턴 준수\n- 적절한 HTTP 상태 코드\n- 에러 핸들링 포함\n- 입력 검증 로직`;

      case "data_processing":
        return `${basePrompt}\n\n요구사항:\n- 적절한 라이브러리 사용 (pandas, numpy 등)\n- 데이터 검증\n- 에러 처리\n- 메모리 효율성 고려`;

      case "create_test":
        return `${basePrompt}\n\n요구사항:\n- unittest 또는 pytest 사용\n- 다양한 테스트 케이스\n- 예외 상황 테스트\n- 명확한 assert 메시지`;

      case "todo":
        return `${basePrompt}\n\n이것은 TODO 주석입니다. 구체적이고 실행 가능한 코드로 구현해주세요.`;

      case "fix":
        return `${basePrompt}\n\n이것은 수정 요청입니다. 문제를 해결하는 개선된 코드를 제공해주세요.`;

      default:
        return `${basePrompt}\n\n코드 생성 시 다음을 고려해주세요:\n- ${language} 베스트 프랙티스\n- 코드 가독성\n- 적절한 주석\n- 에러 처리`;
    }
  }

  /**
   * 코드 프롬프트 개선
   */
  private static enhanceCodePrompt(
    code: string,
    intent: string,
    language: string
  ): string {
    const basePrompt = `다음 ${language} 코드를 분석하고 개선해주세요:\n\n\`\`\`${language}\n${code}\n\`\`\``;

    switch (intent) {
      case "function_definition":
        return `${basePrompt}\n\n분석 요청:\n- 함수의 목적과 동작 설명\n- 개선 가능한 부분 제안\n- 타입 힌트 추가 (필요시)\n- 에러 처리 개선`;

      case "class_definition":
        return `${basePrompt}\n\n분석 요청:\n- 클래스 설계 검토\n- 메서드 구조 개선\n- 캡슐화 향상\n- 상속 구조 최적화`;

      case "conditional":
        return `${basePrompt}\n\n분석 요청:\n- 조건문 로직 검토\n- 가독성 개선\n- 중복 조건 최적화\n- 예외 케이스 처리`;

      case "loop":
        return `${basePrompt}\n\n분석 요청:\n- 반복문 효율성 검토\n- 성능 최적화\n- 메모리 사용량 개선\n- 무한루프 방지`;

      case "error_handling":
        return `${basePrompt}\n\n분석 요청:\n- 예외 처리 전략 검토\n- 구체적인 예외 타입 사용\n- 로깅 개선\n- 복구 메커니즘 추가`;

      default:
        return `${basePrompt}\n\n다음 관점에서 분석해주세요:\n- 코드 품질과 가독성\n- 성능 최적화 방안\n- 보안 취약점\n- 유지보수성`;
    }
  }

  /**
   * 현재 파일의 전체 컨텍스트를 추출
   */
  static extractFileContext(): ExtractedPrompt | null {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return null;
    }

    const document = editor.document;
    const fullText = document.getText();
    const language = document.languageId;

    return {
      prompt: `현재 파일을 분석해주세요: ${document.fileName}`,
      context: fullText,
      language: language,
      filePath: document.fileName,
      lineNumbers: {
        start: 1,
        end: document.lineCount,
      },
    };
  }

  /**
   * 커서 위치 주변의 함수나 클래스를 추출
   */
  static extractCurrentFunction(): ExtractedPrompt | null {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return null;
    }

    const document = editor.document;
    const position = editor.selection.active;
    const language = document.languageId;

    // 언어별 함수/클래스 패턴
    const patterns = {
      python: /(def\s+\w+|class\s+\w+)/g,
      javascript: /(function\s+\w+|class\s+\w+|const\s+\w+\s*=\s*\()/g,
      typescript: /(function\s+\w+|class\s+\w+|const\s+\w+\s*=\s*\()/g,
      java: /(public|private|protected)?\s*(static)?\s*(class|interface|enum|\w+\s+\w+\s*\()/g,
    };

    const pattern = patterns[language as keyof typeof patterns];
    if (!pattern) {
      // 패턴이 없으면 현재 라인 주변 10줄을 반환
      const range = new vscode.Range(
        Math.max(0, position.line - 10),
        0,
        Math.min(document.lineCount - 1, position.line + 10),
        0
      );
      const context = document.getText(range);

      return {
        prompt: `현재 위치의 코드를 분석해주세요`,
        context: context,
        language: language,
        filePath: document.fileName,
        lineNumbers: {
          start: Math.max(1, position.line - 9),
          end: Math.min(document.lineCount, position.line + 11),
        },
      };
    }

    // 현재 위치에서 가장 가까운 함수/클래스를 찾기
    const text = document.getText();
    const lines = text.split("\n");
    let functionStart = -1;
    let functionEnd = -1;

    // 현재 라인에서 위쪽으로 함수 시작점 찾기
    for (let i = position.line; i >= 0; i--) {
      if (pattern.test(lines[i])) {
        functionStart = i;
        break;
      }
    }

    if (functionStart === -1) {
      return null;
    }

    // 함수 끝점 찾기 (간단한 들여쓰기 기반)
    const startIndent = lines[functionStart].search(/\S/);
    functionEnd = functionStart;

    for (let i = functionStart + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line === "") {
        continue;
      }

      const currentIndent = lines[i].search(/\S/);
      if (currentIndent <= startIndent && line !== "") {
        functionEnd = i - 1;
        break;
      }
      functionEnd = i;
    }

    const range = new vscode.Range(
      functionStart,
      0,
      functionEnd,
      lines[functionEnd].length
    );
    const functionCode = document.getText(range);

    return {
      prompt: `다음 함수/클래스를 분석해주세요`,
      context: functionCode,
      selectedCode: functionCode,
      language: language,
      filePath: document.fileName,
      lineNumbers: {
        start: functionStart + 1,
        end: functionEnd + 1,
      },
    };
  }

  /**
   * 사용자 정의 프롬프트와 현재 컨텍스트를 결합
   */
  static combinePromptWithContext(userPrompt: string): ExtractedPrompt {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
      return {
        prompt: userPrompt,
        context: "",
      };
    }

    const document = editor.document;
    const selection = editor.selection;
    const language = document.languageId;

    let context = "";
    let selectedCode = undefined;

    // 선택된 텍스트가 있으면 해당 텍스트와 주변 컨텍스트 포함
    if (!selection.isEmpty) {
      selectedCode = document.getText(selection);
      const contextRange = new vscode.Range(
        Math.max(0, selection.start.line - 3),
        0,
        Math.min(document.lineCount - 1, selection.end.line + 3),
        0
      );
      context = document.getText(contextRange);
    } else {
      // 선택된 텍스트가 없으면 현재 커서 주변 컨텍스트
      const position = editor.selection.active;
      const contextRange = new vscode.Range(
        Math.max(0, position.line - 5),
        0,
        Math.min(document.lineCount - 1, position.line + 5),
        0
      );
      context = document.getText(contextRange);
    }

    return {
      prompt: userPrompt,
      context: context,
      selectedCode: selectedCode,
      language: language,
      filePath: document.fileName,
      lineNumbers: selection.isEmpty
        ? undefined
        : {
            start: selection.start.line + 1,
            end: selection.end.line + 1,
          },
    };
  }
}
