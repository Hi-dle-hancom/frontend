import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { colors } from "../../styles/colors";

interface ButtonProps {
  title: string;
  onPress: () => void;
  type?: "primary" | "secondary" | "outline";
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  type = "primary",
  disabled = false,
  loading = false,
  fullWidth = false,
}) => {
  // 버튼 타입에 따른 스타일 결정
  const buttonStyle = [
    styles.button,
    type === "primary" && styles.primaryButton,
    type === "secondary" && styles.secondaryButton,
    type === "outline" && styles.outlineButton,
    disabled && styles.disabledButton,
    fullWidth && styles.fullWidth,
  ];

  // 텍스트 타입에 따른 스타일 결정
  const textStyle = [
    styles.text,
    type === "primary" && styles.primaryText,
    type === "secondary" && styles.secondaryText,
    type === "outline" && styles.outlineText,
    disabled && styles.disabledText,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={type === "outline" ? colors.primary : colors.text}
        />
      ) : (
        <Text style={textStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 8,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.secondary,
  },
  outlineButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.primary,
  },
  disabledButton: {
    backgroundColor: "#ccc",
    opacity: 0.7,
  },
  fullWidth: {
    width: "100%",
  },
  text: {
    fontSize: 16,
    fontWeight: "bold",
  },
  primaryText: {
    color: colors.text,
  },
  secondaryText: {
    color: colors.text,
  },
  outlineText: {
    color: colors.primary,
  },
  disabledText: {
    color: "#888",
  },
});

export default Button;
