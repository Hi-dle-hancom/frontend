from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.api.schemas import RouteRequest, RouteResponse, BikeStationResponse
from app.api.external import TashuAPI, DuroonubiAPI, DaejeonBikeAPI
from app.api.route_finder import RouteFinder
from app.database.database import get_db
from app.database.models import BikeStation

# 라우터 생성
router = APIRouter(prefix="/api", tags=["API"])

# 경로 찾기 객체 초기화
route_finder = RouteFinder()

# 외부 API 객체 초기화
tashu_api = TashuAPI()
duroonubi_api = DuroonubiAPI()
daejeon_bike_api = DaejeonBikeAPI()

@router.get("/health")
def health_check():
    """서버 상태 확인 엔드포인트"""
    return {"status": "ok", "message": "서버가 정상 작동 중입니다."}

@router.post("/find-path", response_model=RouteResponse)
def find_path(request: RouteRequest):
    """
    출발지와 목적지 사이의 자전거 경로를 찾는 API
    """
    # 경로 찾기 객체를 사용하여 경로 계산
    result = route_finder.find_path(
        start_lat=request.start_lat,
        start_lng=request.start_lng,
        end_lat=request.end_lat,
        end_lng=request.end_lng
    )
    
    return result

@router.get("/bike-stations", response_model=List[dict])
def get_bike_stations():
    """
    대전 공공자전거(타슈) 대여소 정보를 조회하는 API
    """
    # 타슈 API를 사용하여 대여소 정보 조회
    stations = tashu_api.get_stations()
    return stations

@router.get("/bike-paths")
def get_bike_paths(lat: float, lng: float, radius: int = 2000):
    """
    특정 위치 주변의 자전거 도로 정보를 조회하는 API
    """
    # 두루누비 API를 사용하여 자전거 도로 정보 조회
    paths = duroonubi_api.get_bike_paths(lat, lng, radius)
    return paths

@router.get("/bike-routes")
def get_bike_routes():
    """
    대전시 자전거 노선 정보를 조회하는 API
    """
    # 대전 자전거 API를 사용하여 노선 정보 조회
    routes = daejeon_bike_api.get_bike_routes()
    return routes

@router.get("/db-test")
def test_database(db: Session = Depends(get_db)):
    """
    데이터베이스 연결 테스트 API
    """
    try:
        # 간단한 쿼리 실행
        bike_stations = db.query(BikeStation).limit(5).all()
        return {"message": "데이터베이스 연결 성공", "stations_count": len(bike_stations)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"데이터베이스 연결 오류: {str(e)}") 