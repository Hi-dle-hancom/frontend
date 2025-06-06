import { create } from "zustand";
import { MapMarker } from "@/components/Map/types";
import { RoutePoint, RouteResponse, NearbyStation } from "@/services/api";

// 지도 관련 상태 인터페이스
interface MapState {
  // 현재 위치
  currentLocation: {
    latitude: number;
    longitude: number;
  } | null;

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
  isBikeStationsLoading: boolean;

  // 지도 상태
  mapCenter: {
    latitude: number;
    longitude: number;
  } | null;
  mapZoomLevel: number;

  // 오류 처리
  error: string | null;
}

// 액션 인터페이스
interface MapActions {
  // 현재 위치 관련
  setCurrentLocation: (
    location: { latitude: number; longitude: number } | null
  ) => void;

  // 검색 관련
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: MapMarker[]) => void;
  setIsSearchLoading: (loading: boolean) => void;

  // 경로 관련
  setRouteData: (data: RoutePoint[]) => void;
  setRouteInfo: (info: RouteResponse | null) => void;
  setIsRouteLoading: (loading: boolean) => void;
  setSelectedDestination: (destination: MapMarker | null) => void;
  clearRoute: () => void;

  // 자전거 대여소 관련
  setBikeStations: (stations: NearbyStation[]) => void;
  setIsBikeStationsLoading: (loading: boolean) => void;

  // 지도 상태 관련
  setMapCenter: (
    center: { latitude: number; longitude: number } | null
  ) => void;
  setMapZoomLevel: (level: number) => void;

  // 오류 처리
  setError: (error: string | null) => void;
  clearError: () => void;

  // 전체 초기화
  resetMapState: () => void;
}

// 초기 상태
const initialState: MapState = {
  currentLocation: null,
  searchQuery: "",
  searchResults: [],
  isSearchLoading: false,
  routeData: [],
  routeInfo: null,
  isRouteLoading: false,
  selectedDestination: null,
  bikeStations: [],
  isBikeStationsLoading: false,
  mapCenter: null,
  mapZoomLevel: 3,
  error: null,
};

// Zustand 스토어 생성
export const useMapStore = create<MapState & MapActions>((set, get) => ({
  // 초기 상태
  ...initialState,

  // 현재 위치 관련 액션
  setCurrentLocation: (location) => set({ currentLocation: location }),

  // 검색 관련 액션
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSearchResults: (results) => set({ searchResults: results }),
  setIsSearchLoading: (loading) => set({ isSearchLoading: loading }),

  // 경로 관련 액션
  setRouteData: (data) => set({ routeData: data }),
  setRouteInfo: (info) => set({ routeInfo: info }),
  setIsRouteLoading: (loading) => set({ isRouteLoading: loading }),
  setSelectedDestination: (destination) =>
    set({ selectedDestination: destination }),

  clearRoute: () =>
    set({
      routeData: [],
      routeInfo: null,
      selectedDestination: null,
      error: null,
    }),

  // 자전거 대여소 관련 액션
  setBikeStations: (stations) => set({ bikeStations: stations }),
  setIsBikeStationsLoading: (loading) =>
    set({ isBikeStationsLoading: loading }),

  // 지도 상태 관련 액션
  setMapCenter: (center) => set({ mapCenter: center }),
  setMapZoomLevel: (level) => set({ mapZoomLevel: level }),

  // 오류 처리 액션
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  // 전체 초기화
  resetMapState: () => set(initialState),
}));

// 🔄 개별 상태 선택자 함수들 (무한 리렌더링 방지)
export const useCurrentLocation = () =>
  useMapStore((state) => state.currentLocation);

// 검색 관련 개별 선택자들
export const useSearchQuery = () => useMapStore((state) => state.searchQuery);
export const useSearchResults = () =>
  useMapStore((state) => state.searchResults);
export const useIsSearchLoading = () =>
  useMapStore((state) => state.isSearchLoading);

// 경로 관련 개별 선택자들
export const useRouteData = () => useMapStore((state) => state.routeData);
export const useRouteInfo = () => useMapStore((state) => state.routeInfo);
export const useIsRouteLoading = () =>
  useMapStore((state) => state.isRouteLoading);
export const useSelectedDestination = () =>
  useMapStore((state) => state.selectedDestination);

// 자전거 대여소 관련 개별 선택자들
export const useBikeStations = () => useMapStore((state) => state.bikeStations);
export const useIsBikeStationsLoading = () =>
  useMapStore((state) => state.isBikeStationsLoading);

// 에러 선택자
export const useMapError = () => useMapStore((state) => state.error);

// 🔄 개별 액션 선택자들 (필요한 액션만 선택적으로 사용)
export const useSetCurrentLocation = () =>
  useMapStore((state) => state.setCurrentLocation);
export const useSetSearchQuery = () =>
  useMapStore((state) => state.setSearchQuery);
export const useSetSearchResults = () =>
  useMapStore((state) => state.setSearchResults);
export const useSetIsSearchLoading = () =>
  useMapStore((state) => state.setIsSearchLoading);
export const useSetRouteData = () => useMapStore((state) => state.setRouteData);
export const useSetRouteInfo = () => useMapStore((state) => state.setRouteInfo);
export const useSetIsRouteLoading = () =>
  useMapStore((state) => state.setIsRouteLoading);
export const useSetSelectedDestination = () =>
  useMapStore((state) => state.setSelectedDestination);
export const useClearRoute = () => useMapStore((state) => state.clearRoute);
export const useSetError = () => useMapStore((state) => state.setError);
export const useClearError = () => useMapStore((state) => state.clearError);
