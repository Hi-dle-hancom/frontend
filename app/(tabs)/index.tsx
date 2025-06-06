import React, { useEffect } from "react";
import {
  StyleSheet,
  View,
  Platform,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  ToastAndroid,
  Keyboard,
  TouchableOpacity,
} from "react-native";
import { FastAPIMapView, MapMarker } from "@/components/Map";
import { SearchBar } from "@/components/Search";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";
import { API_BASE_URL, APP_CONFIG } from "@/constants/Config";
import * as Location from "expo-location";
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { router } from "expo-router";
import { getRoute, RouteRequest } from "@/services/api";

// 🆕 Zustand 스토어 import
import {
  useCurrentLocation,
  useSearchQuery,
  useSearchResults,
  useIsSearchLoading,
  useRouteData,
  useRouteInfo,
  useIsRouteLoading,
  useSelectedDestination,
  useMapError,
  useSetCurrentLocation,
  useSetSearchResults,
  useSetIsSearchLoading,
  useSetRouteData,
  useSetRouteInfo,
  useSetIsRouteLoading,
  useSetSelectedDestination,
  useClearRoute,
  useSetError,
  useClearError,
} from "@/stores/mapStore";

export default function HomeScreen() {
  const colorScheme = useColorScheme();

  // 🆕 Zustand 스토어에서 상태 가져오기 (개별 선택자 사용)
  const currentLocation = useCurrentLocation();
  const searchQuery = useSearchQuery();
  const markers = useSearchResults();
  const isLoading = useIsSearchLoading();
  const routeData = useRouteData();
  const routeInfo = useRouteInfo();
  const isRouteLoading = useIsRouteLoading();
  const selectedDestination = useSelectedDestination();
  const error = useMapError();

  // 🆕 Zustand 액션들 (개별 액션 선택자 사용)
  const setCurrentLocation = useSetCurrentLocation();
  const setSearchResults = useSetSearchResults();
  const setIsSearchLoading = useSetIsSearchLoading();
  const setRouteData = useSetRouteData();
  const setRouteInfo = useSetRouteInfo();
  const setIsRouteLoading = useSetIsRouteLoading();
  const setSelectedDestination = useSetSelectedDestination();
  const clearRoute = useClearRoute();
  const setError = useSetError();
  const clearError = useClearError();

  // 앱 시작 시 현재 위치 가져오기
  useEffect(() => {
    getCurrentLocation();
  }, []);

  // 현재 위치 가져오기 함수
  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        showToast("위치 권한이 필요합니다");
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // 🆕 Zustand 스토어에 현재 위치 저장
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      console.error("위치 가져오기 오류:", error);
      showToast("위치를 가져오는데 실패했습니다");
    }
  };

  // 토스트 메시지 표시 함수
  const showToast = (message: string) => {
    if (Platform.OS === "android") {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert("알림", message);
    }
  };

  // 🆕 검색 처리 (Zustand 사용)
  const handleSearch = async (searchQuery: string) => {
    setIsSearchLoading(true);
    clearError();
    Keyboard.dismiss();

    try {
      // 검색 URL 생성
      let searchUrl = `${API_BASE_URL}/api/search?query=${encodeURIComponent(
        searchQuery
      )}`;

      // 현재 위치가 있으면 위치 기반 검색
      if (currentLocation) {
        searchUrl += `&lat=${currentLocation.latitude}&lng=${currentLocation.longitude}&radius=${APP_CONFIG.SEARCH.RADIUS}`;
      }

      // API 호출
      const response = await fetch(searchUrl);

      if (!response.ok) {
        throw new Error(`검색 실패: ${response.status}`);
      }

      const results = await response.json();

      if (results.length === 0) {
        showToast("검색 결과가 없습니다");
      } else {
        // 🆕 검색 결과를 스토어에 저장
        setSearchResults(results);
        showToast(`${results.length}개의 결과를 찾았습니다`);
      }
    } catch (error) {
      console.error("검색 오류:", error);
      setError("검색 중 오류가 발생했습니다");
      showToast("검색에 실패했습니다");
    } finally {
      setIsSearchLoading(false);
    }
  };

  // 🆕 경로 계산 함수 (Zustand 사용)
  const calculateRoute = async (destination: MapMarker) => {
    if (!currentLocation) {
      showToast("현재 위치를 먼저 확인해주세요");
      return;
    }

    setIsRouteLoading(true);
    setSelectedDestination(destination);
    clearError();

    try {
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

      console.log("🚀 경로 계산 요청:", routeRequest);

      const routeResponse = await getRoute(routeRequest);

      console.log("✅ 경로 계산 완료:", routeResponse);

      // 🆕 경로 데이터를 스토어에 저장
      setRouteData(routeResponse.route_points);
      setRouteInfo(routeResponse);

      // 성공 메시지
      showToast(
        `경로 계산 완료: ${routeResponse.summary.distance}km, ${routeResponse.summary.duration}분`
      );
    } catch (error) {
      console.error("❌ 경로 계산 오류:", error);
      setError("경로 계산에 실패했습니다");
      showToast("경로 계산에 실패했습니다");
    } finally {
      setIsRouteLoading(false);
    }
  };

  // 🆕 경로 삭제 함수 (Zustand 사용)
  const handleClearRoute = () => {
    clearRoute();
    showToast("경로가 삭제되었습니다");
  };

  // 마커 클릭 처리
  const handleMarkerPress = (marker: MapMarker) => {
    // 마커 클릭 시 옵션 표시
    Alert.alert(marker.title, marker.description || "상세 정보가 없습니다", [
      { text: "취소", style: "cancel" },
      {
        text: "🗺️ 경로 찾기",
        onPress: () => calculateRoute(marker),
      },
      {
        text: "📍 상세 정보",
        onPress: () => {
          router.push({
            pathname: "/place/[id]",
            params: {
              id: marker.id,
              title: marker.title,
              description: marker.description,
              latitude: marker.coordinate.latitude.toString(),
              longitude: marker.coordinate.longitude.toString(),
            },
          } as any);
        },
      },
    ]);
  };

  // 지도 이동 처리
  const handleMapMoved = (location: {
    latitude: number;
    longitude: number;
  }) => {
    if (APP_CONFIG.DEBUG) {
      console.log("지도 이동:", location);
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: Colors[colorScheme ?? "light"].background },
      ]}
    >
      <View style={styles.mapContainer}>
        <FastAPIMapView
          markers={markers}
          routeData={routeData}
          onMarkerPress={handleMarkerPress}
          onMapMoved={handleMapMoved}
        />

        <View style={styles.searchContainer}>
          <SearchBar onSearch={handleSearch} />

          {/* 로딩 인디케이터들 */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator
                size="small"
                color={Colors[colorScheme ?? "light"].tint}
              />
              <ThemedText style={styles.loadingText}>검색 중...</ThemedText>
            </View>
          )}

          {isRouteLoading && (
            <View
              style={[styles.loadingContainer, styles.routeLoadingContainer]}
            >
              <ActivityIndicator size="small" color="#007AFF" />
              <ThemedText style={styles.routeLoadingText}>
                경로 계산 중...
              </ThemedText>
            </View>
          )}

          {error && (
            <View style={styles.errorContainer}>
              <ThemedText style={styles.errorText}>{error}</ThemedText>
              <TouchableOpacity
                onPress={clearError}
                style={styles.errorCloseButton}
              >
                <IconSymbol name="xmark.circle" size={20} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 경로 정보 표시 */}
        {routeInfo && (
          <View style={styles.routeInfoContainer}>
            <View style={styles.routeInfoCard}>
              <View style={styles.routeInfoHeader}>
                <ThemedText style={styles.routeInfoTitle}>
                  📍 {selectedDestination?.title}
                </ThemedText>
                <TouchableOpacity
                  onPress={handleClearRoute}
                  style={styles.clearRouteButton}
                >
                  <IconSymbol
                    name="xmark.circle.fill"
                    size={24}
                    color="#FF3B30"
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.routeStats}>
                <View style={styles.routeStat}>
                  <ThemedText style={styles.routeStatLabel}>거리</ThemedText>
                  <ThemedText style={styles.routeStatValue}>
                    {routeInfo.summary.distance}km
                  </ThemedText>
                </View>
                <View style={styles.routeStat}>
                  <ThemedText style={styles.routeStatLabel}>시간</ThemedText>
                  <ThemedText style={styles.routeStatValue}>
                    {routeInfo.summary.duration}분
                  </ThemedText>
                </View>
                <View style={styles.routeStat}>
                  <ThemedText style={styles.routeStatLabel}>안전도</ThemedText>
                  <ThemedText style={styles.routeStatValue}>
                    {Math.round(routeInfo.summary.safety_score * 100)}%
                  </ThemedText>
                </View>
              </View>

              <ThemedText style={styles.routeAlgorithm}>
                🤖 {routeInfo.summary.algorithm_version} • 대여소{" "}
                {routeInfo.summary.bike_stations}개
              </ThemedText>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  searchContainer: {
    position: "absolute",
    top: 10,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 20,
    padding: 8,
    marginHorizontal: 20,
    marginTop: 10,
  },
  loadingText: {
    marginLeft: 8,
    color: "white",
  },
  routeLoadingContainer: {
    backgroundColor: "rgba(0,122,255,0.8)",
  },
  routeLoadingText: {
    marginLeft: 8,
    color: "white",
    fontWeight: "600",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,0,0,0.1)",
    borderRadius: 20,
    padding: 8,
    marginHorizontal: 20,
    marginTop: 10,
  },
  errorText: {
    color: "red",
    flex: 1,
  },
  // 🆕 오류 닫기 버튼
  errorCloseButton: {
    marginLeft: 8,
    padding: 4,
  },
  routeInfoContainer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  routeInfoCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  routeInfoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  routeInfoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
  },
  clearRouteButton: {
    padding: 4,
  },
  routeStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 8,
  },
  routeStat: {
    alignItems: "center",
  },
  routeStatLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 2,
  },
  routeStatValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#007AFF",
  },
  routeAlgorithm: {
    fontSize: 12,
    textAlign: "center",
    opacity: 0.7,
  },
});
