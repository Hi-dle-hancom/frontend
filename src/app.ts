import express from 'express';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import nunjucks from 'nunjucks';
import path from 'path';
import http from 'http';
import { connectToMongoDB } from './models';
import indexRouter from './routes';
import { notFoundMiddleware, errorHandlerMiddleware, setUserToLocals } from './middlewares';
import { initializeSocketServer } from './utils/socket';
import config from './config';

// Express 앱 초기화
const app = express();

// 뷰 엔진 설정
app.set('view engine', 'html');
app.set('port', config.port);
app.set('trust proxy', 1);

// Nunjucks 설정
const env = nunjucks.configure(config.paths.views, {
  express: app,
  watch: true,
});

// 날짜 필터 추가
env.addFilter('date', function (date) {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  };
  return new Date(date).toLocaleString('ko-KR', options);
});

// 공통 미들웨어 설정
app.use(morgan('dev'));
app.use(express.static(config.paths.public));
app.use('/img', express.static(config.paths.uploads));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(config.cookieSecret));

// 세션 미들웨어 설정
const sessionMiddleware = session(config.sessionOptions);
app.use(sessionMiddleware);

// CORS 설정
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.header('Access-Control-Allow-Credentials', 'true');

  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// 로그인 유저 정보를 res.locals에 추가
app.use(setUserToLocals);

// 라우터 설정
app.use('/', indexRouter);

// 404 에러 처리
app.use(notFoundMiddleware);

// 에러 처리 미들웨어
app.use(errorHandlerMiddleware);

// 서버 시작 함수
const startServer = async (): Promise<void> => {
  try {
    // MongoDB 연결
    console.log('MongoDB 연결 시도 중...');
    const isConnected = await connectToMongoDB();

    if (!isConnected) {
      console.error('MongoDB 연결 실패로 애플리케이션을 종료합니다.');
      process.exit(1);
    }

    console.log('MongoDB 연결 성공!');

    // HTTP 서버 생성
    const server = http.createServer(app);

    // 소켓 서버 초기화
    initializeSocketServer(server, app, sessionMiddleware);

    // 서버 시작
    server.listen(app.get('port'), () => {
      console.log('서버가 시작되었습니다.');
      console.log(`서버 주소: http://${config.host}:${app.get('port')}`);
      console.log('환경:', config.nodeEnv);
    });
  } catch (err) {
    console.error('서버 시작 오류:', err);
    process.exit(1);
  }
};

// 서버 시작
startServer();

export default app;
