# HAPA React Landing Page Multi-stage Dockerfile

# 개발환경 스테이지
FROM node:18-alpine AS development

WORKDIR /app

# 패키지 파일들을 먼저 복사하여 레이어 캐싱 최적화
COPY package*.json ./

# 의존성 설치
RUN npm ci

# 소스 코드 복사
COPY . .

# 개발 서버 실행
EXPOSE 3000
CMD ["npm", "start"]

# 빌드 스테이지
FROM node:18-alpine AS build

WORKDIR /app

# 패키지 파일들 복사
COPY package*.json ./

# 의존성 설치 (개발 의존성 포함)
RUN npm ci

# 소스 코드 복사
COPY . .

# 프로덕션 빌드
RUN npm run build

# 프로덕션 스테이지
FROM nginx:alpine AS production

# 기본 nginx 설정 제거
RUN rm -rf /usr/share/nginx/html/*

# 빌드된 파일들을 nginx 서빙 디렉토리에 복사
COPY --from=build /app/build /usr/share/nginx/html

# Custom nginx 설정 파일 복사
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 포트 노출
EXPOSE 80

# nginx 실행
CMD ["nginx", "-g", "daemon off;"] 