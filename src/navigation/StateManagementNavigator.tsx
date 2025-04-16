import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Types
import { StateManagementStackParamList } from "../types";

// Screens
import StateManagementScreen from "../screens/StateManagement/StateManagementScreen";
import UseStateExample from "../screens/StateManagement/UseStateExample";
import UseEffectExample from "../screens/StateManagement/UseEffectExample";
import UseContextExample from "../screens/StateManagement/UseContextExample";
import UseCallbackExample from "../screens/StateManagement/UseCallbackExample";
import UseImperativeHandleExample from "../screens/StateManagement/UseImperativeHandleExample";
import UseLayoutEffectExample from "../screens/StateManagement/UseLayoutEffectExample";
import UseMemoExample from "../screens/StateManagement/UseMemoExample";
import UseReducerExample from "../screens/StateManagement/UseReducerExample";
import UseRefExample from "../screens/StateManagement/UseRefExample";
import ReduxExample from "../screens/StateManagement/ReduxExample";
import ContextAPIExample from "../screens/StateManagement/ContextAPIExample";
import SwiperExample from "../screens/StateManagement/SwiperExample";

// Styles
import { colors } from "../styles/colors";

const Stack = createNativeStackNavigator<StateManagementStackParamList>();

/**
 * 상태 관리 스택 네비게이터
 * 다양한 상태 관리 기법과 훅 예제 화면들을 관리합니다.
 */
const StateManagementNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      <Stack.Screen
        name="StateManagementMain"
        component={StateManagementScreen}
        options={{ title: "State Management" }}
      />
      <Stack.Screen
        name="UseStateExample"
        component={UseStateExample}
        options={{ title: "useState" }}
      />
      <Stack.Screen
        name="UseEffectExample"
        component={UseEffectExample}
        options={{ title: "useEffect" }}
      />
      <Stack.Screen
        name="UseContextExample"
        component={UseContextExample}
        options={{ title: "useContext" }}
      />
      <Stack.Screen
        name="UseCallbackExample"
        component={UseCallbackExample}
        options={{ title: "useCallback" }}
      />
      <Stack.Screen
        name="UseImperativeHandleExample"
        component={UseImperativeHandleExample}
        options={{ title: "useImperativeHandle" }}
      />
      <Stack.Screen
        name="UseLayoutEffectExample"
        component={UseLayoutEffectExample}
        options={{ title: "useLayoutEffect" }}
      />
      <Stack.Screen
        name="UseMemoExample"
        component={UseMemoExample}
        options={{ title: "useMemo" }}
      />
      <Stack.Screen
        name="UseReducerExample"
        component={UseReducerExample}
        options={{ title: "useReducer" }}
      />
      <Stack.Screen
        name="UseRefExample"
        component={UseRefExample}
        options={{ title: "useRef" }}
      />
      <Stack.Screen
        name="ReduxExample"
        component={ReduxExample}
        options={{ title: "Redux" }}
      />
      <Stack.Screen
        name="ContextAPIExample"
        component={ContextAPIExample}
        options={{ title: "Context API" }}
      />
      <Stack.Screen
        name="SwiperExample"
        component={SwiperExample}
        options={{ title: "Swiper" }}
      />
    </Stack.Navigator>
  );
};

export default StateManagementNavigator;
