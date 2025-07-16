// 온보딩 테스트 스크립트
// VSCode Extension Development Host에서 실행하기 위한 디버깅 코드

console.log("🧪 온보딩 테스트 스크립트 시작");

// 1. Extension 활성화 상태 확인
const vscode = require("vscode");

async function testOnboarding() {
  try {
    console.log("📋 1. VSCode API 접근 테스트");

    // VSCode API 기본 접근 테스트
    if (vscode) {
      console.log("✅ VSCode API 정상 접근 가능");
    } else {
      console.error("❌ VSCode API 접근 불가");
      return;
    }

    // 2. HAPA 설정 확인
    console.log("📋 2. HAPA 설정 상태 확인");
    const config = vscode.workspace.getConfiguration("hapa");
    const isOnboardingCompleted = config.get(
      "userProfile.isOnboardingCompleted",
      false
    );

    console.log("🔍 온보딩 완료 상태:", isOnboardingCompleted);
    console.log("🔍 전체 설정:", {
      apiBaseURL: config.get("apiBaseURL"),
      theme: config.get("theme"),
      enableCodeAnalysis: config.get("enableCodeAnalysis"),
    });

    // 3. 명령어 실행 테스트
    console.log("📋 3. 온보딩 명령어 실행 테스트");

    // hapa.showOnboarding 명령어가 등록되었는지 확인
    const commands = await vscode.commands.getCommands();
    const hapaCommands = commands.filter((cmd) => cmd.startsWith("hapa."));

    console.log("🔍 등록된 HAPA 명령어들:", hapaCommands);

    if (hapaCommands.includes("hapa.showOnboarding")) {
      console.log("✅ hapa.showOnboarding 명령어 등록됨");

      // 실제 명령어 실행 시도
      try {
        console.log("🚀 온보딩 명령어 실행 시도...");
        await vscode.commands.executeCommand("hapa.showOnboarding");
        console.log("✅ 온보딩 명령어 실행 성공");
      } catch (error) {
        console.error("❌ 온보딩 명령어 실행 실패:", error);
      }
    } else {
      console.error("❌ hapa.showOnboarding 명령어가 등록되지 않음");
    }

    // 4. 설정 강제 초기화 (테스트용)
    console.log("📋 4. 온보딩 설정 강제 초기화");
    await config.update(
      "userProfile.isOnboardingCompleted",
      false,
      vscode.ConfigurationTarget.Global
    );
    console.log("✅ 온보딩 완료 상태를 false로 재설정");

    // 5. 재시도
    console.log("📋 5. 설정 초기화 후 온보딩 재시도");
    try {
      await vscode.commands.executeCommand("hapa.showOnboarding");
      console.log("✅ 초기화 후 온보딩 성공");
    } catch (error) {
      console.error("❌ 초기화 후 온보딩 실패:", error);
    }
  } catch (error) {
    console.error("❌ 테스트 중 오류 발생:", error);
  }
}

// Extension 활성화 시 자동 실행
if (typeof vscode !== "undefined") {
  testOnboarding();
}

module.exports = { testOnboarding };
