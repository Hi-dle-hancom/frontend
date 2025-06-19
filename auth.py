from fastapi import Depends, HTTPException, status
from fastapi.security import APIKeyHeader
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional

import database
from models import TokenData, UserInDB

# --- JWT 설정 ---
SECRET_KEY = "YOUR_VERY_SECRET_KEY_FOR_PASSWORDLESS_AUTH" # 실제 운영 시에는 복잡하고 안전한 키로 변경
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 365 # 토큰 유효기간을 1년으로 설정

# 헤더에서 'Authorization' 값을 가져오는 새로운 방식
api_key_header = APIKeyHeader(name="Authorization")


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        # 긴 유효기간을 기본값으로 설정
        expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_user(email: str) -> Optional[UserInDB]:
    """이메일로 사용자를 조회합니다. (비밀번호 없음)"""
    pool = await database.get_db_pool()
    async with pool.acquire() as connection:
        query = "SELECT id, email, username FROM users WHERE email = $1"
        user_record = await connection.fetchrow(query, email)
        if user_record:
            # --- 여기를 수정합니다 ---
            # 기존: return UserInDB.from_orm(user_record)
            # 수정: asyncpg.Record 객체를 dict로 변환 후 Pydantic 모델 생성
            return UserInDB(**dict(user_record))
            # ---------------------
    return None

async def get_current_user(token: str = Depends(api_key_header)):
    """토큰을 검증하여 현재 사용자를 식별합니다."""
    # 클라이언트가 보낸 "Bearer <token>" 형식에서 "Bearer " 부분을 제거
    if token.startswith("Bearer "):
        token = token.split(" ")[1]

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception

    user = await get_user(token_data.email)
    if user is None:
        raise credentials_exception
    return user