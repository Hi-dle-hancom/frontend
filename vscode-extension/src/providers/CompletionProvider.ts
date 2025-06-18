import * as vscode from "vscode";
import { apiClient } from "../modules/apiClient";

/**
 * HAPA AI 기반 자동 완성 제공자
 */
export class HAPACompletionProvider implements vscode.CompletionItemProvider {
  private readonly triggerCharacters = [".", "(", "[", '"', "'", " "];
  private cache = new Map<string, vscode.CompletionItem[]>();
  private readonly cacheTimeout = 5000; // 5초 캐시

  constructor() {
    // 캐시 정리를 위한 타이머 설정
    setInterval(() => {
      this.cache.clear();
    }, this.cacheTimeout * 10);
  }

  /**
   * 자동 완성 아이템 제공
   */
  async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    context: vscode.CompletionContext
  ): Promise<vscode.CompletionItem[] | vscode.CompletionList> {
    // Python 파일만 처리
    if (document.languageId !== "python") {
      return [];
    }

    // 설정 확인
    const config = vscode.workspace.getConfiguration("hapa");
    if (!config.get("autoComplete", true)) {
      return [];
    }

    try {
      const maxSuggestions = config.get("autoComplete.maxSuggestions", 5);
      const confidenceThreshold = config.get(
        "autoComplete.confidenceThreshold",
        0.3
      );
      const enableContextAnalysis = config.get(
        "autoComplete.enableContextAnalysis",
        true
      );

      const completionContext = this.extractCompletionContext(
        document,
        position
      );

      // 캐시 확인
      const cacheKey = this.generateCacheKey(completionContext);
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey)!;
      }

      // AI 자동 완성 요청
      const response = await apiClient.completeCode({
        prefix: completionContext.prefix,
        language: "python",
        cursor_position: position.character,
        file_path: document.fileName,
        context: enableContextAnalysis ? completionContext.context : undefined,
        trigger_character: context.triggerCharacter,
      });

      if (response.status === "success" && response.completions) {
        // 신뢰도 필터링
        const filteredCompletions = response.completions.filter(
          (completion) => completion.confidence >= confidenceThreshold
        );

        // 최대 개수 제한
        const limitedCompletions = filteredCompletions.slice(0, maxSuggestions);

        const items = this.createCompletionItems(
          limitedCompletions,
          completionContext
        );

        // 캐시 저장
        this.cache.set(cacheKey, items);

        return new vscode.CompletionList(items, false);
      }

      return [];
    } catch (error) {
      console.error("HAPA 자동 완성 오류:", error);
      return [];
    }
  }

  /**
   * 자동 완성 아이템 상세 정보 제공
   */
  async resolveCompletionItem(
    item: vscode.CompletionItem,
    token: vscode.CancellationToken
  ): Promise<vscode.CompletionItem> {
    // 이미 상세 정보가 있는 경우 그대로 반환
    if (item.documentation || item.detail) {
      return item;
    }

    // 추가 정보 로드 (필요시)
    return item;
  }

  /**
   * 완성 컨텍스트 추출
   */
  private extractCompletionContext(
    document: vscode.TextDocument,
    position: vscode.Position
  ) {
    const line = document.lineAt(position);
    const linePrefix = line.text.substring(0, position.character);

    // 현재 줄 이전의 컨텍스트 (최대 10줄)
    const startLine = Math.max(0, position.line - 10);
    const contextLines = [];

    for (let i = startLine; i < position.line; i++) {
      contextLines.push(document.lineAt(i).text);
    }

    // 현재 함수나 클래스 찾기
    const currentScope = this.findCurrentScope(document, position);

    return {
      prefix: linePrefix,
      context: contextLines.join("\n"),
      currentLine: line.text,
      currentScope,
      indentLevel: this.getIndentLevel(linePrefix),
    };
  }

  /**
   * 현재 스코프 찾기 (함수, 클래스 등)
   */
  private findCurrentScope(
    document: vscode.TextDocument,
    position: vscode.Position
  ): string {
    for (let i = position.line - 1; i >= 0; i--) {
      const line = document.lineAt(i).text;
      const trimmed = line.trim();

      if (trimmed.startsWith("def ") || trimmed.startsWith("class ")) {
        return trimmed;
      }
    }

    return "";
  }

  /**
   * 들여쓰기 레벨 계산
   */
  private getIndentLevel(text: string): number {
    const match = text.match(/^(\s*)/);
    return match ? match[1].length : 0;
  }

  /**
   * 캐시 키 생성
   */
  private generateCacheKey(context: any): string {
    return `${context.prefix}_${context.indentLevel}_${context.currentScope}`;
  }

  /**
   * 완성 아이템 생성
   */
  private createCompletionItems(
    completions: any[],
    context: any
  ): vscode.CompletionItem[] {
    return completions.map((completion, index) => {
      const item = new vscode.CompletionItem(
        completion.label || completion.code,
        this.getCompletionItemKind(completion.category)
      );

      // 기본 정보 설정
      item.insertText = completion.insertion_text || completion.code;
      item.detail = this.generateDetailText(completion);
      item.documentation = this.generateDocumentation(completion);

      // 정렬 우선순위 (신뢰도 기반)
      item.sortText = this.generateSortText(completion.confidence, index);

      // 필터 텍스트
      item.filterText = completion.label || completion.code;

      // 추가 정보
      item.preselect = completion.confidence > 0.8;

      // 커스텀 명령어 (선택 시 실행)
      if (completion.documentation_url) {
        item.command = {
          command: "hapa.openDocumentation",
          title: "문서 보기",
          arguments: [completion.documentation_url],
        };
      }

      return item;
    });
  }

  /**
   * 완성 아이템 종류 결정
   */
  private getCompletionItemKind(category: string): vscode.CompletionItemKind {
    switch (category) {
      case "function":
        return vscode.CompletionItemKind.Function;
      case "class":
        return vscode.CompletionItemKind.Class;
      case "variable":
        return vscode.CompletionItemKind.Variable;
      case "import":
        return vscode.CompletionItemKind.Module;
      case "method":
        return vscode.CompletionItemKind.Method;
      case "property":
        return vscode.CompletionItemKind.Property;
      case "keyword":
        return vscode.CompletionItemKind.Keyword;
      default:
        return vscode.CompletionItemKind.Text;
    }
  }

  /**
   * 상세 텍스트 생성
   */
  private generateDetailText(completion: any): string {
    const parts = [];

    if (completion.confidence) {
      const confidencePercent = Math.round(completion.confidence * 100);
      parts.push(`신뢰도: ${confidencePercent}%`);
    }

    if (completion.complexity) {
      const complexityMap: { [key: string]: string } = {
        simple: "간단",
        moderate: "보통",
        complex: "복잡",
      };
      parts.push(
        `복잡도: ${
          complexityMap[completion.complexity] || completion.complexity
        }`
      );
    }

    if (completion.performance_impact) {
      const impactMap: { [key: string]: string } = {
        low: "낮음",
        medium: "보통",
        high: "높음",
      };
      parts.push(
        `성능 영향: ${
          impactMap[completion.performance_impact] ||
          completion.performance_impact
        }`
      );
    }

    return parts.join(" | ");
  }

  /**
   * 문서화 생성
   */
  private generateDocumentation(completion: any): vscode.MarkdownString {
    const markdown = new vscode.MarkdownString();
    markdown.isTrusted = true;

    // 설명
    if (completion.description) {
      markdown.appendMarkdown(`**설명:** ${completion.description}\n\n`);
    }

    // AI 설명
    if (completion.explanation) {
      markdown.appendMarkdown(
        `**AI 추천 이유:** ${completion.explanation}\n\n`
      );
    }

    // 예상 결과
    if (completion.expected_result) {
      markdown.appendMarkdown(
        `**예상 결과:** \`${completion.expected_result}\`\n\n`
      );
    }

    // 코드 예시
    if (completion.examples && completion.examples.length > 0) {
      markdown.appendMarkdown(`**사용 예시:**\n`);
      completion.examples.forEach((example: string, index: number) => {
        markdown.appendCodeblock(example, "python");
        if (index < completion.examples.length - 1) {
          markdown.appendMarkdown("\n");
        }
      });
      markdown.appendMarkdown("\n");
    }

    // 관련 개념
    if (completion.related_concepts && completion.related_concepts.length > 0) {
      markdown.appendMarkdown(
        `**관련 개념:** ${completion.related_concepts.join(", ")}\n\n`
      );
    }

    // 문서 링크
    if (completion.documentation_url) {
      markdown.appendMarkdown(
        `[📚 공식 문서 보기](${completion.documentation_url})`
      );
    }

    return markdown;
  }

  /**
   * 정렬 텍스트 생성 (신뢰도 기반)
   */
  private generateSortText(confidence: number, index: number): string {
    // 신뢰도가 높을수록 앞에 표시
    const priority = Math.round((1 - confidence) * 1000);
    return `${priority.toString().padStart(4, "0")}_${index
      .toString()
      .padStart(3, "0")}`;
  }

  /**
   * 트리거 문자 확인
   */
  shouldTriggerCompletion(
    document: vscode.TextDocument,
    position: vscode.Position
  ): boolean {
    const line = document.lineAt(position);
    const char = line.text.charAt(position.character - 1);
    return this.triggerCharacters.includes(char);
  }
}

