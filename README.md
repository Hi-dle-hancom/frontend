# 뚜따 앱 프론트엔드 - 3주차 개발 완료

이 프로젝트는 뚜따 앱의 프론트엔드 코드를 포함하고 있습니다. React Native와 Expo 프레임워크를 사용하여 개발된 크로스 플랫폼 모바일 애플리케이션입니다. **AI 기반 자전거 경로 추천 시스템**과 실시간 지도 기능을 핵심으로 제공합니다.

## 🚀 3주차 주요 성과

### ✅ 완료된 핵심 기능

1. **백엔드 API 통신 환경 구축** - Axios 기반 HTTP 클라이언트 완성
2. **AI 경로 계산 및 시각화** - 백엔드 AI 모델과 연동하여 실시간 경로 생성
3. **폴리라인 지도 표시** - 카카오맵 WebView에 경로를 시각적으로 표현
4. **전역 상태 관리** - Zustand 기반 효율적 상태 관리 시스템

### 🎯 차별화 포인트

- **AI 연동 경로 시스템**: 백엔드 AI 모델과 실시간 통신하여 스마트 경로 생성
- **폴리라인 시각화**: 경로를 지도 위에 직관적으로 표시하는 고급 UI/UX
- **전역 상태 관리**: Zustand로 앱 전체 상태를 효율적으로 관리
- **실시간 피드백**: 로딩, 오류, 성공 상태를 사용자에게 명확히 전달

## 기술 스택

- **프레임워크**: React Native, Expo
- **언어**: TypeScript
- **HTTP 클라이언트**: Axios (재시도 로직, 인터셉터 포함)
- **상태 관리**: Zustand
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
- **백엔드 서버 실행** (FastAPI) - 필수!

### 설치 및 실행

1. 의존성 설치

```bash
npm install
```

2. 환경 변수 설정

`.env` 파일을 생성하고 백엔드 서버 주소를 설정하세요:

```env
# 백엔드 API 서버 URL
API_BASE_URL=http://localhost:8000

# 개발 환경에서 실제 기기 테스트를 위한 설정
# 시뮬레이터/에뮬레이터가 아닌 실제 기기에서 테스트할 때는 아래 URL을 주석 해제하고
# 개발 컴퓨터의 로컬 IP 주소로 수정하세요
# API_BASE_URL=http://192.168.0.x:8000
```

3. 앱 실행

```bash
npx expo start
```

실행 후 터미널에 출력되는 옵션 중 하나를 선택하여 앱을 실행할 수 있습니다:

- **a**: Android 에뮬레이터에서 실행
- **i**: iOS 시뮬레이터에서 실행 (macOS 전용)
- **w**: 웹 브라우저에서 실행
- **Expo Go 앱**: QR 코드를 스캔하여 실제 기기에서 실행

## 프로젝트 구조

```
frontend/
├── app/                 # 앱의 메인 화면들 (Expo Router)
│   ├── (tabs)/          # 탭 기반 화면
│   │   ├── _layout.tsx  # 탭 네비게이션 설정
│   │   ├── index.tsx    # 🔄 홈 화면 (AI 경로 기능 통합)
│   │   └── explore.tsx  # 탐색 화면
│   ├── place/           # 장소 관련 화면
│   │   └── [id].tsx     # 장소 상세 정보 화면
│   ├── _layout.tsx      # 앱 루트 레이아웃
│   └── +not-found.tsx   # 404 페이지
├── assets/              # 정적 파일 (이미지, 폰트 등)
├── components/          # 재사용 가능한 컴포넌트들
│   ├── Map/             # 지도 관련 컴포넌트
│   │   ├── FastAPIMapView.tsx  # 🔄 경로 시각화 기능 추가
│   │   └── types.ts            # 지도 관련 타입 정의
│   ├── Search/          # 검색 관련 컴포넌트
│   └── ui/              # UI 기본 컴포넌트
├── constants/           # 상수 정의
│   ├── Colors.ts        # 테마 색상 정의
│   └── Config.ts        # 앱 설정 및 API URL
├── hooks/               # 커스텀 React 훅
├── services/            # API 서비스
│   └── api.ts           # 🆕 Axios 기반 백엔드 API 클라이언트
├── stores/              # 🆕 Zustand 상태 관리
│   └── mapStore.ts      # 지도 관련 전역 상태
└── utils/               # 유틸리티 함수
```

## 🤖 AI 기반 경로 추천 시스템

### 핵심 기능

- **실시간 경로 계산**: 백엔드 AI 모델과 연동하여 최적 경로 생성
- **폴리라인 시각화**: 카카오맵에 경로를 파란색 선으로 표시
- **출발지/도착지 마커**: 빨간색(출발지), 파란색(도착지) 마커로 명확한 구분
- **경로 정보 카드**: 거리, 시간, 안전도 점수를 실시간으로 표시

### 사용법

