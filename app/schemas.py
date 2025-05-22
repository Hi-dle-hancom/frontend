# API 요청/응답 데이터 구조 Pydantic 모델로 정의

from pydantic import BaseModel
from typing import List, Optional

# 1. 실시간 타슈 대여소 현황 조회 응답 모델
class StationInfo(BaseModel):
    id: str
    name: str
    latitude: float
    longitude: float
    available_bikes: int
    available_parking: int

    class Config:
        orm_mode = True # SQLAlchemy ORM 모델과 함께 사용할 경우 필요 (현재는 선택)

# 2. 자전거/도보 연계 경로 추천 요청 모델
class Location(BaseModel):
    latitude: float
    longitude: float

class RouteOptions(BaseModel):
    max_distance_km: Optional[float] = None
    max_time_minutes: Optional[int] = None
    avoid_difficult: Optional[bool] = False
    # TODO: 날씨, 계절 등 추가 필터링 옵션 정의

class RouteRequest(BaseModel):
    origin: Location
    destination: Location
    options: Optional[RouteOptions] = None

# 2. 자전거/도보 연계 경로 추천 응답 모델 - 경로 지점 모델
class RoutePoint(BaseModel):
    latitude: float
    longitude: float
    segment_type: str # "bike" 또는 "walk"
    instruction: str
    distance_from_start: float

# 2. 자전거/도보 연계 경로 추천 응답 모델 - 전환 지점 모델 (선택 사항)
class HandoverPoint(BaseModel):
    latitude: float
    longitude: float
    type: str # "bike_to_walk" 또는 "walk_to_bike"
    description: str
    related_station_id: Optional[str] = None

# 2. 자전거/도보 연계 경로 추천 응답 모델 - 경고 정보 모델
class Warning(BaseModel):
    latitude: float
    longitude: float
    type: str # "accident", "weather", ...
    message: str
    radius_meters: float

# 2. 자전거/도보 연계 경로 추천 응답 모델 - 최종 응답 모델
class RouteResponse(BaseModel):
    route: List[RoutePoint]
    handover_points: Optional[List[HandoverPoint]] = None
    warnings: Optional[List[Warning]] = None
    total_distance_km: float
    total_time_minutes: int
    # TODO: 기타 필요한 정보 추가 (예: 추천 난이도 등)
