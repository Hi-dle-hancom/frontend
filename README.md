# 사용자 관리 시스템

Node.js, Express, Sequelize ORM, Pug 템플릿 엔진을 사용한 사용자 관리 시스템입니다.
Amazon RDS MySQL 서버에 연결하여 사용자 정보를 관리합니다.

## 기술 스택

- **백엔드**

  - Node.js
  - Express.js
  - Sequelize ORM
  - MySQL (Amazon RDS)

- **프론트엔드**
  - Pug 템플릿 엔진
  - CSS
  - JavaScript

## 주요 기능

### 사용자 관리

- 사용자 목록 조회: 모든 사용자 정보를 테이블 형태로 조회
- 새 사용자 추가: 이름, 나이, 결혼 여부 등의 정보를 입력하여 사용자 등록
- 사용자 정보 수정: 기존 사용자 정보 업데이트
- 사용자 삭제: 등록된 사용자 정보 삭제

## 프로젝트 구조

```
user_management_system/
├── app.js                # 메인 애플리케이션 파일
├── package.json          # 프로젝트 의존성 관리
├── models/               # Sequelize 모델
│   ├── index.js          # 데이터베이스 연결 설정
│   └── user.js           # 사용자 모델 정의
├── routes/               # Express 라우터
│   ├── index.js          # 메인 라우터
│   └── users.js          # 사용자 관리 라우터
├── views/                # Pug 템플릿
│   ├── layout.pug        # 기본 레이아웃
│   ├── error.pug         # 오류 페이지
│   └── users/            # 사용자 관련 뷰
│       ├── index.pug     # 사용자 목록 페이지
│       ├── new.pug       # 새 사용자 등록 폼
│       └── edit.pug      # 사용자 수정 폼
└── public/               # 정적 파일
    └── css/
        └── style.css     # 스타일시트
```

## 구현 상세

### 1. PUG 템플릿 엔진 구현

- **레이아웃 템플릿**: 모든 페이지의 공통 구조 정의 (header, footer 등)
- **사용자 목록 페이지**: 사용자 데이터를 테이블 형식으로 표시
- **사용자 등록 폼**: 새 사용자 정보 입력 양식
- **사용자 수정 폼**: 기존 사용자 정보 수정 양식
- **반응형 디자인**: 다양한 화면 크기에 맞춰 최적화된 UI

### 2. Sequelize ORM 구현

- **데이터베이스 연결**: Amazon RDS MySQL 인스턴스 연결 설정
- **모델 정의**: User 모델 스키마 정의 (name, age, married 필드)
- **CRUD 작업**:
  - Create: 새 사용자 생성 (User.create())
  - Read: 사용자 목록 조회 및 단일 사용자 조회 (User.findAll(), User.findOne())
  - Update: 사용자 정보 업데이트 (User.update())
  - Delete: 사용자 정보 삭제 (User.destroy())

### 3. Express 라우터 구현

- **라우트 분리**: 역할에 따른 라우터 분리로 코드 유지보수성 향상
- **비동기 처리**: async/await 패턴을 사용한 데이터베이스 작업 처리
- **오류 처리**: try-catch 구문을 통한 예외 상황 처리

## 설치 및 실행

### 사전 요구사항

- Node.js (v14 이상)
- Amazon RDS MySQL 인스턴스 접근 권한

### 설치

1. 저장소 클론

```
git clone <repository-url>
cd user_management_system
```

2. 의존성 설치

```
npm install
```

3. Amazon RDS 설정

- 프로젝트는 Amazon RDS MySQL 데이터베이스의 userdb 내 userm 테이블을 사용합니다.
- `models/index.js` 파일에서 RDS 연결 정보(엔드포인트, 사용자이름, 비밀번호)가 올바른지 확인하세요.

### 실행

개발 모드로 실행:

```
npm run dev
```

또는 일반 모드로 실행:

```
npm start
```

브라우저에서 `http://localhost:3200`으로 접속하여 사용할 수 있습니다.

## RDS 연결 정보

현재 설정:

- 데이터베이스: userdb
- 테이블: userm
- 호스트: hancom2.cv88qo4gg15o.ap-northeast-2.rds.amazonaws.com
- 포트: 3306
- 사용자이름: admin

## 개발 정보

이 프로젝트는 Pug 템플릿 엔진과 Sequelize ORM을 동시에 활용하는 방식으로 구현되었습니다.

1. **Pug 템플릿 엔진 활용**: 서버 사이드 렌더링을 통해 동적 HTML 생성

   - 장점: 간결한 문법, 서버에서 데이터와 뷰를 쉽게 통합
   - 사용 방식: Express와 통합하여 라우터에서 `res.render()` 메서드로 템플릿 렌더링

2. **Sequelize ORM 활용**: JavaScript 객체를 통한 데이터베이스 작업
   - 장점: SQL 쿼리 직접 작성 없이 객체 지향적 방식으로 데이터베이스 조작
   - 사용 방식: 모델 정의 후 CRUD 메서드를 통한 데이터 접근 및 조작

## 서버 구성

- 웹 서버 포트: 3200
- 데이터베이스 포트: 3306 (RDS MySQL 기본 포트)
- Express 미들웨어: body-parser, 정적 파일 서빙, 오류 처리 등

## 라이센스

ISC
