import { StyleSheet, TextStyle, ViewStyle } from "react-native";
import { colors } from "./colors";

// TypeScript 인터페이스로 스타일 타입 정의
interface CommonStyles {
  container: ViewStyle;
  section: ViewStyle;
  sectionTitle: TextStyle;
  button: ViewStyle;
  buttonText: TextStyle;
  input: ViewStyle;
  card: ViewStyle;
  row: ViewStyle;
  centerContent: ViewStyle;
  spaceBetween: ViewStyle;
  shadow: ViewStyle;
}

export const commonStyles = StyleSheet.create<CommonStyles>({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  section: {
    marginVertical: 10,
    marginHorizontal: 15,
    padding: 15,
    backgroundColor: colors.card,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 10,
  },
  button: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
    marginVertical: 8,
  },
  buttonText: {
    color: "#eee",
    fontWeight: "bold",
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: 10,
    marginVertical: 8,
    backgroundColor: colors.card,
    color: colors.text,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  spaceBetween: {
    justifyContent: "space-between",
  },
  shadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
});
