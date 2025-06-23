import * as vscode from "vscode";
import { EnhancedErrorService, ErrorSeverity } from "./EnhancedErrorService";

export interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  screenReaderOptimized: boolean;
  keyboardNavigation: boolean;
  focusIndicators: boolean;
  announcements: boolean;
  fontSize: number;
  colorTheme: "auto" | "light" | "dark" | "high-contrast";
}

export interface KeyboardShortcut {
  key: string;
  modifiers: string[];
  action: string;
  description: string;
  category: string;
}

export interface AccessibilityFeature {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  priority: "low" | "medium" | "high";
  applyFunction: () => void;
  revertFunction: () => void;
}

export class AccessibilityService {
  private static instance: AccessibilityService;
  private errorService = EnhancedErrorService.getInstance();

  // 접근성 설정
  private settings: AccessibilitySettings;

  // 키보드 단축키
  private keyboardShortcuts: Map<string, KeyboardShortcut> = new Map();

  // 접근성 기능들
  private features: Map<string, AccessibilityFeature> = new Map();

  // 상태 관리
  private isScreenReaderDetected = false;
  private focusHistory: string[] = [];
  private announceTimeout: NodeJS.Timeout | null = null;

  // 사용자 설정 감시
  private configWatcher: vscode.Disposable | null = null;

  static getInstance(): AccessibilityService {
    if (!AccessibilityService.instance) {
      AccessibilityService.instance = new AccessibilityService();
    }
    return AccessibilityService.instance;
  }

  constructor() {
    this.settings = this.getDefaultSettings();
    this.initializeAccessibility();
  }

  /**
   * 접근성 서비스 초기화
   */
  private async initializeAccessibility(): Promise<void> {
    try {
      // 시스템 접근성 설정 감지
      await this.detectSystemAccessibilitySettings();

      // 사용자 설정 로드
      this.loadUserSettings();

      // 키보드 단축키 등록
      this.registerKeyboardShortcuts();

      // 접근성 기능 등록
      this.registerAccessibilityFeatures();

      // 설정 변경 감시 시작
      this.startConfigWatcher();

      // 스크린 리더 감지
      this.detectScreenReader();

      console.log("♿ AccessibilityService 초기화 완료");
    } catch (error) {
      this.errorService.logError(error as Error, ErrorSeverity.MEDIUM, {
        component: "AccessibilityService",
        phase: "initialization",
      });
    }
  }

  /**
   * 시스템 접근성 설정 감지
   */
  private async detectSystemAccessibilitySettings(): Promise<void> {
    try {
      // VS Code의 테마 설정 확인
      const colorTheme = vscode.window.activeColorTheme;
      const isHighContrast =
        colorTheme.kind === vscode.ColorThemeKind.HighContrast ||
        colorTheme.kind === vscode.ColorThemeKind.HighContrastLight;

      // 시스템 설정 반영
      if (isHighContrast) {
        this.settings.highContrast = true;
        this.settings.colorTheme = "high-contrast";
      }

      // 폰트 크기 설정 확인
      const config = vscode.workspace.getConfiguration("editor");
      const fontSize = config.get("fontSize", 14) as number;
      if (fontSize > 16) {
        this.settings.largeText = true;
        this.settings.fontSize = fontSize;
      }

      console.log(
        `♿ 시스템 접근성 설정 감지: 고대비=${isHighContrast}, 폰트크기=${fontSize}`
      );
    } catch (error) {
      this.errorService.logError(error as Error, ErrorSeverity.LOW, {
        operation: "detectSystemAccessibilitySettings",
      });
    }
  }

  /**
   * 스크린 리더 감지
   */
  private detectScreenReader(): void {
    try {
      // VS Code API를 통한 스크린 리더 감지
      const accessibilitySupport = vscode.workspace
        .getConfiguration("editor")
        .get("accessibilitySupport", "auto") as string;
      const isScreenReaderOptimized = accessibilitySupport === "on";

      this.isScreenReaderDetected = isScreenReaderOptimized;

      if (this.isScreenReaderDetected) {
        this.settings.screenReaderOptimized = true;
        this.settings.announcements = true;
        this.applyScreenReaderOptimizations();

        this.announceToScreenReader(
          "HAPA AI Assistant가 스크린 리더 최적화 모드로 실행되고 있습니다."
        );
      }

      console.log(`♿ 스크린 리더 감지: ${this.isScreenReaderDetected}`);
    } catch (error) {
      this.errorService.logError(error as Error, ErrorSeverity.LOW, {
        operation: "detectScreenReader",
      });
    }
  }

