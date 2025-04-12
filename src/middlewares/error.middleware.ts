import { Request, Response, NextFunction } from "express";
import config from "../config";

/**
 * 404 Not Found 에러 처리 미들웨어
 */
export const notFoundMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.log(`404 에러 발생: ${req.method} ${req.url}`);
  const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
  (error as any).status = 404;
  next(error);
};

/**
 * 에러 처리 미들웨어
 */
export const errorHandlerMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.error("에러 발생:", err);

  // 개발 환경에서는 자세한 오류 정보 제공, 운영 환경에서는 일반 메시지
  res.locals.message = err.message;
  res.locals.error = config.nodeEnv !== "production" ? err : {};

  // HTTP 상태 코드 설정
  const status = (err as any).status || 500;
  res.status(status);

  // 오류 페이지 렌더링
  res.render("error");
};
