const mongoose = require("mongoose");

const { NODE_ENV, MONGODB_URI } = process.env;
console.log("MongoDB URI:", MONGODB_URI);

const connect = async () => {
  if (NODE_ENV !== "production") {
    mongoose.set("debug", true);
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    console.log("몽고디비 연결 성공");

    console.log(
      "MongoDB 연결 상태:",
      mongoose.connection.readyState === 1 ? "활성화" : "비활성화"
    );

    return true;
  } catch (err) {
    console.error("몽고디비 연결 에러", err);
    return false;
  }
};

mongoose.connection.on("error", (error) => {
  console.error("몽고디비 연결 에러 발생:", error);
});

mongoose.connection.on("disconnected", () => {
  console.error("몽고디비 연결이 끊겼습니다. 연결을 재시도합니다.");
  setTimeout(() => {
    connect();
  }, 5000);
});

process.on("SIGINT", async () => {
  await mongoose.connection.close();
  console.log("몽고디비 연결이 종료되었습니다.");
  process.exit(0);
});

module.exports = connect;
