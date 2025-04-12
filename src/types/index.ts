import { Document, Types } from "mongoose";
import { Request } from "express";

// MongoDB 문서 타입 정의
export interface UserDocument extends Document {
  email: string;
  nick: string;
  password: string;
  money: number;
  createdAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

export interface GoodDocument extends Document {
  name: string;
  img?: string;
  price: number;
  status: "SALE" | "SOLD" | "RESERVE";
  owner: Types.ObjectId | UserDocument;
  buyer?: Types.ObjectId | UserDocument;
  endTime: Date;
  createdAt: Date;
  deleted: boolean;
  deletedAt?: Date;
  // 가상 필드
  highestBid?: number;
  bidCount?: number;
  bid?: Array<{
    bid: number;
    msg?: string;
    user: { nick: string };
    createdAt: Date;
  }>;
}

export interface AuctionDocument extends Document {
  good: Types.ObjectId | GoodDocument;
  bidder: Types.ObjectId | UserDocument;
  bid: number;
  msg?: string;
  createdAt: Date;
}

// 세션 사용자 타입
export interface SessionUser {
  id: string;
  email: string;
  nick: string;
  money: number;
}

// 인증 요청 확장
export interface AuthRequest extends Request {
  session: {
    user?: SessionUser;
    [key: string]: any;
  };
  user?: SessionUser;
}

// 서비스 응답 타입
export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// 소켓 이벤트 타입
export interface BidEvent {
  bid: number;
  msg?: string;
  nick: string;
  date: Date;
}

export interface NewGoodEvent {
  good: GoodDocument;
}

export interface JoinLeaveEvent {
  user: string;
  chat: string;
}
