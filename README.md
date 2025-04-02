# 사용자 등록 애플리케이션

RDS 데이터베이스를 연결하여 사용자 등록, 로그인 및 프로필 관리 기능을 제공하는 웹 애플리케이션입니다.

## 기능

- 사용자 등록 (회원가입)
- 사용자 로그인/로그아웃
- 사용자 프로필 조회 및 수정
- 비밀번호 변경

## 기술 스택

- **프론트엔드**: HTML, CSS, JavaScript (바닐라)
- **백엔드**: Node.js, Express
- **데이터베이스**: AWS RDS (MySQL)
- **인증**: JWT (JSON Web Tokens)
- **보안**: bcrypt, helmet, express-rate-limit

## 설치 및 실행 방법

1. 저장소 클론

```bash
git clone [저장소 URL]
cd user_registration_app
```

2. 의존성 설치

```bash
npm install
```

3. 환경 변수 설정 (선택 사항)

```bash
# .env 파일 생성
RDS_HOSTNAME=your-rds-hostname
RDS_USERNAME=your-username
RDS_PASSWORD=your-password
RDS_DB_NAME=your-database-name
RDS_PORT=3306
JWT_SECRET=your-secret-key
PORT=3000
```

4. 애플리케이션 실행

```bash
# 개발 모드 실행
npm run dev

# 또는 프로덕션 모드 실행
npm start
```

5. 웹 브라우저에서 `http://localhost:3000` 접속

## API 엔드포인트

### 사용자 등록

- **URL**: `/api/users/register`
- **Method**: `POST`
- **요청 데이터**:
  ```json
  {
    "username": "사용자명",
    "email": "이메일",
    "password": "비밀번호",
    "full_name": "이름(선택사항)"
  }
  ```

### 로그인

- **URL**: `/api/users/login`
- **Method**: `POST`
- **요청 데이터**:
  ```json
  {
    "username": "사용자명",
    "password": "비밀번호"
  }
  ```

### 프로필 조회

- **URL**: `/api/users/profile`
- **Method**: `GET`
- **인증 필요**: JWT 토큰

### 프로필 수정

- **URL**: `/api/users/profile`
- **Method**: `PUT`
- **인증 필요**: JWT 토큰
- **요청 데이터**:
  ```json
  {
    "email": "새 이메일",
    "full_name": "새 이름(선택사항)"
  }
  ```

### 비밀번호 변경

- **URL**: `/api/users/password`
- **Method**: `PUT`
- **인증 필요**: JWT 토큰
- **요청 데이터**:
  ```json
  {
    "current_password": "현재 비밀번호",
    "new_password": "새 비밀번호"
  }
  ```

## 보안 기능

1. **비밀번호 해싱**: 모든 비밀번호는 bcrypt를 사용하여 해싱됩니다.
2. **JWT 토큰 인증**: 보안 엔드포인트는 JWT 토큰으로 보호됩니다.
3. **요청 제한**: express-rate-limit을 사용하여 요청 제한을 적용합니다.
4. **보안 헤더**: helmet 미들웨어를 사용하여 보안 헤더를 설정합니다.

## 데이터베이스 스키마

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(100) NOT NULL,
  full_name VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

## 프로젝트 구조

```
user_registration_app/
├── server.js      # 서버 및 API 엔드포인트
├── app.js         # 클라이언트 JavaScript
├── index.html     # 메인 HTML 파일
├── style.css      # CSS 스타일시트
├── package.json   # 의존성 정보
└── README.md      # 프로젝트 문서
```

## 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.
