// App.tsx

import React from 'react';
import AppNavigator from './src/navigation/AppNavigator'; // AppNavigator 임포트
import { SafeAreaProvider } from 'react-native-safe-area-context'; // SafeAreaProvider 임포트 (native-stack 권장)


function App(): React.JSX.Element {
  return (
     // native-stack 사용 시 SafeAreaProvider로 감싸주는 것이 좋음
     <SafeAreaProvider>
        {/* NavigationContainer는 앱 전체를 감싸야 함 */}
        <AppNavigator />
     </SafeAreaProvider>
  );
}

export default App;
