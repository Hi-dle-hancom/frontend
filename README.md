# HAPA DB Module 🗄️

**HAPA DB Module**은 사용자 관리와 개인화 설정을 담당하는 **마이크로서비스**입니다. PostgreSQL 데이터베이스를 사용하여 사용자 인증, 개인 설정 저장, JWT 토큰 기반 세션 관리를 제공합니다.

## 📋 목차

- [서비스 개요](#-서비스-개요)
- [시스템 요구사항](#-시스템-요구사항)
- [빠른 시작](#-빠른-시작)
- [API 엔드포인트](#-api-엔드포인트)
- [데이터베이스 스키마](#-데이터베이스-스키마)
- [환경 설정](#-환경-설정)
- [보안](#-보안)
- [배포](#-배포)
- [문제 해결](#-문제-해결)

## 🎯 서비스 개요

### 주요 역할

HAPA DB Module은 HAPA 생태계에서 다음과 같은 핵심 기능을 담당합니다:

#### **👤 사용자 관리**

- **간편 로그인/회원가입**: 이메일만으로 자동 사용자 생성
- **JWT 토큰 발급**: 안전한 세션 관리
- **사용자 정보 관리**: 프로필 및 메타데이터

#### **⚙️ 개인화 설정**

- **AI 스킬 레벨**: 초급자 → 전문가 맞춤 설정
- **프로젝트 컨텍스트**: 웹 개발, 데이터 사이언스 등
- **코드 생성 스타일**: 상세도, 설명 방식, 오류 처리 수준
- **설정 동기화**: 여러 기기 간 설정 공유

#### **🔗 마이크로서비스 연동**

- **Backend API 서버**: 사용자별 코드 생성 개인화
- **VSCode 확장**: 개인 설정 동기화
- **웹 인터페이스**: 사용자 대시보드

### 시스템 아키텍처

```
HAPA Ecosystem
├── Backend API (Port 8000)     # 메인 AI 서비스
├── DB Module (Port 8001)       # 사용자 관리 서비스 ← 이 서비스
├── VSCode Extension            # 클라이언트
└── React Web App              # 웹 클라이언트
```

## 💻 시스템 요구사항

### 최소 요구사항

- **Python**: 3.8 이상
- **PostgreSQL**: 12 이상
- **RAM**: 최소 1GB (권장 2GB)
- **디스크**: 최소 500MB 여유 공간

### 권장 요구사항

- **OS**: Ubuntu 20.04+, macOS 12+, Windows 10+
- **Python**: 3.12.x
- **PostgreSQL**: 15+
- **Docker**: 20.10+ (컨테이너 배포 시)

## 🚀 빠른 시작

### 1. 프로젝트 클론

```bash
git clone https://github.com/hancom/hapa-db-module.git
cd DB-Module
```

### 2. PostgreSQL 설정

#### **로컬 PostgreSQL 설치**

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# macOS (Homebrew)
brew install postgresql
brew services start postgresql

# Windows
# PostgreSQL 공식 인스톨러 사용
```

#### **데이터베이스 생성**

```sql
-- PostgreSQL에 연결
psql -U postgres

-- 데이터베이스 생성
CREATE DATABASE hapa_users;
CREATE USER hapa_user WITH PASSWORD 'secure_password_123';
GRANT ALL PRIVILEGES ON DATABASE hapa_users TO hapa_user;

\q
```

### 3. Python 환경 설정

```bash
# Python 가상환경 생성
python -m venv venv_db

# 가상환경 활성화
# Windows
venv_db\Scripts\activate
# macOS/Linux
source venv_db/bin/activate

# 의존성 설치
pip install --upgrade pip
pip install -r requirements.txt
```

### 4. 환경 변수 설정

```bash
# .env 파일 생성
cat > .env << EOF
# 데이터베이스 설정
DATABASE_URL=postgresql://hapa_user:secure_password_123@localhost:5432/hapa_users

# JWT 보안 설정
SECRET_KEY=hapa_db_module_secret_key_change_in_production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# 서버 설정
HOST=0.0.0.0
PORT=8001
DEBUG=true
EOF
```

### 5. 데이터베이스 초기화

```bash
# 데이터베이스 테이블 생성
python database.py

# 설정 옵션 초기 데이터 삽입
python models.py
```

### 6. 서버 실행

```bash
# 개발 서버 시작
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

**✅ 성공!** 서버가 정상적으로 시작되면:

- **API 서버**: http://localhost:8001
- **API 문서**: http://localhost:8001/docs (Swagger UI)
- **헬스 체크**: http://localhost:8001/health

## 📡 API 엔드포인트

### 기본 정보

- **Base URL**: `http://localhost:8001`
- **Content-Type**: `application/json`
- **인증**: Bearer JWT Token (로그인 후 필요)

### 🔐 인증 API

| 메서드 | 엔드포인트 | 설명                        | 인증 |
| ------ | ---------- | --------------------------- | ---- |
| `POST` | `/login`   | 이메일 로그인/자동 회원가입 | ❌   |

#### **로그인/회원가입 요청**

```bash
curl -X POST "http://localhost:8001/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "developer@example.com",
    "username": "AI개발자"
  }'
```

#### **응답 예시**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### 👤 사용자 API

| 메서드 | 엔드포인트  | 설명         | 인증 |
| ------ | ----------- | ------------ | ---- |
| `GET`  | `/users/me` | 내 정보 조회 | ✅   |

#### **사용자 정보 조회**

```bash
curl -X GET "http://localhost:8001/users/me" \
  -H "Authorization: Bearer your_jwt_token_here"
```

#### **응답 예시**

```json
{
  "id": 1,
  "email": "developer@example.com",
  "username": "AI개발자"
}
```

### ⚙️ 설정 관리 API

| 메서드 | 엔드포인트           | 설명                       | 인증 |
| ------ | -------------------- | -------------------------- | ---- |
| `GET`  | `/settings/options`  | 사용 가능한 설정 옵션 조회 | ✅   |
| `GET`  | `/users/me/settings` | 내 개인 설정 조회          | ✅   |
| `POST` | `/users/me/settings` | 내 개인 설정 저장/수정     | ✅   |

#### **설정 옵션 조회**

```bash
curl -X GET "http://localhost:8001/settings/options" \
  -H "Authorization: Bearer your_jwt_token_here"
```

#### **응답 예시**

```json
[
  {
    "id": 1,
    "setting_type": "python_skill_level",
    "option_value": "beginner"
  },
  {
    "id": 2,
    "setting_type": "python_skill_level",
    "option_value": "intermediate"
  },
  {
    "id": 3,
    "setting_type": "project_context",
    "option_value": "web_development"
  },
  {
    "id": 4,
    "setting_type": "code_output_structure",
    "option_value": "detailed"
  }
]
```

#### **개인 설정 저장**

```bash
curl -X POST "http://localhost:8001/users/me/settings" \
  -H "Authorization: Bearer your_jwt_token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "option_ids": [2, 3, 4]
  }'
```

## 🗄️ 데이터베이스 스키마

### 테이블 구조

```sql
-- 사용자 정보 테이블
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 설정 옵션 마스터 테이블
CREATE TABLE setting_options (
    id SERIAL PRIMARY KEY,
    setting_type VARCHAR(50) NOT NULL,   -- 설정 카테고리
    option_value VARCHAR(100) NOT NULL,  -- 설정 값
    description TEXT,                    -- 설명
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 사용자별 선택된 설정 테이블
CREATE TABLE user_selected_options (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    option_id INTEGER REFERENCES setting_options(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, option_id)
);
```

### 초기 데이터 (설정 옵션)

```sql
-- Python 스킬 레벨 설정
INSERT INTO setting_options (setting_type, option_value, description) VALUES
('python_skill_level', 'beginner', '파이썬 초급자 - 기본 문법과 상세한 설명'),
('python_skill_level', 'intermediate', '파이썬 중급자 - 일반적인 코딩 패턴'),
('python_skill_level', 'advanced', '파이썬 고급자 - 최적화된 코드와 고급 기법'),
('python_skill_level', 'expert', '파이썬 전문가 - 최신 기법과 성능 최적화');

-- 프로젝트 컨텍스트 설정
INSERT INTO setting_options (setting_type, option_value, description) VALUES
('project_context', 'web_development', '웹 개발 - Flask, Django, FastAPI 중심'),
('project_context', 'data_science', '데이터 사이언스 - pandas, numpy, sklearn'),
('project_context', 'automation', '자동화 - 스크립팅, 크롤링, 자동화 도구'),
('project_context', 'general_purpose', '범용 - 다양한 목적의 일반 코딩');

-- 코드 출력 구조 설정
INSERT INTO setting_options (setting_type, option_value, description) VALUES
('code_output_structure', 'minimal', '최소한 - 핵심 코드만'),
('code_output_structure', 'standard', '표준 - 일반적인 구조'),
('code_output_structure', 'detailed', '상세함 - 주석과 설명 포함'),
('code_output_structure', 'comprehensive', '종합적 - 테스트와 문서화 포함');
```

### 데이터베이스 관계도

```
users (1) ←→ (N) user_selected_options (N) ←→ (1) setting_options
                       │
                       └── 사용자별 개인화 설정 저장
```

## 🔧 환경 설정

### 환경 변수 (.env)

```bash
# ======================
# 데이터베이스 설정
# ======================
DATABASE_URL=postgresql://username:password@localhost:5432/hapa_users
DATABASE_POOL_SIZE=10
DATABASE_MAX_CONNECTIONS=20

# ======================
# JWT 인증 설정
# ======================
SECRET_KEY=your_super_secret_key_change_in_production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440  # 24시간

# ======================
# 서버 설정
# ======================
HOST=0.0.0.0
PORT=8001
DEBUG=true
RELOAD=true

# ======================
# CORS 설정
# ======================
CORS_ORIGINS=http://localhost:3000,http://localhost:8000,vscode://

# ======================
# 로깅 설정
# ======================
LOG_LEVEL=INFO
LOG_FORMAT=json

# ======================
# 보안 설정
# ======================
BCRYPT_ROUNDS=12
SESSION_TIMEOUT=86400  # 24시간 (초)
```

### requirements.txt

```txt
fastapi==0.115.13
uvicorn[standard]==0.34.3
asyncpg==0.30.0
python-jose[cryptography]==3.5.0
passlib[bcrypt]==1.7.4
python-dotenv==1.1.0
pydantic==2.11.7
python-multipart==0.0.9
```

## 🔒 보안

### JWT 토큰 인증

#### **토큰 발급 과정**

1. 사용자가 이메일로 로그인 요청
2. 이메일이 DB에 없으면 자동 회원가입
3. JWT 토큰 생성 및 반환
4. 클라이언트는 토큰을 헤더에 포함하여 API 요청

#### **토큰 검증 과정**

```python
from jose import JWTError, jwt

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        return email
    except JWTError:
        raise credentials_exception
```

### 비밀번호 보안

```python
from passlib.context import CryptContext

# bcrypt를 사용한 비밀번호 해싱
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)
```

### 데이터베이스 보안

- **SQL Injection 방지**: asyncpg의 파라미터화된 쿼리 사용
- **연결 풀링**: 데이터베이스 연결 최적화 및 보안
- **트랜잭션 관리**: 데이터 무결성 보장

## 🧪 테스트

### 단위 테스트

```bash
# pytest 설치
pip install pytest pytest-asyncio httpx

# 테스트 실행
pytest tests/ -v

# 커버리지 포함
pytest tests/ --cov=. --cov-report=html
```

### API 테스트 예시

```python
import pytest
from httpx import AsyncClient
from main import app

@pytest.mark.asyncio
async def test_login():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.post("/login", json={
            "email": "test@example.com",
            "username": "테스트사용자"
        })
    assert response.status_code == 200
    assert "access_token" in response.json()

@pytest.mark.asyncio
async def test_get_user_settings():
    # JWT 토큰을 사용한 인증 테스트
    async with AsyncClient(app=app, base_url="http://test") as ac:
        headers = {"Authorization": "Bearer valid_jwt_token"}
        response = await ac.get("/users/me/settings", headers=headers)
    assert response.status_code == 200
```

### 통합 테스트

```bash
# 실제 데이터베이스를 사용한 통합 테스트
python -m pytest tests/integration/ -v
```

## 🐳 배포

### Docker 배포

#### **Dockerfile**

```dockerfile
FROM python:3.12-slim

WORKDIR /app

# 시스템 의존성 설치
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Python 의존성 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 애플리케이션 코드 복사
COPY . .

# 포트 노출
EXPOSE 8001

# 서버 실행
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
```

#### **docker-compose.yml**

```yaml
version: "3.8"

services:
  db-module:
    build: .
    ports:
      - "8001:8001"
    environment:
      - DATABASE_URL=postgresql://hapa_user:password@postgres:5432/hapa_users
      - SECRET_KEY=production_secret_key
      - DEBUG=false
    depends_on:
      - postgres

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=hapa_users
      - POSTGRES_USER=hapa_user
      - POSTGRES_PASSWORD=secure_password_123
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

#### **Docker 실행**

```bash
# 개발 환경
docker-compose up -d

# 로그 확인
docker-compose logs -f db-module

# 컨테이너 중지
docker-compose down
```

### 프로덕션 배포

#### **환경 변수 설정 (production)**

```bash
# 보안 강화된 프로덕션 설정
export DATABASE_URL="postgresql://user:password@db-server:5432/hapa_users"
export SECRET_KEY="production_jwt_secret_key_very_secure"
export DEBUG=false
export LOG_LEVEL=WARNING
export CORS_ORIGINS="https://hapa.hancom.com,https://api.hapa.hancom.com"
```

#### **서버 실행 (프로덕션)**

```bash
# Gunicorn 사용 (더 안정적)
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8001

# 또는 Uvicorn (단일 프로세스)
uvicorn main:app --host 0.0.0.0 --port 8001 --workers 4
```

## 📊 모니터링

### 헬스 체크

```bash
# 서비스 상태 확인
curl http://localhost:8001/health

# 응답 예시
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2024-12-28T10:30:00Z"
}
```

### 로그 모니터링

```python
import logging
import json

# 구조화된 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger("hapa-db-module")

# API 요청 로깅
logger.info("User login", extra={
    "user_email": "user@example.com",
    "endpoint": "/login",
    "status": "success"
})
```

### 성능 메트릭

- **API 응답 시간**: 엔드포인트별 평균/최대 응답 시간
- **데이터베이스 쿼리 시간**: 느린 쿼리 감지
- **동시 연결 수**: 활성 사용자 세션 수
- **에러율**: HTTP 4xx/5xx 에러 비율

## 🐛 문제 해결

### 자주 발생하는 문제

#### **1. 데이터베이스 연결 오류**

```bash
# PostgreSQL 서비스 상태 확인
sudo systemctl status postgresql

# 데이터베이스 연결 테스트
psql -U hapa_user -d hapa_users -h localhost

# 연결 문자열 확인
python -c "
import asyncpg
import asyncio

async def test_connection():
    conn = await asyncpg.connect('postgresql://hapa_user:password@localhost:5432/hapa_users')
    print('Database connection successful!')
    await conn.close()

asyncio.run(test_connection())
"
```

#### **2. JWT 토큰 오류**

```bash
# 토큰 디코딩 테스트
python -c "
from jose import jwt
token = 'your_jwt_token_here'
secret = 'your_secret_key'
try:
    payload = jwt.decode(token, secret, algorithms=['HS256'])
    print('Token valid:', payload)
except Exception as e:
    print('Token invalid:', e)
"
```

#### **3. 포트 충돌 (8001번 포트)**

```bash
# 포트 사용 프로세스 확인
lsof -i :8001

# 프로세스 종료
kill -9 PID

# 다른 포트로 실행
uvicorn main:app --port 8002
```

#### **4. 의존성 설치 오류**

```bash
# Python 버전 확인
python --version  # 3.8+ 필요

# 가상환경 재생성
rm -rf venv_db
python -m venv venv_db
source venv_db/bin/activate  # Linux/macOS
pip install --upgrade pip
pip install -r requirements.txt
```

#### **5. 데이터베이스 테이블 생성 오류**

```bash
# 테이블 존재 확인
psql -U hapa_user -d hapa_users -c "\dt"

# 테이블 수동 생성
python -c "
import asyncio
from database import create_tables
asyncio.run(create_tables())
print('Tables created successfully!')
"
```

### 디버깅 팁

#### **1. 디버그 모드 활성화**

```bash
# .env 파일에서 설정
DEBUG=true
LOG_LEVEL=DEBUG

# 또는 환경변수로 설정
export DEBUG=true
export LOG_LEVEL=DEBUG
uvicorn main:app --reload
```

#### **2. 데이터베이스 쿼리 로깅**

```python
# database.py에 로깅 추가
import logging
logger = logging.getLogger(__name__)

async def execute_query(query: str, *args):
    logger.debug(f"Executing query: {query} with args: {args}")
    result = await connection.fetch(query, *args)
    logger.debug(f"Query result: {result}")
    return result
```

#### **3. API 응답 디버깅**

```bash
# Verbose 모드로 curl 실행
curl -v -X POST "http://localhost:8001/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "username": "테스트"}'

# JSON 응답 예쁘게 출력
curl http://localhost:8001/users/me \
  -H "Authorization: Bearer token" | jq .
```

### 지원 및 문의

- **GitHub Issues**: 버그 리포트 및 기능 요청
- **문서**: `/docs` 디렉토리의 상세 문서 참조
- **API 문서**: http://localhost:8001/docs (Swagger UI)

---

## 📚 관련 문서

- **[Backend API 연동](../Backend/README.md)**: 메인 API 서버와 연동
- **[Frontend 클라이언트](../Frontend/README.md)**: VSCode 확장 및 웹앱 연동
- **[데이터베이스 스키마](models.py)**: 상세한 데이터 모델
- **[인증 시스템](auth.py)**: JWT 토큰 및 보안 구현

---

**버전**: v1.0.0  
**상태**: 프로덕션 준비 완료  
**데이터베이스**: PostgreSQL 15 지원  
**인증**: JWT 토큰 기반  
**최종 업데이트**: 2024년 12월 28일
