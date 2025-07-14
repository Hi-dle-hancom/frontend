#\!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 HAPA Extension 검증 스크립트 실행');
console.log('=====================================');

// 1. 컴파일된 파일들 검증
const outDir = path.join(__dirname, 'out');
const requiredFiles = [
    'extension.js',
    'core/ExtensionManager.js',
    'providers/SidebarProvider.js',
    'services/ConfigService.js',
    'modules/triggerDetector.js'
];

console.log('\n📁 필수 파일 존재 확인:');
let missingFiles = 0;
requiredFiles.forEach(file => {
    const filePath = path.join(outDir, file);
    if (fs.existsSync(filePath)) {
        const size = fs.statSync(filePath).size;
        console.log(`  ✅ ${file} (${size} bytes)`);
    } else {
        console.log(`  ❌ ${file} - 파일 없음`);
        missingFiles++;
    }
});

// 2. 패키지 정보 검증
console.log('\n📦 패키지 정보:');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
console.log(`  📌 이름: ${packageJson.name}`);
console.log(`  📌 버전: ${packageJson.version}`);
console.log(`  📌 엔진: ${packageJson.engines.vscode}`);
console.log(`  📌 활성화 이벤트: ${packageJson.activationEvents.join(', ')}`);

// 3. 템플릿 스크립트 검증
console.log('\n🎨 템플릿 스크립트:');
const sidebarScript = path.join(__dirname, 'src', 'templates', 'scripts', 'sidebar-main.js');
if (fs.existsSync(sidebarScript)) {
    const content = fs.readFileSync(sidebarScript, 'utf8');
    const functions = content.match(/function\s+\w+/g) || [];
    const globalVars = content.match(/window\.\w+\s*=/g) || [];
    console.log(`  ✅ sidebar-main.js (${content.length} chars)`);
    console.log(`  📊 함수 수: ${functions.length}`);
    console.log(`  📊 전역 변수: ${globalVars.length}`);
} else {
    console.log('  ❌ sidebar-main.js 파일 없음');
    missingFiles++;
}

// 4. VSIX 파일 검증
console.log('\n📦 VSIX 패키지:');
const vsixFiles = fs.readdirSync(__dirname).filter(f => f.endsWith('.vsix'));
if (vsixFiles.length > 0) {
    vsixFiles.forEach(file => {
        const size = fs.statSync(file).size;
        console.log(`  ✅ ${file} (${(size/1024).toFixed(1)} KB)`);
    });
} else {
    console.log('  ⚠️  VSIX 파일 없음');
}

// 5. 최종 결과
console.log('\n🎯 검증 결과:');
if (missingFiles === 0) {
    console.log('  🎉 모든 필수 파일이 정상적으로 존재합니다\!');
    console.log('  ✅ Extension이 배포 준비 상태입니다.');
} else {
    console.log(`  ⚠️  ${missingFiles}개 파일이 누락되었습니다.`);
    console.log('  🔧 컴파일을 다시 실행해주세요.');
}

console.log('\n🏁 검증 완료\!');
