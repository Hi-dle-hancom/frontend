// 환경별 설정 값을 관리하는 설정 파일

// API 기본 URL
export const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8000";

// 개발 환경에서 실제 기기 테스트를 위한 설정
// 시뮬레이터/에뮬레이터가 아닌 실제 기기에서 테스트할 때는 아래 URL을 주석 해제하고
// 개발 컴퓨터의 로컬 IP 주소로 수정하세요
// export const API_BASE_URL = 'http://192.168.0.x:8000';

// 카카오맵 API 키
export const KAKAO_MAP_API_KEY = "5fd93db4631259c8576b6ce26b8fc125";

// 앱 설정
export const APP_CONFIG = {
  // 디버그 모드 활성화 여부
  DEBUG: process.env.NODE_ENV === "development",

  // 지도 초기 위치 (대한민국 서울특별시청)
  DEFAULT_LOCATION: {
    latitude: 37.5662,
    longitude: 126.9784,
  },

  // 검색 설정
  SEARCH: {
    RADIUS: 5000, // 기본 검색 반경 (미터)
    MAX_RESULTS: 15, // 최대 결과 수
  },
};
