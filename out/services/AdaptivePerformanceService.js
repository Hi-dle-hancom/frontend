"use strict";
/**
 * 적응형 성능 제한기 - VSCode Extension 프론트엔드
 * 요청 복잡도에 따른 동적 성능 제한 및 최적화
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.adaptivePerformanceLimiter = exports.AdaptivePerformanceLimiter = exports.RequestComplexityAnalyzer = exports.ComplexityLevel = void 0;
var ComplexityLevel;
(function (ComplexityLevel) {
    ComplexityLevel["SIMPLE"] = "simple";
    ComplexityLevel["MEDIUM"] = "medium";
    ComplexityLevel["COMPLEX"] = "complex";
})(ComplexityLevel || (exports.ComplexityLevel = ComplexityLevel = {}));
/**
 * 요청 복잡도 분석기
 */
class RequestComplexityAnalyzer {
    simplePatterns = [
        /출력/g,
        /print/g,
        /hello\s+world/gi,
        /간단한?/g,
        /기본/g,
        /보여줘?/g,
        /나타내/g,
    ];
    mediumPatterns = [
        /함수/g,
        /def\s+/g,
        /function/g,
        /계산/g,
        /처리/g,
        /로직/g,
        /if\s+/g,
        /for\s+/g,
        /while\s+/g,
        /리스트/g,
        /딕셔너리/g,
    ];
    complexPatterns = [
        /클래스/g,
        /class\s+/g,
        /알고리즘/g,
        /최적화/g,
        /데이터\s?구조/g,
        /디자인\s?패턴/g,
        /상속/g,
        /다형성/g,
        /재귀/g,
        /복잡한?/g,
        /고급/g,
        /아키텍처/g,
    ];
    analyzeComplexity(context) {
        const text = `${context.prompt} ${context.hasContext ? "with_context" : ""}`.toLowerCase();
        let simpleScore = 0;
        let mediumScore = 0;
        let complexScore = 0;
        // 패턴 매칭 점수 계산
        this.simplePatterns.forEach((pattern) => {
            const matches = text.match(pattern);
            simpleScore += matches ? matches.length : 0;
        });
        this.mediumPatterns.forEach((pattern) => {
            const matches = text.match(pattern);
            mediumScore += matches ? matches.length * 2 : 0;
        });
        this.complexPatterns.forEach((pattern) => {
            const matches = text.match(pattern);
            complexScore += matches ? matches.length * 3 : 0;
        });
        // 텍스트 길이 기반 보정
        const textLength = context.prompt.length;
        if (textLength > 500) {
            complexScore += 3;
        }
        else if (textLength > 200) {
            mediumScore += 2;
        }
        else {
            simpleScore += 1;
        }
        // 컨텍스트 크기 보정
        if (context.hasContext && context.contextLength) {
            if (context.contextLength > 1000) {
                complexScore += 2;
            }
            else if (context.contextLength > 300) {
                mediumScore += 1;
            }
        }
        // 사용자 히스토리 기반 보정
        if (context.userHistory && context.userHistory.length > 5) {
            // 경험 있는 사용자는 복잡한 요청을 할 가능성이 높음
            complexScore += 1;
        }
        // 최고 점수의 복잡도 반환
        if (complexScore >= mediumScore && complexScore >= simpleScore) {
            return ComplexityLevel.COMPLEX;
        }
        else if (mediumScore >= simpleScore) {
            return ComplexityLevel.MEDIUM;
        }
        else {
            return ComplexityLevel.SIMPLE;
        }
    }
}
exports.RequestComplexityAnalyzer = RequestComplexityAnalyzer;
/**
 * 적응형 성능 제한기
 */
