"use strict";
/**
 * HAPA VSCode Extension - 중앙 타입 정의
 * @fileoverview 모든 타입 정의를 중앙에서 관리
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.VLLMModelType = void 0;
// ============================================================================
// API TYPES
// ============================================================================
/**
 * Backend ModelType enum과 일치하는 모델 타입
 */
var VLLMModelType;
(function (VLLMModelType) {
    VLLMModelType["CODE_COMPLETION"] = "code_completion";
    VLLMModelType["CODE_GENERATION"] = "code_generation";
    VLLMModelType["CODE_EXPLANATION"] = "code_explanation";
    VLLMModelType["CODE_REVIEW"] = "code_review";
    VLLMModelType["BUG_FIX"] = "bug_fix";
    VLLMModelType["CODE_OPTIMIZATION"] = "code_optimization";
    VLLMModelType["UNIT_TEST_GENERATION"] = "unit_test_generation";
    VLLMModelType["DOCUMENTATION"] = "documentation";
})(VLLMModelType || (exports.VLLMModelType = VLLMModelType = {}));
//# sourceMappingURL=index.js.map