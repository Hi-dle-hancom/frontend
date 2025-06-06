# 뚜따 앱 카카오맵 연동 가이드

## 소개

뚜따 앱은 카카오맵 API를 활용하여 지도 기능을 제공합니다. 이 문서는 카카오맵 연동 및 사용 방법에 대해 설명합니다.

## 설정 방법

### 1. 카카오 개발자 계정 및 앱 생성

1. [Kakao Developers](https://developers.kakao.com/)에 접속하여 계정을 생성합니다.
2. 애플리케이션 추가 후 JavaScript 키를 발급받습니다.
3. 플랫폼 설정에서 웹 플랫폼을 추가하고 사이트 도메인을 등록합니다.
   - 개발 환경에서는 `http://localhost:8081`을 등록합니다.

### 2. API 키 설정

1. 프로젝트 루트에 `.env` 파일을 생성합니다:

   ```
   KAKAO_MAP_API_KEY=발급받은_JavaScript_키
   ```

2. iOS 설정 (Info.plist):
   - ATS(App Transport Security) 설정을 추가하여 HTTP 요청을 허용합니다.
   ```xml
   <key>NSAppTransportSecurity</key>
   <dict>
     <key>NSAllowsArbitraryLoads</key>
     <true/>
   </dict>
   ```

## 기능 사용 방법

### 1. 지도 표시하기

```jsx
import { KakaoMapComponent } from "@/components/Map";

export default function MyScreen() {
  return (
    <View style={styles.container}>
      <KakaoMapComponent />
    </View>
  );
}
```

### 2. 마커 추가하기

```jsx
const markers = [
  {
    id: "1",
    title: "서울 시청",
    description: "서울특별시 중구 세종대로 110",
    coordinate: {
      latitude: 37.5662,
      longitude: 126.9784,
    },
  },
];

<KakaoMapComponent markers={markers} />;
```

### 3. 마커 클릭 이벤트 처리하기

```jsx
const handleMarkerPress = (marker) => {
  Alert.alert(marker.title, marker.description);
};

<KakaoMapComponent markers={markers} onMarkerPress={handleMarkerPress} />;
```

## 주의사항

1. 웹뷰로 구현되어 있어 네이티브 맵보다 성능이 다소 떨어질 수 있습니다.
2. 실제 앱 출시 전에 카카오 개발자 사이트에서 도메인 및 번들 ID를 정확히 등록해야 합니다.
3. 실제 앱에서는 API 키를 안전하게 관리해야 합니다.

## 참고 자료

- [카카오맵 API 문서](https://apis.map.kakao.com/web/documentation/)
- [카카오 로컬 API 문서](https://developers.kakao.com/docs/latest/ko/local/dev-guide)
