import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  ActivityIndicator,
  Linking,
  Platform,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, Stack, router } from "expo-router";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { FastAPIMapView } from "@/components/Map";
import { MapMarker } from "@/components/Map/types";
import { API_BASE_URL } from "@/constants/Config";

type PlaceDetailProps = {
  id: string;
  title: string;
  description?: string;
  address?: string;
  phone?: string;
  category?: string;
  url?: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
};

export default function PlaceDetailScreen() {
  const params = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [placeDetail, setPlaceDetail] = useState<PlaceDetailProps | null>(null);
  const colorScheme = useColorScheme();

  // URL 파라미터에서 정보 추출
  useEffect(() => {
    try {
      // params에서 필요한 정보 추출
      const id = params.id as string;
      const title = params.title as string;
      const description = params.description as string;
      const latitude = parseFloat(params.latitude as string);
      const longitude = parseFloat(params.longitude as string);

      // 좌표가 유효한지 확인
      if (isNaN(latitude) || isNaN(longitude)) {
        throw new Error("유효하지 않은 좌표");
      }

      // 장소 정보 설정
      setPlaceDetail({
        id,
        title,
        description,
        address: extractAddress(description),
        phone: extractPhone(description),
        coordinate: {
          latitude,
          longitude,
        },
      });

      setIsLoading(false);
    } catch (error) {
      console.error("장소 정보 로드 오류:", error);
      setIsLoading(false);
    }
  }, [params]);

  // 설명에서 주소 추출
  const extractAddress = (description?: string): string => {
    if (!description) return "";

    // 설명에서 첫 번째 줄을 주소로 간주
    const lines = description.split("\n");
    return lines[0] || "";
  };

  // 설명에서 전화번호 추출
  const extractPhone = (description?: string): string => {
    if (!description) return "";

    // 설명에서 두 번째 줄을 전화번호로 간주
    const lines = description.split("\n");
    return lines.length > 1 ? lines[1] : "";
  };

  const handleOpenMap = () => {
    if (!placeDetail) return;

    const scheme = Platform.OS === "ios" ? "maps:" : "geo:";
    const url = `${scheme}${placeDetail.coordinate.latitude},${placeDetail.coordinate.longitude}`;

    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        // 기본 지도 앱을 열 수 없는 경우 카카오맵 앱 실행 시도
        Linking.openURL(
          `kakaomap://route?ep=${placeDetail.coordinate.latitude},${placeDetail.coordinate.longitude}`
        ).catch(() => {
          // 카카오맵도 실행할 수 없는 경우 웹 브라우저로 카카오맵 열기
          Linking.openURL(
            `https://map.kakao.com/link/to/${encodeURIComponent(
              placeDetail.title
            )},${placeDetail.coordinate.latitude},${
              placeDetail.coordinate.longitude
            }`
          );
        });
      }
    });
  };

  const handleCall = () => {
    if (placeDetail?.phone) {
      const telUrl = `tel:${placeDetail.phone.replace(/-/g, "")}`;
      Linking.canOpenURL(telUrl).then((supported) => {
        if (supported) {
          Linking.openURL(telUrl);
        }
      });
    }
  };

  const handleWebsite = () => {
    if (placeDetail?.url) {
      Linking.openURL(placeDetail.url);
    } else {
      // URL이 없으면 카카오맵에서 검색
      Linking.openURL(
        `https://map.kakao.com/link/search/${encodeURIComponent(
          placeDetail?.title || ""
        )}`
      );
    }
  };

  // 지도에 표시할 마커
  const markers: MapMarker[] = placeDetail
    ? [
        {
          id: placeDetail.id,
          title: placeDetail.title,
          description: placeDetail.description,
          coordinate: placeDetail.coordinate,
        },
      ]
    : [];

  return (
    <>
      <Stack.Screen
        options={{
          title: placeDetail?.title || "장소 정보",
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <IconSymbol
                name="chevron.left"
                size={24}
                color={Colors[colorScheme ?? "light"].text}
              />
            </TouchableOpacity>
          ),
        }}
      />

      {isLoading ? (
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <ThemedText style={styles.loadingText}>불러오는 중...</ThemedText>
        </ThemedView>
      ) : (
        <ScrollView style={styles.container}>
          {/* 지도 영역 */}
          <View style={styles.mapContainer}>
            <FastAPIMapView markers={markers} />
          </View>

          {/* 상세 정보 영역 */}
          <ThemedView style={styles.detailContainer}>
            <ThemedText type="title" style={styles.title}>
              {placeDetail?.title}
            </ThemedText>

            {placeDetail?.category && (
              <ThemedText style={styles.category}>
                {placeDetail.category}
              </ThemedText>
            )}

            {placeDetail?.description && (
              <ThemedText style={styles.description}>
                {placeDetail.description}
              </ThemedText>
            )}

            {placeDetail?.address && (
              <ThemedView style={styles.infoRow}>
                <IconSymbol
                  name="mappin.circle"
                  size={20}
                  color={Colors[colorScheme ?? "light"].text}
                  style={styles.infoIcon}
                />
                <ThemedText style={styles.infoText}>
                  {placeDetail.address}
                </ThemedText>
              </ThemedView>
            )}

            {placeDetail?.phone && (
              <ThemedView style={styles.infoRow}>
                <IconSymbol
                  name="phone.circle"
                  size={20}
                  color={Colors[colorScheme ?? "light"].text}
                  style={styles.infoIcon}
                />
                <ThemedText
                  style={[styles.infoText, styles.linkText]}
                  onPress={handleCall}
                >
                  {placeDetail.phone}
                </ThemedText>
              </ThemedView>
            )}

            <ThemedView style={styles.infoRow}>
              <IconSymbol
                name="link.circle"
                size={20}
                color={Colors[colorScheme ?? "light"].text}
                style={styles.infoIcon}
              />
              <ThemedText
                style={[styles.infoText, styles.linkText]}
                onPress={handleWebsite}
              >
                웹사이트 방문
              </ThemedText>
            </ThemedView>

            {/* 길찾기 버튼 */}
            <TouchableOpacity
              style={[
                styles.navigationButton,
                { backgroundColor: Colors[colorScheme ?? "light"].tint },
              ]}
              onPress={handleOpenMap}
            >
              <IconSymbol
                name="arrow.triangle.turn.up.right.diamond"
                size={20}
                color="white"
                style={styles.navigationIcon}
              />
              <ThemedText style={styles.navigationText}>길찾기</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ScrollView>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
  },
  mapContainer: {
    height: 200,
  },
  detailContainer: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  category: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoIcon: {
    marginRight: 8,
  },
  infoText: {
    fontSize: 16,
    flex: 1,
  },
  linkText: {
    color: Colors.light.tint,
    textDecorationLine: "underline",
  },
  navigationButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  navigationIcon: {
    marginRight: 8,
  },
  navigationText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  backButton: {
    padding: 8,
  },
});
