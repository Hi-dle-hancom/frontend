# 뚜따 앱 프론트엔드

이 폴더는 뚜따 앱의 프론트엔드 코드를 포함하고 있습니다. React Native와 Expo를 사용하여 개발되었습니다.

## 시작하기

1. 의존성 설치

```bash
npm install
```

2. 앱 실행

```bash
npx expo start
```

실행 후 출력에서 다음 옵션을 확인할 수 있습니다:

- [개발 빌드](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android 에뮬레이터](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS 시뮬레이터](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go)

## 프로젝트 구조

- `app/`: 앱의 메인 화면들이 있는 폴더 (Expo Router 사용)
- `components/`: 재사용 가능한 컴포넌트들
- `assets/`: 이미지, 폰트 등의 정적 파일들
- `constants/`: 상수 값들
- `hooks/`: 커스텀 React 훅

## 참고 자료

- [Expo 문서](https://docs.expo.dev/)
- [Expo Router 문서](https://docs.expo.dev/router/introduction/)

