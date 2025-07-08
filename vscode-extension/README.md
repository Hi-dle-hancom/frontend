# 🚀 HAPA - Hancom AI Python Assistant

<div align="center">

![HAPA Logo](media/icon.svg)

**당신만의 AI 코딩 어시스턴트**

[![Version](https://img.shields.io/badge/version-0.4.0-blue.svg)](package.json)
[![VSCode](https://img.shields.io/badge/vscode-%5E1.80.0-blue.svg)](https://code.visualstudio.com/)
[![TypeScript](https://img.shields.io/badge/typescript-^4.9.5-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

[설치하기](#설치) • [사용법](#사용법) • [기능](#주요-기능) • [설정](#설정) • [문서](#문서) • [기여하기](#기여하기)

</div>

## 📋 목차

- [개요](#개요)
- [주요 기능](#주요-기능)
- [설치](#설치)
- [빠른 시작](#빠른-시작)
- [사용법](#사용법)
- [설정](#설정)
- [아키텍처](#아키텍처)
- [개발](#개발)
- [기여하기](#기여하기)
- [라이선스](#라이선스)

## 🎯 개요

HAPA(Hancom AI Python Assistant)는 VSCode를 위한 지능형 AI 코딩 어시스턴트입니다.
개인화된 온보딩부터 실시간 코드 생성까지, 당신의 Python 개발 생산성을 극대화합니다.

### ✨ 핵심 가치

- **🎯 개인화**: 당신의 스킬 레벨과 선호도에 맞춘 맞춤형 AI 어시스턴트
- **⚡ 실시간**: 스트리밍 기반 실시간 코드 생성
- **🧠 지능형**: 컨텍스트를 이해하는 고급 AI 엔진
- **♿ 접근성**: 모든 사용자를 위한 포용적 설계
- **🚀 성능**: 최적화된 메모리 관리와 성능

## 🌟 주요 기능

### 🎨 개인화된 온보딩

- **6단계 설정 과정**: 스킬 레벨부터 선호하는 코드 스타일까지
- **자동 API 키 발급**: 번거로운 설정 없이 바로 시작
- **PostgreSQL 연동**: 안전한 설정 저장과 동기화

### 🤖 지능형 AI 어시스턴트

- **실시간 스트리밍**: 코드가 생성되는 과정을 실시간으로 확인
- **컨텍스트 인식**: 현재 작업 중인 코드를 이해하고 적절한 제안
- **다양한 응답 모드**: 즉시 삽입, 사이드바 표시, 확인 후 삽입 등

### 💡 스마트 코드 완성

- **VSCode 통합**: 기존 IntelliSense와 완벽 호환
- **신뢰도 기반 필터링**: 높은 품질의 제안만 표시
- **설명 포함**: 각 제안에 대한 상세한 설명 제공

### 🔧 고급 기능

- **주석 기반 트리거**: `# 피보나치 함수 만들어줘`처럼 주석으로 코드 생성
- **선택 영역 분석**: 코드를 선택하고 우클릭으로 분석 및 개선
- **테스트 자동 생성**: 함수나 클래스에 대한 단위 테스트 자동 생성

### ♿ 접근성 기능

- **스크린 리더 지원**: NVDA, JAWS, VoiceOver 호환
- **키보드 네비게이션**: 모든 기능을 키보드로 사용 가능
- **고대비 모드**: 시각적 접근성 향상
- **음성 안내**: 중요한 상태 변경 시 음성 피드백

### 📊 성능 최적화

- **메모리 관리**: 자동 가비지 컬렉션과 리소스 최적화
- **성능 모니터링**: 실시간 성능 지표 추적
- **오프라인 지원**: 네트워크 상태에 관계없이 안정적 동작

## 📦 설치

### VSCode Marketplace에서 설치

1. VSCode를 열고 `Ctrl+Shift+X` (또는 `Cmd+Shift+X`)로 Extensions 탭을 엽니다
2. "HAPA"를 검색합니다
3. "설치" 버튼을 클릭합니다

### 수동 설치 (.vsix 파일)

```bash
# .vsix 파일을 다운로드한 후
code --install-extension hapa-0.4.0.vsix
```

### 개발용 설치

```bash
# 저장소 클론
git clone https://github.com/hancom/hapa-vscode-extension.git
cd hapa-vscode-extension/Frontend/vscode-extension

# 종속성 설치
npm install

# 컴파일
npm run compile

# VSCode에서 F5를 눌러 Extension Development Host 실행
```

## 🚀 빠른 시작

### 1. 설치 후 첫 실행

1. VSCode를 재시작합니다
2. Activity Bar에서 🤖 HAPA 아이콘을 클릭합니다
3. "온보딩 시작" 버튼을 클릭하여 개인화 설정을 진행합니다

### 2. 온보딩 과정

- **1단계**: 이메일 및 사용자명 입력
- **2단계**: Python 스킬 레벨 선택
- **3단계**: 코드 출력 구조 선호도
- **4단계**: 설명 스타일 선택
- **5단계**: 개발 분야 및 언어 기능 선택
- **6단계**: 주석 트리거 워크플로우 설정

### 3. 첫 번째 코드 생성

```python
# 피보나치 수열을 계산하는 함수를 만들어주세요
```

위 주석을 입력하고 사이드바에서 결과를 확인하세요!

## 📖 사용법

### 🗨️ 사이드바에서 질문하기

1. Activity Bar에서 HAPA 아이콘 클릭
2. 하단 입력창에 원하는 작업을 자연어로 입력
3. 전송 버튼 클릭 또는 `Enter`
4. 스트리밍으로 실시간 응답 확인
5. "Insert" 버튼으로 코드를 에디터에 삽입

**예시 질문들:**

```
- "리스트에서 중복을 제거하는 함수를 만들어주세요"
- "파일을 읽어서 JSON으로 파싱하는 코드가 필요해요"
- "pandas DataFrame을 정렬하는 방법을 알려주세요"
- "async/await를 사용한 HTTP 요청 예제를 보여주세요"
```

### 🖱️ 컨텍스트 메뉴 사용하기

1. 분석하고 싶은 코드를 선택
2. 마우스 우클릭
3. HAPA 메뉴에서 원하는 작업 선택:
   - **HAPA: 선택 영역 분석** - 코드 분석 및 개선점 제안
   - **HAPA: 선택 영역 테스트 생성** - 단위 테스트 자동 생성
   - **HAPA: 선택 영역 설명** - 코드 동작 원리 설명

### 💬 주석 기반 트리거

Python 파일에서 주석으로 원하는 작업을 설명하면 자동으로 코드를 생성합니다:

```python
# TODO: 사용자 인증을 처리하는 데코레이터 함수

# FIXME: 이 함수의 성능을 개선해주세요
def slow_function():
    pass

# 데이터베이스 연결을 관리하는 컨텍스트 매니저
```

### ⚡ 자동 완성

타이핑하는 동안 자동으로 제안이 나타납니다:

- **Tab**: 제안 수락
- **Esc**: 제안 취소
- **Ctrl+Space**: 수동으로 제안 요청

### ⌨️ 키보드 단축키

- `Ctrl+Shift+P` → "HAPA" 검색하여 모든 명령어 확인
- `F1` → Command Palette에서 HAPA 명령어 실행

## ⚙️ 설정

### 기본 설정

`File > Preferences > Settings`에서 "HAPA"를 검색하거나, `Ctrl+,`로 설정을 열 수 있습니다.

#### 🌐 API 설정

```json
{
  "hapa.apiBaseURL": "http://3.13.240.111:8000/api/v1",
  "hapa.apiKey": "your-api-key-here",
  "hapa.apiTimeout": 30000
}
```

#### 🎨 사용자 프로필

```json
{
  "hapa.userProfile.pythonSkillLevel": "intermediate",
  "hapa.userProfile.codeOutputStructure": "standard",
  "hapa.userProfile.explanationStyle": "standard",
  "hapa.userProfile.projectContext": "general_purpose",
  "hapa.userProfile.preferredLanguageFeatures": ["type_hints", "f_strings"]
}
```

#### 💬 주석 트리거 설정

```json
{
  "hapa.commentTrigger.resultDisplayMode": "sidebar",
  "hapa.commentTrigger.autoInsertDelay": 0,
  "hapa.commentTrigger.showNotification": true
}
```

#### 🤖 자동 완성 설정

```json
{
  "hapa.autoComplete.maxSuggestions": 5,
  "hapa.autoComplete.confidenceThreshold": 0.3,
  "hapa.autoComplete.enableInlineCompletion": true,
  "hapa.autoComplete.showExplanations": true
}
```

#### ♿ 접근성 설정

```json
{
  "hapa.accessibility.highContrast": false,
  "hapa.accessibility.largeText": false,
  "hapa.accessibility.screenReaderOptimized": false,
  "hapa.accessibility.keyboardNavigation": true,
  "hapa.accessibility.announcements": false,
  "hapa.accessibility.fontSize": 14
}
```

### 🔧 고급 설정

#### 성능 최적화

```json
{
  "hapa.autoComplete.debounceDelay": 300,
  "hapa.responsive.debounceDelay": 150,
  "hapa.enableLogging": false
}
```

#### 텔레메트리 (선택사항)

```json
{
  "hapa.telemetry.enabled": false,
  "hapa.telemetry.consented": false
}
```

### 📤 설정 내보내기/가져오기

1. Command Palette에서 `HAPA: 설정 보기` 실행
2. "설정 내보내기" 버튼으로 JSON 파일 생성
3. "설정 가져오기"로 다른 환경에서 설정 복원

## 🏗️ 아키텍처

HAPA는 확장성과 성능을 고려한 모듈화된 아키텍처를 사용합니다:

```
📁 src/
├── 📁 core/               # 핵심 관리 클래스
│   └── ExtensionManager.ts
├── 📁 providers/          # 웹뷰 프로바이더들
│   ├── SidebarProvider.ts
│   ├── OnboardingProvider.ts
│   ├── SettingsProvider.ts
│   ├── GuideProvider.ts
│   └── CompletionProvider.ts
├── 📁 services/           # 싱글톤 서비스들
│   ├── ConfigService.ts
│   ├── MemoryManager.ts
│   ├── PerformanceOptimizer.ts
│   ├── EnhancedErrorService.ts
│   ├── TelemetryService.ts
│   ├── AccessibilityService.ts
│   ├── ResponsiveDesignService.ts
│   └── OfflineService.ts
├── 📁 modules/            # 핵심 기능 모듈들
│   ├── apiClient.ts
│   ├── triggerDetector.ts
│   ├── promptExtractor.ts
│   └── inserter.ts
├── 📁 templates/          # 분할된 HTML 템플릿
│   ├── SidebarHtmlGenerator.ts
│   ├── 📁 components/
│   ├── 📁 styles/
│   └── 📁 scripts/
├── 📁 types/              # TypeScript 타입 정의
│   └── index.ts
└── extension.ts           # 진입점
```

자세한 아키텍처 설명은 [ARCHITECTURE.md](ARCHITECTURE.md)를 참조하세요.

### 🎯 주요 설계 원칙

- **모듈화**: 각 기능이 독립적으로 개발/테스트 가능
- **확장성**: 새로운 기능을 쉽게 추가할 수 있는 구조
- **성능**: 메모리 최적화와 지연 로딩
- **접근성**: 모든 사용자가 사용할 수 있는 포용적 설계
- **유지보수성**: 명확한 책임 분리와 문서화

## 🛠️ 개발

### 개발 환경 설정

```bash
# 필수 조건
node --version  # v16+ 필요
npm --version   # v7+ 필요

# 프로젝트 클론
git clone https://github.com/hancom/hapa-vscode-extension.git
cd hapa-vscode-extension/Frontend/vscode-extension

# 종속성 설치
npm install

# 개발 모드로 컴파일
npm run watch
```

### 🧪 테스트

```bash
# 린팅
npm run lint

# 테스트 실행 전 컴파일
npm run pretest

# 모든 테스트 실행
npm test
```

### 📦 빌드

```bash
# 프로덕션 빌드
npm run compile

# VSCode 확장 패키징
npm run vscode:prepublish
```

### 🐛 디버깅

1. VSCode에서 프로젝트 폴더 열기
2. `F5` 키로 Extension Development Host 실행
3. 새 VSCode 창에서 확장 기능 테스트
4. 원본 창에서 디버그 콘솔 확인

### 📝 코딩 스타일

- **TypeScript**: 엄격한 타입 검사
- **ESLint**: 코드 품질 검사
- **Prettier**: 자동 코드 포맷팅
- **JSDoc**: 함수 및 클래스 문서화

## 🤝 기여하기

HAPA 프로젝트에 기여해주세요! 모든 형태의 기여를 환영합니다.

### 🐛 버그 리포트

[GitHub Issues](https://github.com/hancom/hapa-vscode-extension/issues)에서 버그를 신고해주세요.

**버그 리포트 템플릿:**

- VSCode 버전
- HAPA 확장 버전
- 운영체제
- 재현 단계
- 예상 동작
- 실제 동작
- 스크린샷 (선택사항)

### ✨ 기능 제안

새로운 기능에 대한 아이디어가 있으시면 [Feature Request](https://github.com/hancom/hapa-vscode-extension/issues/new)를 작성해주세요.

### 💻 코드 기여

1. 저장소 포크
2. 기능 브랜치 생성 (`git checkout -b feature/amazing-feature`)
3. 변경사항 커밋 (`git commit -m 'Add amazing feature'`)
4. 브랜치에 푸시 (`git push origin feature/amazing-feature`)
5. Pull Request 생성

### 📖 문서 기여

- README 개선
- 코드 주석 추가
- 튜토리얼 작성
- 번역

### 🌍 번역

현재 지원 언어:

- 🇰🇷 한국어
- 🇺🇸 영어

새로운 언어 번역에 참여하고 싶으시면 이슈를 생성해주세요.

## 📄 라이선스

이 프로젝트는 [MIT License](LICENSE) 하에 배포됩니다.

```
MIT License

Copyright (c) 2024 Hancom

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 📞 지원 및 문의

### 🆘 도움이 필요하신가요?

- [사용 가이드](src/providers/GuideProvider.ts) - 확장 프로그램 내 가이드
- [GitHub Issues](https://github.com/hancom/hapa-vscode-extension/issues) - 버그 신고 및 질문
- [GitHub Discussions](https://github.com/hancom/hapa-vscode-extension/discussions) - 커뮤니티 토론

### 📧 연락처

- **개발팀**: hapa-dev@hancom.com
- **지원팀**: hapa-support@hancom.com

## 🏆 감사의 말

HAPA를 더 나은 제품으로 만들어주신 모든 기여자분들께 감사드립니다:

- 🎨 **UI/UX 디자인**: 사용자 경험 개선
- 🧪 **테스터**: 버그 발견 및 품질 향상
- 📝 **문서화**: 문서 작성 및 번역
- 💡 **아이디어 제공**: 새로운 기능 제안
- 🐛 **버그 리포트**: 안정성 향상

### 🌟 특별 감사

- VSCode 팀 - 훌륭한 확장 API 제공
- TypeScript 팀 - 강력한 타입 시스템
- OpenAI 및 AI 커뮤니티 - AI 기술 발전

---

<div align="center">

**HAPA와 함께 더 스마트한 Python 개발을 경험하세요! 🐍✨**

Made with ❤️ by [Hancom](https://www.hancom.com) & [하이들(Hi-dle) Team](https://github.com/hancom)

</div>
