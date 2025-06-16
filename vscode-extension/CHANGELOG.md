# Change Log

HAPA (Hancom AI Python Assistant) VSCode Extension의 모든 주요 변경사항이 이 파일에 기록됩니다.

[Keep a Changelog](http://keepachangelog.com/) 형식을 따릅니다.

## [0.4.0] - 2025-01-06

### Added

- 🎯 HAPA 코어 기능 구현
  - 코드 분석 기능
  - 테스트 생성 기능
  - 코드 설명 기능
- 🎨 VSCode 사이드바 통합
  - 대시보드 웹뷰
  - 가이드 웹뷰
  - 설정 웹뷰
- ⌨️ 컨텍스트 메뉴 통합
  - 선택 영역 분석
  - 선택 영역 테스트 생성
  - 선택 영역 설명
- 🔧 설정 시스템
  - 코드 분석 활성화/비활성화
  - 테마 설정 (light/dark/system)
- 📦 모듈 시스템
  - API 클라이언트 모듈
  - 프롬프트 추출기
  - 트리거 감지기
  - 코드 삽입기
- 🌐 외부 연동
  - 웹사이트 연결
  - 문서 링크

### Technical

- TypeScript 기반 개발
- VS Code API 1.80.0+ 호환
- Axios HTTP 클라이언트 통합
- 웹뷰 기반 UI 구현

### Initial Release

- HAPA VSCode Extension의 첫 번째 공식 릴리스
