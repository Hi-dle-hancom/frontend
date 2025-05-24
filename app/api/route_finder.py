import json
import random
from typing import List, Dict, Any

from app.api.external import TashuAPI

class RouteFinder:
    """자전거 경로 찾기 알고리즘 클래스"""
    
    def __init__(self):
        self.tashu_api = TashuAPI()
    
    def find_path(self, start_lat: float, start_lng: float, end_lat: float, end_lng: float) -> Dict[str, Any]:
        """
        출발지와 목적지 사이의 자전거 경로를 찾는 함수
        실제로는 AI 모델 또는 경로 찾기 알고리즘이 구현될 예정이지만,
        현재는 더미 데이터를 반환합니다.
        """
        # 거리 계산 (단순화된 버전, 실제로는 haversine 공식 등을 사용해 정확한 거리 계산 필요)
        # 여기서는 더미 데이터를 생성하는 목적으로만 사용
        lat_diff = abs(end_lat - start_lat)
        lng_diff = abs(end_lng - start_lng)
        approx_distance = ((lat_diff ** 2 + lng_diff ** 2) ** 0.5) * 111  # 대략적인 km 거리
        
        # 예상 소요 시간 (자전거 평균 속도 15km/h 가정)
        duration_minutes = int(approx_distance / 15 * 60)
        
        # 경로 포인트 생성 (직선 경로의 더미 데이터)
        num_points = max(5, int(approx_distance * 3))  # 거리에 비례해 포인트 수 증가
        route_points = self._generate_route_points(start_lat, start_lng, end_lat, end_lng, num_points)
        
        # 주변 자전거 대여소 정보 가져오기
        nearby_stations = self._get_nearby_stations(start_lat, start_lng, end_lat, end_lng)
        
        # 경로 안내 지시사항 생성
        instructions = self._generate_instructions(route_points, nearby_stations)
        
        # 응답 구성
        response = {
            "route_id": None,  # 저장되지 않은 경로
            "summary": {
                "distance": round(approx_distance, 2),
                "duration": duration_minutes,
                "bike_stations": nearby_stations
            },
            "route_points": route_points,
            "instructions": instructions
        }
        
        return response
    
    def _generate_route_points(self, start_lat: float, start_lng: float, 
                              end_lat: float, end_lng: float, num_points: int) -> List[Dict[str, float]]:
        """경로 포인트를 생성하는 함수 (더미 데이터)"""
        points = []
        
        # 직선 경로를 따라 포인트 생성
        for i in range(num_points + 1):
            ratio = i / num_points
            # 출발지와 목적지 사이를 보간
            lat = start_lat + (end_lat - start_lat) * ratio
            lng = start_lng + (end_lng - start_lng) * ratio
            
            # 약간의 무작위성 추가 (더 자연스러운 경로처럼 보이게)
            if 0 < i < num_points:
                lat += random.uniform(-0.001, 0.001)
                lng += random.uniform(-0.001, 0.001)
            
            points.append({"lat": lat, "lng": lng})
        
        return points
    
    def _get_nearby_stations(self, start_lat: float, start_lng: float, 
                            end_lat: float, end_lng: float) -> List[Dict[str, Any]]:
        """출발지와 목적지 근처의 자전거 대여소를 찾는 함수"""
        # 실제 구현에서는 타슈 API를 사용하여 주변 대여소를 검색
        # 여기서는 더미 데이터 사용
        stations = self.tashu_api.get_stations()
        
        # 각 대여소마다 출발지와 목적지로부터의 거리 계산
        for station in stations:
            station["distance_from_start"] = self._calculate_distance(
                start_lat, start_lng, station["lat"], station["lng"]
            )
            station["distance_from_end"] = self._calculate_distance(
                end_lat, end_lng, station["lat"], station["lng"]
            )
        
        # 출발지와 목적지에서 가까운 대여소 선택 (각각 2개)
        start_stations = sorted(stations, key=lambda x: x["distance_from_start"])[:2]
        end_stations = sorted(stations, key=lambda x: x["distance_from_end"])[:2]
        
        # 중복 제거
        all_stations = start_stations + [s for s in end_stations if s not in start_stations]
        
        # 위치 정보 추가
        for station in all_stations:
            if station in start_stations:
                station["location"] = "출발지 근처"
            else:
                station["location"] = "목적지 근처"
        
        return all_stations
    
    def _calculate_distance(self, lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        """두 지점 간의 거리를 계산하는 함수 (단순화된 버전)"""
        # 실제 구현에서는 haversine 공식 등을 사용하여 정확한 거리 계산 필요
        return ((lat1 - lat2) ** 2 + (lng1 - lng2) ** 2) ** 0.5 * 111  # 대략적인 km 거리
    
    def _generate_instructions(self, route_points: List[Dict[str, float]], 
                              nearby_stations: List[Dict[str, Any]]) -> List[str]:
        """경로 안내 지시사항을 생성하는 함수"""
        instructions = []
        
        # 출발 지점 안내
        instructions.append("출발 지점에서 자전거를 타고 출발하세요.")
        
        # 출발지 근처 대여소 정보
        start_stations = [s for s in nearby_stations if s.get("location") == "출발지 근처"]
        if start_stations:
            for station in start_stations:
                instructions.append(
                    f"출발지 근처 {station['name']} 대여소에서 자전거를 대여할 수 있습니다. "
                    f"현재 {station['available_bikes']}대의 자전거가 대여 가능합니다."
                )
        
        # 중간 경로 지시사항 (더미 데이터)
        if len(route_points) > 2:
            instructions.append(f"약 {len(route_points) // 3}km 지점까지 직진하세요.")
            instructions.append("자전거 전용도로를 따라 계속 이동하세요.")
            instructions.append(f"약 {len(route_points) * 2 // 3}km 지점에서 우회전하세요.")
        
        # 목적지 근처 대여소 정보
        end_stations = [s for s in nearby_stations if s.get("location") == "목적지 근처"]
        if end_stations:
            for station in end_stations:
                instructions.append(
                    f"목적지 근처 {station['name']} 대여소에서 자전거를 반납할 수 있습니다."
                )
        
        # 도착 지점 안내
        instructions.append("목적지에 도착했습니다.")
        
        return instructions 