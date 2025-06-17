# HAPA Frontend 🎨

HAPA 프론트엔드는 VSCode 확장 프로그램과 React 웹 인터페이스로 구성된 사용자 인터페이스입니다.

## 📂 구조 개요

```
Frontend/
├── vscode-extension/        # VSCode 확장 프로그램
│   ├── src/                # TypeScript 소스 코드
│   │   ├── extension.ts    # 메인 확장 진입점
│   │   ├── modules/        # 핵심 모듈들
│   │   ├── providers/      # Webview 프로바이더
│   │   └── templates/      # HTML 템플릿
│   ├── package.json        # 확장 프로그램 매니페스트
│   └── tsconfig.json       # TypeScript 설정
├── landing-page/           # React 웹 인터페이스
│   ├── src/               # React 소스 코드
│   │   ├── components/    # React 컴포넌트
│   │   └── styles/       # 스타일 파일
│   ├── package.json      # React 앱 설정
│   └── tailwind.config.js # Tailwind CSS 설정
└── docs/                  # 프론트엔드 문서
    ├── extension_development_survey.md
    └── web_interface_tech_stack.md
```

## 🔧 VSCode 확장 프로그램

### 주요 기능

- **사이드바 통합**: Activity Bar에 HAPA 아이콘 표시
- **AI 어시스턴트 인터페이스**: 질문/응답 분할 패널
- **컨텍스트 메뉴 통합**: 우클릭 메뉴에 HAPA 기능 추가
- **자동 코드 삽입**: AI 응답을 에디터에 직접 삽입
- **설정 관리**: 사용자 설정 및 API 키 관리

### 설치 및 개발

```bash
cd Frontend/vscode-extension
npm install
npm run compile

# VSCode에서 개발 환경 실행
code .
# F5 키를 눌러 확장 프로그램 테스트
```

### 핵심 모듈

- **apiClient.ts**: 백엔드 API 통신
- **triggerDetector.ts**: 자동 트리거 감지
- **promptExtractor.ts**: 코드에서 프롬프트 추출
- **inserter.ts**: 생성된 코드 삽입

## 🌐 React 웹 인터페이스

### 주요 기능

- **VSCode 스타일 재현**: 확장 프로그램과 동일한 디자인
- **반응형 디자인**: 모바일/태블릿/데스크톱 지원
- **Live Demo**: 실제 확장 프로그램 기능 미리보기
- **현대적 UI/UX**: Tailwind CSS 기반 스타일링

### 설치 및 실행

```bash
cd Frontend/landing-page
npm install
npm start
```

웹 인터페이스는 `http://localhost:3000`에서 실행됩니다.

### 컴포넌트 구조

- **Layout**: 헤더, 푸터, 메인 레이아웃
- **Pages**: 홈, 가이드, 소개 페이지
- **UI Components**: 버튼, 카드, 데모 컴포넌트

## 🎨 디자인 시스템

### 색상 팔레트

- **Primary**: #007ACC (VSCode Blue)
- **Secondary**: #0E639C (Dark Blue)
- **Background**: #1E1E1E (Dark Theme)
- **Text**: #CCCCCC (Light Text)

### 스타일 가이드

- **폰트**: 'Segoe UI', system fonts
- **간격**: 4px 단위 그리드 시스템
- **둥근 모서리**: 4px, 8px 기본 값
- **그림자**: 미묘한 box-shadow 효과

## 🛠️ 기술 스택

### VSCode 확장

- **언어**: TypeScript
- **빌드**: VSCode Extension API
- **패키징**: vsce (Visual Studio Code Extension)
- **테스트**: Mocha + TypeScript

### React 웹앱

- **프레임워크**: React 18+
- **언어**: TypeScript
- **스타일링**: Tailwind CSS + Custom CSS
- **빌드**: Create React App
- **라우팅**: React Router DOM

## 📱 반응형 디자인

### 브레이크포인트

- **Mobile**: 0-767px
- **Tablet**: 768-1023px
- **Desktop**: 1024px+

### 적응형 요소

- 네비게이션 메뉴 (햄버거 메뉴)
- 그리드 레이아웃 (1/2/3 컬럼)
- 폰트 크기 및 간격 조정

## 🚀 배포

### VSCode 확장 배포

```bash
cd Frontend/vscode-extension
npm run package
# .vsix 파일 생성 후 VSCode Marketplace에 게시
```

### 웹앱 배포

```bash
cd Frontend/landing-page
npm run build
# build/ 디렉토리를 웹 서버에 배포
```

## 🧪 테스트

### 확장 프로그램 테스트

```bash
cd Frontend/vscode-extension
npm test
```

### 웹앱 테스트

```bash
cd Frontend/landing-page
npm test
```

## 📚 관련 문서

- [확장 프로그램 개발 가이드](extension_development_survey.md)
- [웹 인터페이스 기술 스택](web_interface_tech_stack.md)

## 🔄 개발 워크플로우

1. **요구사항 분석**: 기능 정의 및 사용자 시나리오
2. **디자인**: VSCode 스타일 가이드 준수
3. **구현**: TypeScript/React 개발
4. **테스트**: 단위 테스트 및 통합 테스트
5. **배포**: 패키징 및 배포

## 📞 문의 및 지원

프론트엔드 관련 문의사항은 GitHub Issues를 통해 제출해 주세요.

---

**버전**: v0.4.0  
**상태**: 프로덕션 준비 완료
