import React, { useState, useRef, useEffect } from "react";
import {
  useLazyImage,
  useIntersectionObserver,
} from "../../hooks/usePerformanceOptimization";

interface LazyImageProps {
  src: string;
  alt: string;
  placeholder?: string;
  className?: string;
  width?: number;
  height?: number;
  onLoad?: () => void;
  onError?: () => void;
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  placeholder = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHZpZXdCb3g9IjAgMCAxMCAxMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjRjNGNEY2Ii8+Cjwvc3ZnPgo=",
  className = "",
  width,
  height,
  onLoad,
  onError,
}) => {
  const [isInView, setIsInView] = useState(false);
  const [imageStatus, setImageStatus] = useState<
    "loading" | "loaded" | "error"
  >("loading");
  const imgRef = useRef<HTMLImageElement>(null);
  const { setElement, observe } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: "50px",
  });

  // 이미지 요소 참조 설정
  useEffect(() => {
    if (imgRef.current) {
      setElement(imgRef.current);
    }
  }, [setElement]);

  // 인터섹션 옵저버로 뷰포트 진입 감지
  useEffect(() => {
    const unobserve = observe((isIntersecting) => {
      if (isIntersecting && !isInView) {
        setIsInView(true);
      }
    });

    return unobserve;
  }, [observe, isInView]);

  // 이미지 로드 핸들러
  const handleImageLoad = () => {
    setImageStatus("loaded");
    onLoad?.();
  };

  // 이미지 에러 핸들러
  const handleImageError = () => {
    setImageStatus("error");
    onError?.();
  };

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ width, height }}
    >
      {/* 로딩 스켈레톤 */}
      {imageStatus === "loading" && (
        <div
          className="absolute inset-0 bg-gray-200 animate-pulse rounded"
          style={{ width, height }}
        />
      )}

      {/* 실제 이미지 */}
      <img
        ref={imgRef}
        src={isInView ? src : placeholder}
        alt={alt}
        className={`transition-opacity duration-300 ${
          imageStatus === "loaded" ? "opacity-100" : "opacity-0"
        } ${className}`}
        style={{ width, height }}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading="lazy"
      />

      {/* 에러 상태 표시 */}
      {imageStatus === "error" && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400 rounded"
          style={{ width, height }}
        >
          <svg
            className="w-8 h-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
      )}
    </div>
  );
};

export default LazyImage;
