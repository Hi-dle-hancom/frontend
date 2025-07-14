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
exports.SidebarScripts = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * 사이드바 JavaScript 로직 생성 클래스
 * 외부 sidebar-main.js 파일을 읽어서 반환
 */
class SidebarScripts {
    /**
     * 외부 sidebar-main.js 파일을 읽어서 JavaScript 코드 반환
     */
    static generateJS() {
        try {
            // 스크립트 경로 설정 (캐시)
            if (!this.scriptPath) {
                this.scriptPath = path.join(__dirname, "sidebar-main.js");
            }
            // 개발 모드에서는 매번 읽기, 프로덕션에서는 캐시 사용
            const isDevelopment = process.env.NODE_ENV !== "production";
            if (!this.scriptCache || isDevelopment) {
                if (fs.existsSync(this.scriptPath)) {
                    this.scriptCache = fs.readFileSync(this.scriptPath, "utf8");
                    console.log(`✅ 외부 스크립트 파일 로드 성공: ${this.scriptPath}`);
                }
                else {
                    console.warn(`⚠️ 외부 스크립트 파일을 찾을 수 없음: ${this.scriptPath}`);
                    return this.getFallbackScript();
                }
            }
            return this.scriptCache || this.getFallbackScript();
        }
        catch (error) {
            console.error(`❌ 외부 스크립트 파일 읽기 오류:`, error);
            return this.getFallbackScript();
        }
    }
    /**
     * 외부 파일을 읽을 수 없을 때 사용할 최소한의 fallback 스크립트
     */
    static getFallbackScript() {
        return `
    // 긴급 fallback 스크립트 - 기본 기능만 제공
    const vscode = acquireVsCodeApi();
    
    console.warn('⚠️ 메인 사이드바 스크립트를 로드할 수 없어 fallback 모드로 실행됩니다.');
    
    // 기본 상태 변수
    window.selectedModel = 'autocomplete';
    
    // 헤더 버튼 함수들 (Fallback)
    function openSettings() {
      console.log('⚙️ [Fallback] 설정 버튼 클릭됨');
      try {
        vscode.postMessage({
          command: 'openSettings',
        });
        console.log('✅ [Fallback] 설정 메시지 전송 성공');
      } catch (error) {
        console.error('❌ [Fallback] 설정 메시지 전송 실패:', error);
        alert('설정을 열 수 없습니다. 다시 시도해주세요.');
      }
    }
    
    function showHelp() {
      console.log('❓ [Fallback] 도움말 버튼 클릭됨');
      try {
        vscode.postMessage({
          command: 'showHelp',
        });
        console.log('✅ [Fallback] 도움말 메시지 전송 성공');
      } catch (error) {
        console.error('❌ [Fallback] 도움말 메시지 전송 실패:', error);
        alert('도움말을 표시할 수 없습니다. 다시 시도해주세요.');
      }
    }
    
    function openMainDashboard() {
      console.log('↗ [Fallback] 확장 버튼 클릭됨');
      try {
        vscode.postMessage({
          command: 'openMainDashboard',
        });
        console.log('✅ [Fallback] 확장 메시지 전송 성공');
      } catch (error) {
        console.error('❌ [Fallback] 확장 메시지 전송 실패:', error);
        alert('확장 뷰를 열 수 없습니다. 다시 시도해주세요.');
      }
    }
    
    // 기본 모델 선택 함수
    function selectModelTab(modelType) {
      console.log('Fallback 모델 선택:', modelType);
      window.selectedModel = modelType;
      
      const allTabs = document.querySelectorAll('.model-tab');
      allTabs.forEach(tab => tab.classList.remove('active'));
      
      const selectedTab = document.querySelector('[data-model="' + modelType + '"]');
      if (selectedTab) {
        selectedTab.classList.add('active');
      }
      
      vscode.postMessage({
        command: 'modelSelected',
        modelType: modelType
      });
    }
    
    // 질문 제출 함수 (기본)
    function submitQuestion() {
      const questionInput = document.getElementById('questionInput');
      const question = questionInput ? questionInput.value.trim() : '';
      
      if (!question) {
        alert('질문을 입력해주세요.');
        return;
      }
      
      console.log('📝 [Fallback] 질문 제출:', question);
      
      vscode.postMessage({
        command: 'generateCodeStreaming',
        prompt: question,
        model_type: window.selectedModel || 'autocomplete',
        timestamp: Date.now(),
      });
      
      if (questionInput) {
        questionInput.value = '';
      }
    }
    
    // 탭 전환 함수 (Fallback)
    function switchTab(tabType) {
      console.log('🔄 [Fallback] 탭 전환:', tabType);
      
      try {
        // 모든 탭 버튼 비활성화
        const allTabBtns = document.querySelectorAll('.tab-btn');
        allTabBtns.forEach((btn) => btn.classList.remove('active'));
        
        // 모든 탭 컨텐츠 숨기기
        const responseContent = document.querySelector('.response-content');
        const historyContent = document.querySelector('.history-content');
        
        if (tabType === 'response') {
          // 응답 탭 활성화
          if (responseContent) {
            responseContent.style.display = 'block';
          }
          if (historyContent) {
            historyContent.style.display = 'none';
          }
          
          const responseTabBtn = document.querySelector('[data-tab="response"]');
          if (responseTabBtn) {
            responseTabBtn.classList.add('active');
          }
          
          console.log('✅ [Fallback] 응답 탭 활성화');
        } else if (tabType === 'history') {
          // 기록 탭 활성화
          if (responseContent) {
            responseContent.style.display = 'none';
          }
          if (historyContent) {
            historyContent.style.display = 'block';
          }
          
          const historyTabBtn = document.querySelector('[data-tab="history"]');
          if (historyTabBtn) {
            historyTabBtn.classList.add('active');
          }
          
          console.log('✅ [Fallback] 기록 탭 활성화');
        }
      } catch (error) {
        console.error('❌ [Fallback] 탭 전환 오류:', error);
      }
    }
    
    // 전역 함수 등록
    window.openSettings = openSettings;
    window.showHelp = showHelp;
    window.openMainDashboard = openMainDashboard;
    window.selectModelTab = selectModelTab;
    window.submitQuestion = submitQuestion;
    window.switchTab = switchTab;
    
    // 기본 이벤트 리스너
    document.addEventListener('DOMContentLoaded', function() {
      console.log('Fallback 스크립트 초기화 완료');
      
      // 기본 모델 탭 설정
      if (window.selectedModel) {
        selectModelTab(window.selectedModel);
      }
      
      // 응답 탭 기본 활성화
      setTimeout(() => {
        switchTab('response');
        console.log('✅ [Fallback] 응답 탭 기본 활성화 완료');
      }, 100);
    });
    
    // VSCode 메시지 리스너
    window.addEventListener('message', function(event) {
      const message = event.data;
      console.log('Fallback 메시지 수신:', message.command);
      
      // 기본적인 메시지 처리만 제공
      if (message.command === 'modelChanged') {
        selectModelTab(message.modelType);
      }
    });
    
    console.log('Fallback 사이드바 스크립트 로드 완료');
    `;
    }
    /**
     * 스크립트 캐시 초기화 (개발 시 유용)
     */
    static clearCache() {
        this.scriptCache = null;
        console.log("✅ SidebarScripts 캐시 초기화 완료");
    }
    /**
     * 외부 스크립트 파일 경로 확인
     */
    static getScriptPath() {
        if (!this.scriptPath) {
            this.scriptPath = path.join(__dirname, "sidebar-main.js");
        }
        return this.scriptPath;
    }
    /**
     * 외부 스크립트 파일 존재 여부 확인
     */
    static isScriptFileExists() {
        try {
            return fs.existsSync(this.getScriptPath());
        }
        catch {
            return false;
        }
    }
}
exports.SidebarScripts = SidebarScripts;
SidebarScripts.scriptCache = null;
SidebarScripts.scriptPath = null;
//# sourceMappingURL=SidebarScripts.js.map