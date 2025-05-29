import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { ErrorBoundary } from "@/utils/ErrorBoundary";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Alert } from "react-native";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  // 에러 발생 시 처리
  const handleError = (error: Error) => {
    // 실제 앱에서는 에러 로깅 서비스로 전송
    console.error("앱 에러:", error);

    // 사용자에게 알림
    Alert.alert(
      "오류 발생",
      "앱에 문제가 발생했습니다. 계속해서 문제가 발생하면 앱을 재시작해주세요.",
      [{ text: "확인" }]
    );
  };

  return (
    <ErrorBoundary onError={handleError}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </ErrorBoundary>
  );
}
