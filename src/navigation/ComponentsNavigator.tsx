import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Types
import { ComponentsStackParamList } from "../types";

// Screens
import ComponentsScreen from "../screens/NativeComponents/ComponentsScreen";
import TextComponent from "../screens/NativeComponents/TextComponent";
import ButtonComponent from "../screens/NativeComponents/ButtonComponent";
import TextInputComponent from "../screens/NativeComponents/TextInputComponent";
import ImageComponent from "../screens/NativeComponents/ImageComponent";
import ScrollViewComponent from "../screens/NativeComponents/ScrollViewComponent";
import FlatListComponent from "../screens/NativeComponents/FlatListComponent";
import SectionListComponent from "../screens/NativeComponents/SectionListComponent";
import ModalComponent from "../screens/NativeComponents/ModalComponent";
import ActivityIndicatorComponent from "../screens/NativeComponents/ActivityIndicatorComponent";
import TouchableOpacityComponent from "../screens/NativeComponents/TouchableOpacityComponent";
import KeyboardAvoidingViewComponent from "../screens/NativeComponents/KeyboardAvoidingViewComponent";
import TouchableWithoutFeedbackComponent from "../screens/NativeComponents/TouchableWithoutFeedbackComponent";
import TouchableHighlightComponent from "../screens/NativeComponents/TouchableHighlightComponent";
import PressableComponent from "../screens/NativeComponents/PressableComponent";
import StatusBarComponent from "../screens/NativeComponents/StatusBarComponent";

// Styles
import { darkColors } from "../styles/colors";

const Stack = createNativeStackNavigator<ComponentsStackParamList>();

/**
 * 네이티브 컴포넌트 스택 네비게이터
 * 다양한 React Native 컴포넌트 예제 화면들을 관리합니다.
 */
const ComponentsNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: darkColors.primary,
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      <Stack.Screen
        name="ComponentsMain"
        component={ComponentsScreen}
        options={{ title: "Components" }}
      />
      <Stack.Screen
        name="TextComponent"
        component={TextComponent}
        options={{ title: "Text" }}
      />
      <Stack.Screen
        name="ButtonComponent"
        component={ButtonComponent}
        options={{ title: "Button" }}
      />
      <Stack.Screen
        name="TextInputComponent"
        component={TextInputComponent}
        options={{ title: "TextInput" }}
      />
      <Stack.Screen
        name="ImageComponent"
        component={ImageComponent}
        options={{ title: "Image" }}
      />
      <Stack.Screen
        name="ScrollViewComponent"
        component={ScrollViewComponent}
        options={{ title: "ScrollView" }}
      />
      <Stack.Screen
        name="FlatListComponent"
        component={FlatListComponent}
        options={{ title: "FlatList" }}
      />
      <Stack.Screen
        name="SectionListComponent"
        component={SectionListComponent}
        options={{ title: "SectionList" }}
      />
      <Stack.Screen
        name="ModalComponent"
        component={ModalComponent}
        options={{ title: "Modal" }}
      />
      <Stack.Screen
        name="ActivityIndicatorComponent"
        component={ActivityIndicatorComponent}
        options={{ title: "ActivityIndicator" }}
      />
      <Stack.Screen
        name="TouchableOpacityComponent"
        component={TouchableOpacityComponent}
        options={{ title: "TouchableOpacity" }}
      />
      <Stack.Screen
        name="KeyboardAvoidingViewComponent"
        component={KeyboardAvoidingViewComponent}
        options={{ title: "KeyboardAvoidingView" }}
      />
      <Stack.Screen
        name="TouchableWithoutFeedbackComponent"
        component={TouchableWithoutFeedbackComponent}
        options={{ title: "TouchableWithoutFeedback" }}
      />
      <Stack.Screen
        name="TouchableHighlightComponent"
        component={TouchableHighlightComponent}
        options={{ title: "TouchableHighlight" }}
      />
      <Stack.Screen
        name="PressableComponent"
        component={PressableComponent}
        options={{ title: "Pressable" }}
      />
      <Stack.Screen
        name="StatusBarComponent"
        component={StatusBarComponent}
        options={{ title: "StatusBar" }}
      />
    </Stack.Navigator>
  );
};

export default ComponentsNavigator;
