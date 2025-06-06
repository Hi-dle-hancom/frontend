import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";
import { IconSymbol } from "../ui/IconSymbol";
import { ThemedText } from "../ThemedText";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";
import { API_BASE_URL, APP_CONFIG } from "@/constants/Config";
import { MapMarker } from "./types";
import { RoutePoint } from "@/services/api";

type FastAPIMapViewProps = {
  markers?: MapMarker[];
  routeData?: RoutePoint[];
  onMarkerPress?: (marker: MapMarker) => void;
  onMapMoved?: (location: { latitude: number; longitude: number }) => void;
  showCurrentLocation?: boolean;
};

export function FastAPIMapView({
  markers = [],
  routeData = [],
  onMarkerPress,
  onMapMoved,
  showCurrentLocation = true,
}: FastAPIMapViewProps) {
  const [webViewUrl, setWebViewUrl] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const webViewRef = useRef<WebView>(null);
  const colorScheme = useColorScheme();
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 위치 권한 요청 및 현재 위치 가져오기
  useEffect(() => {
    (async () => {
      try {
        if (showCurrentLocation) {
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
        } else {
          setWebViewUrl(`${API_BASE_URL}/map`);
        }
      } catch (error) {
        console.error("위치 가져오기 오류:", error);
        setErrorMsg("위치를 가져오는데 실패했습니다");
        setWebViewUrl(`${API_BASE_URL}/map`);
      }
    })();
  }, [showCurrentLocation]);

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

  // 경로 데이터 업데이트
  useEffect(() => {
    if (isReady && routeData.length > 0 && webViewRef.current) {
      const routeJson = JSON.stringify(routeData);
      const script = `
        if (window.drawRoute) {
          window.drawRoute(${routeJson});
        }
        true;
      `;
      webViewRef.current.injectJavaScript(script);
      console.log(
        "🗺️ 경로 데이터 WebView로 전송:",
        routeData.length,
        "개 포인트"
      );
    }
  }, [routeData, isReady]);

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

      // 웹뷰 초기화 완료 이벤트 처리
      else if (data.type === "ready") {
        console.log("🗺️ 카카오맵 초기화 완료");
        setIsReady(true);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("메시지 처리 오류:", error);
    }
  };

  // 현재 위치로 이동
  const goToCurrentLocation = async () => {
    try {
      setIsLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("위치 권한이 필요합니다");
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      if (webViewRef.current && isReady) {
        const script = `
          if (window.moveToLocation) {
            window.moveToLocation(${location.coords.latitude}, ${location.coords.longitude});
          }
          true;
        `;
        webViewRef.current.injectJavaScript(script);
      }
    } catch (error) {
      console.error("현재 위치 이동 오류:", error);
      Alert.alert("오류", "현재 위치로 이동할 수 없습니다");
    } finally {
      setIsLoading(false);
    }
  };

  // 웹뷰 로드 완료 처리
  const handleLoadEnd = () => {
    setIsLoading(false);
  };

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error("WebView 로드 오류:", nativeEvent);

    // 오류 코드에 따라 다른 메시지 표시
    let errorMessage = "지도를 불러올 수 없습니다";

    // NSURLErrorDomain 오류 처리 (서버 연결 실패)
    if (nativeEvent.domain === "NSURLErrorDomain") {
      if (nativeEvent.code === -1004) {
        errorMessage = "서버에 연결할 수 없습니다. 네트워크 연결을 확인하세요.";

        // 개발자를 위한 추가 정보 콘솔 출력
        console.error(`
          ⚠️ 서버 연결 오류: 다음을 확인하세요
          1. 백엔드 서버가 실행 중인지 확인 (python main.py)
          2. API_BASE_URL이 올바른지 확인 (constants/Config.ts)
          3. 실제 기기에서 테스트 중이라면 올바른 IP 주소 사용
          4. 방화벽이나 네트워크 설정 확인
        `);
      } else if (nativeEvent.code === -1003) {
        errorMessage = "호스트를 찾을 수 없습니다. 서버 주소를 확인하세요.";
      } else if (nativeEvent.code === -1001) {
        errorMessage = "서버 응답 시간이 초과되었습니다.";
      }
    }

    setErrorMsg(errorMessage);
    setIsLoading(false);

    // 개발 모드에서 Alert로 오류 정보 표시
    if (__DEV__) {
      Alert.alert(
        "개발자 정보: WebView 오류",
        `오류 도메인: ${nativeEvent.domain}\n오류 코드: ${nativeEvent.code}\n메시지: ${nativeEvent.description}\n\n서버 URL: ${webViewUrl}\n\n⚠️ constants/Config.ts 파일에서 API_BASE_URL 설정을 확인하세요.`,
        [{ text: "확인" }]
      );
    }
  };

  return (
    <View style={styles.container}>
      {errorMsg && (
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>{errorMsg}</ThemedText>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setErrorMsg(null);
              setIsLoading(true);

              // WebView URL 재설정
              if (webViewRef.current) {
                webViewRef.current.reload();
              } else {
                // URL이 없으면 위치 정보를 다시 가져와서 URL 설정
                (async () => {
                  try {
                    if (showCurrentLocation) {
                      const { status } =
                        await Location.requestForegroundPermissionsAsync();
                      if (status !== "granted") {
                        setErrorMsg("위치 권한이 필요합니다");
                        setIsLoading(false);
                        return;
                      }

                      const location = await Location.getCurrentPositionAsync({
                        accuracy: Location.Accuracy.Balanced,
                      });

                      setWebViewUrl(
                        `${API_BASE_URL}/map?lat=${location.coords.latitude}&lng=${location.coords.longitude}`
                      );
                    } else {
                      setWebViewUrl(`${API_BASE_URL}/map`);
                    }
                  } catch (error) {
                    console.error("위치 가져오기 오류:", error);
                    setErrorMsg("위치를 가져오는데 실패했습니다");
                    setIsLoading(false);
                  }
                })();
              }
            }}
          >
            <ThemedText style={styles.retryButtonText}>다시 시도</ThemedText>
          </TouchableOpacity>
        </View>
      )}

      {webViewUrl ? (
        <WebView
          ref={webViewRef}
          source={{ uri: webViewUrl }}
          style={styles.webview}
          onMessage={handleMessage}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" />
            </View>
          )}
        />
      ) : (
        <View style={styles.loadingContainer}>
          <ThemedText>위치 정보를 가져오는 중...</ThemedText>
        </View>
      )}

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
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

