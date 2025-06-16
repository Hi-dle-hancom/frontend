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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert = __importStar(require("assert"));
const vscode = __importStar(require("vscode"));
suite("통합 테스트", () => {
    test("확장 기능 로드 테스트", async () => {
        // 확장 기능이 활성화되어 있는지 확인
        const extension = vscode.extensions.getExtension("hancom.hapa");
        assert.ok(extension);
        // 확장 기능이 활성화되어 있지 않다면 활성화
        if (!extension.isActive) {
            await extension.activate();
        }
        assert.ok(extension.isActive);
    });
    test("명령어 실행 테스트", async () => {
        // 모든 명령어가 등록되어 있는지 확인
        const commands = await vscode.commands.getCommands(true);
        assert.ok(commands.includes("hapa.start"));
        assert.ok(commands.includes("hapa.settings"));
        assert.ok(commands.includes("hapa.analyze"));
        assert.ok(commands.includes("hapa.generateTest"));
    });
    test("웹뷰 로드 테스트", async () => {
        // 사이드바 뷰 컨테이너 표시
        await vscode.commands.executeCommand("workbench.view.extension.hapa-sidebar");
        // 웹뷰가 로드되는지 확인 (비동기 작업이므로 약간의 지연 시간 허용)
        await new Promise((resolve) => setTimeout(resolve, 1000));
        // 이 테스트는 실제로 웹뷰가 표시되는지 자동으로 확인할 수 없으므로
        // 일단 명령이 오류 없이 실행되는지만 확인
    });
});
//# sourceMappingURL=integration.test.js.map