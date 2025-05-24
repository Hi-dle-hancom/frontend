from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router as api_router
from app.database.database import test_db_connection
from app.config.settings import PORT

# FastAPI 애플리케이션 생성
app = FastAPI(
    title="뚜따 백엔드 API",
    description="대전 자전거 경로 추천 시스템 백엔드 API",
    version="0.1.0"
)

# CORS 미들웨어 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 프로덕션에서는 특정 오리진만 허용하도록 변경 필요
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API 라우터 등록
app.include_router(api_router)

@app.get("/")
def root():
    """루트 경로"""
    return {
        "message": "뚜따 백엔드 API에 오신 것을 환영합니다!",
        "documentation": "/docs",
    }

@app.get("/db-connection")
def check_db_connection():
    """데이터베이스 연결 상태 확인"""
    success, message = test_db_connection()
    return {"success": success, "message": message}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=PORT, reload=True) 