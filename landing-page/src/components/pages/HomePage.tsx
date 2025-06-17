import React from "react";

const HomePage: React.FC = () => {
  return (
    <div className="vscode-bg-secondary min-h-screen">
      {/* Hero Section - VSCode Extension 스타일 */}
      <section className="thunder-container py-16">
        <div className="text-center mb-16">
          {/* HAPA 브랜드 아이콘 - Extension 스타일 */}
          <div className="flex justify-center mb-8">
            <div
              className="vscode-sidebar-icon"
              style={{ width: "48px", height: "48px", fontSize: "18px" }}
            >
              H
            </div>
          </div>

          <h1 className="vscode-text-4xl font-bold vscode-text-primary mb-6">
            HAPA AI Assistant
          </h1>
          <p className="vscode-text-xl vscode-text-secondary mb-8 max-w-2xl mx-auto leading-relaxed">
            VSCode Extension으로 제공하는
            <span className="font-semibold vscode-text-primary">
              {" "}
              차세대 AI 코딩 도구
            </span>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button className="vscode-btn vscode-btn-primary vscode-btn-lg">
              ⚡ 확장 프로그램 설치
            </button>
            <button className="vscode-btn vscode-btn-secondary vscode-btn-lg">
              📖 문서 보기
            </button>
          </div>

          {/* VSCode Extension 스타일 상태 표시 */}
          <div className="vscode-status justify-center">
            <div className="vscode-status-dot"></div>
            <span>VS Code Extension v0.4.0 · 백엔드 API 연결됨</span>
          </div>
        </div>
      </section>

      {/* Live Demo Section - VSCode Extension 인터페이스 완전 재현 */}
      <section className="thunder-container py-16">
        <div className="vscode-section-header">
          <span>LIVE DEMO</span>
          <div className="flex gap-2">
            <button className="vscode-btn vscode-btn-secondary">
              FULLSCREEN
            </button>
            <button className="vscode-btn vscode-btn-secondary">
              TUTORIAL
            </button>
          </div>
        </div>

        <div className="max-w-5xl mx-auto">
          {/* VSCode Extension 스타일 데모 인터페이스 */}
          <div className="vscode-sidebar-container">
            <div className="vscode-sidebar-header">
              <div className="vscode-sidebar-title">
                <div className="vscode-sidebar-icon">H</div>
                <span>AI ASSISTANT</span>
              </div>
              <div className="flex gap-2">
                <button className="vscode-btn vscode-btn-secondary">⚙️</button>
                <button className="vscode-btn vscode-btn-expand">
                  ↗️ EXPAND
                </button>
              </div>
            </div>

            <div className="vscode-section">
              <div className="vscode-section-header">
                <span>REQUEST</span>
                <button className="vscode-btn vscode-btn-primary">SEND</button>
              </div>
              <div className="vscode-section-body">
                <textarea
                  className="vscode-textarea"
                  placeholder="파이썬 함수를 만들어 주세요. 리스트에서 중복된 값을 제거하는 함수입니다."
                  value="파이썬 함수를 만들어 주세요. 리스트에서 중복된 값을 제거하는 함수입니다."
                  readOnly
                />
              </div>
            </div>

            <div className="vscode-resizer"></div>

            <div className="vscode-section">
              <div className="vscode-tabs">
                <button className="vscode-tab active">Response</button>
                <button className="vscode-tab">History</button>
              </div>
              <div className="vscode-section-body">
                <div className="vscode-card">
                  <div className="vscode-card-header">
                    <span>✅ Success (1.2s)</span>
                    <div className="flex gap-2">
                      <button className="vscode-btn vscode-btn-secondary">
                        Copy
                      </button>
                      <button className="vscode-btn vscode-btn-primary">
                        Insert Code
                      </button>
                    </div>
                  </div>
                  <div className="vscode-card-body">
                    <div className="vscode-code">
                      def remove_duplicates(input_list): """리스트에서 중복된
                      값을 제거하는 함수""" return list(set(input_list)) # 사용
                      예시 original_list = [1, 2, 2, 3, 4, 4, 5] unique_list =
                      remove_duplicates(original_list) print(unique_list) # [1,
                      2, 3, 4, 5]
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - VSCode Extension 카드 스타일 */}
      <section className="thunder-container py-16">
        <div className="vscode-section-header">
          <span>FEATURES</span>
          <button className="vscode-btn vscode-btn-secondary">VIEW ALL</button>
        </div>

        <div className="thunder-grid thunder-grid-3">
          <div className="vscode-card">
            <div className="vscode-card-header">
              <div className="flex items-center gap-2">
                <div className="vscode-sidebar-icon">⚡</div>
                <div>
                  <div className="vscode-text-sm font-semibold">즉시 사용</div>
                  <div className="vscode-text-xs vscode-text-secondary">
                    Zero Configuration
                  </div>
                </div>
              </div>
            </div>
            <div className="vscode-card-body">
              <p className="vscode-text-sm vscode-text-secondary mb-4">
                VSCode Extension처럼 설치 후 바로 사용 가능. 복잡한 설정 없이 AI
                코딩 지원을 받으세요.
              </p>
              <div className="vscode-code">
                # 설치 후 바로 사용 # Ctrl+Shift+P → "HAPA: Start"
              </div>
            </div>
          </div>

          <div className="vscode-card">
            <div className="vscode-card-header">
              <div className="flex items-center gap-2">
                <div className="vscode-sidebar-icon">🔗</div>
                <div>
                  <div className="vscode-text-sm font-semibold">
                    VS Code 통합
                  </div>
                  <div className="vscode-text-xs vscode-text-secondary">
                    Native Integration
                  </div>
                </div>
              </div>
            </div>
            <div className="vscode-card-body">
              <p className="vscode-text-sm vscode-text-secondary mb-4">
                사이드바에서 바로 접근. 코딩 워크플로우를 방해하지 않는 깔끔한
                인터페이스.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 vscode-text-xs">
                  <div
                    className="vscode-sidebar-icon"
                    style={{ width: "12px", height: "12px", fontSize: "8px" }}
                  >
                    H
                  </div>
                  <span>Activity Bar 통합</span>
                </div>
                <div className="flex items-center gap-2 vscode-text-xs">
                  <div
                    className="vscode-sidebar-icon"
                    style={{ width: "12px", height: "12px", fontSize: "8px" }}
                  >
                    ⚡
                  </div>
                  <span>Command Palette 지원</span>
                </div>
              </div>
            </div>
          </div>

          <div className="vscode-card">
            <div className="vscode-card-header">
              <div className="flex items-center gap-2">
                <div className="vscode-sidebar-icon">🧠</div>
                <div>
                  <div className="vscode-text-sm font-semibold">
                    스마트 응답
                  </div>
                  <div className="vscode-text-xs vscode-text-secondary">
                    AI-Powered
                  </div>
                </div>
              </div>
            </div>
            <div className="vscode-card-body">
              <p className="vscode-text-sm vscode-text-secondary mb-4">
                코드 블록과 설명을 명확히 분리. 원클릭으로 코드를 에디터에 바로
                삽입.
              </p>
              <div className="flex gap-2">
                <button className="vscode-btn vscode-btn-secondary">
                  Copy
                </button>
                <button className="vscode-btn vscode-btn-primary">
                  Insert Code
                </button>
              </div>
            </div>
          </div>

          <div className="vscode-card">
            <div className="vscode-card-header">
              <div className="flex items-center gap-2">
                <div className="vscode-sidebar-icon">📍</div>
                <div>
                  <div className="vscode-text-sm font-semibold">
                    실시간 컨텍스트
                  </div>
                  <div className="vscode-text-xs vscode-text-secondary">
                    Context Aware
                  </div>
                </div>
              </div>
            </div>
            <div className="vscode-card-body">
              <p className="vscode-text-sm vscode-text-secondary mb-4">
                현재 작업 중인 파일과 선택된 코드를 자동으로 분석하여 맞춤형 AI
                응답 제공.
              </p>
              <div className="vscode-status">
                <div className="vscode-status-dot"></div>
                <span>main.py (line 42) detected</span>
              </div>
            </div>
          </div>

          <div className="vscode-card">
            <div className="vscode-card-header">
              <div className="flex items-center gap-2">
                <div className="vscode-sidebar-icon">📋</div>
                <div>
                  <div className="vscode-text-sm font-semibold">
                    히스토리 관리
                  </div>
                  <div className="vscode-text-xs vscode-text-secondary">
                    Session Management
                  </div>
                </div>
              </div>
            </div>
            <div className="vscode-card-body">
              <p className="vscode-text-sm vscode-text-secondary mb-4">
                모든 AI 대화 기록을 저장하고 관리. VSCode Extension의 히스토리
                기능과 동일한 UX.
              </p>
              <div className="vscode-tabs">
                <button className="vscode-tab">Response</button>
                <button className="vscode-tab active">History</button>
              </div>
            </div>
          </div>

          <div className="vscode-card">
            <div className="vscode-card-header">
              <div className="flex items-center gap-2">
                <div className="vscode-sidebar-icon">⚙️</div>
                <div>
                  <div className="vscode-text-sm font-semibold">고급 설정</div>
                  <div className="vscode-text-xs vscode-text-secondary">
                    Customizable
                  </div>
                </div>
              </div>
            </div>
            <div className="vscode-card-body">
              <p className="vscode-text-sm vscode-text-secondary mb-4">
                AI 모델 선택, 응답 형식 커스터마이징, 테마 설정 등 세밀한 조정
                가능.
              </p>
              <div className="space-y-2">
                <div className="flex justify-between items-center vscode-text-xs">
                  <span>AI Model</span>
                  <span className="vscode-text-muted">DeepSeek</span>
                </div>
                <div className="flex justify-between items-center vscode-text-xs">
                  <span>Response Format</span>
                  <span className="vscode-text-muted">Code + Explanation</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* API 호환성 섹션 - VSCode Extension 스타일 */}
      <section className="thunder-container py-16">
        <div className="vscode-section-header">
          <span>API COMPATIBILITY</span>
          <div className="vscode-status">
            <div className="vscode-status-dot"></div>
            <span>All endpoints operational</span>
          </div>
        </div>

        <div className="thunder-grid thunder-grid-2 mb-8">
          <div className="vscode-card">
            <div className="vscode-card-header">
              <span>Backend API</span>
              <div className="vscode-status">
                <div className="vscode-status-dot"></div>
                <span>Connected</span>
              </div>
            </div>
            <div className="vscode-card-body">
              <div className="vscode-text-sm vscode-text-secondary mb-4">
                FastAPI + SQLAlchemy 기반의 견고한 백엔드 시스템
              </div>
              <div className="vscode-code">
                POST /api/v1/generate POST /api/v1/complete GET /api/v1/history
              </div>
            </div>
          </div>

          <div className="vscode-card">
            <div className="vscode-card-header">
              <span>Extension Interface</span>
              <div className="vscode-status">
                <div className="vscode-status-dot"></div>
                <span>Active</span>
              </div>
            </div>
            <div className="vscode-card-body">
              <div className="vscode-text-sm vscode-text-secondary mb-4">
                TypeScript 기반의 VSCode Extension API 완전 활용
              </div>
              <div className="vscode-code">
                vscode.commands.executeCommand
                vscode.window.showInformationMessage
                vscode.workspace.onDidChangeTextDocument
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <button className="vscode-btn vscode-btn-expand vscode-btn-lg">
            🚀 지금 시작하기
          </button>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
