# 뚜따 앱 프론트엔드

이 프로젝트는 뚜따 앱의 프론트엔드 코드를 포함하고 있습니다. React Native와 Expo 프레임워크를 사용하여 개발된 크로스 플랫폼 모바일 애플리케이션입니다. 위치 기반 서비스와 카카오맵 지도 기능을 핵심으로 제공합니다.

## 기술 스택

- **프레임워크**: React Native, Expo
- **언어**: TypeScript
- **라우팅**: Expo Router (파일 기반 라우팅)
- **UI 컴포넌트**: 커스텀 컴포넌트
- **지도 서비스**: 카카오맵 API (FastAPI 서버를 통해 제공)
- **위치 서비스**: Expo Location
- **웹뷰**: React Native WebView

## 시작하기

### 사전 요구사항

- Node.js (18.x 이상 권장)
- npm 또는 yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS 개발을 위한 XCode (macOS 전용)
- Android 개발을 위한 Android Studio
- 백엔드 서버 실행 (FastAPI)

### 설치 및 실행

1. 의존성 설치

```bash
npm install
```

2. 앱 실행

```bash
npx expo start
```

실행 후 터미널에 출력되는 옵션 중 하나를 선택하여 앱을 실행할 수 있습니다:

- **a**: Android 에뮬레이터에서 실행
- **i**: iOS 시뮬레이터에서 실행 (macOS 전용)
- **w**: 웹 브라우저에서 실행
- **Expo Go 앱**: QR 코드를 스캔하여 실제 기기에서 실행

자세한 내용은 다음 링크를 참조하세요:

