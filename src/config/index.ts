import dotenv from "dotenv";
import path from "path";

// .env 파일 로드
dotenv.config();

// 환경 변수 또는 기본값 설정
const config = {
  port: parseInt(process.env.PORT || "2000", 10),
  host: process.env.HOST || "localhost",
  cookieSecret: process.env.COOKIE_SECRET || "auctionsecret",
  mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/auction",
  mongoId: process.env.MONGO_ID,
  mongoPassword: process.env.MONGO_PASSWORD,
  nodeEnv: process.env.NODE_ENV || "development",
  sessionOptions: {
    resave: false,
    saveUninitialized: false,
    secret: process.env.COOKIE_SECRET || "auctionsecret",
    cookie: {
      httpOnly: true,
      secure: false,
      maxAge: 1000 * 60 * 60 * 24, // 1일
    },
    proxy: true,
  },
  paths: {
    public: path.join(__dirname, "../../public"),
    uploads: path.join(__dirname, "../../uploads"),
    views: path.join(__dirname, "../../views"),
  },
  socket: {
    path: "/socket.io",
  },
  upload: {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
  },
  bcrypt: {
    saltRounds: 12,
  },
};

export default config;
