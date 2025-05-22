// src/types/index.ts

// 백엔드 API 명세서에 정의된 데이터 구조를 바탕으로 작성
export interface StationInfo {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    available_bikes: number;
    available_parking: number;
  }
  
  export interface Location {
    latitude: number;
    longitude: number;
  }
  
  export interface RouteOptions {
    max_distance_km?: number;
    max_time_minutes?: number;
    avoid_difficult?: boolean;
    // TODO: 날씨, 계절 등 추가 필터링 옵션 타입 정의
  }
  
  export interface RouteRequest {
    origin: Location;
    destination: Location;
    options?: RouteOptions;
  }
  
  export interface RoutePoint {
    latitude: number;
    longitude: number;
    segment_type: 'bike' | 'walk';
    instruction: string;
    distance_from_start: number;
  }
  
  export interface HandoverPoint {
     latitude: number;
     longitude: number;
     type: 'bike_to_walk' | 'walk_to_bike';
     description: string;
     related_station_id?: string;
  }
  
   export interface Warning {
     latitude: number;
     longitude: number;
     type: string; // TODO: 구체적인 타입('accident', 'weather' 등)으로 정의
     message: string;
     radius_meters: number;
   }
  
  
  export interface RouteResponse {
    route: RoutePoint[];
    handover_points?: HandoverPoint[];
    warnings?: Warning[];
    total_distance_km: number;
    total_time_minutes: number;
     // TODO: 기타 필요한 정보 타입 추가
  }
  
  // TODO: Navigation 관련 타입은 src/types/navigation.ts 에 따로 정의하고 임포트해도 좋음
  // export * from './navigation';
  