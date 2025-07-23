"use strict";
/**
 * HAPA VSCode Extension
 * 한컴 AI Python Assistant - 사용자 맞춤형 코딩 어시스턴트
 */
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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const ExtensionManager_1 = require("./core/ExtensionManager");
// 전역 확장 관리자
let extensionManager;
/**
 * 확장 프로그램 활성화
 */
async function activate(context) {
    try {
        console.log("🚀 HAPA Extension 활성화 시작...");
        // ExtensionManager 초기화 및 활성화
        extensionManager = new ExtensionManager_1.ExtensionManager(context);
        await extensionManager.activate();
        console.log("✅ HAPA Extension 활성화 완료");
    }
    catch (error) {
        console.error("❌ HAPA Extension 활성화 실패:", error);
        vscode.window.showErrorMessage("HAPA Extension 활성화 중 오류가 발생했습니다. 확장 프로그램을 다시 시작해주세요.");
    }
}
/**
 * 확장 프로그램 비활성화
 */
async function deactivate() {
    try {
        console.log("🔄 HAPA Extension 비활성화 시작...");
        if (extensionManager) {
            await extensionManager.deactivate();
            extensionManager = undefined;
        }
        console.log("✅ HAPA Extension 비활성화 완료");
    }
    catch (error) {
        console.error("❌ HAPA Extension 비활성화 실패:", error);
    }
}
//# sourceMappingURL=extension.js.map