import requests
from app.config.settings import TASHU_API_KEY, DUROONUBI_API_KEY, DAEJEON_BIKE_API_KEY

class TashuAPI:
    """타슈(대전 공공자전거) API 연동 클래스d"""
    
    BASE_URL = "https://api.tashu.or.kr/api"  # 가정한 타슈 API URL
    
    def __init__(self, api_key=TASHU_API_KEY):
        self.api_key = api_key
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
    
    def get_stations(self):
        """모든 대여소 정보 조회"""
        try:
            response = requests.get(
                f"{self.BASE_URL}/stations", 
                headers=self.headers
            )
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            print(f"타슈 API 호출 오류: {str(e)}")
            # 테스트용 더미 데이터 반환
            return self._get_dummy_stations()
    
    def get_station_status(self, station_id):
        """특정 대여소의 상태 조회 (대여 가능 자전거 수 등)"""
        try:
            response = requests.get(
                f"{self.BASE_URL}/stations/{station_id}/status", 
                headers=self.headers
            )
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            print(f"타슈 API 호출 오류: {str(e)}")
            # 테스트용 더미 데이터 반환
            return {
                "station_id": station_id,
                "available_bikes": 5,
                "total_docks": 10,
                "last_updated": "2023-05-15T14:30:00Z"
            }
    
    def _get_dummy_stations(self):
        """테스트용 더미 대여소 데이터"""
        return [
            {
                "station_id": "ST001",
                "name": "대전역 앞",
                "address": "대전광역시 동구 정동 1-1",
                "lat": 36.332612,
                "lng": 127.434732,
                "available_bikes": 8,
                "total_docks": 15
            },
            {
                "station_id": "ST002",
                "name": "충남대학교 정문",
                "address": "대전광역시 유성구 대학로 99",
                "lat": 36.368762,
                "lng": 127.346390,
                "available_bikes": 3,
                "total_docks": 12
            },
            {
                "station_id": "ST003",
                "name": "유성온천역 2번 출구",
                "address": "대전광역시 유성구 봉명동 548-1",
                "lat": 36.356548,
                "lng": 127.334073,
                "available_bikes": 5,
                "total_docks": 10
            }
        ]


class DuroonubiAPI:
    """두루누비(자전거 도로 정보) API 연동 클래스"""
    
    BASE_URL = "https://api.duroonubi.kr/api"  # 가정한 두루누비 API URL
    
    def __init__(self, api_key=DUROONUBI_API_KEY):
        self.api_key = api_key
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
    
    def get_bike_paths(self, lat, lng, radius=2000):
        """특정 위치 주변의 자전거 도로 정보 조회"""
        try:
            params = {
                "lat": lat,
                "lng": lng,
                "radius": radius  # 미터 단위
            }
            response = requests.get(
                f"{self.BASE_URL}/bike-paths", 
                headers=self.headers,
                params=params
            )
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            print(f"두루누비 API 호출 오류: {str(e)}")
            # 테스트용 더미 데이터 반환
            return self._get_dummy_bike_paths()
    
    def _get_dummy_bike_paths(self):
        """테스트용 더미 자전거 도로 데이터"""
        return {
            "bike_paths": [
                {
                    "path_id": "P001",
                    "name": "대전 중앙로 자전거도로",
                    "length": 5.2,  # km
                    "path_type": "전용도로",
                    "coordinates": [
                        {"lat": 36.350971, "lng": 127.385288},
                        {"lat": 36.347563, "lng": 127.377091},
                        {"lat": 36.342285, "lng": 127.369709}
                    ]
                },
                {
                    "path_id": "P002",
                    "name": "유성구 자전거길",
                    "length": 3.8,  # km
                    "path_type": "겸용도로",
                    "coordinates": [
                        {"lat": 36.362283, "lng": 127.356248},
                        {"lat": 36.368146, "lng": 127.352172},
                        {"lat": 36.374063, "lng": 127.346852}
                    ]
                }
            ]
        }


class DaejeonBikeAPI:
    """대전 자전거도로 정보 API 연동 클래스"""
    
    BASE_URL = "https://api.daejeon.go.kr/bicycle"  # 가정한 대전 자전거 API URL
    
    def __init__(self, api_key=DAEJEON_BIKE_API_KEY):
        self.api_key = api_key
        self.params = {
            "apiKey": self.api_key,
            "format": "json"
        }
    
    def get_bike_routes(self):
        """대전시 자전거 노선 정보 조회"""
        try:
            response = requests.get(
                f"{self.BASE_URL}/routes",
                params=self.params
            )
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            print(f"대전 자전거 API 호출 오류: {str(e)}")
            # 테스트용 더미 데이터 반환
            return self._get_dummy_bike_routes()
    
    def _get_dummy_bike_routes(self):
        """테스트용 더미 자전거 노선 데이터"""
        return {
            "routes": [
                {
                    "route_id": "R001",
                    "name": "갑천 자전거도로",
                    "length": 15.3,  # km
                    "difficulty": "쉬움",
                    "description": "대전 시민들이 즐겨찾는 갑천변 자전거도로입니다."
                },
                {
                    "route_id": "R002",
                    "name": "대전 금강 자전거길",
                    "length": 21.5,  # km
                    "difficulty": "중간",
                    "description": "금강변을 따라 조성된 자전거 전용도로입니다."
                },
                {
                    "route_id": "R003",
                    "name": "대청호 자전거길",
                    "length": 32.8,  # km
                    "difficulty": "어려움",
                    "description": "대청호 주변을 일주하는 자전거 코스입니다."
                }
            ]
        } 