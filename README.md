# HAPA (Hancom AI Python Assistant) VSCode Extension

🤖 한컴에서 개발한 AI 기반 Python 개발 지원 VSCode 확장 프로그램

## 🎯 리팩토링 완료 (2024)

이 프로젝트는 **5단계 포괄적 리팩토링**을 완료하여 코드 품질과 유지보수성을 크게 향상시켰습니다.

### ✅ 완료된 리팩토링 단계

#### 1단계: ExtensionManager 분할 ✅

- **ProviderRegistry**: 모든 프로바이더 등록 및 생명주기 관리
- **CommandRegistry**: VSCode 명령어 등록 및 라우팅 관리
- **ServiceManager**: 서비스 초기화 순서 및 의존성 관리
- **결과**: 단일 책임 원칙 적용, 895줄 → 각 클래스 200-300줄로 분할

#### 2단계: API Client 리팩토링 ✅

- **StreamingCodeGenerator**: 실시간 스트리밍 코드 생성 전용
- **CodeCompletionProvider**: 코드 자동완성 및 인라인 완성 전용
- **결과**: 기능별 전문화, 안전성 강화, 타임아웃 관리 개선

#### 3단계: SidebarScripts 분리 ✅

- **sidebar-main.js**: 순수 JavaScript로 분리된 사이드바 로직
- **SidebarScripts.ts**: 외부 파일 로드 관리자로 변경
- **결과**: 프론트엔드/백엔드 분리, 캐싱 및 개발 모드 지원

#### 4단계: 메시지 시스템 타입 안전성 ✅

- **TypedMessageHandler**: 완전한 타입 안전 메시지 처리
- **포괄적 타입 정의**: 모든 메시지 타입 명시적 정의
- **결과**: 런타임 오류 방지, IDE 지원 향상, 코드 안정성 확보

#### 5단계: 포괄적 테스트 ✅

- **단위 테스트**: 각 컴포넌트별 독립 테스트
- **통합 테스트**: 전체 시스템 연동 테스트
- **결과**: 테스트 커버리지 대폭 향상, 지속적 품질 보장

### 🏗️ 개선된 아키텍처

```
Frontend/vscode-extension/src/
├── core/                    # 핵심 관리 클래스들
│   ├── ExtensionManager.ts  # 전체 확장 관리 (간소화됨)
│   ├── ProviderRegistry.ts  # 프로바이더 등록 관리
│   ├── CommandRegistry.ts   # 명령어 등록 관리
│   ├── ServiceManager.ts    # 서비스 초기화 관리
│   └── TypedMessageHandler.ts # 타입 안전 메시지 처리
├── modules/                 # 전문화된 모듈들
│   ├── StreamingCodeGenerator.ts # 스트리밍 코드 생성
│   ├── CodeCompletionProvider.ts # 코드 자동완성
│   └── apiClient.ts         # API 클라이언트 (리팩토링됨)
├── templates/scripts/       # 분리된 스크립트들
│   ├── sidebar-main.js      # 순수 JavaScript 사이드바 로직
│   └── SidebarScripts.ts    # 스크립트 로드 관리자
└── test/                    # 포괄적 테스트 슈트
    ├── ProviderRegistry.test.ts
    ├── CommandRegistry.test.ts
    ├── TypedMessageHandler.test.ts
    └── Integration.test.ts
```

## 🚀 빠른 시작

### 설치 및 개발 환경 설정

```bash
# 저장소 클론
git clone [repository-url]
cd Frontend/vscode-extension

# 의존성 설치
npm install

# 컴파일
npm run compile

# 확장 프로그램 실행 (F5 또는)
npm run watch
```

### 테스트 실행

```bash
# 모든 테스트 실행
npm test

# 특정 테스트 파일 실행
npm test -- --grep "ProviderRegistry"
npm test -- --grep "CommandRegistry"
npm test -- --grep "TypedMessageHandler"
npm test -- --grep "Integration"

# 테스트 커버리지 확인
npm run test:coverage
```

### VS Code에서 디버깅

1. **F5** 또는 `Ctrl+F5`로 확장 개발 환경 실행
2. **Ctrl+Shift+P** → "HAPA Extension 테스트" 선택하여 테스트 실행
3. **개발자 도구** (`Ctrl+Shift+I`)로 디버깅 정보 확인

## 🎯 주요 기능

### 🤖 AI 기반 코드 생성

- **실시간 스트리밍**: 코드 생성 과정을 실시간으로 확인
- **다중 모델 지원**: autocomplete, prompt, comment, error_fix 모델
- **컨텍스트 인식**: 현재 파일과 프로젝트 구조를 고려한 지능형 생성

### 💡 지능형 자동완성

- **인라인 완성**: 타이핑하면서 즉시 제안
- **함수 시그니처**: 매개변수와 반환값 자동 추론
- **스마트 완성**: 프로젝트 스타일에 맞는 코드 제안

### 🔍 코드 분석 및 개선

- **버그 탐지**: AI가 잠재적 문제점 식별
- **코드 리뷰**: 개선점과 최적화 제안
- **테스트 생성**: 자동 단위 테스트 코드 생성

