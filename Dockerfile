# ==========================
# Builder
# ==========================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# ==========================
# Runtime
# ==========================
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/build ./build

ENV MCP_TRANSPORT=""
ENV API_KEY=""
ENV API_BASE_URL="https://api.geekflare.com"
ENV PORT="3000"

EXPOSE 3000

CMD ["node", "build/index.js"]

LABEL io.modelcontextprotocol.server.name="com.geekflare/mcp"