import React, { createContext, useState, useContext, useEffect } from "react";
import { useColorScheme } from "react-native";
import { colors } from "../styles/colors";
import { ThemeColors } from "../styles/colors";

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * 앱의 테마 제공자 컴포넌트
 * 다크모드/라이트모드 전환 및 테마 색상을 관리합니다.
 */
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // 시스템 설정 확인하여 초기 모드 결정
  const colorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(colorScheme === "dark");

  // 시스템 색상 스키마가 변경될 때 자동으로 테마 변경
  useEffect(() => {
    setIsDarkMode(colorScheme === "dark");
  }, [colorScheme]);

  // 테마 토글 함수
  const toggleTheme = () => {
    setIsDarkMode((prevMode) => !prevMode);
  };

  // 컨텍스트 값
  const contextValue: ThemeContextType = {
    isDarkMode,
    toggleTheme,
    colors: colors,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * 테마 컨텍스트를 사용하기 위한 커스텀 훅
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error("useTheme은 ThemeProvider 내부에서 사용해야 합니다");
  }

  return context;
};
