# 타슈 관련 API Endpoints 라우터
# 현재 로직 비어있음

from fastapi import APIRouter, HTTPException
from typing import List
from ..schemas import StationInfo # schemas.py에서 정의한 모델 임포트

router = APIRouter(
    prefix="/tashu", # /tashu 경로로 시작하는 API들은 여기서 관리
    tags=["Tashu"] # Swagger UI 등에서 그룹핑될 태그
)

@router.get("/stations", response_model=List[StationInfo])
async def get_tashu_stations():
    """
    실시간 타슈 대여소 현황 목록을 조회합니다.
    """
    # TODO: 대전 타슈 공공 API를 호출하여 실시간 대여소 정보를 가져오는 로직 구현
    # TODO: 가져온 데이터를 StationInfo Pydantic 모델 리스트 형태로 가공
    # TODO: API 호출 실패 또는 데이터 가공 오류 시 적절한 HTTPException 발생

    # 임시 데이터 (실제 구현 시 삭제)
    dummy_data = [
        {"id": "STATION_ID_1", "name": "대전역", "latitude": 36.32687, "longitude": 127.43247, "available_bikes": 5, "available_parking": 10},
        {"id": "STATION_ID_2", "name": "시청역", "latitude": 36.35181, "longitude": 127.38503, "available_bikes": 15, "available_parking": 3},
    ]

    return dummy_data # 실제 구현 시 가공된 데이터 반환
