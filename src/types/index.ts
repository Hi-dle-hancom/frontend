import React from "react";
import { StackNavigationProp } from "@react-navigation/stack";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { CompositeNavigationProp, RouteProp } from "@react-navigation/native";

// 네비게이션 파라미터 타입 정의
export type ComponentsStackParamList = {
  ComponentsMain: undefined;
  TextComponent: undefined;
  ButtonComponent: undefined;
  TextInputComponent: undefined;
  ImageComponent: undefined;
  ScrollViewComponent: undefined;
  FlatListComponent: undefined;
  SectionListComponent: undefined;
  ModalComponent: undefined;
  ActivityIndicatorComponent: undefined;
  TouchableOpacityComponent: undefined;
  KeyboardAvoidingViewComponent: undefined;
  TouchableWithoutFeedbackComponent: undefined;
  TouchableHighlightComponent: undefined;
  PressableComponent: undefined;
  StatusBarComponent: undefined;
};

export type StateManagementStackParamList = {
  StateManagementMain: undefined;
  UseStateExample: undefined;
  UseEffectExample: undefined;
  UseContextExample: undefined;
  UseCallbackExample: undefined;
  UseImperativeHandleExample: undefined;
  UseLayoutEffectExample: undefined;
  UseMemoExample: undefined;
  UseReducerExample: undefined;
  UseRefExample: undefined;
  ReduxExample: undefined;
  ContextAPIExample: undefined;
  SwiperExample: undefined;
};

export type RootTabParamList = {
  Components: undefined;
  StateManagement: undefined;
};

// 네비게이션 Props 타입 정의
export type ComponentsScreenNavigationProp = CompositeNavigationProp<
  StackNavigationProp<ComponentsStackParamList>,
  BottomTabNavigationProp<RootTabParamList>
>;

export type StateManagementScreenNavigationProp = CompositeNavigationProp<
  StackNavigationProp<StateManagementStackParamList>,
  BottomTabNavigationProp<RootTabParamList>
>;

export type ComponentsScreenRouteProp<
  T extends keyof ComponentsStackParamList
> = RouteProp<ComponentsStackParamList, T>;

export type StateManagementScreenRouteProp<
  T extends keyof StateManagementStackParamList
> = RouteProp<StateManagementStackParamList, T>;

// 컴포넌트 공통 Props 타입 정의
export interface WithChildren {
  children?: React.ReactNode;
}

export interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  type?: "primary" | "secondary" | "outline";
  fullWidth?: boolean;
}

export interface CardProps extends WithChildren {
  title?: string;
  footer?: React.ReactNode;
  onPress?: () => void;
}

export interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  maxLength?: number;
  multiline?: boolean;
  disabled?: boolean;
  label?: string;
  error?: string;
}

// Redux 관련 타입 정의
export interface ReduxState {
  count: number;
}

export type ReduxAction =
  | { type: "INCREMENT" }
  | { type: "DECREMENT" }
  | { type: "RESET" };
