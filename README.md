<<<<<<< HEAD
# 뚜따 앱 백엔드

이 폴더는 뚜따 앱의 백엔드 서버 코드를 포함하고 있습니다. FastAPI 프레임워크를 사용하여 개발되었습니다.

## 시작하기

1. 가상 환경 설정 및 활성화

```bash
# 가상 환경 생성
python -m venv venv

# 가상 환경 활성화 (Windows)
venv\Scripts\activate

# 가상 환경 활성화 (macOS/Linux)
source venv/bin/activate
```

2. 의존성 설치

```bash
pip install -r requirements.txt
```

3. 환경 변수 설정

`.env.example` 파일을 복사하여 `.env` 파일을 생성하고 필요한 환경 변수를 설정하세요.

```bash
cp .env.example .env
```

4. 데이터베이스 설정

MySQL 데이터베이스 서버를 설치하고, 다음 명령으로 필요한 데이터베이스와 사용자를 생성하세요.

```sql
CREATE DATABASE ddudda_db;
CREATE USER 'ddudda_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON ddudda_db.* TO 'ddudda_user'@'localhost';
FLUSH PRIVILEGES;
```

5. 데이터베이스 테이블 생성

```bash
python -m app.database.create_tables
```

6. 서버 실행

```bash
# 개발 모드
uvicorn app.main:app --reload

# 프로덕션 모드
uvicorn app.main:app
```

## API 문서

서버가 실행되면 다음 URL에서 자동 생성된 API 문서를 확인할 수 있습니다:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## 주요 API 엔드포인트

| 경로                 | 메소드 | 설명                        |
| -------------------- | ------ | --------------------------- |
| `/`                  | GET    | 기본 환영 메시지            |
| `/api/health`        | GET    | 서버 상태 확인              |
| `/api/find-path`     | POST   | 자전거 경로 찾기            |
| `/api/bike-stations` | GET    | 대전 공공자전거 대여소 정보 |
| `/api/bike-paths`    | GET    | 주변 자전거 도로 정보       |
| `/api/bike-routes`   | GET    | 대전시 자전거 노선 정보     |
| `/db-connection`     | GET    | 데이터베이스 연결 상태 확인 |

## 프로젝트 구조

```
backend/
├── app/                # 메인 애플리케이션 폴더
│   ├── api/            # API 관련 모듈
│   │   ├── external.py # 외부 API 연동
│   │   ├── routes.py   # API 라우트 정의
│   │   ├── schemas.py  # API 요청/응답 스키마
│   │   └── route_finder.py # 경로 찾기 알고리즘
│   ├── config/         # 설정 관련 모듈
│   │   └── settings.py # 환경 설정
│   ├── database/       # 데이터베이스 관련 모듈
│   │   ├── database.py # 데이터베이스 연결
│   │   └── models.py   # 데이터베이스 모델
│   └── main.py         # 애플리케이션 진입점
├── venv/               # 가상 환경 (gitignore)
├── .env                # 환경 변수 (gitignore)
├── .env.example        # 환경 변수 예제
├── requirements.txt    # 의존성 목록
└── README.md           # 이 문서
```
=======
# 뚜따 앱 프론트엔드

이 폴더는 뚜따 앱의 프론트엔드 코드를 포함하고 있습니다. React Native와 Expo를 사용하여 개발되었습니다.

## 시작하기

1. 의존성 설치

```bash
npm install
```

2. 앱 실행

```bash
npx expo start
```

실행 후 출력에서 다음 옵션을 확인할 수 있습니다:

- [개발 빌드](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android 에뮬레이터](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS 시뮬레이터](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go)

## 프로젝트 구조

- `app/`: 앱의 메인 화면들이 있는 폴더 (Expo Router 사용)
- `components/`: 재사용 가능한 컴포넌트들
- `assets/`: 이미지, 폰트 등의 정적 파일들
- `constants/`: 상수 값들
- `hooks/`: 커스텀 React 훅

## 참고 자료

- [Expo 문서](https://docs.expo.dev/)
- [Expo Router 문서](https://docs.expo.dev/router/introduction/)

>>>>>>> frontend/main
