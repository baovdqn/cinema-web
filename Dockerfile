# syntax=docker/dockerfile:1
# Các biến NEXT_PUBLIC_* và BACKEND_URL được "đóng" vào bản build (Next inline lúc build,
# rewrites cũng tính lúc build) => truyền bằng --build-arg, đổi giá trị phải build lại image.

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
ARG NEXT_PUBLIC_API_BASE_URL=/api
ARG NEXT_PUBLIC_API_MOCKING=disabled
ARG NEXT_PUBLIC_ASSET_BASE_URL=
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ARG BACKEND_URL=http://localhost:8080
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL \
    NEXT_PUBLIC_API_MOCKING=$NEXT_PUBLIC_API_MOCKING \
    NEXT_PUBLIC_ASSET_BASE_URL=$NEXT_PUBLIC_ASSET_BASE_URL \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    BACKEND_URL=$BACKEND_URL \
    NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs
COPY --from=build --chown=nextjs:nodejs /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
