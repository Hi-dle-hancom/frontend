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
import { StateManagementScreenNavigationProp } from "../../types";

// Styles
import { colors } from "../../styles/colors";
import { commonStyles } from "../../styles/common";

/**
 * 상태 관리 목록 화면
 * 다양한 상태 관리 기법 및 훅 예제 화면으로 이동할 수 있는 메뉴를 제공합니다.
 */
const StateManagementScreen: React.FC = () => {
  const navigation = useNavigation<StateManagementScreenNavigationProp>();

  // 상태 관리 기법 목록 데이터
  const stateManagementTypes = [
    {
      title: "React Hooks",
      items: [
        { name: "useState", icon: "flash-outline", screen: "UseStateExample" },
        {
          name: "useEffect",
          icon: "refresh-outline",
          screen: "UseEffectExample",
        },
        {
          name: "useContext",
          icon: "link-outline",
          screen: "UseContextExample",
        },
        {
          name: "useCallback",
          icon: "repeat-outline",
          screen: "UseCallbackExample",
        },
        {
          name: "useImperativeHandle",
          icon: "code-outline",
          screen: "UseImperativeHandleExample",
        },
        {
          name: "useLayoutEffect",
          icon: "layers-outline",
          screen: "UseLayoutEffectExample",
        },
        {
          name: "useMemo",
          icon: "hardware-chip-outline",
          screen: "UseMemoExample",
        },
        {
          name: "useReducer",
          icon: "git-compare-outline",
          screen: "UseReducerExample",
        },
        { name: "useRef", icon: "bookmark-outline", screen: "UseRefExample" },
      ],
    },
    {
      title: "외부 상태 관리",
      items: [
        { name: "Redux", icon: "globe-outline", screen: "ReduxExample" },
        {
          name: "Context API",
          icon: "cloud-outline",
          screen: "ContextAPIExample",
        },
      ],
    },
    {
      title: "기타 예제",
      items: [
        {
          name: "Swiper",
          icon: "swap-horizontal-outline",
          screen: "SwiperExample",
        },
      ],
    },
  ];

  return (
    <View style={commonStyles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={commonStyles.section}>
          <Text style={commonStyles.sectionTitle}>상태 관리</Text>
          <Text style={styles.description}>
            React Native 애플리케이션의 다양한 상태 관리 방법을 소개합니다. 각
            메뉴를 터치하여 자세한 예제와 사용법을 확인하세요.
          </Text>
        </View>

        {stateManagementTypes.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>

            {section.items.map((item, itemIndex) => (
              <TouchableOpacity
                key={itemIndex}
                style={styles.menuItem}
                onPress={() => navigation.navigate(item.screen as any)}
                activeOpacity={0.7}
              >
                <View style={styles.iconContainer}>
                  <Ionicons name={item.icon} size={24} color={colors.text} />
                </View>
                <Text style={styles.menuName}>{item.name}</Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.text}
                />
              </TouchableOpacity>
            ))}
          </View>
        ))}
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
  section: {
    backgroundColor: colors.card,
    borderRadius: 8,
    marginHorizontal: 15,
    marginTop: 15,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 10,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.secondary,
    padding: 12,
    marginVertical: 5,
    borderRadius: 6,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  menuName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: colors.text,
  },
});

export default StateManagementScreen;
