// src/api/index.ts

import axios from 'axios';
import { StationInfo, RouteRequest, RouteResponse } from '../types';

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1'; // TODO: 실제 백엔드 서버 주소로 변경 필요 (개발 시 로컬 백엔드 주소)

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 1. 실시간 타슈 대여소 현황 조회 API 호출 함수 뼈대
export const getTashuStations = async (): Promise<StationInfo[]> => {
  try {
    console.log('API 호출: getTashuStations (더미 데이터 사용)');
    // TODO: 실제 백엔드 API 엔드포인트 '/tashu/stations'로 GET 요청 보내는 로직 구현
    // const response = await api.get('/tashu/stations');
    // return response.data;

    // 임시 더미 데이터 반환 (실제 구현 시 삭제)
    const dummyStations: StationInfo[] = [
      {
        id: 'STATION_ID_1',
        name: '대전역 더미',
        latitude: 36.32687 + (Math.random() - 0.5) * 0.01,
        longitude: 127.43247 + (Math.random() - 0.5) * 0.01,
        available_bikes: Math.floor(Math.random() * 10),
        available_parking: Math.floor(Math.random() * 10),
      },
      {
        id: 'STATION_ID_2',
        name: '시청역 더미',
        latitude: 36.35181 + (Math.random() - 0.5) * 0.01,
        longitude: 127.38503 + (Math.random() - 0.5) * 0.01,
        available_bikes: Math.floor(Math.random() * 10),
        available_parking: Math.floor(Math.random() * 10),
      },
      {
        id: 'STATION_ID_3',
        name: '궁동 더미',
        latitude: 36.3647 + (Math.random() - 0.5) * 0.01,
        longitude: 127.345 + (Math.random() - 0.5) * 0.01,
        available_bikes: Math.floor(Math.random() * 10),
        available_parking: Math.floor(Math.random() * 10),
      },
    ];
    return new Promise(resolve => setTimeout(() => resolve(dummyStations), 500)); // 비동기 흉내
  } catch (error) {
    console.error('Failed to fetch tashu stations:', error);
    throw error;
  }
};

// 2. 자전거/도보 연계 경로 추천 API 호출 함수 뼈대
export const recommendRoute = async (requestData: RouteRequest): Promise<RouteResponse> => {
  try {
    console.log('API 호출: recommendRoute (더미 데이터 사용)', requestData);
    // TODO: 실제 백엔드 API 엔드포인트 '/routes/recommend'로 POST 요청 보내는 로직 구현
    // const response = await api.post('/routes/recommend', requestData);
    // return response.data;

    // 임시 더미 데이터 반환 (실제 구현 시 삭제)
    const dummyRouteResponse: RouteResponse = {
      route: [
        {
          latitude: requestData.origin.latitude,
          longitude: requestData.origin.longitude,
          segment_type: 'bike',
          instruction: '출발',
          distance_from_start: 0.0,
        },
        {
          latitude: requestData.origin.latitude + 0.01,
          longitude: requestData.origin.longitude + 0.01,
          segment_type: 'bike',
          instruction: '직진',
          distance_from_start: 1.0,
        },
        {
          latitude: requestData.origin.latitude + 0.02,
          longitude: requestData.origin.longitude + 0.005,
          segment_type: 'walk',
          instruction: '자전거 반납 후 도보 이동',
          distance_from_start: 2.0,
        },
        {
          latitude: requestData.destination.latitude,
          longitude: requestData.destination.longitude,
          segment_type: 'walk',
          instruction: '목적지 도착',
          distance_from_start: 2.5,
        },
      ],
      warnings: [
        {
          latitude: (requestData.origin.latitude + requestData.destination.latitude) / 2,
          longitude: (requestData.origin.longitude + requestData.destination.longitude) / 2,
          type: 'accident',
          message: '주의! 이 구간 사고 다발 지역입니다.',
          radius_meters: 100,
        },
      ],
      total_distance_km: 2.5,
      total_time_minutes: 15,
    };
    return new Promise(resolve => setTimeout(() => resolve(dummyRouteResponse), 1000)); // 비동기 흉내
  } catch (error) {
    console.error('Failed to recommend route:', error);
    throw error;
  }
};

// TODO: 필요한 다른 API 호출 함수들 추가
// export const getCourseDetail = async (courseId: string): Promise<CourseDetail> => { ... };