### 🎨 사용자 경험

- **한국어 UI**: 완전한 한국어 인터페이스
- **접근성 지원**: 스크린 리더, 키보드 네비게이션
- **반응형 디자인**: 다양한 화면 크기 지원
- **다크/라이트 테마**: VSCode 테마에 맞춰 자동 조정

## 🛠️ 기술 스택

### Frontend (VSCode Extension)

- **TypeScript**: 타입 안전성과 개발 생산성
- **React**: 사이드바 및 웹뷰 UI 컴포넌트
- **VSCode API**: 확장 프로그램 통합
- **WebSocket**: 실시간 AI 응답 스트리밍

### Backend Integration

- **FastAPI**: 고성능 Python 웹 프레임워크
- **vLLM**: 대규모 언어 모델 추론 엔진
- **Redis**: 세션 및 캐시 관리
- **PostgreSQL**: 사용자 데이터 및 히스토리 저장

### AI Models

- **LLaMA 2**: 코드 생성 및 분석
- **CodeLLaMA**: 코드 특화 모델
- **Custom Fine-tuned**: 한국어 및 프로젝트 특화 모델

## 📊 성능 최적화

- **스트리밍 아키텍처**: 청크 기반 실시간 응답
- **지능형 캐싱**: 자주 사용되는 응답 캐시
- **오프라인 지원**: 네트워크 연결 없이도 기본 기능 사용
- **메모리 최적화**: 가비지 컬렉션 및 리소스 관리

## 🔐 보안 및 개인정보

- **로컬 처리**: 민감한 코드는 로컬에서만 분석
- **암호화 통신**: HTTPS/WSS를 통한 안전한 데이터 전송
- **선택적 텔레메트리**: 사용자가 제어하는 데이터 수집
- **GDPR 준수**: 유럽 개인정보보호법 준수

## 🧪 테스트 아키텍처

### 단위 테스트

```typescript
// ProviderRegistry 테스트 예시
test("프로바이더 등록 성공", async () => {
  const registry = new ProviderRegistry(extensionUri);
  await registry.registerAllProviders(context);

  const providerCount = registry.getProviderCount();
  assert.ok(providerCount > 0);
});
```

### 통합 테스트

```typescript
// 전체 시스템 통합 테스트 예시
test("확장 시작부터 명령어 실행까지", async () => {
  const extensionManager = new ExtensionManager(context);
  await extensionManager.activate();

  const commands = await vscode.commands.getCommands();
  const hapaCommands = commands.filter((cmd) => cmd.startsWith("hapa."));
  assert.ok(hapaCommands.length > 0);
});
```

### 메시지 시스템 테스트

```typescript
// 타입 안전 메시지 처리 테스트
test("타입 안전 메시지 전송", async () => {
  const handler = new TypedMessageHandler();
  const result = await handler.sendToWebview({
    command: "showStatus",
    message: "Test message",
  });
  assert.strictEqual(result, true);
});
```

## 🚀 배포 및 CI/CD

### 개발 환경

```bash
npm run dev     # 개발 모드 실행
npm run build   # 프로덕션 빌드
npm run package # VSIX 패키지 생성
```

### 프로덕션 배포

```bash
# 버전 업데이트
npm version patch|minor|major

# 마켓플레이스 배포
vsce publish

# GitHub 릴리즈
gh release create v1.x.x ./hapa-extension.vsix
```

## 📈 로드맵

### 2024 Q4

- ✅ 5단계 리팩토링 완료
- ✅ 포괄적 테스트 슈트 구축
- 🔄 성능 최적화 및 메모리 사용량 개선

### 2025 Q1

- 🔜 다국어 지원 확장 (영어, 일본어)
- 🔜 플러그인 시스템 도입
- 🔜 커뮤니티 모델 지원

### 2025 Q2

- 🔜 Visual Studio 확장 버전
- 🔜 웹 기반 IDE 지원
- 🔜 모바일 컴패니언 앱

## 🤝 기여하기

### 개발 가이드라인

1. **이슈 확인**: GitHub Issues에서 작업할 이슈 선택
2. **브랜치 생성**: `feature/기능명` 또는 `fix/버그명`
3. **테스트 작성**: 새 기능에 대한 테스트 필수
4. **코드 리뷰**: PR 생성 후 팀 리뷰 진행

### 코딩 스타일

- **TypeScript**: 엄격한 타입 체크 활성화
- **ESLint + Prettier**: 자동 코드 포맷팅
- **JSDoc**: 모든 public 메서드에 문서화
- **Test Coverage**: 최소 80% 이상 유지

## 📞 지원 및 피드백

- **GitHub Issues**: 버그 신고 및 기능 요청
- **Discord**: 실시간 커뮤니티 지원
- **이메일**: hapa-support@hancom.com
- **문서**: [HAPA 공식 문서](https://hapa.hancom.com/docs)

## 📜 라이선스

이 프로젝트는 [MIT 라이선스](LICENSE) 하에 배포됩니다.

---

🎉 **HAPA와 함께 더 스마트한 Python 개발을 경험해보세요!**
