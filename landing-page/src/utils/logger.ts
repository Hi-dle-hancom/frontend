export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  OFF = 4,
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  data?: any;
  error?: Error;
}

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = LogLevel.INFO;
  private enableConsoleOutput: boolean = true;
  private enableRemoteLogging: boolean = false;

  private constructor() {
    this.loadConfiguration();
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private loadConfiguration() {
    // 환경 변수 또는 설정에서 로그 레벨 결정
    const isDevelopment = process.env.NODE_ENV === "development";
    const isProduction = process.env.NODE_ENV === "production";

    if (isDevelopment) {
      this.logLevel = LogLevel.DEBUG;
      this.enableConsoleOutput = true;
    } else if (isProduction) {
      this.logLevel = LogLevel.WARN;
      this.enableConsoleOutput = false;
      this.enableRemoteLogging = true;
    }
  }

  public debug(message: string, context?: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, context, data);
  }

  public info(message: string, context?: string, data?: any): void {
    this.log(LogLevel.INFO, message, context, data);
  }

  public warn(
    message: string,
    context?: string,
    data?: any,
    error?: Error
  ): void {
    this.log(LogLevel.WARN, message, context, data, error);
  }

  public error(
    message: string,
    context?: string,
    data?: any,
    error?: Error
  ): void {
    this.log(LogLevel.ERROR, message, context, data, error);
  }

  private log(
    level: LogLevel,
    message: string,
    context?: string,
    data?: any,
    error?: Error
  ): void {
    if (level < this.logLevel) {
      return;
    }

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      data: this.sanitizeData(data),
      error,
    };

    // 콘솔 출력 (개발 환경에서만)
    if (this.enableConsoleOutput) {
      this.writeToConsole(logEntry);
    }

    // 원격 로깅 (프로덕션 환경에서만)
    if (
      this.enableRemoteLogging &&
      (level === LogLevel.ERROR || level === LogLevel.WARN)
    ) {
      this.sendToRemoteLogger(logEntry);
    }
  }

  private writeToConsole(entry: LogEntry): void {
    const args = [
      `%c[HAPA:${LogLevel[entry.level]}]`,
      this.getConsoleStyle(entry.level),
      entry.context ? `[${entry.context}]` : "",
      entry.message,
    ].filter(Boolean);

    if (entry.data) {
      args.push("\nData:", entry.data);
    }

    if (entry.error) {
      args.push(
        "\nError:",
        entry.error.message || "Unknown error",
        "\nStack:",
        entry.error.stack || ""
      );
    }

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(...args);
        break;
      case LogLevel.INFO:
        console.info(...args);
        break;
      case LogLevel.WARN:
        console.warn(...args);
        break;
      case LogLevel.ERROR:
        console.error(...args);
        break;
    }
  }

  private getConsoleStyle(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return "color: #888; font-weight: normal;";
      case LogLevel.INFO:
        return "color: #007ACC; font-weight: bold;";
      case LogLevel.WARN:
        return "color: #FF8C00; font-weight: bold;";
      case LogLevel.ERROR:
        return "color: #FF0000; font-weight: bold;";
      default:
        return "";
    }
  }

  private sanitizeData(data: any): any {
    if (!data) return data;

    // 민감한 정보 제거
    const sensitiveKeys = ["password", "token", "apiKey", "secret", "auth"];

    if (typeof data === "object" && data !== null) {
      const sanitized = { ...data };
      sensitiveKeys.forEach((key) => {
        if (key in sanitized) {
          sanitized[key] = "[REDACTED]";
        }
      });
      return sanitized;
    }

    return data;
  }

  private sendToRemoteLogger(entry: LogEntry): void {
    // 실제 원격 로깅 서비스로 전송
    // 예: API 서버로 전송, 또는 Sentry 같은 서비스 사용
    const logData = {
      level: LogLevel[entry.level],
      message: entry.message,
      context: entry.context,
      timestamp: entry.timestamp,
      errorType: entry.error?.name,
      userAgent: navigator.userAgent,
      url: window.location.href,
      // 스택 트레이스는 민감할 수 있으므로 제외하거나 선택적으로 포함
    };

    // 실제 구현에서는 fetch를 사용하여 API 서버로 전송
    if (process.env.NODE_ENV === "development") {
      console.log("[REMOTE_LOG]", logData);
    } else {
      // 프로덕션에서는 실제 API 호출
      fetch("/api/v1/logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(logData),
      }).catch((error) => {
        // 로깅 실패 시 콘솔에 출력 (개발 환경에서만)
        if (process.env.NODE_ENV === "development") {
          console.error("Failed to send log to remote server:", error);
        }
      });
    }
  }

  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  public setConsoleOutput(enabled: boolean): void {
    this.enableConsoleOutput = enabled;
  }
}

// 싱글톤 인스턴스 export
export const logger = Logger.getInstance();