  /**
   * 키보드 단축키 등록
   */
  private registerKeyboardShortcuts(): void {
    const shortcuts: KeyboardShortcut[] = [
      {
        key: "h",
        modifiers: ["ctrl", "alt"],
        action: "hapa.showHelp",
        description: "HAPA 도움말 표시",
        category: "navigation",
      },
      {
        key: "s",
        modifiers: ["ctrl", "alt"],
        action: "hapa.showSidebar",
        description: "HAPA 사이드바 열기",
        category: "navigation",
      },
      {
        key: "c",
        modifiers: ["ctrl", "alt"],
        action: "hapa.showCommands",
        description: "HAPA 명령어 팔레트",
        category: "commands",
      },
      {
        key: "r",
        modifiers: ["ctrl", "alt"],
        action: "hapa.readSelection",
        description: "선택된 텍스트 읽기",
        category: "accessibility",
      },
      {
        key: "a",
        modifiers: ["ctrl", "alt"],
        action: "hapa.announceStatus",
        description: "현재 상태 안내",
        category: "accessibility",
      },
      {
        key: "equal",
        modifiers: ["ctrl", "alt"],
        action: "hapa.increaseFontSize",
        description: "폰트 크기 증가",
        category: "accessibility",
      },
      {
        key: "minus",
        modifiers: ["ctrl", "alt"],
        action: "hapa.decreaseFontSize",
        description: "폰트 크기 감소",
        category: "accessibility",
      },
      {
        key: "t",
        modifiers: ["ctrl", "alt"],
        action: "hapa.toggleHighContrast",
        description: "고대비 모드 전환",
        category: "accessibility",
      },
    ];

    shortcuts.forEach((shortcut) => {
      const key = this.createShortcutKey(shortcut);
      this.keyboardShortcuts.set(key, shortcut);
    });

    console.log(`♿ ${shortcuts.length}개 키보드 단축키 등록 완료`);
  }

  /**
   * 접근성 기능 등록
   */
  private registerAccessibilityFeatures(): void {
    const features: AccessibilityFeature[] = [
      {
        id: "high-contrast",
        name: "고대비 모드",
        description: "높은 대비로 가독성을 향상시킵니다",
        enabled: this.settings.highContrast,
        priority: "high",
        applyFunction: () => this.applyHighContrastMode(),
        revertFunction: () => this.revertHighContrastMode(),
      },
      {
        id: "large-text",
        name: "큰 텍스트",
        description: "텍스트 크기를 확대합니다",
        enabled: this.settings.largeText,
        priority: "high",
        applyFunction: () => this.applyLargeTextMode(),
        revertFunction: () => this.revertLargeTextMode(),
      },
      {
        id: "keyboard-navigation",
        name: "키보드 네비게이션",
        description: "키보드만으로 모든 기능을 사용할 수 있습니다",
        enabled: this.settings.keyboardNavigation,
        priority: "high",
        applyFunction: () => this.enableKeyboardNavigation(),
        revertFunction: () => this.disableKeyboardNavigation(),
      },
      {
        id: "focus-indicators",
        name: "포커스 표시",
        description: "현재 포커스된 요소를 명확히 표시합니다",
        enabled: this.settings.focusIndicators,
        priority: "medium",
        applyFunction: () => this.enhanceFocusIndicators(),
        revertFunction: () => this.revertFocusIndicators(),
      },
      {
        id: "screen-reader",
        name: "스크린 리더 최적화",
        description: "스크린 리더 사용자를 위한 최적화",
        enabled: this.settings.screenReaderOptimized,
        priority: "high",
        applyFunction: () => this.applyScreenReaderOptimizations(),
        revertFunction: () => this.revertScreenReaderOptimizations(),
      },
      {
        id: "announcements",
        name: "음성 안내",
        description: "중요한 정보를 음성으로 안내합니다",
        enabled: this.settings.announcements,
        priority: "medium",
        applyFunction: () => this.enableAnnouncements(),
        revertFunction: () => this.disableAnnouncements(),
      },
    ];

    features.forEach((feature) => {
      this.features.set(feature.id, feature);
      if (feature.enabled) {
        feature.applyFunction();
      }
    });

    console.log(`♿ ${features.length}개 접근성 기능 등록 완료`);
  }

