import axios, { AxiosInstance, AxiosResponse } from "axios";
import { MapMarker } from "@/components/Map/types";
import { API_BASE_URL } from "@/constants/Config";

// Axios 인스턴스 생성
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30초 타임아웃
  headers: {
    "Content-Type": "application/json",
  },
});

// 요청 인터셉터
apiClient.interceptors.request.use(
  (config) => {
    console.log(`🚀 API 요청: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error("❌ 요청 오류:", error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`✅ API 응답: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error("❌ 응답 오류:", error.response?.status, error.message);
    return Promise.reject(error);
  }
);

// 타입 정의
export interface RouteRequest {
  start_lat: number;
  start_lng: number;
  end_lat: number;
  end_lng: number;
  preferences?: {
    prioritize_safety?: boolean;
    avoid_hills?: boolean;
    [key: string]: any;
  };
}

export interface RoutePoint {
  lat: number;
  lng: number;
}

export interface RouteInstruction {
  step: number;
  type: string;
  description: string;
  distance: number;
  duration: number;
  coordinate: RoutePoint;
  station_info?: {
    station_id: string;
    available_bikes?: number;
    total_docks?: number;
    available_docks?: number;
  };
}

export interface NearbyStation {
  station_id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  available_bikes: number;
  total_docks: number;
  distance_from_start: number;
  distance_from_end: number;
  location_type: string;
  location_description: string;
  last_updated: string;
}

export interface RouteSummary {
  distance: number;
  duration: number;
  elevation_gain: number;
  safety_score: number;
  confidence_score: number;
  algorithm_version: string;
  bike_stations: number;
}

export interface RouteResponse {
  route_id: string | null;
  summary: RouteSummary;
  route_points: RoutePoint[];
  instructions: RouteInstruction[];
  nearby_stations: NearbyStation[];
  metadata: {
    generated_at: string;
    preferences: Record<string, any>;
    process_time: number;
  };
}

// API 함수들

/**
 * 백엔드에서 AI 기반 자전거 경로 계산
 */
export const getRoute = async (
  request: RouteRequest
): Promise<RouteResponse> => {
  try {
    const response = await apiClient.post<RouteResponse>(
      "/api/find-path",
      request
    );
    return response.data;
  } catch (error) {
    console.error("경로 계산 API 오류:", error);
    throw new Error("경로를 계산하는데 실패했습니다. 다시 시도해주세요.");
  }
};

/**
 * 서버 상태 확인
 */
export const checkServerHealth = async (): Promise<{
  status: string;
  message: string;
}> => {
  try {
    const response = await apiClient.get("/api/health");
    return response.data;
  } catch (error) {
    console.error("서버 상태 확인 오류:", error);
    throw new Error("서버에 연결할 수 없습니다.");
  }
};

/**
 * 자전거 대여소 정보 조회
 */
export const getBikeStations = async (): Promise<NearbyStation[]> => {
  try {
    const response = await apiClient.get("/api/bike-stations");
    return response.data;
  } catch (error) {
    console.error("자전거 대여소 조회 오류:", error);
    throw new Error("자전거 대여소 정보를 가져오는데 실패했습니다.");
  }
};

/**
 * 특정 대여소 상태 조회
 */
export const getBikeStationStatus = async (stationId: string) => {
  try {
    const response = await apiClient.get(`/api/bike-stations/${stationId}`);
    return response.data;
  } catch (error) {
    console.error("대여소 상태 조회 오류:", error);
    throw new Error("대여소 상태를 가져오는데 실패했습니다.");
  }
};

/**
 * 자전거 도로 정보 조회
 */
export const getBikePaths = async (
  lat: number,
  lng: number,
  radius: number = 2000
) => {
  try {
    const response = await apiClient.get("/api/bike-paths", {
      params: { lat, lng, radius },
    });
    return response.data;
  } catch (error) {
    console.error("자전거 도로 조회 오류:", error);
    throw new Error("자전거 도로 정보를 가져오는데 실패했습니다.");
  }
};

/**
 * 장소 검색 (기존 카카오 API 기반)
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
    let searchUrl = `/api/search?query=${encodeURIComponent(query)}`;

    if (options) {
      const params = new URLSearchParams();
      if (options.x !== undefined)
        params.append("lat", options.y?.toString() || "");
      if (options.y !== undefined)
        params.append("lng", options.x?.toString() || "");
      if (options.radius !== undefined)
        params.append("radius", options.radius.toString());
      if (options.page !== undefined)
        params.append("page", options.page.toString());
      if (options.size !== undefined)
        params.append("size", options.size.toString());

      const paramString = params.toString();
      if (paramString) {
        searchUrl += `&${paramString}`;
      }
    }

    const response = await apiClient.get(searchUrl);

    // 응답 데이터를 MapMarker 형태로 변환
    const places = response.data;

    return places.map((place: any, index: number) => ({
      id: place.id || `place_${index}`,
      title: place.place_name || place.title || "장소명 없음",
      description: [
        place.address_name || place.road_address_name,
        place.phone || place.category_name,
      ]
        .filter(Boolean)
        .join("\n"),
      coordinate: {
        latitude: parseFloat(place.y || place.lat),
        longitude: parseFloat(place.x || place.lng),
      },
    }));
  } catch (error) {
    console.error("장소 검색 오류:", error);
    throw new Error("장소 검색에 실패했습니다.");
  }
};

/**
 * 주소 기반 장소 검색
 */
export const searchPlacesByAddress = async (
  address: string
): Promise<MapMarker[]> => {
  try {
    const response = await apiClient.get(
      `/api/search?query=${encodeURIComponent(address)}`
    );
    const places = response.data;

    return places.map((place: any, index: number) => ({
      id: place.id || `address_${index}`,
      title: place.place_name || place.address_name || "주소",
      description: place.address_name || place.road_address_name || "",
      coordinate: {
        latitude: parseFloat(place.y || place.lat),
        longitude: parseFloat(place.x || place.lng),
      },
    }));
  } catch (error) {
    console.error("주소 검색 오류:", error);
    throw new Error("주소 검색에 실패했습니다.");
  }
};

/**
 * 주변 장소 검색
 */
export const searchNearbyPlaces = async (
  category: string,
  latitude: number,
  longitude: number,
  radius: number = 1000
): Promise<MapMarker[]> => {
  try {
    const response = await apiClient.get("/api/search", {
      params: {
        query: category,
        lat: latitude,
        lng: longitude,
        radius: radius,
      },
    });

    const places = response.data;

    return places.map((place: any, index: number) => ({
      id: place.id || `nearby_${index}`,
      title: place.place_name || place.title || "장소명 없음",
      description: [
        place.address_name || place.road_address_name,
        place.phone || place.category_name,
      ]
        .filter(Boolean)
        .join("\n"),
      coordinate: {
        latitude: parseFloat(place.y || place.lat),
        longitude: parseFloat(place.x || place.lng),
      },
    }));
  } catch (error) {
    console.error("주변 장소 검색 오류:", error);
    throw new Error("주변 장소 검색에 실패했습니다.");
  }
};

// API 클라이언트 인스턴스 export (필요시 직접 사용 가능)
export { apiClient };

// 기본 export
export default {
  getRoute,
  checkServerHealth,
  getBikeStations,
  getBikeStationStatus,
  getBikePaths,
  searchPlacesByKeyword,
  searchPlacesByAddress,
  searchNearbyPlaces,
};