- [개발 빌드 문서](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android 에뮬레이터 설정](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS 시뮬레이터 설정](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go 앱 사용법](https://expo.dev/go)

## 프로젝트 구조

```
frontend/
├── app/                 # 앱의 메인 화면들 (Expo Router)
│   ├── (tabs)/          # 탭 기반 화면
│   │   ├── _layout.tsx  # 탭 네비게이션 설정
│   │   ├── index.tsx    # 홈 화면 (지도 메인 화면)
│   │   └── explore.tsx  # 탐색 화면
│   ├── place/           # 장소 관련 화면
│   │   └── [id].tsx     # 장소 상세 정보 화면
│   ├── _layout.tsx      # 앱 루트 레이아웃
│   └── +not-found.tsx   # 404 페이지
├── assets/              # 정적 파일 (이미지, 폰트 등)
├── components/          # 재사용 가능한 컴포넌트들
│   ├── Map/             # 지도 관련 컴포넌트
│   │   ├── FastAPIMapView.tsx  # FastAPI 기반 카카오맵 웹뷰
│   │   └── types.ts            # 지도 관련 타입 정의
│   ├── Search/          # 검색 관련 컴포넌트
│   └── ui/              # UI 기본 컴포넌트
├── constants/           # 상수 정의
│   ├── Colors.ts        # 테마 색상 정의
│   └── Config.ts        # 앱 설정 및 API URL
├── hooks/               # 커스텀 React 훅
└── utils/               # 유틸리티 함수
```

## 주요 기능

### 1. 홈 화면 (지도)

홈 화면은 FastAPI 서버를 통해 제공되는 카카오맵 웹뷰를 표시합니다. 사용자의 현재 위치를 확인하고 마커로 표시합니다.

주요 기능:

- 현재 위치 확인 및 표시
- 장소 검색 (검색어 입력 시 FastAPI 서버에 요청)
- 검색 결과 마커 표시
- 마커 클릭 시 간단한 정보 표시
- 현재 위치로 이동 버튼

### 2. 장소 상세 정보

마커를 클릭하면 해당 장소의 상세 정보를 볼 수 있는 화면으로 이동합니다.

주요 기능:

- 장소 이름, 주소, 연락처 표시
- 장소 위치 지도 표시
- 길찾기 버튼 (네이티브 지도 앱 또는 카카오맵 연동)
- 전화 걸기 기능
- 웹사이트 방문 기능

## 카카오맵 연동 구현 상세

이 프로젝트는 React Native WebView를 사용하여 FastAPI 서버를 통해 카카오맵을 연동합니다.
다음은 구현 과정에서의 주요 부분입니다:

### 1. FastAPIMapView 컴포넌트

`FastAPIMapView` 컴포넌트는 WebView를 사용하여 FastAPI 서버의 `/map` 엔드포인트를 로드합니다.
이 컴포넌트는 다음 기능을 제공합니다:

- 현재 위치 정보 가져오기 및 권한 요청
- 마커 데이터 관리
- 웹뷰-네이티브 간 통신 처리
- 현재 위치로 이동 기능

```typescript
// FastAPIMapView.tsx의 핵심 부분
const [webViewUrl, setWebViewUrl] = useState<string>("");
useEffect(() => {
  (async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setErrorMsg("위치 권한이 필요합니다");
      setWebViewUrl(`${API_BASE_URL}/map`);
      return;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    setWebViewUrl(
      `${API_BASE_URL}/map?lat=${location.coords.latitude}&lng=${location.coords.longitude}`
    );
  })();
}, []);
```

### 2. 마커 관리 및 이벤트 처리

마커 데이터가 변경될 때 WebView에 JavaScript를 주입하여 마커를 업데이트합니다:

```typescript
// 마커 업데이트 예시
useEffect(() => {
  if (isReady && markers.length > 0 && webViewRef.current) {
    const markersJson = JSON.stringify(markers);
    const script = `
      if (window.updateMarkers) {
        window.updateMarkers(${markersJson});
      }
      true;
    `;
    webViewRef.current.injectJavaScript(script);
  }
}, [markers, isReady]);
```

### 3. 웹뷰-네이티브 통신

마커 클릭 시 웹뷰에서 네이티브 코드로 메시지를 전송하고, 이를 처리합니다:

```typescript
// 웹뷰 메시지 처리
const handleMessage = (event: any) => {
  try {
    const data = JSON.parse(event.nativeEvent.data);
    if (data.type === "markerClick" && onMarkerPress) {
      const marker: MapMarker = {
        id: data.id,
        title: data.title,
        description: data.description || "",
        coordinate: {
          latitude: data.lat,
          longitude: data.lng,
        },
      };
      onMarkerPress(marker);
    }
  } catch (error) {
    console.error("메시지 처리 오류:", error);
  }
};
```

## 장소 검색 기능

홈 화면의 검색 기능은 FastAPI 서버의 `/api/search` 엔드포인트를 호출하여 카카오 로컬 API로 장소를 검색합니다:

```typescript
// 검색 처리 함수
const handleSearch = async (query: string) => {
  setIsLoading(true);
  try {
    let searchUrl = `${API_BASE_URL}/api/search?query=${encodeURIComponent(
      query
    )}`;

    if (currentLocation) {
      searchUrl += `&lat=${currentLocation.latitude}&lng=${currentLocation.longitude}&radius=${APP_CONFIG.SEARCH.RADIUS}`;
    }

    const response = await fetch(searchUrl);
    const results = await response.json();

    setMarkers(results);
  } catch (error) {
    setError("검색 중 오류가 발생했습니다");
  } finally {
    setIsLoading(false);
  }
};
```

## 환경 설정

### 서버 URL 설정

`frontend/constants/Config.ts` 파일에서 API 서버 URL을 설정할 수 있습니다:

```typescript
// API 기본 URL
export const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8000";

// 개발 환경에서 실제 기기 테스트를 위한 설정
// 시뮬레이터/에뮬레이터가 아닌 실제 기기에서 테스트할 때는 아래 URL을 주석 해제하고
// 개발 컴퓨터의 로컬 IP 주소로 수정하세요
// export const API_BASE_URL = 'http://192.168.0.x:8000';
```

### 위치 권한

위치 기반 서비스 사용을 위해 다음과 같은 권한 설정이 필요합니다:

- **iOS**: `Info.plist`에 `NSLocationWhenInUseUsageDescription` 추가
- **Android**: `AndroidManifest.xml`에 `ACCESS_FINE_LOCATION` 및 `ACCESS_COARSE_LOCATION` 권한 추가

이 설정은 `app.json` 파일에서 관리됩니다:

```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "이 앱은 지도에 현재 위치를 표시하기 위해 위치 정보를 사용합니다."
      }
    },
    "android": {
      "permissions": ["ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION"]
    }
  }
}
```

## 문제 해결

### 지도가 표시되지 않는 경우

1. FastAPI 서버가 실행 중인지 확인하세요.
2. `API_BASE_URL`이 올바르게 설정되었는지 확인하세요.
3. 카카오맵 API 키가 유효한지 확인하세요.
4. 웹뷰 디버깅을 활성화하여 오류 메시지를 확인하세요.

### 위치 권한 오류

1. 기기 설정에서 앱에 위치 권한이 부여되었는지 확인하세요.
2. `app.json`에 위치 권한 관련 설정이 올바르게 되어 있는지 확인하세요.

## 참고 자료

- [Expo 문서](https://docs.expo.dev/)
- [Expo Router 문서](https://docs.expo.dev/router/introduction/)
- [React Native WebView 문서](https://github.com/react-native-webview/react-native-webview)
- [카카오맵 API 문서](https://apis.map.kakao.com/web/documentation/)
- [카카오 로컬 API 문서](https://developers.kakao.com/docs/latest/ko/local/dev-guide)
- [FastAPI 문서](https://fastapi.tiangolo.com/)
