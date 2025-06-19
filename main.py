from fastapi import FastAPI, Depends, HTTPException, status
from typing import List

import auth
import database
from models import UserBase, UserInDB, SettingOption, UserSettingsUpdate, Token

app = FastAPI()

# 앱 시작/종료 시 DB 연결/종료 이벤트 핸들러 등록
app.add_event_handler("startup", database.connect_to_db)
app.add_event_handler("shutdown", database.close_db_connection)

@app.post("/login", response_model=Token)
async def login_or_register(user_data: UserBase):
    """
    이메일만으로 로그인 또는 자동 회원가입을 처리하고, 식별용 JWT 토큰을 발급합니다.
    """
    user = await auth.get_user(user_data.email)

    if user is None:
        pool = await database.get_db_pool()
        async with pool.acquire() as connection:
            query = "INSERT INTO users (email, username) VALUES ($1, $2) RETURNING id, email, username"
            created_user_record = await connection.fetchrow(query, user_data.email, user_data.username)
            
            # --- 여기를 수정합니다 ---
            # 기존: user = UserInDB.from_orm(created_user_record)
            # 수정: asyncpg.Record 객체를 dict로 변환 후 Pydantic 모델 생성
            user = UserInDB(**dict(created_user_record))
            # ---------------------
    
    access_token = auth.create_access_token(
        data={"sub": user.email}
    )
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/settings/options", response_model=List[SettingOption])
async def read_setting_options(current_user: UserInDB = Depends(auth.get_current_user)):
    """(로그인 필요) 선택 가능한 모든 설정 옵션 목록 조회"""
    pool = await database.get_db_pool()
    async with pool.acquire() as connection:
        records = await connection.fetch("SELECT id, setting_type, option_value FROM setting_options ORDER BY setting_type, id")
        return records

@app.get("/users/me/settings", response_model=List[SettingOption])
async def get_my_settings(current_user: UserInDB = Depends(auth.get_current_user)):
    """(로그인 필요) 현재 로그인한 사용자의 설정 조회"""
    pool = await database.get_db_pool()
    async with pool.acquire() as connection:
        query = """
            SELECT so.id, so.setting_type, so.option_value
            FROM user_selected_options uso
            JOIN setting_options so ON uso.option_id = so.id
            WHERE uso.user_id = $1
        """
        records = await connection.fetch(query, current_user.id)
        return records

@app.post("/users/me/settings", status_code=status.HTTP_204_NO_CONTENT)
async def update_my_settings(settings: UserSettingsUpdate, current_user: UserInDB = Depends(auth.get_current_user)):
    """(로그인 필요) 사용자 설정 저장/수정"""
    pool = await database.get_db_pool()
    async with pool.acquire() as connection:
        async with connection.transaction():
            await connection.execute("DELETE FROM user_selected_options WHERE user_id = $1", current_user.id)
            for option_id in settings.option_ids:
                await connection.execute(
                    "INSERT INTO user_selected_options (user_id, option_id) VALUES ($1, $2)",
                    current_user.id,
                    option_id
                )
    return

@app.get("/users/me", response_model=UserInDB)
async def read_users_me(current_user: UserInDB = Depends(auth.get_current_user)):
    """(로그인 필요) 내 정보 확인"""
    return current_user