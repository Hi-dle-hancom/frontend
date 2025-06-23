import * as vscode from "vscode";
import { EnhancedErrorService, ErrorSeverity } from "./EnhancedErrorService";

export interface ValidationRule {
  key: string;
  type: "string" | "number" | "boolean" | "array" | "object";
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: any[];
  validator?: (value: any) => boolean | string;
  dependsOn?: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  key: string;
  message: string;
  value: any;
  severity: "error" | "warning";
}

export interface ValidationWarning {
  key: string;
  message: string;
  suggestion?: string;
}

export interface ConfigSchema {
  [key: string]: ValidationRule;
}

export class ConfigValidationService {
  private static instance: ConfigValidationService;
  private errorService = EnhancedErrorService.getInstance();

  // 설정 스키마 정의
  private configSchema: ConfigSchema = {
    "hapa.apiKey": {
      key: "hapa.apiKey",
      type: "string",
      required: true,
      pattern: /^[A-Za-z0-9_-]{20,}$/,
      validator: (value) => {
        if (!value || typeof value !== "string") {
          return "API 키는 필수입니다";
        }
        if (value.length < 20) {
          return "API 키는 최소 20자 이상이어야 합니다";
        }
        if (!/^[A-Za-z0-9_-]+$/.test(value)) {
          return "API 키는 영문, 숫자, 하이픈, 언더스코어만 포함할 수 있습니다";
        }
        return true;
      },
    },
    "hapa.apiUrl": {
      key: "hapa.apiUrl",
      type: "string",
      required: true,
      validator: (value) => {
        if (!value) return "API URL은 필수입니다";
        try {
          new URL(value);
          return true;
        } catch {
          return "올바른 URL 형식이 아닙니다";
        }
      },
    },
    "hapa.autoComplete": {
      key: "hapa.autoComplete",
      type: "boolean",
      required: false,
    },
    "hapa.maxRequestTimeout": {
      key: "hapa.maxRequestTimeout",
      type: "number",
      required: false,
      min: 5000,
      max: 300000,
      validator: (value) => {
        if (typeof value !== "number") return true; // 선택사항
        if (value < 5000) return "최소 타임아웃은 5초입니다";
        if (value > 300000) return "최대 타임아웃은 5분입니다";
        return true;
      },
    },
    "hapa.maxTokens": {
      key: "hapa.maxTokens",
      type: "number",
      required: false,
      min: 100,
      max: 8000,
      validator: (value) => {
        if (typeof value !== "number") return true;
        if (value < 100) return "최소 토큰 수는 100개입니다";
        if (value > 8000) return "최대 토큰 수는 8000개입니다";
        return true;
      },
    },
    "hapa.temperature": {
      key: "hapa.temperature",
      type: "number",
      required: false,
      min: 0,
      max: 2,
      validator: (value) => {
        if (typeof value !== "number") return true;
        if (value < 0 || value > 2) return "온도 값은 0과 2 사이여야 합니다";
        return true;
      },
    },
    "hapa.enableTelemetry": {
      key: "hapa.enableTelemetry",
      type: "boolean",
      required: false,
    },
    "hapa.language": {
      key: "hapa.language",
      type: "string",
      required: false,
      enum: ["ko", "en", "ja", "zh", "auto"],
      validator: (value) => {
        if (!value) return true;
        const supportedLangs = ["ko", "en", "ja", "zh", "auto"];
        if (!supportedLangs.includes(value)) {
          return `지원되는 언어: ${supportedLangs.join(", ")}`;
        }
        return true;
      },
    },
    "hapa.theme": {
      key: "hapa.theme",
      type: "string",
      required: false,
      enum: ["auto", "light", "dark", "high-contrast"],
      validator: (value) => {
        if (!value) return true;
        const supportedThemes = ["auto", "light", "dark", "high-contrast"];
        if (!supportedThemes.includes(value)) {
          return `지원되는 테마: ${supportedThemes.join(", ")}`;
        }
        return true;
      },
    },
    "hapa.cacheDuration": {
      key: "hapa.cacheDuration",
      type: "number",
      required: false,
      min: 300000, // 5분
      max: 86400000, // 24시간
      validator: (value) => {
        if (typeof value !== "number") return true;
        if (value < 300000) return "최소 캐시 지속시간은 5분입니다";
        if (value > 86400000) return "최대 캐시 지속시간은 24시간입니다";
        return true;
      },
    },
    "hapa.userProfile.name": {
      key: "hapa.userProfile.name",
      type: "string",
      required: false,
      validator: (value) => {
        if (!value) return true;
        if (value.length < 2) return "이름은 최소 2자 이상이어야 합니다";
        if (value.length > 50) return "이름은 최대 50자까지 가능합니다";
        return true;
      },
    },
    "hapa.userProfile.experienceLevel": {
      key: "hapa.userProfile.experienceLevel",
      type: "string",
      required: false,
      enum: ["beginner", "intermediate", "advanced", "expert"],
      validator: (value) => {
        if (!value) return true;
        const levels = ["beginner", "intermediate", "advanced", "expert"];
        if (!levels.includes(value)) {
          return `경험 수준: ${levels.join(", ")}`;
        }
        return true;
      },
    },
    "hapa.userProfile.preferredLanguages": {
      key: "hapa.userProfile.preferredLanguages",
      type: "array",
      required: false,
      validator: (value) => {
        if (!Array.isArray(value)) return true;
        const supportedLangs = [
          "python",
          "javascript",
          "typescript",
          "java",
          "cpp",
          "csharp",
          "go",
          "rust",
        ];
        const invalid = value.filter((lang) => !supportedLangs.includes(lang));
        if (invalid.length > 0) {
          return `지원하지 않는 언어: ${invalid.join(", ")}`;
        }
        return true;
      },
    },
  };

