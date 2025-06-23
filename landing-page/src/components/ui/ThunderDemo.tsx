import React, { useState, useRef, useEffect } from "react";

interface ThunderDemoProps {
  className?: string;
}

interface StreamingChunk {
  type: "start" | "token" | "code" | "explanation" | "done" | "error";
  content: string;
  sequence: number;
  timestamp: string;
}

const ThunderDemo: React.FC<ThunderDemoProps> = ({ className = "" }) => {
  const [activeTab, setActiveTab] = useState("body");
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [responseTime, setResponseTime] = useState<number>(0);
  const [statusCode, setStatusCode] = useState<number>(0);

  const abortControllerRef = useRef<AbortController | null>(null);
  const startTimeRef = useRef<number>(0);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleSend = async () => {
    if (!question.trim() || isLoading) return;

    // 이전 요청 취소
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setIsLoading(true);
    setIsStreaming(true);
    setResponse("");
    setError(null);
    setStatusCode(0);
    startTimeRef.current = Date.now();

    // 새로운 AbortController 생성
    abortControllerRef.current = new AbortController();

    try {
      // 실제 Backend API 호출
      const apiBaseURL =
        process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";
      const url = `${apiBaseURL}/api/v1/code/enhanced-stream-generate`;

      const requestBody = {
        user_question: question,
        language: "python",
        stream: true,
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          // API 키는 데모용으로 기본값 사용 (실제 환경에서는 환경변수 사용)
          "X-API-Key":
            process.env.REACT_APP_API_KEY ||
            "hapa_demo_20241228_secure_key_for_testing",
        },
        body: JSON.stringify(requestBody),
        signal: abortControllerRef.current.signal,
      });

      setStatusCode(response.status);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: `;
        try {
          const errorText = await response.text();
          const errorData = JSON.parse(errorText);
          errorMessage +=
            errorData.detail || errorData.error_message || errorText;
        } catch {
          errorMessage += response.statusText;
        }
        throw new Error(errorMessage);
      }

      if (!response.body) {
        throw new Error("응답 본문이 없습니다.");
      }

      // SSE 스트림 처리
      await processSSEStream(response.body);
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === "AbortError") {
          setError("요청이 취소되었습니다.");
        } else if (
          err.message.includes("Failed to fetch") ||
          err.message.includes("NetworkError")
        ) {
          setError(
            `🔗 서버에 연결할 수 없습니다.\nAPI 서버가 실행 중인지 확인해주세요.\n서버 주소: ${
              process.env.REACT_APP_API_BASE_URL || "http://localhost:8000"
            }`
          );
        } else {
          setError(err.message);
        }
      } else {
        setError("알 수 없는 오류가 발생했습니다.");
      }
      setStatusCode(500);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      setResponseTime(Date.now() - startTimeRef.current);
    }
  };

  const processSSEStream = async (
    stream: ReadableStream<Uint8Array>
  ): Promise<void> => {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let fullContent = "";

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          if (fullContent && !fullContent.includes('"type":"done"')) {
            setResponse(fullContent);
          }
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const events = parseSSEEvents(buffer);

        for (const eventData of events.parsed) {
          try {
            const chunk: StreamingChunk = JSON.parse(eventData);

            if (chunk.type === "token" || chunk.type === "code") {
              fullContent += chunk.content;
              setResponse(fullContent);
            } else if (chunk.type === "done") {
              setResponse(fullContent);
              return;
            } else if (chunk.type === "error") {
              throw new Error(chunk.content);
            }
          } catch (parseError) {
            // SSE 이벤트 파싱 실패는 로그 레벨을 낮춤 (개발환경에서만 표시)
          }
        }

        buffer = events.remaining;
      }
    } finally {
      reader.releaseLock();
    }
  };

  const parseSSEEvents = (
    data: string
  ): { parsed: string[]; remaining: string } => {
    const lines = data.split("\n");
    const events: string[] = [];
    let currentEventData = "";
    let i = 0;

    while (i < lines.length) {
      const line = lines[i].trim();

      if (line.startsWith("data: ")) {
        currentEventData = line.substring(6);
        i++;

        if (i < lines.length && lines[i].trim() === "") {
          if (currentEventData && currentEventData !== "[DONE]") {
            events.push(currentEventData);
          }
          currentEventData = "";
          i++;
        } else if (i >= lines.length) {
          break;
        }
      } else if (line.startsWith(":")) {
        i++;
      } else if (line === "") {
        if (currentEventData && currentEventData !== "[DONE]") {
          events.push(currentEventData);
        }
        currentEventData = "";
        i++;
      } else {
        i++;
      }
    }

    const processedLines = i;
    const remaining = lines.slice(processedLines).join("\n");

    return {
      parsed: events,
      remaining: remaining,
    };
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
      setIsStreaming(false);
      setError("사용자에 의해 중단되었습니다.");
    }
  };

  const handleCopy = async () => {
    if (response) {
      try {
        await navigator.clipboard.writeText(response);
        // 간단한 성공 피드백 (실제로는 토스트 알림 등을 사용)
        // 성공 시 로그는 제거 (사용자에게 UI로 알림)
      } catch (err) {
        console.error("클립보드 복사 실패:", err);
      }
    }
  };

  const getStatusColor = () => {
    if (error) return "bg-red-500";
    if (statusCode >= 200 && statusCode < 300) return "bg-green-500";
    if (statusCode >= 400) return "bg-red-500";
    return "bg-gray-500";
  };

  const getStatusText = () => {
    if (error) return "ERROR";
    if (statusCode >= 200 && statusCode < 300) return `${statusCode} OK`;
    if (statusCode >= 400) return `${statusCode} ERROR`;
    return isStreaming ? "STREAMING..." : "READY";
  };

  return (
    <div
      className={`thunder-bg-primary thunder-rounded-lg thunder-shadow-lg overflow-hidden ${className}`}
      data-testid="thunder-demo"
    >
      {/* Thunder Client 헤더 */}
      <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="thunder-icon thunder-icon-lg">H</div>
          <span className="thunder-text-base font-semibold thunder-text-primary">
            HAPA AI Assistant
          </span>
        </div>
        <div className="thunder-status">
          <div className="thunder-status-dot"></div>
          <span>Connected</span>
        </div>
      </div>

      {/* REQUEST 섹션 */}
      <div className="border-b border-gray-200">
        <div className="thunder-section-header">
          <span>REQUEST</span>
          <div className="flex gap-2">
            <button className="thunder-text-xs px-2 py-1 rounded hover:bg-gray-200">
              TEMPLATE
            </button>
            <button
              className="thunder-text-xs px-2 py-1 rounded hover:bg-gray-200"
              onClick={() => setQuestion("")}
            >
              CLEAR
            </button>
          </div>
        </div>

        <div className="p-4">
          <div className="flex gap-2 mb-3">
            <div className="thunder-btn-primary px-3 py-1 text-xs rounded">
              AI
            </div>
            <input
              type="text"
              className="flex-1 px-3 py-2 border border-gray-300 rounded thunder-text-sm"
              placeholder="localhost:8000/code/generate"
              readOnly
            />
            <div className="flex gap-2">
              <button
                className="thunder-btn thunder-btn-primary"
                onClick={handleSend}
                disabled={isLoading}
              >
                {isLoading
                  ? isStreaming
                    ? "Streaming..."
                    : "Sending..."
                  : "Send"}
              </button>
              {isLoading && (
                <button
                  className="thunder-btn thunder-btn-secondary ml-2"
                  onClick={handleStop}
                >
                  Stop
                </button>
              )}
            </div>
          </div>

          <textarea
            className="w-full h-32 p-3 border border-gray-300 rounded thunder-text-sm font-mono resize-none"
            placeholder='예시: "Python에서 피보나치 수열을 효율적으로 구현하는 방법을 알려주세요"'
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* RESPONSE 섹션 */}
      <div>
        <div className="thunder-section-header">
          <span>RESPONSE</span>
          <div className="flex gap-2">
            <button
              className="thunder-text-xs px-2 py-1 rounded hover:bg-gray-200"
              onClick={() => {
                setResponse("");
                setError(null);
                setStatusCode(0);
                setResponseTime(0);
              }}
            >
              CLEAR
            </button>
            <button
              className="thunder-text-xs px-2 py-1 rounded hover:bg-gray-200"
              onClick={handleCopy}
              disabled={!response}
            >
              EXPORT
            </button>
          </div>
        </div>

        {/* 탭 */}
        <div className="thunder-tabs">
          {["body", "headers", "test", "history"].map((tab) => (
            <button
              key={tab}
              className={`thunder-tab ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "body"
                ? "Body"
                : tab === "headers"
                ? "Headers"
                : tab === "test"
                ? "Test Results"
                : "History"}
            </button>
          ))}
        </div>

        {/* 응답 내용 */}
        <div className="p-4 min-h-64">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="flex items-center gap-3 thunder-text-secondary">
                <div
                  className={`thunder-status-dot ${
                    isStreaming ? "animate-pulse" : ""
                  }`}
                ></div>
                <span>
                  {isStreaming
                    ? "AI가 실시간으로 코드를 생성하고 있습니다..."
                    : "AI가 응답을 생성하고 있습니다..."}
                </span>
              </div>
            </div>
          ) : error ? (
            <div className="thunder-card">
              <div className="thunder-card-header">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 text-xs bg-red-500 text-white rounded">
                      ERROR
                    </span>
                    <span className="thunder-text-xs thunder-text-secondary">
                      {responseTime}ms
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="thunder-btn thunder-btn-secondary text-xs"
                      onClick={() => setError(null)}
                    >
                      Clear
                    </button>
                    <button
                      className="thunder-btn thunder-btn-primary text-xs"
                      onClick={handleSend}
                      disabled={!question.trim()}
                    >
                      Retry
                    </button>
                  </div>
                </div>
              </div>
              <div className="thunder-card-body">
                <pre className="thunder-code text-red-600 whitespace-pre-wrap">
                  {error}
                </pre>
              </div>
            </div>
          ) : response ? (
            <div className="thunder-card">
              <div className="thunder-card-header">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-1 text-xs ${getStatusColor()} text-white rounded`}
                    >
                      {getStatusText()}
                    </span>
                    <span className="thunder-text-xs thunder-text-secondary">
                      {responseTime}ms
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="thunder-btn thunder-btn-secondary text-xs"
                      onClick={handleCopy}
                    >
                      Copy
                    </button>
                    <button className="thunder-btn thunder-btn-primary text-xs">
                      Insert Code
                    </button>
                  </div>
                </div>
              </div>
              <div className="thunder-card-body">
                <pre className="thunder-code">
                  <code>{response}</code>
                </pre>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 thunder-text-secondary">
              <div className="thunder-icon thunder-icon-xl mb-4 opacity-30">
                ⚡
              </div>
              <div className="text-center">
                <h3 className="thunder-text-lg font-semibold thunder-text-primary mb-2">
                  No Response
                </h3>
                <p className="thunder-text-sm">
                  Click the Send button to execute your AI request.
                  <br />
                  The response will appear here with real-time streaming.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThunderDemo;
