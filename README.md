# 사용자 관리 시스템

Node.js, Express, Sequelize ORM, Pug 템플릿 엔진을 사용한 사용자 관리 시스템입니다.
Amazon RDS MySQL 서버에 연결하여 사용자 정보를 관리합니다.

## 프로젝트 개요

이 프로젝트는 Node.js와 Express 프레임워크를 기반으로 한 사용자 관리 웹 애플리케이션입니다. Sequelize ORM을 사용하여 Amazon RDS MySQL 데이터베이스와 상호작용하며, Pug 템플릿 엔진을 통해 서버 사이드 렌더링을 구현했습니다. 이 시스템은 사용자 정보를 생성, 조회, 수정, 삭제할 수 있는 CRUD 기능을 제공합니다.

### 프로젝트 목표

- 서버 사이드 렌더링 방식의 웹 애플리케이션 구현
- Sequelize ORM을 활용한 데이터베이스 작업 수행
- Amazon RDS MySQL 인스턴스와의 안정적인 연결 및 데이터 관리
- 사용자 친화적인 인터페이스 제공

## 기술 스택

- **백엔드**

  - Node.js (v14 이상)
  - Express.js (v4)
  - Sequelize ORM (v6)
  - MySQL (Amazon RDS)

- **프론트엔드**
  - Pug 템플릿 엔진
  - CSS (반응형 디자인)
  - JavaScript (클라이언트 측 기능)

## 주요 기능

### 사용자 관리

- **사용자 목록 조회**: 모든 사용자 정보를 테이블 형태로 조회
- **사용자 상세 정보**: 개별 사용자의 상세 정보 확인
- **새 사용자 추가**: 이름, 나이, 결혼 여부 등의 정보를 입력하여 사용자 등록
- **사용자 정보 수정**: 기존 사용자 정보 업데이트
- **사용자 삭제**: 등록된 사용자 정보 삭제

### 추가 기능

- **실시간 유효성 검사**: 사용자 입력 데이터에 대한 즉각적인 피드백
- **페이지네이션**: 많은 사용자 목록을 페이지 단위로 조회
- **반응형 UI**: 다양한 디바이스 화면 크기에 맞춘 레이아웃 자동 조정

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
- **모델 정의**: User 모델 스키마 정의 (id, name, age, married, created_at, updated_at 필드)
- **CRUD 작업**:
  - Create: 새 사용자 생성 (User.create())
  - Read: 사용자 목록 조회 및 단일 사용자 조회 (User.findAll(), User.findOne())
  - Update: 사용자 정보 업데이트 (User.update())
  - Delete: 사용자 정보 삭제 (User.destroy())

### 3. Express 라우터 구현

- **라우트 분리**: 역할에 따른 라우터 분리로 코드 유지보수성 향상
- **비동기 처리**: async/await 패턴을 사용한 데이터베이스 작업 처리
- **오류 처리**: try-catch 구문을 통한 예외 상황 처리

## 데이터베이스 모델

### User 모델

```javascript
{
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
    comment: "사용자 ID"
  },
  name: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: "사용자 이름"
  },
  age: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    comment: "나이"
  },
  married: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    comment: "결혼 여부"
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: "생성 일시"
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: "수정 일시"
  }
}
```

## 설치 및 실행

### 사전 요구사항

- Node.js (v14 이상)
- npm (v6 이상)
- Amazon RDS MySQL 인스턴스 접근 권한

### 환경 변수 설정 (선택 사항)

```
# .env 파일 생성
RDS_HOSTNAME=hancom2.cv88qo4gg15o.ap-northeast-2.rds.amazonaws.com
RDS_USERNAME=admin
RDS_PASSWORD=lds*13041226
RDS_DB_NAME=userdb
RDS_PORT=3306
```

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
- `models/index.js` 파일에서 RDS 연결 정보가 올바른지 확인하세요.

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

- **데이터베이스**: userdb
- **테이블**: userm
- **호스트**: hancom2.cv88qo4gg15o.ap-northeast-2.rds.amazonaws.com
- **포트**: 3306
- **사용자이름**: admin
- **연결 풀**: 최대 10개, 최소 0개
- **타임아웃 설정**: acquire 30000ms, idle 10000ms

### 데이터베이스 정보

이 애플리케이션은 'userdb' 데이터베이스를, 다른 애플리케이션(user_registration_app)과 공유합니다. 그러나 각 애플리케이션은 서로 다른 테이블을 사용합니다:

- user_management_system: 'userm' 테이블
- user_registration_app: 'users' 테이블

## 최근 변경 사항

### v1.1.0 (2023.04.03)

- 포트 설정을 3200으로 변경
- RDS 연결 설정 개선
- 연결 풀 최적화 (최대 연결 수 10개로 증가)
- 모델 타임스탬프 필드 추가 (created_at, updated_at)
- 모델 ID 필드 명시적 정의 추가
- 로깅 기능 추가

### v1.0.0 (초기 버전)

- 기본 CRUD 기능 구현
- Amazon RDS MySQL 연결 구현
- Pug 템플릿을 사용한 UI 구현

## 개발 정보

이 프로젝트는 Pug 템플릿 엔진과 Sequelize ORM을 동시에 활용하는 방식으로 구현되었습니다.

1. **Pug 템플릿 엔진 활용**: 서버 사이드 렌더링을 통해 동적 HTML 생성

   - 장점: 간결한 문법, 서버에서 데이터와 뷰를 쉽게 통합
   - 사용 방식: Express와 통합하여 라우터에서 `res.render()` 메서드로 템플릿 렌더링

2. **Sequelize ORM 활용**: JavaScript 객체를 통한 데이터베이스 작업
   - 장점: SQL 쿼리 직접 작성 없이 객체 지향적 방식으로 데이터베이스 조작
   - 사용 방식: 모델 정의 후 CRUD 메서드를 통한 데이터 접근 및 조작

## 서버 구성

- **웹 서버 포트**: 3200
- **데이터베이스 포트**: 3306 (RDS MySQL 기본 포트)
- **Express 미들웨어**: body-parser, 정적 파일 서빙, 오류 처리 등

## 성능 최적화

- **연결 풀링**: 데이터베이스 연결 재사용을 통한 성능 향상
- **정적 파일 캐싱**: 브라우저 캐싱을 활용한 정적 리소스 로딩 최적화
- **비동기 처리**: 논블로킹 I/O를 활용한 요청 처리 최적화

## 보안 고려사항

- **입력 검증**: 사용자 입력 데이터에 대한 서버 측 유효성 검사
- **SQL 인젝션 방지**: Sequelize ORM의 파라미터화된 쿼리 사용
- **XSS 방지**: Pug 템플릿의 자동 이스케이핑 기능 활용

## 향후 개선 사항

- **사용자 인증/인가 시스템**: 로그인, 권한 관리 기능 추가
- **테스트 코드 구현**: 단위 테스트, 통합 테스트 작성
- **API 문서화**: API 엔드포인트에 대한 문서 작성
- **리팩토링**: 코드 품질 및 구조 개선

## 문제 해결 가이드

- **RDS 연결 오류**: 보안 그룹 설정 및 인바운드 규칙 확인
- **포트 충돌**: 3200 포트가 이미 사용 중인 경우 app.js 파일에서 포트 번호 변경
- **데이터베이스 마이그레이션**: 모델 변경 시 `force: true` 옵션 사용 고려 (데이터 손실 주의)

## 라이센스

ISC
