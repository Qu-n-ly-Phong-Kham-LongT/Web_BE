# ===== Stage 0: deps (install all deps: dependencies + devDependencies) =====
FROM node:22-alpine AS deps
WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci


# ===== Stage 1: build =====
FROM node:22-alpine AS builder
WORKDIR /app

RUN apk add --no-cache openssl

# reuse node_modules from deps
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY . .

# generate Prisma Client + build
RUN npx prisma generate
RUN npm run build


# ===== Stage 2: runtime (dist + node_modules + prisma schema + templates) =====
FROM node:22-alpine AS runner
WORKDIR /app

RUN apk add --no-cache openssl

# create non-root user
RUN addgroup -S nodegrp && adduser -S nodeuser -G nodegrp

# copy minimal runtime artifacts
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# prisma schema (core/prisma/schema.prisma => /app/prisma/schema.prisma)
COPY --from=builder /app/prisma ./prisma

# templates (code reads from process.cwd()/src/templates/...)
COPY --from=builder /app/src/templates ./src/templates

# NOTE: vì bạn mount volume vào /app/public trên host,
# mkdir/chown /app/public/uploads trong image sẽ không có tác dụng.
# Chỉ chown /app để đảm bảo các path không mount vẫn thuộc nodeuser.
RUN chown -R nodeuser:nodegrp /app

USER nodeuser

CMD ["node", "dist/server.js"]