  // 설정 변경 리스너들
  private configChangeListeners: Map<string, ((value: any) => void)[]> =
    new Map();

  // 마지막 검증 결과 캐시
  private lastValidationResult: Map<string, ValidationResult> = new Map();

  static getInstance(): ConfigValidationService {
    if (!ConfigValidationService.instance) {
      ConfigValidationService.instance = new ConfigValidationService();
    }
    return ConfigValidationService.instance;
  }

  constructor() {
    this.setupConfigurationWatcher();
  }

  /**
   * 설정 변경 감시 시작
   */
  private setupConfigurationWatcher(): void {
    vscode.workspace.onDidChangeConfiguration((event) => {
      // HAPA 관련 설정만 처리
      if (event.affectsConfiguration("hapa")) {
        this.handleConfigurationChange(event);
      }
    });
  }

  /**
   * 설정 변경 처리
   */
  private async handleConfigurationChange(
    event: vscode.ConfigurationChangeEvent
  ): Promise<void> {
    try {
      const changedKeys = this.getChangedConfigKeys(event);

      for (const key of changedKeys) {
        const newValue = this.getConfigValue(key);
        const validationResult = this.validateSingle(key, newValue);

        // 검증 결과 저장
        this.lastValidationResult.set(key, validationResult);

        if (!validationResult.isValid) {
          // 유효하지 않은 설정값 처리
          await this.handleInvalidConfig(key, newValue, validationResult);
        } else {
          // 유효한 설정값 처리
          await this.handleValidConfig(key, newValue);
        }

        // 리스너들에게 알림
        this.notifyConfigChange(key, newValue);
      }
    } catch (error) {
      this.errorService.logError(error as Error, ErrorSeverity.MEDIUM, {
        event: "configurationChange",
      });
    }
  }

  /**
   * 변경된 설정 키들 추출
   */
  private getChangedConfigKeys(
    event: vscode.ConfigurationChangeEvent
  ): string[] {
    const allKeys = Object.keys(this.configSchema);
    return allKeys.filter((key) => event.affectsConfiguration(key));
  }

  /**
   * 전체 설정 검증
   */
  validateAllConfigs(): ValidationResult {
    const allErrors: ValidationError[] = [];
    const allWarnings: ValidationWarning[] = [];

    for (const [key, rule] of Object.entries(this.configSchema)) {
      const value = this.getConfigValue(key);
      const result = this.validateSingle(key, value);

      allErrors.push(...result.errors);
      allWarnings.push(...result.warnings);
    }

    return {
      isValid: allErrors.filter((e) => e.severity === "error").length === 0,
      errors: allErrors,
      warnings: allWarnings,
    };
  }