/**
 * 인라인 완성 제공자 (GitHub Copilot 스타일)
 */
export class HAPAInlineCompletionProvider
  implements vscode.InlineCompletionItemProvider
{
  private lastRequest: { text: string; timestamp: number } | null = null;
  private readonly debounceDelay = 300; // 300ms 디바운스

  async provideInlineCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.InlineCompletionContext,
    token: vscode.CancellationToken
  ): Promise<vscode.InlineCompletionItem[] | vscode.InlineCompletionList> {
    // Python 파일만 처리
    if (document.languageId !== "python") {
      return [];
    }

    // 설정 확인
    const config = vscode.workspace.getConfiguration("hapa");
    if (!config.get("autoComplete", true)) {
      return [];
    }

    try {
      const maxSuggestions = config.get("autoComplete.maxSuggestions", 5);
      const confidenceThreshold = config.get(
        "autoComplete.confidenceThreshold",
        0.3
      );
      const enableContextAnalysis = config.get(
        "autoComplete.enableContextAnalysis",
        true
      );
      const currentLine = document.lineAt(position).text;
      const prefix = currentLine.substring(0, position.character);

      // 의미있는 텍스트가 있는지 확인
      if (prefix.trim().length < 3) {
        return [];
      }

      // 디바운스 처리
      const now = Date.now();
      if (
        this.lastRequest &&
        this.lastRequest.text === prefix &&
        now - this.lastRequest.timestamp < this.debounceDelay
      ) {
        return [];
      }

      this.lastRequest = { text: prefix, timestamp: now };

      // 컨텍스트 추출
      const contextLines = [];
      const startLine = Math.max(0, position.line - 5);

      for (let i = startLine; i < position.line; i++) {
        contextLines.push(document.lineAt(i).text);
      }

      // AI 완성 요청
      const response = await apiClient.completeCode({
        prefix: prefix,
        language: "python",
        cursor_position: position.character,
        file_path: document.fileName,
        context: contextLines.join("\n"),
      });

      if (
        response.status === "success" &&
        response.completions &&
        response.completions.length > 0
      ) {
        const completion = response.completions[0];

        // 현재 입력과 중복되지 않는 부분만 추출
        const insertText = this.extractInsertText(
          prefix,
          completion.insertion_text || completion.code
        );

        if (insertText.trim()) {
          const item = new vscode.InlineCompletionItem(
            insertText,
            new vscode.Range(position, position)
          );

          // 추가 명령어 설정 (선택 시 실행)
          if (completion.explanation) {
            item.command = {
              command: "hapa.showCompletionExplanation",
              title: "AI 추천 이유 보기",
              arguments: [completion.explanation],
            };
          }

          return [item];
        }
      }

      return [];
    } catch (error) {
      console.error("HAPA 인라인 완성 오류:", error);
      return [];
    }
  }

  /**
   * 삽입할 텍스트 추출 (중복 제거)
   */
  private extractInsertText(prefix: string, fullCompletion: string): string {
    // 이미 입력된 부분과 겹치는 부분 제거
    if (fullCompletion.startsWith(prefix)) {
      return fullCompletion.substring(prefix.length);
    }

    // 단어 단위로 겹치는 부분 찾기
    const prefixWords = prefix.trim().split(/\s+/);
    const completionWords = fullCompletion.trim().split(/\s+/);

    let overlapIndex = 0;
    for (
      let i = 0;
      i < Math.min(prefixWords.length, completionWords.length);
      i++
    ) {
      if (prefixWords[prefixWords.length - 1 - i] === completionWords[i]) {
        overlapIndex = i + 1;
      } else {
        break;
      }
    }

    return completionWords.slice(overlapIndex).join(" ");
  }
}
