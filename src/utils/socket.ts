import { Server } from "socket.io";
import express from "express";
import http from "http";
import { checkAuctionStatus } from "../services";
import config from "../config";

/**
 * 소켓 서버 초기화 및 이벤트 설정
 * @param server HTTP 서버
 * @param app Express 애플리케이션
 * @param sessionMiddleware 세션 미들웨어
 */
export const initializeSocketServer = (
  server: http.Server,
  app: express.Application,
  sessionMiddleware: express.RequestHandler,
): void => {
  const io = new Server(server, { path: config.socket.path });

  // app에 io 인스턴스 저장
  app.set("io", io);

  // 세션 미들웨어를 소켓에 연결
  const wrap =
    (middleware: express.RequestHandler) => (socket: any, next: any) =>
      middleware(socket.request, {}, next);
  io.use(wrap(sessionMiddleware));

  // 경매 네임스페이스 설정
  const auction = io.of("/auction");

  // 경매 네임스페이스 연결 이벤트
  auction.on("connection", (socket) => {
    console.log("auction 네임스페이스에 접속");

    // 방 입장 이벤트
    socket.on("join", (data) => {
      socket.join(data);
      console.log(
        `${
          socket.request.session.user?.nick || "Someone"
        }님이 ${data} 경매에 참여`,
      );
      socket.to(data).emit("join", {
        user: "system",
        chat: `${
          socket.request.session.user?.nick || "Someone"
        }님이 입장하셨습니다.`,
      });
    });

    // 방 나가기 이벤트
    socket.on("leave", (data) => {
      socket.leave(data);
      console.log(
        `${
          socket.request.session.user?.nick || "Someone"
        }님이 ${data} 경매에서 나감`,
      );
      socket.to(data).emit("leave", {
        user: "system",
        chat: `${
          socket.request.session.user?.nick || "Someone"
        }님이 퇴장하셨습니다.`,
      });
    });

    // 연결 종료 이벤트
    socket.on("disconnect", () => {
      console.log("auction 네임스페이스 접속 해제");
    });
  });

  // 경매 상태 주기적으로 체크 (10초마다)
  setInterval(() => {
    checkAuctionStatus();
  }, 10000);
};