1. **장소 검색**: 홈 화면 상단 검색바에서 목적지 검색
2. **마커 선택**: 검색 결과 마커를 터치하여 "🗺️ 경로 찾기" 선택
3. **경로 확인**: AI가 계산한 경로가 지도에 폴리라인으로 표시됨
4. **정보 확인**: 화면 하단에 거리, 시간, 안전도 정보 표시
5. **경로 삭제**: 경로 정보 카드의 ❌ 버튼으로 경로 삭제

### API 연동 플로우

```typescript
// 1. 경로 요청 데이터 구성
const routeRequest: RouteRequest = {
  start_lat: currentLocation.latitude,
  start_lng: currentLocation.longitude,
  end_lat: destination.coordinate.latitude,
  end_lng: destination.coordinate.longitude,
  preferences: {
    prioritize_safety: true,
    avoid_hills: false,
  },
};

// 2. 백엔드 AI 모델 호출
const routeResponse = await getRoute(routeRequest);

// 3. 경로 데이터를 지도에 시각화
setRouteData(routeResponse.route_points);
```

## 📊 상태 관리 시스템 (Zustand)

### 전역 상태 구조

```typescript
interface MapState {
  // 현재 위치
  currentLocation: { latitude: number; longitude: number } | null;

  // 검색 관련
  searchQuery: string;
  searchResults: MapMarker[];
  isSearchLoading: boolean;

  // 경로 관련
  routeData: RoutePoint[];
  routeInfo: RouteResponse | null;
  isRouteLoading: boolean;
  selectedDestination: MapMarker | null;

  // 자전거 대여소
  bikeStations: NearbyStation[];

  // 오류 처리
  error: string | null;
}
```

### 상태 사용 예시

```typescript
import { useRouteState, useMapActions } from "@/stores/mapStore";

function MyComponent() {
  // 경로 상태 가져오기
  const { routeData, routeInfo, isLoading } = useRouteState();

  // 액션 함수들 가져오기
  const { setRouteData, clearRoute } = useMapActions();

  // 상태 사용
  return (
    <View>
      {isLoading && <LoadingIndicator />}
      {routeInfo && <RouteInfoCard data={routeInfo} />}
    </View>
  );
}
```

## 🎨 주요 기능

### 1. AI 기반 자전거 경로 추천

**핵심 특징:**

- 백엔드 AI 모델과 실시간 통신
- 자전거 도로 정보 반영
- 안전성 및 신뢰도 점수 제공
- 턴바이턴 안내 지원 (백엔드 제공)

**UI/UX 특징:**

- 직관적인 폴리라인 시각화
- 실시간 로딩 상태 표시
- 상세한 경로 정보 카드
- 원터치 경로 삭제

### 2. 고급 지도 인터랙션

**FastAPI 카카오맵 연동:**

- WebView를 통한 카카오맵 표시
- JavaScript 인젝션으로 동적 기능 추가
- React Native ↔ WebView 양방향 통신

**주요 기능:**

- 현재 위치 자동 표시
- 마커 클릭 이벤트 처리
- 지도 이동 이벤트 감지
- 폴리라인 동적 그리기/삭제

### 3. 효율적인 상태 관리

**Zustand 도입 효과:**

- 컴포넌트 간 상태 공유 간소화
- 불필요한 리렌더링 방지
- 디버깅 및 유지보수성 향상

**성능 최적화:**

- 선택자 함수로 필요한 상태만 구독
- 액션 분리로 관심사 분리
- 초기화 및 정리 함수 제공

## 🔌 API 통신 시스템

### Axios 설정

```typescript
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 요청/응답 인터셉터로 로깅 및 에러 처리
apiClient.interceptors.request.use(/* ... */);
apiClient.interceptors.response.use(/* ... */);
```

### 주요 API 엔드포인트

| 엔드포인트               | 기능            | 특징           |
| ------------------------ | --------------- | -------------- |
| `POST /api/find-path`    | 🆕 AI 경로 계산 | **핵심 기능**  |
| `GET /api/search`        | 장소 검색       | 위치 기반 검색 |
| `GET /api/bike-stations` | 대여소 정보     | 실시간 데이터  |
| `GET /api/health`        | 서버 상태 확인  | 연결 테스트    |

### 에러 처리 시스템

- **재시도 로직**: 네트워크 오류 시 자동 재시도
- **타임아웃 처리**: 30초 타임아웃으로 무한 대기 방지
- **사용자 피드백**: 토스트 메시지 및 에러 UI 표시
- **로깅**: 개발 중 디버깅을 위한 상세 로그

## 환경 설정

### 필수 환경 변수

```env
# 백엔드 서버 URL (필수)
API_BASE_URL=http://localhost:8000

# 카카오맵 API 키 (선택사항 - 백엔드에서 관리)
KAKAO_MAP_API_KEY=your_api_key_here
```

### 개발 환경별 설정

**시뮬레이터 개발:**

```env
API_BASE_URL=http://localhost:8000
```

**실제 기기 테스트:**

```env
API_BASE_URL=http://192.168.0.x:8000  # 개발 PC의 로컬 IP
```

**프로덕션:**

