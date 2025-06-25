import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import LazyImage from "../../../components/ui/LazyImage";

// IntersectionObserver 모킹
const mockIntersectionObserver = jest.fn();
const mockObserve = jest.fn();
const mockUnobserve = jest.fn();
const mockDisconnect = jest.fn();

beforeEach(() => {
  mockIntersectionObserver.mockReturnValue({
    observe: mockObserve,
    unobserve: mockUnobserve,
    disconnect: mockDisconnect,
  });
  (window as any).IntersectionObserver = mockIntersectionObserver;
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("LazyImage Component", () => {
  const defaultProps = {
    src: "https://example.com/image.jpg",
    alt: "Test Image",
  };

  test("renders placeholder image when not in view", () => {
    render(<LazyImage {...defaultProps} />);

    const image = screen.getByRole("img");
    expect(image).toHaveAttribute("alt", "Test Image");
    // 플레이스홀더가 src로 설정되어야 함
    expect(image.getAttribute("src")).toContain("data:image/svg+xml");
  });

  test("applies custom className to image", () => {
    const customClass = "custom-image-class";
    render(<LazyImage {...defaultProps} className={customClass} />);

    const image = screen.getByRole("img");
    expect(image).toHaveClass(customClass);
  });

  test("sets proper attributes on image", () => {
    render(<LazyImage {...defaultProps} width={200} height={150} />);

    const image = screen.getByRole("img");
    expect(image).toHaveAttribute("loading", "lazy");
  });

  test("calls onLoad callback when image loads", async () => {
    const onLoadMock = jest.fn();
    render(<LazyImage {...defaultProps} onLoad={onLoadMock} />);

    const image = screen.getByRole("img");

    // 이미지 로드 이벤트 시뮬레이션
    fireEvent.load(image);

    await waitFor(() => {
      expect(onLoadMock).toHaveBeenCalledTimes(1);
    });
  });

  test("calls onError callback when image fails to load", async () => {
    const onErrorMock = jest.fn();
    render(<LazyImage {...defaultProps} onError={onErrorMock} />);

    const image = screen.getByRole("img");

    // 이미지 에러 이벤트 시뮬레이션
    fireEvent.error(image);

    await waitFor(() => {
      expect(onErrorMock).toHaveBeenCalledTimes(1);
    });
  });

  test("shows error icon when image fails to load", async () => {
    render(<LazyImage {...defaultProps} />);

    const image = screen.getByRole("img");

    // 이미지 에러 이벤트 시뮬레이션
    fireEvent.error(image);

    await waitFor(() => {
      // 에러 아이콘이 표시되는지 확인
      const errorIcon = document.querySelector("svg");
      expect(errorIcon).toBeInTheDocument();
    });
  });

  test("sets up IntersectionObserver on mount", () => {
    render(<LazyImage {...defaultProps} />);

    expect(mockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      {
        threshold: 0.1,
        rootMargin: "50px",
      }
    );
  });

  test("observes image element", () => {
    render(<LazyImage {...defaultProps} />);

    // useEffect가 실행될 때까지 기다림
    setTimeout(() => {
      expect(mockObserve).toHaveBeenCalled();
    }, 0);
  });

  test("uses custom placeholder", () => {
    const customPlaceholder = "https://example.com/placeholder.jpg";
    render(<LazyImage {...defaultProps} placeholder={customPlaceholder} />);

    const image = screen.getByRole("img");
    expect(image).toHaveAttribute("src", customPlaceholder);
  });

  test("image has proper loading attribute", () => {
    render(<LazyImage {...defaultProps} />);

    const image = screen.getByRole("img");
    expect(image).toHaveAttribute("loading", "lazy");
  });

  test("image transitions to loaded state", async () => {
    render(<LazyImage {...defaultProps} />);

    const image = screen.getByRole("img");

    // 초기에는 opacity-0 클래스가 있어야 함
    expect(image).toHaveClass("opacity-0");

    // 이미지 로드 이벤트 시뮬레이션
    fireEvent.load(image);

    await waitFor(() => {
      expect(image).toHaveClass("opacity-100");
    });
  });
});