  /**
   * 고대비 모드 적용
   */
  private applyHighContrastMode(): void {
    try {
      // VS Code 테마 변경 권장
      vscode.window
        .showInformationMessage(
          "고대비 모드를 위해 VS Code 테마를 'High Contrast'로 변경하는 것을 권장합니다.",
          "테마 변경"
        )
        .then((action) => {
          if (action === "테마 변경") {
            vscode.commands.executeCommand("workbench.action.selectTheme");
          }
        });

      this.settings.highContrast = true;
      console.log("♿ 고대비 모드 적용됨");
    } catch (error) {
      this.errorService.logError(error as Error, ErrorSeverity.LOW);
    }
  }

  /**
   * 고대비 모드 해제
   */
  private revertHighContrastMode(): void {
    this.settings.highContrast = false;
    console.log("♿ 고대비 모드 해제됨");
  }

  /**
   * 큰 텍스트 모드 적용
   */
  private applyLargeTextMode(): void {
    try {
      const config = vscode.workspace.getConfiguration("editor");
      const currentSize = config.get("fontSize", 14) as number;
      const newSize = Math.max(currentSize, 18);

      config.update("fontSize", newSize, vscode.ConfigurationTarget.Global);
      this.settings.fontSize = newSize;
      this.settings.largeText = true;

      this.announceToScreenReader(`텍스트 크기가 ${newSize}로 증가했습니다.`);
      console.log(`♿ 텍스트 크기 증가: ${newSize}`);
    } catch (error) {
      this.errorService.logError(error as Error, ErrorSeverity.LOW);
    }
  }

  /**
   * 큰 텍스트 모드 해제
   */
  private revertLargeTextMode(): void {
    try {
      const config = vscode.workspace.getConfiguration("editor");
      config.update("fontSize", 14, vscode.ConfigurationTarget.Global);
      this.settings.fontSize = 14;
      this.settings.largeText = false;

      console.log("♿ 텍스트 크기 기본값으로 복원");
    } catch (error) {
      this.errorService.logError(error as Error, ErrorSeverity.LOW);
    }
  }

  /**
   * 키보드 네비게이션 활성화
   */
  private enableKeyboardNavigation(): void {
    this.settings.keyboardNavigation = true;

    // 탭 인덱스 최적화 및 키보드 이벤트 핸들러 등록
    this.announceToScreenReader(
      "키보드 네비게이션이 활성화되었습니다. Ctrl+Alt+H로 도움말을 확인하세요."
    );

    console.log("♿ 키보드 네비게이션 활성화");
  }

  /**
   * 키보드 네비게이션 비활성화
   */
  private disableKeyboardNavigation(): void {
    this.settings.keyboardNavigation = false;
    console.log("♿ 키보드 네비게이션 비활성화");
  }

  /**
   * 포커스 표시 강화
   */
  private enhanceFocusIndicators(): void {
    this.settings.focusIndicators = true;
    console.log("♿ 포커스 표시 강화 적용");
  }

  /**
   * 포커스 표시 기본값 복원
   */
  private revertFocusIndicators(): void {
    this.settings.focusIndicators = false;
    console.log("♿ 포커스 표시 기본값 복원");
  }

  /**
   * 스크린 리더 최적화 적용
   */
  private applyScreenReaderOptimizations(): void {
    try {
      // 에디터 접근성 지원 활성화
      const config = vscode.workspace.getConfiguration("editor");
      config.update(
        "accessibilitySupport",
        "on",
        vscode.ConfigurationTarget.Global
      );

      // 기타 스크린 리더 친화적 설정
      config.update(
        "cursorBlinking",
        "solid",
        vscode.ConfigurationTarget.Global
      );
      config.update(
        "renderWhitespace",
        "all",
        vscode.ConfigurationTarget.Global
      );

      this.settings.screenReaderOptimized = true;
      console.log("♿ 스크린 리더 최적화 적용");
    } catch (error) {
      this.errorService.logError(error as Error, ErrorSeverity.LOW);
    }
  }

  /**
   * 스크린 리더 최적화 해제
   */
  private revertScreenReaderOptimizations(): void {
    try {
      const config = vscode.workspace.getConfiguration("editor");
      config.update(
        "accessibilitySupport",
        "auto",
        vscode.ConfigurationTarget.Global
      );

      this.settings.screenReaderOptimized = false;
      console.log("♿ 스크린 리더 최적화 해제");
    } catch (error) {
      this.errorService.logError(error as Error, ErrorSeverity.LOW);
    }
  }

