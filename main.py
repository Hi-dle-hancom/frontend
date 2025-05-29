import os
import json
from typing import List, Optional
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import httpx

# 환경 변수 로드
load_dotenv()
KAKAO_MAP_API_KEY = os.getenv("KAKAO_MAP_API_KEY", "YOUR_DEFAULT_KEY")
KAKAO_REST_API_KEY = os.getenv("KAKAO_REST_API_KEY", KAKAO_MAP_API_KEY)

app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 실제 앱에서는 허용할 출처를 제한하는 것이 좋습니다
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

templates = Jinja2Templates(directory="templates")

# 마커 데이터 모델
class MarkerData:
    def __init__(self, id: str, title: str, description: str, lat: float, lng: float):
        self.id = id
        self.title = title
        self.description = description
        self.coordinate = {"latitude": lat, "longitude": lng}

@app.get("/map", response_class=HTMLResponse)
async def show_map(
    request: Request, 
    lat: float = 36.35, 
    lng: float = 127.38, 
    markers: Optional[str] = None
):
    marker_data = []
    if markers:
        try:
            marker_data = json.loads(markers)
        except:
            pass
    
    return templates.TemplateResponse("map.html", {
        "request": request,
        "lat": lat,
        "lng": lng,
        "api_key": KAKAO_MAP_API_KEY,
        "markers": marker_data
    })

@app.get("/api/search")
async def search_places(
    query: str, 
    lat: Optional[float] = None, 
    lng: Optional[float] = None,
    radius: Optional[int] = 5000,
    page: Optional[int] = 1,
    size: Optional[int] = 15
) -> List[dict]:
    """
    키워드로 장소를 검색합니다.
    """
    try:
        headers = {"Authorization": f"KakaoAK {KAKAO_REST_API_KEY}"}
        params = {
            "query": query,
            "page": page,
            "size": size
        }
        
        # 위치 기반 검색 옵션 추가
        if lat is not None and lng is not None:
            params["y"] = lat
            params["x"] = lng
            params["radius"] = radius
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://dapi.kakao.com/v2/local/search/keyword.json",
                params=params,
                headers=headers
            )
            
            if response.status_code != 200:
                return JSONResponse(
                    status_code=response.status_code,
                    content={"error": f"카카오 API 요청 실패: {response.status_code}"}
                )
            
            data = response.json()
            
            # 검색 결과를 마커 형식으로 변환
            results = []
            for item in data.get("documents", []):
                marker = {
                    "id": item.get("id", str(hash(item.get("place_name", "")))),
                    "title": item.get("place_name", ""),
                    "description": f"{item.get('address_name', '') or item.get('road_address_name', '')}\n{item.get('phone', '')}",
                    "coordinate": {
                        "latitude": float(item.get("y", 0)),
                        "longitude": float(item.get("x", 0))
                    }
                }
                results.append(marker)
            
            return results
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"검색 중 오류 발생: {str(e)}"}
        )

@app.get("/")
def read_root():
    return {"message": "뚜따 API 서버가 실행 중입니다."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 