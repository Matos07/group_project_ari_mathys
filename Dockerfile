# ==============================================================================
# Unified Production Multi-stage Dockerfile for Money & Expense Logger
# ==============================================================================
# Stage 1: Build Application (TypeScript compile + Prisma client generation)
# ==============================================================================
FROM node:24-alpine AS builder
WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY prisma ./prisma/
RUN npx prisma generate

COPY src ./src/
RUN npm run build
RUN npm prune --production

# ==============================================================================
# Stage 2: Production Runtime Image (Minimal Alpine image serving on $PORT)
# ==============================================================================
FROM node:24-alpine AS production
WORKDIR /app

RUN apk add --no-cache openssl tzdata

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

ENV NODE_ENV=production
ENV TZ=Asia/Bangkok
ENV PORT=3000
EXPOSE 3000

# Run as unprivileged user per security best practices
USER node

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]
