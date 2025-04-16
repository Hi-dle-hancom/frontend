import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Ionicons from "react-native-vector-icons/Ionicons";

// Types
import { ComponentsScreenNavigationProp } from "../../types";

// Styles
import { colors } from "../../styles/colors";
import { commonStyles } from "../../styles/common";

/**
 * 네이티브 컴포넌트 목록 화면
 * 다양한 React Native 컴포넌트 예제 화면으로 이동할 수 있는 메뉴를 제공합니다.
 */
const ComponentsScreen: React.FC = () => {
  const navigation = useNavigation<ComponentsScreenNavigationProp>();

  // 컴포넌트 목록 데이터
  const components = [
    { name: "Text", icon: "text", screen: "TextComponent" },
    { name: "Button", icon: "radio-button-on", screen: "ButtonComponent" },
    { name: "TextInput", icon: "create-outline", screen: "TextInputComponent" },
    { name: "Image", icon: "image-outline", screen: "ImageComponent" },
    { name: "ScrollView", icon: "list-outline", screen: "ScrollViewComponent" },
    { name: "FlatList", icon: "list", screen: "FlatListComponent" },
    {
      name: "SectionList",
      icon: "list-circle-outline",
      screen: "SectionListComponent",
    },
    { name: "Modal", icon: "albums-outline", screen: "ModalComponent" },
    {
      name: "ActivityIndicator",
      icon: "reload-outline",
      screen: "ActivityIndicatorComponent",
    },
    {
      name: "TouchableOpacity",
      icon: "finger-print-outline",
      screen: "TouchableOpacityComponent",
    },
    {
      name: "KeyboardAvoidingView",
      icon: "keypad-outline",
      screen: "KeyboardAvoidingViewComponent",
    },
    {
      name: "TouchableWithoutFeedback",
      icon: "hand-left-outline",
      screen: "TouchableWithoutFeedbackComponent",
    },
    {
      name: "TouchableHighlight",
      icon: "hand-right-outline",
      screen: "TouchableHighlightComponent",
    },
    { name: "Pressable", icon: "finger-print", screen: "PressableComponent" },
    {
      name: "StatusBar",
      icon: "phone-portrait-outline",
      screen: "StatusBarComponent",
    },
  ];

  return (
    <View style={commonStyles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={commonStyles.section}>
          <Text style={commonStyles.sectionTitle}>네이티브 컴포넌트</Text>
          <Text style={styles.description}>
            React Native의 기본 UI 컴포넌트들을 소개합니다. 각 컴포넌트를
            터치하여 자세한 예제와 사용법을 확인하세요.
          </Text>
        </View>

        <View style={styles.componentList}>
          {components.map((component, index) => (
            <TouchableOpacity
              key={index}
              style={styles.componentItem}
              onPress={() => navigation.navigate(component.screen as any)}
              activeOpacity={0.7}
            >
              <View style={styles.iconContainer}>
                <Ionicons name={component.icon} size={24} color={colors.text} />
              </View>
              <Text style={styles.componentName}>{component.name}</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.text} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    paddingBottom: 20,
  },
  description: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 5,
  },
  componentList: {
    marginHorizontal: 15,
  },
  componentItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    padding: 16,
    marginVertical: 5,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  componentName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: colors.text,
  },
});

export default ComponentsScreen;
