FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY build/ ./build/

ENV API_KEY=""
ENV API_BASE_URL="https://api.geekflare.com"

ENTRYPOINT ["node", "build/index.js"]