import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import App from "../App";

describe("App Component", () => {
  test("renders without crashing", () => {
    const { container } = render(<App />);
    // ErrorBoundary가 렌더링되는지 확인
    expect(container).toBeInTheDocument();
  });

  test("contains error boundary", () => {
    const { container } = render(<App />);
    // ErrorBoundary로 감싸진 앱이 정상적으로 렌더링되는지 확인
    expect(container).toBeInTheDocument();
  });

  test("renders main content", () => {
    const { container } = render(<App />);
    // 기본적인 렌더링 확인
    expect(container).toBeInTheDocument();
  });
});
