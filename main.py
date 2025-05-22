# FastAPI 애플리케이션 진입점

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware # 개발 시 프론트엔드와 통신 위해 필요
from app.routers import tashu, routes # 만든 라우터 파일 임포트

app = FastAPI(
    title="뚜따 Ttutta API", # API 문서(Swagger UI)에 표시될 제목
    description="2025 관광데이터 활용 공모전 '뚜따' 앱 백엔드 API", # API 문서 설명
    version="0.1.0", # API 버전
    docs_url="/api/v1/docs", # Swagger UI 경로
    redoc_url="/api/v1/redoc", # ReDoc UI 경로
    openapi_url="/api/v1/openapi.json" # OpenAPI 스펙 파일 경로
)

# 개발 단계에서 프론트엔드와 통신하기 위해 CORS 설정 (필요에 따라 수정/삭제)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # TODO: 실제 프론트엔드 도메인으로 변경해야 보안상 안전함!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터들을 앱에 포함시키기
app.include_router(tashu.router, prefix="/api/v1")
app.include_router(routes.router, prefix="/api/v1")

@app.get("/api/v1")
async def read_root():
    return {"message": "Welcome to Ttutta API v1"}

# TODO: 필요하다면 DB 연결 설정 코드 추가 (Phase 2 이후 고려)
# @app.on_event("startup"):
# async def startup_db_client():
#     await connect_to_database(...)

# @app.on_event("shutdown"):
# async def shutdown_db_client():
#     await close_database_connection(...)