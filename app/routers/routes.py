# 경로 추천 관련 API Endpoints 라우터
# 추후 AI 모델 연동 시 경로 계산 로직 추가 필요

from fastapi import APIRouter, HTTPException
from typing import List
from ..schemas import RouteRequest, RouteResponse, RoutePoint, Warning, HandoverPoint # 필요한 모델 임포트

router = APIRouter(
    prefix="/routes", # /routes 경로로 시작하는 API들은 여기서 관리
    tags=["Routes"] # Swagger UI 등에서 그룹핑될 태그
)

@router.post("/recommend", response_model=RouteResponse)
async def recommend_route(request: RouteRequest):
    """
    출발지와 목적지를 바탕으로 자전거/도보 연계 최적 경로를 추천합니다.
    """
    origin = request.origin
    destination = request.destination
    options = request.options

    # TODO: 출발지, 목적지, 옵션을 기반으로 최적 경로를 계산하는 AI 로직 구현
    # TODO: 한국관광공사 두루누비/관광정보 API, 대전시 교통/자전거 도로 API, 기상청 API 등 활용
    # TODO: 사고 다발 구간 정보 등을 활용하여 경고 정보 생성 로직 구현
    # TODO: 계산된 경로, 전환 지점, 경고 정보 등을 RouteResponse Pydantic 모델 형태로 가공

    print(f"경로 추천 요청 받음: 출발지={origin}, 목적지={destination}, 옵션={options}") # 디버깅용 출력

    # 임시 응답 데이터 (실제 구현 시 삭제)
    dummy_route = [
        {"latitude": origin.latitude, "longitude": origin.longitude, "segment_type": "bike", "instruction": "출발", "distance_from_start": 0.0},
        {"latitude": 36.34, "longitude": 127.40, "segment_type": "bike", "instruction": "자전거도로 진입", "distance_from_start": 1.5},
         {"latitude": 36.35, "longitude": 127.38, "segment_type": "walk", "instruction": "시청역 대여소에서 자전거 반납 후 도보 이동", "distance_from_start": 5.0},
        {"latitude": destination.latitude, "longitude": destination.longitude, "segment_type": "walk", "instruction": "목적지 도착", "distance_from_start": 5.5},
    ]

    dummy_warnings = [
        {"latitude": 36.345, "longitude": 127.39, "type": "accident", "message": "주의! 사고 다발 구간입니다.", "radius_meters": 50}
    ]

    return {
        "route": dummy_route,
        "warnings": dummy_warnings,
        "total_distance_km": 5.5,
        "total_time_minutes": 30
    } # 실제 구현 시 가공된 데이터 반환
    # TODO: 경로 계산 실패 등 오류 발생 시 적절한 HTTPException 발생
