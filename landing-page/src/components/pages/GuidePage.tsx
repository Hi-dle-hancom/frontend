import React from "react";

const GuidePage: React.FC = () => {
  return (
    <div className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-hancom-navy mb-6">
            사용 가이드
          </h1>
          <p className="text-xl text-gray-600">
            HAPA AI Assistant를 효과적으로 사용하는 방법
          </p>
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-xl p-8 shadow-lg">
            <h2 className="text-3xl font-semibold text-hancom-navy mb-6">
              시작하기
            </h2>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-hancom-blue text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-hancom-navy mb-2">
                    Extension 설치
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    VS Code Marketplace에서 "한컴 AI"를 검색하여 설치하거나,
                    명령어 팔레트에서 Extensions: Install Extensions를
                    실행하세요.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-hancom-blue text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-hancom-navy mb-2">
                    초기 설정
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    설치 후 VS Code를 재시작하고, 명령어
                    팔레트(Ctrl+Shift+P)에서 "한컴 AI: 설정"을 실행하여 초기
                    설정을 완료하세요.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-hancom-blue text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-hancom-navy mb-2">
                    사용 시작
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    프로젝트를 열고 사이드바에서 한컴 AI 아이콘을 클릭하여
                    다양한 기능들을 사용할 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-lg">
            <h2 className="text-3xl font-semibold text-hancom-navy mb-6">
              주요 기능 활용법
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 border border-gray-200 rounded-lg">
                <h3 className="text-xl font-semibold text-hancom-navy mb-3">
                  코드 분석
                </h3>
                <p className="text-gray-600 mb-4">
                  현재 열린 파일의 코드를 자동으로 분석하여 개선점과 최적화
                  방안을 제시합니다.
                </p>
                <div className="bg-gray-50 rounded p-3 text-sm font-mono">
                  Ctrl+Shift+P → "한컴 AI: 코드 분석"
                </div>
              </div>

              <div className="p-6 border border-gray-200 rounded-lg">
                <h3 className="text-xl font-semibold text-hancom-navy mb-3">
                  스마트 리팩토링
                </h3>
                <p className="text-gray-600 mb-4">
                  선택한 코드 블록을 더 효율적이고 읽기 쉬운 코드로 자동
                  리팩토링합니다.
                </p>
                <div className="bg-gray-50 rounded p-3 text-sm font-mono">
                  코드 선택 → 우클릭 → "한컴 AI로 리팩토링"
                </div>
              </div>

              <div className="p-6 border border-gray-200 rounded-lg">
                <h3 className="text-xl font-semibold text-hancom-navy mb-3">
                  문서 자동 생성
                </h3>
                <p className="text-gray-600 mb-4">
                  함수와 클래스에 대한 문서를 자동으로 생성하여 코드의 가독성을
                  향상시킵니다.
                </p>
                <div className="bg-gray-50 rounded p-3 text-sm font-mono">
                  함수 위에서 /** 입력 후 Tab
                </div>
              </div>

              <div className="p-6 border border-gray-200 rounded-lg">
                <h3 className="text-xl font-semibold text-hancom-navy mb-3">
                  테스트 생성
                </h3>
                <p className="text-gray-600 mb-4">
                  선택한 함수나 클래스에 대한 단위 테스트를 자동으로 생성합니다.
                </p>
                <div className="bg-gray-50 rounded p-3 text-sm font-mono">
                  Ctrl+Shift+P → "HAPA AI Assistant: 테스트 생성"
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuidePage;
