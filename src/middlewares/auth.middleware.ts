import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../types";

/**
 * 로그인 상태 확인 미들웨어
 * 로그인한 사용자만 접근 가능
 */
export const isLoggedIn = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  if (req.session && req.session.user) {
    next();
  } else {
    res.status(403).redirect("/?loginError=로그인이 필요합니다");
  }
};

/**
 * 비로그인 상태 확인 미들웨어
 * 로그인하지 않은 사용자만 접근 가능
 */
export const isNotLoggedIn = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  if (!req.session.user) {
    next();
  } else {
    res.redirect("/");
  }
};

/**
 * 사용자 정보를 로컬 변수에 저장하는 미들웨어
 */
export const setUserToLocals = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  res.locals.user = req.session.user;
  next();
};
