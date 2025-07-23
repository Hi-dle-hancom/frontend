/**
 * TriggerDetector 단위 테스트
 * 실시간 트리거 감지 로직 검증
 */

import * as vscode from "vscode";
import { TriggerDetector, TriggerEvent } from "../../modules/triggerDetector";

// Mock VSCode API
jest.mock("vscode", () => ({
  window: {
    onDidChangeTextEditorSelection: jest.fn(),
    onDidChangeActiveTextEditor: jest.fn(),
    activeTextEditor: null,
  },
  workspace: {
    onDidChangeTextDocument: jest.fn(),
  },
  Uri: {
    file: jest.fn((path) => ({ fsPath: path })),
  },
  Range: jest.fn(),
  Disposable: jest.fn(() => ({
    dispose: jest.fn(),
  })),
}));

describe("TriggerDetector", () => {
  let triggerDetector: TriggerDetector;
  let triggerCallback: jest.Mock;

  beforeEach(() => {
    triggerCallback = jest.fn();
    triggerDetector = new TriggerDetector();
    triggerDetector.onTrigger(triggerCallback);
  });

  afterEach(() => {
    if (triggerDetector && typeof triggerDetector.dispose === 'function') {
      triggerDetector.dispose();
    }
  });

  describe("초기화", () => {
    test("TriggerDetector가 올바르게 생성되어야 함", () => {
      expect(triggerDetector).toBeDefined();
    });

    test("트리거 콜백이 올바르게 설정되어야 함", () => {
      const newCallback = jest.fn();
      triggerDetector.onTrigger(newCallback);
      
      // private 변수 접근을 위한 타입 캐스팅
      expect((triggerDetector as any).onTriggerCallback).toBe(newCallback);
    });
  });

  describe("주석 트리거 감지", () => {
    test("유효한 주석 패턴을 올바르게 감지해야 함", () => {
      const isCommentTrigger = (triggerDetector as any).isCommentTrigger;
      
      const validComments = [
        "# TODO: 사용자 인증 함수를 만들어주세요\n",
        "# 데이터베이스 연결 함수 생성해주세요\n",
        "# FIXME: 버그 수정이 필요합니다\n",
        "# create user authentication function\n",
        "# make database connection\n",
      ];

      validComments.forEach(comment => {
        expect(isCommentTrigger.call(triggerDetector, comment, {})).toBe(true);
      });
    });

    test("무효한 주석 패턴을 올바르게 거부해야 함", () => {
      const isCommentTrigger = (triggerDetector as any).isCommentTrigger;
      
      const invalidComments = [
        "#",  // 단순 # 문자
        "# ",  // 빈 주석
        "# 일반 주석입니다",  // 액션이 없는 주석
        "# test",  // 줄바꿈이 없는 짧은 주석
        "print('hello')",  // 주석이 아닌 코드
      ];

      invalidComments.forEach(comment => {
        expect(isCommentTrigger.call(triggerDetector, comment, {})).toBe(false);
      });
    });

    test("다양한 언어의 액션 키워드를 감지해야 함", () => {
      const isCommentTrigger = (triggerDetector as any).isCommentTrigger;
      
      const multiLanguageComments = [
        "# 생성해주세요: API 엔드포인트\n",
        "# 만들어주세요: 데이터 모델\n",
        "# 구현해주세요: 인증 로직\n",
        "# implement authentication logic\n",
        "# create API endpoint\n",
        "# generate test cases\n",
      ];

      multiLanguageComments.forEach(comment => {
        expect(isCommentTrigger.call(triggerDetector, comment, {})).toBe(true);
      });
    });
  });

  describe("주석 의도 분석", () => {
    test("함수 생성 의도를 올바르게 분석해야 함", () => {
      const analyzeCommentIntent = (triggerDetector as any).analyzeCommentIntent;
      
      const functionComments = [
        "사용자 인증 함수를 만들어주세요",
        "create authentication function",
        "데이터베이스 연결 function 생성",
      ];

      functionComments.forEach(comment => {
        expect(analyzeCommentIntent.call(triggerDetector, comment)).toBe("function_creation");
      });
    });

    test("클래스 생성 의도를 올바르게 분석해야 함", () => {
      const analyzeCommentIntent = (triggerDetector as any).analyzeCommentIntent;
      
      const classComments = [
        "User 클래스를 만들어주세요",
        "create Database class",
        "API 클래스 구현해주세요",
      ];

      classComments.forEach(comment => {
        expect(analyzeCommentIntent.call(triggerDetector, comment)).toBe("class_creation");
      });
    });

    test("API 생성 의도를 올바르게 분석해야 함", () => {
      const analyzeCommentIntent = (triggerDetector as any).analyzeCommentIntent;
      
      const apiComments = [
        "REST API 엔드포인트 만들어주세요",
        "create API for user management", 
        "API 인터페이스 구현",
      ];

      apiComments.forEach(comment => {
        expect(analyzeCommentIntent.call(triggerDetector, comment)).toBe("api_creation");
      });
    });

    test("일반적인 요청은 general로 분류해야 함", () => {
      const analyzeCommentIntent = (triggerDetector as any).analyzeCommentIntent;
      
      const generalComments = [
        "코드를 개선해주세요",
        "이 부분을 설명해주세요",
        "도움이 필요합니다",
      ];

      generalComments.forEach(comment => {
        expect(analyzeCommentIntent.call(triggerDetector, comment)).toBe("general");
      });
    });
  });

  describe("AI 프롬프트 구성", () => {
    test("함수 생성 프롬프트가 올바른 지침을 포함해야 함", () => {
      const constructAIPrompt = (triggerDetector as any).constructAIPrompt;
      
      const prompt = constructAIPrompt.call(
        triggerDetector,
        "사용자 인증 함수 만들어주세요",
        "function_creation",
        "# 기존 코드 컨텍스트"
      );

      expect(prompt).toContain("사용자 인증 함수 만들어주세요");
      expect(prompt).toContain("명확한 함수명과 매개변수");
      expect(prompt).toContain("docstring을 포함");
      expect(prompt).toContain("타입 힌트를 사용");
      expect(prompt).toContain("기존 코드 컨텍스트");
    });

    test("클래스 생성 프롬프트가 올바른 지침을 포함해야 함", () => {
      const constructAIPrompt = (triggerDetector as any).constructAIPrompt;
      
      const prompt = constructAIPrompt.call(
        triggerDetector,
        "User 클래스 만들어주세요",
        "class_creation",
        ""
      );

      expect(prompt).toContain("User 클래스 만들어주세요");
      expect(prompt).toContain("PascalCase를 사용");
      expect(prompt).toContain("__init__ 메서드를 포함");
      expect(prompt).toContain("클래스의 목적을 설명");
    });

    test("API 생성 프롬프트가 올바른 지침을 포함해야 함", () => {
      const constructAIPrompt = (triggerDetector as any).constructAIPrompt;
      
      const prompt = constructAIPrompt.call(
        triggerDetector,
        "REST API 만들어주세요",
        "api_creation",
        ""
      );

      expect(prompt).toContain("REST API 만들어주세요");
      expect(prompt).toContain("RESTful API 구조");
      expect(prompt).toContain("HTTP 상태 코드");
      expect(prompt).toContain("FastAPI 또는 Flask");
    });

    test("일반적인 요청에 대한 기본 지침을 제공해야 함", () => {
      const constructAIPrompt = (triggerDetector as any).constructAIPrompt;
      
      const prompt = constructAIPrompt.call(
        triggerDetector,
        "코드를 개선해주세요",
        "general",
        ""
      );

      expect(prompt).toContain("코드를 개선해주세요");
      expect(prompt).toContain("Python 베스트 프랙티스");
      expect(prompt).toContain("PEP 8 스타일 가이드");
      expect(prompt).toContain("에러 처리를 고려");
    });
  });

  describe("명령어 처리", () => {
    test("분석 명령어가 올바른 트리거 이벤트를 발생시켜야 함", () => {
      // Mock PromptExtractor
      const mockExtractedPrompt = {
        prompt: "테스트 프롬프트",
        context: "테스트 컨텍스트",
        selectedCode: "테스트 코드",
        language: "python",
        filePath: "/test/file.py",
        lineNumbers: { start: 1, end: 1 }
      };

      // PromptExtractor 모킹
      jest.doMock("../../modules/promptExtractor", () => ({
        PromptExtractor: {
          extractFromSelection: jest.fn().mockReturnValue(mockExtractedPrompt),
          extractCurrentFunction: jest.fn().mockReturnValue(null),
          extractFileContext: jest.fn().mockReturnValue(null),
        }
      }));

      triggerDetector.handleCommand("hapa.analyze");

      expect(triggerCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "command",
          action: "analyze",
          data: mockExtractedPrompt
        })
      );
    });

    test("테스트 생성 명령어가 올바른 트리거 이벤트를 발생시켜야 함", () => {
      const mockExtractedPrompt = {
        prompt: "테스트 프롬프트",
        context: "테스트 컨텍스트",
        selectedCode: "테스트 코드",
        language: "python",
        filePath: "/test/file.py",
        lineNumbers: { start: 1, end: 1 }
      };

      jest.doMock("../../modules/promptExtractor", () => ({
        PromptExtractor: {
          extractFromSelection: jest.fn().mockReturnValue(mockExtractedPrompt),
          extractCurrentFunction: jest.fn().mockReturnValue(null),
        }
      }));

      triggerDetector.handleCommand("hapa.generateTest");

      expect(triggerCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "command",
          action: "test",
          data: mockExtractedPrompt
        })
      );
    });
  });

  describe("리소스 정리", () => {
    test("dispose() 호출 시 모든 disposable이 정리되어야 함", () => {
      const mockDisposable = { dispose: jest.fn() };
      (triggerDetector as any).disposables = [mockDisposable, mockDisposable];

      triggerDetector.dispose();

      expect(mockDisposable.dispose).toHaveBeenCalledTimes(2);
      expect((triggerDetector as any).disposables).toHaveLength(0);
    });
  });

  describe("디바운스 로직", () => {
    test("연속된 트리거가 디바운스 시간 내에서 무시되어야 함", () => {
      // 첫 번째 트리거
      const now = Date.now();
      (triggerDetector as any).lastTriggerTime = now;

      // Mock 텍스트 변경 이벤트
      const mockEvent = {
        document: { languageId: "python" },
        contentChanges: [{
          text: "# TODO: 함수를 만들어주세요\n",
          range: { start: { line: 0 }, end: { line: 0 } }
        }]
      };

      // 디바운스 시간 내에 다시 호출
      (triggerDetector as any).handleTextDocumentChange(mockEvent);

      // 트리거가 발생하지 않아야 함 (디바운스 때문에)
      expect(triggerCallback).not.toHaveBeenCalled();
    });

    test("디바운스 시간이 지난 후 트리거가 정상 작동해야 함", () => {
      // 충분히 과거의 시간으로 설정
      const pastTime = Date.now() - 2000; // 2초 전
      (triggerDetector as any).lastTriggerTime = pastTime;

      const mockEvent = {
        document: { 
          languageId: "python",
          getText: jest.fn().mockReturnValue("# 기존 코드"),
          lineCount: 10
        },
        contentChanges: [{
          text: "# TODO: 함수를 만들어주세요\n",
          range: { 
            start: { line: 0 }, 
            end: { line: 0 } 
          }
        }]
      };

      // Mock vscode.Range
      (vscode.Range as any) = jest.fn().mockImplementation((start, startChar, end, endChar) => ({
        start: { line: start, character: startChar },
        end: { line: end, character: endChar }
      }));

      (triggerDetector as any).handleTextDocumentChange(mockEvent);

      // 트리거가 발생해야 함
      expect(triggerCallback).toHaveBeenCalled();
    });
  });
});