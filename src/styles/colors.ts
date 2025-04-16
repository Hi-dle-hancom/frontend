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

export const colors: ThemeColors = {
  primary: "#101010",
  secondary: "#242423",
  background: "#101010",
  card: "#242423",
  text: "#eee",
  border: "#808080",
  notification: "#808080",
  error: "#ff6b6b",
  success: "#51cf66",
  warning: "#fcc419",
  info: "#339af0",
};
