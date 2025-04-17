// Theme colors with TypeScript interface
export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  card: string;
  text: string;
  border: string;
  notification: string;
  error: string;
  success: string;
  warning: string;
  info: string;
}

// 라이트 모드 색상
export const lightColors: ThemeColors = {
  primary: "#3498db",
  secondary: "#f8f9fa",
  background: "#ffffff",
  card: "#f8f9fa",
  text: "#212529",
  border: "#dee2e6",
  notification: "#495057",
  error: "#e74c3c",
  success: "#2ecc71",
  warning: "#f39c12",
  info: "#3498db",
};

// 다크 모드 색상
export const darkColors: ThemeColors = {
  primary: "#101010",
  secondary: "#242423",
  background: "#121212",
  card: "#242423",
  text: "#eee",
  border: "#808080",
  notification: "#808080",
  error: "#ff6b6b",
  success: "#51cf66",
  warning: "#fcc419",
  info: "#339af0",
};

// 기본 내보내기 (이전 코드와의 호환성을 위해)
export const colors = darkColors;
