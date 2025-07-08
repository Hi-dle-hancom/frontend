/**
 * HAPA VSCode Extension
 * 한컴 AI Python Assistant - 사용자 맞춤형 코딩 어시스턴트
 */

import * as vscode from "vscode";
import { ExtensionManager } from "./core/ExtensionManager";

// 전역 확장 관리자
let extensionManager: ExtensionManager | undefined;

/**
 * 확장 프로그램 활성화
 */
export async function activate(
  context: vscode.ExtensionContext
): Promise<void> {
  try {
    console.log("🚀 HAPA Extension 활성화 시작...");

    // ExtensionManager 초기화 및 활성화
    extensionManager = new ExtensionManager(context);
    await extensionManager.activate();

    console.log("✅ HAPA Extension 활성화 완료");
  } catch (error) {
    console.error("❌ HAPA Extension 활성화 실패:", error);
    vscode.window.showErrorMessage(
      "HAPA Extension 활성화 중 오류가 발생했습니다. 확장 프로그램을 다시 시작해주세요."
    );
  }
}

/**
 * 확장 프로그램 비활성화
 */
export async function deactivate(): Promise<void> {
  try {
    console.log("🔄 HAPA Extension 비활성화 시작...");

    if (extensionManager) {
      await extensionManager.deactivate();
      extensionManager = undefined;
    }

    console.log("✅ HAPA Extension 비활성화 완료");
  } catch (error) {
    console.error("❌ HAPA Extension 비활성화 실패:", error);
  }
}
