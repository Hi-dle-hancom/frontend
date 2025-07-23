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
exports.LoadingService = void 0;
const vscode = __importStar(require("vscode"));
const EnhancedErrorService_1 = require("./EnhancedErrorService");
class LoadingService {
    static instance;
    errorService = EnhancedErrorService_1.EnhancedErrorService.getInstance();
    // 활성 로딩 작업들
    activeTasks = new Map();
    // VS Code 진행 표시 인터페이스
    progressReporters = new Map();
    // 로딩 상태 리스너들
    stateChangeListeners = [];
    // 자동 타임아웃 관리
    taskTimeouts = new Map();
    // 통계 데이터
    taskStats = {
        totalTasks: 0,
        completedTasks: 0,
        cancelledTasks: 0,
        averageDuration: 0,
    };
    static getInstance() {
        if (!LoadingService.instance) {
            LoadingService.instance = new LoadingService();
        }
        return LoadingService.instance;
    }
    /**
     * 새로운 로딩 작업 시작
     */
    async startTask(title, options = {}) {
        const taskId = this.generateTaskId();
        const task = {
            id: taskId,
            title,
            description: options.description,
            progress: 0,
            isIndeterminate: options.isIndeterminate ?? false,
            startTime: new Date(),
            estimatedDuration: options.estimatedDuration,
            cancellable: options.cancellable ?? false,
            onCancel: options.onCancel,
        };
        this.activeTasks.set(taskId, task);
        this.taskStats.totalTasks++;
        // VS Code 진행 표시 생성
        await this.createProgressReporter(taskId, task, options.location);
        // 자동 타임아웃 설정 (최대 5분)
        const timeout = Math.min(options.estimatedDuration ?? 60000, 300000);
        this.setTaskTimeout(taskId, timeout);
        // 상태 변경 알림
        this.notifyStateChange();
        console.log(`🚀 로딩 작업 시작: ${title} (ID: ${taskId})`);
        return taskId;
    }
    /**
     * VS Code 진행 표시 생성
     */
    async createProgressReporter(taskId, task, location = vscode.ProgressLocation.Notification) {
        return new Promise((resolve) => {
            vscode.window.withProgress({
                location,
                title: task.title,
                cancellable: task.cancellable,
            }, async (progress, token) => {
                // 진행 리포터 저장
                this.progressReporters.set(taskId, {
                    progress,
                    resolve,
                    token,
                });
                // 취소 토큰 처리
                if (task.cancellable) {
                    token.onCancellationRequested(() => {
                        this.cancelTask(taskId);
                    });
                }
                // 초기 메시지 설정
                progress.report({
                    message: task.description || "처리 중...",
                    increment: 0,
                });
                // Promise가 외부에서 resolve될 때까지 대기
                return new Promise((resolveProgress) => {
                    this.progressReporters.get(taskId).resolve = resolveProgress;
                });
            });
        });
    }
    /**
     * 작업 진행률 업데이트
     */
    updateProgress(taskId, progress, message) {
        const task = this.activeTasks.get(taskId);
        if (!task) {
            console.warn(`존재하지 않는 작업 ID: ${taskId}`);
            return;
        }
        const previousProgress = task.progress || 0;
        task.progress = Math.max(0, Math.min(100, progress));
        if (message) {
            task.description = message;
        }
        // VS Code 진행 표시 업데이트
        const reporter = this.progressReporters.get(taskId);
        if (reporter) {
            const increment = task.progress - previousProgress;
            reporter.progress.report({
                message: task.description,
                increment: increment > 0 ? increment : 0,
            });
        }
        // 진행률 로그 (10% 단위로만)
        if (Math.floor(task.progress / 10) > Math.floor(previousProgress / 10)) {
            console.log(`📊 ${task.title}: ${task.progress}%`);
        }
        this.notifyStateChange();
    }
    /**
     * 작업 완료
     */
    completeTask(taskId, message) {
        const task = this.activeTasks.get(taskId);
        if (!task) {
            console.warn(`존재하지 않는 작업 ID: ${taskId}`);
            return;
        }
        // 진행률 100%로 설정
        task.progress = 100;
        if (message) {
            task.description = message;
        }
        // 통계 업데이트
        this.updateTaskStats(task, "completed");
        // VS Code 진행 표시 완료
        this.finishProgressReporter(taskId, message || "완료");
        // 작업 제거
        this.removeTask(taskId);
        console.log(`✅ 로딩 작업 완료: ${task.title} (소요시간: ${this.getTaskDuration(task)}ms)`);
    }
    /**
     * 작업 취소
     */
    cancelTask(taskId) {
        const task = this.activeTasks.get(taskId);
        if (!task) {
            console.warn(`존재하지 않는 작업 ID: ${taskId}`);
            return;
        }
        // 취소 콜백 실행
        if (task.onCancel) {
            try {
                task.onCancel();
            }
            catch (error) {
                this.errorService.logError(error, EnhancedErrorService_1.ErrorSeverity.LOW, {
                    taskId,
                    operation: "cancelCallback",
                });
            }
        }
        // 통계 업데이트
        this.updateTaskStats(task, "cancelled");
        // VS Code 진행 표시 취소
        this.finishProgressReporter(taskId, "취소됨");
        // 작업 제거
        this.removeTask(taskId);
        console.log(`🚫 로딩 작업 취소: ${task.title}`);
    }
    /**
     * 작업 실패 처리
     */
    failTask(taskId, error, message) {
        const task = this.activeTasks.get(taskId);
        if (!task) {
            console.warn(`존재하지 않는 작업 ID: ${taskId}`);
            return;
        }
        // 에러 로깅
        this.errorService.logError(error, EnhancedErrorService_1.ErrorSeverity.MEDIUM, {
            taskId,
            taskTitle: task.title,
        });
        // VS Code 진행 표시 에러
        this.finishProgressReporter(taskId, message || `오류 발생: ${error.message}`);
        // 작업 제거
        this.removeTask(taskId);
        // 에러 알림
        vscode.window
            .showErrorMessage(`작업 실패: ${task.title} - ${error.message}`, "다시 시도", "무시")
            .then((action) => {
            if (action === "다시 시도" && task.onCancel) {
                // 재시도 로직은 외부에서 구현
                console.log(`🔄 작업 재시도 요청: ${task.title}`);
            }
        });
        console.error(`❌ 로딩 작업 실패: ${task.title} - ${error.message}`);
    }
    /**
     * 여러 작업을 병렬로 실행
     */
    async runParallelTasks(tasks, options = {}) {
        const { maxConcurrency = 3 } = options;
        const results = [];
        const errors = [];
        const overallTaskId = await this.startTask(`병렬 작업 실행 (${tasks.length}개)`, {
            isIndeterminate: false,
            estimatedDuration: tasks.length * 10000, // 작업당 10초 추정
        });
        try {
            // 배치 단위로 처리
            for (let i = 0; i < tasks.length; i += maxConcurrency) {
                const batch = tasks.slice(i, i + maxConcurrency);
                const batchPromises = batch.map(async (task, batchIndex) => {
                    const taskIndex = i + batchIndex;
                    const subTaskId = await this.startTask(task.title, {
                        description: task.description,
                        location: vscode.ProgressLocation.Window,
                    });
                    try {
                        const result = await task.executor();
                        this.completeTask(subTaskId);
                        return { result, error: null, index: taskIndex };
                    }
                    catch (error) {
                        this.failTask(subTaskId, error);
                        return { result: null, error: error, index: taskIndex };
                    }
                });
                const batchResults = await Promise.all(batchPromises);
                // 결과 정리
                for (const { result, error, index } of batchResults) {
                    if (error) {
                        errors.push(error);
                    }
                    else {
                        results[index] = result;
                    }
                }
                // 전체 진행률 업데이트
                const completedTasks = Math.min(i + maxConcurrency, tasks.length);
                const progress = (completedTasks / tasks.length) * 100;
                this.updateProgress(overallTaskId, progress, `완료: ${completedTasks}/${tasks.length}`);
                // 진행 콜백 호출
                if (options.onProgress) {
                    options.onProgress(completedTasks, tasks.length);
                }
            }
            this.completeTask(overallTaskId, `${tasks.length}개 작업 완료`);
            if (errors.length > 0) {
                throw new Error(`${errors.length}개 작업이 실패했습니다`);
            }
            return results;
        }
        catch (error) {
            this.failTask(overallTaskId, error);
            throw error;
        }
    }
    /**
     * 현재 로딩 상태 조회
     */
    getLoadingState() {
        const tasks = Array.from(this.activeTasks.values());
        const totalProgress = tasks.length > 0
            ? tasks.reduce((sum, task) => sum + (task.progress || 0), 0) /
                tasks.length
            : 0;
        return {
            isLoading: tasks.length > 0,
            activeTasks: tasks,
            totalProgress,
            currentTask: tasks.length > 0 ? tasks[0] : undefined,
        };
    }
    /**
     * 특정 작업 조회
     */
    getTask(taskId) {
        return this.activeTasks.get(taskId);
    }
    /**
     * 모든 작업 취소
     */
    cancelAllTasks() {
        const taskIds = Array.from(this.activeTasks.keys());
        taskIds.forEach((id) => this.cancelTask(id));
        vscode.window.showInformationMessage(`${taskIds.length}개의 로딩 작업이 취소되었습니다.`);
    }
    /**
     * 상태 변경 리스너 등록
     */
    onStateChange(listener) {
        this.stateChangeListeners.push(listener);
    }
    /**
     * 통계 조회
     */
    getStatistics() {
        return { ...this.taskStats };
    }
    /**
     * 통계 초기화
     */
    resetStatistics() {
        this.taskStats = {
            totalTasks: 0,
            completedTasks: 0,
            cancelledTasks: 0,
            averageDuration: 0,
        };
    }
    // === 내부 유틸리티 메서드들 ===
    generateTaskId() {
        return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    setTaskTimeout(taskId, timeoutMs) {
        const timeoutId = setTimeout(() => {
            const task = this.activeTasks.get(taskId);
            if (task) {
                this.failTask(taskId, new Error("작업 타임아웃"), `${timeoutMs / 1000}초 타임아웃`);
            }
        }, timeoutMs);
        this.taskTimeouts.set(taskId, timeoutId);
    }
    finishProgressReporter(taskId, finalMessage) {
        const reporter = this.progressReporters.get(taskId);
        if (reporter) {
            // 최종 메시지 업데이트
            reporter.progress.report({
                message: finalMessage,
                increment: 0,
            });
            // 약간의 지연 후 완료 (사용자가 메시지를 볼 수 있도록)
            setTimeout(() => {
                reporter.resolve();
                this.progressReporters.delete(taskId);
            }, 1000);
        }
    }
    removeTask(taskId) {
        // 타임아웃 정리
        const timeoutId = this.taskTimeouts.get(taskId);
        if (timeoutId) {
            clearTimeout(timeoutId);
            this.taskTimeouts.delete(taskId);
        }
        // 작업 제거
        this.activeTasks.delete(taskId);
        // 상태 변경 알림
        this.notifyStateChange();
    }
    updateTaskStats(task, outcome) {
        const duration = this.getTaskDuration(task);
        if (outcome === "completed") {
            this.taskStats.completedTasks++;
            // 평균 지속시간 업데이트
            const totalCompleted = this.taskStats.completedTasks;
            this.taskStats.averageDuration =
                (this.taskStats.averageDuration * (totalCompleted - 1) + duration) /
                    totalCompleted;
        }
        else if (outcome === "cancelled") {
            this.taskStats.cancelledTasks++;
        }
    }
    getTaskDuration(task) {
        return Date.now() - task.startTime.getTime();
    }
    notifyStateChange() {
        const state = this.getLoadingState();
        this.stateChangeListeners.forEach((listener) => {
            try {
                listener(state);
            }
            catch (error) {
                this.errorService.logError(error, EnhancedErrorService_1.ErrorSeverity.LOW, {
                    listener: "loadingStateListener",
                });
            }
        });
    }
    /**
     * 정리
     */
    cleanup() {
        // 모든 활성 작업 취소
        this.cancelAllTasks();
        // 리스너 정리
        this.stateChangeListeners = [];
        // 타임아웃 정리
        this.taskTimeouts.forEach((timeout) => clearTimeout(timeout));
        this.taskTimeouts.clear();
        // 진행 리포터 정리
        this.progressReporters.clear();
    }
}
exports.LoadingService = LoadingService;
//# sourceMappingURL=LoadingService.js.map