"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponsiveDesignService = void 0;
const vscode = __importStar(require("vscode"));
const EnhancedErrorService_1 = require("./EnhancedErrorService");
class ResponsiveDesignService {
    static instance;
    errorService = EnhancedErrorService_1.EnhancedErrorService.getInstance();
    // 뷰포트 및 레이아웃 관리
    currentViewport;
    currentLayout = {
        id: "hapa-main-layout",
        name: "HAPA 메인 레이아웃",
        breakpoints: [],
        currentBreakpoint: "medium",
        isAdaptive: true,
    };
    adaptiveComponents = new Map();
    // 브레이크포인트 시스템
    breakpoints = new Map();
    currentBreakpoint = "medium";
    // 반응형 설정
    isResponsiveEnabled = true;
    adaptationThreshold = 50; // px
    debounceDelay = 150; // ms
    // 상태 관리
    resizeObserver = null;
    resizeTimeout = null;
    layoutMetrics;
    // 설정 감시
    configWatcher = null;
    static getInstance() {
        if (!ResponsiveDesignService.instance) {
            ResponsiveDesignService.instance = new ResponsiveDesignService();
        }
        return ResponsiveDesignService.instance;
    }
    constructor() {
        this.currentViewport = this.getInitialViewport();
        this.layoutMetrics = this.initializeLayoutMetrics();
        this.initializeResponsiveDesign();
    }
    /**
     * 반응형 디자인 서비스 초기화
     */
    async initializeResponsiveDesign() {
        try {
            // 기본 브레이크포인트 설정
            this.setupDefaultBreakpoints();
            // 기본 레이아웃 생성
            this.createDefaultLayout();
            // 반응형 컴포넌트 등록
            this.registerAdaptiveComponents();
            // 뷰포트 변화 감시 시작
            this.startViewportMonitoring();
            // 설정 변경 감시
            this.startConfigWatcher();
            // 초기 레이아웃 적용
            await this.applyResponsiveLayout();
            console.log("📱 ResponsiveDesignService 초기화 완료");
        }
        catch (error) {
            this.errorService.logError(error, EnhancedErrorService_1.ErrorSeverity.MEDIUM, {
                component: "ResponsiveDesignService",
                phase: "initialization",
            });
        }
    }
    /**
     * 기본 브레이크포인트 설정
     */
    setupDefaultBreakpoints() {
        const defaultBreakpoints = [
            {
                name: "mobile",
                minWidth: 0,
                maxWidth: 480,
                columns: 1,
                fontSize: 12,
                spacing: 8,
                layoutMode: "compact",
            },
            {
                name: "tablet",
                minWidth: 481,
                maxWidth: 768,
                columns: 2,
                fontSize: 13,
                spacing: 12,
                layoutMode: "compact",
            },
            {
                name: "small",
                minWidth: 769,
                maxWidth: 1024,
                columns: 2,
                fontSize: 14,
                spacing: 16,
                layoutMode: "normal",
            },
            {
                name: "medium",
                minWidth: 1025,
                maxWidth: 1440,
                columns: 3,
                fontSize: 14,
                spacing: 20,
                layoutMode: "normal",
            },
            {
                name: "large",
                minWidth: 1441,
                maxWidth: 1920,
                columns: 4,
                fontSize: 15,
                spacing: 24,
                layoutMode: "spacious",
            },
            {
                name: "xlarge",
                minWidth: 1921,
                columns: 5,
                fontSize: 16,
                spacing: 32,
                layoutMode: "spacious",
            },
        ];
        defaultBreakpoints.forEach((bp) => {
            this.breakpoints.set(bp.name, bp);
        });
        console.log(`📱 ${defaultBreakpoints.length}개 브레이크포인트 설정 완료`);
    }
    /**
     * 기본 레이아웃 생성
     */
    createDefaultLayout() {
        this.currentLayout = {
            id: "hapa-main-layout",
            name: "HAPA 메인 레이아웃",
            breakpoints: Array.from(this.breakpoints.values()),
            currentBreakpoint: this.currentBreakpoint,
            isAdaptive: true,
        };
    }
    /**
     * 적응형 컴포넌트 등록
     */
    registerAdaptiveComponents() {
        const components = [
            {
                id: "hapa-sidebar",
                type: "sidebar",
                priority: 1,
                minWidth: 250,
                preferredWidth: 350,
                collapsible: true,
                hideable: false,
                currentState: "visible",
            },
            {
                id: "hapa-main-content",
                type: "content",
                priority: 10,
                minWidth: 400,
                preferredWidth: 600,
                collapsible: false,
                hideable: false,
                currentState: "visible",
            },
            {
                id: "hapa-toolbar",
                type: "toolbar",
                priority: 5,
                minWidth: 200,
                preferredWidth: 300,
                collapsible: true,
                hideable: true,
                currentState: "visible",
            },
            {
                id: "hapa-properties-panel",
                type: "panel",
                priority: 3,
                minWidth: 200,
                preferredWidth: 280,
                collapsible: true,
                hideable: true,
                currentState: "visible",
            },
            {
                id: "hapa-output-panel",
                type: "panel",
                priority: 4,
                minWidth: 250,
                preferredWidth: 350,
                collapsible: true,
                hideable: true,
                currentState: "visible",
            },
        ];
        components.forEach((component) => {
            this.adaptiveComponents.set(component.id, component);
        });
        console.log(`📱 ${components.length}개 적응형 컴포넌트 등록 완료`);
    }
    /**
     * 뷰포트 변화 감시 시작
     */
    startViewportMonitoring() {
        // VS Code 창 크기 변화 감지는 제한적이므로 설정 기반 접근
        this.updateViewportFromConfig();
        // 주기적 뷰포트 업데이트 (실제 환경에서는 웹뷰 이벤트 사용)
        setInterval(() => {
            this.updateViewportFromConfig();
        }, 5000);
    }
    /**
     * 설정에서 뷰포트 정보 업데이트
     */
    updateViewportFromConfig() {
        try {
            // VS Code 설정에서 추정 가능한 뷰포트 정보
            const config = vscode.workspace.getConfiguration();
            const editorFontSize = config.get("editor.fontSize", 14);
            const workbenchSideBarLocation = config.get("workbench.sideBar.location", "left");
            // 폰트 크기를 기반으로 뷰포트 크기 추정
            let estimatedWidth = 1200; // 기본값
            if (editorFontSize > 16) {
                estimatedWidth = 1600; // 큰 폰트 = 큰 화면 추정
            }
            else if (editorFontSize < 12) {
                estimatedWidth = 800; // 작은 폰트 = 작은 화면 추정
            }
            this.updateViewport({
                width: estimatedWidth,
                height: Math.floor(estimatedWidth * 0.6), // 16:10 비율 가정
                scale: 1,
            });
        }
        catch (error) {
            this.errorService.logError(error, EnhancedErrorService_1.ErrorSeverity.LOW);
        }
    }
    /**
     * 뷰포트 업데이트
     */
    updateViewport(newViewport) {
        const previousViewport = { ...this.currentViewport };
        this.currentViewport = newViewport;
        // 변화량이 임계값을 초과할 때만 처리
        const widthDiff = Math.abs(newViewport.width - previousViewport.width);
        if (widthDiff > this.adaptationThreshold) {
            this.debounceLayoutUpdate();
        }
        // 메트릭 업데이트
        this.updateLayoutMetrics();
    }
    /**
     * 디바운싱된 레이아웃 업데이트
     */
    debounceLayoutUpdate() {
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }
        this.resizeTimeout = setTimeout(() => {
            this.applyResponsiveLayout();
        }, this.debounceDelay);
    }
    /**
     * 반응형 레이아웃 적용
     */
    async applyResponsiveLayout() {
        if (!this.isResponsiveEnabled) {
            return;
        }
        try {
            // 현재 뷰포트에 맞는 브레이크포인트 찾기
            const newBreakpoint = this.findMatchingBreakpoint(this.currentViewport.width);
            if (newBreakpoint !== this.currentBreakpoint) {
                const previousBreakpoint = this.currentBreakpoint;
                this.currentBreakpoint = newBreakpoint;
                // 브레이크포인트 변경 이벤트
                await this.onBreakpointChange(previousBreakpoint, newBreakpoint);
            }
            // 컴포넌트들 적응
            await this.adaptComponents();
            // 레이아웃 검증
            this.validateLayout();
            console.log(`📱 반응형 레이아웃 적용: ${this.currentBreakpoint} (${this.currentViewport.width}px)`);
        }
        catch (error) {
            this.errorService.logError(error, EnhancedErrorService_1.ErrorSeverity.MEDIUM, {
                viewport: this.currentViewport,
                breakpoint: this.currentBreakpoint,
            });
        }
    }
    /**
     * 브레이크포인트 찾기
     */
    findMatchingBreakpoint(width) {
        for (const [name, config] of this.breakpoints.entries()) {
            if (width >= config.minWidth &&
                (config.maxWidth === undefined || width <= config.maxWidth)) {
                return name;
            }
        }
        return "medium"; // 기본값
    }
    /**
     * 브레이크포인트 변경 처리
     */
    async onBreakpointChange(previous, current) {
        const currentConfig = this.breakpoints.get(current);
        if (!currentConfig) {
            return;
        }
        // VS Code 설정 업데이트 제안
        if (currentConfig.fontSize !== 14) {
            const shouldUpdate = await vscode.window.showInformationMessage(`화면 크기가 변경되어 폰트 크기를 ${currentConfig.fontSize}pt로 조정하는 것을 권장합니다.`, "적용", "무시");
            if (shouldUpdate === "적용") {
                const config = vscode.workspace.getConfiguration("editor");
                await config.update("fontSize", currentConfig.fontSize, vscode.ConfigurationTarget.Global);
            }
        }
        // 레이아웃 모드 변경 안내
        if (currentConfig.layoutMode === "compact") {
            vscode.window.showInformationMessage("📱 소형 화면이 감지되어 컴팩트 레이아웃으로 전환됩니다.");
        }
        console.log(`📱 브레이크포인트 변경: ${previous} → ${current}`);
    }
    /**
     * 컴포넌트 적응
     */
    async adaptComponents() {
        const currentConfig = this.breakpoints.get(this.currentBreakpoint);
        if (!currentConfig) {
            return;
        }
        const availableWidth = this.currentViewport.width;
        const components = Array.from(this.adaptiveComponents.values()).sort((a, b) => b.priority - a.priority); // 우선순위 순 정렬
        let usedWidth = 0;
        let adaptationCount = 0;
        for (const component of components) {
            const requiredWidth = usedWidth + component.minWidth;
            if (requiredWidth > availableWidth) {
                // 공간 부족 - 적응 전략 적용
                const adapted = await this.adaptComponent(component, availableWidth - usedWidth);
                if (adapted) {
                    adaptationCount++;
                }
            }
            else {
                // 충분한 공간 - 원하는 크기로 설정
                component.currentState = "visible";
                usedWidth += component.preferredWidth;
            }
        }
        this.layoutMetrics.usedWidth = usedWidth;
        this.layoutMetrics.adaptationCount = adaptationCount;
    }
    /**
     * 개별 컴포넌트 적응
     */
    async adaptComponent(component, availableSpace) {
        // 우선순위가 높은 컴포넌트는 보존
        if (component.priority >= 8) {
            component.currentState = "visible";
            return false;
        }
        // 최소 공간도 없으면 숨김
        if (availableSpace < component.minWidth) {
            if (component.hideable) {
                component.currentState = "hidden";
                return true;
            }
        }
        // 충분한 공간이 없으면 축소
        if (availableSpace < component.preferredWidth) {
            if (component.collapsible) {
                component.currentState = "collapsed";
                return true;
            }
        }
        return false;
    }
    /**
     * 레이아웃 검증
     */
    validateLayout() {
        const totalMinWidth = Array.from(this.adaptiveComponents.values())
            .filter((c) => c.currentState !== "hidden")
            .reduce((sum, c) => sum + c.minWidth, 0);
        if (totalMinWidth > this.currentViewport.width) {
            console.warn(`📱 레이아웃 경고: 최소 너비(${totalMinWidth}px)가 뷰포트(${this.currentViewport.width}px)를 초과`);
            // 강제 적응
            this.forceCompactLayout();
        }
    }
    /**
     * 강제 컴팩트 레이아웃
     */
    forceCompactLayout() {
        let criticalComponents = ["hapa-main-content"];
        for (const [id, component] of this.adaptiveComponents.entries()) {
            if (!criticalComponents.includes(id) && component.hideable) {
                component.currentState = "hidden";
            }
            else if (component.collapsible) {
                component.currentState = "collapsed";
            }
        }
        vscode.window.showWarningMessage("화면 공간이 부족하여 일부 패널이 숨겨졌습니다. 뷰를 확장하거나 패널을 수동으로 조정해주세요.");
    }
    /**
     * 반응형 CSS 생성
     */
    generateResponsiveCSS() {
        const currentConfig = this.breakpoints.get(this.currentBreakpoint);
        if (!currentConfig) {
            return "";
        }
        return `
/* HAPA 반응형 스타일 - ${this.currentBreakpoint} */
:root {
  --hapa-grid-columns: ${currentConfig.columns};
  --hapa-font-size: ${currentConfig.fontSize}px;
  --hapa-spacing: ${currentConfig.spacing}px;
  --hapa-layout-mode: ${currentConfig.layoutMode};
}

.hapa-container {
  font-size: var(--hapa-font-size);
  padding: var(--hapa-spacing);
}

.hapa-grid {
  display: grid;
  grid-template-columns: repeat(var(--hapa-grid-columns), 1fr);
  gap: var(--hapa-spacing);
}

.hapa-component {
  transition: all 0.3s ease;
}

.hapa-component[data-state="collapsed"] {
  max-width: 200px;
  overflow: hidden;
}

.hapa-component[data-state="hidden"] {
  display: none;
}

/* 레이아웃 모드별 스타일 */
.hapa-layout-compact {
  --hapa-spacing: calc(var(--hapa-spacing) * 0.75);
}

.hapa-layout-compact .hapa-component {
  padding: calc(var(--hapa-spacing) * 0.5);
}

.hapa-layout-spacious {
  --hapa-spacing: calc(var(--hapa-spacing) * 1.25);
}

.hapa-layout-spacious .hapa-component {
  padding: calc(var(--hapa-spacing) * 0.75);
}

/* 브레이크포인트별 미디어 쿼리 */
@media (max-width: 480px) {
  .hapa-mobile-hide { display: none !important; }
  .hapa-mobile-collapse { max-width: 150px !important; }
}

@media (min-width: 481px) and (max-width: 768px) {
  .hapa-tablet-hide { display: none !important; }
  .hapa-tablet-collapse { max-width: 200px !important; }
}

@media (min-width: 1441px) {
  .hapa-large-expand { 
    padding: calc(var(--hapa-spacing) * 1.5);
    margin: calc(var(--hapa-spacing) * 0.5);
  }
}
    `;
    }
    /**
     * 반응형 상태 보고서 생성
     */
    generateResponsiveReport() {
        const currentConfig = this.breakpoints.get(this.currentBreakpoint);
        const visibleComponents = Array.from(this.adaptiveComponents.values()).filter((c) => c.currentState === "visible");
        const hiddenComponents = Array.from(this.adaptiveComponents.values()).filter((c) => c.currentState === "hidden");
        const collapsedComponents = Array.from(this.adaptiveComponents.values()).filter((c) => c.currentState === "collapsed");
        return `
=== HAPA 반응형 디자인 상태 보고서 ===
📱 현재 뷰포트: ${this.currentViewport.width} × ${this.currentViewport.height}px
📐 활성 브레이크포인트: ${this.currentBreakpoint}
🎨 레이아웃 모드: ${currentConfig?.layoutMode || "unknown"}
📊 콘텐츠 밀도: ${this.layoutMetrics.contentDensity}

🖥️ 브레이크포인트 설정:
${Array.from(this.breakpoints.entries())
            .map(([name, config]) => `${name === this.currentBreakpoint ? "→" : " "} ${name}: ${config.minWidth}px+ (${config.columns}열, ${config.fontSize}pt)`)
            .join("\n")}

📦 컴포넌트 상태:
✅ 표시됨 (${visibleComponents.length}개):
${visibleComponents
            .map((c) => `  • ${c.id} (우선순위: ${c.priority})`)
            .join("\n")}

📄 축소됨 (${collapsedComponents.length}개):
${collapsedComponents.map((c) => `  • ${c.id}`).join("\n")}

🚫 숨겨짐 (${hiddenComponents.length}개):
${hiddenComponents.map((c) => `  • ${c.id}`).join("\n")}

📈 레이아웃 메트릭:
• 사용 가능한 너비: ${this.layoutMetrics.availableWidth}px
• 사용된 너비: ${this.layoutMetrics.usedWidth}px
• 적응 횟수: ${this.layoutMetrics.adaptationCount}회
• 활용률: ${((this.layoutMetrics.usedWidth / this.layoutMetrics.availableWidth) *
            100).toFixed(1)}%

💡 최적화 제안:
${this.generateOptimizationSuggestions()}
    `;
    }
    /**
     * 최적화 제안 생성
     */
    generateOptimizationSuggestions() {
        const suggestions = [];
        const utilization = (this.layoutMetrics.usedWidth / this.layoutMetrics.availableWidth) * 100;
        if (utilization < 60) {
            suggestions.push("- 화면 공간이 충분합니다. 더 많은 정보를 표시하거나 폰트 크기를 키워보세요");
        }
        if (utilization > 90) {
            suggestions.push("- 화면이 매우 밀집되어 있습니다. 일부 패널을 숨기거나 축소하는 것을 고려하세요");
        }
        if (this.layoutMetrics.adaptationCount > 3) {
            suggestions.push("- 많은 컴포넌트가 적응되었습니다. 더 큰 화면을 사용하면 더 나은 경험을 얻을 수 있습니다");
        }
        const hiddenCount = Array.from(this.adaptiveComponents.values()).filter((c) => c.currentState === "hidden").length;
        if (hiddenCount > 2) {
            suggestions.push(`- ${hiddenCount}개 패널이 숨겨져 있습니다. 메뉴에서 수동으로 표시할 수 있습니다`);
        }
        return suggestions.length > 0
            ? suggestions.join("\n")
            : "- 현재 레이아웃이 최적화되어 있습니다";
    }
    /**
     * 수동 레이아웃 조정
     */
    adjustComponentState(componentId, newState) {
        const component = this.adaptiveComponents.get(componentId);
        if (!component) {
            vscode.window.showErrorMessage(`알 수 없는 컴포넌트: ${componentId}`);
            return;
        }
        // 상태 변경 가능성 검사
        if (newState === "collapsed" && !component.collapsible) {
            vscode.window.showWarningMessage(`${componentId}는 축소할 수 없습니다.`);
            return;
        }
        if (newState === "hidden" && !component.hideable) {
            vscode.window.showWarningMessage(`${componentId}는 숨길 수 없습니다.`);
            return;
        }
        component.currentState = newState;
        this.updateLayoutMetrics();
        vscode.window.showInformationMessage(`${componentId} 상태가 ${newState}로 변경되었습니다.`);
    }
    /**
     * 브레이크포인트 강제 설정
     */
    setBreakpoint(breakpointName) {
        if (!this.breakpoints.has(breakpointName)) {
            vscode.window.showErrorMessage(`알 수 없는 브레이크포인트: ${breakpointName}`);
            return;
        }
        this.currentBreakpoint = breakpointName;
        this.applyResponsiveLayout();
        vscode.window.showInformationMessage(`브레이크포인트가 ${breakpointName}로 강제 설정되었습니다.`);
    }
    // === 내부 유틸리티 메서드들 ===
    getInitialViewport() {
        return {
            width: 1200,
            height: 800,
            scale: 1,
        };
    }
    initializeLayoutMetrics() {
        return {
            viewportWidth: this.currentViewport.width,
            viewportHeight: this.currentViewport.height,
            availableWidth: this.currentViewport.width,
            usedWidth: 0,
            contentDensity: "medium",
            adaptationCount: 0,
        };
    }
    updateLayoutMetrics() {
        this.layoutMetrics.viewportWidth = this.currentViewport.width;
        this.layoutMetrics.viewportHeight = this.currentViewport.height;
        this.layoutMetrics.availableWidth = this.currentViewport.width;
        // 콘텐츠 밀도 계산
        const utilization = this.layoutMetrics.usedWidth / this.layoutMetrics.availableWidth;
        if (utilization > 0.8) {
            this.layoutMetrics.contentDensity = "high";
        }
        else if (utilization < 0.4) {
            this.layoutMetrics.contentDensity = "low";
        }
        else {
            this.layoutMetrics.contentDensity = "medium";
        }
    }
    startConfigWatcher() {
        this.configWatcher = vscode.workspace.onDidChangeConfiguration((event) => {
            if (event.affectsConfiguration("hapa.responsive")) {
                this.loadResponsiveSettings();
            }
            if (event.affectsConfiguration("editor.fontSize")) {
                this.updateViewportFromConfig();
            }
        });
    }
    loadResponsiveSettings() {
        try {
            const config = vscode.workspace.getConfiguration("hapa.responsive");
            this.isResponsiveEnabled = config.get("enabled", true);
            this.adaptationThreshold = config.get("adaptationThreshold", 50);
            this.debounceDelay = config.get("debounceDelay", 150);
            console.log("📱 반응형 설정 로드 완료");
        }
        catch (error) {
            this.errorService.logError(error, EnhancedErrorService_1.ErrorSeverity.LOW);
        }
    }
    /**
     * 반응형 기능 활성화/비활성화
     */
    setResponsiveEnabled(enabled) {
        this.isResponsiveEnabled = enabled;
        if (enabled) {
            this.applyResponsiveLayout();
            vscode.window.showInformationMessage("📱 반응형 디자인이 활성화되었습니다.");
        }
        else {
            // 모든 컴포넌트를 기본 상태로 복원
            this.adaptiveComponents.forEach((component) => {
                component.currentState = "visible";
            });
            vscode.window.showInformationMessage("📱 반응형 디자인이 비활성화되었습니다.");
        }
    }
    /**
     * 현재 상태 조회
     */
    getCurrentState() {
        return {
            viewport: this.currentViewport,
            breakpoint: this.currentBreakpoint,
            layout: this.currentLayout,
            metrics: this.layoutMetrics,
            isEnabled: this.isResponsiveEnabled,
            components: Array.from(this.adaptiveComponents.values()),
        };
    }
    /**
     * 정리
     */
    cleanup() {
        if (this.configWatcher) {
            this.configWatcher.dispose();
            this.configWatcher = null;
        }
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = null;
        }
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
    }
}
exports.ResponsiveDesignService = ResponsiveDesignService;
//# sourceMappingURL=ResponsiveDesignService.js.map