import React, { Component, ErrorInfo, ReactNode } from "react";
import { logger } from "../utils/logger";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 에러 로깅
    logger.error(
      "ErrorBoundary caught an error:" +
        JSON.stringify({
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
        })
    );

    // 사용자 정의 에러 핸들러 호출
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // 에러 정보를 상태에 저장
    this.setState({
      error,
      errorInfo,
    });

    // Production 환경에서는 에러 리포팅 서비스로 전송
    if (process.env.NODE_ENV === "production") {
      this.reportError(error, errorInfo);
    }
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // 여기에 에러 리포팅 서비스 연동 (Sentry, LogRocket 등)
    try {
      const errorReport = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        userId: localStorage.getItem("userId") || "anonymous",
      };

      // 로컬 스토리지에 에러 저장 (임시)
      const existingErrors = JSON.parse(
        localStorage.getItem("errorReports") || "[]"
      );
      existingErrors.push(errorReport);
      localStorage.setItem(
        "errorReports",
        JSON.stringify(existingErrors.slice(-10))
      ); // 최근 10개만 유지
    } catch (reportingError) {
      logger.error("Failed to report error:", reportingError);
    }
  };

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // 사용자 정의 fallback UI가 있으면 사용
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 기본 에러 UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="text-center">
              {/* 에러 아이콘 */}
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>

              {/* 에러 제목 */}
              <h1 className="text-lg font-medium text-gray-900 mb-2">
                문제가 발생했습니다
              </h1>

              {/* 에러 설명 */}
              <p className="text-sm text-gray-500 mb-6">
                예상치 못한 오류로 인해 페이지를 표시할 수 없습니다. 잠시 후
                다시 시도해주세요.
              </p>

              {/* 개발 환경에서만 에러 상세 정보 표시 */}
              {process.env.NODE_ENV === "development" && this.state.error && (
                <details className="text-left mb-6">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                    에러 상세 정보 (개발용)
                  </summary>
                  <div className="bg-gray-100 p-3 rounded text-xs text-gray-800 overflow-auto max-h-32">
                    <p>
                      <strong>Message:</strong> {this.state.error.message}
                    </p>
                    {this.state.error.stack && (
                      <pre className="mt-2 whitespace-pre-wrap">
                        {this.state.error.stack}
                      </pre>
                    )}
                  </div>
                </details>
              )}

              {/* 액션 버튼들 */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={this.handleRetry}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  다시 시도
                </button>
                <button
                  onClick={this.handleReload}
                  className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                  페이지 새로고침
                </button>
              </div>

              {/* 도움말 링크 */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  문제가 계속 발생하면{" "}
                  <a
                    href="/guide"
                    className="text-blue-600 hover:text-blue-500"
                    onClick={() => (window.location.href = "/guide")}
                  >
                    도움말 페이지
                  </a>
                  를 확인하거나 관리자에게 문의하세요.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
