import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, View, TouchableOpacity, Platform } from "react-native";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";
import { IconSymbol } from "../ui/IconSymbol";
import { ThemedText } from "../ThemedText";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";
import { MapMarker } from "./types";

// 카카오맵 API 키는 상위 컴포넌트로부터 받도록 변경
type KakaoMapComponentProps = {
  markers?: MapMarker[];
  onMarkerPress?: (marker: MapMarker) => void;
  apiKey?: string;
};

export function KakaoMapComponent({
  markers = [],
  onMarkerPress,
  apiKey = "발급받은_JavaScript_키를_입력하세요", // 기본값 설정
}: KakaoMapComponentProps) {
  const webViewRef = useRef<WebView>(null);
  const [userLocation, setUserLocation] =
    useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const colorScheme = useColorScheme();

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("위치 권한이 거부되었습니다.");
        return;
      }

      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setUserLocation(location);

        // 위치 정보가 있을 때 웹뷰에 위치 정보 전달
        if (webViewRef.current && location) {
          const script = `
            setUserLocation(${location.coords.latitude}, ${location.coords.longitude});
          `;
          webViewRef.current.injectJavaScript(script);
        }
      } catch (error) {
        setErrorMsg("위치를 가져오는 데 실패했습니다.");
        console.error("위치 가져오기 오류:", error);
      }
    })();
  }, []);

  // 마커 정보가 변경될 때 웹뷰에 전달
  useEffect(() => {
    if (webViewRef.current && markers.length > 0) {
      const markersJson = JSON.stringify(markers);
      const script = `
        updateMarkers(${markersJson});
      `;
      webViewRef.current.injectJavaScript(script);
    }
  }, [markers]);

  const goToUserLocation = () => {
    if (webViewRef.current && userLocation) {
      const script = `
        moveToLocation(${userLocation.coords.latitude}, ${userLocation.coords.longitude});
      `;
      webViewRef.current.injectJavaScript(script);
    }
  };

  // 카카오맵을 로드하는 HTML
  const kakaoMapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <script type="text/javascript" src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&libraries=services"></script>
      <style>
        body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; }
        #map { width: 100%; height: 100%; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        // 지도 객체
        let map;
        // 마커 객체 저장 배열
        let markers = [];
        // 현재 위치 마커
        let userMarker = null;

        // 지도 초기화 함수
        function initMap() {
          // 서울 시청 좌표 (기본 위치)
          const defaultPosition = new kakao.maps.LatLng(37.5665, 126.978);

          // 지도 옵션
          const mapOptions = { 
            center: defaultPosition,
            level: 3
          };

          // 지도 생성
          map = new kakao.maps.Map(document.getElementById('map'), mapOptions);

          // 줌 컨트롤 추가
          const zoomControl = new kakao.maps.ZoomControl();
          map.addControl(zoomControl, kakao.maps.ControlPosition.RIGHT);

          // 지도 이벤트 리스너
          kakao.maps.event.addListener(map, 'dragend', function() {
            const center = map.getCenter();
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'mapMoved',
              latitude: center.getLat(),
              longitude: center.getLng()
            }));
          });
        }

        // 현재 위치 설정 함수
        function setUserLocation(lat, lng) {
          if (!map) return;
          
          const position = new kakao.maps.LatLng(lat, lng);
          
          // 기존 마커 제거
          if (userMarker) {
            userMarker.setMap(null);
          }

          // 현재 위치 마커 이미지 설정
          const imageSrc = 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png';
          const imageSize = new kakao.maps.Size(24, 35);
          const imageOption = {offset: new kakao.maps.Point(12, 35)};
          const markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize, imageOption);

          // 마커 생성
          userMarker = new kakao.maps.Marker({
            position: position,
            map: map,
            image: markerImage
          });

          // 지도 중심 이동
          map.setCenter(position);
        }

        // 특정 위치로 이동하는 함수
        function moveToLocation(lat, lng) {
          if (!map) return;
          const position = new kakao.maps.LatLng(lat, lng);
          map.setCenter(position);
        }

        // 마커 업데이트 함수
        function updateMarkers(markersData) {
          // 기존 마커 제거 (사용자 위치 마커 제외)
          markers.forEach(marker => marker.setMap(null));
          markers = [];

          // 새 마커 생성
          markersData.forEach(markerData => {
            const position = new kakao.maps.LatLng(
              markerData.coordinate.latitude, 
              markerData.coordinate.longitude
            );
            
            const marker = new kakao.maps.Marker({
              position: position,
              map: map,
              title: markerData.title
            });

            // 마커 클릭 이벤트
            kakao.maps.event.addListener(marker, 'click', function() {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'markerClicked',
                id: markerData.id,
                title: markerData.title,
                description: markerData.description || '',
                coordinate: markerData.coordinate
              }));

              // 인포윈도우 생성
              const iwContent = '<div style="padding:5px;">' + markerData.title + '</div>';
              const infowindow = new kakao.maps.InfoWindow({
                content: iwContent
              });
              infowindow.open(map, marker);

              // 3초 후 인포윈도우 닫기
              setTimeout(() => infowindow.close(), 3000);
            });

            markers.push(marker);
          });
        }

        // 지도 초기화
        window.onload = initMap;
      </script>
    </body>
    </html>
  `;

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === "markerClicked" && onMarkerPress) {
        const marker: MapMarker = {
          id: data.id,
          title: data.title,
          description: data.description,
          coordinate: data.coordinate,
        };
        onMarkerPress(marker);
      }
    } catch (error) {
      console.error("WebView 메시지 처리 오류:", error);
    }
  };

  return (
    <View style={styles.container}>
      {errorMsg ? (
        <View style={styles.errorContainer}>
          <ThemedText>{errorMsg}</ThemedText>
        </View>
      ) : (
        <>
          <WebView
            ref={webViewRef}
            style={styles.map}
            originWhitelist={["*"]}
            source={{ html: kakaoMapHtml }}
            onMessage={handleWebViewMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            geolocationEnabled={true}
            allowFileAccess={true}
            scalesPageToFit={true}
            renderLoading={() => (
              <View style={styles.loadingContainer}>
                <ThemedText>지도 로딩 중...</ThemedText>
              </View>
            )}
            startInLoadingState={true}
          />

          <View style={styles.controlsContainer}>
            <TouchableOpacity
              style={[
                styles.controlButton,
                { backgroundColor: Colors[colorScheme ?? "light"].background },
              ]}
              onPress={goToUserLocation}
            >
              <IconSymbol
                name="location.fill"
                size={24}
                color={Colors[colorScheme ?? "light"].tint}
              />
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
  },
  controlsContainer: {
    position: "absolute",
    bottom: 20,
    right: 20,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});
