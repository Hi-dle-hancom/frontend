import axios, { AxiosResponse } from "axios";
import * as vscode from "vscode";

// API 응답 타입 정의
export interface AIResponse {
  type: "code" | "explanation" | "test";
  content: string;
  explanation?: string;
  language?: string;
}

export interface GenerateRequest {
  prompt: string;
  context?: string;
  selectedCode?: string;
  language?: string;
  requestType?: "analyze" | "generate" | "test" | "general";
}

export class APIClient {
  private readonly baseURL: string;
  private readonly timeout: number;

  constructor() {
    // 백엔드 API 설정
    this.baseURL = "http://localhost:8000";
    this.timeout = 30000; // 30초 타임아웃
  }

  /**
   * AI 코드 생성/분석 API 호출
   */
  async generate(request: GenerateRequest): Promise<AIResponse> {
    try {
      const response: AxiosResponse<AIResponse> = await axios.post(
        `${this.baseURL}/generate`,
        request,
        {
          timeout: this.timeout,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error) {
      // 에러 처리
      if (axios.isAxiosError(error)) {
        if (error.code === "ECONNREFUSED") {
          throw new Error(
            "백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요."
          );
        } else if (error.response?.status === 500) {
          throw new Error(
            "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
          );
        } else if (error.code === "ECONNABORTED") {
          throw new Error("요청 시간이 초과되었습니다. 다시 시도해주세요.");
        }
      }

      throw new Error(
        `API 호출 실패: ${
          error instanceof Error ? error.message : "알 수 없는 오류"
        }`
      );
    }
  }

  /**
   * 백엔드 서버 연결 상태 확인
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseURL}/health`, {
        timeout: 5000,
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  /**
   * 백엔드 서버 정보 가져오기
   */
  async getServerInfo(): Promise<any> {
    try {
      const response = await axios.get(`${this.baseURL}/info`, {
        timeout: 5000,
      });
      return response.data;
    } catch (error) {
      throw new Error("서버 정보를 가져올 수 없습니다.");
    }
  }
}

// 싱글톤 인스턴스
export const apiClient = new APIClient();