class AdaptivePerformanceLimiter {
    analyzer = new RequestComplexityAnalyzer();
    metrics = {
        totalRequests: 0,
        successfulRequests: 0,
        averageResponseTime: 0,
        averageChunkCount: 0,
        errorRate: 0,
        memoryUsage: 0,
        lastUpdated: Date.now(),
    };
    baseConfigs = {
        [ComplexityLevel.SIMPLE]: {
            maxChunks: 20,
            hardLimit: 50,
            warningThreshold: 15,
            emergencyThreshold: 40,
            maxBytes: 256 * 1024, // 256KB
            maxProcessingTime: 15000, // 15초
            minChunkSize: 5,
            batchSize: 3,
            timeoutMs: 5000,
            retryAttempts: 2,
        },
        [ComplexityLevel.MEDIUM]: {
            maxChunks: 50,
            hardLimit: 100,
            warningThreshold: 30,
            emergencyThreshold: 80,
            maxBytes: 512 * 1024, // 512KB
            maxProcessingTime: 30000, // 30초
            minChunkSize: 10,
            batchSize: 5,
            timeoutMs: 15000,
            retryAttempts: 3,
        },
        [ComplexityLevel.COMPLEX]: {
            maxChunks: 100,
            hardLimit: 200,
            warningThreshold: 60,
            emergencyThreshold: 150,
            maxBytes: 1024 * 1024, // 1MB
            maxProcessingTime: 60000, // 60초
            minChunkSize: 15,
            batchSize: 8,
            timeoutMs: 30000,
            retryAttempts: 5,
        },
    };
    currentLimits = null;
    currentComplexity = null;
    performanceHistory = [];
    /**
     * 요청 컨텍스트를 기반으로 성능 제한 계산
     */
    calculateLimits(context) {
        const complexity = this.analyzer.analyzeComplexity(context);
        let limits = { ...this.baseConfigs[complexity] };
        // 성능 히스토리 기반 동적 조정
        this.adjustBasedOnHistory(limits, complexity);
        // 시스템 리소스 기반 조정
        this.adjustBasedOnSystemLoad(limits);
        // 사용자 패턴 기반 조정
        this.adjustBasedOnUserPattern(limits, context);
        this.currentLimits = limits;
        this.currentComplexity = complexity;
        console.log(`🎯 적응형 성능 제한 계산 완료:`, {
            complexity: complexity,
            limits: limits,
            context: {
                promptLength: context.prompt.length,
                hasContext: context.hasContext,
                modelType: context.modelType,
            },
        });
        return limits;
    }
    /**
     * 성능 히스토리 기반 조정
     */
    adjustBasedOnHistory(limits, complexity) {
        const recentHistory = this.performanceHistory
            .filter((h) => h.complexity === complexity)
            .slice(-10);
        if (recentHistory.length < 3) {
            return;
        }
        const avgResponseTime = recentHistory.reduce((sum, h) => sum + h.responseTime, 0) /
            recentHistory.length;
        const successRate = recentHistory.filter((h) => h.success).length / recentHistory.length;
        // 성능이 좋으면 제한을 높이고, 나쁘면 낮춤
        const performanceMultiplier = successRate > 0.9 ? 1.2 : 0.8;
        const timeMultiplier = avgResponseTime < 2000 ? 1.1 : 0.9;
        limits.maxChunks = Math.round(limits.maxChunks * performanceMultiplier);
        limits.maxBytes = Math.round(limits.maxBytes * performanceMultiplier);
        limits.maxProcessingTime = Math.round(limits.maxProcessingTime * timeMultiplier);
        // 안전 범위 유지
        limits.maxChunks = Math.max(5, Math.min(200, limits.maxChunks));
        limits.maxBytes = Math.max(1024, Math.min(2097152, limits.maxBytes));
    }
    /**
     * 시스템 리소스 기반 조정
     */
    adjustBasedOnSystemLoad(limits) {
        // 메모리 사용량 확인 (근사치)
        const memoryUsage = this.estimateMemoryUsage();
        if (memoryUsage > 0.8) {
            // 메모리 사용량이 80% 이상인 경우 제한 강화
            limits.maxChunks = Math.max(limits.maxChunks * 0.7, 5);
            limits.maxBytes = Math.max(limits.maxBytes * 0.5, 128 * 1024);
            limits.batchSize = Math.max(limits.batchSize - 1, 1);
            console.log(`🧠 메모리 최적화를 위한 제한 강화`);
        }
        else if (memoryUsage < 0.3) {
            // 메모리 여유가 있는 경우 제한 완화
            limits.maxChunks = Math.min(limits.maxChunks * 1.2, limits.hardLimit);
            limits.batchSize = Math.min(limits.batchSize + 1, 15);
            console.log(`🚀 리소스 여유로 인한 제한 완화`);
        }
    }
    /**
     * 사용자 패턴 기반 조정
     */
    adjustBasedOnUserPattern(limits, context) {
        // 모델 타입별 최적화
        switch (context.modelType) {
            case "autocomplete":
                // 자동완성은 빠른 응답이 중요
                limits.maxProcessingTime *= 0.5;
                limits.timeoutMs *= 0.6;
                limits.minChunkSize = Math.max(limits.minChunkSize - 3, 3);
                break;
            case "prompt":
                // 프롬프트 기반은 품질이 중요
                limits.maxChunks = Math.min(limits.maxChunks * 1.3, limits.hardLimit);
                limits.maxProcessingTime *= 1.2;
                break;
            case "error_fix":
                // 오류 수정은 정확성이 중요
                limits.retryAttempts += 1;
                limits.minChunkSize += 5;
                break;
        }
        // 시간대 기반 조정 (선택적)
        const hour = new Date().getHours();
        if (hour >= 9 && hour <= 17) {
            // 업무 시간대는 더 엄격하게
            limits.maxProcessingTime *= 0.9;
            limits.timeoutMs *= 0.9;
        }
    }
    /**
     * 메모리 사용량 추정
     */
    estimateMemoryUsage() {
        try {
            // performance.memory API 사용 (Chrome/Edge에서 지원)
            if ("memory" in performance) {
                const memory = performance.memory;
                return memory.usedJSHeapSize / memory.jsHeapSizeLimit;
            }
            // 대안: 기본값 반환
            return 0.5; // 50%로 가정
        }
        catch (error) {
            console.warn("메모리 사용량 측정 실패:", error);
            return 0.5;
        }
    }
    /**
     * 요청 완료 후 성능 기록
     */
    recordPerformance(responseTime, chunkCount, success, errorDetails) {
        if (!this.currentComplexity) {
            return;
        }
        // 성능 히스토리 추가
        this.performanceHistory.push({
            timestamp: Date.now(),
            complexity: this.currentComplexity,
            responseTime,
            chunkCount,
            success,
        });
        // 히스토리 크기 제한 (최대 100개)
        if (this.performanceHistory.length > 100) {
            this.performanceHistory.splice(0, this.performanceHistory.length - 100);
        }
        // 메트릭 업데이트
        this.updateMetrics(responseTime, chunkCount, success);
        console.log(`📈 성능 기록 완료:`, {
            complexity: this.currentComplexity,
            responseTime: `${responseTime}ms`,
            chunkCount,
            success,
            errorDetails,
        });
    }
    /**
     * 메트릭 업데이트
     */
    updateMetrics(responseTime, chunkCount, success) {
        this.metrics.totalRequests++;
        if (success) {
            this.metrics.successfulRequests++;
        }
        // 이동 평균 계산
        const alpha = 0.1; // 지수 이동 평균 가중치
        this.metrics.averageResponseTime =
            this.metrics.averageResponseTime * (1 - alpha) + responseTime * alpha;
        this.metrics.averageChunkCount =
            this.metrics.averageChunkCount * (1 - alpha) + chunkCount * alpha;
        this.metrics.errorRate =
            1 - this.metrics.successfulRequests / this.metrics.totalRequests;
        this.metrics.memoryUsage = this.estimateMemoryUsage();
        this.metrics.lastUpdated = Date.now();
    }
    /**
     * 현재 성능 제한 반환
     */
    getCurrentLimits() {
        return this.currentLimits;
    }
    /**
     * 현재 복잡도 반환
     */
    getCurrentComplexity() {
        return this.currentComplexity;
    }
    /**
     * 성능 메트릭 반환
     */
    getMetrics() {
        return { ...this.metrics };
    }
    /**
     * 성능 진단 정보 반환
     */
    getDiagnostics() {
        // 복잡도별 최근 성능 분석
        const recentPerformance = Object.values(ComplexityLevel).map((complexity) => {
            const complexityHistory = this.performanceHistory
                .filter((h) => h.complexity === complexity)
                .slice(-20); // 최근 20개
            if (complexityHistory.length === 0) {
                return {
                    complexity,
                    avgResponseTime: 0,
                    successRate: 0,
                    requestCount: 0,
                };
            }
            const avgResponseTime = complexityHistory.reduce((sum, h) => sum + h.responseTime, 0) /
                complexityHistory.length;
            const successRate = complexityHistory.filter((h) => h.success).length /
                complexityHistory.length;
            return {
                complexity,
                avgResponseTime: Math.round(avgResponseTime),
                successRate: Math.round(successRate * 100) / 100,
                requestCount: complexityHistory.length,
            };
        });
        return {
            metrics: this.getMetrics(),
            currentLimits: this.currentLimits,
            currentComplexity: this.currentComplexity,
            historySize: this.performanceHistory.length,
            recentPerformance,
        };
    }
    /**
     * 성능 경고 확인
     */
    checkPerformanceWarnings() {
        const warnings = [];
        const limits = this.currentLimits;
        if (!limits) {
            return warnings;
        }
        // 응답 시간 경고
        if (this.metrics.averageResponseTime > limits.maxProcessingTime * 0.8) {
            warnings.push(`응답 시간이 길어지고 있습니다 (평균: ${Math.round(this.metrics.averageResponseTime)}ms)`);
        }
        // 오류율 경고
        if (this.metrics.errorRate > 0.2) {
            warnings.push(`오류율이 높습니다 (${Math.round(this.metrics.errorRate * 100)}%)`);
        }
        // 메모리 사용량 경고
        if (this.metrics.memoryUsage > 0.8) {
            warnings.push(`메모리 사용량이 높습니다 (${Math.round(this.metrics.memoryUsage * 100)}%)`);
        }
        // 청크 수 경고
        if (this.metrics.averageChunkCount > limits.warningThreshold) {
            warnings.push(`청크 수가 많습니다 (평균: ${Math.round(this.metrics.averageChunkCount)}개)`);
        }
        return warnings;
    }
    /**
     * 성능 최적화 제안
     */
    getOptimizationSuggestions() {
        const suggestions = [];
        const warnings = this.checkPerformanceWarnings();
        if (warnings.length === 0) {
            suggestions.push("현재 성능이 양호합니다.");
            return suggestions;
        }
        if (this.metrics.averageResponseTime >
            (this.currentLimits?.maxProcessingTime || 30000) * 0.8) {
            suggestions.push("프롬프트를 더 구체적으로 작성하여 응답 시간을 단축할 수 있습니다.");
            suggestions.push("간단한 요청의 경우 자동완성 모드를 사용해보세요.");
        }
        if (this.metrics.errorRate > 0.2) {
            suggestions.push("네트워크 연결을 확인하고 잠시 후 다시 시도해보세요.");
            suggestions.push("복잡한 요청은 단계별로 나누어 요청해보세요.");
        }
        if (this.metrics.memoryUsage > 0.8) {
            suggestions.push("브라우저를 새로고침하여 메모리를 정리해보세요.");
            suggestions.push("다른 탭이나 애플리케이션을 닫아 메모리를 확보해보세요.");
        }
        return suggestions;
    }
    /**
     * 성능 리셋
     */
    reset() {
        this.metrics = {
            totalRequests: 0,
            successfulRequests: 0,
            averageResponseTime: 0,
            averageChunkCount: 0,
            errorRate: 0,
            memoryUsage: this.estimateMemoryUsage(),
            lastUpdated: Date.now(),
        };
        this.performanceHistory = [];
        this.currentLimits = null;
        this.currentComplexity = null;
        console.log("🔄 적응형 성능 제한기 리셋 완료");
    }
}
exports.AdaptivePerformanceLimiter = AdaptivePerformanceLimiter;
// 싱글톤 인스턴스 생성 및 내보내기
exports.adaptivePerformanceLimiter = new AdaptivePerformanceLimiter();
//# sourceMappingURL=AdaptivePerformanceService.js.map