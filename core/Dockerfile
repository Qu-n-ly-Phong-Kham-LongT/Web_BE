# ===== Stage 1: build =====
FROM node:22-alpine AS builder
WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npx prisma generate
RUN npm run build


# ===== Stage 2: runtime =====
FROM node:22-alpine AS runner
WORKDIR /app

RUN apk add --no-cache openssl

# Tạo user thường để chạy app (UID/GID sẽ được Jenkins lấy ra để chown host)
RUN addgroup -S nodegrp && adduser -S nodeuser -G nodegrp

COPY package*.json ./
RUN npm install

# Copy code + dist
COPY . .
COPY --from=builder /app/dist ./dist

# Prisma client (nếu cần runtime generate; thường đã generate ở builder thì có thể bỏ)
RUN npx prisma generate

# Chown project cho nodeuser
RUN chown -R nodeuser:nodegrp /app

USER nodeuser

CMD ["node", "dist/server.js"]