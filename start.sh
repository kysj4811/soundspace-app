#!/bin/sh

# 백엔드 서버를 백그라운드(&)로 실행합니다
cd /app/backend
node server.js &

# Nginx를 화면 앞(포그라운드)에서 실행합니다
nginx -g 'daemon off;'