// 경로 삭제 기능을 외부에서 사용할 수 있도록 ref 타입 정의
export interface FastAPIMapViewRef {
  clearRoute: () => void;
  goToCurrentLocation: () => Promise<void>;
}

// 🆕 forwardRef를 사용한 컴포넌트 (필요시 사용)
export const FastAPIMapViewWithRef = React.forwardRef<
  FastAPIMapViewRef,
  FastAPIMapViewProps
>((props, ref) => {
  const webViewRef = useRef<WebView>(null);
  const [isReady, setIsReady] = useState(false);

  React.useImperativeHandle(ref, () => ({
    clearRoute: () => {
      if (isReady && webViewRef.current) {
        const script = `
          if (window.clearRoute) {
            window.clearRoute();
          }
          true;
        `;
        webViewRef.current.injectJavaScript(script);
      }
    },
    goToCurrentLocation: async () => {
      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (webViewRef.current && isReady) {
          const script = `
            if (window.moveToLocation) {
              window.moveToLocation(${location.coords.latitude}, ${location.coords.longitude});
            }
            true;
          `;
          webViewRef.current.injectJavaScript(script);
        }
      } catch (error) {
        console.error("현재 위치 이동 오류:", error);
        throw error;
      }
    },
  }));

  return <FastAPIMapView {...props} />;
});

// displayName 추가
FastAPIMapViewWithRef.displayName = "FastAPIMapViewWithRef";

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
    padding: 16,
    margin: 16,
    backgroundColor: "rgba(255, 0, 0, 0.1)",
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 0, 0, 0.3)",
  },
  errorText: {
    textAlign: "center",
    marginBottom: 12,
    fontWeight: "500",
  },
  retryButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "600",
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
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.7)",
  },
});
