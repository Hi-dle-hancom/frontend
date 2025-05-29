import React, { useEffect, useState, useRef } from "react";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";
import { IconSymbol } from "../ui/IconSymbol";
import { ThemedText } from "../ThemedText";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";
import { API_BASE_URL, APP_CONFIG } from "@/constants/Config";
import { MapMarker } from "./types";

type FastAPIMapViewProps = {
  markers?: MapMarker[];
  onMarkerPress?: (marker: MapMarker) => void;
  onMapMoved?: (location: { latitude: number; longitude: number }) => void;
};

export function FastAPIMapView({
  markers = [],
  onMarkerPress,
  onMapMoved,
}: FastAPIMapViewProps) {
  const [webViewUrl, setWebViewUrl] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const webViewRef = useRef<WebView>(null);
  const colorScheme = useColorScheme();
  const [isReady, setIsReady] = useState(false);

  // 위치 권한 요청 및 현재 위치 가져오기
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setErrorMsg("위치 권한이 필요합니다");
          // 권한이 없더라도 기본 위치로 지도 로드
          setWebViewUrl(`${API_BASE_URL}/map`);
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        // 현재 위치를 기반으로 지도 URL 생성
        setWebViewUrl(
          `${API_BASE_URL}/map?lat=${location.coords.latitude}&lng=${location.coords.longitude}`
        );
      } catch (error) {
        console.error("위치 가져오기 오류:", error);
        setErrorMsg("위치를 가져오는데 실패했습니다");

        // 오류 발생 시 기본 위치로 지도 로드
        setWebViewUrl(`${API_BASE_URL}/map`);
      }
    })();
  }, []);

  // 마커가 변경되면 웹뷰에 마커 업데이트 메시지 전송
  useEffect(() => {
    if (isReady && markers.length > 0 && webViewRef.current) {
      const markersJson = JSON.stringify(markers);
      const script = `
        if (window.updateMarkers) {
          window.updateMarkers(${markersJson});
        } else {
          console.error('updateMarkers 함수를 찾을 수 없습니다');
        }
        true;
      `;
      webViewRef.current.injectJavaScript(script);
    }
  }, [markers, isReady]);

  // 웹뷰 메시지 처리
  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      // 마커 클릭 이벤트 처리
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

      // 지도 이동 이벤트 처리
      else if (data.type === "mapMoved" && onMapMoved) {
        onMapMoved({
          latitude: data.lat,
          longitude: data.lng,
        });
      }
    } catch (error) {
      console.error("메시지 처리 오류:", error);
    }
  };

  // 현재 위치로 이동
  const goToCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("위치 권한이 필요합니다");
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      if (webViewRef.current) {
        const script = `
          if (window.moveToLocation) {
            window.moveToLocation(${location.coords.latitude}, ${location.coords.longitude});
          }
          true;
        `;
        webViewRef.current.injectJavaScript(script);
      }
    } catch (error) {
      console.error("위치 가져오기 오류:", error);
    }
  };

  // 웹뷰 로드 완료 처리
  const handleLoadEnd = () => {
    setIsReady(true);

    // 웹뷰 로드 완료 후 마커 업데이트
    if (markers.length > 0 && webViewRef.current) {
      const markersJson = JSON.stringify(markers);
      const script = `
        if (window.updateMarkers) {
          window.updateMarkers(${markersJson});
        }
        true;
      `;
      webViewRef.current.injectJavaScript(script);
    }
  };

  return (
    <View style={styles.container}>
      {errorMsg && (
        <View style={styles.errorContainer}>
          <ThemedText>{errorMsg}</ThemedText>
        </View>
      )}

      {webViewUrl ? (
        <WebView
          ref={webViewRef}
          source={{ uri: webViewUrl }}
          style={styles.webview}
          onMessage={handleMessage}
          onLoadEnd={handleLoadEnd}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ThemedText>지도 로딩 중...</ThemedText>
            </View>
          )}
          startInLoadingState={true}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          geolocationEnabled={true}
        />
      ) : (
        <View style={styles.loadingContainer}>
          <ThemedText>위치 정보를 가져오는 중...</ThemedText>
        </View>
      )}

      {/* 현재 위치 버튼 */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[
            styles.controlButton,
            { backgroundColor: Colors[colorScheme ?? "light"].background },
          ]}
          onPress={goToCurrentLocation}
        >
          <IconSymbol
            name="location.fill"
            size={24}
            color={Colors[colorScheme ?? "light"].tint}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
    position: "relative",
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    padding: 8,
    margin: 8,
    backgroundColor: "rgba(255, 0, 0, 0.1)",
    borderRadius: 8,
    alignItems: "center",
  },
  controlsContainer: {
    position: "absolute",
    right: 16,
    bottom: 16,
    zIndex: 10,
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
