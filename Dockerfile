# 1단계: 리액트 프론트엔드를 정적 파일(HTML/JS)로 빌드합니다.
FROM node:20-alpine AS build-stage
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# 2단계: 백엔드와 Nginx를 하나의 컨테이너로 합칩니다. (Production 환경)
FROM node:20-alpine

# Nginx 설치
RUN apk add --no-cache nginx

# 백엔드 파일 세팅
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./

# 1단계에서 완성된 리액트 화면을 Nginx 서빙 폴더로 가져옵니다.
COPY --from=build-stage /app/frontend/dist /usr/share/nginx/html

# Nginx 설정 파일 덮어쓰기
COPY nginx/default.conf /etc/nginx/http.d/default.conf

# 동시 실행 스크립트 복사 및 권한 부여
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Render는 기본적으로 80번 포트를 바라봅니다.
EXPOSE 80

# 스크립트 실행!
CMD ["/start.sh"]