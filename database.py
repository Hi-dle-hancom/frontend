import asyncpg

# 이전에 생성한 제한된 권한의 test_user를 사용합니다.
DATABASE_URL = "postgresql://test_user:testuser1234@3.13.240.111/hidle"

pool = None

async def get_db_pool():
    """데이터베이스 커넥션 풀을 반환합니다."""
    return pool

async def connect_to_db():
    """애플리케이션 시작 시 데이터베이스 커넥션 풀을 생성합니다."""
    global pool
    pool = await asyncpg.create_pool(DATABASE_URL)
    print("데이터베이스 커넥션 풀이 생성되었습니다.")

async def close_db_connection():
    """애플리케이션 종료 시 데이터베이스 커넥션 풀을 닫습니다."""
    global pool
    if pool:
        await pool.close()
        print("데이터베이스 커넥션 풀이 종료되었습니다.")
