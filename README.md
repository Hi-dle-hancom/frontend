# 유저 등록 시스템 (User Registration System)

![버전](https://img.shields.io/badge/버전-1.0.0-blue)
![Node.js](https://img.shields.io/badge/Node.js-18.x-green)
![Express](https://img.shields.io/badge/Express-4.18.2-lightgrey)
![라이선스](https://img.shields.io/badge/라이선스-MIT-yellow)

다크모드와 라이트모드를 지원하는 현대적인 사용자 관리 시스템입니다. AWS RDS와 연동하여 안전하고 확장 가능한 사용자 등록, 인증 및 관리 기능을 제공합니다.

![다크/라이트모드](https://via.placeholder.com/800x400?text=다크/라이트모드+스크린샷)

## 주요 기능

### 🔐 사용자 인증 시스템

- **회원가입**: 이메일 및 비밀번호 검증을 통한 보안 강화
- **로그인/로그아웃**: JWT 토큰 기반 인증
- **자동 로그인**: 로그인 상태 기억 옵션
- **비밀번호 강도 측정**: 실시간 비밀번호 강도 시각화

### 👤 프로필 관리

- **프로필 정보 조회/수정**: 사용자 정보 관리
- **아바타 업로드**: 사용자 이미지 업로드 및 관리
- **비밀번호 변경**: 보안 강화를 위한 비밀번호 정기 변경 기능

### 🌓 테마 설정

- **다크모드/라이트모드**: 사용자 환경에 맞는 UI 테마 선택
- **자동 테마 저장**: 사용자 선호 테마 저장

### 👨‍👩‍👧‍👦 사용자 디렉터리

- **사용자 검색**: 이름/이메일 기반 검색
- **페이지네이션**: 대규모 사용자 리스트 효율적 관리
- **사용자 카드**: 직관적인 사용자 정보 표시 UI

## 기술 스택

### 프론트엔드

- **HTML5/CSS3**: 시맨틱 마크업 및 반응형 디자인
- **바닐라 JavaScript (ES6+)**: 모던 자바스크립트 활용
- **다크/라이트 테마**: CSS 변수를 통한 동적 테마 관리
- **반응형 웹 디자인**: 모바일 및 데스크탑 최적화 UI

### 백엔드

- **Node.js**: 서버 런타임 환경
- **Express**: 웹 애플리케이션 프레임워크
- **JWT**: 인증 토큰 관리
- **bcrypt**: 비밀번호 해싱
- **multer**: 파일 업로드 처리

### 데이터베이스

- **AWS RDS (MySQL)**: 클라우드 기반 관계형 데이터베이스
- **mysql2**: 비동기 데이터베이스 연결

### 보안

- **helmet**: HTTP 보안 헤더 설정
- **express-rate-limit**: 요청 제한 관리
- **입력 유효성 검사**: XSS 및 SQL 인젝션 방지

## 설치 및 실행 방법

### 사전 요구사항

- Node.js 18.x 이상
- npm 또는 yarn
- MySQL 데이터베이스 (로컬 또는 AWS RDS)

### 설치 단계

1. 저장소 클론

```bash
git clone https://github.com/yourusername/user-registration-app.git
cd user-registration-app
```

2. 의존성 패키지 설치

```bash
npm install
```

3. 환경 변수 설정

```bash
# .env 파일 생성
RDS_HOSTNAME=your-rds-hostname
RDS_USERNAME=your-username
RDS_PASSWORD=your-password
RDS_DB_NAME=your-database-name
JWT_SECRET=your-jwt-secret-key
PORT=3100
```

4. 애플리케이션 실행

```bash
# 개발 모드
npm run dev

# 프로덕션 모드
npm start
```

5. 웹 브라우저에서 `http://localhost:3100` 접속

## API 문서

### 🔑 인증 API

#### 사용자 등록

- **URL**: `/api/users/register`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "username": "사용자명",
    "email": "example@email.com",
    "password": "안전한비밀번호",
    "full_name": "홍길동"
  }
  ```
- **응답**: 200 OK 또는 오류 코드와 메시지

#### 로그인

- **URL**: `/api/users/login`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "username": "사용자명",
    "password": "비밀번호",
    "remember_me": true
  }
  ```
- **응답**: JWT 토큰 및 사용자 정보

### 👤 프로필 API

#### 프로필 조회

- **URL**: `/api/users/profile`
- **Method**: `GET`
- **인증**: JWT 토큰 필요
- **응답**: 사용자 프로필 정보

#### 프로필 업데이트

- **URL**: `/api/users/profile`
- **Method**: `PUT`
- **인증**: JWT 토큰 필요
- **Body**:
  ```json
  {
    "email": "new.email@example.com",
    "full_name": "새로운 이름"
  }
  ```

#### 비밀번호 변경

- **URL**: `/api/users/password`
- **Method**: `PUT`
- **인증**: JWT 토큰 필요
- **Body**:
  ```json
  {
    "current_password": "현재비밀번호",
    "new_password": "새비밀번호"
  }
  ```

### 🖼️ 아바타 API

#### 아바타 업로드

- **URL**: `/api/users/avatar`
- **Method**: `POST`
- **인증**: JWT 토큰 필요
- **Body**: FormData (multipart/form-data)
  - `avatar`: 이미지 파일 (5MB 제한)

### 👥 사용자 디렉터리 API

#### 사용자 조회

- **URL**: `/api/users?page=1&limit=10&search=검색어`
- **Method**: `GET`
- **인증**: JWT 토큰 필요
- **쿼리 파라미터**:
  - `page`: 페이지 번호 (기본값: 1)
  - `limit`: 페이지당 항목 수 (기본값: 10)
  - `search`: 검색어 (선택사항)

## 보안 기능

- **입력 검증**: 모든 사용자 입력은 서버와 클라이언트 모두에서 검증됩니다.
- **XSS 보호**: helmet을 통한 콘텐츠 보안 정책 적용
- **CSRF 방지**: 토큰 기반 인증 활용
- **비밀번호 보안**:
  - bcrypt를 사용한 안전한 해싱
  - 비밀번호 강도 실시간 시각화
  - 최소 8자 이상 요구
- **요청 제한**: express-rate-limit을 통한 요청 폭주 방지
- **파일 업로드 보안**:
  - 파일 확장자 검증
  - 파일 크기 제한 (5MB)
  - 무작위 파일명 생성

## 데이터베이스 스키마

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(100) NOT NULL,
  full_name VARCHAR(100),
  avatar_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## 프로젝트 구조

```
user_registration_app/
├── server.js         # 서버 및 API 구현
├── app.js            # 클라이언트 로직
├── index.html        # 메인 HTML 구조
├── style.css         # 스타일시트 (다크/라이트 모드 포함)
├── avatars/          # 사용자 아바타 저장 디렉터리
├── package.json      # 프로젝트 메타데이터 및 의존성
└── README.md         # 프로젝트 문서
```

## 향후 계획

- [ ] OAuth 인증 통합 (Google, Facebook, GitHub)
- [ ] 이메일 검증 시스템
- [ ] 2단계 인증(2FA) 구현
- [ ] 관리자 대시보드
- [ ] PWA(Progressive Web App) 지원
- [ ] 다국어 지원

## 기여 방법

1. 이 저장소를 포크합니다
2. 새로운 브랜치를 생성합니다 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋합니다 (`git commit -m 'Add some amazing feature'`)
4. 브랜치에 푸시합니다 (`git push origin feature/amazing-feature`)
5. Pull Request를 요청합니다

## 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 제작자

- 홍길동 - [github.com/username](https://github.com/username)

## 감사의 말

- 이 프로젝트는 한컴 아카데미의 지원으로 개발되었습니다.
