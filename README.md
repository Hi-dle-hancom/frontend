# 실시간 온라인 경매 시스템 (Improved)

![TypeScript](https://img.shields.io/badge/TypeScript-4.9.5-3178C6.svg)
![Node.js](https://img.shields.io/badge/Node.js-18.x-339933.svg)
![Express](https://img.shields.io/badge/Express-5.0.0-000000.svg)
![MongoDB](https://img.shields.io/badge/MongoDB-6.0-47A248.svg)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8.1-010101.svg)
![Jest](https://img.shields.io/badge/Jest-29.7.0-C21325.svg)

## 프로젝트 소개

이 프로젝트는 Node.js, TypeScript, Express, MongoDB를 사용한 실시간 온라인 경매 시스템입니다. 사용자들이 경매를 등록하고 실시간으로 입찰에 참여할 수 있는 플랫폼을 제공합니다. Socket.IO를 활용하여 실시간 상호작용을 구현했으며, 견고한 아키텍처와 테스트 코드를 통해 안정적인 서비스를 제공합니다.

## 기술적 특징

- **TypeScript**: 정적 타입 시스템을 통한 코드 안정성 확보
- **클린 아키텍처**: 계층화된 구조(Controllers, Services, Models)로 관심사 분리
- **테스트 자동화**: Jest를 이용한 단위 테스트 구현
- **확장성 있는 설계**: 유연한 API 구조와 서비스 레이어 패턴 적용
- **실시간 상호작용**: Socket.IO를 활용한 실시간 경매 기능
- **코드 품질 관리**: ESLint와 Prettier를 통한 일관된 코드 스타일 유지

## 주요 기능

### 1. 사용자 관리

- 회원가입 및 로그인
- 세션 기반 인증
- 사용자별 보유 자산 관리

### 2. 경매 관리

- 경매 등록
  - 경매명, 시작 가격, 이미지, 상세 설명 입력
  - 이미지 업로드 기능 (최대 10MB)
- 경매 목록 조회
  - 전체 경매 목록 확인
  - 내가 등록한 경매 목록 확인
- 경매 상세 정보
  - 경매 정보 상세 조회
  - 실시간 입찰 현황 확인
  - 남은 시간 실시간 표시

### 3. 입찰 시스템

- 실시간 입찰 기능
- 입찰 규칙 적용
  - 시작 가격보다 높은 금액만 입찰 가능
  - 이전 입찰가보다 높은 금액만 입찰 가능
  - 자신이 등록한 경매에는 입찰 불가
  - 경매 종료 후 입찰 불가
- 실시간 입찰 내역 확인

### 4. 실시간 기능

- Socket.IO를 활용한 실시간 업데이트
- 새로운 입찰 발생 시 실시간 알림
- 경매 종료 시간 실시간 카운트다운

## 프로젝트 아키텍처

### 클린 아키텍처 적용

```
src/
├── app.ts                # 애플리케이션 진입점
├── config/               # 설정 모듈
├── controllers/          # 컨트롤러 레이어
├── middlewares/          # 미들웨어
├── models/               # 데이터 모델
├── routes/               # 라우팅
├── services/             # 비즈니스 로직
├── tests/                # 테스트 코드
├── types/                # 타입 정의
└── utils/                # 유틸리티 함수
```

### 기술 스택

#### 백엔드

- **언어**: TypeScript, Node.js
- **웹 프레임워크**: Express.js
- **데이터베이스**: MongoDB (Mongoose ODM)
- **실시간 통신**: Socket.IO
- **인증**: Express Session

#### 프론트엔드

- **템플릿 엔진**: Nunjucks
- **CSS**: Modern CSS
- **JavaScript**: 클라이언트 측 기능
- **아이콘**: Font Awesome

#### 개발 도구

- **테스트**: Jest, ts-jest
- **코드 품질**: ESLint, Prettier
- **패키지 관리**: npm
- **CI/CD**: GitHub Actions (계획)

## 설치 및 실행

### 필수 요구사항

- Node.js (v14 이상)
- MongoDB (v4.4 이상)
- npm 또는 yarn

### 설치 방법

1. 저장소 클론

```bash
git clone https://github.com/yourusername/auction_mongo_improved.git
cd auction_mongo_improved
```

2. 의존성 설치

```bash
npm install
```

3. 환경 변수 설정
   `.env` 파일을 생성하고 다음 내용을 설정:

```
PORT=2000
HOST=localhost
COOKIE_SECRET=your_cookie_secret
MONGO_URI=mongodb://localhost:27017/auction
NODE_ENV=development
```

4. 빌드

```bash
npm run build
```

5. 서버 실행

```bash
npm start
```

### 개발 모드 실행

```bash
npm run dev
```

## 테스트

### 전체 테스트 실행

```bash
npm test
```

### 테스트 커버리지 확인

```bash
npm run test:coverage
```

## 코드 품질 관리

### 린팅

```bash
npm run lint
```

### 코드 포맷팅

```bash
npm run format
```

## 코드 기여 가이드라인

1. 이 저장소를 포크합니다.
2. 새 기능 브랜치를 생성합니다 (`git checkout -b feature/amazing-feature`).
3. 변경 사항을 커밋합니다 (`git commit -m 'Add some amazing feature'`).
4. 브랜치에 푸시합니다 (`git push origin feature/amazing-feature`).
5. Pull Request를 생성합니다.

## 개선된 기능

### 1. TypeScript 기반 재구성

- 정적 타입 시스템을 통한 코드 안정성 확보
- 인터페이스와 타입 정의를 통한 명확한 API 계약

### 2. 클린 아키텍처 적용

- 모델, 서비스, 컨트롤러 계층으로 관심사 분리
- 의존성 주입 패턴을 통한 느슨한 결합

### 3. 테스트 자동화

- Jest를 이용한 자동화된 단위 테스트
- 모킹을 통한 외부 의존성 격리

### 4. 보안 강화

- 입력 데이터 검증 강화
- 세션 보안 설정 개선

### 5. 에러 처리 개선

- 통합된 에러 처리 메커니즘
- 사용자 친화적인 에러 메시지

### 6. 성능 최적화

- 데이터베이스 인덱싱 적용
- 비효율적인 쿼리 개선

## 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.

## 연락처

프로젝트 관리자 - [doseon1226@gmail.com]
