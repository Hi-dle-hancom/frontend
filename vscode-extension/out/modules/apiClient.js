"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiClient = exports.APIClient = void 0;
const axios_1 = __importDefault(require("axios"));
class APIClient {
    baseURL;
    timeout;
    constructor() {
        // 백엔드 API 설정
        this.baseURL = "http://localhost:8000";
        this.timeout = 30000; // 30초 타임아웃
    }
    /**
     * AI 코드 생성/분석 API 호출
     */
    async generate(request) {
        try {
            const response = await axios_1.default.post(`${this.baseURL}/generate`, request, {
                timeout: this.timeout,
                headers: {
                    "Content-Type": "application/json",
                },
            });
            return response.data;
        }
        catch (error) {
            // 에러 처리
            if (axios_1.default.isAxiosError(error)) {
                if (error.code === "ECONNREFUSED") {
                    throw new Error("백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.");
                }
                else if (error.response?.status === 500) {
                    throw new Error("서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
                }
                else if (error.code === "ECONNABORTED") {
                    throw new Error("요청 시간이 초과되었습니다. 다시 시도해주세요.");
                }
            }
            throw new Error(`API 호출 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}`);
        }
    }
    /**
     * 백엔드 서버 연결 상태 확인
     */
    async checkHealth() {
        try {
            const response = await axios_1.default.get(`${this.baseURL}/health`, {
                timeout: 5000,
            });
            return response.status === 200;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * 백엔드 서버 정보 가져오기
     */
    async getServerInfo() {
        try {
            const response = await axios_1.default.get(`${this.baseURL}/info`, {
                timeout: 5000,
            });
            return response.data;
        }
        catch (error) {
            throw new Error("서버 정보를 가져올 수 없습니다.");
        }
    }
}
exports.APIClient = APIClient;
// 싱글톤 인스턴스
exports.apiClient = new APIClient();
//# sourceMappingURL=apiClient.js.map