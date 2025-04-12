import { UserModel } from "../models";
import { ServiceResponse, UserDocument, SessionUser } from "../types";
import bcrypt from "bcrypt";
import config from "../config";
import mongoose from "mongoose";

interface JoinUserData {
  email: string;
  nick: string;
  password: string;
  money: number;
}

/**
 * 사용자 회원가입 서비스
 * @param userData 사용자 데이터
 */
export const joinUser = async (
  userData: JoinUserData,
): Promise<ServiceResponse<UserDocument>> => {
  try {
    // 필수 필드 확인
    if (!userData.email || !userData.nick || !userData.password) {
      return {
        success: false,
        error: "필수 필드가 누락되었습니다",
      };
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      return {
        success: false,
        error: "유효하지 않은 이메일 형식입니다",
      };
    }

    // 닉네임 길이 검증
    if (userData.nick.length < 2 || userData.nick.length > 20) {
      return {
        success: false,
        error: "닉네임은 2~20자 사이여야 합니다",
      };
    }

    // 비밀번호 길이 검증
    if (userData.password.length < 4) {
      return {
        success: false,
        error: "비밀번호는 최소 4자 이상이어야 합니다",
      };
    }

    // 이메일 중복 확인
    const existingUser = await UserModel.findOne({ email: userData.email });
    if (existingUser) {
      return {
        success: false,
        error: "이미 사용 중인 이메일입니다",
      };
    }

    // 자산 금액 유효성 검사
    const money = Number(userData.money);
    if (isNaN(money) || money < 0) {
      return {
        success: false,
        error: "보유 자산은 0 이상의 숫자여야 합니다",
      };
    }

    // 새 사용자 생성
    const user = new UserModel({
      email: userData.email,
      nick: userData.nick,
      password: userData.password,
      money: money,
    });

    await user.save();

    return {
      success: true,
      data: user,
    };
  } catch (error) {
    console.error("회원가입 오류", error);
    return {
      success: false,
      error: `회원가입 중 오류 발생: ${(error as Error).message}`,
    };
  }
};

/**
 * 사용자 로그인 서비스
 * @param email 이메일
 * @param password 비밀번호
 */
export const loginUser = async (
  email: string,
  password: string,
): Promise<ServiceResponse<SessionUser>> => {
  try {
    // 이메일로 사용자 찾기
    const user = await UserModel.findOne({ email });
    if (!user) {
      return {
        success: false,
        error: "존재하지 않는 이메일입니다",
      };
    }

    // 비밀번호 비교
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return {
        success: false,
        error: "비밀번호가 일치하지 않습니다",
      };
    }

    // 세션 데이터 생성 (타입 안전성 보장)
    const sessionUser: SessionUser = {
      id: user._id.toString(),
      email: user.email,
      nick: user.nick,
      money: user.money,
    };

    return {
      success: true,
      data: sessionUser,
    };
  } catch (error) {
    console.error("로그인 오류", error);
    return {
      success: false,
      error: `로그인 중 오류 발생: ${(error as Error).message}`,
    };
  }
};

/**
 * 사용자 정보 조회 서비스
 * @param userId 사용자 ID
 */
export const getUserById = async (
  userId: string,
): Promise<ServiceResponse<UserDocument>> => {
  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      return {
        success: false,
        error: "존재하지 않는 사용자입니다",
      };
    }

    return {
      success: true,
      data: user,
    };
  } catch (error) {
    console.error("사용자 조회 오류", error);
    return {
      success: false,
      error: `사용자 조회 중 오류 발생: ${(error as Error).message}`,
    };
  }
};
