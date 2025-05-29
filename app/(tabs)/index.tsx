import React, { useState, useEffect } from "react";
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

export default function HomeScreen() {
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const colorScheme = useColorScheme();

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

  // 검색 처리
  const handleSearch = async (query: string) => {
    setIsLoading(true);
    setError(null);
    Keyboard.dismiss();

    try {
      // 검색 URL 생성
      let searchUrl = `${API_BASE_URL}/api/search?query=${encodeURIComponent(
        query
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
        setMarkers(results);
        showToast(`${results.length}개의 결과를 찾았습니다`);
      }
    } catch (error) {
      console.error("검색 오류:", error);
      setError("검색 중 오류가 발생했습니다");
      showToast("검색에 실패했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  // 마커 클릭 처리
  const handleMarkerPress = (marker: MapMarker) => {
    // 마커 클릭 시 상세 정보 표시
    Alert.alert(marker.title, marker.description || "상세 정보가 없습니다", [
      { text: "취소", style: "cancel" },
      {
        text: "상세 정보",
        onPress: () => {
          // 상세 정보 화면으로 이동
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
      {
        text: "길찾기",
        onPress: () => {
          showToast("길찾기 기능은 준비 중입니다");
        },
      },
    ]);
  };

  // 지도 이동 처리
  const handleMapMoved = (location: {
    latitude: number;
    longitude: number;
  }) => {
    // 현재 표시 중인 지도 위치 업데이트
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
          onMarkerPress={handleMarkerPress}
          onMapMoved={handleMapMoved}
        />
        <View style={styles.searchContainer}>
          <SearchBar onSearch={handleSearch} />
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator
                size="small"
                color={Colors[colorScheme ?? "light"].tint}
              />
              <ThemedText style={styles.loadingText}>검색 중...</ThemedText>
            </View>
          )}
          {error && (
            <View style={styles.errorContainer}>
              <ThemedText style={styles.errorText}>{error}</ThemedText>
            </View>
          )}
        </View>
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
  errorContainer: {
    backgroundColor: "rgba(255,0,0,0.1)",
    borderRadius: 20,
    padding: 8,
    marginHorizontal: 20,
    marginTop: 10,
    alignItems: "center",
  },
  errorText: {
    color: "red",
  },
});
