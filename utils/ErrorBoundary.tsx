import React, { Component, ErrorInfo, ReactNode } from "react";
import { StyleSheet, View, TouchableOpacity, Platform } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * 에러 경계 컴포넌트
 * 하위 컴포넌트 트리에서 발생하는 JavaScript 에러를 포착하여
 * 사용자에게 대체 UI를 표시합니다.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // 에러 로깅 또는 에러 보고 서비스에 에러 정보 전송
    console.error("ErrorBoundary caught an error", error, errorInfo);

    // 상위 컴포넌트에 에러 알림
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  resetError = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // 사용자 정의 fallback이 제공된 경우 사용
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 기본 에러 UI
      return (
        <View style={styles.container}>
          <IconSymbol
            name="exclamationmark.triangle"
            size={64}
            color={Colors.light.tint}
            style={styles.icon}
          />
          <ThemedText style={styles.title}>오류가 발생했습니다</ThemedText>
          <ThemedText style={styles.message}>
            {this.state.error?.message || "알 수 없는 오류가 발생했습니다."}
          </ThemedText>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={this.resetError}
          >
            <ThemedText style={styles.retryText}>다시 시도</ThemedText>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f8f8f8",
  },
  icon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 10,
  },
  retryText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
