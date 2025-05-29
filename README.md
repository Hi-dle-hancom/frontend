# 뚜따 앱 백엔드 (FastAPI)

이 프로젝트는 뚜따 앱의 백엔드 서버 코드를 포함하고 있습니다. FastAPI 프레임워크를 사용하여 카카오맵 웹뷰를 제공하는 웹 서버입니다.

## 기술 스택

- **프레임워크**: FastAPI
- **언어**: Python 3.8+
- **템플릿 엔진**: Jinja2
- **지도 서비스**: 카카오맵 JavaScript API
- **검색 API**: 카카오 로컬 API
- **HTTP 클라이언트**: httpx
- **환경 변수 관리**: python-dotenv
- **배포**: uvicorn (ASGI 서버)

## 서버 아키텍처

이 서버는 카카오맵 API를 사용하는 HTML 페이지를 생성하여 모바일 앱의 웹뷰에 제공합니다.
주요 기능은 다음과 같습니다:

1. 위도/경도 파라미터에 따라 동적으로 지도 페이지 생성
2. 마커 클릭 시 React Native 웹뷰로 정보 전송
3. 카카오 로컬 API를 사용한 장소 검색 기능
4. CORS 설정을 통한 크로스 오리진 요청 허용

## 시작하기

### 1. 필요 패키지 설치

```bash
pip install -r requirements.txt
```

필요한 패키지:

- fastapi: 웹 프레임워크
- uvicorn: ASGI 서버
- jinja2: HTML 템플릿 엔진
- python-dotenv: 환경 변수 관리
- httpx: 비동기 HTTP 클라이언트

### 2. 환경 변수 설정

`.env` 파일을 루트 디렉토리에 생성하고 다음 내용을 추가하세요:

```
KAKAO_MAP_API_KEY=5fd93db4631259c8576b6ce26b8fc125
KAKAO_REST_API_KEY=5fd93db4631259c8576b6ce26b8fc125
```

`env_example` 파일을 참조하여 설정할 수 있습니다.

### 3. 카카오맵 API 키 설정

카카오 개발자 계정이 필요합니다:

1. [Kakao Developers](https://developers.kakao.com/)에 가입하고 로그인
2. 애플리케이션 추가 (앱 이름: 뚜따)
3. "플랫폼" 설정에서 "Web" 플랫폼 등록 (사이트 도메인에 개발 서버 URL 추가)
4. "앱 키" 메뉴에서 JavaScript 키와 REST API 키 확인 및 복사
5. 카카오 로컬 API 사용 권한 활성화 (사용하는 API 선택에서 "로컬" 체크)

### 4. 서버 실행

```bash
python main.py
```

또는 uvicorn 직접 실행:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

기본적으로 서버는 다음 주소에서 실행됩니다: `http://localhost:8000`

개발 환경에서 모바일 기기에서 접근하려면:

- 컴퓨터의 로컬 IP 주소(예: 192.168.0.x)를 사용
- 또는 ngrok 같은 터널링 서비스 사용: `ngrok http 8000`

## API 엔드포인트

### 기본 엔드포인트

| 경로          | 메소드 | 설명               | 파라미터                                                                                                                                                                      |
| ------------- | ------ | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`           | GET    | API 서버 상태 확인 | 없음                                                                                                                                                                          |
| `/map`        | GET    | 카카오맵 웹뷰 제공 | `lat`: 위도 (기본값: 36.35)<br>`lng`: 경도 (기본값: 127.38)<br>`markers`: 마커 JSON 문자열 (선택사항)                                                                         |
| `/api/search` | GET    | 장소 검색 API      | `query`: 검색어<br>`lat`: 위도 (선택사항)<br>`lng`: 경도 (선택사항)<br>`radius`: 검색 반경 (기본값: 5000m)<br>`page`: 페이지 번호 (기본값: 1)<br>`size`: 결과 수 (기본값: 15) |

### 응답 예시

#### GET /

```json
{
  "message": "뚜따 API 서버가 실행 중입니다."
}
```

#### GET /map

HTML 페이지 (카카오맵 포함)

#### GET /api/search?query=카페&lat=37.5662&lng=126.9784

```json
[
  {
    "id": "12345678",
    "title": "스타벅스 명동점",
    "description": "서울 중구 명동길 52\n02-1234-5678",
    "coordinate": {
      "latitude": 37.5634,
      "longitude": 126.9822
    }
  },
  ...
]
```

## 카카오맵 웹뷰 구현

### 지도 템플릿 (`templates/map.html`)

이 파일은 카카오맵 JavaScript API를 사용하여 지도를 생성하고, 마커를 관리하며, 이벤트를 처리하는 HTML 템플릿입니다.

주요 기능:

1. 지도 초기화 및 현재 위치 표시
2. 마커 관리 (추가/제거/업데이트)
3. 마커 클릭 이벤트 처리
4. 지도 이동 이벤트 처리
5. React Native 웹뷰와의 양방향 통신

```javascript
// 지도 생성 및 마커 이벤트 처리 예시
kakao.maps.load(function () {
  const container = document.getElementById("map");
  const options = {
    center: new kakao.maps.LatLng(initialLat, initialLng),
    level: 3,
  };

  // 지도 생성
  const map = new kakao.maps.Map(container, options);

  // 마커 클릭 이벤트 처리
  kakao.maps.event.addListener(marker, "click", function () {
    // React Native 웹뷰로 메시지 전송
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({
          type: "markerClick",
          id: markerData.id,
          title: markerData.title,
          description: markerData.description || "",
          lat: markerData.lat,
          lng: markerData.lng,
        })
      );
    }
  });
});
```

### 장소 검색 API 구현

`main.py`의 `/api/search` 엔드포인트는 카카오 로컬 API를 사용하여 장소를 검색하고 결과를 마커 형식으로 변환하여 반환합니다:

```python
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

            # 응답 처리 및 결과 변환
            # ...
