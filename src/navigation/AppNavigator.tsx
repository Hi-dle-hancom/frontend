// src/navigation/AppNavigator.tsx

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
// native-stack 사용 시
import { createNativeStackNavigator, NativeStackScreenProps } from '@react-navigation/native-stack';
// // stack 사용 시 (만약 이걸 사용한다면 위 import는 주석 처리)
// import { createStackNavigator, StackScreenProps } from '@react-navigation/stack';

import { View, Text, Button } from 'react-native'; // 임시 컴포넌트 사용을 위해 필요

// TODO: 나중에 만들 화면 컴포넌트 임포트 (실제 화면 만들면 주석 해제하고 사용)
// import HomeScreen from '../screens/HomeScreen';
// import RouteSearchScreen from '../screens/RouteSearchScreen';
// import StationDetailScreen from '../screens/StationDetailScreen';

// 네비게이션 라우트에 사용할 타입 정의
// 이 타입은 src/types/navigation.ts 파일에 따로 정의하고 임포트해서 사용하는 것도 좋음
export type RootStackParamList = {
  Home: undefined; // HomeScreen은 파라미터 없음
  RouteSearch: undefined; // RouteSearchScreen도 파라미터 없음
  StationDetail: { stationId: string }; // StationDetailScreen은 stationId 파라미터 받음
  // TODO: 필요한 화면 라우트 추가
};

// Stack Navigator 생성
const Stack = createNativeStackNavigator<RootStackParamList>();
// 또는 const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      {/*
        NavigationContainer는 앱 전체를 감싸는 컨테이너 역할을 해.
        보통 App.tsx 파일에서 SafeAreaProvider 안에 NavigationContainer를 넣고,
        그 안에 이 AppNavigator 컴포넌트를 넣는 구조로 사용해!
        (이전 단계 App.tsx 코드 참고)
      */}
      <Stack.Navigator initialRouteName="Home">
        {' '}
        {/* 앱 시작 화면 설정 */}
        {/* TODO: 실제 화면 컴포넌트 연결 (임시 컴포넌트 대신 이걸 사용) */}
        {/* <Stack.Screen name="Home" component={HomeScreen} options={{ title: '뚜따 홈' }} /> */}
        {/* <Stack.Screen name="RouteSearch" component={RouteSearchScreen} options={{ title: '경로 검색' }} /> */}
        {/* <Stack.Screen name="StationDetail" component={StationDetailScreen} options={{ title: '대여소 상세' }} /> */}
        {/* 임시 화면들 (실제 구현 시 위에 코드로 교체하고 아래는 삭제) */}
        <Stack.Screen
          name="Home"
          component={TempHomeScreen}
          options={{ title: '뚜따 홈 (임시)' }}
        />
        <Stack.Screen
          name="RouteSearch"
          component={TempRouteSearchScreen}
          options={{ title: '경로 검색 (임시)' }}
        />
        <Stack.Screen
          name="StationDetail"
          component={TempStationDetailScreen}
          options={{ title: '대여소 상세 (임시)' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;

// --- 임시 컴포넌트들 (개발 단계에서 화면 구성을 위해 사용하며, 실제 화면 컴포넌트가 만들어지면 삭제) ---

// 네비게이션 타입 사용 (native-stack 기준)
type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;
const TempHomeScreen = ({ navigation }: HomeScreenProps) => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>뚜따 홈 화면 (임시)</Text>
      {/* 버튼 클릭 시 RouteSearch 화면으로 이동 */}
      <Button title="경로 검색으로 이동" onPress={() => navigation.navigate('RouteSearch')} />
    </View>
  );
};

type RouteSearchScreenProps = NativeStackScreenProps<RootStackParamList, 'RouteSearch'>;
const TempRouteSearchScreen = ({ navigation }: RouteSearchScreenProps) => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>경로 검색 화면 (임시)</Text>
      {/* 버튼 클릭 시 StationDetail 화면으로 이동하며 stationId 파라미터 전달 */}
      <Button
        title="대여소 상세로 이동 (ID: ABC)"
        onPress={() => navigation.navigate('StationDetail', { stationId: 'ABC' })}
      />
      {/* 뒤로 가기 버튼 */}
      <Button title="뒤로 가기" onPress={() => navigation.goBack()} />
    </View>
  );
};

type StationDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'StationDetail'>;
const TempStationDetailScreen = ({ route, navigation }: StationDetailScreenProps) => {
  // 라우트 파라미터에서 stationId 가져오기
  const { stationId } = route.params;
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>대여소 상세 화면 (임시)</Text>
      <Text>대여소 ID: {stationId}</Text>
      {/* 홈으로 돌아가기 버튼 */}
      <Button title="홈으로 돌아가기" onPress={() => navigation.navigate('Home')} />
      {/* 뒤로 가기 버튼 */}
      <Button title="뒤로 가기" onPress={() => navigation.goBack()} />
    </View>
  );
};

// --- 임시 컴포넌트 끝 ---
