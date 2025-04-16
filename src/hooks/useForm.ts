import { useState, useCallback } from "react";

interface FormState {
  [key: string]: string;
}

interface FormErrors {
  [key: string]: string;
}

interface UseFormReturn {
  values: FormState;
  errors: FormErrors;
  handleChange: (field: string, value: string) => void;
  setFieldError: (field: string, error: string) => void;
  resetForm: () => void;
  isValid: boolean;
}

/**
 * useForm 훅 - 폼 상태 관리를 위한 커스텀 훅
 * @param initialValues 초기 폼 값 객체
 * @returns 폼 상태와 관련 메서드들
 */
const useForm = (initialValues: FormState): UseFormReturn => {
  const [values, setValues] = useState<FormState>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});

  // 입력 필드 값 변경 핸들러
  const handleChange = useCallback(
    (field: string, value: string) => {
      setValues((prevValues: FormState) => ({
        ...prevValues,
        [field]: value,
      }));

      // 값이 입력되면 해당 필드의 에러 메시지 제거
      if (errors[field]) {
        setErrors((prevErrors: FormErrors) => {
          const newErrors = { ...prevErrors };
          delete newErrors[field];
          return newErrors;
        });
      }
    },
    [errors]
  );

  // 필드 에러 설정 메서드
  const setFieldError = useCallback((field: string, error: string) => {
    setErrors((prevErrors: FormErrors) => ({
      ...prevErrors,
      [field]: error,
    }));
  }, []);

  // 폼 초기화 메서드
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
  }, [initialValues]);

  // 폼 유효성 여부 (에러가 없으면 true)
  const isValid = Object.keys(errors).length === 0;

  return {
    values,
    errors,
    handleChange,
    setFieldError,
    resetForm,
    isValid,
  };
};

export default useForm;