```

## 프론트엔드와의 통합

### 웹뷰 통신 방식

서버와 앱 간의 통신은 다음과 같이 이루어집니다:

1. 앱의 WebView 컴포넌트가 `/map` 엔드포인트를 로드
2. 위도/경도 파라미터를 통해 특정 위치의 지도 표시
3. 지도의 마커 클릭 시 JavaScript에서 `window.ReactNativeWebView.postMessage()` 메소드를 사용해 데이터 전송
4. 앱은 WebView의 `onMessage` 이벤트 핸들러를 통해 데이터 수신 및 처리
5. 앱에서 `webViewRef.injectJavaScript()` 메소드를 사용해 지도의 JavaScript 함수 호출

### 네이티브-웹뷰 통신 함수

템플릿에 정의된 다음 함수들은 네이티브 앱에서 JavaScript 주입을 통해 호출됩니다:

1. `updateMarkers(markersData)`: 지도의 마커 업데이트
2. `moveToLocation(lat, lng)`: 특정 위치로 지도 이동

## 보안 고려사항

### 환경 변수 관리

API 키는 환경 변수로 관리하여 소스 코드에 직접 포함되지 않도록 합니다:

```python
# 환경 변수 로드
load_dotenv()
KAKAO_MAP_API_KEY = os.getenv("KAKAO_MAP_API_KEY", "YOUR_DEFAULT_KEY")
KAKAO_REST_API_KEY = os.getenv("KAKAO_REST_API_KEY", KAKAO_MAP_API_KEY)
```

### CORS 설정

현재 서버는 개발 편의를 위해 모든 오리진에서의 요청을 허용하고 있습니다.
프로덕션 환경에서는 다음과 같이 허용된 오리진을 제한해야 합니다:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-app-domain.com"],
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)
```

### XSS 방지

템플릿에서 Jinja2 변수를 사용할 때 안전하게 처리합니다:

```javascript
// Jinja2 변수를 JavaScript 변수로 안전하게 변환
const initialLat = parseFloat("{{ lat }}");
const initialLng = parseFloat("{{ lng }}");

// 서버에서 전달된 마커 데이터
let initialMarkers = [];
{% if markers %}
  try {
    initialMarkers = JSON.parse('{{ markers|tojson }}');
  } catch (e) {
    console.error("마커 데이터 파싱 오류:", e);
  }
{% endif %}
```

## 배포 가이드

### 서버 배포 방법

1. 서버 인스턴스 준비 (AWS EC2, GCP, Azure 등)
2. Python 3.8 이상 설치
3. 프로젝트 코드 복사
4. 필요 패키지 설치: `pip install -r requirements.txt`
5. 환경 변수 설정 (`.env` 파일 또는 서버 환경 변수)
6. 프로덕션 서버 실행:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### 프로덕션 설정

프로덕션 환경에서는 다음 사항을 고려하세요:

1. HTTPS 적용 (Let's Encrypt 인증서 사용)
2. Nginx 또는 Apache 웹 서버를 프록시로 설정
3. 로깅 설정 추가
4. 환경 변수를 통한 설정 관리 (API 키 등)
5. 적절한 CORS 설정 적용

## 문제 해결

### 카카오맵 로딩 실패

- API 키가 올바른지 확인
- 등록된 도메인과 실제 사용 도메인이 일치하는지 확인
- 브라우저 콘솔에서 JavaScript 오류 확인

### 검색 API 오류

- KAKAO_REST_API_KEY가 올바르게 설정되었는지 확인
- 카카오 개발자 콘솔에서 로컬 API 사용 권한이 활성화되었는지 확인
- API 호출 제한 초과 여부 확인

### CORS 오류

- 프론트엔드의 도메인이 CORS 설정에 허용되어 있는지 확인
- 개발 환경에서는 일시적으로 모든 오리진 허용 (`allow_origins=["*"]`)

## API 문서

서버가 실행되면 다음 URL에서 자동 생성된 API 문서를 확인할 수 있습니다:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## 참고 자료

- [FastAPI 공식 문서](https://fastapi.tiangolo.com/)
- [Jinja2 템플릿 문서](https://jinja.palletsprojects.com/)
- [카카오맵 API 문서](https://apis.map.kakao.com/web/documentation/)
- [카카오 로컬 API 문서](https://developers.kakao.com/docs/latest/ko/local/dev-guide)
- [httpx 문서](https://www.python-httpx.org/)
- [uvicorn 문서](https://www.uvicorn.org/)
