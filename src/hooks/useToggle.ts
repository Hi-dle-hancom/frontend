import { useState, useCallback } from "react";

/**
 * useToggle 훅 - 불리언 상태를 토글하는 유틸리티 훅
 * @param initialState 초기 상태 값 (기본값: false)
 * @returns 상태 값과 토글 함수가 포함된 배열
 */
function useToggle(initialState: boolean = false): [boolean, () => void] {
  const [state, setState] = useState<boolean>(initialState);

  const toggle = useCallback(() => {
    setState((prevState: boolean) => !prevState);
  }, []);

  return [state, toggle];
}

export default useToggle;