  /**
   * 단일 설정값 검증
   */
  validateSingle(key: string, value: any): ValidationResult {
    const rule = this.configSchema[key];
    if (!rule) {
      return {
        isValid: true,
        errors: [],
        warnings: [
          {
            key,
            message: "알 수 없는 설정 키입니다",
            suggestion: "설정 키를 확인해주세요",
          },
        ],
      };
    }

    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      // 필수 값 검증
      if (
        rule.required &&
        (value === undefined || value === null || value === "")
      ) {
        errors.push({
          key,
          message: "필수 설정값입니다",
          value,
          severity: "error",
        });
        return { isValid: false, errors, warnings };
      }

      // 값이 없으면 (선택사항인 경우) 검증 통과
      if (value === undefined || value === null) {
        return { isValid: true, errors, warnings };
      }

      // 타입 검증
      if (!this.validateType(value, rule.type)) {
        errors.push({
          key,
          message: `타입이 올바르지 않습니다. 예상: ${
            rule.type
          }, 실제: ${typeof value}`,
          value,
          severity: "error",
        });
      }

      // 범위 검증 (숫자)
      if (rule.type === "number" && typeof value === "number") {
        if (rule.min !== undefined && value < rule.min) {
          errors.push({
            key,
            message: `최솟값은 ${rule.min}입니다`,
            value,
            severity: "error",
          });
        }
        if (rule.max !== undefined && value > rule.max) {
          errors.push({
            key,
            message: `최댓값은 ${rule.max}입니다`,
            value,
            severity: "error",
          });
        }
      }

      // 패턴 검증 (문자열)
      if (rule.type === "string" && typeof value === "string" && rule.pattern) {
        if (!rule.pattern.test(value)) {
          errors.push({
            key,
            message: "패턴이 일치하지 않습니다",
            value,
            severity: "error",
          });
        }
      }

      // 열거형 검증
      if (rule.enum && !rule.enum.includes(value)) {
        errors.push({
          key,
          message: `허용되지 않는 값입니다. 가능한 값: ${rule.enum.join(", ")}`,
          value,
          severity: "error",
        });
      }

      // 커스텀 검증
      if (rule.validator) {
        const validationResult = rule.validator(value);
        if (validationResult !== true) {
          errors.push({
            key,
            message:
              typeof validationResult === "string"
                ? validationResult
                : "유효하지 않은 값입니다",
            value,
            severity: "error",
          });
        }
      }

      // 의존성 검증
      if (rule.dependsOn) {
        for (const depKey of rule.dependsOn) {
          const depValue = this.getConfigValue(depKey);
          if (!depValue) {
            warnings.push({
              key,
              message: `의존하는 설정 '${depKey}'가 설정되지 않았습니다`,
              suggestion: `'${depKey}'를 먼저 설정해주세요`,
            });
          }
        }
      }

      // 추가 검증 규칙들
      this.addContextualValidations(key, value, warnings);
    } catch (error) {
      errors.push({
        key,
        message: `검증 중 오류 발생: ${error}`,
        value,
        severity: "error",
      });
    }

