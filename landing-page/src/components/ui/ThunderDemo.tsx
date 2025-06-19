import React, { useState } from "react";

interface ThunderDemoProps {
  className?: string;
}

const ThunderDemo: React.FC<ThunderDemoProps> = ({ className = "" }) => {
  const [activeTab, setActiveTab] = useState("body");
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = () => {
    if (!question.trim()) return;

    setIsLoading(true);
    setResponse("");

    // 시뮬레이션된 AI 응답
    setTimeout(() => {
      setResponse(`def fibonacci(n):
    """피보나치 수열의 n번째 값을 계산합니다."""
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

# 효율적인 버전 (메모이제이션 사용)
def fibonacci_optimized(n, memo={}):
    if n in memo:
        return memo[n]
    if n <= 1:
        return n
    memo[n] = fibonacci_optimized(n-1, memo) + fibonacci_optimized(n-2, memo)
    return memo[n]

# 사용 예시
print(fibonacci_optimized(10))  # 55`);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div
      className={`thunder-bg-primary thunder-rounded-lg thunder-shadow-lg overflow-hidden ${className}`}
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
            <button
              className="thunder-btn thunder-btn-primary"
              onClick={handleSend}
              disabled={isLoading}
            >
              {isLoading ? "Sending..." : "Send"}
            </button>
          </div>

          <textarea
            className="w-full h-32 p-3 border border-gray-300 rounded thunder-text-sm font-mono resize-none"
            placeholder='예시: "Python에서 피보나치 수열을 효율적으로 구현하는 방법을 알려주세요"'
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
        </div>
      </div>

      {/* RESPONSE 섹션 */}
      <div>
        <div className="thunder-section-header">
          <span>RESPONSE</span>
          <div className="flex gap-2">
            <button className="thunder-text-xs px-2 py-1 rounded hover:bg-gray-200">
              CLEAR
            </button>
            <button className="thunder-text-xs px-2 py-1 rounded hover:bg-gray-200">
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
                <div className="thunder-status-dot"></div>
                <span>AI가 응답을 생성하고 있습니다...</span>
              </div>
            </div>
          ) : response ? (
            <div className="thunder-card">
              <div className="thunder-card-header">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 text-xs bg-green-500 text-white rounded">
                      200 OK
                    </span>
                    <span className="thunder-text-xs thunder-text-secondary">
                      {Math.floor(Math.random() * 500 + 100)}ms
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button className="thunder-btn thunder-btn-secondary text-xs">
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
                  The response will appear here in Thunder Client style.
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
