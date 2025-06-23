import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { HomePage } from "../../../components/pages";

// Mock the logger utility
jest.mock("../../../utils/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe("HomePage Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders homepage without crashing", () => {
    render(<HomePage />);
    expect(screen.getByTestId("home-page")).toBeInTheDocument();
  });

  test("displays hero section with correct content", () => {
    render(<HomePage />);

    expect(screen.getByText("HAPA AI Assistant")).toBeInTheDocument();
    expect(screen.getByText(/차세대 AI 코딩 도구/i)).toBeInTheDocument();
    expect(
      screen.getByText(/VSCode Extension으로 제공하는/i)
    ).toBeInTheDocument();
  });

  test("renders main sections", () => {
    render(<HomePage />);

    expect(screen.getByText(/LIVE DEMO/i)).toBeInTheDocument();
    expect(screen.getByText(/⚡ 확장 프로그램 설치/i)).toBeInTheDocument();
    expect(screen.getByText(/📖 문서 보기/i)).toBeInTheDocument();
  });

  test("accessibility features work correctly", () => {
    render(<HomePage />);

    // ARIA labels과 landmarks 확인
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("banner")).toBeInTheDocument();
  });
});
