import { Request, Response, NextFunction } from "express";
import { joinUser, loginUser } from "../services";
import { AuthRequest } from "../types";

/**
 * 회원가입 컨트롤러
 */
export const join = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, nick, password, money } = req.body;

    // 서비스 레이어를 통해 회원가입 처리
    const result = await joinUser({
      email,
      nick,
      password,
      money: parseInt(money, 10) || 0,
    });

    if (!result.success) {
      return res.redirect(
        `/join?error=${encodeURIComponent(result.error || "join_error")}`,
      );
    }

    return res.redirect("/");
  } catch (error) {
    console.error("회원가입 컨트롤러 오류:", error);
    return next(error);
  }
};

/**
 * 로그인 컨트롤러
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, password } = req.body;

    // 서비스 레이어를 통해 로그인 처리
    const result = await loginUser(email, password);

    if (!result.success) {
      return res.redirect(
        `/?loginError=${encodeURIComponent(result.error || "로그인 오류")}`,
      );
    }

    // 세션에 사용자 정보 저장
    (req as AuthRequest).session.user = result.data;

    return res.redirect("/");
  } catch (error) {
    console.error("로그인 컨트롤러 오류:", error);
    return next(error);
  }
};

/**
 * 로그아웃 컨트롤러
 */
export const logout = (req: Request, res: Response) => {
  // 세션 삭제
  req.session.destroy((err) => {
    if (err) {
      console.error("로그아웃 중 오류 발생:", err);
    }
    res.redirect("/");
  });
};