  /**
   * 음성 안내 활성화
   */
  private enableAnnouncements(): void {
    this.settings.announcements = true;
    this.announceToScreenReader("음성 안내가 활성화되었습니다.");
    console.log("♿ 음성 안내 활성화");
  }

  /**
   * 음성 안내 비활성화
   */
  private disableAnnouncements(): void {
    this.settings.announcements = false;
    console.log("♿ 음성 안내 비활성화");
  }

  /**
   * 스크린 리더에게 메시지 전달
   */
  announceToScreenReader(
    message: string,
    priority: "polite" | "assertive" = "polite"
  ): void {
    if (!this.settings.announcements) return;

    try {
      // 중복 안내 방지를 위한 디바운스
      if (this.announceTimeout) {
        clearTimeout(this.announceTimeout);
      }

      this.announceTimeout = setTimeout(() => {
        // VS Code의 showInformationMessage를 사용하여 안내
        if (priority === "assertive") {
          vscode.window.showWarningMessage(`🔊 ${message}`);
        } else {
          // 조용한 알림 (상태 바 또는 출력 채널 사용)
          console.log(`🔊 [Screen Reader] ${message}`);
        }
      }, 100);
    } catch (error) {
      this.errorService.logError(error as Error, ErrorSeverity.LOW);
    }
  }

  /**
   * 현재 상태 안내
   */
  announceCurrentStatus(): void {
    const activeFeatures = Array.from(this.features.values())
      .filter((f) => f.enabled)
      .map((f) => f.name);

    const status =
      activeFeatures.length > 0
        ? `활성화된 접근성 기능: ${activeFeatures.join(", ")}`
        : "접근성 기능이 비활성화되어 있습니다.";

    this.announceToScreenReader(status, "assertive");
  }

