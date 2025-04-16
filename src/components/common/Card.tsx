import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from "react-native";
import { colors } from "../../styles/colors";

interface CardProps {
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
}

// 스타일 인터페이스 정의
interface CardStyles {
  container: ViewStyle;
  title: TextStyle;
  contentWithTitle: ViewStyle;
  contentWithoutTitle: ViewStyle;
  footer: ViewStyle;
}

const Card: React.FC<CardProps> = ({
  title,
  children,
  footer,
  onPress,
  style,
}) => {
  const CardContainer = onPress ? TouchableOpacity : View;

  return (
    <CardContainer
      style={[styles.container, style]}
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
    >
      {title && <Text style={styles.title}>{title}</Text>}
      <View
        style={title ? styles.contentWithTitle : styles.contentWithoutTitle}
      >
        {children}
      </View>
      {footer && <View style={styles.footer}>{footer}</View>}
    </CardContainer>
  );
};

const styles = StyleSheet.create<CardStyles>({
  container: {
    backgroundColor: colors.card,
    borderRadius: 8,
    overflow: "hidden",
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    padding: 16,
    paddingBottom: 8,
  },
  contentWithTitle: {
    padding: 8,
    paddingTop: 8,
  },
  contentWithoutTitle: {
    padding: 16,
    paddingTop: 16,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: 12,
  },
});

export default Card;
