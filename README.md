# 사용자 관리 시스템 (User Management System)

Node.js와 MongoDB를 사용한 사용자 관리 시스템입니다.

## 주요 기능

- 사용자 목록 조회
- 사용자 상세 정보 조회
- 사용자 생성
- 사용자 정보 수정
- 사용자 삭제 (소프트 삭제)

## 기술 스택

- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **ORM**: Mongoose
- **Template Engine**: Pug
- **Styling**: CSS

## 프로젝트 구조

```
user_management_system2/
├── app.js              # 애플리케이션 진입점
├── models/             # 데이터베이스 모델
│   ├── user.js         # 사용자 스키마 정의
│   └── db.js           # MongoDB 연결 설정
├── routes/             # 라우트 핸들러
│   └── users.js        # 사용자 관련 라우트
├── views/              # Pug 템플릿
│   ├── layout.pug      # 기본 레이아웃
│   ├── error.pug       # 에러 페이지
│   └── users/          # 사용자 관련 뷰
│       ├── index.pug   # 사용자 목록
│       ├── new.pug     # 사용자 생성 폼
│       ├── show.pug    # 사용자 상세 정보
│       └── edit.pug    # 사용자 수정 폼
└── public/             # 정적 파일
    └── stylesheets/    # CSS 파일
        └── style.css   # 스타일시트
```

## 데이터베이스 스키마

### User 모델

```javascript
{
  name: String,        // 사용자 이름
  age: Number,         // 사용자 나이
  married: Boolean,    // 결혼 여부
  created_at: Date,    // 생성일
  updated_at: Date,    // 수정일
  deleted_at: Date     // 삭제일 (소프트 삭제용)
}
```

## API 엔드포인트

- `GET /users` - 사용자 목록 조회
- `GET /users/new` - 사용자 생성 폼
- `POST /users` - 사용자 생성
- `GET /users/:id` - 사용자 상세 정보 조회
- `GET /users/:id/edit` - 사용자 수정 폼
- `PUT /users/:id` - 사용자 정보 수정
- `DELETE /users/:id` - 사용자 삭제

## 설치 및 실행 방법

1. 의존성 설치:

```bash
npm install
```

2. 환경 변수 설정:

```bash
# .env 파일 생성
MONGODB_URI=mongodb://localhost:27017/user_management
PORT=3200
```

3. 서버 실행:

```bash
npm start
```

4. 브라우저에서 접속:

```
http://localhost:3200/users
```

## 주요 기능 설명

### 사용자 목록 조회

- 모든 사용자를 생성일 기준 내림차순으로 정렬하여 표시
- 삭제된 사용자는 목록에서 제외

### 사용자 생성

- 이름, 나이, 결혼 여부를 입력받아 새로운 사용자 생성
- 나이는 숫자로 자동 변환
- 결혼 여부는 체크박스 값에 따라 Boolean으로 변환

### 사용자 수정

- 기존 사용자 정보를 수정
- 수정 시 updated_at 필드가 자동으로 업데이트

### 사용자 삭제

- 실제로 데이터를 삭제하지 않고 deleted_at 필드에 삭제 시간을 기록
- 삭제된 사용자는 목록에서 제외

## 에러 처리

- 404 에러: 사용자를 찾을 수 없을 때
- 500 에러: 서버 내부 오류 발생 시
- 모든 에러는 사용자 친화적인 에러 페이지로 표시

## 보안 기능

- 입력 데이터 검증
- MongoDB 쿼리 주입 방지
- 적절한 에러 처리

## 향후 개선 사항

- 사용자 인증/인가 시스템 추가
- 페이징 처리 구현
- 검색 기능 추가
- 정렬 기능 추가
- 데이터 내보내기/가져오기 기능