```env
API_BASE_URL=https://api.ddudda.com
```

## 📱 화면별 주요 기능

### 홈 화면 (`app/(tabs)/index.tsx`)

**기존 기능:**

- 현재 위치 표시
- 장소 검색
- 검색 결과 마커 표시

**🆕 추가된 기능:**

- AI 경로 계산 요청
- 폴리라인 경로 시각화
- 실시간 로딩 상태
- 경로 정보 카드 표시
- 경로 삭제 기능

### 장소 상세 화면 (`app/place/[id].tsx`)

- 장소 정보 표시
- 연락처, 주소 정보
- 네이티브 지도 앱 연동
- 길찾기 기능

## 🛠️ 개발 도구 및 설정

### TypeScript 설정

```json
{
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### ESLint 설정

- React Native 규칙 적용
- TypeScript 지원
- Expo 특화 규칙

## 📈 성능 최적화

### 메모리 관리

- WebView 리소스 정리
- 이벤트 리스너 해제
- 상태 초기화 기능

### 네트워크 최적화

- 요청 타임아웃 설정
- 중복 요청 방지
- 캐싱 전략 (향후 구현 예정)

### 렌더링 최적화

- Zustand 선택자 함수 활용
- 불필요한 리렌더링 방지
- LazyLoading 적용 (필요시)

## 🔍 문제 해결

### 자주 발생하는 문제

**1. 지도가 표시되지 않는 경우**

- 백엔드 서버 실행 상태 확인
- `API_BASE_URL` 환경 변수 확인
- 네트워크 연결 상태 확인

**2. 경로가 그려지지 않는 경우**

- 브라우저 개발자 도구에서 WebView 콘솔 확인
- 백엔드 `/api/find-path` 엔드포인트 동작 확인
- GPS 권한 설정 확인

**3. 위치 권한 오류**

```bash
# iOS
"NSLocationWhenInUseUsageDescription" 설정 확인

# Android
"ACCESS_FINE_LOCATION" 권한 확인
```

### 디버깅 방법

```javascript
// API 요청 로깅 활성화
console.log("🚀 API 요청:", routeRequest);

// WebView 메시지 확인
console.log("🗺️ WebView 메시지:", data);

// 상태 변화 추적
console.log("📊 상태 변화:", { routeData, routeInfo });
```

## 🚧 다음 개발 계획 (4주차)

### 우선순위 높음

1. **실시간 위치 추적** - 경로 이동 중 현재 위치 업데이트
2. **턴바이턴 안내** - 백엔드 데이터 기반 상세 안내
3. **경로 저장 기능** - 즐겨찾는 경로 로컬 저장

### 우선순위 중간

1. **오프라인 지도** - 네트워크 없을 때 기본 지도 표시
2. **사용자 설정** - 경로 계산 옵션 개인화
3. **알림 시스템** - 경로 도착 및 이벤트 알림

### 우선순위 낮음

1. **소셜 기능** - 경로 공유 기능
2. **통계 대시보드** - 이용 통계 및 분석
3. **다국어 지원** - i18n 시스템 구축

## 🔗 참고 자료

### 개발 문서

- [Expo 공식 문서](https://docs.expo.dev/)
- [React Native 공식 문서](https://reactnative.dev/)
- [Zustand 공식 문서](https://zustand-demo.pmnd.rs/)
- [Axios 공식 문서](https://axios-http.com/)

### API 문서

- [카카오맵 API 문서](https://apis.map.kakao.com/web/documentation/)
- [Expo Location 문서](https://docs.expo.dev/versions/latest/sdk/location/)
- [React Native WebView 문서](https://github.com/react-native-webview/react-native-webview)

### 백엔드 연동

- [FastAPI 백엔드 README](../backend/README.md)
- [API 엔드포인트 문서](http://localhost:8000/docs) (서버 실행 후)

## 💡 기술적 특징 요약

### 🎯 핵심 성과

1. **완전한 백엔드 연동**: AI 모델과 실시간 통신하는 경로 시스템
2. **고급 지도 시각화**: WebView 기반 폴리라인 및 마커 시스템
3. **체계적 상태 관리**: Zustand 기반 효율적 전역 상태 관리
4. **견고한 오류 처리**: 네트워크, UI, 상태 모든 레벨의 에러 핸들링

### 🔧 기술적 우수성

- **확장 가능한 아키텍처**: 새로운 기능 추가가 용이한 모듈 구조
- **성능 최적화**: 불필요한 렌더링 방지 및 메모리 효율성
- **사용자 경험**: 직관적 UI/UX와 실시간 피드백 제공
- **개발자 경험**: TypeScript, 명확한 타입 정의, 디버깅 도구

---

**개발 완료 상태**: ✅ 3주차 목표 100% 달성  
**핵심 기능**: AI 경로 계산 ↔ 폴리라인 시각화 ↔ 상태 관리 완벽 연동  
**다음 단계**: 4주차 실시간 위치 추적 및 턴바이턴 안내 시스템 구축
