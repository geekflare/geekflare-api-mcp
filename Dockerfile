FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY build/ ./build/

ENV MCP_TRANSPORT=""
ENV API_KEY=""
ENV API_BASE_URL="https://api.geekflare.com"
ENV PORT="3000"

EXPOSE 3000

ENTRYPOINT ["node", "build/index.js"]