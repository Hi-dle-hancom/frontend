# 메모 애플리케이션

간단한 메모 작성, 수정, 삭제 기능을 제공하는 웹 애플리케이션입니다.

## 기능

- 메모 작성 (제목, 내용)
- 메모 목록 조회
- 메모 수정
- 메모 삭제

## 기술 스택

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express
- Database: Amazon RDS (MySQL)

## 설치 및 실행 방법

1. 저장소 클론 또는 다운로드

```
git clone https://github.com/yourusername/memo-app.git
cd memo-app
```

2. 의존성 설치

```
npm install
```

3. 환경 변수 설정 (RDS 연결)

다음 환경 변수를 설정하거나 server.js에서 직접 값을 변경하세요:

```
RDS_HOSTNAME=your-rds-endpoint.rds.amazonaws.com
RDS_USERNAME=your-username
RDS_PASSWORD=your-password
RDS_DB_NAME=memodb
RDS_PORT=3306
```

4. 애플리케이션 실행

```
npm start
```

5. 브라우저에서 확인

```
http://localhost:3000
```

## 개발 모드 실행

```
npm run dev
```

## AWS RDS 설정 방법

1. AWS 콘솔에서 RDS 서비스로 이동
2. 'Create database' 선택
3. MySQL 엔진 선택
4. 필요한 설정 구성 (규모, 스토리지, 보안 그룹 등)
5. 데이터베이스 생성 완료 후 엔드포인트 정보 확인
6. 환경 변수 또는 server.js에 연결 정보 업데이트

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.
