const SocketIO = require("socket.io");
const { checkAuctionStatus } = require("./services");

module.exports = (server, app, sessionMiddleware) => {
  const io = SocketIO(server, { path: "/socket.io" });
  app.set("io", io);

  // 소켓 미들웨어 (세션 연결)
  const wrap = (middleware) => (socket, next) =>
    middleware(socket.request, {}, next);
  io.use(wrap(sessionMiddleware));

  // 네임스페이스 설정
  const auction = io.of("/auction");

  auction.on("connection", (socket) => {
    console.log("auction 네임스페이스에 접속");

    // 방 입장
    socket.on("join", (data) => {
      socket.join(data);
      console.log(
        `${
          socket.request.session.user?.nick || "Someone"
        }님이 ${data} 경매에 참여`
      );
      socket.to(data).emit("join", {
        user: "system",
        chat: `${
          socket.request.session.user?.nick || "Someone"
        }님이 입장하셨습니다.`,
      });
    });

    // 방 나가기
    socket.on("leave", (data) => {
      socket.leave(data);
      console.log(
        `${
          socket.request.session.user?.nick || "Someone"
        }님이 ${data} 경매에서 나감`
      );
      socket.to(data).emit("leave", {
        user: "system",
        chat: `${
          socket.request.session.user?.nick || "Someone"
        }님이 퇴장하셨습니다.`,
      });
    });

    // 연결 종료
    socket.on("disconnect", () => {
      console.log("auction 네임스페이스 접속 해제");
    });
  });

  // 경매 상태 주기적으로 체크 (10초마다)
  setInterval(() => {
    checkAuctionStatus();
  }, 10000);
};