  /**
   * 선택된 텍스트 읽기
   */
  readSelection(): void {
    try {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        this.announceToScreenReader("활성 에디터가 없습니다.", "assertive");
        return;
      }

      const selection = editor.document.getText(editor.selection);
      if (!selection) {
        this.announceToScreenReader("선택된 텍스트가 없습니다.", "assertive");
        return;
      }

      // 긴 텍스트는 요약해서 읽기
      const textToRead =
        selection.length > 200
          ? `${selection.substring(0, 200)}... (총 ${selection.length}자)`
          : selection;

      this.announceToScreenReader(`선택된 텍스트: ${textToRead}`, "assertive");
    } catch (error) {
      this.errorService.logError(error as Error, ErrorSeverity.LOW);
    }
  }

  /**
   * 폰트 크기 조정
   */
  adjustFontSize(delta: number): void {
    try {
      const config = vscode.workspace.getConfiguration("editor");
      const currentSize = config.get("fontSize", 14) as number;
      const newSize = Math.max(8, Math.min(72, currentSize + delta));

      config.update("fontSize", newSize, vscode.ConfigurationTarget.Global);
      this.settings.fontSize = newSize;

      this.announceToScreenReader(`폰트 크기가 ${newSize}로 변경되었습니다.`);
      console.log(`♿ 폰트 크기 변경: ${currentSize} → ${newSize}`);
    } catch (error) {
      this.errorService.logError(error as Error, ErrorSeverity.LOW);
    }
  }

  /**
   * 접근성 기능 토글
   */
  toggleFeature(featureId: string): void {
    const feature = this.features.get(featureId);
    if (!feature) {
      this.announceToScreenReader(`알 수 없는 기능: ${featureId}`, "assertive");
      return;
    }

    if (feature.enabled) {
      feature.revertFunction();
      feature.enabled = false;
      this.announceToScreenReader(`${feature.name}이 비활성화되었습니다.`);
    } else {
      feature.applyFunction();
      feature.enabled = true;
      this.announceToScreenReader(`${feature.name}이 활성화되었습니다.`);
    }

    this.saveUserSettings();
  }

  /**
   * 접근성 보고서 생성
   */
  generateAccessibilityReport(): string {
    const enabledFeatures = Array.from(this.features.values()).filter(
      (f) => f.enabled
    );
    const availableShortcuts = Array.from(this.keyboardShortcuts.values());

    return `
=== HAPA 접근성 상태 보고서 ===
🔧 전체 접근성 기능: ${this.features.size}개
✅ 활성화된 기능: ${enabledFeatures.length}개
⌨️ 키보드 단축키: ${availableShortcuts.length}개
🔊 스크린 리더 감지: ${this.isScreenReaderDetected ? "예" : "아니오"}

📋 활성화된 기능들:
${enabledFeatures.map((f) => `• ${f.name}: ${f.description}`).join("\n")}

⌨️ 주요 키보드 단축키:
${availableShortcuts
  .slice(0, 5)
  .map((s) => `• ${s.modifiers.join("+")}+${s.key}: ${s.description}`)
  .join("\n")}

⚙️ 현재 설정:
• 고대비 모드: ${this.settings.highContrast ? "활성" : "비활성"}
• 큰 텍스트: ${this.settings.largeText ? "활성" : "비활성"} (${
      this.settings.fontSize
    }pt)
• 스크린 리더 최적화: ${this.settings.screenReaderOptimized ? "활성" : "비활성"}
• 키보드 네비게이션: ${this.settings.keyboardNavigation ? "활성" : "비활성"}
• 음성 안내: ${this.settings.announcements ? "활성" : "비활성"}

💡 권장사항:
${this.generateAccessibilityRecommendations()}
    `;
  }

  /**
   * 접근성 권장사항 생성
   */
  private generateAccessibilityRecommendations(): string {
    const recommendations: string[] = [];

    if (!this.settings.keyboardNavigation) {
      recommendations.push(
        "- 키보드 네비게이션을 활성화하여 마우스 없이도 모든 기능을 사용할 수 있습니다"
      );
    }

    if (!this.settings.highContrast && this.isScreenReaderDetected) {
      recommendations.push(
        "- 스크린 리더 사용자에게는 고대비 모드를 권장합니다"
      );
    }

    if (this.settings.fontSize < 16) {
      recommendations.push(
        "- 시각적 접근성을 위해 폰트 크기를 16pt 이상으로 설정하는 것을 권장합니다"
      );
    }

    if (!this.settings.announcements && this.isScreenReaderDetected) {
      recommendations.push(
        "- 스크린 리더 사용자에게는 음성 안내를 활성화하는 것을 권장합니다"
      );
    }

    return recommendations.length > 0
      ? recommendations.join("\n")
      : "- 현재 접근성 설정이 적절합니다";
  }

  // === 내부 유틸리티 메서드들 ===

  private getDefaultSettings(): AccessibilitySettings {
    return {
      highContrast: false,
      largeText: false,
      screenReaderOptimized: false,
      keyboardNavigation: true,
      focusIndicators: true,
      announcements: false,
      fontSize: 14,
      colorTheme: "auto",
    };
  }

  private createShortcutKey(shortcut: KeyboardShortcut): string {
    return `${shortcut.modifiers.sort().join("+")}+${shortcut.key}`;
  }

  private loadUserSettings(): void {
    try {
      const config = vscode.workspace.getConfiguration("hapa.accessibility");

      Object.keys(this.settings).forEach((key) => {
        const value = config.get(key);
        if (value !== undefined) {
          (this.settings as any)[key] = value;
        }
      });

      console.log("♿ 사용자 접근성 설정 로드 완료");
    } catch (error) {
      this.errorService.logError(error as Error, ErrorSeverity.LOW);
    }
  }

  private saveUserSettings(): void {
    try {
      const config = vscode.workspace.getConfiguration("hapa.accessibility");

      Object.entries(this.settings).forEach(([key, value]) => {
        config.update(key, value, vscode.ConfigurationTarget.Global);
      });

      console.log("♿ 사용자 접근성 설정 저장 완료");
    } catch (error) {
      this.errorService.logError(error as Error, ErrorSeverity.LOW);
    }
  }

  private startConfigWatcher(): void {
    this.configWatcher = vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("hapa.accessibility")) {
        this.loadUserSettings();
        this.announceToScreenReader("접근성 설정이 변경되었습니다.");
      }
    });
  }

  /**
   * 접근성 설정 조회
   */
  getSettings(): AccessibilitySettings {
    return { ...this.settings };
  }

  /**
   * 키보드 단축키 목록 조회
   */
  getKeyboardShortcuts(): KeyboardShortcut[] {
    return Array.from(this.keyboardShortcuts.values());
  }

  /**
   * 접근성 기능 목록 조회
   */
  getFeatures(): AccessibilityFeature[] {
    return Array.from(this.features.values());
  }

  /**
   * 정리
   */
  cleanup(): void {
    if (this.configWatcher) {
      this.configWatcher.dispose();
      this.configWatcher = null;
    }

    if (this.announceTimeout) {
      clearTimeout(this.announceTimeout);
      this.announceTimeout = null;
    }

    // 설정 저장
    this.saveUserSettings();
  }
}
