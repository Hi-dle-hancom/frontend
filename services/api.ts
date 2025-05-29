import { MapMarker } from "@/components/Map/types";

// API 키를 상수로 정의 (실제 앱에서는 환경 변수나 secure storage 사용 권장)
const KAKAO_MAP_API_KEY = "발급받은_JavaScript_키를_입력하세요"; // 실제 키로 교체 필요

const KAKAO_LOCAL_API_BASE = "https://dapi.kakao.com/v2/local";

/**
 * 키워드로 장소 검색
 * @param query 검색어
 * @param options 검색 옵션
 * @returns 검색 결과 마커 배열
 */
export const searchPlacesByKeyword = async (
  query: string,
  options?: {
    x?: number; // 중심 경도
    y?: number; // 중심 위도
    radius?: number; // 반경 (미터)
    page?: number; // 페이지
    size?: number; // 페이지당 결과 수
  }
): Promise<MapMarker[]> => {
  try {
    // 기본 검색 옵션
    const params = new URLSearchParams({
      query,
      page: (options?.page || 1).toString(),
      size: (options?.size || 15).toString(),
    });

    // 위치 기반 검색 옵션 추가
    if (options?.x && options?.y) {
      params.append("x", options.x.toString());
      params.append("y", options.y.toString());

      if (options.radius) {
        params.append("radius", options.radius.toString());
      }
    }

    const response = await fetch(
      `${KAKAO_LOCAL_API_BASE}/search/keyword.json?${params.toString()}`,
      {
        headers: {
          Authorization: `KakaoAK ${KAKAO_MAP_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API 요청 실패: ${response.status}`);
    }

    const data = await response.json();

    // 검색 결과를 MapMarker 형식으로 변환
    return data.documents.map((item: any) => ({
      id: item.id,
      title: item.place_name,
      description: `${item.address_name || item.road_address_name}\n${
        item.phone || ""
      }`,
      coordinate: {
        latitude: parseFloat(item.y),
        longitude: parseFloat(item.x),
      },
    }));
  } catch (error) {
    console.error("장소 검색 API 오류:", error);
    throw error;
  }
};

/**
 * 주소로 장소 검색
 * @param address 주소
 * @returns 검색 결과 마커 배열
 */
export const searchPlacesByAddress = async (
  address: string
): Promise<MapMarker[]> => {
  try {
    const params = new URLSearchParams({
      query: address,
    });

    const response = await fetch(
      `${KAKAO_LOCAL_API_BASE}/search/address.json?${params.toString()}`,
      {
        headers: {
          Authorization: `KakaoAK ${KAKAO_MAP_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API 요청 실패: ${response.status}`);
    }

    const data = await response.json();

    // 검색 결과를 MapMarker 형식으로 변환
    return data.documents.map((item: any) => ({
      id: item.id || String(Date.now()),
      title: item.address_name,
      description: item.address_name,
      coordinate: {
        latitude: parseFloat(item.y),
        longitude: parseFloat(item.x),
      },
    }));
  } catch (error) {
    console.error("주소 검색 API 오류:", error);
    throw error;
  }
};

/**
 * 현재 위치 근처 장소 검색
 * @param category 카테고리 (예: FD6 - 음식점)
 * @param latitude 현재 위도
 * @param longitude 현재 경도
 * @param radius 검색 반경 (미터)
 * @returns 검색 결과 마커 배열
 */
export const searchNearbyPlaces = async (
  category: string,
  latitude: number,
  longitude: number,
  radius: number = 1000
): Promise<MapMarker[]> => {
  try {
    const params = new URLSearchParams({
      category_group_code: category,
      x: longitude.toString(),
      y: latitude.toString(),
      radius: radius.toString(),
    });

    const response = await fetch(
      `${KAKAO_LOCAL_API_BASE}/search/category.json?${params.toString()}`,
      {
        headers: {
          Authorization: `KakaoAK ${KAKAO_MAP_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API 요청 실패: ${response.status}`);
    }

    const data = await response.json();

    // 검색 결과를 MapMarker 형식으로 변환
    return data.documents.map((item: any) => ({
      id: item.id,
      title: item.place_name,
      description: `${item.address_name || item.road_address_name}\n${
        item.phone || ""
      }`,
      coordinate: {
        latitude: parseFloat(item.y),
        longitude: parseFloat(item.x),
      },
    }));
  } catch (error) {
    console.error("주변 검색 API 오류:", error);
    throw error;
  }
};