    return {
      isValid: errors.filter((e) => e.severity === "error").length === 0,
      errors,
      warnings,
    };
  }

  /**
   * 타입 검증
   */
  private validateType(value: any, expectedType: string): boolean {
    switch (expectedType) {
      case "string":
        return typeof value === "string";
      case "number":
        return typeof value === "number" && !isNaN(value);
      case "boolean":
        return typeof value === "boolean";
      case "array":
        return Array.isArray(value);
      case "object":
        return (
          typeof value === "object" && value !== null && !Array.isArray(value)
        );
      default:
        return true;
    }
  }

  /**
   * 컨텍스트별 추가 검증
   */
  private addContextualValidations(
    key: string,
    value: any,
    warnings: ValidationWarning[]
  ): void {
    // API 키 보안 검증
    if (key === "hapa.apiKey" && typeof value === "string") {
      if (
        value.includes("demo") ||
        value.includes("test") ||
        value.includes("example")
      ) {
        warnings.push({
          key,
          message: "테스트용 API 키로 보입니다",
          suggestion: "프로덕션 환경에서는 실제 API 키를 사용해주세요",
        });
      }
    }

    // 성능 관련 경고
    if (key === "hapa.maxTokens" && typeof value === "number") {
      if (value > 4000) {
        warnings.push({
          key,
          message: "높은 토큰 수는 응답 시간을 늘릴 수 있습니다",
          suggestion: "필요한 경우가 아니라면 더 낮은 값을 권장합니다",
        });
      }
    }

    // 캐시 지속시간 최적화 제안
    if (key === "hapa.cacheDuration" && typeof value === "number") {
      if (value < 3600000) {
        // 1시간 미만
        warnings.push({
          key,
          message: "짧은 캐시 지속시간은 API 호출을 증가시킬 수 있습니다",
          suggestion: "1시간 이상을 권장합니다",
        });
      }
    }
  }

  /**
   * 유효하지 않은 설정 처리
   */
  private async handleInvalidConfig(
    key: string,
    value: any,
    validationResult: ValidationResult
  ): Promise<void> {
    const errors = validationResult.errors.filter(
      (e) => e.severity === "error"
    );
    const errorMessages = errors.map((e) => e.message).join(", ");

    const action = await vscode.window.showErrorMessage(
      `설정 오류 (${key}): ${errorMessages}`,
      "설정 열기",
      "기본값 복원",
      "무시"
    );

    switch (action) {
      case "설정 열기":
        await vscode.commands.executeCommand(
          "workbench.action.openSettings",
          key
        );
        break;

      case "기본값 복원":
        await this.resetToDefault(key);
        break;
    }

    // 에러 로그 기록
    this.errorService.logError(
      `설정 검증 실패: ${key} = ${JSON.stringify(value)}`,
      ErrorSeverity.MEDIUM,
      { key, value, errors: errorMessages }
    );
  }

  /**
   * 유효한 설정 처리
   */
  private async handleValidConfig(key: string, value: any): Promise<void> {
    const validationResult = this.lastValidationResult.get(key);

    if (validationResult?.warnings.length) {
      const warningMessages = validationResult.warnings
        .map((w) => w.message)
        .join(", ");

      // 경고 메시지는 덜 침습적으로 표시
      console.warn(`설정 경고 (${key}): ${warningMessages}`);
    }

    // 성공적인 설정 변경 로그
    console.log(`✅ 설정 업데이트: ${key} = ${JSON.stringify(value)}`);
  }

  /**
   * 기본값으로 복원
   */
  private async resetToDefault(key: string): Promise<void> {
    try {
      const config = vscode.workspace.getConfiguration();
      const inspect = config.inspect(key);

      if (inspect?.defaultValue !== undefined) {
        await config.update(key, undefined, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage(
          `설정 '${key}'이 기본값으로 복원되었습니다.`
        );
      }
    } catch (error) {
      this.errorService.logError(error as Error, ErrorSeverity.MEDIUM, {
        operation: "resetToDefault",
        key,
      });
    }
  }

  /**
   * 설정값 가져오기
   */
  private getConfigValue(key: string): any {
    return vscode.workspace.getConfiguration().get(key);
  }

  /**
   * 설정 변경 리스너 등록
   */
  onConfigChange(key: string, listener: (value: any) => void): void {
    if (!this.configChangeListeners.has(key)) {
      this.configChangeListeners.set(key, []);
    }
    this.configChangeListeners.get(key)!.push(listener);
  }

  /**
   * 설정 변경 알림
   */
  private notifyConfigChange(key: string, value: any): void {
    const listeners = this.configChangeListeners.get(key);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(value);
        } catch (error) {
          this.errorService.logError(error as Error, ErrorSeverity.LOW, {
            listener: "configChangeListener",
            key,
          });
        }
      });
    }
  }

  /**
   * 설정 스키마 추가/업데이트
   */
  addValidationRule(rule: ValidationRule): void {
    this.configSchema[rule.key] = rule;
  }

  /**
   * 설정 스키마 제거
   */
  removeValidationRule(key: string): void {
    delete this.configSchema[key];
  }

  /**
   * 현재 설정 스키마 조회
   */
  getConfigSchema(): ConfigSchema {
    return { ...this.configSchema };
  }

  /**
   * 마지막 검증 결과 조회
   */
  getLastValidationResult(
    key?: string
  ): ValidationResult | Map<string, ValidationResult> {
    if (key) {
      return (
        this.lastValidationResult.get(key) || {
          isValid: true,
          errors: [],
          warnings: [],
        }
      );
    }
    return new Map(this.lastValidationResult);
  }

  /**
   * 설정 상태 보고서 생성
   */
  generateConfigReport(): string {
    const allResult = this.validateAllConfigs();
    const totalErrors = allResult.errors.filter(
      (e) => e.severity === "error"
    ).length;
    const totalWarnings = allResult.warnings.length;

    let report = `
=== HAPA 설정 상태 보고서 ===
🔧 전체 설정 수: ${Object.keys(this.configSchema).length}
❌ 오류: ${totalErrors}개
⚠️ 경고: ${totalWarnings}개
✅ 전체 상태: ${allResult.isValid ? "정상" : "오류 있음"}

`;

    if (totalErrors > 0) {
      report += `\n🚨 오류 목록:\n`;
      allResult.errors
        .filter((e) => e.severity === "error")
        .forEach((error) => {
          report += `  - ${error.key}: ${error.message}\n`;
        });
    }

    if (totalWarnings > 0) {
      report += `\n⚠️ 경고 목록:\n`;
      allResult.warnings.forEach((warning) => {
        report += `  - ${warning.key}: ${warning.message}`;
        if (warning.suggestion) {
          report += ` (제안: ${warning.suggestion})`;
        }
        report += "\n";
      });
    }

    if (allResult.isValid && totalWarnings === 0) {
      report += `\n🎉 모든 설정이 올바르게 구성되어 있습니다!`;
    }

    return report;
  }

  /**
   * 정리
   */
  cleanup(): void {
    this.configChangeListeners.clear();
    this.lastValidationResult.clear();
  }
}
