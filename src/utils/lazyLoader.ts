import React, { lazy, Suspense } from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { colors } from "../styles/colors";

/**
 * 컴포넌트를 지연 로딩(lazy loading)으로 불러오는 유틸리티 함수
 * @param componentImport 컴포넌트를 import하는 함수
 * @returns 지연 로딩된 컴포넌트
 */
export function lazyLoad<T extends React.ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return lazy(componentImport);
}

/**
 * 지연 로딩 중에 표시될 로딩 컴포넌트
 */
export const LoadingFallback = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={colors.primary} />
  </View>
);

/**
 * 지연 로딩을 사용하여 컴포넌트를 감싸는 함수
 * @param Component 지연 로딩할 컴포넌트
 * @returns Suspense로 감싸진 컴포넌트
 */
export function withLazyLoading<P extends object>(
  Component: React.LazyExoticComponent<React.ComponentType<P>>
): React.FC<P> {
  return (props: P) => (
    <Suspense fallback={<LoadingFallback />}>
      <Component {...props} />
    </Suspense>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
});

/**
 * 사용 예시:
 *
 * const LazyComponent = lazyLoad(() => import('../path/to/Component'));
 * const LazyComponentWithFallback = withLazyLoading(LazyComponent);
 *
 * // 사용 시:
 * <LazyComponentWithFallback prop1={value1} prop2={value2} />
 */
