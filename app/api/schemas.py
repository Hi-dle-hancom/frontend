from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

# 사용자 스키마
class UserBase(BaseModel):
    username: str
    email: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# 경로 관련 스키마
class RouteRequest(BaseModel):
    start_lat: float = Field(..., description="출발지 위도")
    start_lng: float = Field(..., description="출발지 경도")
    end_lat: float = Field(..., description="목적지 위도")
    end_lng: float = Field(..., description="목적지 경도")
    start_point: Optional[str] = Field(None, description="출발지 이름")
    end_point: Optional[str] = Field(None, description="목적지 이름")

class RoutePoint(BaseModel):
    lat: float
    lng: float

class RouteSummary(BaseModel):
    distance: float = Field(..., description="총 거리(km)")
    duration: int = Field(..., description="예상 소요 시간(분)")
    bike_stations: List[dict] = Field(..., description="경로 근처 자전거 대여소 정보")

class RouteResponse(BaseModel):
    route_id: Optional[int] = None
    summary: RouteSummary
    route_points: List[RoutePoint]
    instructions: List[str] = Field(..., description="경로 안내 지시사항")

# 자전거 대여소 스키마
class BikeStationBase(BaseModel):
    station_id: str
    name: str
    address: str
    lat: float
    lng: float
    available_bikes: int

class BikeStationResponse(BikeStationBase):
    id: int
    last_updated: datetime
    
    class Config:
        from_attributes = True 